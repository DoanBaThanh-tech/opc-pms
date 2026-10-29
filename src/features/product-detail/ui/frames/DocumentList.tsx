import { FolderOpen } from 'lucide-react'
import type { VersionDocument } from '../../logic/types'
import { DocumentRow } from './DocumentRow'

interface Props {
  docs: VersionDocument[]
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
  emptyText?: string
}

export function DocumentList({ docs, onView, onDownload, emptyText = 'Chưa có tài liệu trong mục này.' }: Props) {
  if (!docs.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-6 text-sm text-muted">
        <FolderOpen className="size-4" /> {emptyText}
      </div>
    )
  }
  return (
    <div className="divide-y divide-line/60">
      {docs.map((doc, i) => <DocumentRow key={doc.id} doc={doc} index={i} onView={onView} onDownload={onDownload} />)}
    </div>
  )
}
