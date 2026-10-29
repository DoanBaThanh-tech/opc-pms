import { createCatalogApi } from '@/core/api/catalogApi'
import { endpoints } from '@/core/api/endpoints'
import { createCatalogHooks } from '@/core/hooks/createCatalogHooks'
import type { CatalogItem } from '@/core/types/catalog'
import { productsDb } from '@/features/products/logic/productApi'

const names: [string, string][] = [
  ['Thuốc', 'Thuốc có số đăng ký lưu hành'],
  ['Thực phẩm chức năng', 'Sản phẩm bảo vệ sức khỏe'],
  ['Mỹ phẩm', 'Sản phẩm chăm sóc da, tóc'],
  ['Nước uống thảo mộc', 'Đồ uống từ thảo dược'],
  ['Dược liệu', 'Nguyên liệu và dược liệu thô'],
]
const seed: CatalogItem[] = names.map(([name, description], i) => ({ id: i + 1, name, description, createdAt: '2026-01-10T08:00:00Z' }))

export const categoryApi = createCatalogApi({
  key: 'categories', endpoint: endpoints.categories, seed,
  isInUse: (id) => productsDb.snapshot().some((p) => p.categoryId === id),
  inUseMessage: 'Phân loại này đang được sản phẩm sử dụng, không thể xóa.',
})
const hooks = createCatalogHooks('categories', categoryApi)
export const categoryHooks = hooks
export const useCategories = hooks.useList
