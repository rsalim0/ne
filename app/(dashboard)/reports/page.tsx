'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { FilePdf, FileCsv } from '@phosphor-icons/react/dist/ssr'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  Card, CardContent, CardHeader, CardTitle, EmptyState, Select, Skeleton, TBody, Table, Td, Th,
} from '@/components/ui'

type ReportData = {
  title: string
  summary: { label: string; value: string | number }[]
  columns: { key: string; label: string }[]
  rows: Record<string, string | number | null>[]
}

const REPORTS = [
  { key: 'stock', label: 'Stock Report' },
  { key: 'inspections', label: 'Inspection Report' },
  { key: 'expired', label: 'Expired Extinguishers' },
  { key: 'maintenance', label: 'Maintenance History' },
]

const DATE_KEYS = new Set(['expiryDate', 'scheduledDate', 'last', 'maintenanceDate'])

export default function ReportsPage() {
  const [type, setType] = useState('stock')
  const [period, setPeriod] = useState('monthly')
  const [by, setBy] = useState('extinguisher')

  const base =
    type === 'stock'
      ? `/api/v1/reports/stock?period=${period}`
      : type === 'maintenance'
        ? `/api/v1/reports/maintenance?by=${by}`
        : `/api/v1/reports/${type}`

  const { data, isLoading } = useSWR(base, (k: string) => fetcher<ReportData>(k))
  const report = data?.data
  const dl = (fmt: string) => base + (base.includes('?') ? '&' : '?') + 'format=' + fmt

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted">Compliance analytics with PDF and CSV export.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Report</label>
            <Select className="max-w-[220px]" value={type} onChange={(e) => setType(e.target.value)}>
              {REPORTS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </Select>
          </div>
          {type === 'stock' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Period</label>
              <Select className="max-w-[150px]" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          )}
          {type === 'maintenance' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Group by</label>
              <Select className="max-w-[180px]" value={by} onChange={(e) => setBy(e.target.value)}>
                <option value="extinguisher">Extinguisher</option>
                <option value="inspector">Inspector</option>
              </Select>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <a href={dl('csv')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2">
              <FileCsv className="h-4 w-4" /> CSV
            </a>
            <a href={dl('pdf')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2">
              <FilePdf className="h-4 w-4" /> PDF
            </a>
          </div>
        </CardContent>
      </Card>

      {report?.summary && report.summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {report.summary.map((s) => (
            <Card key={s.label}>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{report?.title ?? 'Report'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !report || report.rows.length === 0 ? (
            <EmptyState title="No data for this report" />
          ) : (
            <Table>
              <thead>
                <tr>{report.columns.map((c) => <Th key={c.key}>{c.label}</Th>)}</tr>
              </thead>
              <TBody>
                {report.rows.map((row, i) => (
                  <tr key={i}>
                    {report.columns.map((c) => (
                      <Td key={c.key}>{DATE_KEYS.has(c.key) ? formatDate(row[c.key] as string) : row[c.key] ?? '—'}</Td>
                    ))}
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
