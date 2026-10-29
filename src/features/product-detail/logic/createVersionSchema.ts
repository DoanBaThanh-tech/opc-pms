import { z } from 'zod'
import type { VersionChange } from './types'

export const createVersionSchema = z.object({
  version: z.string().trim().min(1, 'Nhập số phiên bản').regex(/^\d+(\.\d+){0,3}$/, 'Định dạng hợp lệ: 2.2 hoặc 2.2.1'),
  effectiveDate: z.string().min(1, 'Chọn ngày dự kiến áp dụng'),
  activeIngredients: z.string().trim().min(1, 'Nhập hoạt chất & hàm lượng').max(500, 'Tối đa 500 ký tự'),
  packaging: z.string().trim().max(150, 'Tối đa 150 ký tự'),
  shelfLife: z.string().trim().max(30, 'Tối đa 30 ký tự'),
  summary: z.string().trim().min(10, 'Mô tả tối thiểu 10 ký tự').max(500, 'Tối đa 500 ký tự'),
  changesText: z.string().max(1200, 'Tối đa 1200 ký tự').optional(),
})

export type CreateVersionFormValues = z.infer<typeof createVersionSchema>

/** Mỗi dòng: `Tên trường | Giá trị mới` hoặc `Tên trường | Cũ | Mới`. */
export function parseCustomChanges(text?: string): VersionChange[] {
  if (!text?.trim()) return []
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 3) return { field: parts[0], before: parts[1], after: parts.slice(2).join(' | '), kind: 'updated' as const }
      if (parts.length === 2) return { field: parts[0], after: parts[1], kind: 'added' as const }
      return { field: 'Nội dung thay đổi', after: line, kind: 'added' as const }
    })
}
