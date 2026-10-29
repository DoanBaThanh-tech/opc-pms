import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/core/utils/format'

interface Props { page: number; totalPages: number; total: number; pageSize: number; onChange: (p: number) => void }

export function Pagination({ page, totalPages, total, pageSize, onChange }: Props) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  const btn = 'grid size-9 place-items-center rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">Hiển thị <b className="text-ink">{from}–{to}</b> / {total} sản phẩm</p>
      <div className="flex items-center gap-1">
        <button className={cn(btn, 'text-muted hover:bg-brand-50')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước"><ChevronLeft className="size-4" /></button>
        <span className="px-2 text-sm font-medium sm:hidden">{page} / {totalPages}</span>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
              <button onClick={() => onChange(p)} className={cn(btn, p === page ? 'bg-brand-600 text-white shadow-soft' : 'text-ink hover:bg-brand-50')}>{p}</button>
            </span>
          ))}
        </div>
        <button className={cn(btn, 'text-muted hover:bg-brand-50')} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  )
}
