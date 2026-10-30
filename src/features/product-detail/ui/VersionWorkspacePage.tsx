import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CalendarCheck2, CalendarX2, Check, ClipboardCheck, Download, FileText, GitCompare,
  PackageSearch, RotateCcw, ShieldCheck, UsersRound, X,
} from 'lucide-react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { formatDate } from '@/core/utils/format'
import { useLookups } from '@/features/products/logic/useLookups'
import { useProducts } from '@/features/products/logic/useProducts'
import { ProductSearchBar } from '@/features/products/ui/ProductSearchBar'
import {
  approvalMetaOf, approvalStatusOf, approverRoleOf, assignedRoleOf, canRoleAct, canRoleResubmit,
  lifecycleLabelOf, lifecycleToneOf, roleTaskLabel,
} from '../logic/approvalUtils'
import {
  canApplyVersion, canEditGeneralInfo, roleMeta, type RoleKey,
} from '@/core/auth/roles'
import { useCurrentRole } from '@/core/auth/roleStore'
import { downloadSingleDocument, downloadVersionDossier } from '../logic/downloadDossier'
import { buildDocuments } from '../logic/documents'
import type { ProductVersion, UpdateVersionInfoInput, VersionDocument } from '../logic/types'
import {
  useApplyVersionNow, useApproveVersion, useProductVersions, useRejectVersion, useResubmitVersion,
  useSetVersionIndefinite, useUpdateVersionInfo,
} from '../logic/useProductVersions'
import { previousVersionOf, sortVersions, versionEndDate } from '../logic/versionUtils'
import { ChangeNoteFrame } from './ChangeNoteFrame'
import { ChangeSummaryFrame } from './ChangeSummaryFrame'
import { CompareVersionModal } from './CompareVersionModal'
import { DocumentViewerModal } from './DocumentViewerModal'
import { EditVersionInfoModal } from './EditVersionInfoModal'
import { EffectiveValidityFrame } from './EffectiveValidityFrame'
import { GeneralInfoCard } from './GeneralInfoCard'
import { LifecyclePanel } from './LifecyclePanel'
import { RejectVersionModal } from './RejectVersionModal'
import { SignedDocsFrame } from './SignedDocsFrame'
import { VersionDatesModal } from './VersionDatesModal'

