import { CalendarClock, MessageSquareText, Quote, UserRound } from 'lucide-react'
import { formatDate } from '@/core/utils/format'
import type { ProductVersion } from '../logic/types'
import { Frame } from './frames/Frame'

interface Props {
  version: ProductVersion
}

/** Ghi chú thay đổi của người tạo hồ sơ phiên bản. */
export function ChangeNoteFrame({ version }: Props) {
  const note = version.changeNote?.trim() || version.summary
  return (
    <Frame
      icon={MessageSquareText}
      title="Ghi chú thay đổi"
      subtitle={`Nội dung người tạo ghi lại cho phiên bản ${version.version}.`}
      count={version.changes.length}
      countLabel="hạng mục"
    >
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50/80 via-white to-white p-4">
        <Quote className="pointer-events-none absolute -right-3 -top-3 size-20 text-brand-100" strokeWidth={1.2} aria-hidden />
        <p className="relative text-sm leading-relaxed text-brand-900">{note}</p>
        <div className="relative mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-muted ring-1 ring-line">
            <CalendarClock className="size-3.5 text-brand-500" /> Cập nhật {formatDate(version.updatedAt)}
          </span>
          {version.basedOnVersion && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-muted ring-1 ring-line">
              <UserRound className="size-3.5 text-brand-500" /> Kế thừa từ phiên bản {version.basedOnVersion}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-muted ring-1 ring-line">
            {version.changes.length} thay đổi
          </span>
        </div>
      </div>

      {version.rejectedReason && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700">
          <b>Lý do từ chối:</b> {version.rejectedReason}
        </p>
      )}
    </Frame>
  )
}
