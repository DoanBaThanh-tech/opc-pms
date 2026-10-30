import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CalendarCheck2, CalendarX2, CheckCircle2, ClipboardCheck, FileText, PackageSearch, Plus, Sparkles,
} from 'lucide-react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import { useLookups } from '@/features/products/logic/useLookups'
import { useProducts } from '@/features/products/logic/useProducts'
import { downloadSingleDocument } from '../logic/downloadDossier'
import { buildDocuments, docsByGroup } from '../logic/documents'
import { buildDraftVersion, toCreateVersionInput } from '../logic/newVersionDefaults'
import { resolvePackagingSpecs } from '../logic/packagingSpecs'
import type { PackagingSpec, ProductVersion, UpdateVersionInfoInput, VersionDocument } from '../logic/types'
import { useCreateVersion, useProductVersions } from '../logic/useProductVersions'
import { applyVersionInfo } from '../logic/versionUpdates'
import {
  getCurrentVersion, sortVersions, suggestNextVersionAfter, versionEndDate,
} from '../logic/versionUtils'
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
  description: 'Tài liệu pháp lý được gắn vào bản nháp phiên bản và xuất hiện trong hồ sơ pháp lý sau khi tạo.',
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

const VERSION_PATTERN = /^\d+(\.\d+){0,3}$/

