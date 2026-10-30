import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Boxes, BookOpenCheck, CalendarCheck2, CalendarX2, Factory,
  FileText, FlaskConical, Hash, Layers, Package, Pill, Scale, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { useToast } from '@/core/components/Toast'
import { cn, formatDate } from '@/core/utils/format'
import type { Product } from '@/features/products/logic/types'
import { useLookups } from '@/features/products/logic/useLookups'
import { lifecycleLabelOf, lifecycleToneOf } from '../logic/approvalUtils'
import { buildDocuments, docsByGroup } from '../logic/documents'
import { downloadSingleDocument } from '../logic/downloadDossier'
import { DOC_GROUP_META, type ProductVersion, type VersionDocument } from '../logic/types'
import { versionEndDate } from '../logic/versionUtils'
import { DocumentList } from './frames/DocumentList'
import { DocumentViewerModal } from './DocumentViewerModal'

interface Names { dosage: string; category: string }

interface FieldDef {
  key: string
  label: string
  icon: LucideIcon
  get: (version: ProductVersion, names: Names) => string
}

const FIELD_DEFS: FieldDef[] = [
  { key: 'activeIngredients', label: 'Hoạt chất & hàm lượng', icon: FlaskConical, get: (v) => v.activeIngredients },
  { key: 'dosage', label: 'Dạng bào chế', icon: Pill, get: (_, n) => n.dosage },
  { key: 'category', label: 'Phân loại', icon: Layers, get: (_, n) => n.category },
  { key: 'packaging', label: 'Quy cách đóng gói', icon: Package, get: (v) => v.packaging || '—' },
  { key: 'shelfLife', label: 'Hạn dùng', icon: CalendarCheck2, get: (v) => v.shelfLife || '—' },
  { key: 'regulation', label: 'Quy định', icon: ShieldCheck, get: (v) => v.regulation },
  { key: 'registrationNo', label: 'Số đăng ký', icon: Hash, get: (v) => v.registrationNo || '—' },
  { key: 'effectiveDate', label: 'Ngày bắt đầu hiệu lực', icon: CalendarCheck2, get: (v) => formatDate(v.effectiveDate) },
  { key: 'effectiveEndDate', label: 'Ngày kết thúc hiệu lực', icon: CalendarX2, get: (v) => v.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(v)) || '—' },
  { key: 'manufacturer', label: 'Nơi sản xuất', icon: Factory, get: (v) => v.manufacturer },
  { key: 'manufacturingMethod', label: 'Cách thức sản xuất', icon: Workflow, get: (v) => v.manufacturingMethod },
]

const DOC_GROUPS = [
  { key: 'legal' as const, icon: ShieldCheck },
  { key: 'usage' as const, icon: BookOpenCheck },
  { key: 'packaging' as const, icon: Boxes },
  { key: 'professional' as const, icon: FileText },
]

interface Props {
  leftProduct: Product
  leftVersion: ProductVersion
  rightProduct: Product
  rightVersion: ProductVersion
  leftLabel?: string
  rightLabel?: string
  onBack?: () => void
  backLabel?: string
}

