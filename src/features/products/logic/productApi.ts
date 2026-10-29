import { http } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { createMockCollection, mockError } from '@/core/api/mock'
import { env } from '@/core/config/env'
import { logHistory, type HistoryAction } from '@/features/history/logic/historyApi'
import type { PackagingSpec } from '@/features/product-detail/logic/types'
import { seedProducts } from './seed'
import type { Product, ProductInput, ProductStatus } from './types'

export const productsDb = createMockCollection<Product>('products', seedProducts)

const now = () => new Date().toISOString()
const STATUS_ACTION: Record<ProductStatus, HistoryAction> = {
  draft: 'updated', pending: 'submitted', approved: 'approved', rejected: 'rejected', discontinued: 'discontinued',
}
const STATUS_NOTE: Record<ProductStatus, string> = {
  draft: 'Chuyển về nháp', pending: 'Gửi duyệt', approved: 'Đã phê duyệt', rejected: 'Bị từ chối', discontinued: 'Ngừng sản phẩm',
}

function assertUniqueKey(input: ProductInput, selfId?: number) {
  const dup = productsDb.snapshot().some(
    (p) => p.id !== selfId && p.code.toLowerCase() === input.code.trim().toLowerCase() && p.version === input.version.trim(),
  )
  if (dup) throw mockError('Mã sản phẩm với phiên bản này đã tồn tại.', 409)
}

/**
 * Mock-only: giữ ảnh chụp phiên bản hiện hành khớp với thông tin vừa sửa ở danh mục.
 * Khi có BE, server sẽ đảm bảo quy tắc đồng bộ này.
 */
function syncCurrentVersionSnapshot(product: Product) {
  try {
    const raw = localStorage.getItem('opc_mock_product_versions')
    if (!raw) return
    const versions = JSON.parse(raw) as Record<string, unknown>[]
    let changed = false
    const next = versions.map((v) => {
      if (v.productId !== product.id || v.stage !== 'current') return v
      changed = true
      const specs = Array.isArray(v.packagingSpecs) ? (v.packagingSpecs as PackagingSpec[]) : undefined
      return {
        ...v,
        registrationNo: product.registrationNo,
        packaging: product.packaging,
        shelfLife: product.shelfLife,
        regulation: product.regulation,
        dosageFormId: product.dosageFormId,
        categoryId: product.categoryId,
        activeIngredients: product.activeIngredients,
        updatedAt: product.updatedAt,
        approvalNo: `QĐ-${product.code}-${v.version}`,
        packagingSpecs: specs?.length
          ? specs.map((s, i) => (i === 0 && product.packaging
            ? { ...s, name: product.packaging, technicalDoc: { ...s.technicalDoc, name: `Hồ sơ kỹ thuật – ${product.packaging}` } }
            : s))
          : v.packagingSpecs,
      }
    })
    if (changed) localStorage.setItem('opc_mock_product_versions', JSON.stringify(next))
  } catch { /* bỏ qua lỗi localStorage */ }
}

export const productApi = {
  list: (): Promise<Product[]> => (env.useMock ? productsDb.all() : http.get<Product[]>(endpoints.products)),

  create: async (input: ProductInput): Promise<Product> => {
    if (!env.useMock) return http.post<Product>(endpoints.products, input)
    assertUniqueKey(input)
    const p = await productsDb.create({ ...input, status: 'draft', updatedAt: now() })
    logHistory(p, 'created', 'Tạo sản phẩm mới (nháp)')
    return p
  },

  update: async (id: number, input: ProductInput): Promise<Product> => {
    if (!env.useMock) return http.put<Product>(`${endpoints.products}/${id}`, input)
    assertUniqueKey(input, id)
    const p = await productsDb.update(id, { ...input, updatedAt: now() })
    syncCurrentVersionSnapshot(p)
    logHistory(p, 'updated', 'Cập nhật thông tin sản phẩm')
    return p
  },

  changeStatus: async (id: number, status: ProductStatus, note?: string): Promise<Product> => {
    if (!env.useMock) return http.put<Product>(`${endpoints.products}/${id}/status`, { status, note })
    const p = await productsDb.update(id, { status, updatedAt: now() })
    logHistory(p, STATUS_ACTION[status], note?.trim() || STATUS_NOTE[status])
    return p
  },
}
