export interface ExcelColumn<T> {
  header: string
  width?: number
  /** Lấy giá trị ô. Luôn trả về string | number để không mất dữ liệu. */
  value: (row: T, index: number) => string | number | null | undefined
}

interface ExportOptions<T> {
  fileName: string
  sheetName?: string
  columns: ExcelColumn<T>[]
  rows: T[]
}

/**
 * Xuất toàn bộ `rows` (không chỉ trang đang xem) ra .xlsx.
 * exceljs được import động để không làm nặng bundle ban đầu.
 */
export async function exportToExcel<T>({ fileName, sheetName = 'Sheet1', columns, rows }: ExportOptions<T>) {
  const { Workbook } = await import('exceljs')
  const wb = new Workbook()
  wb.creator = 'OPC PMS'
  wb.created = new Date()
  const ws = wb.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = columns.map((c, i) => ({ header: c.header, key: `c${i}`, width: c.width ?? 20 }))
  rows.forEach((row, idx) => {
    const record: Record<string, string | number> = {}
    columns.forEach((c, i) => { record[`c${i}`] = c.value(row, idx) ?? '' })
    ws.addRow(record).alignment = { vertical: 'top', wrapText: true }
  })

  const head = ws.getRow(1)
  head.height = 24
  head.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  const side = { style: 'thin' as const, color: { argb: 'FFDBE8F3' } }
  ws.eachRow((row) => row.eachCell((cell) => {
    cell.border = { top: side, bottom: side, left: side, right: side }
  }))
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
