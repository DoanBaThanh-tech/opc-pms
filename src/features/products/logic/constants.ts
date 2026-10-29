import type { ProductStatus } from './types'

export const STATUS_META: Record<ProductStatus, { label: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'gray' }> = {
  draft: { label: 'Nháp', tone: 'gray' },
  pending: { label: 'Chờ duyệt', tone: 'amber' },
  approved: { label: 'Đã duyệt', tone: 'green' },
  rejected: { label: 'Từ chối', tone: 'red' },
  discontinued: { label: 'Ngừng', tone: 'gray' },
}

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as ProductStatus[]).map((s) => ({ value: s, label: STATUS_META[s].label }))

export const REGULATIONS = [
  'Thuốc kê đơn (ETC)',
  'Thuốc không kê đơn (OTC)',
  'Công bố thực phẩm chức năng',
  'Công bố mỹ phẩm',
  'Tiêu chuẩn cơ sở',
].map((r) => ({ value: r, label: r }))