/** Hai hồ sơ phiên bản đặt cạnh nhau, làm nổi bật khác biệt ở phiên bản mới. */
export function VersionCompareView({
  leftProduct,
  leftVersion,
  rightProduct,
  rightVersion,
  leftLabel = 'Phiên bản cũ',
  rightLabel = 'Phiên bản mới',
  onBack,
  backLabel = 'Quay lại',
}: Props) {
  const lookups = useLookups()
  const toast = useToast()
  const [onlyDiff, setOnlyDiff] = useState(false)
  const [viewer, setViewer] = useState<{
    doc: VersionDocument
    product: Product
    version: ProductVersion
    names: Names
    other?: ProductVersion
  } | null>(null)

  const leftNames: Names = {
    dosage: lookups.dosageName(leftVersion.dosageFormId),
    category: lookups.categoryName(leftVersion.categoryId),
  }
  const rightNames: Names = {
    dosage: lookups.dosageName(rightVersion.dosageFormId),
    category: lookups.categoryName(rightVersion.categoryId),
  }

  const sameProduct = leftProduct.id === rightProduct.id
  const leftDocs = useMemo(
    () => buildDocuments(leftProduct, leftVersion),
    [leftProduct, leftVersion],
  )
  const rightDocs = useMemo(
    () => buildDocuments(rightProduct, rightVersion, sameProduct ? leftVersion.version : undefined),
    [rightProduct, rightVersion, sameProduct, leftVersion.version],
  )
  const leftGroupCounts = useMemo(() => groupCounts(leftDocs), [leftDocs])
  const rightGroupCounts = useMemo(() => groupCounts(rightDocs), [rightDocs])
  const visibleGroups = DOC_GROUPS.filter((g) => (leftGroupCounts[g.key] ?? 0) > 0 || (rightGroupCounts[g.key] ?? 0) > 0)

  const leftValues = FIELD_DEFS.map((f) => ({ ...f, value: f.get(leftVersion, leftNames) }))
  const rightValues = FIELD_DEFS.map((f) => ({ ...f, value: f.get(rightVersion, rightNames) }))
  const changedKeys = new Set(
    FIELD_DEFS.filter((_, i) => leftValues[i].value !== rightValues[i].value).map((f) => f.key),
  )
  const changedFields = FIELD_DEFS.filter((f) => changedKeys.has(f.key))
  const identical = changedKeys.size === 0 && leftVersion.version === rightVersion.version

  const downloadDoc = async (doc: VersionDocument) => {
    if (!viewer) return
    try {
      await downloadSingleDocument({
        product: viewer.product,
        version: viewer.version,
        previous: viewer.other,
        docs: viewer.product.id === leftProduct.id && viewer.version.id === leftVersion.id ? leftDocs : rightDocs,
        versions: [leftVersion, rightVersion],
        names: viewer.names,
      }, doc)
      toast.success(`Đã tải "${doc.name}"`)
    } catch {
      toast.error('Không thể tải tài liệu, vui lòng thử lại.')
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 px-5 py-6 text-white shadow-pop sm:px-7">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-cyan-200/15 blur-3xl" aria-hidden />

        <div className="relative">
          {onBack && (
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-100 transition hover:text-white">
              <ArrowLeft className="size-3.5" /> {backLabel}
            </button>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
              <Scale className="size-3.5" /> Đối chiếu hồ sơ phiên bản
            </span>
            {!identical && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-2.5 py-1 text-[11px] font-bold text-emerald-50 ring-1 ring-emerald-200/30">
                <Sparkles className="size-3.5" /> {changedFields.length} điểm khác biệt
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-4xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {sameProduct ? leftProduct.name : `${leftProduct.name} ↔ ${rightProduct.name}`}
          </h1>
          <p className="mt-1 text-sm text-brand-100">
            {sameProduct ? leftProduct.code : `${leftProduct.code} ↔ ${rightProduct.code}`} · So sánh {leftLabel.toLowerCase()} với {rightLabel.toLowerCase()}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <VersionHeroCard side="old" label={leftLabel} product={leftProduct} version={leftVersion} />
            <span className="hidden size-11 place-items-center rounded-full border border-white/25 bg-white/10 text-xs font-extrabold text-white shadow-lg backdrop-blur sm:grid">VS</span>
            <VersionHeroCard side="new" label={rightLabel} product={rightProduct} version={rightVersion} />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700 ring-1 ring-brand-100">
            <span className="size-2 rounded-full bg-brand-500" /> Nội dung mới được làm nổi bật
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-600 ring-1 ring-slate-200">
            <span className="size-2 rounded-full bg-slate-300" /> Giá trị trước khi cập nhật
          </span>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-800">
          <input type="checkbox" className="size-4 accent-brand-600" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
          Chỉ hiện điểm khác nhau
        </label>
      </div>

      {identical && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Hai hồ sơ đang giống nhau hoàn toàn ở các thuộc tính chính.
        </div>
      )}

      <div className="relative grid gap-5 xl:grid-cols-2 xl:gap-8">
        <span className="pointer-events-none absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-brand-300 to-transparent xl:block" aria-hidden />
        <DossierPanel
          side="old"
          label={leftLabel}
          product={leftProduct}
          version={leftVersion}
          names={leftNames}
          values={leftValues}
          otherValues={rightValues}
          changedKeys={changedKeys}
          onlyDiff={onlyDiff}
          docs={leftDocs}
          groupCounts={leftGroupCounts}
          otherGroupCounts={rightGroupCounts}
          visibleGroups={visibleGroups.map((g) => g.key)}
          onView={(doc) => setViewer({ doc, product: leftProduct, version: leftVersion, names: leftNames })}
          onDownload={(doc) => downloadSingleDocument({
            product: leftProduct, version: leftVersion, docs: leftDocs,
            versions: [leftVersion, rightVersion], names: leftNames,
          }, doc).then(() => toast.success(`Đã tải "${doc.name}"`)).catch(() => toast.error('Không thể tải tài liệu.'))}
        />

        <div className="flex justify-center xl:hidden">
          <span className="grid size-10 place-items-center rounded-full border border-brand-200 bg-white text-[11px] font-extrabold text-brand-700 shadow-soft">VS</span>
        </div>

        <DossierPanel
          side="new"
          label={rightLabel}
          product={rightProduct}
          version={rightVersion}
          names={rightNames}
          values={rightValues}
          otherValues={leftValues}
          changedKeys={changedKeys}
          onlyDiff={onlyDiff}
          docs={rightDocs}
          groupCounts={rightGroupCounts}
          otherGroupCounts={leftGroupCounts}
          visibleGroups={visibleGroups.map((g) => g.key)}
          onView={(doc) => setViewer({
            doc,
            product: rightProduct,
            version: rightVersion,
            names: rightNames,
            other: sameProduct ? leftVersion : undefined,
          })}
          onDownload={(doc) => downloadSingleDocument({
            product: rightProduct,
            version: rightVersion,
            previous: sameProduct ? leftVersion : undefined,
            docs: rightDocs,
            versions: [leftVersion, rightVersion],
            names: rightNames,
          }, doc).then(() => toast.success(`Đã tải "${doc.name}"`)).catch(() => toast.error('Không thể tải tài liệu.'))}
        />
      </div>

      <DocumentViewerModal
        open={!!viewer}
        doc={viewer?.doc ?? null}
        product={viewer?.product ?? leftProduct}
        version={viewer?.version ?? leftVersion}
        names={viewer?.names ?? leftNames}
        onClose={() => setViewer(null)}
        onDownload={downloadDoc}
      />
    </div>
  )
}

function VersionHeroCard({ side, label, product, version }: {
  side: 'old' | 'new'
  label: string
  product: Product
  version: ProductVersion
}) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 ring-1 backdrop-blur',
      side === 'new'
        ? 'border-white/30 bg-white/15 ring-white/20'
        : 'border-white/15 bg-white/8 ring-white/10',
    )}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-100">{label}</p>
        <Badge tone={lifecycleToneOf(version)}>{lifecycleLabelOf(version)}</Badge>
      </div>
      <p className="mt-1 text-xl font-extrabold">Phiên bản {version.version}</p>
      <p className="mt-0.5 truncate text-[11px] text-brand-100">{product.code} · {product.name}</p>
      <p className="mt-2 text-[10px] text-brand-100/80">
        Hiệu lực {formatDate(version.effectiveDate)} – {version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version)) || '—'}
      </p>
    </div>
  )
}

