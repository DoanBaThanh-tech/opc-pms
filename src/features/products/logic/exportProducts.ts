import { exportToExcel } from '@/core/utils/exportExcel'
import { formatDate } from '@/core/utils/format'
import { STATUS_META } from './constants'
import type { Lookups } from './useLookups'
import type { Product } from './types'

/** Xuất TOÀN BỘ sản phẩm đang lọc (không chỉ trang hiện tại), đủ mọi cột. */
export function exportProducts(products: Product[], l: Pick<Lookups, 'dosageName' | 'categoryName'>) {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return exportToExcel({
    fileName: `danh-muc-san-pham-${stamp}`,
    sheetName: 'Danh mục sản phẩm',
    rows: products,
    columns: [
      { header: 'STT', width: 6, value: (_, i) => i + 1 },
      { header: 'Mã SP', width: 12, value: (p) => p.code },
      { header: 'Tên sản phẩm', width: 34, value: (p) => p.name },
      { header: 'Phiên bản', width: 11, value: (p) => p.version },
      { header: 'Dạng bào chế', width: 20, value: (p) => l.dosageName(p.dosageFormId) },
      { header: 'Hoạt chất & Hàm lượng', width: 50, value: (p) => p.activeIngredients },
      { header: 'Phân loại', width: 22, value: (p) => l.categoryName(p.categoryId) },
      { header: 'Quy định', width: 28, value: (p) => p.regulation },
      { header: 'Quy cách đóng gói', width: 24, value: (p) => p.packaging },
      { header: 'Số đăng ký', width: 16, value: (p) => p.registrationNo },
      { header: 'Hạn dùng', width: 12, value: (p) => p.shelfLife },
      { header: 'Trạng thái', width: 14, value: (p) => STATUS_META[p.status].label },
      { header: 'Ngày cập nhật', width: 16, value: (p) => formatDate(p.updatedAt) },
    ],
  })
}
