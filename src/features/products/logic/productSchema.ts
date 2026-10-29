import { z } from 'zod'

export const productSchema = z.object({
  code: z.string().trim().min(1, 'Nhập mã sản phẩm').max(30, 'Tối đa 30 ký tự'),
  version: z.string().trim().min(1, 'Nhập phiên bản').max(20, 'Tối đa 20 ký tự'),
  name: z.string().trim().min(1, 'Nhập tên sản phẩm').max(150, 'Tối đa 150 ký tự'),
  dosageFormId: z.string().min(1, 'Bắt buộc chọn dạng bào chế'),
  categoryId: z.string().min(1, 'Bắt buộc chọn phân loại'),
  activeIngredients: z.string().trim().min(1, 'Nhập hoạt chất & hàm lượng').max(500, 'Tối đa 500 ký tự'),
  regulation: z.string().min(1, 'Chọn quy định'),
  shelfLife: z.string().trim().max(30, 'Tối đa 30 ký tự'),
  packaging: z.string().trim().max(150, 'Tối đa 150 ký tự'),
  registrationNo: z.string().trim().max(50, 'Tối đa 50 ký tự'),
})

export type ProductFormValues = z.infer<typeof productSchema>
