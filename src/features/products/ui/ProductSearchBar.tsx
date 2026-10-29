import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageSearch, Search, X } from 'lucide-react'
import { Input } from '@/core/components/Input'
import { cn, norm } from '@/core/utils/format'
import { useLookups } from '../logic/useLookups'
import type { Product } from '../logic/types'
import { useProducts } from '../logic/useProducts'

interface Props {
  value?: string
  onChange?: (value: string) => void
  onSelect?: (product: Product) => void
  placeholder?: string
  className?: string
}

/** Ô tìm sản phẩm theo tên thuốc, dạng bào chế, phân loại. */
export function ProductSearchBar({ value, onChange, onSelect, placeholder, className }: Props) {
  const navigate = useNavigate()
  const { data: products = [] } = useProducts()
  const lookups = useLookups()
  const [inner, setInner] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const query = value ?? inner

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const matches = useMemo(() => {
    const k = norm(query.trim())
    if (!k) return []
    return products
      .filter((p) => norm([
        p.code, p.name, p.activeIngredients, p.registrationNo, p.regulation,
        lookups.dosageName(p.dosageFormId), lookups.categoryName(p.categoryId),
      ].join(' ')).includes(k))
      .slice(0, 6)
  }, [products, query, lookups])

  const setQuery = (next: string) => {
    if (value === undefined) setInner(next)
    onChange?.(next)
    setOpen(true)
  }

  const select = (product: Product) => {
    setOpen(false)
    if (onSelect) onSelect(product)
    else navigate(`/products/${product.id}`)
  }

  const submit = () => {
    if (onChange) { setOpen(false); return }
    if (!query.trim()) return
    setOpen(false)
    navigate(`/products?keyword=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div ref={root} className={cn('relative', className)}>
      <Input
        icon={<Search className="size-4" />}
        placeholder={placeholder ?? 'Tìm theo tên thuốc, dạng bào chế, phân loại...'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') setOpen(false)
        }}
        className="pr-10"
        aria-label="Tìm kiếm sản phẩm"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(''); setOpen(false) }}
          aria-label="Xóa tìm kiếm"
          className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-brand-50 hover:text-brand-700"
        >
          <X className="size-4" />
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          {matches.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-4 text-xs text-muted">
              <PackageSearch className="size-4" /> Không tìm thấy sản phẩm phù hợp.
            </p>
          ) : (
            matches.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => select(product)}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-brand-50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <PackageSearch className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-900">{product.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {product.code} · v{product.version} · {lookups.dosageName(product.dosageFormId)} · {lookups.categoryName(product.categoryId)}
                  </span>
                </span>
              </button>
            ))
          )}
          <p className="border-t border-line/70 px-3 py-2 text-[10px] text-muted">
            {onChange ? 'Gõ để lọc danh sách bên dưới' : 'Nhấn Enter để xem toàn bộ kết quả trong Danh mục'}
          </p>
        </div>
      )}
    </div>
  )
}
