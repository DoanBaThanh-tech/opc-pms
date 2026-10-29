import { ArrowRight, BookOpenCheck, GitCompare, Sparkles } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { cn } from '@/core/utils/format'
import type { ProductVersion, VersionDocument } from '../../logic/types'
import { Frame } from './Frame'
import { DocumentList } from './DocumentList'

interface Props {
  version: ProductVersion
  previous?: ProductVersion
  docs: VersionDocument[]
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
}

const KIND_META = {
  added: { label: 'Bổ sung', cls: 'bg-emerald-100 text-emerald-800' },
  updated: { label: 'Thay đổi', cls: 'bg-brand-100 text-brand-800' },
  removed: { label: 'Loại bỏ', cls: 'bg-red-100 text-red-700' },
}

export function UsageFrame({ version, previous, docs, onView, onDownload }: Props) {
  const compareDocs = docs.filter((d) => d.name.startsWith('Báo cáo so sánh'))
  const usageDocs = docs.filter((d) => !d.name.startsWith('Báo cáo so sánh'))

  return (
    <Frame
      icon={BookOpenCheck}
      title="Hồ sơ hướng dẫn sử dụng & hồ sơ so sánh phiên bản"
      subtitle="Tờ hướng dẫn, biên bản xác nhận và báo cáo đối chiếu thay đổi."
      count={docs.length}
    >
      <div className="space-y-4">
        <section>
          <h3 className="mb-1 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-muted">
            <BookOpenCheck className="size-3.5 text-brand-500" /> Hướng dẫn sử dụng
          </h3>
          <DocumentList docs={usageDocs} onView={onView} onDownload={onDownload} />
        </section>
        <section>
          <h3 className="mb-1 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-muted">
            <GitCompare className="size-3.5 text-brand-500" /> So sánh phiên bản
          </h3>
          <DocumentList docs={compareDocs} onView={onView} onDownload={onDownload} emptyText="Chưa có báo cáo so sánh cho phiên bản này." />
        </section>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-100 bg-linear-to-br from-brand-50/80 to-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-900">
            <Sparkles className="size-4 text-brand-500" />
            Tóm tắt thay đổi {previous ? `so với v${previous.version}` : 'của phiên bản'}
          </p>
          <Badge tone="blue">{version.changes.length} nội dung</Badge>
        </div>
        {version.changes.length === 0 ? (
          <p className="mt-2 text-xs text-muted">Chưa ghi nhận thay đổi. Phiên bản được giữ nguyên so với hồ sơ trước.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {version.changes.slice(0, 4).map((c, i) => (
              <li key={`${c.field}-${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', KIND_META[c.kind].cls)}>
                  {KIND_META[c.kind].label}
                </span>
                <span className="font-semibold text-brand-900">{c.field}</span>
                {c.before && <span className="text-muted line-through">{c.before}</span>}
                {c.before && c.after && <ArrowRight className="size-3 text-brand-400" />}
                {c.after && <span className="font-medium text-brand-700">{c.after}</span>}
              </li>
            ))}
            {version.changes.length > 4 && <li className="text-[11px] italic text-muted">+{version.changes.length - 4} thay đổi khác trong báo cáo so sánh.</li>}
          </ul>
        )}
      </div>
    </Frame>
  )
}
