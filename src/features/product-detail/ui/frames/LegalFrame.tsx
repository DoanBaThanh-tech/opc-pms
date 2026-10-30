import { CalendarCheck2, Plus, Stamp } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { formatDate } from '@/core/utils/format'
import { lifecycleLabelOf } from '../../logic/approvalUtils'
import { STAGE_META, type ProductVersion, type VersionDocument } from '../../logic/types'
import { Frame } from './Frame'
import { DocumentList } from './DocumentList'

interface Props {
  version: ProductVersion
  docs: VersionDocument[]
  stageLabel?: string
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
  onAdd?: () => void
}

export function LegalFrame({ version, docs, stageLabel, onView, onDownload, onAdd }: Props) {
  const stage = STAGE_META[version.stage]
  const draft = version.stage === 'coming_soon'
  return (
    <Frame
      icon={Stamp}
      title="Hồ sơ pháp lý & quyết định phê duyệt"
      subtitle="Quyết định thay đổi phiên bản, giấy đăng ký và biên bản thẩm định."
      count={docs.length}
      actions={onAdd ? (
        <Button size="sm" icon={<Plus className="size-4" />} onClick={onAdd}>
          Thêm hồ sơ pháp lý/quyết định phê duyệt
        </Button>
      ) : undefined}
    >
      <div className="relative mb-3 overflow-hidden rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50 via-white to-brand-50/30 p-4">
        <Stamp className="pointer-events-none absolute -bottom-7 -right-4 size-32 rotate-12 text-brand-100/80" strokeWidth={1} aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
              <CalendarCheck2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
                {draft ? 'Dự thảo quyết định phê duyệt' : 'Quyết định phê duyệt hiện hành'}
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-brand-900">{version.approvalNo}</p>
              <p className="mt-1 text-xs text-muted">{version.approvedBy}</p>
              <p className="mt-1 text-[11px] text-muted">Hiệu lực từ {formatDate(version.effectiveDate)}</p>
            </div>
          </div>
          <Badge tone={stage.tone}>{stageLabel ?? lifecycleLabelOf(version)}</Badge>
        </div>
      </div>
      <DocumentList docs={docs} onView={onView} onDownload={onDownload} />
    </Frame>
  )
}
