const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_DATA_URL_LENGTH = 2_500_000

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không đọc được file ảnh.'))
    img.src = src
  })
}

export function blobToDataUrl(blob: Blob) {
  return readAsDataUrl(blob)
}

/**
 * Đọc ảnh upload, thu nhỏ và nén JPEG trước khi đưa lên cloud storage.
 * Ảnh nhỏ (<500KB, kích thước hợp lệ) được giữ nguyên.
 */
export async function fileToCompressedBlob(file: File, maxDimension = 1400): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn file ảnh (JPG, PNG, WEBP...).')
  if (file.size > MAX_FILE_BYTES) throw new Error('Ảnh tối đa 8 MB. Vui lòng chọn ảnh nhỏ hơn.')

  const original = await readAsDataUrl(file)
  const img = await loadImage(original)
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))

  if (scale === 1 && file.size <= 500 * 1024 && file.type !== 'image/svg+xml') return file

  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  return blob ?? file
}

/**
 * Đọc ảnh upload, thu nhỏ và nén JPEG để lưu vừa localStorage.
 * Chỉ dùng cho dữ liệu cũ; ảnh mới nên đưa lên cloud storage.
 */
export async function fileToCompressedDataUrl(file: File, maxDimension = 1400): Promise<string> {
  const blob = await fileToCompressedBlob(file, maxDimension)
  const dataUrl = await readAsDataUrl(blob)
  if (dataUrl.length > MAX_DATA_URL_LENGTH) throw new Error('Ảnh sau khi nén vẫn quá lớn, vui lòng chọn ảnh khác.')
  return dataUrl
}
