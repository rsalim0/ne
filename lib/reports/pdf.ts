import PDFDocument from 'pdfkit'
import type { ReportTable } from './types'

/**
 * Render a ReportTable to a downloadable PDF.
 * pdfkit is stream-based; we buffer chunks and resolve a Response.
 * NOTE: pdfkit is declared in `serverExternalPackages` (next.config.ts) so its
 * bundled AFM font files resolve correctly on the server.
 */
export async function pdfResponse(table: ReportTable): Promise<Response> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const finished = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const usable = right - left
  const bottom = doc.page.height - doc.page.margins.bottom

  // Title block
  doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(18).text('FEMS', { continued: true })
  doc.fillColor('#111111').text(`  ${table.title}`)
  doc.font('Helvetica').fontSize(9).fillColor('#666666').text(`Generated ${new Date().toUTCString()}`)
  doc.moveDown(0.8)

  // Summary
  if (table.summary?.length) {
    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(10).text('Summary')
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(9).fillColor('#333333')
    for (const s of table.summary) doc.text(`${s.label}: ${s.value}`)
    doc.moveDown(0.8)
  }

  const colW = usable / table.columns.length
  const rowH = 22

  const drawRow = (
    cells: (string | number | null | undefined)[],
    y: number,
    opts: { fill?: string; bold?: boolean; color?: string }
  ) => {
    if (opts.fill) doc.rect(left, y, usable, rowH).fill(opts.fill)
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(opts.color ?? '#111111')
    cells.forEach((c, i) => {
      doc.text(c == null ? '' : String(c), left + i * colW + 4, y + 7, {
        width: colW - 8,
        height: rowH,
        ellipsis: true,
        lineBreak: false,
      })
    })
  }

  let y = doc.y
  const header = () => {
    drawRow(table.columns.map((c) => c.label), y, { fill: '#f4f4f5', bold: true, color: '#3f3f46' })
    y += rowH
  }
  header()

  table.rows.forEach((row, idx) => {
    if (y + rowH > bottom) {
      doc.addPage()
      y = doc.page.margins.top
      header()
    }
    drawRow(table.columns.map((c) => row[c.key]), y, idx % 2 === 1 ? { fill: '#fafafa' } : {})
    y += rowH
  })

  if (table.rows.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor('#888888').text('No records.', left, y + 6)
  }

  doc.end()
  const buffer = await finished
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${table.filename}.pdf"`,
    },
  })
}
