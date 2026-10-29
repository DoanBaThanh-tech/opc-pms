import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/core/utils/format'
import { fieldClass } from './Input'

interface Option { value: string | number; label: string }
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, options, placeholder, className, ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <span className="relative block">
        <select ref={ref} className={cn(fieldClass, 'appearance-none pr-10', error ? 'border-opc-red' : 'border-line', className)} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </span>
      {error && <span className="mt-1 block text-xs text-opc-red">{error}</span>}
    </label>
  )
})
