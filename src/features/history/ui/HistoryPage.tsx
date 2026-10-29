import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@/core/components/Input'
import { PageHeader } from '@/core/components/PageHeader'
import { Select } from '@/core/components/Select'
import { cn } from '@/core/utils/format'
import { ACTION_META, ACTION_OPTIONS } from '../logic/actionMeta'
import { useHistory } from '../logic/useHistory'

export default function HistoryPage() {
  const h = useHistory()
  return (
    <>
      <PageHeader title="Lịch sử sản phẩm" description="Mọi thay đổi và thao tác duyệt đều được ghi lại" />
      <div className="mb-6 grid max-w-2xl gap-3 sm:grid-cols-[1.5fr_1fr]">
        <Input icon={<Search className="size-4" />} placeholder="Tìm theo mã, tên sản phẩm, ghi chú..." value={h.keyword} onChange={(e) => h.setKeyword(e.target.value)} />
        <Select aria-label="Lọc theo thao tác" placeholder="Tất cả thao tác" options={ACTION_OPTIONS} value={h.action} onChange={(e) => h.setAction(e.target.value)} />
      </div>

      {h.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : h.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white/70 py-16 text-center text-sm text-muted">Chưa có lịch sử nào.</p>
      ) : (
        <div className="space-y-8">
          {h.groups.map(([date, rows]) => (
            <section key={date}>
              <h2 className="sticky top-16 z-10 mb-3 inline-block rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-soft">{date}</h2>
              <ol className="relative ml-2 space-y-3 border-l-2 border-brand-100 pl-5 sm:ml-3 sm:pl-7">
                {rows.map((r, i) => (
                  <motion.li key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="relative">
                    <span className={cn('absolute -left-[27px] top-4 size-3 rounded-full ring-4 ring-white sm:-left-[35px]', ACTION_META[r.action].dot)} />
                    <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-brand-900">{r.productName} <span className="text-sm font-normal text-muted">· v{r.version} · {r.productCode}</span></p>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{ACTION_META[r.action].label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{r.note}</p>
                      <p className="mt-2 text-xs text-muted">{r.by} · {new Date(r.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
