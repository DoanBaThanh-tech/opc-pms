import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, Check, CheckCheck, ClipboardCheck, Clock3, Lock, RotateCcw, UsersRound, X,
} from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import { PageHeader } from '@/core/components/PageHeader'
import { Textarea } from '@/core/components/Textarea'
import { useToast } from '@/core/components/Toast'
import { roleMeta } from '@/core/auth/roles'
import { useCurrentRole } from '@/core/auth/roleStore'
import type { ApiError } from '@/core/types/common'
import { cn, formatDate } from '@/core/utils/format'
import {
  approvalMetaOf, approvalStatusOf, approverRoleOf, assignedRoleOf, canOpenDossier, canRoleAct, canRoleResubmit,
  rejectedByRoleOf, roleTaskLabel,
} from '@/features/product-detail/logic/approvalUtils'
import {
  useApprovalVersions, useApproveVersion, useRejectVersion, useResubmitVersion,
} from '@/features/product-detail/logic/useProductVersions'
import { versionEndDate } from '@/features/product-detail/logic/versionUtils'
import type { ProductVersion } from '@/features/product-detail/logic/types'
import type { Product } from '@/features/products/logic/types'
import { useLookups } from '@/features/products/logic/useLookups'
import { useChangeStatus, useProducts } from '@/features/products/logic/useProducts'
import { ProductSearchBar } from '@/features/products/ui/ProductSearchBar'
import { StatusBadge } from '@/features/products/ui/StatusBadge'
import { APPROVAL_TABS, useApprovalTabs, type ApprovalTab } from '../logic/useApprovalTabs'

const VERSION_SECTION: Record<ApprovalTab, { title: string; note: string; icon: typeof Clock3 }> = {
  pending: { title: 'Phiên bản chờ duyệt', note: 'Tổ ĐK Thuốc phê duyệt cuối', icon: ClipboardCheck },
  processing: { title: 'Phiên bản đang chờ xử lý', note: 'Tổ phụ trách duyệt hoặc từ chối', icon: Clock3 },
  approved: { title: 'Phiên bản đã duyệt', note: 'Đã ký xác thực và sẵn sàng lưu hành', icon: CheckCheck },
  rejected: { title: 'Phiên bản bị từ chối', note: 'Cập nhật hồ sơ và gửi lại tổ phụ trách', icon: X },
}

