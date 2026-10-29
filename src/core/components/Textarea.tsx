import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/core/utils/format'
import { fieldClass } from './Input'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea({ label, error, className, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <textarea ref={ref} rows={3} className={cn(fieldClass, 'h-auto resize-y py-2.5', error ? 'border-opc-red' : 'border-line', className)} {...rest} />
      {error && <span className="mt-1 block text-xs text-opc-red">{error}</span>}
    </label>
  )
})
