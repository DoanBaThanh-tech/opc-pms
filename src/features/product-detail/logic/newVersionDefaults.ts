import type { Product } from '@/features/products/logic/types'
import { clonePackagingSpecsForVersion } from './packagingSpecs'
import type { CreateVersionInput, ProductVersion } from './types'
import { addMonths, versionEndDate } from './versionUtils'

/** Ngày dự kiến áp dụng mặc định: sau 30 ngày. */
export function defaultEffectiveDate(days = 30) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ngày kết thúc mặc định: 24 tháng sau ngày bắt đầu. */
export function defaultEndDate(startDate: string) {
  return addMonths(startDate, 24)
}

/**
 * Bản nháp phiên bản mới – kế thừa toàn bộ thuộc tính của phiên bản hiện hành.
 * Chưa được ghi xuống kho dữ liệu cho tới khi người dùng xác nhận tạo.
 */
export function buildDraftVersion(product: Product, base: ProductVersion, suggestedVersion: string): ProductVersion {
  const createdAt = new Date().toISOString()
  const start = defaultEffectiveDate()
  return {
    ...base,
    id: -1,
    version: suggestedVersion,
    basedOnVersion: base.version,
    stage: 'coming_soon',
    approvalStatus: 'processing',
    approverRole: 'ra',
    effectiveDate: start,
    effectiveEndDate: defaultEndDate(start),
    indefinite: false,
    updatedAt: createdAt,
    summary: `Phiên bản ${suggestedVersion} được tạo từ phiên bản ${base.version}.`,
    changeNote: '',
    changes: [],
    approvalNo: `QĐ-${product.code}-${suggestedVersion}`,
    approvedBy: 'Hồ sơ mới – chờ tổ phụ trách xử lý',
    signedAt: undefined,
    appliedAt: undefined,
    processedByRole: undefined,
    processedAt: undefined,
    approvedByRole: undefined,
    rejectedByRole: undefined,
    rejectedReason: undefined,
    rejectedAt: undefined,
    packagingSpecs: clonePackagingSpecsForVersion(product, base, suggestedVersion, 'coming_soon', createdAt, base.packaging),
    extraDocs: [],
  }
}

/** Chuyển bản nháp thành dữ liệu gửi lên API tạo phiên bản. */
export function toCreateVersionInput(draft: ProductVersion): CreateVersionInput {
  return {
    version: draft.version,
    effectiveDate: draft.effectiveDate,
    endDate: versionEndDate(draft),
    indefinite: draft.indefinite,
    activeIngredients: draft.activeIngredients,
    dosageFormId: draft.dosageFormId,
    categoryId: draft.categoryId,
    packaging: draft.packaging,
    shelfLife: draft.shelfLife,
    regulation: draft.regulation,
    manufacturer: draft.manufacturer,
    manufacturingMethod: draft.manufacturingMethod,
    summary: draft.summary,
    customChanges: [],
    extraDocs: draft.extraDocs ?? [],
    packagingSpecs: draft.packagingSpecs,
  }
}
