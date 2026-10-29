import { Hexagon } from 'lucide-react'

export function ComingSoon({ text = 'Trang này sẽ được hoàn thiện ở bước tiếp theo.' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 py-20 text-center">
      <Hexagon className="size-12 animate-float text-brand-400" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-muted">{text}</p>
    </div>
  )
}
