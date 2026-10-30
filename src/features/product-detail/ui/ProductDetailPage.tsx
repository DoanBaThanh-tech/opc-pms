import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useToast } from '@/core/components/Toast'
import { canEditPackaging } from '@/core/auth/roles'
import { useCurrentRole } from '@/core/auth/roleStore'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import { useProducts } from '@/features/products/logic/useProducts'
import { useLookups } from '@/features/products/logic/useLookups'
import { downloadSingleDocument, downloadVersionDossier } from '../logic/downloadDossier'
import { buildDocuments, docsByGroup } from '../logic/documents'
import type { ProductVersion, VersionDocument } from '../logic/types'
import { useActivateVersion, useProductVersions } from '../logic/useProductVersions'
import { getCurrentVersion, isVersionDue, previousVersionOf, sortVersions } from '../logic/versionUtils'
import { DetailHero } from './DetailHero'
import { DocumentViewerModal } from './DocumentViewerModal'
import { GeneralInfoCard } from './GeneralInfoCard'
import { LifecyclePanel } from './LifecyclePanel'
import { VersionNotice } from './VersionNotice'
import { VersionPreviewDrawer } from './VersionPreviewDrawer'
import { LegalFrame } from './frames/LegalFrame'
import { PackagingFrame } from './frames/PackagingFrame'
import { UsageFrame } from './frames/UsageFrame'

