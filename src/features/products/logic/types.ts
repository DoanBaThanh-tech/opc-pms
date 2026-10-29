export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'discontinued'

export interface Product {
  id: number
  code: string
  name: string
  version: string
  dosageFormId: number
  categoryId: number
  activeIngredients: string
  regulation: string
  packaging: string
  registrationNo: string
  shelfLife: string
  status: ProductStatus
  updatedAt: string
}

export type ProductInput = Omit<Product, 'id' | 'status' | 'updatedAt'>
