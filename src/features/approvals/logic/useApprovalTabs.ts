import { useMemo, useState } from 'react'
import type { Product } from '@/features/products/logic/types'

export type ApprovalTab = 'pending' | 'processing' | 'approved' | 'rejected'
export const APPROVAL_TABS: { key: ApprovalTab; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'processing', label: 'Đang chờ xử lý' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
]

export function useApprovalTabs(products: Product[]) {
  const [tab, setTab] = useState<ApprovalTab>('pending')
  const counts = useMemo(() => ({
    pending: products.filter((p) => p.status === 'pending').length,
    processing: 0,
    approved: products.filter((p) => p.status === 'approved').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  }), [products])
  const items = useMemo(
    () => tab === 'processing'
      ? []
      : products.filter((p) => p.status === tab).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [products, tab],
  )
  return { tab, setTab, counts, items }
}
