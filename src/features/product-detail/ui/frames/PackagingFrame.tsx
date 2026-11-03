import { useEffect, useRef, useState } from 'react'
import { Boxes, Download, Eye, FileText, Lock, Plus } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/components/Toast'
import type { CloudinaryImage } from '@/core/media/cloudinary'
import { CloudinaryImageManager } from '@/core/media/CloudinaryImageManager'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import type { Product } from '@/features/products/logic/types'
import { formatSize } from '../../logic/documents'
import { packagingPhotos, resolvePackagingSpecs } from '../../logic/packagingSpecs'
import { DOC_STATUS_META, type PackagingSpec, type ProductVersion, type VersionDocument } from '../../logic/types'
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

const LIFECYCLE: Record<ProductVersion['stage'], { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  current: { label: 'Đang lưu hành', tone: 'green' },
  coming_soon: { label: 'Coming Soon · Chờ duyệt', tone: 'amber' },
  archived: { label: 'Lưu trữ', tone: 'gray' },
}

export function PackagingFrame({ product, version, onView, onDownload, canEdit = true, onSaveSpecs }: Props) {
  const toast = useToast()
  const save = useSavePackagingSpecs(product.id)
  const specs = resolvePackagingSpecs(product, version)
  const editable = version.stage !== 'archived' && canEdit
  const [addOpen, setAddOpen] = useState(false)
  const specsRef = useRef<PackagingSpec[]>(specs)
  useEffect(() => { specsRef.current = specs }, [specs])

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

  /** Ảnh đầu tiên luôn được giữ ở `photo` để tương thích dữ liệu cũ và bản xuất hồ sơ. */
  const updatePhotos = (specId: string, photos: CloudinaryImage[]) => {
    const next = specsRef.current.map((spec) => (
      spec.id === specId ? { ...spec, photos, photo: photos[0] } : spec
    ))
    specsRef.current = next
    void commit(
      next,
      photos.length ? `Đã cập nhật ${photos.length} ảnh chụp thực tế` : 'Đã xóa toàn bộ ảnh chụp thực tế',
    )
  }

  const lifecycle = LIFECYCLE[version.stage]

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
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-brand-50/40 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Vòng đời</span>
        <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
        <span className="text-[11px] leading-relaxed text-muted">
          Ảnh bao bì được quản lý riêng theo từng quy cách đóng gói.
        </span>
      </div>

      <div className="space-y-3">
        {specs.map((spec, index) => (
          <SpecCard
            key={spec.id}
            spec={spec}
            index={index}
            product={product}
            version={version}
            editable={editable}
            onView={() => onView(spec.technicalDoc)}
            onDownload={() => onDownload(spec.technicalDoc)}
            onChangePhotos={(photos) => updatePhotos(spec.id, photos)}
          />
        ))}
      </div>

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
    </Frame>
  )
}

interface SpecCardProps {
  spec: PackagingSpec
  index: number
  product: Product
  version: ProductVersion
  editable: boolean
  onView: () => void
  onDownload: () => void
  onChangePhotos: (photos: CloudinaryImage[]) => void
}

function SpecCard({ spec, index, product, version, editable, onView, onDownload, onChangePhotos }: SpecCardProps) {
  const doc = spec.technicalDoc
  const status = DOC_STATUS_META[doc.status]
  const stt = String(index + 1).padStart(2, '0')
  const photos = packagingPhotos(spec)

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-start gap-3 border-b border-line/70 bg-linear-to-r from-brand-50/70 to-white px-3.5 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-xs font-extrabold text-white shadow-sm">{stt}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Quy cách {stt}</p>
          <h3 className="text-sm font-extrabold leading-snug text-brand-900">{spec.name}</h3>
          {spec.note && <p className="mt-0.5 text-[11px] text-muted">{spec.note}</p>}
        </div>
        <Badge tone={photos.length ? 'green' : 'gray'}>
          {photos.length ? `${photos.length} ảnh chụp` : 'Chưa có ảnh chụp'}
        </Badge>
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

        <div className="rounded-xl border border-line bg-white p-2.5">
          <CloudinaryImageManager
            images={photos}
            onChange={onChangePhotos}
            context={{ productId: product.id, versionId: version.id, specId: spec.id }}
            disabled={!editable}
            variant="compact"
            title="Ảnh chụp thực tế"
            hint="Kéo thả hoặc bấm để tải nhiều ảnh bao bì"
            maxFiles={8}
          />
        </div>
      </div>
    </article>
  )
}
