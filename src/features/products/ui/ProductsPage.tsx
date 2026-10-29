import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { DataTable } from '@/core/components/DataTable'
import { PageHeader } from '@/core/components/PageHeader'
import { Pagination } from '@/core/components/Pagination'
import { useToast } from '@/core/components/Toast'
import type { ApiError } from '@/core/types/common'
import { exportProducts } from '../logic/exportProducts'
import type { Product } from '../logic/types'
import { useProductFilters } from '../logic/useProductFilters'
import { useLookups } from '../logic/useLookups'
import { useChangeStatus, useProducts } from '../logic/useProducts'
import { ProductFilters } from './ProductFilters'
import { ProductFormModal } from './ProductFormModal'
import { ProductSearchBar } from './ProductSearchBar'
import { ProductStats } from './ProductStats'
import { buildProductColumns } from './productColumns'

export default function ProductsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { data: products = [], isLoading } = useProducts()
  const lookups = useLookups()
  const f = useProductFilters(products, lookups)
  const changeStatus = useChangeStatus()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [exporting, setExporting] = useState(false)

  const openForm = (p: Product | null) => { setEditing(p); setFormOpen(true) }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportProducts(f.filtered, lookups)
      toast.success(`Đã xuất ${f.filtered.length} sản phẩm ra Excel`)
    } catch {
      toast.error('Xuất Excel thất bại, vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const handleSubmitForApproval = (p: Product) =>
    changeStatus.mutate({ id: p.id, status: 'pending' }, {
      onSuccess: () => toast.success(`Đã gửi duyệt "${p.name}"`),
      onError: (e) => toast.error((e as unknown as ApiError).message),
    })

  const columns = useMemo(
    () => buildProductColumns({ offset: (f.page - 1) * f.pageSize, lookups, onEdit: openForm, onSubmit: handleSubmitForApproval }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.page, f.pageSize, lookups],
  )

  return (
    <>
      <PageHeader
        title="Danh mục sản phẩm" description="Quản lý toàn bộ sản phẩm dược liệu, thuốc của OPC"
        actions={<>
          <Button variant="secondary" icon={<Download className="size-4" />} loading={exporting} disabled={f.filtered.length === 0} onClick={handleExport}>Xuất Excel</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => openForm(null)}>Thêm sản phẩm</Button>
        </>}
      />
      <ProductSearchBar
        value={f.filters.keyword}
        onChange={(value) => f.setFilter('keyword', value)}
        onSelect={(p) => navigate(`/products/${p.id}`)}
        className="mb-4"
      />
      <ProductStats products={products} />
      <ProductFilters filters={f.filters} onChange={f.setFilter} onReset={f.reset} hasFilter={f.hasFilter} dosageForms={lookups.dosageForms} categories={lookups.categories} />
      <DataTable data={f.pageItems} columns={columns} rowKey={(p) => p.id} loading={isLoading} emptyText="Không có sản phẩm nào khớp bộ lọc" onRowClick={(p) => navigate(`/products/${p.id}`)} />
      <Pagination page={f.page} totalPages={f.totalPages} total={f.filtered.length} pageSize={f.pageSize} onChange={f.setPage} />
      <ProductFormModal open={formOpen} product={editing} dosageForms={lookups.dosageForms} categories={lookups.categories} onClose={() => setFormOpen(false)} />
    </>
  )
}
