import { RotateCcw, Search } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Select } from '@/core/components/Select'
import type { CatalogItem } from '@/core/types/catalog'
import { STATUS_OPTIONS } from '../logic/constants'
import type { ProductFilters as Filters } from '../logic/useProductFilters'

interface Props {
  filters: Filters
  onChange: (key: keyof Filters, value: string) => void
  onReset: () => void
  hasFilter: boolean
  dosageForms: CatalogItem[]
  categories: CatalogItem[]
}

export function ProductFilters({ filters, onChange, onReset, hasFilter, dosageForms, categories }: Props) {
  const toOpts = (l: CatalogItem[]) => l.map((i) => ({ value: i.id, label: i.name }))
  return (
    <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
      <Input icon={<Search className="size-4" />} placeholder="Tìm mã, tên, hoạt chất, SĐK..." value={filters.keyword} onChange={(e) => onChange('keyword', e.target.value)} />
      <Select aria-label="Lọc theo phân loại" placeholder="Tất cả phân loại" options={toOpts(categories)} value={filters.categoryId} onChange={(e) => onChange('categoryId', e.target.value)} />
      <Select aria-label="Lọc theo dạng bào chế" placeholder="Tất cả dạng bào chế" options={toOpts(dosageForms)} value={filters.dosageFormId} onChange={(e) => onChange('dosageFormId', e.target.value)} />
      <Select aria-label="Lọc theo trạng thái" placeholder="Tất cả trạng thái" options={STATUS_OPTIONS} value={filters.status} onChange={(e) => onChange('status', e.target.value)} />
      <Button variant="ghost" icon={<RotateCcw className="size-4" />} onClick={onReset} disabled={!hasFilter}>Xóa lọc</Button>
    </div>
  )
}
