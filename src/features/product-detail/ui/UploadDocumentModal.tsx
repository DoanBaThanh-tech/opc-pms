import { useRef, useState } from 'react'
import { FileUp, Upload, X } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import { Textarea } from '@/core/components/Textarea'
import type { Product } from '@/features/products/logic/types'
import { formatSize } from '../logic/documents'
import type { DocFormat, DocGroup, ProductVersion, VersionDocument } from '../logic/types'

export interface UploadTarget {
  group: DocGroup
  shared?: boolean
  title: string
  description: string
}

interface Props {
  open: boolean
  target: UploadTarget
  product: Product
  version: ProductVersion
  docCount: number
  saving: boolean
  onClose: () => void
  onSubmit: (doc: VersionDocument) => void
}

const nowIso = () => new Date().toISOString()
const stamp = () => Date.now()
const compact = (v: string) => v.replace(/\./g, '')

const FORMAT_BY_EXT: Record<string, DocFormat> = {
  pdf: 'pdf',
  doc: 'docx',
  docx: 'docx',
  xls: 'xlsx',
  xlsx: 'xlsx',
}

export function UploadDocumentModal({ open, target, product, version, docCount, saving, onClose, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pages, setPages] = useState('1')
  const [note, setNote] = useState('')
  const [format, setFormat] = useState<DocFormat>('pdf')
  const [sizeKb, setSizeKb] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (picked?: File) => {
    if (!picked) return
    setError('')
    const ext = picked.name.split('.').pop()?.toLowerCase() ?? ''
    const nextFormat = FORMAT_BY_EXT[ext]
    if (!nextFormat) { setError('Chỉ hỗ trợ tệp PDF, DOCX hoặc XLSX.'); return }
    if (picked.size > 10 * 1024 * 1024) { setError('Tệp tối đa 10 MB.'); return }
    setFile(picked)
    setFormat(nextFormat)
    setSizeKb(Math.max(1, Math.round(picked.size / 1024)))
    if (!name.trim()) setName(picked.name.replace(/\.[^.]+$/, ''))
  }

  const clearFile = () => { setFile(null); setSizeKb(0) }

  const submit = () => {
    if (!file) { setError('Chọn tệp cần tải lên.'); return }
    if (!name.trim()) { setError('Nhập tên tài liệu.'); return }
    const pageCount = Number(pages)
    if (!Number.isFinite(pageCount) || pageCount < 1 || pageCount > 999) { setError('Số trang phải từ 1 đến 999.'); return }
    const now = nowIso()
    onSubmit({
      id: `upload-${version.id}-${stamp()}`,
      group: target.group,
      name: name.trim(),
      code: code.trim() || `TL-${product.code}-${compact(version.version)}-${String(docCount + 1).padStart(2, '0')}`,
      format,
      sizeKb,
      pages: Math.round(pageCount),
      updatedAt: now,
      status: version.stage === 'coming_soon' ? 'draft' : version.stage === 'current' ? 'valid' : 'superseded',
      note: note.trim() || undefined,
      shared: target.shared,
      uploaded: true,
      fileName: file.name,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target.title}
      widthClass="md:max-w-2xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button icon={<Upload className="size-4" />} loading={saving} onClick={submit}>Tải lên</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><FileUp className="size-4" /></span>
        <p className="text-xs leading-relaxed text-brand-800">{target.description}</p>
      </div>

      <div className="grid gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Tệp tài liệu *</p>
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><FileUp className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-900">{file.name}</p>
                <p className="text-[11px] text-muted">{format.toUpperCase()} · {formatSize(sizeKb)}</p>
              </div>
              <button type="button" onClick={clearFile} aria-label="Bỏ tệp" className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-opc-red">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 text-xs font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <FileUp className="size-6" />
              Chọn tệp PDF, DOCX hoặc XLSX
              <span className="text-[11px] font-normal text-muted">Tối đa 10 MB</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="sr-only"
            onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <Input label="Tên tài liệu *" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Quyết định phê duyệt phiên bản 2.2" />
          <Input label="Số trang" type="number" min={1} max={999} value={pages} onChange={(e) => setPages(e.target.value)} />
        </div>
        <Input label="Số hiệu / mã tài liệu" value={code} onChange={(e) => setCode(e.target.value)} placeholder={`Để trống để tự sinh TL-${product.code}-…`} />
        <Textarea label="Ghi chú" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thông tin bổ sung (không bắt buộc)" />

        <p className="text-[11px] leading-relaxed text-muted">
          Tài liệu được gắn với phiên bản {version.version}. Ở chế độ mô phỏng, nội dung xem trước được sinh tự động từ thông tin tệp
          {file ? ` ${file.name}` : ''}.
        </p>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}
