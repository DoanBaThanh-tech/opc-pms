import { createCatalogApi } from '@/core/api/catalogApi'
import { endpoints } from '@/core/api/endpoints'
import { createCatalogHooks } from '@/core/hooks/createCatalogHooks'
import type { CatalogItem } from '@/core/types/catalog'
import { productsDb } from '@/features/products/logic/productApi'

const names: [string, string][] = [
  ['Viên nén', 'Dạng rắn, nén thành viên'],
  ['Viên nang cứng', 'Vỏ nang cứng chứa bột/cốm'],
  ['Viên nang mềm', 'Vỏ nang mềm chứa dịch/dầu'],
  ['Siro', 'Dung dịch đường uống'],
  ['Cao lỏng', 'Chế phẩm chiết xuất dạng lỏng'],
  ['Thuốc bột / Cốm', 'Dạng bột hoặc cốm pha uống'],
  ['Dung dịch dùng ngoài', 'Dầu, dung dịch xoa bóp'],
  ['Gel / Kem bôi', 'Dạng bán rắn dùng ngoài da'],
  ['Viên ngậm', 'Viên tan dần trong miệng'],
  ['Trà túi lọc', 'Dược liệu đóng túi lọc để pha'],
]
const seed: CatalogItem[] = names.map(([name, description], i) => ({ id: i + 1, name, description, createdAt: '2026-01-10T08:00:00Z' }))

export const dosageFormApi = createCatalogApi({
  key: 'dosage-forms', endpoint: endpoints.dosageForms, seed,
  isInUse: (id) => productsDb.snapshot().some((p) => p.dosageFormId === id),
  inUseMessage: 'Dạng bào chế này đang được sản phẩm sử dụng, không thể xóa.',
})
const hooks = createCatalogHooks('dosage-forms', dosageFormApi)
export const dosageFormHooks = hooks
export const useDosageForms = hooks.useList
