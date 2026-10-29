import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { versionApi } from './versionApi'
import type { CreateVersionInput, PackagingSpec, UpdateVersionInfoInput, VersionDocument } from './types'

const key = (productId: number) => ['product-versions', productId]
const pendingKey = ['pending-versions'] as const

export function useProductVersions(productId: number) {
  return useQuery({
    queryKey: key(productId),
    queryFn: () => versionApi.list(productId),
    enabled: productId > 0,
  })
}

/** Các phiên bản mới tạo đang chờ duyệt trên toàn hệ thống. */
export function usePendingVersions() {
  return useQuery({
    queryKey: pendingKey,
    queryFn: () => versionApi.listPendingApprovals(),
  })
}

function useRefresh(productId: number) {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: key(productId) }),
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['history'] }),
      qc.invalidateQueries({ queryKey: pendingKey }),
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

export function useSavePackagingSpecs(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ versionId, specs }: { versionId: number; specs: PackagingSpec[] }) =>
      versionApi.savePackagingSpecs(productId, versionId, specs),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: key(productId) }),
      qc.invalidateQueries({ queryKey: pendingKey }),
    ]),
  })
}

export function useUpdateVersionInfo(productId: number) {
  const refresh = useRefresh(productId)
  return useMutation({
    mutationFn: ({ versionId, input }: { versionId: number; input: UpdateVersionInfoInput }) =>
      versionApi.updateInfo(productId, versionId, input),
    onSuccess: refresh,
  })
}

export function useSaveVersionDocs(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ versionId, docs }: { versionId: number; docs: VersionDocument[] }) =>
      versionApi.saveExtraDocs(productId, versionId, docs),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: key(productId) }),
      qc.invalidateQueries({ queryKey: pendingKey }),
    ]),
  })
}
