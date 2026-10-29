import { useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import { Select } from '@/core/components/Select'
import { Textarea } from '@/core/components/Textarea'
import type { CatalogItem } from '@/core/types/catalog'
import type { ProductVersion, UpdateVersionInfoInput } from '../logic/types'

interface Props {
  open: boolean
  version: ProductVersion
  dosageForms: CatalogItem[]
  categories: CatalogItem[]
  saving: boolean
  onClose: () => void
  onSubmit: (input: UpdateVersionInfoInput) => void
}

export function EditVersionInfoModal({ open, version, dosageForms, categories, saving, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<UpdateVersionInfoInput>({
    version: version.version,
    effectiveDate: version.effectiveDate.slice(0, 10),
    activeIngredients: version.activeIngredients,
    dosageFormId: version.dosageFormId,
    categoryId: version.categoryId,
    packaging: version.packaging,
    shelfLife: version.shelfLife,
    regulation: version.regulation,
    manufacturer: version.manufacturer,
    manufacturingMethod: version.manufacturingMethod,
    summary: version.summary,
  })
  const [error, setError] = useState('')

  const set = <K extends keyof UpdateVersionInfoInput>(key: K, value: UpdateVersionInfoInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = () => {
    if (!/^\d+(\.\d+){0,3}$/.test(form.version.trim())) { setError('Số phiên bản hợp lệ: 2.2 hoặc 2.2.1'); return }
    if (!form.effectiveDate) { setError('Chọn ngày hiệu lực.'); return }
    if (!form.activeIngredients.trim()) { setError('Nhập hoạt chất & hàm lượng.'); return }
    if (!form.summary.trim()) { setError('Nhập tóm tắt nội dung phiên bản.'); return }
    onSubmit({
      ...form,
      version: form.version.trim(),
      activeIngredients: form.activeIngredients.trim(),
      packaging: form.packaging.trim(),
      shelfLife: form.shelfLife.trim(),
      regulation: form.regulation.trim(),
      manufacturer: form.manufacturer.trim(),
      manufacturingMethod: form.manufacturingMethod.trim(),
      summary: form.summary.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cập nhật thông tin chung"
      widthClass="md:max-w-3xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button icon={<Save className="size-4" />} loading={saving} onClick={submit}>Lưu thay đổi</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-xs leading-relaxed text-brand-800">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <p>Mọi thuộc tính đều có thể chỉnh sửa, riêng <b>Số đăng ký</b> được khóa theo hồ sơ đã phê duyệt.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Số phiên bản *" value={form.version} onChange={(e) => set('version', e.target.value)} placeholder="VD: 2.2" />
        <Input label="Ngày hiệu lực *" type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        <Input label="Số đăng ký" value={version.registrationNo || '—'} disabled icon={<Lock className="size-4" />} className="cursor-not-allowed bg-slate-50 text-muted" />
        <Input label="Hạn dùng" value={form.shelfLife} onChange={(e) => set('shelfLife', e.target.value)} placeholder="VD: 36 tháng" />
        <Select
          label="Dạng bào chế"
          options={dosageForms.map((d) => ({ value: d.id, label: d.name }))}
          value={form.dosageFormId}
          onChange={(e) => set('dosageFormId', Number(e.target.value))}
        />
        <Select
          label="Phân loại"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={form.categoryId}
          onChange={(e) => set('categoryId', Number(e.target.value))}
        />
        <Input label="Quy cách đóng gói" value={form.packaging} onChange={(e) => set('packaging', e.target.value)} />
        <Input label="Quy định" value={form.regulation} onChange={(e) => set('regulation', e.target.value)} />
        <div className="sm:col-span-2">
          <Textarea label="Hoạt chất & hàm lượng *" rows={2} value={form.activeIngredients} onChange={(e) => set('activeIngredients', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Nơi sản xuất" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Cách thức sản xuất" rows={2} value={form.manufacturingMethod} onChange={(e) => set('manufacturingMethod', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Tóm tắt nội dung phiên bản *" rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2">{error}</p>}
      </div>
    </Modal>
  )
}
