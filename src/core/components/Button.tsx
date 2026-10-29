import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/core/utils/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' | 'light'
type Size = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-linear-to-b from-brand-500 to-brand-600 text-white shadow-[0_6px_16px_-6px_rgb(2_132_199/0.7)] hover:from-brand-400 hover:to-brand-600',
  secondary: 'bg-white text-brand-700 border border-line hover:bg-brand-50 hover:border-brand-200',
  ghost: 'text-muted hover:bg-brand-50 hover:text-brand-700',
  danger: 'bg-opc-red text-white hover:brightness-110',
  glass: 'border border-white/30 bg-white/10 text-white hover:bg-white/20',
  light: 'bg-white text-brand-700 shadow-[0_6px_18px_-8px_rgb(2_132_199/0.6)] hover:bg-brand-50',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm',
        variants[variant], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})