export default function VersionWorkspacePage() {
  const { id, versionId } = useParams()
  const productId = Number(id)
  const numericVersionId = Number(versionId)
  const navigate = useNavigate()
  const toast = useToast()
  const role = useCurrentRole()

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(productId)
  const lookups = useLookups()
  const updateInfo = useUpdateVersionInfo(productId)
  const approveVersion = useApproveVersion(productId)
  const rejectVersion = useRejectVersion(productId)
  const resubmitVersion = useResubmitVersion(productId)
  const setIndefinite = useSetVersionIndefinite(productId)
  const applyNow = useApplyVersionNow(productId)

  const [editOpen, setEditOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
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
  const previousDosageName = lookups.dosageName(previous?.dosageFormId ?? 0)
  const previousCategoryName = lookups.categoryName(previous?.categoryId ?? 0)
  const names = { dosage: dosageName, category: categoryName }
  const status = version ? approvalStatusOf(version) : null
  const stageLabel = version ? lifecycleLabelOf(version) : ''
  const stageTone = version ? lifecycleToneOf(version) : 'blue'
  const assignedRole = version ? assignedRoleOf(version) : 'ra'
  const approverRole = version ? approverRoleOf(version) : 'ra'
  const canAct = version ? canRoleAct(version, role) : false
  const canResend = version ? canRoleResubmit(version, role) : false
  const canEditInfo = !!version && (version.stage === 'current' || status === 'rejected') && canEditGeneralInfo(role)
  const canEditDates = !!version && version.stage !== 'archived' && role === 'ra'
    && (version.stage === 'current' || status === 'approved' || status === 'rejected')
  const canApply = !!version && canApplyVersion(role)
  const endLabel = version?.indefinite ? 'Vô thời hạn' : formatDate(version ? versionEndDate(version) : '') || '—'

  const fail = (e: unknown) => toast.error((e as unknown as ApiError).message)

  const submitInfo = (input: UpdateVersionInfoInput) => {
    if (!version) return
    updateInfo.mutate({ versionId: version.id, input }, {
      onSuccess: (updated) => {
        setEditOpen(false)
        setDatesOpen(false)
        toast.success(`Đã cập nhật thông tin phiên bản ${updated.version}`)
      },
      onError: fail,
    })
  }

  const handleApprove = () => {
    if (!version) return
    approveVersion.mutate(version.id, {
      onSuccess: () => toast.success(status === 'processing'
        ? `Đã duyệt phiên bản ${version.version}, chuyển sang Chờ duyệt`
        : `Đã phê duyệt cuối phiên bản ${version.version}`),
      onError: fail,
    })
  }

  const handleReject = (reason: string) => {
    if (!version) return
    rejectVersion.mutate({ versionId: version.id, reason }, {
      onSuccess: () => {
        setRejectOpen(false)
        toast.info(`Đã từ chối phiên bản ${version.version}`)
      },
      onError: fail,
    })
  }

  const handleResubmit = () => {
    if (!version) return
    resubmitVersion.mutate(version.id, {
      onSuccess: () => toast.success(`Đã gửi lại phiên bản ${version.version} tới ${roleMeta(assignedRole).name}`),
      onError: fail,
    })
  }

  const handleToggleIndefinite = (value: boolean) => {
    if (!version) return
    setIndefinite.mutate({ versionId: version.id, indefinite: value }, {
      onSuccess: () => toast.success(value ? 'Đã bật hiệu lực vô thời hạn' : 'Đã tắt hiệu lực vô thời hạn'),
      onError: fail,
    })
  }

  const handleApplyNow = () => {
    if (!version) return
    applyNow.mutate(version.id, {
      onSuccess: (applied) => {
        setApplyOpen(false)
        toast.success(`Đã áp dụng phiên bản ${applied.version} từ hôm nay`)
      },
      onError: (e) => {
        setApplyOpen(false)
        fail(e)
      },
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
              <span className="text-white/70">Chi tiết phiên bản</span>
            </nav>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide ring-1 ring-white/20">{product.code}</span>
              <span className={stageTone === 'red' ? 'inline-flex items-center gap-1.5 rounded-full bg-red-300/25 px-2.5 py-1 text-[11px] font-bold text-red-50 ring-1 ring-white/20' : 'inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20'}>
                {stageLabel}
              </span>
              {version.stage === 'coming_soon' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 px-2.5 py-1 text-[11px] font-bold text-amber-50 ring-1 ring-amber-200/30">
                  <UsersRound className="size-3" /> {roleTaskLabel(version)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
                Phiên bản {version.version}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl xl:text-[2.15rem]">Chi tiết phiên bản sản phẩm</h1>
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
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><CalendarX2 className="size-3 text-brand-200" /> Kết thúc {endLabel}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><ShieldCheck className="size-3 text-brand-200" /> {version.approvalNo}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><FileText className="size-3 text-brand-200" /> {docs.length} tài liệu</span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
            {((status === 'processing' || status === 'pending') || status === 'rejected' || previous) && (
              <div className="flex flex-wrap gap-2">
                {(status === 'processing' || status === 'pending') && (
                  <>
                    <Button
                      variant="light"
                      icon={<Check className="size-4" />}
                      loading={approveVersion.isPending}
                      onClick={handleApprove}
                      disabled={!canAct}
                      title={canAct ? 'Duyệt hồ sơ' : `Chỉ ${roleMeta(status === 'processing' ? assignedRole : approverRole).name} được xử lý hồ sơ này`}
                      className="whitespace-nowrap"
                    >
                      Duyệt hồ sơ
                    </Button>
                    <Button
                      variant="glass"
                      icon={<X className="size-4" />}
                      onClick={() => setRejectOpen(true)}
                      disabled={!canAct}
                      title={canAct ? 'Từ chối hồ sơ' : 'Vai trò hiện tại không phụ trách hồ sơ này'}
                      className="whitespace-nowrap"
                    >
                      Từ chối
                    </Button>
                  </>
                )}
                {status === 'rejected' && canResend && (
                  <Button
                    variant="light"
                    icon={<RotateCcw className="size-4" />}
                    loading={resubmitVersion.isPending}
                    onClick={handleResubmit}
                    className="whitespace-nowrap"
                  >
                    Gửi lại duyệt
                  </Button>
                )}
                {previous && (
                  <Button variant="glass" icon={<GitCompare className="size-4" />} onClick={() => setCompareOpen(true)} className="whitespace-nowrap">
                    Đối chiếu chi tiết
                  </Button>
                )}
              </div>
            )}
            {(status === 'processing' || status === 'pending') && !canAct && (
              <p className="max-w-[18rem] rounded-xl bg-white/10 px-3 py-2 text-[10px] leading-relaxed text-brand-50 ring-1 ring-white/15">
                Hồ sơ đang chờ {roleMeta(status === 'processing' ? assignedRole : approverRole).name} xử lý. Vai trò hiện tại: {roleMeta(role).name}.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" icon={<ArrowLeft className="size-4" />} onClick={() => navigate(`/products/${product.id}`)} className="whitespace-nowrap">
                Về chi tiết sản phẩm
              </Button>
              <Button variant="glass" icon={<Download className="size-4" />} loading={downloading} onClick={handleDownloadDossier} className="whitespace-nowrap">
                Tải hồ sơ
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ProductSearchBar className="rounded-2xl" onSelect={(p) => navigate(`/products/${p.id}`)} />

      <VersionStatusNotice
        version={version}
        role={role}
        canAct={canAct}
        canResend={canResend}
        resubmitting={resubmitVersion.isPending}
        onOpenApprovals={() => navigate('/approvals')}
        onResubmit={handleResubmit}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="space-y-4 rounded-[2rem] border border-brand-100 bg-linear-to-b from-brand-50/60 via-white to-white p-3 shadow-soft sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-600">Hồ sơ phiên bản</p>
              <h2 className="text-lg font-extrabold tracking-tight text-brand-900">Phiên bản {version.version}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted">{stageLabel}</span>
              <span className="text-[10px] text-muted">·</span>
              <span className="text-[10px] text-muted">{docs.filter((d) => d.verified).length}/{docs.length} tệp đã ký</span>
            </div>
          </div>

          <GeneralInfoCard
            version={version}
            dosageName={dosageName}
            categoryName={categoryName}
            stageLabel={stageLabel}
            onEdit={canEditInfo ? () => setEditOpen(true) : undefined}
          />
          <ChangeNoteFrame version={version} />
          <EffectiveValidityFrame
            version={version}
            applying={applyNow.isPending}
            savingIndefinite={setIndefinite.isPending}
            canEditDates={canEditDates}
            canApplyRole={canApply}
            roleName={roleMeta(role).name}
            onApplyNow={() => setApplyOpen(true)}
            onToggleIndefinite={handleToggleIndefinite}
            onEditDates={() => setDatesOpen(true)}
          />
          <ChangeSummaryFrame
            version={version}
            previous={previous}
            dosageName={dosageName}
            categoryName={categoryName}
            previousDosageName={previousDosageName}
            previousCategoryName={previousCategoryName}
          />
          <SignedDocsFrame version={version} docs={docs} onView={setViewerDoc} onDownload={handleDownloadDoc} />
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <LifecyclePanel
            versions={sorted}
            selectedId={version.id}
            canCreate={role !== 'commercial'}
            onPreview={(v) => navigate(`/products/${productId}/versions/${v.id}`)}
            onCreate={() => navigate(`/products/${productId}/versions/new`)}
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

      {datesOpen && (
        <VersionDatesModal
          open
          version={version}
          saving={updateInfo.isPending}
          onClose={() => setDatesOpen(false)}
          onSubmit={submitInfo}
        />
      )}

      <RejectVersionModal
        open={rejectOpen}
        product={product}
        version={version}
        saving={rejectVersion.isPending}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
      />

      {compareOpen && (
        <CompareVersionModal
          open
          target={version}
          versions={sorted}
          onClose={() => setCompareOpen(false)}
          onSelect={(older) => {
            setCompareOpen(false)
            navigate(`/products/${productId}/compare/${older.id}/${version.id}`)
          }}
        />
      )}

      <ConfirmDialog
        open={applyOpen}
        title="Áp dụng phiên bản ngay"
        message={`Bạn có muốn áp dụng phiên bản này ngay lập tức không? Phiên bản ${version.version} sẽ trở thành phiên bản đang lưu hành từ hôm nay; phiên bản hiện tại sẽ chuyển sang lưu trữ.`}
        confirmText="Áp dụng ngay"
        confirmVariant="primary"
        loading={applyNow.isPending}
        onConfirm={handleApplyNow}
        onClose={() => setApplyOpen(false)}
      />

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

function VersionStatusNotice({
  version, role, canAct, canResend, resubmitting, onOpenApprovals, onResubmit,
}: {
  version: ProductVersion
  role: RoleKey
  canAct: boolean
  canResend: boolean
  resubmitting: boolean
  onOpenApprovals: () => void
  onResubmit: () => void
}) {
  const status = approvalStatusOf(version)
  const approval = approvalMetaOf(version)
  const coming = version.stage === 'coming_soon'
  const assigned = roleMeta(assignedRoleOf(version)).name
  const approver = roleMeta(approverRoleOf(version)).name
  const rejectedBy = roleMeta(version.rejectedByRole ?? assignedRoleOf(version)).name

  if (version.stage === 'current') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-white p-4 shadow-soft">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-900">Phiên bản {version.version} · Đang lưu hành</p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-800/80">
            Phiên bản đang được sử dụng chính thức{version.appliedAt ? ` từ ${formatDate(version.appliedAt)}` : ''}. Hiệu lực {formatDate(version.effectiveDate)} – {version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version)) || '—'}.
          </p>
        </div>
      </div>
    )
  }

  if (!coming) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-soft">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-white"><ClipboardCheck className="size-5" /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">Phiên bản {version.version} · Lưu trữ</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">Phiên bản lưu trữ chỉ được xem và tải hồ sơ, không thể chỉnh sửa.</p>
        </div>
      </div>
    )
  }

  const tone = status === 'rejected'
    ? 'border-red-200 bg-linear-to-r from-red-50 via-white to-red-50/50'
    : status === 'approved'
      ? 'border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-emerald-50/50'
      : status === 'pending'
        ? 'border-brand-200 bg-linear-to-r from-brand-50 via-white to-brand-50/50'
        : 'border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50/50'
  const iconTone = status === 'rejected'
    ? 'from-red-400 to-red-600'
    : status === 'approved'
      ? 'from-emerald-400 to-emerald-600'
      : status === 'pending'
        ? 'from-brand-400 to-brand-600'
        : 'from-amber-400 to-amber-600'
  const titleTone = status === 'rejected' ? 'text-red-900' : status === 'approved' ? 'text-emerald-900' : status === 'pending' ? 'text-brand-900' : 'text-amber-900'
  const textTone = status === 'rejected' ? 'text-red-800/80' : status === 'approved' ? 'text-emerald-800/80' : status === 'pending' ? 'text-brand-800/80' : 'text-amber-800/80'

  const description = status === 'rejected'
    ? `Hồ sơ bị ${rejectedBy} từ chối${version.rejectedReason ? `: ${version.rejectedReason}` : '.'} Cập nhật nội dung và gửi lại để tổ phụ trách duyệt lại.`
    : status === 'approved'
      ? 'Hồ sơ đã hoàn tất phê duyệt và được ký xác thực. Có thể áp dụng ngay hoặc chờ tới ngày hiệu lực.'
      : status === 'pending'
        ? `${assigned} đã xử lý hồ sơ. Hồ sơ đang chờ ${approver} phê duyệt cuối.`
        : canAct
          ? `Hồ sơ đã được gửi tự động tới ${assigned}. Bạn có thể duyệt để chuyển sang Chờ duyệt hoặc từ chối kèm lý do.`
          : `Hồ sơ đã được gửi tự động tới ${assigned}. Vai trò hiện tại (${roleMeta(role).name}) chỉ theo dõi cho tới khi tổ phụ trách xử lý.`

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-soft sm:flex-row sm:items-center ${tone}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white ${iconTone}`}>
        {status === 'rejected' ? <X className="size-5" /> : status === 'approved' ? <Check className="size-5" /> : status === 'pending' ? <ShieldCheck className="size-5" /> : <ClipboardCheck className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${titleTone}`}>Phiên bản {version.version} · {approval.label}</p>
        <p className={`mt-0.5 text-xs leading-relaxed ${textTone}`}>{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {(status === 'processing' || status === 'pending') && (
          <Button size="sm" variant="secondary" icon={<UsersRound className="size-4" />} onClick={onOpenApprovals} className="whitespace-nowrap">
            Xem tổ phụ trách
          </Button>
        )}
        {status === 'rejected' && canResend && (
          <Button size="sm" variant="secondary" icon={<RotateCcw className="size-4" />} loading={resubmitting} onClick={onResubmit} className="whitespace-nowrap">
            Gửi lại duyệt
          </Button>
        )}
      </div>
    </div>
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-5">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="skeleton h-80 rounded-3xl" />
        </div>
        <div className="skeleton h-[28rem] rounded-3xl" />
      </div>
    </div>
  )
}
