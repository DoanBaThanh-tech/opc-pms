import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle, Camera, CheckCircle2, Copy, Eye, ImageOff, Loader2, RefreshCw, Trash2, UploadCloud,
} from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { Modal } from '@/core/components/Modal'
import { useToast } from '@/core/components/Toast'
import { cn, formatDate, formatDateTime } from '@/core/utils/format'
import { MediaImage } from './MediaImage'
import {
  deleteCloudinaryImage,
  isCloudinaryConfigured,
  toCloudinaryImage,
  uploadToCloudinary,
  type CloudinaryImage,
  type CloudinaryUploadContext,
} from './cloudinary'
import type { MediaRef } from './cloudMedia'

const DEFAULT_MAX_FILES = 12
const MAX_FILE_MB = 8
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type LifecycleTone = 'green' | 'amber' | 'gray' | 'blue'

export interface CloudinaryImageManagerProps {
  /** Danh sách ảnh đang lưu (DB chỉ giữ publicId/url/metadata, không giữ binary). */
  images: MediaRef[]
  /** Trả danh sách ảnh mới sau khi upload/xóa để trang cha lưu lại. */
  onChange: (images: CloudinaryImage[]) => void
  /** Bối cảnh upload – dùng để gắn tag/folder và nối backend sau này. */
  context?: CloudinaryUploadContext
  disabled?: boolean
  maxFiles?: number
  /** `compact` dùng bên trong thẻ quy cách đóng gói. */
  variant?: 'default' | 'compact'
  title?: string
  hint?: string
  lifecycle?: { label: string; tone?: LifecycleTone }
  className?: string
}

interface PendingUpload {
  tempId: string
  fileName: string
  status: 'uploading' | 'failed'
  previewUrl: string
  error?: string
}

/**
 * Component quản lý & tải ảnh lên Cloudinary (frontend-only).
 *
 * - Upload trực tiếp từ client bằng Unsigned Upload Preset.
 * - Khi chưa cấu hình Cloudinary, tự dùng mock IndexedDB của dự án.
 * - Ảnh upload xong được trả về qua `onChange`; trang cha giữ danh sách trong React State.
 *
 * TODO (Backend/Database):
 *  - Lưu `publicId`, `url`, `fileName`, `width`, `height`, `format`, `bytes` vào DB
 *    (tuyệt đối không lưu file binary).
 *  - Xóa ảnh phải gọi API backend để BE xóa trên Cloudinary bằng API Key/Secret.
 */
