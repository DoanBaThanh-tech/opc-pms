import { formatDate } from '@/core/utils/format'
import type { VersionDocument } from './types'
import {
  badge, changeTable, docStatusLabel, escapeHtml, footer, htmlStyles, infoGrid, letterhead, stageLabel,
  type HtmlContext,
} from './htmlShared'

const stageTone = { current: 'blue', coming_soon: 'amber', archived: 'gray' } as const

function legalBody(ctx: HtmlContext, doc: VersionDocument) {
  const v = ctx.version
  if (doc.name.startsWith('Quyết định')) {
    return `
      <p class="lead">Căn cứ hồ sơ đăng ký lưu hành và đề nghị của Phòng Đảm bảo chất lượng, Hội đồng thẩm định xem xét và phê duyệt nội dung phiên bản <b>${escapeHtml(v.version)}</b> của sản phẩm <b>${escapeHtml(ctx.product.name)}</b>.</p>
      <h2>Nội dung phê duyệt</h2>
      ${infoGrid([
        ['Số đăng ký', v.registrationNo || '—'],
        ['Dạng bào chế', ctx.names.dosage],
        ['Phân loại', ctx.names.category],
        ['Quy định', v.regulation],
        ['Quy cách đóng gói', v.packaging],
        ['Hạn dùng', v.shelfLife],
        ['Ngày hiệu lực', formatDate(v.effectiveDate)],
        ['Người phê duyệt', v.approvedBy],
      ])}
      <div class="callout"><b>Điều 1.</b> Phê duyệt phiên bản ${escapeHtml(v.version)} với hoạt chất và hàm lượng: ${escapeHtml(v.activeIngredients)}.<br /><b>Điều 2.</b> Các bộ phận liên quan triển khai in ấn nhãn, tờ hướng dẫn và cập nhật hồ sơ kỹ thuật theo đúng nội dung được duyệt.</div>
      <h2>Ghi chú</h2>
      <p class="muted">${escapeHtml(doc.note ?? 'Bản gốc được lưu tại Phòng Đảm bảo chất lượng và đối chiếu khi có yêu cầu.')}</p>`
  }
  if (doc.name.startsWith('Giấy đăng ký')) {
    return `
      <p class="lead">Xác nhận sản phẩm <b>${escapeHtml(ctx.product.name)}</b> được đăng ký lưu hành với thông tin dưới đây.</p>
      ${infoGrid([
        ['Số đăng ký', v.registrationNo || '—'],
        ['Tên sản phẩm', ctx.product.name],
        ['Hoạt chất & hàm lượng', v.activeIngredients],
        ['Dạng bào chế', ctx.names.dosage],
        ['Quy cách đóng gói', v.packaging],
        ['Hạn dùng', v.shelfLife],
        ['Cơ sở sản xuất', v.manufacturer],
        ['Ngày hiệu lực', formatDate(v.effectiveDate)],
      ])}
      <h2>Phạm vi áp dụng</h2>
      <p>Sản phẩm được phép sản xuất, lưu thông và sử dụng theo đúng hồ sơ đã công bố. Mọi thay đổi về thành phần, quy cách hoặc nhãn mác phải được cập nhật thành phiên bản mới trong hệ thống OPC PMS trước khi triển khai.</p>`
  }
  if (doc.name.startsWith('Biên bản')) {
    return `
      <p class="lead">Hôm nay, Hội đồng thẩm định đã họp xem xét hồ sơ thay đổi của phiên bản <b>${escapeHtml(v.version)}</b> – sản phẩm <b>${escapeHtml(ctx.product.name)}</b>.</p>
      <h2>Kết quả thẩm định</h2>
      <table>
        <thead><tr><th>Nội dung thẩm định</th><th>Kết quả</th><th>Ghi chú</th></tr></thead>
        <tbody>
          <tr><td>Tính đầy đủ của hồ sơ pháp lý</td><td>Đạt</td><td>Đủ giấy đăng ký và quyết định liên quan</td></tr>
          <tr><td>Tiêu chuẩn chất lượng & công thức</td><td>Đạt</td><td>Đối chiếu hồ sơ kỹ thuật CT1 – CT2</td></tr>
          <tr><td>Nội dung nhãn và hướng dẫn sử dụng</td><td>Đạt</td><td>Thống nhất với tờ rơi đính kèm</td></tr>
          <tr><td>Quy cách đóng gói</td><td>Đạt</td><td>${escapeHtml(v.packaging)}</td></tr>
        </tbody>
      </table>
      <h2>Kết luận</h2>
      <p>Hồ sơ đủ điều kiện để ${v.stage === 'coming_soon' ? 'xem xét đưa vào sử dụng' : 'lưu hành và tiếp tục theo dõi sau lưu hành'}.</p>`
  }
  return `
    <p class="lead">Công văn xác nhận nội dung nhãn và tờ rơi của phiên bản <b>${escapeHtml(v.version)}</b>.</p>
    <p>Công ty Cổ phần Dược phẩm OPC xác nhận các nội dung đã được rà soát, thống nhất với hồ sơ phê duyệt và đáp ứng yêu cầu ghi nhãn hiện hành.</p>
    ${infoGrid([
      ['Sản phẩm', ctx.product.name],
      ['Số đăng ký', v.registrationNo || '—'],
      ['Quy cách', v.packaging],
      ['Ngày cập nhật', formatDate(v.updatedAt)],
    ])}
    <p class="muted">${escapeHtml(doc.note ?? 'Nội dung chi tiết được lưu cùng hồ sơ in tại Phòng Đảm bảo chất lượng.')}</p>`
}

