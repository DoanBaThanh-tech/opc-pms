import { formatDate } from '@/core/utils/format'
import { badge, changeTable, docTable, escapeHtml, footer, htmlStyles, infoGrid, letterhead, stageLabel, type HtmlContext } from './htmlShared'
import { docsByGroup } from './documents'
import { resolvePackagingSpecs } from './packagingSpecs'

const stageTone = { current: 'blue', coming_soon: 'amber', archived: 'gray' } as const

export function buildDossierHtml(ctx: HtmlContext) {
  const { product: p, version: v, docs, versions, names } = ctx
  const legal = docsByGroup(docs, 'legal')
  const usage = docsByGroup(docs, 'usage')
  const technical = docsByGroup(docs, 'packaging')
  const specs = resolvePackagingSpecs(p, v)
  const specDocIds = new Set(specs.map((s) => s.technicalDoc.id))
  const sharedTechnical = technical.filter((d) => !specDocIds.has(d.id))

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
  <div class="no-print print-fab">
    <button class="print-btn" onclick="window.print()">In / Lưu PDF</button>
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
    <p class="lead">Danh mục ${specs.length} quy cách đóng gói kèm hồ sơ kỹ thuật và ảnh chụp thực tế.</p>
    <table>
      <thead><tr><th style="width:8%">STT</th><th>Quy cách</th><th>Hồ sơ kỹ thuật</th><th style="width:14%">Ảnh chụp</th></tr></thead>
      <tbody>${specs.map((spec, i) => `<tr>
        <td><b>${String(i + 1).padStart(2, '0')}</b></td>
        <td><b>${escapeHtml(spec.name)}</b>${spec.note ? `<br /><span class="muted">${escapeHtml(spec.note)}</span>` : ''}</td>
        <td>${escapeHtml(spec.technicalDoc.name)}<br /><span class="muted">${escapeHtml(spec.technicalDoc.code)} · ${spec.technicalDoc.pages} trang</span></td>
        <td>${spec.photo ? 'Đã cập nhật' : 'Chưa cập nhật'}</td>
      </tr>`).join('')}</tbody>
    </table>
    ${specs.map((spec, i) => `<div style="display:grid;grid-template-columns:1fr 64mm;gap:14px;align-items:start;border:1px solid #dbe8f3;border-radius:12px;padding:12px;margin:10px 0">
      <div>
        <p class="eyebrow" style="margin-bottom:2px">Quy cách ${String(i + 1).padStart(2, '0')}</p>
        <h3 style="margin:0 0 4px">${escapeHtml(spec.name)}</h3>
        ${spec.note ? `<p class="muted" style="margin:0 0 6px">${escapeHtml(spec.note)}</p>` : ''}
        <p style="margin:0;font-size:12px"><b>Hồ sơ kỹ thuật:</b> ${escapeHtml(spec.technicalDoc.name)}</p>
        <p class="muted" style="margin:2px 0 0;font-size:11px">${escapeHtml(spec.technicalDoc.code)} · ${spec.technicalDoc.pages} trang · ${formatDate(spec.technicalDoc.updatedAt)}</p>
      </div>
      <div>${spec.photo
        ? `<img src="${escapeHtml(spec.photo.url)}" alt="${escapeHtml(spec.photo.fileName)}" style="width:100%;max-height:52mm;object-fit:contain;border:1px solid #dbe8f3;border-radius:8px;background:#f6fbff" />`
        : '<div class="muted" style="border:1px dashed #dbe8f3;border-radius:8px;padding:16px;text-align:center;font-size:11px">Chưa có ảnh chụp thực tế</div>'}</div>
    </div>`).join('')}
    ${sharedTechnical.length ? `<h3>Hồ sơ kỹ thuật dùng chung</h3>${docTable(sharedTechnical)}` : ''}
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
