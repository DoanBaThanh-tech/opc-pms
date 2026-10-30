import type { DocStatus, ProductVersion, UpdateVersionInfoInput } from './types'

/** Áp dụng thông tin chung vào phiên bản, đồng bộ mã hồ sơ kỹ thuật và trạng thái tài liệu. */
export function applyVersionInfo(
  version: ProductVersion,
  input: UpdateVersionInfoInput,
  productCode: string,
  updatedAt = new Date().toISOString(),
): ProductVersion {
  const { endDate, indefinite, ...info } = input
  const nextVersion = info.version.trim()
  const compact = nextVersion.replace(/\./g, '')
  const status: DocStatus = version.stage === 'archived' ? 'superseded' : version.stage === 'current' ? 'valid' : 'draft'
  const packagingSpecs = version.packagingSpecs?.map((spec, i) => ({
    ...spec,
    name: i === 0 && info.packaging.trim() ? info.packaging.trim() : spec.name,
    technicalDoc: {
      ...spec.technicalDoc,
      code: `HSKT-${productCode}-${compact}-${String(i + 1).padStart(2, '0')}`,
      name: i === 0 && info.packaging.trim() ? `Hồ sơ kỹ thuật – ${info.packaging.trim()}` : spec.technicalDoc.name,
      status,
    },
  }))

  return {
    ...version,
    ...info,
    version: nextVersion,
    effectiveEndDate: endDate,
    ...(indefinite === undefined ? {} : { indefinite }),
    approvalNo: `QĐ-${productCode}-${nextVersion}`,
    packagingSpecs,
    updatedAt,
  }
}
