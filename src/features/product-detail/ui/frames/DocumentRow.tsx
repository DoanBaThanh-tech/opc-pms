import { motion } from 'framer-motion'
import { Download, Eye, FileSpreadsheet, FileText } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { formatDate } from '@/core/utils/format'
import { formatSize } from '../../logic/documents'
import { DOC_STATUS_META, type DocFormat, type VersionDocument } from '../../logic/types'

const FORMAT_META: Record<DocFormat, { icon: typeof FileText; label: string; tone: string }> = {
  pdf: { icon: FileText, label: 'PDF', tone: 'bg-rose-50 text-rose-600 ring-rose-100' },
  docx: { icon: FileText, label: 'DOCX', tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  xlsx: { icon: FileSpreadsheet, label: 'XLSX', tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
}

interface Props {
  doc: VersionDocument
  index: number
  onView: (doc: VersionDocument) => void
  onDownload: (doc: VersionDocument) => void
}

export function DocumentRow({ doc, index, onView, onDownload }: Props) {
  const f = FORMAT_META[doc.format]
  const status = DOC_STATUS_META[doc.status]
  const Icon = f.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.035 }}
      className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-transparent px-2 py-2.5 transition hover:border-brand-100 hover:bg-brand-50/50 sm:flex-nowrap sm:px-3"
    >
      <span className={`relative grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${f.tone}`}>
        <Icon className="size-5" />
        <span className="absolute -bottom-1 rounded bg-white px-1 text-[8px] font-extrabold tracking-wide shadow-sm">{f.label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-brand-900">{doc.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted">
          <span className="font-mono">{doc.code}</span>
          <span aria-hidden>·</span>
          <span>{doc.pages} trang</span>
          <span aria-hidden>·</span>
          <span>{formatSize(doc.sizeKb)}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(doc.updatedAt)}</span>
          <span className="ml-0.5"><Badge tone={status.tone}>{status.label}</Badge></span>
        </p>
        {doc.note && <p className="mt-1 line-clamp-1 text-[11px] italic text-muted/80">{doc.note}</p>}
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
        <button
          onClick={() => onView(doc)}
          title={`Xem file ${doc.name}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 text-[11px] font-bold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <Eye className="size-3.5" /> Xem file
        </button>
        <button
          onClick={() => onDownload(doc)}
          title={`Tải ${doc.name}`}
          aria-label={`Tải ${doc.name}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-brand-600 hover:text-white focus-visible:bg-brand-600 focus-visible:text-white"
        >
          <Download className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}
