import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { cn } from '@/core/utils/format'

export interface Column<T> {
  key: string
  header: string
  render: (row: T, index: number) => ReactNode
  className?: string
  /** Ẩn cột này khi hiển thị dạng thẻ trên mobile */
  hideOnCard?: boolean
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: T) => void
}

/** Desktop/tablet: bảng cuộn ngang. Mobile: mỗi dòng thành một thẻ. */
export function DataTable<T>({ data, columns, rowKey, loading, emptyText = 'Chưa có dữ liệu', onRowClick }: Props<T>) {
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-200 bg-white/70 py-16 text-muted">
        <Inbox className="size-10 text-brand-300" />
        <p className="text-sm font-medium">{emptyText}</p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row, i) => (
          <motion.div
            key={rowKey(row)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}
            onClick={() => onRowClick?.(row)}
            className={cn('rounded-2xl border border-line bg-white p-4 shadow-soft', onRowClick && 'cursor-pointer transition hover:border-brand-200')}
          >
            <dl className="space-y-2">
              {columns.filter((c) => !c.hideOnCard).map((c) => (
                <div key={c.key} className="flex justify-between gap-4 text-sm">
                  <dt className="shrink-0 text-muted">{c.header}</dt>
                  <dd className="text-right font-medium">{c.render(row, i)}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="bg-brand-50/80 text-xs uppercase tracking-wide text-brand-800">
              {columns.map((c) => <th key={c.key} className={cn('px-4 py-3 font-semibold', c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn('transition hover:bg-brand-50/50', onRowClick && 'cursor-pointer')}
              >
                {columns.map((c) => <td key={c.key} className={cn('px-4 py-3 align-top', c.className)}>{c.render(row, i)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
