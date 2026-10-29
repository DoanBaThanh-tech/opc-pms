import { env } from '@/core/config/env'
import type { CatalogInput, CatalogItem } from '@/core/types/catalog'
import { http } from './client'
import { createMockCollection, mockError } from './mock'

interface Options {
  key: string
  endpoint: string
  seed: CatalogItem[]
  /** Chỉ dùng cho mock: chặn xóa khi đang được sản phẩm sử dụng (BE thật sẽ tự kiểm tra) */
  isInUse?: (id: number) => boolean
  inUseMessage?: string
}

/** API dùng chung cho các danh mục đơn giản (Dạng bào chế, Phân loại). */
export function createCatalogApi({ key, endpoint, seed, isInUse, inUseMessage }: Options) {
  const db = createMockCollection<CatalogItem>(key, seed)
  const isDuplicate = (name: string, selfId?: number) =>
    db.snapshot().some((i) => i.id !== selfId && i.name.trim().toLowerCase() === name.trim().toLowerCase())

  return {
    list: (): Promise<CatalogItem[]> => (env.useMock ? db.all() : http.get<CatalogItem[]>(endpoint)),
    create: async (input: CatalogInput): Promise<CatalogItem> => {
      if (!env.useMock) return http.post<CatalogItem>(endpoint, input)
      if (isDuplicate(input.name)) throw mockError('Tên này đã tồn tại.', 409)
      return db.create({ ...input, name: input.name.trim(), createdAt: new Date().toISOString() })
    },
    update: async (id: number, input: CatalogInput): Promise<CatalogItem> => {
      if (!env.useMock) return http.put<CatalogItem>(`${endpoint}/${id}`, input)
      if (isDuplicate(input.name, id)) throw mockError('Tên này đã tồn tại.', 409)
      return db.update(id, { ...input, name: input.name.trim() })
    },
    remove: async (id: number): Promise<void> => {
      if (!env.useMock) return http.delete(`${endpoint}/${id}`)
      if (isInUse?.(id)) throw mockError(inUseMessage ?? 'Mục này đang được sử dụng, không thể xóa.', 409)
      return db.remove(id)
    },
  }
}
