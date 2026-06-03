export type ReportColumn = { key: string; label: string }

export type ReportRow = Record<string, string | number | null | undefined>

export type ReportTable = {
  title: string
  filename: string
  columns: ReportColumn[]
  rows: ReportRow[]
  summary?: { label: string; value: string | number }[]
}
