const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export const formatDate = (v?: string | Date | null) => (v ? dateFmt.format(new Date(v)) : '')
export const formatDateTime = (v?: string | Date | null) => (v ? dateTimeFmt.format(new Date(v)) : '')
export const formatNumber = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Bỏ dấu tiếng Việt, hạ chữ thường – dùng cho tìm kiếm */
export const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
