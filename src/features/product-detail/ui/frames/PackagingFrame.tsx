import { useRef, useState } from 'react'
import {
  Boxes, Camera, Download, Eye, FileText, ImageOff, ImagePlus, Loader2, Lock, Plus, Trash2,
} from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import { useToast } from '@/core/components/Toast'
import { uploadImage } from '@/core/media/cloudMedia'
import { MediaImage } from '@/core/media/MediaImage'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import type { Product } from '@/features/products/logic/types'
import { formatSize } from '../../logic/documents'
import { resolvePackagingSpecs } from '../../logic/packagingSpecs'
import { DOC_STATUS_META, type PackagingPhoto, type PackagingSpec, type ProductVersion, type VersionDocument } from '../../logic/types'
import { useSavePackagingSpecs } from '../../logic/useProductVersions'
import { AddPackagingSpecModal } from '../AddPackagingSpecModal'
import { Frame } from './Frame'

interface Props {
  product: Product
  version: ProductVersion
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
  /** Cho phép chỉnh sửa theo vai trò (mặc định true cho trang nháp). */
  canEdit?: boolean
  /** Dùng ở trang nháp: lưu quy cách vào state thay vì gọi API. */
  onSaveSpecs?: (specs: PackagingSpec[]) => Promise<void> | void
}

const nowIso = () => new Date().toISOString()

