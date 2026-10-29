import { formatDate } from '@/core/utils/format'
import { badge, changeTable, docTable, escapeHtml, footer, htmlStyles, infoGrid, letterhead, stageLabel, type HtmlContext } from './htmlShared'
import { docsByGroup } from './documents'

const stageTone = { current: 'blue', coming_soon: 'amber', archived: 'gray' } as const

export function buildDossierHtml(ctx: HtmlContext) {
  const { product: p, version: v, docs, versions, names } = ctx
  const legal = docsByGroup(docs, 'legal')
  const usage = docsByGroup(docs, 'usage')
  const technical = docsByGroup(docs, 'packaging')

  const lifecycle = versions.map((item) => {
    const tone = item.stage === 'coming_soon' ? 'next' : item.stage === 'archived' ? 'old' : ''
    return `<li class="${tone}">
      <b>Phiên bản ${escapeHtml(item.version)}</b> ${badge(stageLabel(item.stage), stageTone[item.stage])}
      <br /><span class="muted">Cập nhật ${formatDate(item.updatedAt)} · Hiệu lực ${formatDate(item.effectiveDate)}</span>
      <br />${escapeHtml(item.summary)}
    </li>`
  }).join('')

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hồ sơ sản phẩm ${escapeHtml(p.name)} – v${escapeHtml(v.version)}</title>
  <style>${htmlStyles}</style>
</head>
<body>
  <div class="no-print" style="position:fixed;right:18px;top:18px;z-index:9">
    <button onclick="window.print()" style="border:0;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font:600 13px 'Segoe UI',sans-serif;padding:11px 18px;cursor:pointer;box-shadow:0 8px 22px rgba(2,132,199,.35)">In / Lưu PDF</button>
  </div>

  <div class="page">
    <div class="cover">
      ${ctx.logoSrc ? `<img class="cover-logo" src="${ctx.logoSrc}" alt="OPC" />` : '<b style="font-size:26px;color:#0284c7">OPC PHARMA</b>'}
      <p class="eyebrow">Hồ sơ sản phẩm · OPC PMS</p>
      <h1>${escapeHtml(p.name)}</h1>
      <p class="subtitle" style="font-size:15px;max-width:150mm">${escapeHtml(v.activeIngredients)}</p>
      <div class="badges">${badge(`Phiên bản ${v.version}`, 'blue')}${badge(stageLabel(v.stage), stageTone[v.stage])}${badge(names.category, 'gray')}</div>
      <div class="cover-band">
        <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.8">Phiên bản đang xem</p>
        <b>Phiên bản ${escapeHtml(v.version)} · ${escapeHtml(stageLabel(v.stage))}</b>
        <p style="margin:6px 0 0;font-size:12.5px;opacity:.9">Hiệu lực ${formatDate(v.effectiveDate)} · Cập nhật ${formatDate(v.updatedAt)} · ${escapeHtml(v.approvalNo)}</p>
      </div>
      <div class="cover-meta">
        <div><span>Mã sản phẩm</span><b>${escapeHtml(p.code)}</b></div>
        <div><span>Số đăng ký</span><b>${escapeHtml(v.registrationNo || '—')}</b></div>
        <div><span>Dạng bào chế</span><b>${escapeHtml(names.dosage)}</b></div>
        <div><span>Quy cách</span><b>${escapeHtml(v.packaging || '—')}</b></div>
        <div><span>Hạn dùng</span><b>${escapeHtml(v.shelfLife || '—')}</b></div>
        <div><span>Quy định</span><b>${escapeHtml(v.regulation)}</b></div>
      </div>
      <div class="toc">
        <p class="eyebrow" style="margin-bottom:8px">Mục lục</p>
        <ol>
          <li>Thông tin chung & thay đổi của phiên bản</li>
          <li>Hồ sơ pháp lý & quyết định phê duyệt (${legal.length} tài liệu)</li>
          <li>Hướng dẫn sử dụng & so sánh phiên bản (${usage.length} tài liệu)</li>
          <li>Quy cách đóng gói & hồ sơ kỹ thuật (${technical.length} tài liệu)</li>
          <li>Vòng đời phiên bản</li>
        </ol>
      </div>
    </div>
    ${footer(p, v)}
  </div>

  <div class="page">
    ${letterhead(ctx.logoSrc, `HS-${p.code}-${v.version.replace(/\./g, '')}`)}
    <div class="doc-title">
      <p class="eyebrow">Tổng quan hồ sơ</p>
      <h1>${escapeHtml(p.name)} · Phiên bản ${escapeHtml(v.version)}</h1>
      <div class="badges">${badge(stageLabel(v.stage), stageTone[v.stage])}${badge(`Cập nhật ${formatDate(v.updatedAt)}`, 'gray')}</div>
    </div>

    <h2>1. Thông tin chung</h2>
    ${infoGrid([
      ['Số đăng ký', v.registrationNo || '—'],
      ['Dạng bào chế', names.dosage],
      ['Phân loại', names.category],
      ['Quy định', v.regulation],
      ['Quy cách đóng gói', v.packaging || '—'],
      ['Hạn dùng', v.shelfLife || '—'],
      ['Nơi sản xuất', v.manufacturer],
      ['Ngày hiệu lực', formatDate(v.effectiveDate)],
    ])}
    <h2>Cách thức sản xuất</h2>
    <p>${escapeHtml(v.manufacturingMethod)}</p>
    <h2>Hoạt chất & hàm lượng</h2>
    <p>${escapeHtml(v.activeIngredients)}</p>

    <h2>2. Thay đổi của phiên bản</h2>
    <p class="lead">${escapeHtml(v.summary)}</p>
    ${changeTable(v.changes)}

    <h2>3. Hồ sơ pháp lý & quyết định phê duyệt</h2>
    <div class="callout">Người phê duyệt: <b>${escapeHtml(v.approvedBy)}</b> · Quyết định: <b>${escapeHtml(v.approvalNo)}</b></div>
    ${docTable(legal)}

    <h2>4. Hồ sơ hướng dẫn sử dụng & so sánh phiên bản</h2>
    ${docTable(usage)}

    <h2>5. Quản lý quy cách đóng gói & hồ sơ kỹ thuật</h2>
    ${docTable(technical)}
    ${footer(p, v)}
  </div>

  <div class="page">
    ${letterhead(ctx.logoSrc, `HS-${p.code}-${v.version.replace(/\./g, '')}`)}
    <div class="doc-title">
      <p class="eyebrow">Lịch sử & vòng đời</p>
      <h1>Vòng đời phiên bản</h1>
      <p class="subtitle">Dòng thời gian được đồng bộ từ hồ sơ sản phẩm trên OPC PMS.</p>
    </div>
    <ul class="timeline">${lifecycle}</ul>
    <h2>Ghi chú xuất hồ sơ</h2>
    <p class="muted">Tệp này được kết xuất tự động từ Hệ thống quản lý sản phẩm OPC (OPC PMS) theo dữ liệu tại thời điểm tải xuống. Khi có phiên bản mới được đưa vào sử dụng, vui lòng tải lại hồ sơ để bảo đảm tính đồng bộ.</p>
    <div class="signatures">
      <div><b>Người lập hồ sơ</b><div class="sign-space"></div><span>Phòng Đăng ký</span></div>
      <div><b>Trưởng phòng QA</b><div class="sign-space"></div><span>Kiểm tra & xác nhận</span></div>
      <div><b>Giám đốc / Người được ủy quyền</b><div class="sign-space"></div><span>Phê duyệt</span></div>
    </div>
    ${footer(p, v)}
  </div>
</body>
</html>`
}
