/** Phiên bản hồ sơ sản phẩm – dữ liệu hiển thị ở trang chi tiết. */
export type VersionStage = 'current' | 'coming_soon' | 'archived'
export type ChangeKind = 'added' | 'updated' | 'removed'

export interface VersionChange {
  field: string
  before?: string
  after?: string
  kind: ChangeKind
}

export interface ProductVersion {
  id: number
  productId: number
  version: string
  /** Phiên bản được dùng làm mốc so sánh khi tạo mới (nếu có). */
  basedOnVersion?: string
  stage: VersionStage
  effectiveDate: string
  updatedAt: string
  summary: string
  changes: VersionChange[]
  manufacturer: string
  manufacturingMethod: string
  registrationNo: string
  packaging: string
  shelfLife: string
  regulation: string
  dosageFormId: number
  categoryId: number
  activeIngredients: string
  approvalNo: string
  approvedBy: string
}

export type DocGroup = 'legal' | 'usage' | 'packaging'
export type DocFormat = 'pdf' | 'docx' | 'xlsx'
export type DocStatus = 'valid' | 'superseded' | 'draft'

export interface VersionDocument {
  id: string
  group: DocGroup
  name: string
  code: string
  format: DocFormat
  sizeKb: number
  pages: number
  updatedAt: string
  status: DocStatus
  note?: string
}

export interface CreateVersionInput {
  version: string
  effectiveDate: string
  activeIngredients: string
  packaging: string
  shelfLife: string
  summary: string
  customChanges: VersionChange[]
}

export const STAGE_ORDER: Record<VersionStage, number> = { coming_soon: 0, current: 1, archived: 2 }

export const STAGE_META: Record<VersionStage, { label: string; short: string; tone: 'amber' | 'blue' | 'gray'; description: string }> = {
  coming_soon: {
    label: 'Coming soon', short: 'Sắp áp dụng', tone: 'amber',
    description: 'Hồ sơ đã được tải lên nhưng chưa đưa vào sử dụng.',
  },
  current: {
    label: 'Hiện hành', short: 'Đang áp dụng', tone: 'blue',
    description: 'Phiên bản đang được sử dụng chính thức.',
  },
  archived: {
    label: 'Lưu trữ', short: 'Phiên bản cũ', tone: 'gray',
    description: 'Phiên bản cũ, chỉ xem và không thể áp dụng lại.',
  },
}

export const DOC_STATUS_META: Record<DocStatus, { label: string; tone: 'green' | 'gray' | 'amber' }> = {
  valid: { label: 'Còn hiệu lực', tone: 'green' },
  superseded: { label: 'Đã thay thế', tone: 'gray' },
  draft: { label: 'Bản xem trước', tone: 'amber' },
}

export const DOC_GROUP_META: Record<DocGroup, { title: string; short: string }> = {
  legal: { title: 'Hồ sơ pháp lý & quyết định phê duyệt', short: 'Pháp lý' },
  usage: { title: 'Hồ sơ hướng dẫn sử dụng & so sánh phiên bản', short: 'Hướng dẫn' },
  packaging: { title: 'Quy cách đóng gói & hồ sơ kỹ thuật', short: 'Kỹ thuật' },
}
