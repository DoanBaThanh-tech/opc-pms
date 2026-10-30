import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentRole } from '@/core/auth/roleStore'
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

/** Các phiên bản đang trong hàng đợi xử lý (chờ xử lý, chờ duyệt, đã duyệt và từ chối). */
export function useApprovalVersions() {
  return useQuery({
    queryKey: pendingKey,
    queryFn: () => versionApi.listApprovalVersions(),
  })
}

/** Giữ tên cũ để tương thích với các màn hình đang dùng. */
export function usePendingVersions() {
  return useApprovalVersions()
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
  const role = useCurrentRole()
  return useMutation({
    mutationFn: (versionId: number) => versionApi.activate(productId, versionId, role),
    onSuccess: refresh,
  })
}

export function useApproveVersion(productId: number) {
  const refresh = useRefresh(productId)
  const role = useCurrentRole()
  return useMutation({
    mutationFn: (versionId: number) => versionApi.approve(productId, versionId, role),
    onSuccess: refresh,
  })
}

export function useRejectVersion(productId: number) {
  const refresh = useRefresh(productId)
  const role = useCurrentRole()
  return useMutation({
    mutationFn: ({ versionId, reason }: { versionId: number; reason: string }) =>
      versionApi.reject(productId, versionId, reason, role),
    onSuccess: refresh,
  })
}

export function useResubmitVersion(productId: number) {
  const refresh = useRefresh(productId)
  const role = useCurrentRole()
  return useMutation({
    mutationFn: (versionId: number) => versionApi.resubmit(productId, versionId, role),
    onSuccess: refresh,
  })
}

export function useSetVersionIndefinite(productId: number) {
  const refresh = useRefresh(productId)
  return useMutation({
    mutationFn: ({ versionId, indefinite }: { versionId: number; indefinite: boolean }) =>
      versionApi.setIndefinite(productId, versionId, indefinite),
    onSuccess: refresh,
  })
}

export function useApplyVersionNow(productId: number) {
  const refresh = useRefresh(productId)
  const role = useCurrentRole()
  return useMutation({
    mutationFn: (versionId: number) => versionApi.applyNow(productId, versionId, role),
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
