import { Pill } from 'lucide-react'
import { CatalogCrud } from '@/core/components/CatalogCrud'
import { useUsageCount } from '@/features/products/logic/useUsageCount'
import { dosageFormHooks } from '../logic/dosageForms'

export default function DosageFormsPage() {
  const usage = useUsageCount('dosageFormId')
  return (
    <CatalogCrud
      title="Dạng bào chế" description="Tự thêm dạng bào chế mới, không cần nhờ quản trị hệ thống"
      noun="dạng bào chế" icon={Pill} hooks={dosageFormHooks} usage={usage}
    />
  )
}
