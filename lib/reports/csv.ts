import type { ReportTable } from './types'

function escape(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function tableToCsv(table: ReportTable): string {
  const header = table.columns.map((c) => escape(c.label)).join(',')
  const lines = table.rows.map((row) => table.columns.map((c) => escape(row[c.key])).join(','))
  return [header, ...lines].join('\r\n')
}

export function csvResponse(table: ReportTable): Response {
  return new Response(tableToCsv(table), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table.filename}.csv"`,
    },
  })
}
