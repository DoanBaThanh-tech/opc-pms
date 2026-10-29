import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2, type LucideIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CatalogHooks } from '@/core/hooks/createCatalogHooks'
import type { ApiError } from '@/core/types/common'
import type { CatalogInput, CatalogItem } from '@/core/types/catalog'
import { formatDate, norm } from '@/core/utils/format'
import { Badge } from './Badge'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { Input } from './Input'
import { Modal } from './Modal'
import { PageHeader } from './PageHeader'
import { Textarea } from './Textarea'
import { useToast } from './Toast'

const schema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100, 'Tối đa 100 ký tự'),
  description: z.string().trim().max(300, 'Tối đa 300 ký tự'),
})
type Values = z.infer<typeof schema>

interface Props {
  title: string
  description: string
  noun: string
  icon: LucideIcon
  hooks: CatalogHooks
  /** id → số sản phẩm đang dùng */
  usage: Record<number, number>
}

function FormModal({ open, item, noun, saving, onClose, onSubmit }: {
  open: boolean; item: CatalogItem | null; noun: string; saving: boolean
  onClose: () => void; onSubmit: (v: CatalogInput) => void
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { name: '', description: '' },
  })
  useEffect(() => { if (open) reset({ name: item?.name ?? '', description: item?.description ?? '' }) }, [open, item, reset])

  return (
    <Modal
      open={open} onClose={onClose} title={item ? `Sửa ${noun}` : `Thêm ${noun} mới`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button type="submit" form="catalog-form" loading={saving}>Lưu</Button>
      </>}
    >
      <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Tên *" autoFocus placeholder={`Nhập tên ${noun}`} error={errors.name?.message} {...register('name')} />
        <Textarea label="Mô tả" placeholder="Ghi chú thêm (không bắt buộc)" error={errors.description?.message} {...register('description')} />
      </form>
    </Modal>
  )
}

export function CatalogCrud({ title, description, noun, icon: Icon, hooks, usage }: Props) {
  const toast = useToast()
  const { data = [], isLoading } = hooks.useList()
  const save = hooks.useSave()
  const remove = hooks.useRemove()
  const [keyword, setKeyword] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)

  const shown = useMemo(() => data.filter((i) => norm(`${i.name} ${i.description}`).includes(norm(keyword))), [data, keyword])

  const openForm = (item: CatalogItem | null) => { setEditing(item); setFormOpen(true) }
  const onSubmit = (input: CatalogInput) =>
    save.mutate({ id: editing?.id, input }, {
      onSuccess: () => { toast.success(editing ? 'Đã cập nhật' : `Đã thêm ${noun} mới`); setFormOpen(false) },
      onError: (e) => toast.error((e as unknown as ApiError).message),
    })
  const onDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => { toast.success('Đã xóa'); setDeleting(null) },
      onError: (e) => { toast.error((e as unknown as ApiError).message); setDeleting(null) },
    })
  }

  return (
    <>
      <PageHeader
        title={title} description={description}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => openForm(null)}>Thêm {noun}</Button>}
      />
      <div className="mb-5 max-w-md">
        <Input icon={<Search className="size-4" />} placeholder={`Tìm ${noun}...`} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white/70 py-14 text-center text-sm text-muted">Không có {noun} nào.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((item) => (
              <motion.article
                key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex flex-col rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-brand-900">{item.name}</h3>
                    <p className="mt-0.5 line-clamp-2 min-h-10 text-sm text-muted">{item.description || 'Chưa có mô tả'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Badge tone={usage[item.id] ? 'blue' : 'gray'}>{usage[item.id] ?? 0} sản phẩm</Badge>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openForm(item)} aria-label="Sửa" className="rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"><Pencil className="size-4" /></button>
                    <button onClick={() => setDeleting(item)} aria-label="Xóa" className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-opc-red"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FormModal open={formOpen} item={editing} noun={noun} saving={save.isPending} onClose={() => setFormOpen(false)} onSubmit={onSubmit} />
      <ConfirmDialog
        open={!!deleting} title={`Xóa ${noun}`} message={`Bạn chắc chắn muốn xóa "${deleting?.name}"?`}
        confirmText="Xóa" loading={remove.isPending} onConfirm={onDelete} onClose={() => setDeleting(null)}
      />
    </>
  )
}
