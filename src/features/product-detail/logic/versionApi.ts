import { http } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { createMockCollection, mockError } from '@/core/api/mock'
import { env } from '@/core/config/env'
import { formatDate } from '@/core/utils/format'
import { logHistory } from '@/features/history/logic/historyApi'
import { productsDb } from '@/features/products/logic/productApi'
import { clonePackagingSpecsForVersion } from './packagingSpecs'
import { baselineVersionFor, seedVersions } from './seedVersions'
import type { CreateVersionInput, PackagingSpec, ProductVersion } from './types'
import { sortVersions } from './versionUtils'

export const versionsDb = createMockCollection<ProductVersion>('product_versions', seedVersions)

const now = () => new Date().toISOString()
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function stripId<T extends { id: number }>(item: T): Omit<T, 'id'> {
  const copy: Partial<T> = { ...item }
  delete copy.id
  return copy as Omit<T, 'id'>
}

function requireProduct(productId: number) {
  const product = productsDb.snapshot().find((p) => p.id === productId)
  if (!product) throw mockError('Không tìm thấy sản phẩm.', 404)
  return product
}

/** Mô phỏng API phiên bản sản phẩm. BE C# sẽ thay thế cùng contract. */
export const versionApi = {
  list: async (productId: number): Promise<ProductVersion[]> => {
    if (!env.useMock) return http.get<ProductVersion[]>(`${endpoints.products}/${productId}/versions`)
    const all = await versionsDb.all()
    const items = all.filter((v) => v.productId === productId)
    if (items.length) return sortVersions(items)

    // Sản phẩm vừa tạo từ danh mục chưa có phiên bản → khởi tạo phiên bản hiện hành đầu tiên.
    const product = productsDb.snapshot().find((p) => p.id === productId)
    if (!product) return []
    const created = versionsDb.insert(stripId(baselineVersionFor(product)))
    return [created]
  },

  create: async (productId: number, input: CreateVersionInput): Promise<ProductVersion> => {
    if (!env.useMock) return http.post<ProductVersion>(`${endpoints.products}/${productId}/versions`, input)
    const product = requireProduct(productId)
    const versions = versionsDb.snapshot().filter((v) => v.productId === productId)
    if (!versions.length) throw mockError('Chưa có dữ liệu phiên bản để kế thừa.', 409)
    if (versions.some((v) => v.version.trim().toLowerCase() === input.version.trim().toLowerCase())) {
      throw mockError(`Phiên bản ${input.version.trim()} đã tồn tại.`, 409)
    }

    const base = versions.find((v) => v.stage === 'current') ?? sortVersions(versions)[0]
    const autoChanges: ProductVersion['changes'] = []
    if (input.activeIngredients.trim() !== base.activeIngredients) {
      autoChanges.push({ field: 'Hoạt chất & hàm lượng', before: base.activeIngredients, after: input.activeIngredients.trim(), kind: 'updated' })
    }
    if (input.packaging.trim() !== base.packaging) {
      autoChanges.push({ field: 'Quy cách đóng gói', before: base.packaging, after: input.packaging.trim(), kind: 'updated' })
    }
    if (input.shelfLife.trim() !== base.shelfLife) {
      autoChanges.push({ field: 'Hạn dùng', before: base.shelfLife, after: input.shelfLife.trim(), kind: 'updated' })
    }

    const nextVersion = input.version.trim()
    const createdAt = now()
    const created = await versionsDb.create({
      ...stripId(base),
      version: nextVersion,
      basedOnVersion: base.version,
      stage: 'coming_soon',
      effectiveDate: input.effectiveDate,
      updatedAt: createdAt,
      summary: input.summary.trim(),
      changes: [...autoChanges, ...input.customChanges],
      activeIngredients: input.activeIngredients.trim(),
      packaging: input.packaging.trim(),
      shelfLife: input.shelfLife.trim(),
      approvalNo: `QĐ-${product.code}-${nextVersion}`,
      approvedBy: 'Hội đồng thẩm định OPC (dự kiến)',
      packagingSpecs: clonePackagingSpecsForVersion(product, base, nextVersion, 'coming_soon', createdAt, input.packaging.trim()),
    })
    logHistory({ ...product, version: created.version }, 'updated', `Tạo phiên bản ${created.version} (đang chờ áp dụng)`)
    return created
  },

  savePackagingSpecs: async (productId: number, versionId: number, specs: PackagingSpec[]): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/packaging-specs`, { specs })
    }
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage === 'archived') throw mockError('Phiên bản lưu trữ chỉ được xem, không thể chỉnh sửa quy cách đóng gói.', 409)
    return versionsDb.patch(versionId, { packagingSpecs: specs })
  },

  activate: async (productId: number, versionId: number): Promise<ProductVersion> => {
    if (!env.useMock) return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/activate`, {})
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage !== 'coming_soon') throw mockError('Chỉ phiên bản Coming soon mới có thể đưa vào sử dụng.', 409)

    const activatedOn = today()
    versionsDb.snapshot()
      .filter((v) => v.productId === productId && v.stage === 'current')
      .forEach((v) => versionsDb.patch(v.id, {
        stage: 'archived',
        summary: `Phiên bản lưu trữ – đã được phiên bản ${target.version} thay thế từ ngày ${formatDate(activatedOn)}.`,
      }))

    const activated = versionsDb.patch(versionId, {
      stage: 'current',
      effectiveDate: activatedOn,
      updatedAt: now(),
      approvedBy: 'Hội đồng thẩm định – Công ty CP Dược phẩm OPC',
      summary: `Phiên bản ${target.version} đã được đưa vào sử dụng từ ngày ${formatDate(activatedOn)}.`,
    })
    const updatedProduct = productsDb.patch(productId, { version: target.version, updatedAt: now() })
    logHistory(updatedProduct, 'updated', `Áp dụng phiên bản ${target.version} vào sử dụng`)
    return activated
  },
}
