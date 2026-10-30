import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Eye, FileText, FlaskConical, Layers, Pill, Plus } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Select } from '@/core/components/Select'
import type { Product, ProductStatus } from '@/features/products/logic/types'
import { STATUS_META } from '@/features/products/logic/constants'
import { lifecycleLabelOf } from '../logic/approvalUtils'
import type { ProductVersion } from '../logic/types'

interface Props {
  product: Product
  version: ProductVersion
  versions: ProductVersion[]
  dosageName: string
  categoryName: string
  docsCount: number
  downloading: boolean
  creating?: boolean
  canCreate?: boolean
  onSelect: (versionId: number) => void
  onCreate: () => void
  onDownload: () => void
}

const STATUS_DOT: Record<ProductStatus, string> = {
  draft: 'bg-slate-300',
  pending: 'bg-amber-300',
  approved: 'bg-emerald-300',
  rejected: 'bg-red-300',
  discontinued: 'bg-slate-400',
}

export function DetailHero({ product, version, versions, dosageName, categoryName, docsCount, downloading, creating, canCreate = true, onSelect, onCreate, onDownload }: Props) {
  const [pendingId, setPendingId] = useState(String(version.id))

  const apply = () => {
    const id = Number(pendingId)
    if (id && id !== version.id) onSelect(id)
  }
  const options = versions.map((v) => ({ value: v.id, label: `v${v.version} · ${lifecycleLabelOf(v)}` }))
  const statusMeta = STATUS_META[product.status]

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 px-5 py-6 text-white shadow-pop sm:px-7 sm:py-7">
      <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-cyan-200/15 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-100 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> Danh mục sản phẩm
            <span className="text-white/40">/</span>
            <span className="text-white/70">Chi tiết sản phẩm</span>
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide ring-1 ring-white/20">{product.code}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
              <span className={`size-1.5 rounded-full ${STATUS_DOT[product.status]}`} />
              {statusMeta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
              Phiên bản {version.version}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl xl:text-[2.15rem]">{product.name}</h1>

          <div className="mt-3 flex max-w-3xl items-start gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-brand-200" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-100/80">Hoạt chất & hàm lượng</p>
              <p className="mt-0.5 text-sm font-medium leading-relaxed text-white/95">{version.activeIngredients}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-brand-50">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><Pill className="size-3 text-brand-200" /> {dosageName}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><Layers className="size-3 text-brand-200" /> {categoryName}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10"><FileText className="size-3 text-brand-200" /> {docsCount} tài liệu</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/10">SĐK: {version.registrationNo || '—'}</span>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-[21.5rem]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="light" icon={<Plus className="size-4" />} loading={creating} onClick={onCreate} disabled={!canCreate} title={canCreate ? 'Tạo phiên bản mới' : 'Tổ Kinh doanh chỉ được xem và tải tài liệu'} className="flex-[1.35] whitespace-nowrap">Tạo phiên bản mới</Button>
            <Button variant="glass" icon={<Download className="size-4" />} loading={downloading} onClick={onDownload} className="flex-1 whitespace-nowrap">Tải hồ sơ</Button>
          </div>

          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-100">Chuyển phiên bản</p>
              <span className="text-[10px] font-medium text-brand-100/80">{versions.length} phiên bản</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Select
                aria-label="Chọn phiên bản để xem"
                options={options}
                value={pendingId}
                onChange={(e) => setPendingId(e.target.value)}
                className="!h-10 text-xs"
              />
              <Button size="sm" variant="light" icon={<Eye className="size-4" />} onClick={apply} disabled={pendingId === String(version.id)} className="!h-10 shrink-0">
                Xem
              </Button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-brand-100/75">Phiên bản cũ chỉ được xem và tải hồ sơ, không thể áp dụng lại.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