function usageBody(ctx: HtmlContext, doc: VersionDocument) {
  const v = ctx.version
  if (doc.name.startsWith('Báo cáo so sánh')) {
    return `
      <p class="lead">Báo cáo đối chiếu các nội dung thay đổi của phiên bản <b>${escapeHtml(v.version)}</b>${ctx.previous ? ` so với phiên bản <b>${escapeHtml(ctx.previous.version)}</b>` : ' so với hồ sơ gốc'}.</p>
      <h2>Các điểm thay đổi</h2>
      ${changeTable(v.changes)}
      <h2>Kết luận</h2>
      <p>${v.changes.length ? 'Các thay đổi đã được đối chiếu với hồ sơ pháp lý, quy cách đóng gói và nội dung hướng dẫn sử dụng. Đề nghị cập nhật đồng bộ trước ngày hiệu lực.' : 'Chưa ghi nhận sai lệch so với phiên bản trước. Hồ sơ được giữ nguyên và tiếp tục theo dõi.'}</p>`
  }
  if (doc.name.startsWith('Biên bản')) {
    return `
      <p class="lead">Biên bản xác nhận nội dung hướng dẫn sử dụng của phiên bản <b>${escapeHtml(v.version)}</b>.</p>
      <p>Đại diện Phòng Đảm bảo chất lượng, Phòng Đăng ký và Bộ phận sản xuất đã rà soát nội dung tờ hướng dẫn sử dụng, đối chiếu với hồ sơ đã phê duyệt và thống nhất các nội dung sau:</p>
      ${infoGrid([
        ['Sản phẩm', ctx.product.name],
        ['Hoạt chất & hàm lượng', v.activeIngredients],
        ['Quy cách', v.packaging],
        ['Ngày xác nhận', formatDate(v.updatedAt)],
      ])}
      <p class="muted">Nội dung hướng dẫn chi tiết được đính kèm trong tài liệu “Hướng dẫn sử dụng – tờ rơi sản phẩm”.</p>`
  }
  return `
    <p class="lead">Tờ hướng dẫn sử dụng đi kèm sản phẩm <b>${escapeHtml(ctx.product.name)}</b> – phiên bản <b>${escapeHtml(v.version)}</b>.</p>
    <h2>1. Thông tin sản phẩm</h2>
    ${infoGrid([
      ['Tên sản phẩm', ctx.product.name],
      ['Hoạt chất & hàm lượng', v.activeIngredients],
      ['Dạng bào chế', ctx.names.dosage],
      ['Quy cách đóng gói', v.packaging],
      ['Số đăng ký', v.registrationNo || '—'],
      ['Hạn dùng', v.shelfLife],
    ])}
    <h2>2. Hướng dẫn bảo quản</h2>
    <p>Bảo quản nơi khô ráo, thoáng mát, tránh ánh sáng trực tiếp và xa tầm tay trẻ em. Không sử dụng khi sản phẩm có dấu hiệu biến màu, biến chất hoặc quá hạn dùng.</p>
    <h2>3. Lưu ý an toàn</h2>
    <p>Đọc kỹ hướng dẫn trước khi sử dụng. Người đang dùng thuốc khác, phụ nữ mang thai, cho con bú hoặc có bệnh lý nền nên tham khảo ý kiến chuyên môn. Không dùng quá liều khuyến cáo.</p>
    <div class="callout">Thông tin chi tiết theo tờ hướng dẫn đã được phê duyệt và lưu tại hồ sơ phiên bản ${escapeHtml(v.version)}.</div>`
}

