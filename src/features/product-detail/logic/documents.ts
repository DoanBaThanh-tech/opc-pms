import type { Product } from '@/features/products/logic/types'
import { resolvePackagingSpecs } from './packagingSpecs'
import type { ProductVersion, VersionDocument } from './types'

const STATUS_BY_STAGE = {
  current: 'valid',
  coming_soon: 'draft',
  archived: 'superseded',
} as const

/** Sinh bộ hồ sơ mô phỏng theo từng phiên bản (BE thật sẽ trả danh sách file thực tế). */
export function buildDocuments(product: Product, version: ProductVersion, previousVersion?: string): VersionDocument[] {
  const status = STATUS_BY_STAGE[version.stage]
  const date = version.updatedAt
  const v = version.version
  const code = product.code
  let seq = 0
  const doc = (
    group: VersionDocument['group'],
    name: string,
    docCode: string,
    format: VersionDocument['format'],
    sizeKb: number,
    pages: number,
    note?: string,
  ): VersionDocument => ({
    id: `${version.id}-${++seq}`,
    group, name, code: docCode, format, sizeKb, pages, updatedAt: date, status, note,
  })

  return [
    doc('legal', `Quyết định phê duyệt phiên bản ${v}`, version.approvalNo, 'pdf', 842, 6, 'Bản gốc lưu tại Phòng Đảm bảo chất lượng.'),
    doc('legal', 'Giấy đăng ký lưu hành sản phẩm', version.registrationNo || `ĐK-${code}`, 'pdf', 1260, 2),
    doc('legal', `Biên bản thẩm định hồ sơ thay đổi`, `BB-TĐ-${code}-${v.replace(/\./g, '')}`, 'pdf', 638, 8),
    doc('legal', 'Công văn xác nhận nội dung nhãn & tờ rơi', `CV-NHAN-${code}-${v.replace(/\./g, '')}`, 'docx', 226, 3),

    doc('usage', 'Hướng dẫn sử dụng – tờ rơi sản phẩm', `HDSD-${code}-${v.replace(/\./g, '')}`, 'pdf', 524, 2, 'Tờ hướng dẫn in kèm mỗi hộp sản phẩm.'),
    doc('usage', previousVersion ? `Báo cáo so sánh phiên bản ${previousVersion} → ${v}` : 'Báo cáo so sánh với hồ sơ gốc', `SS-${code}-${v.replace(/\./g, '')}`, 'docx', 486, 5),
    doc('usage', 'Biên bản xác nhận nội dung HDSD', `BB-HDSD-${code}-${v.replace(/\./g, '')}`, 'pdf', 312, 3),

    doc('packaging', 'Bản vẽ quy cách đóng gói', `BV-PKG-${code}-${v.replace(/\./g, '')}`, 'pdf', 1180, 4),
    doc('packaging', 'Hồ sơ kỹ thuật CT1 – CT2', `HSKT-${code}-${v.replace(/\./g, '')}`, 'pdf', 2460, 18, 'Bao gồm công thức, quy trình sản xuất và tiêu chuẩn nguyên liệu.'),
    doc('packaging', 'Tiêu chuẩn cơ sở & phiếu kiểm nghiệm', `TCCS-${code}`, 'xlsx', 196, 12),
    ...resolvePackagingSpecs(product, version).map((spec) => spec.technicalDoc),
    ...(version.extraDocs ?? []).map((doc) => ({ ...doc, status })),
  ]
}

export function docsByGroup(docs: VersionDocument[], group: VersionDocument['group']) {
  return docs.filter((d) => d.group === group)
}

export function formatSize(sizeKb: number) {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`
}
