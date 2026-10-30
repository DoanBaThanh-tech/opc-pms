import { cn } from '@/core/utils/format'
import type { MediaRef } from './cloudMedia'
import { useMediaUrl } from './useMediaUrl'

interface Props {
  media?: MediaRef | null
  alt?: string
  className?: string
}

/** Ảnh lưu cloud: tự resolve ID sang URL hiển thị. */
export function MediaImage({ media, alt, className }: Props) {
  const src = useMediaUrl(media)
  if (!src) return <div className={cn('animate-pulse bg-brand-50', className)} aria-hidden />
  return <img src={src} alt={alt ?? media?.fileName ?? ''} className={className} loading="lazy" />
}
