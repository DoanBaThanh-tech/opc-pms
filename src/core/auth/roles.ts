/**
 * Mô hình 4 vai trò của hệ thống OPC PMS.
 * Ma trận quyền bám theo bảng "Ma Trận Thao Tác Chi Tiết (Role–Permission Matrix)".
 * Lưu ý nghiệp vụ: hồ sơ phiên bản mới được gửi tự động tới tổ phụ trách nội dung thay đổi;
 * sau khi tổ phụ trách duyệt, hồ sơ chuyển sang "Chờ duyệt" và Tổ ĐK Thuốc là vai trò phê duyệt cuối.
 */

export type RoleKey = 'ra' | 'design' | 'rnd' | 'commercial'
export type RoleTone = 'blue' | 'green' | 'amber' | 'gray'

export interface RoleMeta {
  key: RoleKey
  name: string
  short: string
  team: string
  description: string
  tone: RoleTone
  /** Có được ký số trong quy trình GxP hay không. */
  canSign: boolean
}

export const ROLE_ORDER: RoleKey[] = ['ra', 'design', 'rnd', 'commercial']

export const ROLES: Record<RoleKey, RoleMeta> = {
  ra: {
    key: 'ra',
    name: 'Tổ ĐK Thuốc',
    short: 'RA',
    team: 'RA Team',
    tone: 'blue',
    canSign: true,
    description: 'Chủ trì hồ sơ pháp lý, số đăng ký, kiểm duyệt maquette/nhãn và phê duyệt cuối hồ sơ phiên bản.',
  },
  design: {
    key: 'design',
    name: 'Tổ Thiết kế',
    short: 'Thiết kế',
    team: 'Artwork Team',
    tone: 'green',
    canSign: true,
    description: 'Chủ trì maquette, đồ họa bao bì, mã QR/GS1 và tệp in ấn; ký xác nhận maquette.',
  },
  rnd: {
    key: 'rnd',
    name: 'Tổ Bào chế',
    short: 'Bào chế',
    team: 'R&D Team',
    tone: 'amber',
    canSign: true,
    description: 'Chủ trì công thức, tá dược, tiêu chuẩn và hồ sơ kỹ thuật; ký chuyên môn R&D.',
  },
  commercial: {
    key: 'commercial',
    name: 'Tổ Kinh doanh',
    short: 'Kinh doanh',
    team: 'Commercial Team',
    tone: 'gray',
    canSign: false,
    description: 'Tra cứu, theo dõi bản đã duyệt và tải tài liệu bản tham khảo có watermark; không tham gia ký duyệt.',
  },
}

export const DEFAULT_ROLE: RoleKey = 'ra'

export function isRoleKey(value: string | null | undefined): value is RoleKey {
  return value === 'ra' || value === 'design' || value === 'rnd' || value === 'commercial'
}

export function roleMeta(key: string | null | undefined): RoleMeta {
  return ROLES[isRoleKey(key) ? key : DEFAULT_ROLE]
}

export function roleName(key: string | null | undefined) {
  return roleMeta(key).name
}

/* ------------------------------------------------------------------ */
/* Ma trận quyền theo 8 nhóm chức năng                                  */
/* ------------------------------------------------------------------ */

export type PermissionLevel =
  | 'full'
  | 'review'
  | 'upload'
  | 'create'
  | 'view'
  | 'viewDossier'
  | 'viewApproved'
  | 'viewCompare'
  | 'viewText'
  | 'viewSummary'
  | 'viewWatermark'
  | 'locked'
  | 'none'
  | 'notNeeded'
  | 'hidden'
  | 'lookup'
  | 'signRa'
  | 'signMaquette'
  | 'signRnd'
  | 'noSign'
  | 'downloadOriginal'
  | 'downloadPrint'
  | 'downloadTechnical'
  | 'downloadWatermark'

export interface PermissionMeta {
  label: string
  tone: RoleTone
}

export const PERMISSIONS: Record<PermissionLevel, PermissionMeta> = {
  full: { label: 'Toàn quyền', tone: 'green' },
  review: { label: 'Kiểm duyệt', tone: 'blue' },
  upload: { label: 'Upload & sửa', tone: 'green' },
  create: { label: 'Tạo mã', tone: 'green' },
  view: { label: 'Chỉ xem', tone: 'blue' },
  viewDossier: { label: 'Xem hồ sơ', tone: 'blue' },
  viewApproved: { label: 'Xem bản duyệt', tone: 'blue' },
  viewCompare: { label: 'Xem đối chiếu', tone: 'blue' },
  viewText: { label: 'Xem nội dung chữ', tone: 'blue' },
  viewSummary: { label: 'Xem tóm tắt', tone: 'blue' },
  viewWatermark: { label: 'Xem (watermark)', tone: 'blue' },
  locked: { label: 'Bị khóa', tone: 'gray' },
  none: { label: 'Không cấp quyền', tone: 'gray' },
  notNeeded: { label: 'Không cần thiết', tone: 'gray' },
  hidden: { label: 'Ẩn nội bộ', tone: 'gray' },
  lookup: { label: 'Tra cứu / quét thử', tone: 'amber' },
  signRa: { label: 'Ký bước 1 (RA Lead)', tone: 'green' },
  signMaquette: { label: 'Ký xác nhận maquette', tone: 'green' },
  signRnd: { label: 'Ký chuyên môn R&D', tone: 'green' },
  noSign: { label: 'Không được ký', tone: 'gray' },
  downloadOriginal: { label: 'Toàn quyền tải gốc', tone: 'green' },
  downloadPrint: { label: 'Tải file in AI/PDF', tone: 'green' },
  downloadTechnical: { label: 'Tải file kỹ thuật', tone: 'green' },
  downloadWatermark: { label: 'Tải bản watermark', tone: 'amber' },
}

