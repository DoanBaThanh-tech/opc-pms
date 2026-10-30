import type { Product } from '@/features/products/logic/types'
import { seedProducts } from '@/features/products/logic/seed'
import { buildPackagingSpecs } from './packagingSpecs'
import type { ProductVersion, VersionChange } from './types'
import { addMonths } from './versionUtils'

const SITES: Record<number, { manufacturer: string; manufacturingMethod: string }> = {
  1: {
    manufacturer: 'Nhà máy sản xuất OPC – 1017 Tân Kỳ Tân Quý, Q. Tân Phú, TP.HCM',
    manufacturingMethod: 'Chiết xuất dược liệu → phối chế → đóng gói → kiểm nghiệm theo tiêu chuẩn GMP-WHO.',
  },
  2: {
    manufacturer: 'Nhà máy OPC – Khu công nghiệp Tân Tạo, TP.HCM',
    manufacturingMethod: 'Phối trộn → tạo hạt → dập viên/đóng nang → đóng gói → kiểm nghiệm thành phẩm.',
  },
  3: {
    manufacturer: 'Xưởng mỹ phẩm OPC – Bình Dương',
    manufacturingMethod: 'Gia nhiệt pha chế → đồng hóa → chiết rót → đóng tuýp → kiểm nghiệm vi sinh.',
  },
  4: {
    manufacturer: 'Nhà máy nước uống OPC – Long An',
    manufacturingMethod: 'Trích ly → phối chế → tiệt trùng UHT → chiết rót → đóng gói.',
  },
  5: {
    manufacturer: 'Xưởng sơ chế dược liệu OPC – Đà Lạt',
    manufacturingMethod: 'Thu hái → sấy → sơ chế → kiểm nghiệm → đóng gói.',
  },
}

const APPROVER = 'Tổ ĐK Thuốc – Công ty CP Dược phẩm OPC'

function baseOf(p: Product) {
  const site = SITES[p.categoryId] ?? SITES[1]
  return {
    productId: p.id,
    manufacturer: site.manufacturer,
    manufacturingMethod: site.manufacturingMethod,
    registrationNo: p.registrationNo,
    packaging: p.packaging,
    shelfLife: p.shelfLife,
    regulation: p.regulation,
    dosageFormId: p.dosageFormId,
    categoryId: p.categoryId,
    activeIngredients: p.activeIngredients,
    approvedBy: APPROVER,
  }
}

function versionOf(
  p: Product,
  stage: ProductVersion['stage'],
  id: number,
  changes: VersionChange[],
  overrides: Partial<ProductVersion> = {},
): ProductVersion {
  const resolved: ProductVersion = {
    ...baseOf(p),
    id,
    version: p.version,
    stage,
    approvalStatus: stage === 'coming_soon' ? 'processing' : 'approved',
    approverRole: 'ra',
    effectiveDate: p.updatedAt,
    effectiveEndDate: addMonths(p.updatedAt, 24),
    indefinite: false,
    signedAt: stage === 'coming_soon' ? undefined : p.updatedAt,
    updatedAt: p.updatedAt,
    summary: `Phiên bản ${p.version} đang được lưu hành với ${p.packaging || 'quy cách hiện hành'}. Hồ sơ pháp lý và hướng dẫn sử dụng đã được phê duyệt.`,
    changeNote: stage === 'coming_soon' ? 'Hồ sơ mới được khởi tạo và đang chờ tổ phụ trách xử lý.' : '',
    changes,
    approvalNo: `QĐ-${p.code}-${p.version}`,
    ...overrides,
  }
  return { ...resolved, packagingSpecs: overrides.packagingSpecs ?? buildPackagingSpecs(p, resolved) }
}

const current1 = versionOf(seedProducts[0], 'current', 100, [
  { field: 'Hoạt chất & hàm lượng', before: 'Tỳ bà diệp 1,2g; Cát cánh 0,4g; Bạch linh 0,4g (trong 5ml)', after: 'Tỳ bà diệp 1,5g; Cát cánh 0,5g; Bạch linh 0,5g (trong 5ml)', kind: 'updated' },
  { field: 'Quy cách đóng gói', before: 'Chai 100ml', after: 'Chai 90ml', kind: 'updated' },
  { field: 'Tờ hướng dẫn sử dụng', after: 'Bổ sung cảnh báo thận trọng cho trẻ em dưới 2 tuổi.', kind: 'added' },
])

