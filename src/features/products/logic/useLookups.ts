import { useMemo } from 'react'
import { useCategories } from '@/features/categories/logic/categories'
import { useDosageForms } from '@/features/dosage-forms/logic/dosageForms'

/** Tra tên Dạng bào chế / Phân loại theo id (dùng ở nhiều trang) */
export function useLookups() {
  const df = useDosageForms()
  const cat = useCategories()
  const dosageForms = useMemo(() => df.data ?? [], [df.data])
  const categories = useMemo(() => cat.data ?? [], [cat.data])
  return useMemo(() => {
    const dMap = new Map(dosageForms.map((d) => [d.id, d.name]))
    const cMap = new Map(categories.map((c) => [c.id, c.name]))
    return {
      dosageForms, categories,
      dosageName: (id: number) => dMap.get(id) ?? '—',
      categoryName: (id: number) => cMap.get(id) ?? '—',
    }
  }, [dosageForms, categories])
}
export type Lookups = ReturnType<typeof useLookups>
