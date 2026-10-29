import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Sparkles } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import { Textarea } from '@/core/components/Textarea'
import { createVersionSchema, parseCustomChanges, type CreateVersionFormValues } from '../logic/createVersionSchema'
import type { CreateVersionInput, ProductVersion } from '../logic/types'

interface Props {
  open: boolean
  base: ProductVersion | null
  suggestedVersion: string
  loading: boolean
  onClose: () => void
  onSubmit: (input: CreateVersionInput) => void
}

function defaultEffectiveDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CreateVersionModal({ open, base, suggestedVersion, loading, onClose, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVersionFormValues>({
    resolver: zodResolver(createVersionSchema),
  })

  useEffect(() => {
    if (!open || !base) return
    reset({
      version: suggestedVersion,
      effectiveDate: defaultEffectiveDate(),
      activeIngredients: base.activeIngredients,
      packaging: base.packaging,
      shelfLife: base.shelfLife,
      summary: '',
      changesText: '',
    })
  }, [open, base, suggestedVersion, reset])

  const submit = (values: CreateVersionFormValues) => onSubmit({
    version: values.version,
    effectiveDate: values.effectiveDate,
    activeIngredients: values.activeIngredients,
    packaging: values.packaging,
    shelfLife: values.shelfLife,
    summary: values.summary,
    customChanges: parseCustomChanges(values.changesText),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo phiên bản mới"
      widthClass="md:max-w-2xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button type="submit" form="create-version-form" loading={loading} icon={<Sparkles className="size-4" />}>Tạo phiên bản</Button>
      </>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><Sparkles className="size-4" /></span>
        <p className="text-xs leading-relaxed text-brand-800">
          Phiên bản mới sẽ được tạo ở trạng thái <b>Coming soon</b> và chưa áp dụng. Khi bấm “Đưa vào sử dụng”, phiên bản hiện hành sẽ tự động chuyển sang <b>Lưu trữ</b>.
          {base && <> Dữ liệu được kế thừa từ <b>phiên bản {base.version}</b>.</>}
        </p>
      </div>

      <form id="create-version-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <Input label="Số phiên bản mới *" placeholder="VD: 2.2" error={errors.version?.message} {...register('version')} />
        <Input label="Ngày dự kiến áp dụng *" type="date" error={errors.effectiveDate?.message} {...register('effectiveDate')} />
        <div className="sm:col-span-2">
          <Textarea label="Hoạt chất & hàm lượng *" rows={2} error={errors.activeIngredients?.message} {...register('activeIngredients')} />
        </div>
        <Input label="Quy cách đóng gói" error={errors.packaging?.message} {...register('packaging')} />
        <Input label="Hạn dùng" placeholder="VD: 36 tháng" error={errors.shelfLife?.message} {...register('shelfLife')} />
        <div className="sm:col-span-2">
          <Textarea label="Tóm tắt thay đổi *" rows={2} placeholder="Mô tả ngắn nội dung chính của phiên bản mới..." error={errors.summary?.message} {...register('summary')} />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Thay đổi chính (mỗi dòng một nội dung)"
            rows={3}
            placeholder={'Ví dụ:\nQuy cách đóng gói | Chai 100ml\nTờ hướng dẫn | Bổ sung cảnh báo cho trẻ dưới 2 tuổi'}
            error={errors.changesText?.message}
            {...register('changesText')}
          />
          <p className="mt-1 text-[11px] text-muted">Cú pháp: <b>Tên trường | Giá trị mới</b> hoặc <b>Tên trường | Cũ | Mới</b>. Thay đổi hoạt chất, quy cách, hạn dùng được tự động ghi nhận.</p>
        </div>
      </form>
    </Modal>
  )
}
