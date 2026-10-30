import { useEffect, useState } from 'react'
import { resolveMediaUrl, type MediaRef } from './cloudMedia'

/** Trả URL hiển thị cho ảnh lưu trên cloud; tự remount khi ID ảnh đổi. */
export function useMediaUrl(ref?: MediaRef | null) {
  const id = ref?.id ?? ''
  const direct = ref?.url ?? ''
  const [resolved, setResolved] = useState<{ id: string; url: string }>({ id, url: direct })

  useEffect(() => {
    if (!ref || direct) return
    let active = true
    resolveMediaUrl(ref)
      .then((url) => { if (active) setResolved({ id, url: url ?? '' }) })
      .catch(() => { if (active) setResolved({ id, url: '' }) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, direct])

  if (direct) return direct
  return resolved.id === id ? resolved.url : ''
}