export default function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  const toast = useToast()
  const navigate = useNavigate()
  const role = useCurrentRole()

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(Number.isFinite(productId) ? productId : 0)
  const lookups = useLookups()
  const activateVersion = useActivateVersion(productId)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [pendingActivate, setPendingActivate] = useState<ProductVersion | null>(null)
  const [viewerDoc, setViewerDoc] = useState<VersionDocument | null>(null)
  const [downloading, setDownloading] = useState(false)

  const product = products.find((p) => p.id === productId)
  const sorted = useMemo(() => sortVersions(versions), [versions])
  const current = getCurrentVersion(sorted)
  const selected = sorted.find((v) => v.id === selectedId) ?? current ?? sorted[0]

  const previous = selected ? previousVersionOf(sorted, selected) : undefined
  const docs = useMemo(
    () => (product && selected ? buildDocuments(product, selected, previous?.version) : []),
    [product, selected, previous],
  )

  const previewVersion = sorted.find((v) => v.id === previewId) ?? null
  const previewPrevious = previewVersion ? previousVersionOf(sorted, previewVersion) : undefined
  const previewDocs = useMemo(
    () => (product && previewVersion ? buildDocuments(product, previewVersion, previewPrevious?.version) : []),
    [product, previewVersion, previewPrevious],
  )

  const dosageName = lookups.dosageName(selected?.dosageFormId ?? product?.dosageFormId ?? 0)
  const categoryName = lookups.categoryName(selected?.categoryId ?? product?.categoryId ?? 0)
  const names = { dosage: dosageName, category: categoryName }

  const showError = (e: unknown) => toast.error((e as ApiError).message)

  const handleDownloadVersion = async (version: ProductVersion | null, versionDocs: VersionDocument[], prev?: ProductVersion) => {
    if (!product || !version) return
    setDownloading(true)
    try {
      await downloadVersionDossier({ product, version, previous: prev, docs: versionDocs, versions: sorted, names })
      toast.success(`Đã tải toàn bộ hồ sơ phiên bản ${version.version}`)
    } catch {
      toast.error('Không thể tải hồ sơ, vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadDoc = async (doc: VersionDocument) => {
    if (!product || !selected) return
    try {
      await downloadSingleDocument({ product, version: selected, previous, docs, versions: sorted, names }, doc)
      toast.success(`Đã tải "${doc.name}"`)
    } catch {
      toast.error('Không thể tải tài liệu, vui lòng thử lại.')
    }
  }

  const handleCreateVersion = () => {
    navigate(`/products/${productId}/versions/new`)
  }

  const requestActivate = (version: ProductVersion) => {
    if (!isVersionDue(version)) {
      toast.info(`Chưa tới ngày áp dụng (${formatDate(version.effectiveDate)}). Chưa thể đưa phiên bản vào sử dụng.`)
      return
    }
    setPreviewId(null)
    setPendingActivate(version)
  }

  const confirmActivate = () => {
    if (!pendingActivate) return
    activateVersion.mutate(pendingActivate.id, {
      onSuccess: (activated) => {
        setSelectedId(activated.id)
        setPendingActivate(null)
        toast.success(`Đã đưa phiên bản ${activated.version} vào sử dụng`)
      },
      onError: showError,
    })
  }

  if (loadingProducts || (product && loadingVersions)) return <DetailSkeleton />

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-20 text-center">
        <PackageSearch className="size-12 text-brand-300" strokeWidth={1.5} />
        <h1 className="text-xl font-extrabold text-brand-900">Không tìm thấy sản phẩm</h1>
        <p className="max-w-sm text-sm text-muted">Sản phẩm không tồn tại hoặc đã bị xóa khỏi danh mục.</p>
        <Link to="/products"><Button variant="secondary" icon={<ArrowLeft className="size-4" />}>Về danh mục sản phẩm</Button></Link>
      </div>
    )
  }

  if (!selected) return <DetailSkeleton />

  return (
    <div className="space-y-5">
      <DetailHero
        key={selected.id}
        product={product}
        version={selected}
        versions={sorted}
        dosageName={dosageName}
        categoryName={categoryName}
        docsCount={docs.length}
        downloading={downloading}
        canCreate={role !== 'commercial'}
        onSelect={setSelectedId}
        onCreate={handleCreateVersion}
        onDownload={() => handleDownloadVersion(selected, docs, previous)}
      />

      <VersionNotice
        version={selected}
        current={current}
        onPreview={() => setPreviewId(selected.id)}
        onActivate={() => requestActivate(selected)}
        onBackToCurrent={() => current && setSelectedId(current.id)}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="xl:col-start-1 xl:row-start-1">
          <GeneralInfoCard version={selected} dosageName={dosageName} categoryName={categoryName} />
        </div>

        <aside className="xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
          <LifecyclePanel
            versions={sorted}
            selectedId={selected.id}
            canCreate={role !== 'commercial'}
            onPreview={(v) => setPreviewId(v.id)}
            onCreate={handleCreateVersion}
          />
        </aside>

        <div className="space-y-5 xl:col-start-1 xl:row-start-2">
          <LegalFrame version={selected} docs={docsByGroup(docs, 'legal')} onView={setViewerDoc} onDownload={handleDownloadDoc} />
          <UsageFrame version={selected} previous={previous} docs={docsByGroup(docs, 'usage').filter((d) => !d.shared)} onView={setViewerDoc} onDownload={handleDownloadDoc} />
          <PackagingFrame product={product} version={selected} canEdit={canEditPackaging(role)} onView={setViewerDoc} onDownload={handleDownloadDoc} />
        </div>
      </div>

      <VersionPreviewDrawer
        open={!!previewVersion}
        version={previewVersion}
        previous={previewPrevious}
        docs={previewDocs}
        downloading={downloading}
        onClose={() => setPreviewId(null)}
        onDownload={() => handleDownloadVersion(previewVersion, previewDocs, previewPrevious)}
        onActivate={() => previewVersion && requestActivate(previewVersion)}
      />

      <DocumentViewerModal
        open={!!viewerDoc}
        doc={viewerDoc}
        product={product}
        version={selected}
        names={names}
        onClose={() => setViewerDoc(null)}
        onDownload={handleDownloadDoc}
      />

      <ConfirmDialog
        open={!!pendingActivate}
        title="Cập nhật phiên bản mới"
        message={`Bạn có chắc chắn muốn cập nhật phiên bản mới không? Phiên bản ${pendingActivate?.version ?? ''} sẽ trở thành phiên bản hiện hành, phiên bản đang áp dụng tự động chuyển sang lưu trữ.`}
        confirmText="Cập nhật"
        confirmVariant="primary"
        loading={activateVersion.isPending}
        onConfirm={confirmActivate}
        onClose={() => setPendingActivate(null)}
      />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-64 rounded-[1.75rem]" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-5">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="skeleton h-80 rounded-3xl" />
        </div>
        <div className="skeleton h-[28rem] rounded-3xl" />
      </div>
    </div>
  )
}