export function CloudinaryImageManager({
  images,
  onChange,
  context,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
  variant = 'default',
  title = 'Ảnh chụp thực tế',
  hint,
  lifecycle,
  className,
}: CloudinaryImageManagerProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const pendingRef = useRef<PendingUpload[]>([])
  const filesRef = useRef(new Map<string, File>())
  const [viewing, setViewing] = useState<CloudinaryImage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CloudinaryImage | null>(null)

  const uploaded = useMemo(() => images.map(toCloudinaryImage), [images])
  const uploadedRef = useRef<CloudinaryImage[]>(uploaded)
  useEffect(() => { uploadedRef.current = uploaded }, [uploaded])

  const total = uploaded.length + pending.filter((item) => item.status !== 'failed').length

  useEffect(() => () => {
    pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    filesRef.current.clear()
  }, [])

  const updatePending = (updater: (prev: PendingUpload[]) => PendingUpload[]) => {
    const next = updater(pendingRef.current)
    pendingRef.current = next
    setPending(next)
  }

  const startUpload = async (tempId: string, file: File) => {
    updatePending((prev) => prev.map((item) => (
      item.tempId === tempId ? { ...item, status: 'uploading', error: undefined } : item
    )))

    try {
      const image = await uploadToCloudinary(file, context)
      const pendingItem = pendingRef.current.find((item) => item.tempId === tempId)
      if (pendingItem) URL.revokeObjectURL(pendingItem.previewUrl)
      filesRef.current.delete(tempId)
      updatePending((prev) => prev.filter((item) => item.tempId !== tempId))

      const next = [...uploadedRef.current, image]
      uploadedRef.current = next

      // TODO (Backend/Database): gọi API cập nhật ảnh của quy cách, ví dụ:
      // PUT /api/products/{productId}/versions/{versionId}/packaging-specs
      // body: { specId, images: [{ publicId, url, fileName, width, height, format, bytes }] }
      onChange(next)
      toast.success(`Đã tải ảnh "${file.name}" lên Cloudinary.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tải ảnh thất bại.'
      updatePending((prev) => prev.map((item) => (
        item.tempId === tempId ? { ...item, status: 'failed', error: message } : item
      )))
      toast.error(message)
    }
  }

  const addFiles = (fileList: FileList | File[]) => {
    if (disabled) return
    const files = Array.from(fileList)
    if (!files.length) return

    let remaining = maxFiles - (uploadedRef.current.length + pendingRef.current.filter((item) => item.status !== 'failed').length)
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" không phải file ảnh.`)
        return
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" vượt quá ${MAX_FILE_MB} MB.`)
        return
      }
      if (remaining <= 0) {
        toast.info(`Mỗi quy cách tối đa ${maxFiles} ảnh.`)
        return
      }
      remaining -= 1

      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      filesRef.current.set(tempId, file)
      updatePending((prev) => [
        ...prev,
        {
          tempId,
          fileName: file.name,
          status: 'uploading',
          previewUrl: URL.createObjectURL(file),
        },
      ])
      void startUpload(tempId, file)
    })
  }

  const retryUpload = (item: PendingUpload) => {
    const file = filesRef.current.get(item.tempId)
    if (!file) {
      toast.error('Không còn file gốc để tải lại. Vui lòng chọn ảnh mới.')
      return
    }
    void startUpload(item.tempId, file)
  }

  const removePending = (item: PendingUpload) => {
    URL.revokeObjectURL(item.previewUrl)
    filesRef.current.delete(item.tempId)
    updatePending((prev) => prev.filter((entry) => entry.tempId !== item.tempId))
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const next = uploadedRef.current.filter((image) => image.id !== deleteTarget.id)
    uploadedRef.current = next
    onChange(next)
    // TODO (Backend/Database): thay no-op bằng API xóa; BE mới có quyền xóa Cloudinary.
    void deleteCloudinaryImage(deleteTarget)
    toast.success('Đã xóa ảnh khỏi quy cách đóng gói.')
    setDeleteTarget(null)
  }

  const copyPublicId = async (publicId: string) => {
    try {
      await navigator.clipboard.writeText(publicId)
      toast.success('Đã sao chép Public ID.')
    } catch {
      toast.error('Trình duyệt không cho phép sao chép tự động.')
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const compact = variant === 'compact'
  const cloudinaryReady = isCloudinaryConfigured()

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn(
            'grid shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700',
            compact ? 'size-7' : 'size-8',
          )}>
            <Camera className={compact ? 'size-3.5' : 'size-4'} />
          </span>
          <div className="min-w-0">
            <p className={cn('truncate font-bold text-brand-900', compact ? 'text-[11px]' : 'text-xs')}>{title}</p>
            {hint && <p className="truncate text-[10px] text-muted">{hint}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {lifecycle && <Badge tone={lifecycle.tone ?? 'blue'}>{lifecycle.label}</Badge>}
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">
            {total}/{maxFiles}
          </span>
        </div>
      </div>

      {!disabled && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Kéo thả hoặc bấm để chọn ảnh bao bì"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-center transition outline-none',
            compact ? 'px-2 py-3' : 'px-4 py-6',
            dragging
              ? 'border-brand-500 bg-brand-100/70 ring-4 ring-brand-100'
              : 'border-brand-200 bg-brand-50/40 hover:border-brand-300 hover:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-100',
          )}
        >
          <UploadCloud className={cn('text-brand-500', compact ? 'size-5' : 'size-7')} strokeWidth={1.7} />
          <p className={cn('font-bold text-brand-800', compact ? 'text-[10px]' : 'text-xs')}>
            Kéo thả ảnh vào đây hoặc <span className="text-brand-600 underline decoration-brand-300 underline-offset-2">bấm để chọn</span>
          </p>
          <p className="text-[9px] leading-relaxed text-muted">
            JPG, PNG, WEBP, GIF · tối đa {MAX_FILE_MB} MB/ảnh · {maxFiles} ảnh/quy cách
          </p>
          <p className="text-[9px] font-semibold text-brand-600/80">
            {cloudinaryReady ? 'Cloudinary · Unsigned Upload Preset' : 'Mock frontend · chưa cấu hình Cloudinary'}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {total === 0 && disabled ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-slate-50/60 py-6 text-muted">
          <ImageOff className="size-5" strokeWidth={1.6} />
          <span className="text-[11px] font-medium">Chưa có ảnh chụp thực tế</span>
        </div>
      ) : (
        <ul className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
          {uploaded.map((image) => (
            <li key={image.id} className="group relative overflow-hidden rounded-xl border border-line bg-white shadow-sm">
              <button type="button" onClick={() => setViewing(image)} className="block w-full" title="Xem chi tiết ảnh">
                <MediaImage
                  media={image}
                  alt={image.fileName}
                  className="aspect-[4/3] w-full bg-brand-50 object-cover transition duration-300 group-hover:scale-[1.04]"
                />
              </button>
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                <CheckCircle2 className="size-2.5" /> Đã tải lên
              </span>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold text-ink" title={image.fileName}>{image.fileName}</span>
                  <span className="block text-[9px] text-muted">
                    {formatDate(image.uploadDate)} · {image.provider === 'cloudinary' ? 'Cloudinary' : 'Cloud'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => setViewing(image)}
                    title="Xem chi tiết"
                    aria-label={`Xem chi tiết ${image.fileName}`}
                    className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-brand-600 hover:text-white"
                  >
                    <Eye className="size-3.5" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(image)}
                      title="Xóa ảnh"
                      aria-label={`Xóa ${image.fileName}`}
                      className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-opc-red hover:text-white"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </span>
              </div>
            </li>
          ))}

          {pending.map((item) => (
            <li key={item.tempId} className="relative overflow-hidden rounded-xl border border-dashed border-brand-200 bg-brand-50/30">
              <div className="relative aspect-[4/3]">
                <img src={item.previewUrl} alt={item.fileName} className="h-full w-full object-cover opacity-70" />
                <span className="absolute inset-0 grid place-items-center bg-white/60">
                  {item.status === 'uploading'
                    ? <Loader2 className="size-6 animate-spin text-brand-600" />
                    : <AlertCircle className="size-6 text-opc-red" />}
                </span>
                <span className={cn(
                  'absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-sm',
                  item.status === 'uploading' ? 'bg-brand-600/95' : 'bg-opc-red/95',
                )}>
                  {item.status === 'uploading' ? 'Đang tải lên' : 'Tải lỗi'}
                </span>
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-[10px] font-semibold text-ink" title={item.fileName}>{item.fileName}</p>
                {item.status === 'failed' ? (
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <button type="button" onClick={() => retryUpload(item)} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-brand-700 hover:underline">
                      <RefreshCw className="size-2.5" /> Thử lại
                    </button>
                    <button type="button" onClick={() => removePending(item)} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-opc-red hover:underline">
                      <Trash2 className="size-2.5" /> Bỏ
                    </button>
                  </div>
                ) : (
                  <p className="text-[9px] text-muted">Đang tải lên Cloudinary...</p>
                )}
                {item.error && <p className="mt-0.5 line-clamp-2 text-[9px] text-opc-red">{item.error}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {createPortal(
        <>
          <Modal
            open={!!viewing}
            title={viewing?.fileName ?? 'Chi tiết ảnh'}
            widthClass="md:max-w-2xl"
            onClose={() => setViewing(null)}
            footer={<Button variant="secondary" onClick={() => setViewing(null)}>Đóng</Button>}
          >
            {viewing && (
              <div className="space-y-4">
                <MediaImage
                  media={viewing}
                  alt={viewing.fileName}
                  className="max-h-[52dvh] w-full rounded-xl border border-line bg-brand-50 object-contain"
                />

                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Trạng thái</dt>
                    <dd className="mt-0.5 font-semibold text-emerald-700">Đã tải lên Cloudinary</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Nhà cung cấp</dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{viewing.provider === 'cloudinary' ? 'Cloudinary' : 'Mock cloud (IndexedDB)'}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Kích thước</dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">
                      {viewing.width && viewing.height ? `${viewing.width} × ${viewing.height} px` : '—'}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Dung lượng</dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{formatBytes(viewing.bytes ?? viewing.sizeBytes)}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Ngày tải lên</dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{formatDateTime(viewing.uploadDate)}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Định dạng</dt>
                    <dd className="mt-0.5 font-semibold uppercase text-brand-900">{viewing.format ?? '—'}</dd>
                  </div>
                </dl>

                <div className="rounded-xl border border-line bg-white px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Cloudinary Public ID</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-brand-50 px-2.5 py-1.5 font-mono text-[11px] text-brand-800" title={viewing.publicId}>
                      {viewing.publicId || '—'}
                    </code>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Copy className="size-3.5" />}
                      onClick={() => void copyPublicId(viewing.publicId)}
                      disabled={!viewing.publicId}
                    >
                      Sao chép
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                  <b className="text-brand-800">TODO (Backend/Database):</b> lưu <code>publicId</code>, <code>url</code> và metadata này vào
                  bảng ảnh quy cách. Không lưu file binary trong database; thao tác xóa cần gọi API backend để xóa trên Cloudinary.
                </div>
              </div>
            )}
          </Modal>

          <ConfirmDialog
            open={!!deleteTarget}
            title="Xóa ảnh chụp thực tế"
            message={`Ảnh "${deleteTarget?.fileName ?? ''}" sẽ bị xóa khỏi quy cách này. Khi nối backend, thao tác này cũng sẽ xóa publicId tương ứng trên Cloudinary.`}
            confirmText="Xóa ảnh"
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        </>,
        document.body,
      )}
    </div>
  )
}

function formatBytes(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
