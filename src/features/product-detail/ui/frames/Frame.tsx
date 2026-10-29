import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  count?: number
  countLabel?: string
  actions?: ReactNode
  children: ReactNode
}

/** Khung nội dung dùng chung cho các nhóm hồ sơ ở trang chi tiết. */
export function Frame({ icon: Icon, title, subtitle, count, countLabel = 'tài liệu', actions, children }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <header className="relative flex flex-wrap items-start gap-3 border-b border-line/70 bg-linear-to-r from-brand-50/90 via-white to-white px-4 py-4 sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_18px_-8px_rgb(2_132_199/0.8)]">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight text-brand-900 sm:text-lg">{title}</h2>
            {typeof count === 'number' && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">{count} {countLabel}</span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted sm:text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex w-full shrink-0 justify-end sm:w-auto">{actions}</div>}
      </header>
      <div className="px-2.5 py-3 sm:px-4 sm:py-4">{children}</div>
    </section>
  )
}