function packagingBody(ctx: HtmlContext, doc: VersionDocument) {
  const v = ctx.version
  if (doc.name.startsWith('Bản vẽ')) {
    return `
      <p class="lead">Thông số quy cách đóng gói áp dụng cho phiên bản <b>${escapeHtml(v.version)}</b>.</p>
      ${infoGrid([
        ['Quy cách đóng gói', v.packaging],
        ['Hạn dùng', v.shelfLife],
        ['Số đăng ký', v.registrationNo || '—'],
        ['Cơ sở sản xuất', v.manufacturer],
      ])}
      <h2>Yêu cầu kỹ thuật bao bì</h2>
      <table>
        <thead><tr><th>Hạng mục</th><th>Yêu cầu</th></tr></thead>
        <tbody>
          <tr><td>Vật liệu bao bì</td><td>Đạt tiêu chuẩn tiếp xúc trực tiếp với sản phẩm</td></tr>
          <tr><td>Thông tin trên nhãn</td><td>Đầy đủ tên, hoạt chất, số đăng ký, hạn dùng, số lô</td></tr>
          <tr><td>Đóng gói</td><td>${escapeHtml(v.packaging || 'Theo quy cách đã phê duyệt')}</td></tr>
          <tr><td>Bảo quản</td><td>Nơi khô ráo, tránh ánh sáng trực tiếp</td></tr>
        </tbody>
      </table>`
  }
  if (doc.name.startsWith('Tiêu chuẩn')) {
    return `
      <p class="lead">Tiêu chuẩn cơ sở và các chỉ tiêu kiểm nghiệm áp dụng cho phiên bản <b>${escapeHtml(v.version)}</b>.</p>
      <table>
        <thead><tr><th>Chỉ tiêu</th><th>Yêu cầu</th><th>Phương pháp</th></tr></thead>
        <tbody>
          <tr><td>Cảm quan</td><td>Đúng mô tả sản phẩm</td><td>Quan sát bằng mắt thường</td></tr>
          <tr><td>Độ đồng đều</td><td>Đạt quy định hiện hành</td><td>Theo TCCS</td></tr>
          <tr><td>Định lượng hoạt chất</td><td>${escapeHtml(v.activeIngredients)}</td><td>HPLC / phương pháp đã thẩm định</td></tr>
          <tr><td>Giới hạn vi sinh</td><td>Đạt giới hạn cho phép</td><td>Phương pháp thử vi sinh</td></tr>
          <tr><td>Độ ẩm</td><td>Theo tiêu chuẩn áp dụng</td><td>Sấy / Karl Fischer</td></tr>
        </tbody>
      </table>
      <p class="muted">Phiếu kiểm nghiệm của mỗi lô được lưu tại Phòng Đảm bảo chất lượng.</p>`
  }
  return `
    <p class="lead">Hồ sơ kỹ thuật CT1 – CT2 của phiên bản <b>${escapeHtml(v.version)}</b>.</p>
    <h2>1. Công thức</h2>
    <p>${escapeHtml(v.activeIngredients)}</p>
    <h2>2. Quy trình sản xuất</h2>
    <p>${escapeHtml(v.manufacturingMethod)}</p>
    <h2>3. Tiêu chuẩn & quy định áp dụng</h2>
    ${infoGrid([
      ['Quy định', v.regulation],
      ['Dạng bào chế', ctx.names.dosage],
      ['Phân loại', ctx.names.category],
      ['Quy cách', v.packaging],
      ['Hạn dùng', v.shelfLife],
      ['Cơ sở sản xuất', v.manufacturer],
    ])}
    <div class="callout">Hồ sơ kỹ thuật được kiểm soát phiên bản và chỉ có hiệu lực khi tương ứng với phiên bản đang được áp dụng.</div>`
}

function signatures(v: HtmlContext['version']) {
  return `<div class="signatures">
    <div><b>Người lập hồ sơ</b><div class="sign-space"></div><span>${escapeHtml(v.stage === 'coming_soon' ? 'Đang chuẩn bị' : 'Phòng Đăng ký')}</span></div>
    <div><b>Trưởng phòng QA</b><div class="sign-space"></div><span>Kiểm tra & xác nhận</span></div>
    <div><b>Giám đốc / Người được ủy quyền</b><div class="sign-space"></div><span>Phê duyệt</span></div>
  </div>`
}

const stampText = { current: '', coming_soon: 'BẢN XEM TRƯỚC', archived: 'LƯU TRỮ' } as const

export function buildDocumentHtml(ctx: HtmlContext, doc: VersionDocument) {
  const v = ctx.version
  const body = doc.group === 'legal' ? legalBody(ctx, doc) : doc.group === 'usage' ? usageBody(ctx, doc) : packagingBody(ctx, doc)
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.name)} – ${escapeHtml(ctx.product.name)} v${escapeHtml(v.version)}</title>
  <style>${htmlStyles}</style>
</head>
<body>
  <div class="no-print print-fab">
    <button class="print-btn" onclick="window.print()">In / Lưu PDF</button>
  </div>
  <div class="page">
    ${stampText[v.stage] ? `<div class="stamp">${stampText[v.stage]}</div>` : ''}
    ${letterhead(ctx.logoSrc, doc.code)}
    <div class="doc-title">
      <p class="eyebrow">Hồ sơ sản phẩm · ${escapeHtml(docStatusLabel(doc.status))}</p>
      <h1>${escapeHtml(doc.name)}</h1>
      <p class="subtitle">${escapeHtml(ctx.product.name)} · Phiên bản ${escapeHtml(v.version)} · Cập nhật ${formatDate(doc.updatedAt)}</p>
      <div class="badges">${badge(stageLabel(v.stage), stageTone[v.stage])}${badge(`Số ĐK: ${v.registrationNo || '—'}`, 'gray')}${badge(ctx.names.dosage, 'gray')}</div>
    </div>
    ${body}
    ${signatures(v)}
    ${footer(ctx.product, v)}
  </div>
</body>
</html>`
}