export default function VersionDraftPage() {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(Number.isFinite(productId) ? productId : 0)
  const lookups = useLookups()
  const createVersion = useCreateVersion(productId)

  const [draft, setDraft] = useState<ProductVersion | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)
  const [viewerDoc, setViewerDoc] = useState<VersionDocument | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const product = products.find((p) => p.id === productId)
  const sorted = useMemo(() => sortVersions(versions), [versions])
  const base = getCurrentVersion(sorted) ?? sorted[0]

  /** Bản nháp khởi tạo từ phiên bản hiện hành – chỉ nằm trong bộ nhớ, chưa ghi xuống dữ liệu. */
  const initialDraft = useMemo(
    () => (product && base ? buildDraftVersion(product, base, suggestNextVersionAfter(sorted)) : null),
    [product, base, sorted],
  )
  const activeDraft = draft ?? initialDraft

  const docs = useMemo(
    () => (product && activeDraft ? buildDocuments(product, activeDraft, base?.version) : []),
    [product, activeDraft, base],
  )
  const specs: PackagingSpec[] = useMemo(
    () => (product && activeDraft ? resolvePackagingSpecs(product, activeDraft) : []),
    [product, activeDraft],
  )

  const dosageName = lookups.dosageName(activeDraft?.dosageFormId ?? 0)
  const categoryName = lookups.categoryName(activeDraft?.categoryId ?? 0)
  const names = { dosage: dosageName, category: categoryName }
  const endDate = activeDraft ? versionEndDate(activeDraft) : ''

  const submitInfo = (input: UpdateVersionInfoInput) => {
    if (!activeDraft || !product) return
    setDraft(applyVersionInfo(activeDraft, input, product.code))
    setEditOpen(false)
    toast.success(`Đã cập nhật bản nháp phiên bản ${input.version}`)
  }

  const submitDoc = (doc: VersionDocument) => {
    if (!activeDraft) return
    setDraft({
      ...activeDraft,
      extraDocs: [...(activeDraft.extraDocs ?? []), doc],
      updatedAt: doc.updatedAt,
    })
    setUploadTarget(null)
    toast.success(`Đã thêm "${doc.name}" vào bản nháp`)
  }

  const saveSpecs = (next: PackagingSpec[]) => {
    if (!activeDraft) return
    setDraft({ ...activeDraft, packagingSpecs: next, updatedAt: new Date().toISOString() })
  }

  const handleDownloadDoc = async (doc: VersionDocument) => {
    if (!product || !activeDraft) return
    try {
      await downloadSingleDocument({
        product,
        version: activeDraft,
        previous: base,
        docs,
        versions: [...sorted, activeDraft],
        names,
      }, doc)
      toast.success(`Đã tải "${doc.name}"`)
    } catch {
      toast.error('Không thể tải tài liệu, vui lòng thử lại.')
    }
  }

  const requestCreate = () => {
    if (!activeDraft) return
    if (!VERSION_PATTERN.test(activeDraft.version.trim())) {
      toast.error('Số phiên bản chưa hợp lệ (ví dụ: 2.2 hoặc 2.2.1).')
      setEditOpen(true)
      return
    }
    if (!activeDraft.effectiveDate || !endDate) {
      toast.error('Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc hiệu lực.')
      setEditOpen(true)
      return
    }
    if (endDate < activeDraft.effectiveDate) {
      toast.error('Ngày kết thúc hiệu lực phải sau hoặc bằng ngày bắt đầu.')
      setEditOpen(true)
      return
    }
    setConfirmOpen(true)
  }

  const confirmCreate = () => {
    if (!activeDraft) return
    createVersion.mutate(toCreateVersionInput(activeDraft), {
      onSuccess: (created) => {
        setConfirmOpen(false)
        toast.success(`Đã tạo phiên bản ${created.version} · Đang chờ tổ phụ trách xử lý`)
        navigate(`/products/${productId}/versions/${created.id}`)
      },
      onError: (e) => {
        setConfirmOpen(false)
        toast.error((e as unknown as ApiError).message)
      },
    })
  }

  if (loadingProducts || (product && loadingVersions)) return <DraftSkeleton />

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

  if (!activeDraft || !base) {
    return (
      <EmptyState
        title="Chưa có phiên bản để kế thừa"
        description="Sản phẩm chưa có hồ sơ phiên bản hiện hành. Hãy mở chi tiết sản phẩm để khởi tạo trước."
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/25 px-2.5 py-1 text-[11px] font-bold text-amber-50 ring-1 ring-white/20">
                Bản nháp chưa lưu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
                Phiên bản {activeDraft.version}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl xl:text-[2.15rem]">Cập nhật phiên bản sản phẩm</h1>
            <p className="mt-1 text-sm font-medium text-brand-100">{product.name}</p>

            <div className="mt-3 flex max-w-3xl items-start gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur">
              <FileText className="mt-0.5 size-4 shrink-0 text-brand-200" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-100/80">Hoạt chất & hàm lượng</p>
                <p className="mt-0.5 text-sm font-medium leading-relaxed text-white/95">{activeDraft.activeIngredients}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-brand-50">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                <CalendarCheck2 className="size-3 text-brand-200" /> Bắt đầu {formatDate(activeDraft.effectiveDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                <CalendarX2 className="size-3 text-brand-200" /> Kết thúc {formatDate(endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                <FileText className="size-3 text-brand-200" /> {docs.length} tài liệu
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
            <Button variant="light" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`/products/${product.id}`)} className="whitespace-nowrap">
              Về chi tiết sản phẩm
            </Button>
            <Button variant="glass" icon={<Plus className="size-4" />} onClick={requestCreate} className="whitespace-nowrap">
              Tạo phiên bản mới
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-soft sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-white">
          <ClipboardCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900">Bản nháp phiên bản {activeDraft.version} · Kế thừa từ phiên bản {base.version}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">
            Các thuộc tính được giữ nguyên từ phiên bản cũ để bạn cập nhật. Mọi thay đổi chỉ được ghi vào hồ sơ sau khi bạn bấm
            <b> Tạo phiên bản mới</b> ở cuối trang và xác nhận.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="space-y-5">
          <GeneralInfoCard
            version={activeDraft}
            dosageName={dosageName}
            categoryName={categoryName}
            stageLabel="Bản nháp"
            onEdit={() => setEditOpen(true)}
          />
          <LegalFrame
            version={activeDraft}
            docs={docsByGroup(docs, 'legal')}
            stageLabel="Bản nháp"
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
            onAdd={() => setUploadTarget(LEGAL_TARGET)}
          />
          <UsageFrame
            version={activeDraft}
            previous={base}
            docs={docsByGroup(docs, 'usage').filter((d) => !d.shared)}
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
          />
          <SharedDocsFrame
            version={activeDraft}
            docs={docs}
            editable
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
            onUploadProfessional={() => setUploadTarget(PROFESSIONAL_TARGET)}
            onUploadSharedUsage={() => setUploadTarget(SHARED_USAGE_TARGET)}
          />
          <PackagingFrame
            product={product}
            version={activeDraft}
            onView={setViewerDoc}
            onDownload={handleDownloadDoc}
            onSaveSpecs={saveSpecs}
          />
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <DraftSidePanel
            draft={activeDraft}
            base={base}
            endDate={endDate}
            docCount={docs.length}
            specCount={specs.length}
            onBack={() => navigate(`/products/${product.id}`)}
          />
        </aside>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-linear-to-br from-brand-900 via-brand-700 to-brand-600 px-5 py-6 text-white shadow-pop sm:px-7">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
              <Sparkles className="size-3.5" /> Hoàn tất cập nhật
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Tạo phiên bản {activeDraft.version}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-brand-100">
              Kiểm tra lại thông tin chung, hồ sơ pháp lý, hồ sơ chuyên môn, HDSD và quy cách đóng gói. Phiên bản chỉ được ghi nhận
              khi bạn xác nhận ở bước tiếp theo.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <CalendarCheck2 className="size-3 text-brand-200" /> {formatDate(activeDraft.effectiveDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <CalendarX2 className="size-3 text-brand-200" /> {formatDate(endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <FileText className="size-3 text-brand-200" /> {docs.length} tài liệu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <CheckCircle2 className="size-3 text-brand-200" /> {specs.length} quy cách
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
            <Button variant="light" size="md" icon={<Plus className="size-4" />} loading={createVersion.isPending} onClick={requestCreate} className="whitespace-nowrap">
              Tạo phiên bản mới
            </Button>
            <Button variant="glass" size="md" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`/products/${product.id}`)} className="whitespace-nowrap">
              Hủy, về chi tiết sản phẩm
            </Button>
          </div>
        </div>
      </section>

      {editOpen && (
        <EditVersionInfoModal
          open
          version={activeDraft}
          dosageForms={lookups.dosageForms}
          categories={lookups.categories}
          saving={false}
          onClose={() => setEditOpen(false)}
          onSubmit={submitInfo}
        />
      )}

      {uploadTarget && (
        <UploadDocumentModal
          open
          target={uploadTarget}
          product={product}
          version={activeDraft}
          docCount={docs.length}
          saving={false}
          onClose={() => setUploadTarget(null)}
          onSubmit={submitDoc}
        />
      )}

      <DocumentViewerModal
        open={!!viewerDoc}
        doc={viewerDoc}
        product={product}
        version={activeDraft}
        names={names}
        onClose={() => setViewerDoc(null)}
        onDownload={handleDownloadDoc}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Tạo phiên bản mới"
        message={`Bạn có chắc chắn muốn tạo phiên bản này không? Phiên bản ${activeDraft.version} sẽ được ghi vào hồ sơ và tự động gửi tới tổ phụ trách nội dung thay đổi để xử lý.`}
        confirmText="Tạo phiên bản"
        confirmVariant="primary"
        loading={createVersion.isPending}
        onConfirm={confirmCreate}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

interface SidePanelProps {
  draft: ProductVersion
  base: ProductVersion
  endDate: string
  docCount: number
  specCount: number
  onBack: () => void
}

function DraftSidePanel({ draft, base, endDate, docCount, specCount, onBack }: SidePanelProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <header className="relative overflow-hidden bg-linear-to-br from-brand-900 via-brand-700 to-brand-600 px-5 py-5 text-white">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
            <ClipboardCheck className="size-3.5" /> Bản nháp phiên bản
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Phiên bản {draft.version}</h2>
          <span className="mt-2 inline-flex rounded-full bg-amber-300/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-50 ring-1 ring-white/20">
            Chưa lưu vào hồ sơ
          </span>
        </div>
      </header>

      <div className="space-y-2.5 px-4 py-4">
        {[
          ['Kế thừa từ', `Phiên bản ${base.version}`],
          ['Ngày bắt đầu', formatDate(draft.effectiveDate)],
          ['Ngày kết thúc', formatDate(endDate)],
          ['Quyết định', draft.approvalNo],
          ['Tài liệu', `${docCount} tài liệu`],
          ['Quy cách đóng gói', `${specCount} quy cách`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-brand-50/40 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-brand-900" title={value}>{value}</p>
          </div>
        ))}

        <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
          Bản nháp chỉ tồn tại trên trang này. Rời trang trước khi xác nhận sẽ bỏ các thay đổi chưa tạo.
        </div>

        <div className="pt-1">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="size-4" />} onClick={onBack} className="w-full">
            Về chi tiết sản phẩm
          </Button>
        </div>
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

function DraftSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-64 rounded-[1.75rem]" />
      <div className="skeleton h-20 rounded-2xl" />
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
