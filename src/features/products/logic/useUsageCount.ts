import { useMemo } from 'react'
import { useProducts } from './useProducts'

/** Đếm số sản phẩm theo dạng bào chế / phân loại (hiển thị trên thẻ) */
export function useUsageCount(field: 'dosageFormId' | 'categoryId') {
  const { data = [] } = useProducts()
  return useMemo(() => {
    const m: Record<number, number> = {}
    data.forEach((p) => { m[p[field]] = (m[p[field]] ?? 0) + 1 })
    return m
  }, [data, field])
}
