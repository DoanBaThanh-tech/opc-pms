import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/core/utils/format'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const fieldClass =
  'w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100'

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, icon, className, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <span className="relative block">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          ref={ref}
          className={cn(fieldClass, error ? 'border-opc-red' : 'border-line', !!icon && 'pl-10', className)}
          {...rest}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-opc-red">{error}</span>}
    </label>
  )
})
