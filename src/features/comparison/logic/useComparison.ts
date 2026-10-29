import { useMemo, useState } from 'react'
import { formatDate } from '@/core/utils/format'
import { STATUS_META } from '@/features/products/logic/constants'
import type { Product } from '@/features/products/logic/types'
import type { Lookups } from '@/features/products/logic/useLookups'

export interface CompareRow { label: string; values: string[]; different: boolean }

export function useComparison(products: Product[], l: Lookups) {
  const [ids, setIds] = useState<string[]>(['', '', ''])
  const [onlyDiff, setOnlyDiff] = useState(false)

  const selected = useMemo(
    () => ids.map((id) => products.find((p) => String(p.id) === id)).filter((p): p is Product => !!p),
    [ids, products],
  )

  const rows = useMemo<CompareRow[]>(() => {
    const defs: [string, (p: Product) => string][] = [
      ['Mã SP', (p) => p.code],
      ['Phiên bản', (p) => p.version],
      ['Dạng bào chế', (p) => l.dosageName(p.dosageFormId)],
      ['Phân loại', (p) => l.categoryName(p.categoryId)],
      ['Hoạt chất & Hàm lượng', (p) => p.activeIngredients],
      ['Quy định', (p) => p.regulation],
      ['Quy cách đóng gói', (p) => p.packaging || '—'],
      ['Số đăng ký', (p) => p.registrationNo || '—'],
      ['Hạn dùng', (p) => p.shelfLife || '—'],
      ['Trạng thái', (p) => STATUS_META[p.status].label],
      ['Cập nhật', (p) => formatDate(p.updatedAt)],
    ]
    const all = defs.map(([label, get]) => {
      const values = selected.map(get)
      return { label, values, different: new Set(values).size > 1 }
    })
    return onlyDiff ? all.filter((r) => r.different) : all
  }, [selected, l, onlyDiff])

  return {
    ids, selected, rows, onlyDiff, setOnlyDiff,
    setSlot: (slot: number, id: string) => setIds((s) => s.map((v, i) => (i === slot ? id : v))),
  }
}