const current2 = versionOf(seedProducts[1], 'current', 200, [
  { field: 'Hoạt chất & hàm lượng', before: 'Menthol 18mg; Camphor 10mg (trong 1ml)', after: 'Menthol 20mg; Camphor 10mg; Tinh dầu bạc hà 15mg (trong 1ml)', kind: 'updated' },
  { field: 'Quy cách đóng gói', before: 'Chai 10ml', after: 'Chai 12ml', kind: 'updated' },
])

const current3 = versionOf(seedProducts[2], 'current', 300, [
  { field: 'Hoạt chất & hàm lượng', before: 'Cao Ginkgo biloba 40mg; Cao Đinh lăng 120mg (mỗi viên)', after: 'Cao Ginkgo biloba 40mg; Cao Đinh lăng 150mg (mỗi viên)', kind: 'updated' },
  { field: 'Quy cách đóng gói', before: 'Hộp 2 vỉ x 10 viên', after: 'Hộp 3 vỉ x 10 viên', kind: 'updated' },
])

const current4 = versionOf(seedProducts[3], 'current', 400, [
  { field: 'Hoạt chất & hàm lượng', before: 'Cam thảo 80mg; Bạc hà 5mg (mỗi viên)', after: 'Cam thảo 100mg; Bạc hà 5mg; Kim ngân hoa 80mg (mỗi viên)', kind: 'updated' },
  { field: 'Hướng dẫn sử dụng', after: 'Cập nhật liều dùng cho người lớn và trẻ em từ 6 tuổi.', kind: 'added' },
])

const current6 = versionOf(seedProducts[5], 'current', 600, [
  { field: 'Hoạt chất & hàm lượng', before: 'Gừng tươi 250mg (mỗi gói)', after: 'Gừng tươi 300mg (mỗi gói)', kind: 'updated' },
  { field: 'Quy cách đóng gói', before: 'Hộp 8 gói x 4g', after: 'Hộp 10 gói x 4g', kind: 'updated' },
])

const current7 = versionOf(seedProducts[6], 'current', 700, [
  { field: 'Hoạt chất & hàm lượng', before: 'Actiso 400mg; Kim ngân hoa 300mg (mỗi túi)', after: 'Actiso 500mg; Kim ngân hoa 300mg; Cúc hoa 200mg (mỗi túi)', kind: 'updated' },
  { field: 'Quy cách đóng gói', before: 'Hộp 15 túi lọc', after: 'Hộp 20 túi lọc', kind: 'updated' },
])

const current9 = versionOf(seedProducts[8], 'current', 900, [
  { field: 'Hoạt chất & hàm lượng', before: 'Ích mẫu 1,5g; Hương phụ 1g; Ngải cứu 1g (trong 10ml)', after: 'Ích mẫu 2g; Hương phụ 1g; Ngải cứu 1g (trong 10ml)', kind: 'updated' },
])

