import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import { PageHeader } from '@/core/components/PageHeader'
import { Textarea } from '@/core/components/Textarea'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { cn, formatDate } from '@/core/utils/format'
import type { Product } from '@/features/products/logic/types'
import { useLookups } from '@/features/products/logic/useLookups'
import { useChangeStatus, useProducts } from '@/features/products/logic/useProducts'
import { StatusBadge } from '@/features/products/ui/StatusBadge'
import { APPROVAL_TABS, useApprovalTabs } from '../logic/useApprovalTabs'

export default function ApprovalsPage() {
  const toast = useToast()
  const { data: products = [], isLoading } = useProducts()
  const lookups = useLookups()
  const { tab, setTab, counts, items } = useApprovalTabs(products)
  const change = useChangeStatus()
  const [rejecting, setRejecting] = useState<Product | null>(null)
  const [reason, setReason] = useState('')

  const fail = (e: unknown) => toast.error((e as ApiError).message)
  const approve = (p: Product) =>
    change.mutate({ id: p.id, status: 'approved' }, { onSuccess: () => toast.success(`Đã duyệt "${p.name}"`), onError: fail })
  const reject = () => {
    if (!rejecting) return
    change.mutate({ id: rejecting.id, status: 'rejected', note: `Từ chối: ${reason.trim()}` }, {
      onSuccess: () => { toast.info(`Đã từ chối "${rejecting.name}"`); setRejecting(null); setReason('') },
      onError: fail,
    })
  }

  return (
    <>
      <PageHeader title="Phê duyệt sản phẩm" description="Xem xét và duyệt các sản phẩm được gửi lên" />

      <div className="mb-5 inline-flex rounded-2xl border border-line bg-white p-1 shadow-soft">
        {APPROVAL_TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={cn('relative rounded-xl px-4 py-2 text-sm font-semibold transition', tab === t.key ? 'text-white' : 'text-muted hover:text-brand-700')}
          >
            {tab === t.key && <motion.span layoutId="approval-tab" className="absolute inset-0 rounded-xl bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative flex items-center gap-2">{t.label}<span className={cn('rounded-full px-1.5 text-xs', tab === t.key ? 'bg-white/25' : 'bg-brand-50 text-brand-700')}>{counts[t.key]}</span></span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white/70 py-16 text-center text-sm text-muted">Không có sản phẩm nào ở mục này.</p>
      ) : (
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
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="text-xs text-muted">Cập nhật {formatDate(p.updatedAt)}</span>
                  {tab === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" icon={<X className="size-4" />} onClick={() => setRejecting(p)}>Từ chối</Button>
                      <Button size="sm" icon={<Check className="size-4" />} loading={change.isPending && change.variables?.id === p.id} onClick={() => approve(p)}>Duyệt</Button>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={!!rejecting} title="Từ chối sản phẩm" onClose={() => setRejecting(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setRejecting(null)}>Hủy</Button>
          <Button variant="danger" disabled={!reason.trim()} loading={change.isPending} onClick={reject}>Xác nhận từ chối</Button>
        </>}
      >
        <p className="mb-3 text-sm text-muted">Sản phẩm: <b className="text-ink">{rejecting?.name}</b></p>
        <Textarea label="Lý do từ chối *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do để người tạo chỉnh sửa lại" />
      </Modal>
    </>
  )
}