export default function ApprovalsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const role = useCurrentRole()
  const { data: products = [], isLoading } = useProducts()
  const { data: approvalVersions = [], isLoading: loadingVersions } = useApprovalVersions()
  const lookups = useLookups()
  const { tab, setTab, counts, items } = useApprovalTabs(products)
  const change = useChangeStatus()
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null)
  const [reason, setReason] = useState('')

  const productById = new Map(products.map((p) => [p.id, p]))
  const versionsByStatus = {
    processing: approvalVersions.filter((v) => approvalStatusOf(v) === 'processing'),
    pending: approvalVersions.filter((v) => approvalStatusOf(v) === 'pending'),
    approved: approvalVersions.filter((v) => approvalStatusOf(v) === 'approved'),
    rejected: approvalVersions.filter((v) => approvalStatusOf(v) === 'rejected'),
  }
  const versionItems = versionsByStatus[tab]

  const versionCounts: Record<ApprovalTab, number> = {
    pending: versionsByStatus.pending.length,
    processing: versionsByStatus.processing.length,
    approved: versionsByStatus.approved.length,
    rejected: versionsByStatus.rejected.length,
  }
  const tabCount = (key: ApprovalTab) => counts[key] + versionCounts[key]
  const loading = isLoading || loadingVersions
  const hasVersions = versionItems.length > 0
  const section = VERSION_SECTION[tab]
  const SectionIcon = section.icon
  const myTasks = approvalVersions.filter((v) => canRoleAct(v, role)).length

  const fail = (e: unknown) => toast.error((e as ApiError).message)
  const approveProduct = (p: Product) =>
    change.mutate({ id: p.id, status: 'approved' }, { onSuccess: () => toast.success(`Đã duyệt "${p.name}"`), onError: fail })
  const rejectProduct = () => {
    if (!rejectingProduct) return
    change.mutate({ id: rejectingProduct.id, status: 'rejected', note: `Từ chối: ${reason.trim()}` }, {
      onSuccess: () => {
        toast.info(`Đã từ chối "${rejectingProduct.name}"`)
        setRejectingProduct(null)
        setReason('')
      },
      onError: fail,
    })
  }

  return (
    <>
      <PageHeader title="Phê duyệt sản phẩm" description="Hồ sơ phiên bản được gửi tự động tới tổ phụ trách để xử lý" />

      <ProductSearchBar className="mb-4" onSelect={(p) => navigate(`/products/${p.id}`)} />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-linear-to-r from-brand-50/80 via-white to-white px-4 py-3 shadow-soft sm:flex-row sm:items-center">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <UsersRound className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-900">Quy trình xử lý hồ sơ theo vai trò</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            Hồ sơ mới được gửi tự động tới <b className="text-amber-700">tổ phụ trách nội dung thay đổi</b>. Tổ này duyệt hoặc từ chối;
            sau khi duyệt, hồ sơ chuyển sang <b className="text-brand-700">Chờ duyệt</b> để <b className="text-brand-700">Tổ ĐK Thuốc</b> phê duyệt cuối.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-800 ring-1 ring-brand-100">
            Vai trò: {roleMeta(role).name}
          </span>
          <span className={cn('rounded-xl px-2.5 py-1.5 text-[11px] font-bold ring-1', myTasks > 0 ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-white text-muted ring-line')}>
            {myTasks > 0 ? `${myTasks} hồ sơ cần bạn xử lý` : 'Không có hồ sơ cần xử lý'}
          </span>
        </div>
      </div>

      <div className="mb-5 inline-flex max-w-full flex-wrap rounded-2xl border border-line bg-white p-1 shadow-soft">
        {APPROVAL_TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={cn('relative rounded-xl px-4 py-2 text-sm font-semibold transition', tab === t.key ? 'text-white' : 'text-muted hover:text-brand-700')}
          >
            {tab === t.key && <motion.span layoutId="approval-tab" className="absolute inset-0 rounded-xl bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative flex items-center gap-2">{t.label}<span className={cn('rounded-full px-1.5 text-xs', tab === t.key ? 'bg-white/25' : 'bg-brand-50 text-brand-700')}>{tabCount(t.key)}</span></span>
          </button>
        ))}
      </div>

      {hasVersions && (
        <section className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-brand-900">
              <SectionIcon className="size-4 text-brand-600" /> {section.title}
            </h2>
            <Badge tone={tab === 'processing' ? 'amber' : tab === 'pending' ? 'blue' : tab === 'approved' ? 'green' : 'red'}>
              {versionItems.length} phiên bản
            </Badge>
            <span className="text-xs text-muted">{section.note} · Mới nhất hiển thị đầu tiên</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {versionItems.map((v) => {
                const p = productById.get(v.productId)
                if (!p) return null
                return (
                  <VersionApprovalCard
                    key={v.id}
                    product={p}
                    version={v}
                    categoryName={lookups.categoryName(v.categoryId)}
                    dosageName={lookups.dosageName(v.dosageFormId)}
                    onOpen={() => navigate(`/products/${p.id}/versions/${v.id}`)}
                  />
                )
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div>
      ) : items.length === 0 && !hasVersions ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white/70 py-16 text-center text-sm text-muted">Không có sản phẩm nào ở mục này.</p>
      ) : items.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-extrabold text-brand-900">Sản phẩm</h2>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((p) => (
                <motion.article key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted">{p.code} · v{p.version}</p>
                      <h3 className="mt-0.5 text-lg font-bold text-brand-900">{p.name}</h3>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge>{lookups.categoryName(p.categoryId)}</Badge><Badge tone="gray">{lookups.dosageName(p.dosageFormId)}</Badge></div>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{p.activeIngredients}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="text-xs text-muted">Cập nhật {formatDate(p.updatedAt)}</span>
                    {tab === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" icon={<X className="size-4" />} onClick={() => setRejectingProduct(p)} className="whitespace-nowrap">Từ chối</Button>
                        <Button size="sm" icon={<Check className="size-4" />} loading={change.isPending && change.variables?.id === p.id} onClick={() => approveProduct(p)} className="whitespace-nowrap">Duyệt</Button>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ) : null}

      <Modal
        open={!!rejectingProduct} title="Từ chối sản phẩm" onClose={() => setRejectingProduct(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setRejectingProduct(null)}>Hủy</Button>
          <Button variant="danger" disabled={!reason.trim()} loading={change.isPending} onClick={rejectProduct}>Xác nhận từ chối</Button>
        </>}
      >
        <p className="mb-3 text-sm text-muted">Sản phẩm: <b className="text-ink">{rejectingProduct?.name}</b></p>
        <Textarea label="Lý do từ chối *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do để người tạo chỉnh sửa lại" />
      </Modal>
    </>
  )
}

interface VersionCardProps {
  product: Product
  version: ProductVersion
  categoryName: string
  dosageName: string
  onOpen: () => void
}

function VersionApprovalCard({ product, version, categoryName, dosageName, onOpen }: VersionCardProps) {
  const toast = useToast()
  const role = useCurrentRole()
  const approve = useApproveVersion(product.id)
  const reject = useRejectVersion(product.id)
  const resubmit = useResubmitVersion(product.id)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  const status = approvalStatusOf(version)
  const meta = approvalMetaOf(version)
  const assigned = assignedRoleOf(version)
  const rejectedBy = rejectedByRoleOf(version)
  const openable = canOpenDossier(version)
  const allowed = canRoleAct(version, role)
  const canResend = canRoleResubmit(version, role)
  const fail = (e: unknown) => toast.error((e as ApiError).message)

  const approveVersion = () => {
    approve.mutate(version.id, {
      onSuccess: () => toast.success(status === 'processing'
        ? `Đã duyệt phiên bản ${version.version}, chuyển sang Chờ duyệt`
        : `Đã phê duyệt cuối phiên bản ${version.version}`),
      onError: fail,
    })
  }

  const rejectVersion = () => {
    if (!reason.trim()) return
    reject.mutate({ versionId: version.id, reason }, {
      onSuccess: () => {
        toast.info(`Đã từ chối phiên bản ${version.version}`)
        setRejectOpen(false)
        setReason('')
      },
      onError: fail,
    })
  }

  const resubmitVersion = () => {
    resubmit.mutate(version.id, {
      onSuccess: () => toast.success(`Đã gửi lại phiên bản ${version.version} tới ${roleMeta(assigned).name}`),
      onError: fail,
    })
  }

  const cardBorder = status === 'processing'
    ? 'border-amber-200'
    : status === 'pending'
      ? 'border-brand-200'
      : status === 'approved'
        ? 'border-emerald-200'
        : 'border-red-200'
  const headerBg = status === 'processing'
    ? 'from-amber-50 via-white to-white'
    : status === 'pending'
      ? 'from-brand-50 via-white to-white'
      : status === 'approved'
        ? 'from-emerald-50 via-white to-white'
        : 'from-red-50 via-white to-white'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col overflow-hidden rounded-2xl border bg-white shadow-soft', cardBorder)}
    >
      <div className={cn('flex items-start justify-between gap-3 bg-linear-to-r px-5 pt-4', headerBg)}>
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">{product.code} · v{version.version}</p>
          <h3 className="mt-0.5 line-clamp-2 text-base font-bold text-brand-900">{product.name}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-brand-700 ring-1 ring-brand-100">
            <UsersRound className="size-3" /> {roleTaskLabel(version)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4">
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{categoryName}</Badge>
          <Badge tone="gray">{dosageName}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{version.changeNote || version.summary || version.activeIngredients}</p>

        {status === 'rejected' && version.rejectedReason && (
          <p className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
            <b>Lý do từ chối{rejectedBy ? ` (${roleMeta(rejectedBy).name})` : ''}:</b> {version.rejectedReason}
          </p>
        )}

        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs text-muted">
            Hiệu lực {formatDate(version.effectiveDate)} – {version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version)) || '—'}
            {' · '}Cập nhật {formatDate(version.updatedAt)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {openable ? (
              <Button size="sm" variant="secondary" icon={<ArrowRight className="size-4" />} onClick={onOpen}>
                Xem hồ sơ
              </Button>
            ) : (
              <Button size="sm" variant="secondary" icon={<Lock className="size-4" />} disabled title={`Chờ ${roleMeta(assigned).name} xử lý trước khi xem hồ sơ`}>
                Xem hồ sơ
              </Button>
            )}
            {(status === 'processing' || status === 'pending') && (
              <>
                <Button
                  size="sm"
                  icon={<Check className="size-4" />}
                  loading={approve.isPending}
                  onClick={approveVersion}
                  disabled={!allowed}
                  title={allowed ? 'Duyệt hồ sơ' : `Chỉ ${roleMeta(status === 'processing' ? assigned : approverRoleOf(version)).name} được xử lý hồ sơ này`}
                  className="whitespace-nowrap"
                >
                  Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<X className="size-4" />}
                  onClick={() => setRejectOpen(true)}
                  disabled={!allowed}
                  title={allowed ? 'Từ chối hồ sơ' : 'Vai trò hiện tại không phụ trách hồ sơ này'}
                  className="whitespace-nowrap"
                >
                  Từ chối
                </Button>
              </>
            )}
            {status === 'rejected' && canResend && (
              <Button size="sm" variant="secondary" icon={<RotateCcw className="size-4" />} loading={resubmit.isPending} onClick={resubmitVersion} className="whitespace-nowrap">
                Gửi lại duyệt
              </Button>
            )}
          </div>
          {!openable && (
            <p className="mt-2 text-[10px] leading-relaxed text-amber-700">
              Hồ sơ đang chờ {roleMeta(assigned).name} xử lý nên chưa mở xem chi tiết được.
            </p>
          )}
          {!allowed && (status === 'processing' || status === 'pending') && (
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Vai trò hiện tại: {roleMeta(role).name}. {status === 'processing'
                ? `Hồ sơ đang chờ ${roleMeta(assigned).name} xử lý.`
                : `Hồ sơ đang chờ ${roleMeta(approverRoleOf(version)).name} phê duyệt cuối.`}
            </p>
          )}
        </div>
      </div>

      <Modal
        open={rejectOpen}
        title={`Từ chối phiên bản ${version.version}`}
        onClose={() => setRejectOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setRejectOpen(false)}>Hủy</Button>
          <Button variant="danger" disabled={!reason.trim()} loading={reject.isPending} onClick={rejectVersion}>Xác nhận từ chối</Button>
        </>}
      >
        <p className="mb-3 text-sm text-muted">Sản phẩm: <b className="text-ink">{product.name}</b> · Phiên bản {version.version}</p>
        <Textarea label="Lý do từ chối *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do để người tạo cập nhật và gửi lại" />
      </Modal>
    </motion.article>
  )
}
