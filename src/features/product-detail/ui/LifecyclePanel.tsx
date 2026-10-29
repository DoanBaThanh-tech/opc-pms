import { ArrowRight, CalendarClock, History, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { cn, formatDate } from '@/core/utils/format'
import type { ProductVersion } from '../logic/types'
interface Props {
  versions: ProductVersion[]
  selectedId: number | null
  onPreview: (version: ProductVersion) => void
  onCreate: () => void
}

/** Dòng thời gian phiên bản – đặt ở cột phải để luôn nhìn thấy khi mở hồ sơ. */
export function LifecyclePanel({ versions, selectedId, onPreview, onCreate }: Props) {
  const comingCount = versions.filter((v) => v.stage === 'coming_soon').length

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft xl:max-h-[calc(100dvh-6.5rem)]">
      <header className="relative shrink-0 overflow-hidden bg-linear-to-br from-brand-900 via-brand-700 to-brand-600 px-5 py-5 text-white">
        <div className="hex-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
            <History className="size-3.5" /> Đồng bộ hồ sơ
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Vòng đời phiên bản</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
            <span className="rounded-full bg-white/15 px-2 py-0.5 ring-1 ring-white/20">Tổng {versions.length} phiên bản</span>
            {comingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-100 ring-1 ring-amber-200/30">
                <Sparkles className="size-3" /> {comingCount} sắp áp dụng
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        <ol className="relative space-y-2.5">
          <span className="absolute bottom-5 left-[5px] top-5 w-px bg-line" aria-hidden />
          {versions.map((v) => {
            const isCurrent = v.stage === 'current'
            const isComing = v.stage === 'coming_soon'
            const isSelected = selectedId === v.id
            return (
              <li key={v.id} className="relative pl-6">
                <span
                  className={cn(
                    'absolute left-0 top-4 size-3 rounded-full border-2 border-white',
                    isCurrent ? 'bg-brand-500 ring-4 ring-brand-100' : isComing ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-slate-300 ring-4 ring-slate-100',
                  )}
                  aria-hidden
                />
                <div
                  className={cn(
                    'rounded-2xl border p-3 transition',
                    isCurrent
                      ? 'border-transparent bg-linear-to-br from-brand-700 to-brand-500 text-white shadow-[0_12px_28px_-14px_rgb(2_132_199/0.9)]'
                      : isComing
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-line bg-white hover:border-brand-200',
                    isSelected && !isCurrent && 'ring-2 ring-brand-300 ring-offset-1',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn('text-sm font-extrabold leading-tight', isCurrent ? 'text-white' : 'text-brand-900')}>Phiên bản {v.version}</p>
                      <p className={cn('mt-0.5 flex items-center gap-1 text-[10px]', isCurrent ? 'text-brand-100' : 'text-muted')}>
                        <CalendarClock className="size-3" /> Cập nhật {formatDate(v.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide',
                        isCurrent ? 'bg-white/20 text-white' : isComing ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {isCurrent ? 'Hiện hành' : isComing ? 'Coming soon' : 'Lưu trữ'}
                    </span>
                  </div>

                  <p className={cn('mt-2 line-clamp-2 text-[11px] leading-relaxed', isCurrent ? 'text-white/85' : 'text-muted')}>{v.summary}</p>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className={cn('text-[10px]', isCurrent ? 'text-brand-100' : 'text-muted')}>Hiệu lực {formatDate(v.effectiveDate)}</span>
                    <button
                      onClick={() => onPreview(v)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition',
                        isCurrent
                          ? 'bg-white/15 text-white hover:bg-white/25'
                          : isComing
                            ? 'bg-amber-200/70 text-amber-900 hover:bg-amber-200'
                            : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
                      )}
                    >
                      {isComing ? 'Xem trước' : 'Xem'} <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <footer className="shrink-0 border-t border-line bg-white px-4 py-3">
        <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={onCreate} className="w-full">
          Tạo phiên bản mới
        </Button>
        <p className="mt-1.5 text-center text-[10px] text-muted">{metaHint(versions)}</p>
      </footer>
    </section>
  )
}

function metaHint(versions: ProductVersion[]) {
  const current = versions.find((v) => v.stage === 'current')
  return current ? `Bản đang áp dụng: v${current.version}` : 'Chưa có phiên bản hiện hành'
}
