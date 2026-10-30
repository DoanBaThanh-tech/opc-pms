import { useState } from 'react'
import { CalendarClock, Save } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import type { ProductVersion, UpdateVersionInfoInput } from '../logic/types'
import { versionEndDate } from '../logic/versionUtils'

interface Props {
  open: boolean
  version: ProductVersion
  saving: boolean
  onClose: () => void
  onSubmit: (input: UpdateVersionInfoInput) => void
}

/** Chỉnh nhanh ngày hiệu lực và cờ vô thời hạn từ frame cấu hình thời gian. */
export function VersionDatesModal({ open, version, saving, onClose, onSubmit }: Props) {
  const [start, setStart] = useState(version.effectiveDate.slice(0, 10))
  const [end, setEnd] = useState(versionEndDate(version).slice(0, 10))
  const [indefinite, setIndefinite] = useState(!!version.indefinite)
  const [error, setError] = useState('')

  const submit = () => {
    if (!start) { setError('Chọn ngày bắt đầu hiệu lực.'); return }
    if (!indefinite && !end) { setError('Chọn ngày kết thúc hiệu lực hoặc tích "Hiệu lực vô thời hạn".'); return }
    if (!indefinite && end < start) { setError('Ngày kết thúc hiệu lực phải sau hoặc bằng ngày bắt đầu.'); return }
    onSubmit({
      version: version.version,
      effectiveDate: start,
      endDate: end,
      indefinite,
      activeIngredients: version.activeIngredients,
      dosageFormId: version.dosageFormId,
      categoryId: version.categoryId,
      packaging: version.packaging,
      shelfLife: version.shelfLife,
      regulation: version.regulation,
      manufacturer: version.manufacturer,
      manufacturingMethod: version.manufacturingMethod,
      summary: version.summary,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cấu hình thời gian hiệu lực"
      widthClass="md:max-w-xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button icon={<Save className="size-4" />} loading={saving} onClick={submit}>Lưu cấu hình</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><CalendarClock className="size-4" /></span>
        <p className="text-xs leading-relaxed text-brand-800">
          Điều chỉnh thời gian có hiệu lực của phiên bản {version.version}. Khi hết hạn, người có quyền có thể cập nhật ngày kết thúc
          để phiên bản tiếp tục được sử dụng.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Ngày bắt đầu có hiệu lực *" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input
          label="Ngày kết thúc có hiệu lực"
          type="date"
          value={end}
          disabled={indefinite}
          onChange={(e) => setEnd(e.target.value)}
          className={indefinite ? 'cursor-not-allowed bg-slate-50 text-muted' : undefined}
        />
        <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-3">
          <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" checked={indefinite} onChange={(e) => setIndefinite(e.target.checked)} />
          <span>
            <span className="block text-sm font-bold text-brand-900">Hiệu lực vô thời hạn</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
              Phiên bản được dùng liên tục cho tới khi có bản cập nhật mới. Ngày kết thúc không giới hạn hiệu lực.
            </span>
          </span>
        </label>
        {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
        <p className="sm:col-span-2 text-[11px] leading-relaxed text-muted">
          Tổ ĐK Thuốc phụ trách cấu hình thời gian hiệu lực. Khi hết hạn, người có quyền có thể điều chỉnh ngày kết thúc
          để phiên bản tiếp tục được sử dụng.
        </p>
      </div>
    </Modal>
  )
}
