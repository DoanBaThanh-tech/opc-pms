import type { RoleKey } from '@/core/auth/roles'

/** Phiên bản hồ sơ sản phẩm – dữ liệu hiển thị ở trang chi tiết. */
export type VersionStage = 'current' | 'coming_soon' | 'archived'
export type ChangeKind = 'added' | 'updated' | 'removed'

/**
 * Trạng thái xử lý hồ sơ phiên bản theo vai trò (không chia cấp duyệt):
 * - processing: đã gửi tự động tới tổ phụ trách, chờ tổ đó duyệt/từ chối.
 * - pending: tổ phụ trách đã duyệt, chờ Tổ ĐK Thuốc phê duyệt cuối.
 * - approved: hoàn tất phê duyệt, hồ sơ được ký xác thực.
 * - rejected: bị từ chối, cần cập nhật và gửi lại.
 */
export type VersionApprovalStatus = 'processing' | 'pending' | 'approved' | 'rejected'

export interface VersionChange {
  field: string
  before?: string
  after?: string
  kind: ChangeKind
  /** Căn cứ pháp lý/y dược áp dụng cho hạng mục thay đổi. */
  legalBasis?: string
}

export interface ProductVersion {
  id: number
  productId: number
  version: string
  /** Phiên bản được dùng làm mốc so sánh khi tạo mới (nếu có). */
  basedOnVersion?: string
  stage: VersionStage
  /** Trạng thái xử lý hồ sơ theo vai trò. Phiên bản mới luôn bắt đầu ở processing. */
  approvalStatus?: VersionApprovalStatus
  /** Tổ phụ trách xử lý hồ sơ – được suy ra từ nội dung thay đổi nếu chưa có. */
  assignedRole?: RoleKey
  /** Các tổ phối hợp xử lý (nếu hồ sơ chạm nhiều nhóm nội dung). */
  collaboratorRoles?: RoleKey[]
  assignedAt?: string
  /** Tổ đã xử lý hồ sơ ở bước "Đang chờ xử lý". */
  processedByRole?: RoleKey
  processedAt?: string
  /** Tổ phê duyệt cuối – mặc định Tổ ĐK Thuốc. */
  approverRole?: RoleKey
  approvedByRole?: RoleKey
  rejectedByRole?: RoleKey
  rejectedReason?: string
  rejectedAt?: string
  effectiveDate: string
  /** Ngày kết thúc hiệu lực của phiên bản (nếu chưa có sẽ suy ra 24 tháng từ ngày bắt đầu). */
  effectiveEndDate?: string
  /** Không giới hạn ngày kết thúc – dùng tới khi có phiên bản thay thế. */
  indefinite?: boolean
  updatedAt: string
  summary: string
  /** Ghi chú thay đổi do người tạo phiên bản nhập. */
  changeNote?: string
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
  /** Thời điểm hoàn tất ký xác thực hồ sơ (sau khi Tổ ĐK Thuốc phê duyệt cuối). */
  signedAt?: string
  /** Thời điểm phiên bản được áp dụng thực tế. */
  appliedAt?: string
  /** Danh sách quy cách đóng gói của phiên bản (nếu chưa có sẽ sinh từ dữ liệu phiên bản). */
  packagingSpecs?: PackagingSpec[]
  /** Tài liệu người dùng tải lên cho riêng phiên bản này. */
  extraDocs?: VersionDocument[]
}

export type DocGroup = 'legal' | 'usage' | 'packaging' | 'professional'
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
  /** HDSD dùng chung – chỉ hiển thị ở khung Hồ sơ chuyên môn & HDSD dùng chung. */
  shared?: boolean
  /** Tài liệu do người dùng tải lên (khác với tài liệu sinh tự động). */
  uploaded?: boolean
  fileName?: string
  /** Đã được ký xác thực sau khi hồ sơ hoàn tất phê duyệt. */
  verified?: boolean
}

/** Ảnh chụp thực tế lưu trên cloud; database chỉ giữ ID/tham chiếu. */
export type PackagingPhoto = import('@/core/media/cloudMedia').MediaRef

/** Một quy cách đóng gói – mỗi quy cách có STT, hồ sơ kỹ thuật và ảnh chụp. */
export interface PackagingSpec {
  id: string
  name: string
  note?: string
  technicalDoc: VersionDocument
  photo?: PackagingPhoto
}

export interface CreateVersionInput {
  version: string
  effectiveDate: string
  endDate: string
  indefinite?: boolean
  activeIngredients: string
  dosageFormId: number
  categoryId: number
  packaging: string
  shelfLife: string
  regulation: string
  manufacturer: string
  manufacturingMethod: string
  summary: string
  customChanges: VersionChange[]
  /** Dữ liệu đã chuẩn bị trên trang nháp. */
  extraDocs?: VersionDocument[]
  packagingSpecs?: PackagingSpec[]
}

export interface UpdateVersionInfoInput {
  version: string
  effectiveDate: string
  endDate: string
  indefinite?: boolean
  activeIngredients: string
  dosageFormId: number
  categoryId: number
  packaging: string
  shelfLife: string
  regulation: string
  manufacturer: string
  manufacturingMethod: string
  summary: string
}

export interface DocumentUploadInput {
  name: string
  code: string
  format: DocFormat
  sizeKb: number
  pages: number
  note?: string
  group: DocGroup
  shared?: boolean
  fileName?: string
}

export const STAGE_ORDER: Record<VersionStage, number> = { coming_soon: 0, current: 1, archived: 2 }

export const STAGE_META: Record<VersionStage, { label: string; short: string; tone: 'amber' | 'blue' | 'gray'; description: string }> = {
  coming_soon: {
    label: 'Đang chờ duyệt', short: 'Chờ duyệt', tone: 'amber',
    description: 'Hồ sơ đã được tạo nhưng chưa đưa vào sử dụng.',
  },
  current: {
    label: 'Đang lưu hành', short: 'Lưu hành', tone: 'blue',
    description: 'Phiên bản đang được sử dụng chính thức.',
  },
  archived: {
    label: 'Lưu trữ', short: 'Phiên bản cũ', tone: 'gray',
    description: 'Phiên bản cũ, chỉ xem và không thể áp dụng lại.',
  },
}

/** Nhãn trạng thái cho quy trình duyệt 2 cấp. */
export const APPROVAL_STATUS_META: Record<VersionApprovalStatus, {
  label: string
  short: string
  tone: 'amber' | 'blue' | 'green' | 'red'
  description: string
}> = {
  processing: {
    label: 'Đang chờ xử lý', short: 'Chờ xử lý', tone: 'amber',
    description: 'Hồ sơ đã được gửi tự động tới tổ phụ trách nội dung thay đổi để duyệt hoặc từ chối.',
  },
  pending: {
    label: 'Chờ duyệt', short: 'Chờ duyệt', tone: 'blue',
    description: 'Tổ phụ trách đã xử lý, hồ sơ đang chờ Tổ ĐK Thuốc phê duyệt cuối.',
  },
  approved: {
    label: 'Đã duyệt', short: 'Hoàn tất', tone: 'green',
    description: 'Hồ sơ đã hoàn tất phê duyệt và được ký xác thực, sẵn sàng đưa vào lưu hành.',
  },
  rejected: {
    label: 'Từ chối', short: 'Từ chối', tone: 'red',
    description: 'Hồ sơ bị từ chối, cần cập nhật nội dung và gửi lại tổ phụ trách.',
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
  professional: { title: 'Hồ sơ chuyên môn & HDSD dùng chung', short: 'Chuyên môn' },
}
