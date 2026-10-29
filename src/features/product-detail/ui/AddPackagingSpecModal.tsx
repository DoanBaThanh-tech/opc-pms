import { useRef, useState } from 'react'
import { ImagePlus, Loader2, PackagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import { fileToCompressedDataUrl } from '@/core/utils/image'
import type { Product } from '@/features/products/logic/types'
import type { PackagingPhoto, PackagingSpec, ProductVersion } from '../logic/types'

interface Props {
  open: boolean
  product: Product
  version: ProductVersion
  specCount: number
  saving: boolean
  onClose: () => void
  onSubmit: (spec: PackagingSpec) => void
}

const compact = (v: string) => v.replace(/\./g, '')
const nowIso = () => new Date().toISOString()

export function AddPackagingSpecModal({ open, product, version, specCount, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [docName, setDocName] = useState('Hồ sơ kỹ thuật đóng gói')
  const [pages, setPages] = useState('8')
  const [photo, setPhoto] = useState<PackagingPhoto | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickPhoto = async (file?: File) => {
    if (!file) return
    setError('')
    setPhotoBusy(true)
    try {
      const url = await fileToCompressedDataUrl(file)
      setPhoto({ url, fileName: file.name, updatedAt: nowIso() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đọc được ảnh.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const submit = () => {
    if (!name.trim()) { setError('Nhập tên quy cách đóng gói.'); return }
    if (!docName.trim()) { setError('Nhập tên hồ sơ kỹ thuật.'); return }
    const pageCount = Number(pages)
    if (!Number.isFinite(pageCount) || pageCount < 1 || pageCount > 999) { setError('Số trang phải từ 1 đến 999.'); return }

    const seq = specCount + 1
    const v = compact(version.version)
    const now = nowIso()
    const specId = `spec-${product.id}-${v}-m${Date.now()}`
    const spec: PackagingSpec = {
      id: specId,
      name: name.trim(),
      note: note.trim() || undefined,
      technicalDoc: {
        id: `${specId}-doc`,
        group: 'packaging',
        name: docName.trim(),
        code: `HSKT-${product.code}-${v}-${String(seq).padStart(2, '0')}`,
        format: 'pdf',
        sizeKb: 420 + seq * 160,
        pages: Math.round(pageCount),
        updatedAt: now,
        status: version.stage === 'coming_soon' ? 'draft' : 'valid',
        note: 'Hồ sơ kỹ thuật đính kèm quy cách đóng gói.',
      },
      photo: photo ?? undefined,
    }
    onSubmit(spec)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm quy cách đóng gói"
      widthClass="md:max-w-2xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button icon={<PackagePlus className="size-4" />} loading={saving} onClick={submit}>Thêm quy cách</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><PackagePlus className="size-4" /></span>
        <p className="text-xs leading-relaxed text-brand-800">
          Quy cách mới được thêm vào <b>phiên bản {version.version}</b> và tự động có STT tiếp theo. Mỗi quy cách gồm một hồ sơ kỹ thuật và ảnh chụp thực tế.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Tên quy cách *" placeholder="VD: Hộp 10 chai x 90ml" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Ghi chú" placeholder="VD: Thùng carton 5 lớp, kèm nhãn phụ" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Hồ sơ kỹ thuật</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <Input label="Tên hồ sơ *" value={docName} onChange={(e) => setDocName(e.target.value)} />
            <Input label="Số trang" type="number" min={1} max={999} value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Ảnh chụp thực tế (tùy chọn)</p>
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border border-line">
              <img src={photo.url} alt={photo.fileName} className="h-40 w-full bg-brand-50 object-contain" />
              <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2">
                <span className="truncate text-[11px] text-muted">{photo.fileName}</span>
                <button type="button" onClick={() => setPhoto(null)} className="inline-flex items-center gap-1 text-[11px] font-bold text-opc-red hover:underline">
                  <Trash2 className="size-3.5" /> Xóa ảnh
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 text-xs font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
            >
              {photoBusy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-6" />}
              {photoBusy ? 'Đang xử lý ảnh...' : 'Chọn ảnh chụp thực tế'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2">{error}</p>}
      </div>
    </Modal>
  )
}
