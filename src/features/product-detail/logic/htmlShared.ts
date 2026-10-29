import type { Product } from '@/features/products/logic/types'
import type { ProductVersion, VersionDocument, VersionChange } from './types'

export interface HtmlContext {
  product: Product
  version: ProductVersion
  previous?: ProductVersion
  docs: VersionDocument[]
  versions: ProductVersion[]
  names: { dosage: string; category: string }
  logoSrc?: string
}

export const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

const STAGE_LABEL = { current: 'Hiện hành', coming_soon: 'Coming soon', archived: 'Lưu trữ' } as const
const DOC_STATUS_LABEL = { valid: 'Còn hiệu lực', superseded: 'Đã thay thế', draft: 'Bản xem trước' } as const

export const stageLabel = (s: ProductVersion['stage']) => STAGE_LABEL[s]
export const docStatusLabel = (s: VersionDocument['status']) => DOC_STATUS_LABEL[s]

export const htmlStyles = `
  :root { --brand:#0284c7; --brand-dark:#0c4a6e; --brand-soft:#f0f9ff; --ink:#0f2942; --muted:#5b7186; --line:#dbe8f3; }
  * { box-sizing:border-box; }
  body { margin:0; background:#eaf5fc; color:var(--ink); font:14px/1.65 "Segoe UI",system-ui,-apple-system,Arial,sans-serif; }
  .page { position:relative; width:210mm; min-height:297mm; margin:18px auto; background:#fff; padding:16mm 15mm; box-shadow:0 16px 50px rgba(12,74,110,.14); overflow:hidden; }
  .letterhead { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; padding-bottom:14px; border-bottom:3px solid var(--brand); }
  .letterhead img { max-height:44px; max-width:230px; object-fit:contain; }
  .company { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); text-align:right; }
  .company b { display:block; font-size:13px; letter-spacing:.02em; color:var(--brand-dark); }
  .doc-title { margin:26px 0 18px; }
  .eyebrow { margin:0 0 6px; font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--brand); }
  h1 { margin:0; font-size:25px; line-height:1.25; color:var(--brand-dark); }
  h2 { font-size:15px; color:var(--brand-dark); margin:24px 0 8px; }
  h3 { font-size:13px; margin:16px 0 6px; color:var(--brand-dark); }
  .subtitle { margin:6px 0 0; color:var(--muted); font-size:13px; }
  .badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
  .badge { border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700; background:var(--brand-soft); color:var(--brand-dark); }
  .badge.amber { background:#fef3c7; color:#92400e; }
  .badge.gray { background:#f1f5f9; color:#475569; }
  .badge.green { background:#d1fae5; color:#065f46; }
  table { width:100%; border-collapse:collapse; margin:10px 0 16px; font-size:12.5px; }
  th, td { border:1px solid var(--line); padding:8px 10px; text-align:left; vertical-align:top; }
  th { background:var(--brand-soft); color:var(--brand-dark); font-weight:700; }
  tr:nth-child(even) td { background:#fbfdff; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 22px; }
  .meta-grid div { padding:9px 0; border-bottom:1px dashed var(--line); }
  .meta-grid span { display:block; font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
  .meta-grid b { font-size:13px; font-weight:600; }
  .lead { font-size:13.5px; color:#334155; }
  .callout { margin:14px 0; padding:12px 14px; border-left:4px solid var(--brand); background:var(--brand-soft); border-radius:0 10px 10px 0; font-size:12.5px; }
  .muted { color:var(--muted); }
  .stamp { position:absolute; top:46mm; right:14mm; padding:6px 14px; border:2px solid #d97706; color:#b45309; font-weight:800; font-size:13px; letter-spacing:.12em; transform:rotate(-7deg); opacity:.85; }
  .signatures { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-top:44px; text-align:center; font-size:11.5px; color:var(--muted); }
  .signatures b { display:block; color:var(--ink); font-size:12px; }
  .sign-space { height:64px; }
  .footer { position:absolute; bottom:10mm; left:15mm; right:15mm; display:flex; justify-content:space-between; gap:16px; padding-top:8px; border-top:1px solid var(--line); font-size:10px; color:var(--muted); }
  .cover { min-height:250mm; display:flex; flex-direction:column; justify-content:center; }
  .cover .cover-logo { max-height:80px; max-width:320px; margin-bottom:34px; }
  .cover h1 { font-size:38px; max-width:150mm; }
  .cover .cover-band { margin:26px 0; padding:20px 22px; border-radius:16px; background:linear-gradient(135deg,#0c4a6e,#0284c7); color:#fff; }
  .cover .cover-band b { font-size:20px; }
  .cover .cover-meta { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:20px; }
  .cover .cover-meta div { border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
  .cover .cover-meta span { display:block; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .cover .cover-meta b { font-size:13px; }
  .toc { margin-top:24px; }
  .toc li { margin:6px 0; }
  .timeline { list-style:none; padding:0; margin:12px 0; }
  .timeline li { position:relative; margin-left:10px; padding:0 0 16px 22px; border-left:2px solid var(--line); }
  .timeline li::before { content:""; position:absolute; left:-6px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--brand); }
  .timeline li.old::before { background:#cbd5e1; }
  .timeline li.next::before { background:#f59e0b; }
  .timeline b { color:var(--brand-dark); }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .doc-line { display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px dashed var(--line); font-size:12px; }
  .doc-line b { display:block; font-size:12.5px; }
  .doc-line span { color:var(--muted); font-size:11px; }
  .sign-line { margin-top:18px; font-size:12px; }
  @media print {
    body { background:#fff; }
    .page { width:auto; min-height:auto; margin:0; padding:0; box-shadow:none; }
    .page + .page { page-break-before:always; }
    .no-print { display:none !important; }
    @page { size:A4; margin:14mm; }
  }
`

