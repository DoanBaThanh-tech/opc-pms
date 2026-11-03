import { env } from '@/core/config/env'
import { uploadImage, type MediaRef } from './cloudMedia'

/**
 * Ảnh Cloudinary dùng trong màn hình quản lý ảnh bao bì.
 * `publicId` là khóa bền vững để sau này backend xóa/đổi ảnh trên Cloudinary.
 * Database chỉ nên lưu `publicId`, `url`, `fileName` và metadata cần hiển thị.
 */
export interface CloudinaryImage extends MediaRef {
  publicId: string
  /** Thời điểm ảnh được tải lên (Cloudinary created_at hoặc thời điểm mock). */
  uploadDate: string
  status: 'uploading' | 'uploaded' | 'failed'
}

export interface CloudinaryUploadContext {
  productId?: number
  versionId?: number
  specId?: string
}

/**
 * Cấu hình Cloudinary Unsigned Upload.
 * Đặt trong .env:
 *   VITE_CLOUDINARY_CLOUD_NAME=your-cloud
 *   VITE_CLOUDINARY_UPLOAD_PRESET=opc_pms_unsigned
 *   VITE_CLOUDINARY_FOLDER=opc-pms/packaging
 *
 * Lưu ý bảo mật: chỉ dùng unsigned preset ở client. Không đưa API secret vào VITE_*.
 * TODO (Backend): khi có BE, nên chuyển sang upload qua endpoint BE ký sẵn (signed upload)
 * để kiểm soát loại file, kích thước, thư mục và quyền xóa.
 */
export const CLOUDINARY_CONFIG = {
  cloudName: env.cloudinaryCloudName,
  uploadPreset: env.cloudinaryUploadPreset,
  folder: env.cloudinaryFolder,
  uploadUrl: env.cloudinaryCloudName
    ? `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`
    : '',
} as const

export function isCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset)
}

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url?: string
  width?: number
  height?: number
  format?: string
  bytes?: number
  created_at?: string
  original_filename?: string
  error?: { message?: string }
}

/**
 * Tải ảnh trực tiếp từ client lên Cloudinary bằng Unsigned Upload Preset.
 *
 * Nếu chưa cấu hình Cloudinary, hàm tự chuyển sang mock IndexedDB của dự án
 * để màn hình vẫn chạy được khi chỉ có frontend.
 *
 * TODO (Backend/Database): sau khi upload thành công, component sẽ gọi callback
 * `onChange`; tại đó cần PUT danh sách ảnh xuống API, ví dụ:
 *   PUT /api/products/{productId}/versions/{versionId}/packaging-specs
 *   body: { specId, images: [{ publicId, url, fileName, width, height, format, bytes }] }
 * Không lưu file binary vào database; chỉ lưu publicId/url/metadata.
 */
export async function uploadToCloudinary(
  file: File,
  _context?: CloudinaryUploadContext,
): Promise<CloudinaryImage> {
  const uploadedAt = new Date().toISOString()

  if (!isCloudinaryConfigured()) {
    // Mock frontend: dùng IndexedDB sẵn có, không gọi mạng.
    const ref = await uploadImage(file)
    return {
      ...ref,
      publicId: `mock/${ref.id}`,
      uploadDate: uploadedAt,
      status: 'uploaded',
    }
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
  if (CLOUDINARY_CONFIG.folder) form.append('folder', CLOUDINARY_CONFIG.folder)
  form.append('tags', 'opc-pms,packaging')

  const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, { method: 'POST', body: form })
  const data = await response.json().catch(() => null) as CloudinaryUploadResponse | null
  if (!response.ok || !data?.public_id) {
    throw new Error(data?.error?.message || 'Cloudinary không nhận ảnh. Vui lòng kiểm tra upload preset.')
  }

  return {
    id: data.public_id,
    provider: 'cloudinary',
    url: data.secure_url || data.url,
    publicId: data.public_id,
    fileName: file.name,
    contentType: data.format ? `image/${data.format}` : file.type,
    sizeBytes: data.bytes ?? file.size,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
    updatedAt: uploadedAt,
    uploadDate: data.created_at ?? uploadedAt,
    status: 'uploaded',
  }
}

/**
 * Xóa ảnh khỏi Cloudinary.
 *
 * Cloudinary Unsigned Upload không cho phép xóa trực tiếp từ client bằng publicId.
 * Vì vậy hiện tại chỉ xóa khỏi React State (theo yêu cầu frontend-only).
 *
 * TODO (Backend/Database):
 *  - Tạo endpoint DELETE /api/media/{publicId} (BE dùng API Key/Secret hoặc signed request).
 *  - Sau khi xóa Cloudinary thành công, xóa metadata ảnh khỏi DB.
 *  - Không gọi trực tiếp API xóa Cloudinary từ browser vì sẽ lộ secret.
 */
export async function deleteCloudinaryImage(image: CloudinaryImage): Promise<void> {
  // TODO (Backend): thay console bằng fetch(`${env.apiBaseUrl}/media/${encodeURIComponent(image.publicId)}`, { method: 'DELETE' })
  console.info('[Cloudinary] Ảnh đã được xóa khỏi UI. Cần gọi backend để xóa publicId:', image.publicId)
}

/** Chuẩn hóa MediaRef cũ (chưa có publicId/status) sang CloudinaryImage để dùng trong component. */
export function toCloudinaryImage(media: MediaRef): CloudinaryImage {
  return {
    ...media,
    publicId: media.publicId ?? media.id,
    uploadDate: media.updatedAt,
    status: media.status ?? 'uploaded',
  }
}
