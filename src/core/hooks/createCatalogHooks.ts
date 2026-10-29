import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { createCatalogApi } from '@/core/api/catalogApi'
import type { CatalogInput } from '@/core/types/catalog'

type Api = ReturnType<typeof createCatalogApi>

export function createCatalogHooks(key: string, api: Api) {
  const useList = () => useQuery({ queryKey: [key], queryFn: api.list })
  const useSave = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, input }: { id?: number; input: CatalogInput }) => (id ? api.update(id, input) : api.create(input)),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }
  const useRemove = () => {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.remove, onSuccess: () => qc.invalidateQueries({ queryKey: [key] }) })
  }
  return { useList, useSave, useRemove }
}

export type CatalogHooks = ReturnType<typeof createCatalogHooks>
