import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/core/components/Button'
import { Input } from '@/core/components/Input'
import { Modal } from '@/core/components/Modal'
import { Select } from '@/core/components/Select'
import { Textarea } from '@/core/components/Textarea'
import { useToast } from '@/core/components/Toast'
import type { CatalogItem } from '@/core/types/catalog'
import type { ApiError } from '@/core/types/common'
import { REGULATIONS } from '../logic/constants'
import { productSchema, type ProductFormValues } from '../logic/productSchema'
import type { Product } from '../logic/types'
import { useSaveProduct } from '../logic/useProducts'

interface Props {
  open: boolean
  product: Product | null
  dosageForms: CatalogItem[]
  categories: CatalogItem[]
  onClose: () => void
}

const empty: ProductFormValues = {
  code: '', version: '1.0', name: '', dosageFormId: '', categoryId: '', activeIngredients: '',
  regulation: '', shelfLife: '', packaging: '', registrationNo: '',
}

export function ProductFormModal({ open, product, dosageForms, categories, onClose }: Props) {
  const toast = useToast()
  const save = useSaveProduct()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema), defaultValues: empty,
  })

  useEffect(() => {
    if (!open) return
    reset(product ? {
      code: product.code, version: product.version, name: product.name,
      dosageFormId: String(product.dosageFormId), categoryId: String(product.categoryId),
      activeIngredients: product.activeIngredients, regulation: product.regulation,
      shelfLife: product.shelfLife, packaging: product.packaging, registrationNo: product.registrationNo,
    } : empty)
  }, [open, product, reset])

  const onSubmit = (v: ProductFormValues) =>
    save.mutate(
      { id: product?.id, input: { ...v, dosageFormId: Number(v.dosageFormId), categoryId: Number(v.categoryId) } },
      {
        onSuccess: () => { toast.success(product ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm mới'); onClose() },
        onError: (e) => toast.error((e as unknown as ApiError).message),
      },
    )

  const toOpts = (l: CatalogItem[]) => l.map((i) => ({ value: i.id, label: i.name }))
  const missing = dosageForms.length === 0 || categories.length === 0

  return (
    <Modal
      open={open} onClose={onClose} title={product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button type="submit" form="product-form" loading={save.isPending} disabled={missing}>Lưu sản phẩm</Button>
      </>}
    >
      {missing && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cần tạo trước ít nhất 1 <Link to="/dosage-forms" className="font-semibold underline">dạng bào chế</Link> và 1 <Link to="/categories" className="font-semibold underline">phân loại</Link>.
        </p>
      )}
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Input label="Mã sản phẩm *" placeholder="VD: SP012" error={errors.code?.message} {...register('code')} />
        <div>
          <Input
            label={product ? 'Phiên bản' : 'Phiên bản *'}
            placeholder="VD: 1.0"
            readOnly={!!product}
            aria-readonly={!!product}
            className={product ? 'cursor-not-allowed bg-brand-50/70 text-muted' : undefined}
            error={errors.version?.message}
            {...register('version')}
          />
          {product && <p className="mt-1 text-[11px] text-muted">Số phiên bản chỉ thay đổi khi tạo phiên bản mới tại trang chi tiết sản phẩm.</p>}
        </div>
        <div className="sm:col-span-2"><Input label="Tên sản phẩm *" error={errors.name?.message} {...register('name')} /></div>
        <Select label="Dạng bào chế *" placeholder="— Chọn dạng bào chế —" options={toOpts(dosageForms)} error={errors.dosageFormId?.message} {...register('dosageFormId')} />
        <Select label="Phân loại *" placeholder="— Chọn phân loại —" options={toOpts(categories)} error={errors.categoryId?.message} {...register('categoryId')} />
        <div className="sm:col-span-2"><Textarea label="Hoạt chất & Hàm lượng *" placeholder="VD: Paracetamol 500mg (mỗi viên)" error={errors.activeIngredients?.message} {...register('activeIngredients')} /></div>
        <Select label="Quy định *" placeholder="— Chọn quy định —" options={REGULATIONS} error={errors.regulation?.message} {...register('regulation')} />
        <Input label="Hạn dùng" placeholder="VD: 36 tháng" error={errors.shelfLife?.message} {...register('shelfLife')} />
        <Input label="Quy cách đóng gói" placeholder="VD: Hộp 10 vỉ x 10 viên" error={errors.packaging?.message} {...register('packaging')} />
        <Input label="Số đăng ký" placeholder="VD: VD-12345-24" error={errors.registrationNo?.message} {...register('registrationNo')} />
      </form>
    </Modal>
  )
}
