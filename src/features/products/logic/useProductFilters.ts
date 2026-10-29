import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/core/hooks/useDebounce'
import { norm } from '@/core/utils/format'
import { useSettings } from '@/features/settings/logic/settingsStore'
import type { Product } from './types'
import type { Lookups } from './useLookups'

export interface ProductFilters { keyword: string; categoryId: string; dosageFormId: string; status: string }
const EMPTY: ProductFilters = { keyword: '', categoryId: '', dosageFormId: '', status: '' }

/** Lọc + phân trang phía giao diện. Khi BE hỗ trợ, chuyển sang truyền tham số lên API. */
export function useProductFilters(products: Product[], lookups?: Lookups) {
  const { pageSize } = useSettings()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<ProductFilters>(() => ({ ...EMPTY, keyword: params.get('keyword') ?? '' }))
  const [page, setPage] = useState(1)
  const keyword = useDebounce(filters.keyword, 250)

  const filtered = useMemo(() => {
    const k = norm(keyword.trim())
    return products
      .filter((p) =>
        (!filters.categoryId || String(p.categoryId) === filters.categoryId) &&
        (!filters.dosageFormId || String(p.dosageFormId) === filters.dosageFormId) &&
        (!filters.status || p.status === filters.status) &&
        (!k || norm(`${p.code} ${p.name} ${p.activeIngredients} ${p.registrationNo} ${p.regulation} ${lookups?.dosageName(p.dosageFormId) ?? ''} ${lookups?.categoryName(p.categoryId) ?? ''}`).includes(k)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [products, keyword, filters.categoryId, filters.dosageFormId, filters.status, lookups])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = Object.values(filters).some(Boolean)

  return {
    filters, filtered, pageItems, totalPages, pageSize, page: current, hasFilter, setPage,
    setFilter: (key: keyof ProductFilters, value: string) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1) },
    reset: () => { setFilters(EMPTY); setPage(1) },
  }
}
