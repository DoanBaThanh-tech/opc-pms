import { GitCompare } from 'lucide-react'
import { PageHeader } from '@/core/components/PageHeader'
import { Select } from '@/core/components/Select'
import { cn } from '@/core/utils/format'
import { useLookups } from '@/features/products/logic/useLookups'
import { useProducts } from '@/features/products/logic/useProducts'
import { ProductSearchBar } from '@/features/products/ui/ProductSearchBar'
import { useComparison } from '../logic/useComparison'

export default function ComparisonPage() {
  const { data: products = [] } = useProducts()
  const lookups = useLookups()
  const c = useComparison(products, lookups)
  const options = products.map((p) => ({ value: p.id, label: `${p.code} – ${p.name} (v${p.version})` }))
  const ready = c.selected.length >= 2

  return (
    <>
      <PageHeader title="So sánh sản phẩm" description="Chọn 2–3 sản phẩm hoặc phiên bản để đặt cạnh nhau" />
      <ProductSearchBar
        className="mb-4"
        placeholder="Tìm thuốc để thêm vào so sánh..."
        onSelect={(p) => {
          const empty = c.ids.findIndex((slot) => !slot)
          c.setSlot(empty >= 0 ? empty : 0, String(p.id))
        }}
      />
      <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft md:grid-cols-3">
        {c.ids.map((id, i) => (
          <Select key={i} label={`Sản phẩm ${i + 1}${i === 2 ? ' (tùy chọn)' : ''}`} placeholder="— Chọn sản phẩm —" options={options} value={id} onChange={(e) => c.setSlot(i, e.target.value)} />
        ))}
      </div>

      {!ready ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-16 text-center">
          <GitCompare className="size-10 animate-float text-brand-400" strokeWidth={1.5} />
          <p className="text-sm text-muted">Chọn ít nhất 2 sản phẩm để bắt đầu so sánh.</p>
        </div>
      ) : (
        <>
          <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-brand-600" checked={c.onlyDiff} onChange={(e) => c.setOnlyDiff(e.target.checked)} />
            Chỉ hiện điểm khác nhau
          </label>
          <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-brand-50/80">
                  <th className="sticky left-0 z-10 w-40 bg-brand-50 px-4 py-3 text-xs uppercase tracking-wide text-brand-800">Thuộc tính</th>
                  {c.selected.map((p) => (
                    <th key={p.id} className="px-4 py-3 align-top">
                      <div className="font-bold text-brand-900">{p.name}</div>
                      <div className="text-xs font-medium text-muted">Phiên bản {p.version}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {c.rows.map((r) => (
                  <tr key={r.label} className={cn(r.different && 'bg-amber-50/70')}>
                    <th className={cn('sticky left-0 z-10 px-4 py-3 align-top font-semibold', r.different ? 'bg-amber-50' : 'bg-white')}>{r.label}</th>
                    {r.values.map((v, i) => <td key={i} className="px-4 py-3 align-top">{v}</td>)}
                  </tr>
                ))}
                {c.rows.length === 0 && <tr><td colSpan={c.selected.length + 1} className="px-4 py-10 text-center text-muted">Các sản phẩm giống nhau hoàn toàn.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Dòng nền vàng là thuộc tính có sự khác biệt.</p>
        </>
      )}
    </>
  )
}
