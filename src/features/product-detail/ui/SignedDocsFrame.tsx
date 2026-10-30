import { Boxes, BookOpenCheck, Download, Eye, FileCheck2, FileText, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { formatDate } from '@/core/utils/format'
import { formatSize } from '../logic/documents'
import { DOC_GROUP_META, DOC_STATUS_META, type ProductVersion, type VersionDocument } from '../logic/types'
import { Frame } from './frames/Frame'

interface Props {
  version: ProductVersion
  docs: VersionDocument[]
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
}

const GROUPS: { key: VersionDocument['group']; icon: LucideIcon }[] = [
  { key: 'legal', icon: ShieldCheck },
  { key: 'usage', icon: BookOpenCheck },
  { key: 'packaging', icon: Boxes },
  { key: 'professional', icon: FileText },
]

/** Tệp tài liệu hồ sơ và trạng thái ký xác thực sau khi phê duyệt hoàn tất. */
export function SignedDocsFrame({ version, docs, onView, onDownload }: Props) {
  const verified = docs.filter((d) => d.verified).length
  const signedAt = version.signedAt || (version.stage !== 'coming_soon' ? version.updatedAt : undefined)

  return (
    <Frame
      icon={FileCheck2}
      title="Tệp tài liệu đã ký xác thực"
      subtitle="Hồ sơ pháp lý, hướng dẫn sử dụng, quy cách kỹ thuật và hồ sơ chuyên môn của phiên bản."
      count={docs.length}
      actions={(
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={verified > 0 ? 'green' : 'amber'}>
            {verified}/{docs.length} đã ký
          </Badge>
          {!signedAt && <span className="text-[10px] font-semibold text-amber-700">Ký sau phê duyệt cuối</span>}
        </div>
      )}
    >
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-xs text-muted">
          Chưa có tệp tài liệu nào cho phiên bản này.
        </p>
      ) : (
        <div className="space-y-4">
          {GROUPS.map(({ key, icon: GroupIcon }) => {
            const groupDocs = docs.filter((d) => d.group === key)
            if (!groupDocs.length) return null
            return (
              <section key={key}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 px-1">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                    <GroupIcon className="size-3.5 text-brand-500" /> {DOC_GROUP_META[key].title}
                  </h3>
                  <span className="text-[10px] text-muted">{groupDocs.length} tệp</span>
                </div>
                <div className="divide-y divide-line/70 rounded-2xl border border-line bg-white">
                  {groupDocs.map((doc) => <SignedDocRow key={doc.id} doc={doc} onView={onView} onDownload={onDownload} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {signedAt && (
        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100">
          <ShieldCheck className="size-3.5" /> Hồ sơ đã được ký xác thực ngày {formatDate(signedAt)}.
        </p>
      )}
    </Frame>
  )
}

function SignedDocRow({ doc, onView, onDownload }: {
  doc: VersionDocument
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
}) {
  const status = DOC_STATUS_META[doc.status]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 transition hover:bg-brand-50/40">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-[9px] font-extrabold uppercase text-brand-700 ring-1 ring-brand-100">
        {doc.format}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-xs font-bold text-brand-900">{doc.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted">
          <span className="font-mono">{doc.code}</span>
          <span aria-hidden>·</span>
          <span>{doc.pages} trang</span>
          <span aria-hidden>·</span>
          <span>{formatSize(doc.sizeKb)}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(doc.updatedAt)}</span>
          {doc.shared && <Badge tone="gray">Dùng chung</Badge>}
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={doc.verified ? 'green' : 'amber'}>{doc.verified ? 'Đã ký' : 'Chờ ký'}</Badge>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onView(doc)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 text-[11px] font-bold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <Eye className="size-3.5" /> Xem file
        </button>
        <button
          onClick={() => onDownload(doc)}
          aria-label={`Tải ${doc.name}`}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-brand-600 hover:text-white"
        >
          <Download className="size-4" />
        </button>
      </div>
    </div>
  )
}
