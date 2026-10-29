import { motion } from 'framer-motion'
import { BadgeCheck, FileEdit, Hourglass, Package } from 'lucide-react'
import { useMemo } from 'react'
import type { Product } from '../logic/types'

export function ProductStats({ products }: { products: Product[] }) {
  const items = useMemo(() => {
    const c = (s: string) => products.filter((p) => p.status === s).length
    return [
      { label: 'Tổng sản phẩm', value: products.length, icon: Package, tone: 'from-brand-500 to-brand-700' },
      { label: 'Đã duyệt', value: c('approved'), icon: BadgeCheck, tone: 'from-emerald-500 to-emerald-700' },
      { label: 'Chờ duyệt', value: c('pending'), icon: Hourglass, tone: 'from-amber-400 to-amber-600' },
      { label: 'Nháp / Từ chối', value: c('draft') + c('rejected'), icon: FileEdit, tone: 'from-slate-400 to-slate-600' },
    ]
  }, [products])

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }, i) => (
        <motion.div
          key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft"
        >
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br ${tone} text-white`}><Icon className="size-5" /></span>
          <div>
            <p className="text-2xl font-extrabold leading-none text-brand-900">{value}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
