import { roleMeta, type RoleKey } from '@/core/auth/roles'
import {
  APPROVAL_STATUS_META, type DocGroup, type ProductVersion, type VersionApprovalStatus, type VersionChange,
} from './types'

/** Chuẩn hóa dữ liệu cũ từng dùng khóa level1_pending/level2_pending. */
function normalizeStatus(value: unknown): VersionApprovalStatus | null {
  if (value === 'level1_pending') return 'processing'
  if (value === 'level2_pending') return 'pending'
  if (value === 'processing' || value === 'pending' || value === 'approved' || value === 'rejected') return value
  return null
}

/** Trạng thái xử lý của phiên bản; dữ liệu cũ chưa có field sẽ được suy ra từ stage. */
export function approvalStatusOf(version: ProductVersion): VersionApprovalStatus {
  const normalized = normalizeStatus(version.approvalStatus)
  if (normalized) return normalized
  return version.stage === 'coming_soon' ? 'processing' : 'approved'
}

export function approvalMetaOf(version: ProductVersion) {
  return APPROVAL_STATUS_META[approvalStatusOf(version)]
}

export function isPendingApproval(version: ProductVersion) {
  const status = approvalStatusOf(version)
  return status === 'processing' || status === 'pending'
}

/** Hồ sơ chỉ mở xem sau khi tổ phụ trách đã xử lý xong bước "Đang chờ xử lý". */
export function canOpenDossier(version: ProductVersion) {
  return approvalStatusOf(version) !== 'processing'
}

/* ------------------------------------------------------------------ */
/* Điều phối hồ sơ theo vai trò                                        */
/* ------------------------------------------------------------------ */

const FIELD_ROLE: Record<string, RoleKey> = {
  'Số đăng ký': 'ra',
  'Quy định': 'ra',
  'Phân loại': 'ra',
  'Ngày bắt đầu hiệu lực': 'ra',
  'Ngày kết thúc hiệu lực': 'ra',
  'Hoạt chất & hàm lượng': 'rnd',
  'Hạn dùng': 'rnd',
  'Dạng bào chế': 'rnd',
  'Nơi sản xuất': 'rnd',
  'Cách thức sản xuất': 'rnd',
  'Tiêu chuẩn kiểm nghiệm': 'rnd',
  'Quy cách đóng gói': 'design',
  'Tờ hướng dẫn sử dụng': 'design',
  'Hướng dẫn sử dụng': 'design',
}

const ROLE_PRIORITY: RoleKey[] = ['ra', 'rnd', 'design']

/**
 * Suy ra tổ phụ trách từ nội dung thay đổi.
 * Ưu tiên RA nếu có thay đổi pháp lý/đăng ký, sau đó R&D với công thức/kỹ thuật,
 * cuối cùng là Thiết kế với bao bì/nhãn.
 */
export function inferRoleScope(
  changes: VersionChange[],
  docGroups: DocGroup[] = [],
): { primary: RoleKey; collaborators: RoleKey[] } {
  const roles = new Set<RoleKey>()
  changes.forEach((change) => {
    const role = FIELD_ROLE[change.field]
    if (role) roles.add(role)
  })
  docGroups.forEach((group) => {
    if (group === 'legal') roles.add('ra')
    else if (group === 'professional') roles.add('rnd')
    else if (group === 'usage' || group === 'packaging') roles.add('design')
  })
  const primary = ROLE_PRIORITY.find((role) => roles.has(role)) ?? 'ra'
  return { primary, collaborators: ROLE_PRIORITY.filter((role) => role !== primary && roles.has(role)) }
}

export function assignedRoleOf(version: ProductVersion): RoleKey {
  return version.assignedRole ?? inferRoleScope(version.changes, version.extraDocs?.map((doc) => doc.group)).primary
}

export function collaboratorRolesOf(version: ProductVersion): RoleKey[] {
  if (version.collaboratorRoles?.length) return version.collaboratorRoles
  const { primary, collaborators } = inferRoleScope(version.changes, version.extraDocs?.map((doc) => doc.group))
  if (version.assignedRole && version.assignedRole !== primary) return []
  return collaborators
}

/** Tổ phê duyệt cuối – mặc định Tổ ĐK Thuốc. */
export function approverRoleOf(version: ProductVersion): RoleKey {
  return version.approverRole ?? 'ra'
}

export function rejectedByRoleOf(version: ProductVersion): RoleKey | null {
  if (approvalStatusOf(version) !== 'rejected') return null
  return version.rejectedByRole ?? assignedRoleOf(version)
}