export const seedVersions: ProductVersion[] = [
  // SP001 – có bản coming soon và bản lưu trữ
  {
    ...versionOf(seedProducts[0], 'coming_soon', 109, [
      { field: 'Hoạt chất & hàm lượng', before: 'Tỳ bà diệp 1,5g; Cát cánh 0,5g; Bạch linh 0,5g (trong 5ml)', after: 'Tỳ bà diệp 1,8g; Cát cánh 0,5g; Bạch linh 0,5g (trong 5ml)', kind: 'updated' },
      { field: 'Quy cách đóng gói', before: 'Chai 90ml', after: 'Chai 100ml', kind: 'updated' },
      { field: 'Hạn dùng', before: '36 tháng', after: '30 tháng', kind: 'updated' },
    ], {
      version: '2.2',
      effectiveDate: '2026-11-15',
      effectiveEndDate: '2028-11-15',
      assignedRole: 'rnd',
      collaboratorRoles: ['design'],
      updatedAt: '2026-10-24T09:15:00Z',
      activeIngredients: 'Tỳ bà diệp 1,8g; Cát cánh 0,5g; Bạch linh 0,5g (trong 5ml)',
      packaging: 'Chai 100ml',
      shelfLife: '30 tháng',
      summary: 'Tăng hàm lượng Tỳ bà diệp, đổi sang chai 100ml và cập nhật tờ hướng dẫn sử dụng mới.',
      approvalNo: 'QĐ-SP001-2.2',
      approvedBy: 'Tổ ĐK Thuốc – phê duyệt cuối',
    }),
  },
  current1,
  {
    ...versionOf(seedProducts[0], 'archived', 101, [
      { field: 'Quy cách đóng gói', before: 'Chai 80ml', after: 'Chai 100ml', kind: 'updated' },
      { field: 'Số đăng ký', before: 'VD-00001-20', after: 'VD-00001-24', kind: 'updated' },
    ], {
      version: '2.0',
      effectiveDate: '2024-06-01',
      updatedAt: '2024-05-20T08:00:00Z',
      activeIngredients: 'Tỳ bà diệp 1,2g; Cát cánh 0,4g; Bạch linh 0,4g (trong 5ml)',
      packaging: 'Chai 100ml',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 2.1 thay thế từ ngày 12/10/2026.',
      approvalNo: 'QĐ-SP001-2.0',
    }),
  },

  // SP002
  current2,
  {
    ...versionOf(seedProducts[1], 'archived', 201, [
      { field: 'Hoạt chất & hàm lượng', before: 'Menthol 15mg; Camphor 8mg (trong 1ml)', after: 'Menthol 18mg; Camphor 10mg (trong 1ml)', kind: 'updated' },
    ], {
      version: '1.3',
      effectiveDate: '2025-08-20',
      updatedAt: '2025-08-10T08:30:00Z',
      activeIngredients: 'Menthol 18mg; Camphor 10mg (trong 1ml)',
      packaging: 'Chai 10ml',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 1.4 thay thế.',
      approvalNo: 'QĐ-SP002-1.3',
    }),
  },

  // SP003
  current3,
  {
    ...versionOf(seedProducts[2], 'archived', 301, [
      { field: 'Hoạt chất & hàm lượng', before: 'Cao Đinh lăng 100mg (mỗi viên)', after: 'Cao Đinh lăng 120mg (mỗi viên)', kind: 'updated' },
    ], {
      version: '2.5',
      effectiveDate: '2025-11-10',
      updatedAt: '2025-10-28T10:00:00Z',
      activeIngredients: 'Cao Ginkgo biloba 40mg; Cao Đinh lăng 120mg (mỗi viên)',
      packaging: 'Hộp 2 vỉ x 10 viên',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 3.0 thay thế.',
      approvalNo: 'QĐ-SP003-2.5',
    }),
  },
  {
    ...versionOf(seedProducts[2], 'archived', 302, [
      { field: 'Quy cách đóng gói', before: 'Hộp 1 vỉ x 10 viên', after: 'Hộp 2 vỉ x 10 viên', kind: 'updated' },
    ], {
      version: '2.0',
      effectiveDate: '2024-04-15',
      updatedAt: '2024-04-01T10:00:00Z',
      activeIngredients: 'Cao Ginkgo biloba 30mg; Cao Đinh lăng 100mg (mỗi viên)',
      packaging: 'Hộp 2 vỉ x 10 viên',
      summary: 'Phiên bản lưu trữ – đã ngừng áp dụng từ năm 2025.',
      approvalNo: 'QĐ-SP003-2.0',
    }),
  },

  // SP004
  current4,
  {
    ...versionOf(seedProducts[3], 'archived', 401, [
      { field: 'Hoạt chất & hàm lượng', before: 'Cam thảo 80mg; Bạc hà 5mg (mỗi viên)', after: 'Cam thảo 100mg; Bạc hà 5mg; Kim ngân hoa 80mg (mỗi viên)', kind: 'updated' },
    ], {
      version: '1.1',
      effectiveDate: '2025-06-01',
      updatedAt: '2025-05-22T14:00:00Z',
      activeIngredients: 'Cam thảo 80mg; Bạc hà 5mg (mỗi viên)',
      packaging: 'Hộp 2 vỉ x 12 viên',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 1.2 thay thế.',
      approvalNo: 'QĐ-SP004-1.1',
    }),
  },

  // SP005, SP008 – chỉ có phiên bản hiện tại
  versionOf(seedProducts[4], 'current', 500, []),
  versionOf(seedProducts[7], 'current', 800, []),

  // SP006
  current6,
  {
    ...versionOf(seedProducts[5], 'archived', 601, [
      { field: 'Quy cách đóng gói', before: 'Hộp 6 gói x 4g', after: 'Hộp 8 gói x 4g', kind: 'updated' },
    ], {
      version: '1.0',
      effectiveDate: '2025-12-01',
      updatedAt: '2025-11-18T09:00:00Z',
      activeIngredients: 'Gừng tươi 250mg; Đường phèn 3g (mỗi gói)',
      packaging: 'Hộp 8 gói x 4g',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 1.1 thay thế.',
      approvalNo: 'QĐ-SP006-1.0',
    }),
  },

  // SP007
  current7,
  {
    ...versionOf(seedProducts[6], 'archived', 701, [
      { field: 'Quy cách đóng gói', before: 'Hộp 12 túi lọc', after: 'Hộp 15 túi lọc', kind: 'updated' },
    ], {
      version: '1.5',
      effectiveDate: '2025-05-10',
      updatedAt: '2025-04-26T11:00:00Z',
      activeIngredients: 'Actiso 400mg; Kim ngân hoa 300mg (mỗi túi)',
      packaging: 'Hộp 15 túi lọc',
      shelfLife: '20 tháng',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 2.0 thay thế.',
      approvalNo: 'QĐ-SP007-1.5',
    }),
  },

  // SP009
  current9,
  {
    ...versionOf(seedProducts[8], 'archived', 901, [
      { field: 'Hoạt chất & hàm lượng', before: 'Ích mẫu 1,2g (trong 10ml)', after: 'Ích mẫu 1,5g (trong 10ml)', kind: 'updated' },
    ], {
      version: '1.2',
      effectiveDate: '2024-09-01',
      updatedAt: '2024-08-20T13:00:00Z',
      activeIngredients: 'Ích mẫu 1,5g; Hương phụ 1g; Ngải cứu 1g (trong 10ml)',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 1.3 thay thế.',
      approvalNo: 'QĐ-SP009-1.2',
    }),
  },

  // SP010
  versionOf(seedProducts[9], 'current', 1000, [
    { field: 'Quy cách đóng gói', before: 'Túi 150g', after: 'Túi 200g', kind: 'updated' },
  ]),
  {
    ...versionOf(seedProducts[9], 'archived', 1001, [
      { field: 'Tiêu chuẩn kiểm nghiệm', after: 'Bổ sung chỉ tiêu định lượng cynarin.', kind: 'added' },
    ], {
      version: '0.9',
      effectiveDate: '2024-02-01',
      updatedAt: '2024-01-20T08:00:00Z',
      packaging: 'Túi 150g',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 1.0 thay thế.',
      approvalNo: 'QĐ-SP010-0.9',
    }),
  },

  // SP011
  versionOf(seedProducts[10], 'current', 1100, []),
  {
    ...versionOf(seedProducts[10], 'archived', 1101, [
      { field: 'Hoạt chất & hàm lượng', before: 'Tỳ bà diệp 1,4g; Cát cánh 0,4g (trong 5ml)', after: 'Tỳ bà diệp 1,5g; Cát cánh 0,5g (trong 5ml)', kind: 'updated' },
    ], {
      version: '1.9',
      effectiveDate: '2024-12-01',
      updatedAt: '2024-11-15T08:00:00Z',
      activeIngredients: 'Tỳ bà diệp 1,4g; Cát cánh 0,4g (trong 5ml)',
      packaging: 'Chai 80ml',
      summary: 'Phiên bản lưu trữ – đã được phiên bản 2.0 thay thế.',
      approvalNo: 'QĐ-SP011-1.9',
    }),
  },
]

/** Sản phẩm mới tạo từ danh mục sẽ có phiên bản hiện hành đầu tiên. */
export function baselineVersionFor(p: Product): ProductVersion {
  return versionOf(p, 'current', p.id * 100 + 99, [])
}
