import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CalendarCheck2, ClipboardCheck, Download, FileText, PackageSearch, RotateCcw, ShieldCheck, Stamp,
} from 'lucide-react'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import { useLookups } from '@/features/products/logic/useLookups'
import { useProducts } from '@/features/products/logic/useProducts'
import { ProductSearchBar } from '@/features/products/ui/ProductSearchBar'
import { downloadSingleDocument, downloadVersionDossier } from '../logic/downloadDossier'
import { buildDocuments, docsByGroup } from '../logic/documents'
import { STAGE_META, type ProductVersion, type UpdateVersionInfoInput, type VersionDocument } from '../logic/types'
import {
  useProductVersions, useSaveVersionDocs, useUpdateVersionInfo,
} from '../logic/useProductVersions'
import { previousVersionOf, sortVersions, versionEndDate } from '../logic/versionUtils'
import { DocumentViewerModal } from './DocumentViewerModal'
import { EditVersionInfoModal } from './EditVersionInfoModal'
import { GeneralInfoCard } from './GeneralInfoCard'
import { UploadDocumentModal, type UploadTarget } from './UploadDocumentModal'
import { LegalFrame } from './frames/LegalFrame'
import { PackagingFrame } from './frames/PackagingFrame'
import { SharedDocsFrame } from './frames/SharedDocsFrame'
import { UsageFrame } from './frames/UsageFrame'

const LEGAL_TARGET: UploadTarget = {
  group: 'legal',
  title: 'Thêm hồ sơ pháp lý/quyết định phê duyệt',
  description: 'Tài liệu pháp lý được gắn vào phiên bản đang cập nhật và xuất hiện trong hồ sơ pháp lý của phiên bản.',
}

const PROFESSIONAL_TARGET: UploadTarget = {
  group: 'professional',
  title: 'Tải lên hồ sơ chuyên môn',
  description: 'Hồ sơ chuyên môn dùng chung cho phiên bản: công thức, quy trình, tiêu chuẩn hoặc tài liệu tham chiếu.',
}

const SHARED_USAGE_TARGET: UploadTarget = {
  group: 'usage',
  shared: true,
  title: 'Tải lên HDSD dùng chung',
  description: 'Tờ hướng dẫn sử dụng dùng chung, không gắn với từng quy cách đóng gói cụ thể.',
}

