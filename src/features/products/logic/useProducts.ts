import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi } from './productApi'
import type { ProductInput, ProductStatus } from './types'

export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: productApi.list })

function useRefresh() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['products'] }), qc.invalidateQueries({ queryKey: ['history'] })])
}

export function useSaveProduct() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ProductInput }) => (id ? productApi.update(id, input) : productApi.create(input)),
    onSuccess: refresh,
  })
}

export function useChangeStatus() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: ProductStatus; note?: string }) => productApi.changeStatus(id, status, note),
    onSuccess: refresh,
  })
}
