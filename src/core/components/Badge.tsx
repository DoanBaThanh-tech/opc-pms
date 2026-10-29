import type { ReactNode } from 'react'
import { cn } from '@/core/utils/format'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'gray'
const tones: Record<Tone, string> = {
  blue: 'bg-brand-100 text-brand-800',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-slate-100 text-slate-600',
}

export function Badge({ tone = 'blue', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>
}
