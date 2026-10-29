import { Badge } from '@/core/components/Badge'
import { STATUS_META } from '../logic/constants'
import type { ProductStatus } from '../logic/types'

export function StatusBadge({ status }: { status: ProductStatus }) {
  const m = STATUS_META[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}
