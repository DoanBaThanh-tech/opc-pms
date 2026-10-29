import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { versionApi } from './versionApi'
import type { CreateVersionInput } from './types'

const key = (productId: number) => ['product-versions', productId]

export function useProductVersions(productId: number) {
  return useQuery({
    queryKey: key(productId),
    queryFn: () => versionApi.list(productId),
    enabled: productId > 0,
  })
}

function useRefresh(productId: number) {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: key(productId) }),
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['history'] }),
    ])
}

export function useCreateVersion(productId: number) {
  const refresh = useRefresh(productId)
  return useMutation({
    mutationFn: (input: CreateVersionInput) => versionApi.create(productId, input),
    onSuccess: refresh,
  })
}

export function useActivateVersion(productId: number) {
  const refresh = useRefresh(productId)
  return useMutation({
    mutationFn: (versionId: number) => versionApi.activate(productId, versionId),
    onSuccess: refresh,
  })
}