interface DossierProps {
  side: 'old' | 'new'
  label: string
  product: Product
  version: ProductVersion
  names: Names
  values: (FieldDef & { value: string })[]
  otherValues: (FieldDef & { value: string })[]
  changedKeys: Set<string>
  onlyDiff: boolean
  docs: VersionDocument[]
  groupCounts: Record<string, number>
  otherGroupCounts: Record<string, number>
  visibleGroups: VersionDocument['group'][]
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
}

function DossierPanel({
  side, label, product, version, values, otherValues, changedKeys, onlyDiff, docs, groupCounts, otherGroupCounts,
  visibleGroups, onView, onDownload,
}: DossierProps) {
  const isNew = side === 'new'
  const fields = onlyDiff ? values.filter((f) => changedKeys.has(f.key)) : values
  const otherMap = new Map(otherValues.map((f) => [f.key, f.value]))

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-white shadow-soft',
        isNew ? 'border-brand-200 ring-2 ring-brand-100' : 'border-line',
      )}
    >
      <header className={cn('relative overflow-hidden px-5 py-4', isNew ? 'bg-linear-to-br from-brand-800 via-brand-700 to-brand-500 text-white' : 'bg-linear-to-br from-slate-100 to-white text-brand-900')}>
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-[9px] font-bold uppercase tracking-[0.16em]', isNew ? 'text-brand-100' : 'text-muted')}>{label}</p>
            <h2 className="mt-0.5 text-xl font-extrabold">Phiên bản {version.version}</h2>
            <p className={cn('mt-0.5 text-[11px]', isNew ? 'text-brand-100' : 'text-muted')}>{product.code} · {product.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge tone={lifecycleToneOf(version)}>{lifecycleLabelOf(version)}</Badge>
            {isNew && <span className="rounded-full bg-emerald-300/25 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-50 ring-1 ring-emerald-200/30">Bản mới</span>}
          </div>
        </div>
        <p className={cn('relative mt-2 text-[10px]', isNew ? 'text-brand-100/80' : 'text-muted')}>
          Cập nhật {formatDate(version.updatedAt)} · Quyết định {version.approvalNo}
        </p>
      </header>

      <div className="space-y-4 px-3 py-4 sm:px-4">
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              <ShieldCheck className="size-3.5 text-brand-500" /> Thông tin chung
            </h3>
            <span className="text-[10px] text-muted">{fields.length} thuộc tính</span>
          </div>
          <div className="space-y-1.5">
            {fields.map((f) => {
              const changed = changedKeys.has(f.key)
              const other = otherMap.get(f.key)
              const Icon = f.icon
              return (
                <div
                  key={f.key}
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
                    changed
                      ? isNew
                        ? 'border-brand-200 bg-linear-to-r from-brand-50/90 to-white ring-1 ring-brand-100'
                        : 'border-slate-200 bg-slate-50/80'
                      : 'border-line bg-white',
                  )}
                >
                  <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', isNew && changed ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 ring-1 ring-brand-100')}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{f.label}</p>
                      {changed && <Badge tone={isNew ? 'green' : 'gray'}>{isNew ? 'Mới' : 'Trước'}</Badge>}
                    </div>
                    {isNew && changed && other && <p className="mt-0.5 text-[10px] text-muted line-through">{other}</p>}
                    <p className={cn('mt-0.5 text-xs font-semibold leading-snug', changed && isNew ? 'text-brand-900' : 'text-brand-900/90')}>{f.value}</p>
                  </div>
                </div>
              )
            })}
            {fields.length === 0 && (
              <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                Không có thuộc tính khác biệt.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <FileText className="size-3.5 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Hồ sơ đính kèm</h3>
          </div>
          <div className="space-y-3">
            {visibleGroups.map((group) => {
              const meta = DOC_GROUPS.find((g) => g.key === group)!
              const GroupIcon = meta.icon
              const groupDocs = docsByGroup(docs, group)
              const countChanged = (groupCounts[group] ?? 0) !== (otherGroupCounts[group] ?? 0)
              return (
                <div key={group} className={cn('overflow-hidden rounded-2xl border', countChanged && isNew ? 'border-brand-200' : 'border-line')}>
                  <div className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-2', countChanged && isNew ? 'bg-brand-50/80' : 'bg-slate-50/70')}>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                      <GroupIcon className="size-3.5 text-brand-500" /> {DOC_GROUP_META[group].title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {countChanged && <Badge tone="amber">Thay đổi</Badge>}
                      <Badge tone="gray">{groupDocs.length} tệp</Badge>
                    </div>
                  </div>
                  <DocumentList docs={groupDocs} onView={onView} onDownload={onDownload} emptyText="Không có tệp trong nhóm này." />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </motion.section>
  )
}

function groupCounts(docs: VersionDocument[]) {
  return docs.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.group] = (acc[doc.group] ?? 0) + 1
    return acc
  }, {})
}
