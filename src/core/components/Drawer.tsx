import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { cn } from '@/core/utils/format'

interface Props {
  open: boolean
  title: string
  eyebrow?: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}

/** Desktop: panel trượt từ phải. Mobile: bottom-sheet toàn chiều rộng. */
export function Drawer({ open, title, eyebrow, description, onClose, children, footer, widthClass = 'md:max-w-[34rem]' }: Props) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
          <motion.div
            className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop md:max-h-none md:rounded-none md:border-l md:border-line',
              widthClass,
            )}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="relative overflow-hidden border-b border-line bg-linear-to-br from-brand-700 via-brand-600 to-brand-500 px-5 py-5 text-white">
              <div className="hex-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-100">{eyebrow}</p>}
                    <h2 className="mt-1 text-xl font-extrabold leading-tight">{title}</h2>
                    {description && <p className="mt-1 text-sm text-brand-100/90">{description}</p>}
                  </div>
                  <button onClick={onClose} aria-label="Đóng" className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20">
                    <X className="size-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-white px-5 py-4">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