/** Vai trò hiện tại có được duyệt/từ chối hồ sơ hay không (không phân cấp duyệt). */
export function canRoleAct(version: ProductVersion, role: RoleKey) {
  const status = approvalStatusOf(version)
  if (status === 'processing') return role === assignedRoleOf(version)
  if (status === 'pending') return role === approverRoleOf(version)
  return false
}

/** Vai trò hiện tại có được cập nhật và gửi lại hồ sơ bị từ chối hay không. */
export function canRoleResubmit(version: ProductVersion, role: RoleKey) {
  return approvalStatusOf(version) === 'rejected' && role !== 'commercial'
}

/** Nhãn mô tả hồ sơ đang nằm ở tổ nào. */
export function roleTaskLabel(version: ProductVersion) {
  const status = approvalStatusOf(version)
  if (status === 'processing') return `Gửi đến ${roleMeta(assignedRoleOf(version)).name}`
  if (status === 'pending') return `Chờ ${roleMeta(approverRoleOf(version)).name} phê duyệt`
  if (status === 'rejected') return `${roleMeta(rejectedByRoleOf(version)).name} từ chối`
  return `Phụ trách: ${roleMeta(assignedRoleOf(version)).name}`
}

/** Nhãn trạng thái hiển thị trong vòng đời phiên bản. */
export function lifecycleLabelOf(version: ProductVersion) {
  if (version.stage === 'current') return 'Đang lưu hành'
  if (version.stage === 'archived') return 'Lưu trữ'
  const status = approvalStatusOf(version)
  if (status === 'rejected') return 'Từ chối'
  if (status === 'approved') return 'Đã duyệt'
  return 'Đang chờ duyệt'
}

export function lifecycleToneOf(version: ProductVersion): 'blue' | 'green' | 'amber' | 'red' | 'gray' {
  if (version.stage === 'current') return 'blue'
  if (version.stage === 'archived') return 'gray'
  return APPROVAL_STATUS_META[approvalStatusOf(version)].tone
}

/**
 * Căn cứ pháp lý gợi ý theo từng hạng mục kỹ thuật.
 * Dữ liệu mẫu phục vụ bản FE-first; khi vận hành chính thức cần đối chiếu danh mục
 * văn bản pháp lý hiện hành của Cục Quản lý Dược và cấu hình lại tại đây.
 */
export const LEGAL_BASIS_BY_FIELD: Record<string, string> = {
  'Hoạt chất & hàm lượng': 'Thông tư 08/2022/TT-BYT – Hồ sơ đăng ký thuốc (sửa đổi Thông tư 44/2014/TT-BYT)',
  'Quy cách đóng gói': 'Thông tư 43/2014/TT-BYT – Quy định về ghi nhãn thuốc',
  'Hạn dùng': 'Thông tư 08/2022/TT-BYT – Hồ sơ đăng ký thuốc và tiêu chuẩn chất lượng',
  'Quy định': 'Luật Dược số 105/2016/QH13 – Phân loại thuốc và điều kiện kinh doanh',
  'Nơi sản xuất': 'Thông tư 36/2018/TT-BYT – Thực hành tốt sản xuất thuốc (GMP)',
  'Cách thức sản xuất': 'Thông tư 36/2018/TT-BYT – Thực hành tốt sản xuất thuốc (GMP)',
  'Số đăng ký': 'Luật Dược số 105/2016/QH13 – Đăng ký lưu hành thuốc',
  'Tờ hướng dẫn sử dụng': 'Thông tư 43/2014/TT-BYT – Quy định về ghi nhãn thuốc',
  'Hướng dẫn sử dụng': 'Thông tư 43/2014/TT-BYT – Quy định về ghi nhãn thuốc',
  'Tiêu chuẩn kiểm nghiệm': 'Thông tư 08/2022/TT-BYT – Tiêu chuẩn chất lượng thuốc',
  'Dạng bào chế': 'Thông tư 08/2022/TT-BYT – Hồ sơ đăng ký thuốc',
  'Phân loại': 'Luật Dược số 105/2016/QH13 – Phân loại thuốc',
}

export function legalBasisForChange(change: VersionChange) {
  return change.legalBasis || LEGAL_BASIS_BY_FIELD[change.field] || 'Cục Quản lý Dược – Hồ sơ đăng ký thuốc đã được phê duyệt'
}

export function changeTone(kind: VersionChange['kind']) {
  if (kind === 'added') return { label: 'Bổ sung', cls: 'bg-emerald-100 text-emerald-800' }
  if (kind === 'removed') return { label: 'Loại bỏ', cls: 'bg-red-100 text-red-700' }
  return { label: 'Cập nhật', cls: 'bg-brand-100 text-brand-800' }
}
