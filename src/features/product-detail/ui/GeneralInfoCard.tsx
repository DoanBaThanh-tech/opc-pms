import type { LucideIcon } from 'lucide-react'
import { CalendarClock, CalendarCheck2, ClipboardList, Factory, Hash, Layers, Package, Pencil, Pill, ShieldCheck, Workflow } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { formatDate } from '@/core/utils/format'
import { STAGE_META, type ProductVersion } from '../logic/types'

interface Props {
  version: ProductVersion
  dosageName: string
  categoryName: string
  stageLabel?: string
  onEdit?: () => void
}

interface FieldDef { icon: LucideIcon; label: string; value: string; wide?: boolean }

export function GeneralInfoCard({ version, dosageName, categoryName, stageLabel, onEdit }: Props) {
  const fields: FieldDef[] = [
    { icon: Hash, label: 'Số đăng ký', value: version.registrationNo || '—' },
    { icon: Pill, label: 'Dạng bào chế', value: dosageName },
    { icon: Layers, label: 'Phân loại', value: categoryName },
    { icon: CalendarClock, label: 'Hạn dùng', value: version.shelfLife || '—' },
    { icon: CalendarCheck2, label: 'Ngày hiệu lực', value: formatDate(version.effectiveDate) },
    { icon: ShieldCheck, label: 'Quy định', value: version.regulation },
    { icon: Package, label: 'Quy cách đóng gói', value: version.packaging || '—' },
    { icon: Factory, label: 'Nơi sản xuất', value: version.manufacturer, wide: true },
    { icon: Workflow, label: 'Cách thức sản xuất', value: version.manufacturingMethod, wide: true },
  ]
  const stage = STAGE_META[version.stage]

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <header className="flex items-start gap-3 border-b border-line/70 bg-linear-to-r from-brand-50/90 via-white to-white px-4 py-4 sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-sky-400 to-brand-600 text-white shadow-[0_8px_18px_-8px_rgb(2_132_199/0.8)]">
          <ClipboardList className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight text-brand-900 sm:text-lg">Thông tin chung</h2>
            <Badge tone="blue">v{version.version}</Badge>
            <Badge tone={stage.tone}>{stageLabel ?? stage.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">Ảnh chụp dữ liệu hồ sơ theo phiên bản đang xem.</p>
        </div>
        {onEdit && (
          <Button size="sm" variant="secondary" icon={<Pencil className="size-4" />} onClick={onEdit} className="shrink-0">
            Cập nhật
          </Button>
        )}
      </header>

      <div className="grid gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5 2xl:grid-cols-3">
        {fields.map(({ icon: Icon, label, value, wide }) => (
          <div key={label} className={wide ? 'flex items-start gap-3 sm:col-span-2 2xl:col-span-3' : 'flex items-start gap-3'}>
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-brand-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
