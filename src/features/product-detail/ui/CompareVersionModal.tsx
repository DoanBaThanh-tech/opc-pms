import { useMemo, useState } from 'react'
import { ArrowRight, Check, GitCompare } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import { cn, formatDate } from '@/core/utils/format'
import { lifecycleLabelOf, lifecycleToneOf } from '../logic/approvalUtils'
import type { ProductVersion } from '../logic/types'
import { compareVersion, versionEndDate } from '../logic/versionUtils'

interface Props {
  open: boolean
  target: ProductVersion
  versions: ProductVersion[]
  onClose: () => void
  onSelect: (older: ProductVersion) => void
}

/** Chọn một phiên bản cũ để đối chiếu với phiên bản đang xem. */
export function CompareVersionModal({ open, target, versions, onClose, onSelect }: Props) {
  const older = useMemo(
    () => versions
      .filter((v) => v.id !== target.id && compareVersion(v.version, target.version) < 0)
      .sort((a, b) => compareVersion(b.version, a.version)),
    [versions, target],
  )
  const [selectedId, setSelectedId] = useState<number | null>(older[0]?.id ?? null)
  const selected = older.find((v) => v.id === selectedId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chọn phiên bản để đối chiếu"
      widthClass="md:max-w-3xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button icon={<GitCompare className="size-4" />} disabled={!selected} onClick={() => selected && onSelect(selected)}>
          Đối chiếu chi tiết
        </Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-linear-to-r from-brand-50 to-white p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><GitCompare className="size-4" /></span>
        <div>
          <p className="text-sm font-bold text-brand-900">So sánh phiên bản {target.version} với một phiên bản trước</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Hệ thống sẽ mở hai hồ sơ cạnh nhau: phiên bản cũ bên trái và phiên bản mới bên phải, đồng thời làm nổi bật các nội dung đã thay đổi.
          </p>
        </div>
      </div>

      {older.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          Chưa có phiên bản cũ hơn để đối chiếu.
        </p>
      ) : (
        <div className="space-y-2">
          {older.map((v) => {
            const active = v.id === selectedId
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition',
                  active ? 'border-brand-300 bg-brand-50/70 ring-2 ring-brand-100' : 'border-line bg-white hover:border-brand-200 hover:bg-brand-50/40',
                )}
              >
                <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl', active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}>
                  {active ? <Check className="size-4" /> : <span className="text-[10px] font-extrabold">{v.version}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-brand-900">Phiên bản {v.version}</span>
                    <Badge tone={lifecycleToneOf(v)}>{lifecycleLabelOf(v)}</Badge>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Hiệu lực {formatDate(v.effectiveDate)} – {v.indefinite ? 'Vô thời hạn' : formatDate(versionEndDate(v)) || '—'}
                    {' · '}Cập nhật {formatDate(v.updatedAt)}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs text-muted">{v.changeNote || v.summary}</span>
                </span>
                <ArrowRight className={cn('mt-2 size-4 shrink-0', active ? 'text-brand-600' : 'text-muted')} />
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
