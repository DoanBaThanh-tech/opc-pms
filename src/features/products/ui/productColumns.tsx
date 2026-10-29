import { Eye, Pencil, SendHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/core/components/Badge'
import type { Column } from '@/core/components/DataTable'
import { formatDate } from '@/core/utils/format'
import type { Lookups } from '../logic/useLookups'
import type { Product } from '../logic/types'
import { StatusBadge } from './StatusBadge'

interface Args {
  offset: number
  lookups: Lookups
  onEdit: (p: Product) => void
  onSubmit: (p: Product) => void
}

export function buildProductColumns({ offset, lookups, onEdit, onSubmit }: Args): Column<Product>[] {
  const iconBtn = 'rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700'
  return [
    { key: 'stt', header: 'STT', hideOnCard: true, className: 'w-14 text-muted', render: (_, i) => offset + i + 1 },
    { key: 'code', header: 'Mã SP', className: 'font-mono text-xs', render: (p) => p.code },
    {
      key: 'name', header: 'Tên sản phẩm', className: 'min-w-56',
      render: (p) => (
        <div className="text-left">
          <Link to={`/products/${p.id}`} className="font-semibold text-brand-900 transition hover:text-brand-600 hover:underline hover:underline-offset-2">{p.name}</Link>
          <span className="mt-0.5 inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">Phiên bản {p.version}</span>
        </div>
      ),
    },
    { key: 'dosage', header: 'Dạng bào chế', render: (p) => lookups.dosageName(p.dosageFormId) },
    { key: 'active', header: 'Hoạt chất & Hàm lượng', className: 'min-w-72 max-w-sm whitespace-normal', render: (p) => <span className="text-sm">{p.activeIngredients}</span> },
    { key: 'category', header: 'Phân loại', render: (p) => <Badge>{lookups.categoryName(p.categoryId)}</Badge> },
    { key: 'regulation', header: 'Quy định', render: (p) => p.regulation },
    { key: 'packaging', header: 'Quy cách', render: (p) => p.packaging || '—' },
    { key: 'sdk', header: 'Số đăng ký', className: 'font-mono text-xs', render: (p) => p.registrationNo || '—' },
    { key: 'shelf', header: 'Hạn dùng', render: (p) => p.shelfLife || '—' },
    { key: 'status', header: 'Trạng thái', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'updated', header: 'Cập nhật', render: (p) => formatDate(p.updatedAt) },
    {
      key: 'actions', header: 'Thao tác', className: 'sticky right-0 bg-white/95',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Link to={`/products/${p.id}`} className={iconBtn} aria-label="Xem chi tiết" title="Xem chi tiết" onClick={(e) => e.stopPropagation()}>
            <Eye className="size-4" />
          </Link>
          {(p.status === 'draft' || p.status === 'rejected') && (
            <button className={iconBtn} aria-label="Gửi duyệt" title="Gửi duyệt" onClick={(e) => { e.stopPropagation(); onSubmit(p) }}><SendHorizontal className="size-4" /></button>
          )}
          <button className={iconBtn} aria-label="Sửa" title="Sửa" onClick={(e) => { e.stopPropagation(); onEdit(p) }}><Pencil className="size-4" /></button>
        </div>
      ),
    },
  ]
}