export default function VersionWorkspacePage() {
  const { id, versionId } = useParams()
  const productId = Number(id)
  const numericVersionId = Number(versionId)
  const navigate = useNavigate()
  const toast = useToast()

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(productId)
  const lookups = useLookups()
  const updateInfo = useUpdateVersionInfo(productId)
  const saveDocs = useSaveVersionDocs(productId)

  const [editOpen, setEditOpen] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)
  const [viewerDoc, setViewerDoc] = useState<VersionDocument | null>(null)
  const [downloading, setDownloading] = useState(false)

  const product = products.find((p) => p.id === productId)
  const sorted = useMemo(() => sortVersions(versions), [versions])
  const version = sorted.find((v) => v.id === numericVersionId)
  const previous = version ? previousVersionOf(sorted, version) : undefined
  const docs = useMemo(
    () => (product && version ? buildDocuments(product, version, previous?.version) : []),
    [product, version, previous],
  )

  const dosageName = lookups.dosageName(version?.dosageFormId ?? 0)
  const categoryName = lookups.categoryName(version?.categoryId ?? 0)
  const names = { dosage: dosageName, category: categoryName }
  const readOnly = version?.stage === 'archived'
  const stageLabel = version ? (version.stage === 'coming_soon' ? 'Chờ duyệt' : STAGE_META[version.stage].label) : ''

  const fail = (e: unknown) => toast.error((e as unknown as ApiError).message)

  const openUpload = (target: UploadTarget) => setUploadTarget(target)

  const submitInfo = (input: UpdateVersionInfoInput) => {
    if (!version) return
    updateInfo.mutate({ versionId: version.id, input }, {
      onSuccess: (updated) => {
        setEditOpen(false)
        toast.success(`Đã cập nhật thông tin phiên bản ${updated.version}`)
      },
      onError: fail,
    })
  }

  const submitDoc = (doc: VersionDocument) => {
    if (!version) return
    const next = [...(version.extraDocs ?? []), doc]
    saveDocs.mutate({ versionId: version.id, docs: next }, {
      onSuccess: () => {
        setUploadTarget(null)
        toast.success(`Đã tải lên "${doc.name}"`)
      },
      onError: fail,
    })
  }

  const handleDownloadDoc = async (doc: VersionDocument) => {
    if (!product || !version) return
    try {
      await downloadSingleDocument({ product, version, previous, docs, versions: sorted, names }, doc)
      toast.success(`Đã tải "${doc.name}"`)
    } catch {
      toast.error('Không thể tải tài liệu, vui lòng thử lại.')
    }
  }

  const handleDownloadDossier = async () => {
    if (!product || !version) return
    setDownloading(true)
    try {
      await downloadVersionDossier({ product, version, previous, docs, versions: sorted, names })
      toast.success(`Đã tải toàn bộ hồ sơ phiên bản ${version.version}`)
    } catch {
      toast.error('Không thể tải hồ sơ, vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  const createNext = () => {
    navigate(`/products/${productId}/versions/new`)
  }

  if (loadingProducts || (product && loadingVersions)) return <WorkspaceSkeleton />

  if (!product) {
    return (
      <EmptyState
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm không tồn tại hoặc đã bị xóa khỏi danh mục."
        to="/products"
        label="Về danh mục sản phẩm"
      />
    )
  }

  if (!version) {
    return (
      <EmptyState
        title="Không tìm thấy phiên bản"
        description="Phiên bản không tồn tại hoặc đã bị xóa khỏi hồ sơ sản phẩm."
        to={`/products/${productId}`}
        label="Về chi tiết sản phẩm"
      />
    )
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 px-5 py-6 text-white shadow-pop sm:px-7 sm:py-7">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-cyan-200/15 blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-brand-100">
              <Link to="/products" className="inline-flex items-center gap-1.5 transition hover:text-white">
                <ArrowLeft className="size-3.5" /> Danh mục sản phẩm
              </Link>
              <span className="text-white/40">/</span>
              <Link to={`/products/${product.id}`} className="max-w-[16rem] truncate text-white/70 transition hover:text-white">{product.name}</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/70">Cập nhật phiên bản</span>
            </nav>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide ring-1 ring-white/20">{product.code}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20 ${version.stage === 'coming_soon' ? 'bg-amber-300/25 text-amber-50' : 'bg-white/15'}`}>
                {stageLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
                Phiên bản {version.version}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl xl:text-[2.15rem]">Cập nhật phiên bản sản phẩm</h1>
            <p className="mt-1 text-sm font-medium text-brand-100">{product.name}</p>

            <div className="mt-3 flex max-w-3xl items-start gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur">
              <FileText className="mt-0.5 size-4 shrink-0 text-brand-200" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-100/80">Hoạt chất & hàm lượng</p>
                <p className="mt-0.5 text-sm font-medium leading-relaxed text-white/95">{version.activeIngredients}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-brand-50">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><CalendarCheck2 className="size-3 text-brand-200" /> Bắt đầu {formatDate(version.effectiveDate)}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><CalendarCheck2 className="size-3 text-brand-200" /> Kết thúc {formatDate(versionEndDate(version)) || '—'}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><Stamp className="size-3 text-brand-200" /> {version.approvalNo}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><FileText className="size-3 text-brand-200" /> {docs.length} tài liệu</span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
            <Button variant="light" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`/products/${product.id}`)} className="whitespace-nowrap">
              Về chi tiết sản phẩm
            </Button>
            <Button variant="glass" icon={<Download className="size-4" />} loading={downloading} onClick={handleDownloadDossier} className="whitespace-nowrap">
              Tải hồ sơ
            </Button>
          </div>
        </div>
      </section>

      <ProductSearchBar className="rounded-2xl" onSelect={(p) => navigate(`/products/${p.id}`)} />

      {version.stage === 'coming_soon' ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-soft sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-white">
            <ClipboardCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">Phiên bản {version.version} · Chờ duyệt</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">
              Cập nhật thông tin, hồ sơ pháp lý, hồ sơ chuyên môn và quy cách đóng gói bên dưới. Phiên bản đã xuất hiện tại trang Phê duyệt sản phẩm.
            </p>
          </div>
          <Button size="sm" variant="secondary" icon={<ShieldCheck className="size-4" />} onClick={() => navigate('/approvals')} className="shrink-0 whitespace-nowrap">
            Xem phê duyệt
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-900">Phiên bản {version.version} · {stageLabel}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {readOnly ? 'Phiên bản lưu trữ chỉ được xem và tải hồ sơ, không thể chỉnh sửa.' : 'Các thay đổi được lưu trực tiếp vào hồ sơ phiên bản hiện hành.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="space-y-5">
          <GeneralInfoCard version={version} dosageName={dosageName} categoryName={categoryName} stageLabel={stageLabel} onEdit={readOnly ? undefined : () => setEditOpen(true)} />
          <LegalFrame
            version={version}
            docs={docsByGroup(docs, 'legal')}
            stageLabel={stageLabel}
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
            onAdd={readOnly ? undefined : () => openUpload(LEGAL_TARGET)}
          />
          <UsageFrame version={version} previous={previous} docs={docsByGroup(docs, 'usage').filter((d) => !d.shared)} onView={setViewerDoc} onDownload={handleDownloadDoc} />
          <SharedDocsFrame
            version={version}
            docs={docs}
            editable={!readOnly}
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
            onUploadProfessional={() => openUpload(PROFESSIONAL_TARGET)}
            onUploadSharedUsage={() => openUpload(SHARED_USAGE_TARGET)}
          />
          <PackagingFrame product={product} version={version} onView={setViewerDoc} onDownload={handleDownloadDoc} />
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <VersionSidePanel
            version={version}
            stageLabel={stageLabel}
            previous={previous}
            docCount={docs.length}
            canCreate={!readOnly}
            onCreateNext={createNext}
            onBack={() => navigate(`/products/${product.id}`)}
          />
        </aside>
      </div>

      {editOpen && (
        <EditVersionInfoModal
          open
          version={version}
          dosageForms={lookups.dosageForms}
          categories={lookups.categories}
          saving={updateInfo.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={submitInfo}
        />
      )}

      {uploadTarget && (
        <UploadDocumentModal
          open
          target={uploadTarget}
          product={product}
          version={version}
          docCount={docs.length}
          saving={saveDocs.isPending}
          onClose={() => setUploadTarget(null)}
          onSubmit={submitDoc}
        />
      )}

      <DocumentViewerModal
        open={!!viewerDoc}
        doc={viewerDoc}
        product={product}
        version={version}
        names={names}
        onClose={() => setViewerDoc(null)}
        onDownload={handleDownloadDoc}
      />
    </div>
  )
}

interface SidePanelProps {
  version: ProductVersion
  stageLabel: string
  previous?: ProductVersion
  docCount: number
  canCreate: boolean
  onCreateNext: () => void
  onBack: () => void
}

function VersionSidePanel({ version, stageLabel, previous, docCount, canCreate, onCreateNext, onBack }: SidePanelProps) {
  const stage = STAGE_META[version.stage]
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <header className="relative overflow-hidden bg-linear-to-br from-brand-900 via-brand-700 to-brand-600 px-5 py-5 text-white">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
            <ClipboardCheck className="size-3.5" /> Trạng thái phiên bản
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Phiên bản {version.version}</h2>
          <span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-white/20">{stageLabel}</span>
        </div>
      </header>

      <div className="space-y-2.5 px-4 py-4">
        {[
          ['Ngày bắt đầu hiệu lực', formatDate(version.effectiveDate)],
          ['Ngày kết thúc hiệu lực', formatDate(versionEndDate(version)) || '—'],
          ['Cập nhật gần nhất', formatDate(version.updatedAt)],
          ['Quyết định', version.approvalNo],
          ['Người phê duyệt', version.approvedBy],
          ['Kế thừa từ', previous ? `Phiên bản ${previous.version}` : 'Hồ sơ gốc'],
          ['Tài liệu', `${docCount} tài liệu`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-brand-50/40 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-brand-900" title={value}>{value}</p>
          </div>
        ))}

        <div className="rounded-xl bg-brand-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-brand-800">
          {version.stage === 'coming_soon'
            ? `Phiên bản đang chờ duyệt. Sau khi được duyệt và tới ngày ${formatDate(version.effectiveDate)}, có thể đưa vào sử dụng.`
            : stage.description}
        </div>

        <div className="space-y-2 pt-1">
          <Button variant="secondary" size="sm" icon={<RotateCcw className="size-4" />} onClick={onBack} className="w-full">
            Về chi tiết sản phẩm
          </Button>
          <Button variant="ghost" size="sm" icon={<ShieldCheck className="size-4" />} onClick={onCreateNext} className="w-full" disabled={!canCreate}>
            Tạo phiên bản mới
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted">Bản đang cập nhật: v{version.version}</p>
      </div>
    </section>
  )
}

function EmptyState({ title, description, to, label }: { title: string; description: string; to: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-20 text-center">
      <PackageSearch className="size-12 text-brand-300" strokeWidth={1.5} />
      <h1 className="text-xl font-extrabold text-brand-900">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      <Link to={to}><Button variant="secondary" icon={<ArrowLeft className="size-4" />}>{label}</Button></Link>
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-64 rounded-[1.75rem]" />
      <div className="skeleton h-14 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="skeleton h-80 rounded-3xl" />
        </div>
        <div className="skeleton h-[28rem] rounded-3xl" />
      </div>
    </div>
  )
}