export function PackagingFrame({ product, version, onView, onDownload, canEdit = true, onSaveSpecs }: Props) {
  const toast = useToast()
  const save = useSavePackagingSpecs(product.id)
  const specs = resolvePackagingSpecs(product, version)
  const editable = version.stage !== 'archived' && canEdit
  const [addOpen, setAddOpen] = useState(false)
  const [preview, setPreview] = useState<PackagingPhoto | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingSpec = useRef<string | null>(null)

  const commit = async (
    next: PackagingSpec[],
    message: string,
    opts?: { onSuccess?: () => void; onError?: () => void },
  ) => {
    if (onSaveSpecs) {
      try {
        await onSaveSpecs(next)
        toast.success(message)
        opts?.onSuccess?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Không lưu được quy cách.')
        opts?.onError?.()
      }
      return
    }
    save.mutate({ versionId: version.id, specs: next }, {
      onSuccess: () => { toast.success(message); opts?.onSuccess?.() },
      onError: (e) => { toast.error((e as unknown as ApiError).message); opts?.onError?.() },
    })
  }

  const addSpec = (spec: PackagingSpec) =>
    void commit([...specs, spec], `Đã thêm quy cách "${spec.name}"`, { onSuccess: () => setAddOpen(false) })

  const pickPhoto = (specId: string) => {
    pendingSpec.current = specId
    fileRef.current?.click()
  }

  const handleFile = async (file?: File) => {
    const specId = pendingSpec.current
    if (!file || !specId) return
    setUploadingId(specId)
    try {
      const media = await uploadImage(file)
      const photo: PackagingPhoto = { ...media, fileName: file.name, updatedAt: media.updatedAt || nowIso() }
      const next = specs.map((s) => (s.id === specId ? { ...s, photo } : s))
      await commit(next, 'Đã cập nhật ảnh chụp thực tế', { onSuccess: () => setUploadingId(null), onError: () => setUploadingId(null) })
    } catch (e) {
      setUploadingId(null)
      toast.error(e instanceof Error ? e.message : 'Không đọc được ảnh.')
    }
  }

  const removePhoto = (spec: PackagingSpec) => {
    const next = specs.map((s) => (s.id === spec.id ? { ...s, photo: undefined } : s))
    void commit(next, `Đã xóa ảnh chụp của "${spec.name}"`)
  }

  return (
    <Frame
      icon={Boxes}
      title="Quản lý quy cách đóng gói & hồ sơ kỹ thuật"
      subtitle={`Quản lý ${specs.length} quy cách đóng gói · cập nhật ${formatDate(version.updatedAt)}`}
      actions={editable ? (
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
          Thêm quy cách mới
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
          <Lock className="size-3.5" /> Phiên bản chỉ xem
        </span>
      )}
    >
      <div className="space-y-3">
        {specs.map((spec, index) => (
          <SpecCard
            key={spec.id}
            spec={spec}
            index={index}
            editable={editable}
            uploading={uploadingId === spec.id}
            onView={() => onView(spec.technicalDoc)}
            onDownload={() => onDownload(spec.technicalDoc)}
            onPickPhoto={() => pickPhoto(spec.id)}
            onPreviewPhoto={() => spec.photo && setPreview(spec.photo)}
            onRemovePhoto={() => removePhoto(spec)}
          />
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = '' }}
      />

      {addOpen && (
        <AddPackagingSpecModal
          open
          product={product}
          version={version}
          specCount={specs.length}
          saving={save.isPending}
          onClose={() => setAddOpen(false)}
          onSubmit={addSpec}
        />
      )}

      <Modal
        open={!!preview}
        title={preview?.fileName ?? 'Ảnh chụp thực tế'}
        widthClass="md:max-w-3xl"
        onClose={() => setPreview(null)}
        footer={<Button variant="secondary" onClick={() => setPreview(null)}>Đóng</Button>}
      >
        {preview && (
          <>
            <MediaImage media={preview} alt={preview.fileName} className="max-h-[68dvh] w-full rounded-xl bg-brand-50 object-contain" />
            <p className="mt-2 text-xs text-muted">Cập nhật {formatDate(preview.updatedAt)} · Lưu cloud: <span className="font-mono">{preview.id}</span></p>
          </>
        )}
      </Modal>
    </Frame>
  )
}

interface SpecCardProps {
  spec: PackagingSpec
  index: number
  editable: boolean
  uploading: boolean
  onView: () => void
  onDownload: () => void
  onPickPhoto: () => void
  onPreviewPhoto: () => void
  onRemovePhoto: () => void
}

function SpecCard({ spec, index, editable, uploading, onView, onDownload, onPickPhoto, onPreviewPhoto, onRemovePhoto }: SpecCardProps) {
  const doc = spec.technicalDoc
  const status = DOC_STATUS_META[doc.status]
  const stt = String(index + 1).padStart(2, '0')

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-start gap-3 border-b border-line/70 bg-linear-to-r from-brand-50/70 to-white px-3.5 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-xs font-extrabold text-white shadow-sm">{stt}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Quy cách {stt}</p>
          <h3 className="text-sm font-extrabold leading-snug text-brand-900">{spec.name}</h3>
          {spec.note && <p className="mt-0.5 text-[11px] text-muted">{spec.note}</p>}
        </div>
        <Badge tone={spec.photo ? 'green' : 'gray'}>{spec.photo ? 'Đã có ảnh chụp' : 'Chưa có ảnh chụp'}</Badge>
      </header>

      <div className="grid gap-2.5 p-3 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-brand-100 bg-brand-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
              <FileText className="size-3.5" /> Hồ sơ kỹ thuật
            </p>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-brand-900">{doc.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted">
            <span className="font-mono">{doc.code}</span>
            <span aria-hidden>·</span>
            <span>{doc.pages} trang</span>
            <span aria-hidden>·</span>
            <span>{formatSize(doc.sizeKb)}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(doc.updatedAt)}</span>
          </p>
          <div className="mt-auto flex items-center gap-1.5 pt-3">
            <button onClick={onView} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 text-[11px] font-bold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50">
              <Eye className="size-3.5" /> Xem file
            </button>
            <button onClick={onDownload} title={`Tải ${doc.name}`} aria-label={`Tải ${doc.name}`} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-brand-600 hover:text-white">
              <Download className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-dashed border-line bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
              <Camera className="size-3.5 text-brand-500" /> Ảnh chụp thực tế
            </p>
            {spec.photo && (
              <button onClick={onPreviewPhoto} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline">
                <Eye className="size-3" /> Xem ảnh
              </button>
            )}
          </div>

          {spec.photo ? (
            <button onClick={onPreviewPhoto} className="group relative mt-2 block w-full overflow-hidden rounded-lg border border-line bg-brand-50">
              <MediaImage media={spec.photo} alt={spec.photo.fileName} className="h-32 w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-brand-900/45 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                <Eye className="size-4" /> Xem ảnh
              </span>
            </button>
          ) : (
            <div className="mt-2 flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-100 bg-brand-50/40 text-brand-400">
              <ImageOff className="size-6" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">Chưa có ảnh chụp</span>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
            {editable ? (
              <button
                onClick={onPickPhoto}
                disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 text-[11px] font-bold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                {uploading ? 'Đang lưu...' : spec.photo ? 'Thay ảnh' : 'Tải ảnh lên'}
              </button>
            ) : (
              <span className="text-[10px] text-muted">Ảnh chỉ xem</span>
            )}
            {editable && spec.photo && (
              <button onClick={onRemovePhoto} className="inline-flex items-center gap-1 text-[10px] font-bold text-opc-red hover:underline">
                <Trash2 className="size-3" /> Xóa ảnh
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
