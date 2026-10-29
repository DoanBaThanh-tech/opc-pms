/** Tải một Blob xuống máy người dùng với tên file cho trước. */
export function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Giữ blob URL đủ lâu để trình duyệt kịp ghi file, tránh tải bị hủy với file lớn.
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url) }, 30_000)
}

export function downloadHtml(fileName: string, html: string) {
  downloadBlob(fileName.endsWith('.html') ? fileName : `${fileName}.html`, new Blob([html], { type: 'text/html;charset=utf-8' }))
}

export function downloadJson(fileName: string, data: unknown) {
  downloadBlob(`${fileName}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }))
}

/** Chuyển tên tiếng Việt thành phần tên file an toàn (không dấu, không khoảng trắng). */
export function fileSlug(value: string, fallback = 'tai-lieu') {
  const slug = value
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}
