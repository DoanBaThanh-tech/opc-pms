import type { Product } from './types'

/** Sinh mã sản phẩm kế tiếp dạng SP001, SP012… dựa trên mã đã có. */
export function suggestNextProductCode(products: Product[]) {
  const max = products.reduce((highest, product) => {
    const match = /^SP(\d+)$/i.exec(product.code.trim())
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
  return `SP${String(max + 1).padStart(3, '0')}`
}
