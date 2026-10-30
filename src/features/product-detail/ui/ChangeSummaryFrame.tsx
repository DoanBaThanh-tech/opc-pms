import { ArrowRight, GitCompare, Info, Scale } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { cn, formatDate } from '@/core/utils/format'
import { changeTone, legalBasisForChange } from '../logic/approvalUtils'
import type { ProductVersion, VersionChange } from '../logic/types'
import { versionEndDate } from '../logic/versionUtils'
import { Frame } from './frames/Frame'

interface Props {
  version: ProductVersion
  previous?: ProductVersion
  dosageName: string
  categoryName: string
  previousDosageName?: string
  previousCategoryName?: string
}

interface FieldDef {
  field: string
  label: string
  value: string
}

/** Tóm tắt thay đổi của phiên bản: thông tin chung + bảng hạng mục kỹ thuật. */
export function ChangeSummaryFrame({
  version, previous, dosageName, categoryName, previousDosageName, previousCategoryName,
}: Props) {
  const fields: FieldDef[] = [
    { field: 'Hoạt chất & hàm lượng', label: 'Hoạt chất & hàm lượng', value: version.activeIngredients },
    { field: 'Dạng bào chế', label: 'Dạng bào chế', value: dosageName },
    { field: 'Phân loại', label: 'Phân loại', value: categoryName },
    { field: 'Quy cách đóng gói', label: 'Quy cách đóng gói', value: version.packaging || '—' },
    { field: 'Hạn dùng', label: 'Hạn dùng', value: version.shelfLife || '—' },
    { field: 'Quy định', label: 'Quy định', value: version.regulation },
    { field: 'Số đăng ký', label: 'Số đăng ký', value: version.registrationNo || '—' },
    { field: 'Nơi sản xuất', label: 'Nơi sản xuất', value: version.manufacturer },
    { field: 'Cách thức sản xuất', label: 'Cách thức sản xuất', value: version.manufacturingMethod },
    { field: 'Ngày bắt đầu hiệu lực', label: 'Ngày bắt đầu hiệu lực', value: formatDate(version.effectiveDate) },
    { field: 'Ngày kết thúc hiệu lực', label: 'Ngày kết thúc hiệu lực', value: version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version)) || '—' },
  ]

  const changeByField = new Map(version.changes.map((c) => [c.field, c]))

  // Bổ sung các hạng mục kỹ thuật thay đổi nhưng chưa có trong change log (ví dụ dạng bào chế, phân loại).
  const previousFields: FieldDef[] | null = previous
    ? [
        { field: 'Hoạt chất & hàm lượng', label: 'Hoạt chất & hàm lượng', value: previous.activeIngredients },
        { field: 'Dạng bào chế', label: 'Dạng bào chế', value: previousDosageName ?? dosageName },
        { field: 'Phân loại', label: 'Phân loại', value: previousCategoryName ?? categoryName },
        { field: 'Quy cách đóng gói', label: 'Quy cách đóng gói', value: previous.packaging || '—' },
        { field: 'Hạn dùng', label: 'Hạn dùng', value: previous.shelfLife || '—' },
        { field: 'Quy định', label: 'Quy định', value: previous.regulation },
        { field: 'Số đăng ký', label: 'Số đăng ký', value: previous.registrationNo || '—' },
        { field: 'Nơi sản xuất', label: 'Nơi sản xuất', value: previous.manufacturer },
        { field: 'Cách thức sản xuất', label: 'Cách thức sản xuất', value: previous.manufacturingMethod },
      ]
    : null
  const previousByField = new Map((previousFields ?? []).map((f) => [f.field, f.value]))
  const derivedChanges: VersionChange[] = previousFields
    ? fields
        .filter((f) => previousByField.has(f.field) && previousByField.get(f.field) !== f.value)
        .map((f) => ({
          field: f.field,
          before: previousByField.get(f.field) ?? '',
          after: f.value,
          kind: 'updated' as const,
        }))
    : []
  const tableChanges = [
    ...version.changes,
    ...derivedChanges.filter((c) => !changeByField.has(c.field)),
  ]
  const summaryByField = new Map(tableChanges.map((c) => [c.field, c]))
  const changedFields = fields.filter((f) => summaryByField.has(f.field))

  return (
    <Frame
      icon={GitCompare}
      title={`Tóm tắt thay đổi của phiên bản ${version.version}`}
      subtitle={previous ? `Đối chiếu với phiên bản ${previous.version} đang lưu hành trước đó.` : 'So sánh với hồ sơ gốc của sản phẩm.'}
      count={tableChanges.length}
      countLabel="thay đổi"
    >
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Info className="size-3.5 text-brand-500" /> Thông tin chung của sản phẩm
          </h3>
          <Badge tone="blue">{changedFields.length} nội dung thay đổi</Badge>
          <span className="text-[10px] text-muted">Hạng mục không thay đổi được giữ nguyên</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map((f) => {
            const change = summaryByField.get(f.field)
            const changed = !!change
            return (
              <div
                key={f.field}
                className={cn(
                  'rounded-xl border px-3 py-2.5 transition',
                  changed ? 'border-brand-200 bg-linear-to-br from-brand-50/80 to-white ring-1 ring-brand-100' : 'border-line bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{f.label}</p>
                  {changed && <Badge tone="amber">Thay đổi</Badge>}
                </div>
                {changed && change.before && <p className="mt-1 text-[11px] text-muted line-through">{change.before}</p>}
                <p className={cn('mt-0.5 text-xs font-semibold leading-snug', changed ? 'text-brand-800' : 'text-brand-900')}>
                  {change?.after || f.value}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Scale className="size-3.5 text-brand-500" /> Bảng đối chiếu hạng mục kỹ thuật
          </h3>
          <Badge tone="gray">{tableChanges.length} dòng</Badge>
        </div>

        {tableChanges.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-xs text-muted">
            Không có thay đổi nào so với phiên bản trước. Toàn bộ thông tin được giữ nguyên.
          </p>
        ) : (
          <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-linear-to-r from-brand-900 via-brand-700 to-brand-600 text-white">
                  <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wide">Hạng mục kỹ thuật</th>
                  <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wide">Phiên bản trước</th>
                  <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wide">Phiên bản mới</th>
                  <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wide">Căn cứ pháp lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tableChanges.map((c, i) => {
                  const tone = changeTone(c.kind)
                  return (
                    <tr key={`${c.field}-${i}`} className="align-top transition hover:bg-brand-50/40">
                      <td className="px-3.5 py-3">
                        <p className="text-xs font-bold text-brand-900">{c.field}</p>
                        <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold', tone.cls)}>{tone.label}</span>
                      </td>
                      <td className="px-3.5 py-3 text-xs text-muted">
                        {c.before ? <span className="line-through decoration-slate-300">{c.before}</span> : <span className="italic">—</span>}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="inline-flex rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
                          {c.after || '—'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-[11px] leading-relaxed text-muted">
                        <span className="inline-flex items-start gap-1.5">
                          <ArrowRight className="mt-0.5 size-3 shrink-0 text-brand-400" />
                          {legalBasisForChange(c)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 flex items-start gap-1.5 px-1 text-[10px] leading-relaxed text-muted">
          <Info className="mt-0.5 size-3 shrink-0" />
          Căn cứ pháp lý là dữ liệu tham chiếu theo quy định đăng ký thuốc và ghi nhãn; có thể cấu hình lại theo văn bản hiện hành của Cục Quản lý Dược.
        </p>
      </section>
    </Frame>
  )
}
