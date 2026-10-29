import type { ApiError } from '@/core/types/common'

const PREFIX = 'opc_mock_'
const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms))
export const mockError = (message: string, status = 400): ApiError => ({ status, message })

/** Bảng dữ liệu giả lưu trong localStorage. Bỏ đi khi BE C# sẵn sàng. */
export function createMockCollection<T extends { id: number }>(key: string, seed: T[]) {
  const storageKey = PREFIX + key
  let items: T[] = (() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw) as T[]
    } catch { /* dùng dữ liệu mẫu */ }
    return structuredClone(seed)
  })()
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch { /* bỏ qua */ }
  }
  const insert = (data: Omit<T, 'id'>): T => {
    const id = items.reduce((m, i) => Math.max(m, i.id), 0) + 1
    const item = { ...data, id } as unknown as T
    items = [...items, item]
    save()
    return item
  }
  const patch = (id: number, data: Partial<T>): T => {
    const found = items.find((i) => i.id === id)
    if (!found) throw mockError('Không tìm thấy dữ liệu.', 404)
    const next = { ...found, ...data }
    items = items.map((i) => (i.id === id ? next : i))
    save()
    return next
  }
  return {
    snapshot: () => items,
    insert,
    patch,
    persist: save,
    all: async () => { await delay(); return [...items] },
    create: async (data: Omit<T, 'id'>) => { await delay(); return insert(data) },
    update: async (id: number, data: Partial<T>) => { await delay(); return patch(id, data) },
    remove: async (id: number) => { await delay(); items = items.filter((i) => i.id !== id); save() },
  }
}

export function resetMockData() {
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k))
}
