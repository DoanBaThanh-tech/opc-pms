import { Layers } from 'lucide-react'
import { CatalogCrud } from '@/core/components/CatalogCrud'
import { useUsageCount } from '@/features/products/logic/useUsageCount'
import { categoryHooks } from '../logic/categories'

export default function CategoriesPage() {
  const usage = useUsageCount('categoryId')
  return (
    <CatalogCrud
      title="Phân loại" description="Thuốc, mỹ phẩm, thực phẩm chức năng, nước uống thảo mộc... và các loại mới"
      noun="phân loại" icon={Layers} hooks={categoryHooks} usage={usage}
    />
  )
}
