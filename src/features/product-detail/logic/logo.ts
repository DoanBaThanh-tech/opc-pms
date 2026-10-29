import logoFull from '@/assets/logo-full.png'

let cached: string | undefined

/** Nhúng logo OPC vào file HTML xuất ra để mở offline vẫn hiển thị đúng. */
export async function getLogoDataUrl(): Promise<string | undefined> {
  if (cached !== undefined) return cached || undefined
  try {
    const res = await fetch(logoFull)
    const blob = await res.blob()
    cached = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    return cached || undefined
  } catch {
    cached = ''
    return undefined
  }
}
