import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '@/core/hooks/useMediaQuery'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}

/** Desktop: hộp thoại giữa màn hình. Mobile: bottom-sheet trượt từ dưới lên. */
export function Modal({ open, title, onClose, children, footer, widthClass = 'md:max-w-xl' }: Props) {
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
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-pop md:rounded-3xl ${widthClass}`}
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-muted transition hover:bg-brand-50 hover:text-brand-700">
                <X className="size-5" />
              </button>
            </header>
            <div className="scrollbar-thin overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