export interface FunctionPermission {
  key: string
  title: string
  description: string
  permissions: Record<RoleKey, PermissionLevel>
}

export const FUNCTION_MATRIX: FunctionPermission[] = [
  {
    key: 'legal',
    title: 'Cập nhật hồ sơ pháp lý & công văn Cục QLD',
    description: 'Quyết định gia hạn SĐK, công văn chấp thuận thay đổi nhãn, hồ sơ eCTD.',
    permissions: { ra: 'full', design: 'none', rnd: 'viewDossier', commercial: 'viewApproved' },
  },
  {
    key: 'registration',
    title: 'Quản lý số đăng ký & hạn dùng pháp lý',
    description: 'Cập nhật SĐK mới (VD-xxxxx-yy), thời hạn hiệu lực 5 năm, phân loại quản lý.',
    permissions: { ra: 'full', design: 'locked', rnd: 'view', commercial: 'view' },
  },
  {
    key: 'maquette',
    title: 'Cập nhật maquette design & đồ họa bao bì',
    description: 'File AI/PDF chuẩn in ấn hộp giấy, nhãn vỉ, nhãn phụ, tờ HDSD CMYK 300DPI.',
    permissions: { ra: 'review', design: 'upload', rnd: 'viewCompare', commercial: 'viewWatermark' },
  },
  {
    key: 'qr',
    title: 'Tạo mã QR & GS1 Datamatrix bao bì',
    description: 'Mã định danh GTIN, số lô tự động, cấu trúc mã vạch quét máy đọc quang học.',
    permissions: { ra: 'view', design: 'create', rnd: 'view', commercial: 'lookup' },
  },
  {
    key: 'labelDiff',
    title: 'Cập nhật file so sánh mẫu nhãn',
    description: 'Báo cáo đối chiếu thay đổi nhãn cũ/nhãn mới, rà soát cảnh báo chống chỉ định.',
    permissions: { ra: 'viewCompare', design: 'viewText', rnd: 'upload', commercial: 'hidden' },
  },
  {
    key: 'formula',
    title: 'Cập nhật công thức tá dược & tiêu chuẩn ĐĐVN',
    description: 'Bảng thành phần định lượng, tiêu chuẩn cơ sở (TCCS), báo cáo độ ổn định Zone IVb.',
    permissions: { ra: 'viewDossier', design: 'notNeeded', rnd: 'full', commercial: 'viewSummary' },
  },
  {
    key: 'esign',
    title: 'Ký số điện tử GxP (21 CFR Part 11)',
    description: 'Chứng thư số USB Token / Cloud HSM xác thực phê duyệt từng bước trước khi xuất bán.',
    permissions: { ra: 'signRa', design: 'signMaquette', rnd: 'signRnd', commercial: 'noSign' },
  },
  {
    key: 'download',
    title: 'Tra cứu & tải tài liệu đấu thầu / phân phối',
    description: 'Truy xuất SĐK, quy cách đóng gói, xuất bản PDF có watermark “Bản tham khảo”.',
    permissions: { ra: 'downloadOriginal', design: 'downloadPrint', rnd: 'downloadTechnical', commercial: 'downloadWatermark' },
  },
]

export function permissionOf(functionKey: string, role: RoleKey): PermissionMeta {
  const item = FUNCTION_MATRIX.find((f) => f.key === functionKey)
  return PERMISSIONS[item?.permissions[role] ?? 'none']
}

/* ------------------------------------------------------------------ */
/* Quyền thao tác dùng trong giao diện                                  */
/* ------------------------------------------------------------------ */

/** Tổ ĐK Thuốc phê duyệt cuối hồ sơ sau khi tổ phụ trách xử lý. */
export function isFinalApprover(role: RoleKey) {
  return role === 'ra'
}

export function canEditGeneralInfo(role: RoleKey) {
  return role === 'ra' || role === 'rnd'
}

export function canEditLegalDocs(role: RoleKey) {
  return role === 'ra'
}

export function canEditProfessionalDocs(role: RoleKey) {
  return role === 'rnd'
}

export function canEditPackaging(role: RoleKey) {
  return role === 'design' || role === 'rnd'
}

export function canEditUsageDocs(role: RoleKey) {
  return role === 'design' || role === 'ra'
}

export function canApplyVersion(role: RoleKey) {
  return role === 'ra'
}

export function canResubmitVersion(role: RoleKey) {
  return role !== 'commercial'
}

export function hasViewOnlyRole(role: RoleKey) {
  return role === 'commercial'
}
