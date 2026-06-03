import { ok } from '@/lib/http/responses'
import { csvResponse } from './csv'
import { pdfResponse } from './pdf'
import type { ReportTable } from './types'

/** Render a report as JSON (default), CSV, or PDF based on `?format`. */
export async function renderReport(format: string | null, table: ReportTable): Promise<Response> {
  if (format === 'csv') return csvResponse(table)
  if (format === 'pdf') return pdfResponse(table)
  return ok({
    title: table.title,
    summary: table.summary ?? [],
    columns: table.columns,
    rows: table.rows,
  })
}
