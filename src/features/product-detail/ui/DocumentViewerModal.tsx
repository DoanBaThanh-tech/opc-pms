import { useEffect, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/core/components/Badge'
import { Button } from '@/core/components/Button'
import { Modal } from '@/core/components/Modal'
import type { Product } from '@/features/products/logic/types'
import { buildDocumentHtml } from '../logic/documentHtml'
import { formatSize } from '../logic/documents'
import { getLogoDataUrl } from '../logic/logo'
import type { ProductVersion, VersionDocument } from '../logic/types'

interface Props {
  open: boolean
  doc: VersionDocument | null
  product: Product
  version: ProductVersion
  names: { dosage: string; category: string }
  onClose: () => void
  onDownload: (doc: VersionDocument) => void
}

/** Xem trước nội dung file hồ sơ ngay trong app. */
export function DocumentViewerModal({ open, doc, product, version, names, onClose, onDownload }: Props) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !doc) return
    let active = true
    setLoading(true)
    setHtml('')
    getLogoDataUrl()
      .then((logoSrc) => {
        if (!active) return
        setHtml(buildDocumentHtml({ product, version, docs: [], versions: [], names, logoSrc }, doc))
        setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc, product, version, names.dosage, names.category])

  return (
    <Modal
      open={open && !!doc}
      title={doc?.name ?? 'Xem tài liệu'}
      widthClass="md:max-w-6xl"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
        {doc && <Button icon={<Download className="size-4" />} onClick={() => onDownload(doc)}>Tải file</Button>}
      </>}
    >
      {doc && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700">
            <FileText className="size-3.5" /> {doc.format.toUpperCase()}
          </span>
          <span className="font-mono">{doc.code}</span>
          <span aria-hidden>·</span>
          <span>{doc.pages} trang</span>
          <span aria-hidden>·</span>
          <span>{formatSize(doc.sizeKb)}</span>
          <Badge tone="blue">Phiên bản {version.version}</Badge>
        </div>
      )}

      {loading ? (
        <div className="flex h-[68dvh] flex-col items-center justify-center gap-3 rounded-xl border border-line bg-brand-50/40 text-sm text-muted">
          <Loader2 className="size-6 animate-spin text-brand-500" />
          Đang chuẩn bị bản xem trước...
        </div>
      ) : (
        <iframe
          title={doc?.name ?? 'Tài liệu'}
          srcDoc={html}
          className="h-[68dvh] w-full rounded-xl border border-line bg-white"
          sandbox="allow-same-origin allow-scripts allow-modals"
        />
      )}
    </Modal>
  )
}
