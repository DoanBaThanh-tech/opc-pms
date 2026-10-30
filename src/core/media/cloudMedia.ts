import { endpoints } from '@/core/api/endpoints'
import { env } from '@/core/config/env'
import { fileToCompressedBlob } from '@/core/utils/image'

/**
 * Lớp lưu ảnh độc lập nhà cung cấp.
 * Database sản phẩm chỉ lưu `id` (và provider); nội dung ảnh nằm ở cloud storage.
 *
 * - mock: IndexedDB trên trình duyệt (mô phỏng cloud, không làm phình localStorage).
 * - http: BE C# nhận multipart và trả về id + URL (S3/Cloudinary/Azure do BE ký).
 * - cloudinary/s3/azure: dùng cùng adapter http để BE làm trung gian ký upload.
 */
export type MediaProvider = 'mock' | 'http' | 'cloudinary' | 's3' | 'azure'

export interface MediaRef {
  id: string
  provider: MediaProvider | string
  url?: string
  fileName: string
  contentType?: string
  sizeBytes?: number
  updatedAt: string
}

interface Adapter {
  upload(blob: Blob, fileName: string, contentType: string): Promise<MediaRef>
  resolve(ref: MediaRef): Promise<string | null>
  download(ref: MediaRef): Promise<Blob | null>
}

const DB_NAME = 'opc_cloud_media'
const STORE = 'files'
let dbPromise: Promise<IDBDatabase> | null = null
const urlCache = new Map<string, string>()

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Không mở được cloud media.'))
    })
  }
  return dbPromise
}

async function idbPut(record: { id: string; blob: Blob; fileName: string; contentType: string; size: number; createdAt: string }) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Không lưu được ảnh.'))
  })
}

async function idbGet(id: string) {
  const db = await openDb()
  return new Promise<{ id: string; blob: Blob; fileName: string; contentType: string; size: number } | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Không đọc được ảnh.'))
  })
}

const mockAdapter: Adapter = {
  async upload(blob, fileName, contentType) {
    const id = `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const updatedAt = new Date().toISOString()
    await idbPut({ id, blob, fileName, contentType, size: blob.size, createdAt: updatedAt })
    return { id, provider: 'mock', fileName, contentType, sizeBytes: blob.size, updatedAt }
  },
  async resolve(ref) {
    if (ref.url) return ref.url
    const cached = urlCache.get(ref.id)
    if (cached) return cached
    const record = await idbGet(ref.id)
    if (!record?.blob) return null
    const url = URL.createObjectURL(record.blob)
    urlCache.set(ref.id, url)
    return url
  },
  async download(ref) {
    const record = await idbGet(ref.id)
    return record?.blob ?? null
  },
}

function authHeaders() {
  const token = localStorage.getItem(env.tokenKey)
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

const httpAdapter: Adapter = {
  async upload(blob, fileName, contentType) {
    const form = new FormData()
    form.append('file', blob, fileName)
    const response = await fetch(`${env.apiBaseUrl}${endpoints.media}`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    if (!response.ok) throw new Error('Tải ảnh lên cloud thất bại.')
    const data = await response.json() as { id?: string; url?: string; data?: { id?: string; url?: string } }
    const payload = data.data ?? data
    if (!payload.id) throw new Error('Cloud không trả về mã ảnh.')
    return {
      id: payload.id,
      provider: env.mediaProvider,
      url: payload.url,
      fileName,
      contentType,
      sizeBytes: blob.size,
      updatedAt: new Date().toISOString(),
    }
  },
  async resolve(ref) {
    return ref.url ?? `${env.apiBaseUrl}${endpoints.media}/${ref.id}`
  },
  async download(ref) {
    const url = ref.url ?? `${env.apiBaseUrl}${endpoints.media}/${ref.id}`
    const response = await fetch(url, { headers: authHeaders() })
    return response.ok ? response.blob() : null
  },
}

function adapterFor(ref?: Pick<MediaRef, 'provider'>): Adapter {
  if (ref?.provider === 'mock') return mockAdapter
  return env.mediaProvider === 'mock' ? mockAdapter : httpAdapter
}

/** Nén ảnh và tải lên cloud; chỉ trả về tham chiếu để lưu xuống database. */
export async function uploadImage(file: File): Promise<MediaRef> {
  const blob = await fileToCompressedBlob(file)
  const contentType = blob.type || file.type || 'image/jpeg'
  return adapterFor().upload(blob, file.name, contentType)
}

/** URL hiển thị ảnh (object URL với mock, URL công khai/signed với cloud thật). */
export async function resolveMediaUrl(ref: MediaRef): Promise<string | null> {
  return adapterFor(ref).resolve(ref)
}

/** Tải nội dung ảnh để nhúng vào hồ sơ/ZIP. */
export async function getMediaBlob(ref: MediaRef): Promise<Blob | null> {
  return adapterFor(ref).download(ref)
}
