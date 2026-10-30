import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { useProducts } from '@/features/products/logic/useProducts'
import { useProductVersions } from '../logic/useProductVersions'
import { sortVersions } from '../logic/versionUtils'
import { VersionCompareView } from './VersionCompareView'

export default function VersionComparePage() {
  const { id, oldId, newId } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: versions = [], isLoading: loadingVersions } = useProductVersions(
    Number.isFinite(productId) ? productId : 0,
  )
  const product = products.find((p) => p.id === productId)
  const sorted = useMemo(() => sortVersions(versions), [versions])
  const left = sorted.find((v) => v.id === Number(oldId))
  const right = sorted.find((v) => v.id === Number(newId))

  if (loadingProducts || (product && loadingVersions)) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-72 rounded-[1.75rem]" />
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="skeleton h-[40rem] rounded-3xl" />
          <div className="skeleton h-[40rem] rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!product || !left || !right) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-20 text-center">
        <PackageSearch className="size-12 text-brand-300" strokeWidth={1.5} />
        <h1 className="text-xl font-extrabold text-brand-900">Không tìm thấy hồ sơ để đối chiếu</h1>
        <p className="max-w-sm text-sm text-muted">Một trong hai phiên bản không tồn tại hoặc đã bị xóa khỏi sản phẩm.</p>
        <Link to={product ? `/products/${product.id}` : '/products'}>
          <Button variant="secondary" icon={<ArrowLeft className="size-4" />}>Về chi tiết sản phẩm</Button>
        </Link>
      </div>
    )
  }

  return (
    <VersionCompareView
      leftProduct={product}
      leftVersion={left}
      rightProduct={product}
      rightVersion={right}
      leftLabel="Phiên bản trước"
      rightLabel="Phiên bản mới"
      onBack={() => navigate(`/products/${product.id}/versions/${right.id}`)}
      backLabel={`Quay lại phiên bản ${right.version}`}
    />
  )
}