export function badge(text: string, tone: 'blue' | 'amber' | 'gray' | 'green' = 'blue') {
  return `<span class="badge ${tone === 'blue' ? '' : tone}">${escapeHtml(text)}</span>`
}

export function letterhead(logoSrc: string | undefined, docCode: string) {
  return `<header class="letterhead">
    ${logoSrc ? `<img src="${logoSrc}" alt="OPC" />` : '<b style="font-size:20px;color:#0284c7">OPC PHARMA</b>'}
    <div class="company">
      <b>Công ty Cổ phần Dược phẩm OPC</b>
      Hệ thống quản lý sản phẩm · OPC PMS<br />
      Mã hồ sơ: ${escapeHtml(docCode)}
    </div>
  </header>`
}

export function infoGrid(rows: [string, string][]) {
  return `<div class="meta-grid">${rows.map(([k, v]) => `<div><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('')}</div>`
}

export function changeTable(changes: VersionChange[]) {
  if (!changes.length) return '<p class="muted">Chưa ghi nhận thay đổi so với phiên bản trước.</p>'
  const kindLabel = { added: 'Bổ sung', updated: 'Cập nhật', removed: 'Loại bỏ' } as const
  return `<table>
    <thead><tr><th style="width:32%">Nội dung</th><th style="width:28%">Trước thay đổi</th><th style="width:28%">Sau thay đổi</th><th>Loại</th></tr></thead>
    <tbody>${changes.map((c) => `<tr>
      <td><b>${escapeHtml(c.field)}</b></td>
      <td>${escapeHtml(c.before ?? '—')}</td>
      <td>${escapeHtml(c.after ?? '—')}</td>
      <td>${kindLabel[c.kind]}</td>
    </tr>`).join('')}</tbody>
  </table>`
}

export function docTable(docs: VersionDocument[]) {
  return `<table>
    <thead><tr><th>Tài liệu</th><th>Mã</th><th>Định dạng</th><th>Trang</th><th>Trạng thái</th></tr></thead>
    <tbody>${docs.map((d) => `<tr>
      <td><b>${escapeHtml(d.name)}</b>${d.note ? `<br /><span class="muted">${escapeHtml(d.note)}</span>` : ''}</td>
      <td>${escapeHtml(d.code)}</td>
      <td>${d.format.toUpperCase()}</td>
      <td>${d.pages}</td>
      <td>${docStatusLabel(d.status)}</td>
    </tr>`).join('')}</tbody>
  </table>`
}

export function footer(product: Product, version: ProductVersion) {
  const now = new Date().toLocaleString('vi-VN')
  return `<footer class="footer">
    <span>OPC PMS · ${escapeHtml(product.code)} · Phiên bản ${escapeHtml(version.version)} · ${stageLabel(version.stage)}</span>
    <span>Kết xuất ${escapeHtml(now)}</span>
  </footer>`
}
