import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { useProducts } from '@/features/products/logic/useProducts'
import { useLookups } from '@/features/products/logic/useLookups'
import { downloadSingleDocument, downloadVersionDossier } from '../logic/downloadDossier'
import { buildDocuments, docsByGroup } from '../logic/documents'
import type { CreateVersionInput, ProductVersion, VersionDocument } from '../logic/types'
import { useActivateVersion, useCreateVersion, useProductVersions } from '../logic/useProductVersions'
import { getCurrentVersion, previousVersionOf, sortVersions, suggestNextVersionAfter } from '../logic/versionUtils'
import { CreateVersionModal } from './CreateVersionModal'
import { DetailHero } from './DetailHero'
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

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(Number.isFinite(productId) ? productId : 0)
  const lookups = useLookups()
  const createVersion = useCreateVersion(productId)
  const activateVersion = useActivateVersion(productId)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingActivate, setPendingActivate] = useState<ProductVersion | null>(null)
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

  const handleCreate = (input: CreateVersionInput) => {
    createVersion.mutate(input, {
      onSuccess: (created) => {
        toast.success(`Đã tạo phiên bản ${created.version} ở trạng thái Coming soon`)
        setCreateOpen(false)
        setSelectedId(created.id)
        setPreviewId(created.id)
      },
      onError: showError,
    })
  }

  const requestActivate = (version: ProductVersion) => {
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
        onSelect={setSelectedId}
        onCreate={() => setCreateOpen(true)}
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
            onPreview={(v) => setPreviewId(v.id)}
            onCreate={() => setCreateOpen(true)}
          />
        </aside>

        <div className="space-y-5 xl:col-start-1 xl:row-start-2">
          <LegalFrame version={selected} docs={docsByGroup(docs, 'legal')} onDownload={handleDownloadDoc} />
          <UsageFrame version={selected} previous={previous} docs={docsByGroup(docs, 'usage')} onDownload={handleDownloadDoc} />
          <PackagingFrame version={selected} docs={docsByGroup(docs, 'packaging')} onDownload={handleDownloadDoc} />
        </div>
      </div>

      <CreateVersionModal
        open={createOpen}
        base={current ?? selected}
        suggestedVersion={suggestNextVersionAfter(sorted)}
        loading={createVersion.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

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

      <ConfirmDialog
        open={!!pendingActivate}
        title="Đưa phiên bản vào sử dụng?"
        message={`Phiên bản ${pendingActivate?.version ?? ''} sẽ trở thành phiên bản hiện hành. Phiên bản đang áp dụng sẽ tự động chuyển sang trạng thái lưu trữ và không thể áp dụng lại.`}
        confirmText="Đưa vào sử dụng"
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
