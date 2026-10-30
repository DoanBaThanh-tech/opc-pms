import { useMemo, useState } from 'react'
import { ArrowRight, GitCompare, Info } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { PageHeader } from '@/core/components/PageHeader'
import { Select } from '@/core/components/Select'
import { cn, formatDate } from '@/core/utils/format'
import { lifecycleLabelOf, lifecycleToneOf } from '@/features/product-detail/logic/approvalUtils'
import { useProductVersions } from '@/features/product-detail/logic/useProductVersions'
import { getCurrentVersion, latestVersionOf, sortVersions, versionEndDate } from '@/features/product-detail/logic/versionUtils'
import { VersionCompareView } from '@/features/product-detail/ui/VersionCompareView'
import { useProducts } from '@/features/products/logic/useProducts'
import { ProductSearchBar } from '@/features/products/ui/ProductSearchBar'

export default function ComparisonPage() {
  const { data: products = [] } = useProducts()
  const [ids, setIds] = useState<string[]>(['', ''])
  const p1 = products.find((p) => String(p.id) === ids[0])
  const p2 = products.find((p) => String(p.id) === ids[1])

  const v1 = useProductVersions(p1?.id ?? 0)
  const v2 = useProductVersions(p2?.id ?? 0)

  const leftVersion = useMemo(() => {
    const sorted = sortVersions(v1.data ?? [])
    return getCurrentVersion(sorted) ?? latestVersionOf(sorted)
  }, [v1.data])
  const rightVersion = useMemo(() => latestVersionOf(v2.data ?? []), [v2.data])

  const options = products.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` }))
  const ready = !!p1 && !!p2 && !!leftVersion && !!rightVersion
  const loading = (v1.isLoading && !!p1) || (v2.isLoading && !!p2)
  const sameProduct = p1?.id === p2?.id
  const identical = sameProduct && leftVersion?.id === rightVersion?.id

  const setSlot = (slot: number, id: string) =>
    setIds((s) => s.map((v, i) => (i === slot ? id : v)))

  return (
    <>
      <PageHeader title="So sánh sản phẩm" description="Chọn 2 sản phẩm để đặt hai hồ sơ phiên bản cạnh nhau và làm nổi bật khác biệt" />

      <ProductSearchBar
        className="mb-4"
        placeholder="Tìm thuốc để thêm vào so sánh..."
        onSelect={(p) => {
          const empty = ids.findIndex((slot) => !slot)
          setSlot(empty >= 0 ? empty : 0, String(p.id))
        }}
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft md:grid-cols-2">
        {ids.map((id, i) => (
          <div key={i} className="space-y-2">
            <Select
              label={i === 0 ? 'Sản phẩm thứ nhất · phiên bản đang lưu hành' : 'Sản phẩm thứ hai · phiên bản mới nhất'}
              placeholder="— Chọn sản phẩm —"
              options={options}
              value={id}
              onChange={(e) => setSlot(i, e.target.value)}
            />
            {i === 0 && leftVersion && (
              <VersionResolved version={leftVersion} />
            )}
            {i === 1 && rightVersion && (
              <VersionResolved version={rightVersion} />
            )}
          </div>
        ))}
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-brand-800">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Ô thứ nhất luôn hiển thị <b>phiên bản đang lưu hành</b>. Ô thứ hai hiển thị <b>phiên bản mới nhất</b> hiện có.
          Chọn cùng một sản phẩm ở cả hai ô để đối chiếu bản đang lưu hành với bản cập nhật mới nhất.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="skeleton h-[40rem] rounded-3xl" />
          <div className="skeleton h-[40rem] rounded-3xl" />
        </div>
      ) : !ready ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-16 text-center">
          <GitCompare className="size-10 animate-float text-brand-400" strokeWidth={1.5} />
          <p className="text-sm text-muted">Chọn đủ 2 sản phẩm để bắt đầu đối chiếu hồ sơ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {identical && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Sản phẩm này chưa có phiên bản mới hơn, nên hai hồ sơ đang trùng nhau. Chọn sản phẩm khác hoặc tạo phiên bản mới để có dữ liệu đối chiếu.
            </div>
          )}
          <VersionCompareView
            leftProduct={p1}
            leftVersion={leftVersion}
            rightProduct={p2}
            rightVersion={rightVersion}
            leftLabel="Phiên bản đang lưu hành"
            rightLabel="Phiên bản mới nhất"
          />
        </div>
      )}
    </>
  )
}

function VersionResolved({ version }: { version: NonNullable<ReturnType<typeof latestVersionOf>> }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[11px]', 'border-line bg-brand-50/40')}>
      <span className="font-bold text-brand-900">Hiển thị phiên bản {version.version}</span>
      <Badge tone={lifecycleToneOf(version)}>{lifecycleLabelOf(version)}</Badge>
      <span className="flex items-center gap-1 text-muted">
        <ArrowRight className="size-3" />
        {formatDate(version.effectiveDate)}
        {version.indefinite ? ' – Vô thời hạn' : ` – ${formatDate(versionEndDate(version)) || '—'}`}
      </span>
    </div>
  )
}
