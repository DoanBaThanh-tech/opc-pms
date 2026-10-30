import { CalendarCheck2, CalendarClock, CalendarX2, CheckCircle2, Infinity as InfinityIcon, Pencil, Rocket, ShieldAlert } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { formatDate } from '@/core/utils/format'
import { approvalStatusOf } from '../logic/approvalUtils'
import type { ProductVersion } from '../logic/types'
import { versionEndDate } from '../logic/versionUtils'
import { Frame } from './frames/Frame'

interface Props {
  version: ProductVersion
  applying: boolean
  savingIndefinite: boolean
  canEditDates: boolean
  canApplyRole: boolean
  roleName: string
  onApplyNow: () => void
  onToggleIndefinite: (value: boolean) => void
  onEditDates: () => void
}

/** Cấu hình thời gian hiệu lực, áp dụng ngay và hiệu lực vô thời hạn. */
export function EffectiveValidityFrame({
  version, applying, savingIndefinite, canEditDates, canApplyRole, roleName,
  onApplyNow, onToggleIndefinite, onEditDates,
}: Props) {
  const status = approvalStatusOf(version)
  const isCurrent = version.stage === 'current'
  const isComing = version.stage === 'coming_soon'
  const canApply = isComing && status === 'approved' && canApplyRole
  const archived = version.stage === 'archived'

  const applyHint = isCurrent
    ? 'Phiên bản đang được lưu hành.'
    : status === 'processing'
      ? 'Cần hoàn tất bước xử lý của tổ phụ trách trước khi áp dụng.'
      : status === 'pending'
        ? 'Cần hoàn tất phê duyệt cuối trước khi áp dụng.'
        : status === 'rejected'
          ? 'Phiên bản đã bị từ chối, không thể áp dụng.'
          : canApplyRole
            ? `Sẵn sàng áp dụng từ ${formatDate(version.effectiveDate)}.`
            : `Chỉ Tổ ĐK Thuốc được áp dụng phiên bản. Vai trò hiện tại: ${roleName}.`

  return (
    <Frame
      icon={CalendarClock}
      title="Cấu hình thời gian có hiệu lực của phiên bản"
      subtitle="Thiết lập thời gian lưu hành và lựa chọn hiệu lực vô thời hạn."
      actions={(
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={<Pencil className="size-4" />}
            onClick={onEditDates}
            disabled={archived || !canEditDates}
            title={canEditDates ? 'Chỉnh sửa thời gian hiệu lực' : 'Chỉ Tổ ĐK Thuốc được chỉnh sửa thời gian hiệu lực'}
          >
            Chỉnh sửa thời gian
          </Button>
          <Button
            size="sm"
            icon={<Rocket className="size-4" />}
            loading={applying}
            onClick={onApplyNow}
            disabled={!canApply || archived}
            title={applyHint}
            className="whitespace-nowrap"
          >
            Áp dụng ngay
          </Button>
        </div>
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50/80 to-white p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            <CalendarCheck2 className="size-3.5" /> Ngày bắt đầu có hiệu lực
          </p>
          <p className="mt-1 text-lg font-extrabold text-brand-900">{formatDate(version.effectiveDate)}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50/80 to-white p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            {version.indefinite ? <InfinityIcon className="size-3.5" /> : <CalendarX2 className="size-3.5" />} Ngày kết thúc có hiệu lực
          </p>
          <p className="mt-1 text-lg font-extrabold text-brand-900">
            {version.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(version)) || '—'}
          </p>
        </div>
      </div>

      <label className={`mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition ${version.indefinite ? 'border-brand-300 bg-brand-50/70' : 'border-line bg-white hover:border-brand-200'}`}>
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-brand-600"
          checked={!!version.indefinite}
          disabled={archived || savingIndefinite || !canEditDates}
          onChange={(e) => onToggleIndefinite(e.target.checked)}
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-bold text-brand-900">
            Hiệu lực vô thời hạn
            {version.indefinite && <Badge tone="green">Đang bật</Badge>}
          </span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
            Phiên bản được sử dụng liên tục cho tới khi có bản cập nhật mới. Khi hết hạn, người có quyền có thể điều chỉnh
            ngày kết thúc để phiên bản tiếp tục được dùng.
          </span>
        </span>
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/60 px-3 py-2.5 text-[11px] text-brand-800">
        {canApply ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" /> : <ShieldAlert className="size-3.5 shrink-0 text-amber-600" />}
        <span>{applyHint}</span>
        {isCurrent && version.appliedAt && <span className="font-semibold">· Áp dụng từ {formatDate(version.appliedAt)}</span>}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted">
        Tổ ĐK Thuốc phụ trách chỉnh sửa thời gian hiệu lực; các tổ khác chỉ theo dõi. Khi hết hạn, người có quyền có thể điều chỉnh
        ngày kết thúc để phiên bản tiếp tục được sử dụng.
      </p>
    </Frame>
  )
}
