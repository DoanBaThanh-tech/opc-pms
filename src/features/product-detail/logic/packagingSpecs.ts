import type { Product } from '@/features/products/logic/types'
import type { DocStatus, PackagingSpec, ProductVersion, VersionDocument } from './types'

const STATUS_BY_STAGE: Record<ProductVersion['stage'], DocStatus> = {
  current: 'valid',
  coming_soon: 'draft',
  archived: 'superseded',
}

const compactVersion = (version: string) => version.replace(/\./g, '')

function technicalDoc(
  product: Product,
  version: ProductVersion,
  seq: number,
  name: string,
  note: string,
  pages: number,
  sizeKb: number,
): VersionDocument {
  const v = compactVersion(version.version)
  return {
    id: `spec-${product.id}-${v}-${seq}-doc`,
    group: 'packaging',
    name,
    code: `HSKT-${product.code}-${v}-${String(seq).padStart(2, '0')}`,
    format: 'pdf',
    sizeKb,
    pages,
    updatedAt: version.updatedAt,
    status: STATUS_BY_STAGE[version.stage],
    note,
  }
}

/** Sinh 2 quy cách mẫu khi phiên bản chưa có dữ liệu quy cách. */
export function buildPackagingSpecs(product: Product, version: ProductVersion): PackagingSpec[] {
  const v = compactVersion(version.version)
  const packaging = version.packaging || 'Quy cách chính'
  return [
    {
      id: `spec-${product.id}-${v}-1`,
      name: packaging,
      note: 'Bao bì tiếp xúc trực tiếp với sản phẩm.',
      technicalDoc: technicalDoc(
        product, version, 1,
        `Hồ sơ kỹ thuật – ${packaging}`,
        'Công thức, quy trình sản xuất và tiêu chuẩn nguyên liệu.',
        18, 2460,
      ),
    },
    {
      id: `spec-${product.id}-${v}-2`,
      name: 'Thùng carton đóng gói ngoại vi',
      note: 'Đóng gói vận chuyển và lưu kho.',
      technicalDoc: technicalDoc(
        product, version, 2,
        'Hồ sơ kỹ thuật bao bì ngoại vi',
        'Quy cách thùng carton, nhãn phụ và điều kiện vận chuyển.',
        6, 880,
      ),
    },
  ]
}

export function resolvePackagingSpecs(product: Product, version: ProductVersion) {
  const specs = version.packagingSpecs?.length ? version.packagingSpecs : buildPackagingSpecs(product, version)
  const status = STATUS_BY_STAGE[version.stage]
  return specs.map((spec) => ({ ...spec, technicalDoc: { ...spec.technicalDoc, status } }))
}

/** Nhân bản quy cách (kèm ảnh) sang phiên bản mới, cập nhật mã hồ sơ kỹ thuật theo phiên bản. */
export function clonePackagingSpecsForVersion(
  product: Product,
  baseVersion: ProductVersion,
  nextVersion: string,
  nextStage: ProductVersion['stage'],
  updatedAt: string,
  packaging: string,
): PackagingSpec[] {
  const v = compactVersion(nextVersion)
  return resolvePackagingSpecs(product, baseVersion).map((spec, i) => ({
    ...spec,
    id: `spec-${product.id}-${v}-${i + 1}`,
    name: i === 0 && packaging ? packaging : spec.name,
    technicalDoc: {
      ...spec.technicalDoc,
      id: `spec-${product.id}-${v}-${i + 1}-doc`,
      code: `HSKT-${product.code}-${v}-${String(i + 1).padStart(2, '0')}`,
      name: i === 0 && packaging ? `Hồ sơ kỹ thuật – ${packaging}` : spec.technicalDoc.name,
      updatedAt,
      status: STATUS_BY_STAGE[nextStage],
    },
    photo: spec.photo,
  }))
}
