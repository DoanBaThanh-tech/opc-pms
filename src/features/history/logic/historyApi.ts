import { endpoints } from '@/core/api/endpoints'
import { http } from '@/core/api/client'
import { createMockCollection } from '@/core/api/mock'
import { env } from '@/core/config/env'
import { getSettings } from '@/features/settings/logic/settingsStore'
import { seedProducts } from '@/features/products/logic/seed'
import type { Product } from '@/features/products/logic/types'

export type HistoryAction = 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'discontinued'

export interface HistoryEntry {
  id: number
  productId: number
  productCode: string
  productName: string
  version: string
  action: HistoryAction
  note: string
  by: string
  at: string
}

const seed: HistoryEntry[] = seedProducts.map((p, i) => ({
  id: i + 1, productId: p.id, productCode: p.code, productName: p.name, version: p.version,
  action: 'created', note: 'Dữ liệu mẫu', by: 'Quản trị viên', at: p.updatedAt,
}))

export const historyDb = createMockCollection<HistoryEntry>('history', seed)

/** Chỉ dùng cho mock. Khi có BE thật, server tự ghi lịch sử. */
export function logHistory(p: Pick<Product, 'id' | 'code' | 'name' | 'version'>, action: HistoryAction, note: string) {
  historyDb.insert({
    productId: p.id, productCode: p.code, productName: p.name, version: p.version,
    action, note, by: getSettings().displayName, at: new Date().toISOString(),
  })
}

export const historyApi = {
  list: async (): Promise<HistoryEntry[]> => {
    const rows = env.useMock ? await historyDb.all() : await http.get<HistoryEntry[]>(endpoints.history)
    return [...rows].sort((a, b) => b.at.localeCompare(a.at))
  },
}
