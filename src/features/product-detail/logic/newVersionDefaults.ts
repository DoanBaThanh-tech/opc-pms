import type { CreateVersionInput, ProductVersion } from './types'

/** Ngày dự kiến áp dụng mặc định: sau 30 ngày. */
export function defaultEffectiveDate(days = 30) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Dữ liệu khởi tạo phiên bản mới, kế thừa từ phiên bản hiện hành. */
export function buildNewVersionInput(base: ProductVersion, suggestedVersion: string): CreateVersionInput {
  return {
    version: suggestedVersion,
    effectiveDate: defaultEffectiveDate(),
    activeIngredients: base.activeIngredients,
    packaging: base.packaging,
    shelfLife: base.shelfLife,
    summary: `Phiên bản ${suggestedVersion} được khởi tạo từ phiên bản ${base.version}, đang chờ cập nhật nội dung chi tiết.`,
    customChanges: [],
  }
}
