'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { FilePdf, FileCsv } from '@phosphor-icons/react/dist/ssr'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

// COSS primitives
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'

// Legacy primitives kept from ui.tsx (no COSS equivalent)
import { EmptyState, Skeleton, TBody, Table, Td, Th } from '@/components/ui'

type ReportData = {
  title: string
  summary: { label: string; value: string | number }[]
  columns: { key: string; label: string }[]
  rows: Record<string, string | number | null>[]
}

const REPORTS = [
  { value: 'stock', label: 'Stock Report' },
  { value: 'inspections', label: 'Inspection Report' },
  { value: 'expired', label: 'Expired Extinguishers' },
  { value: 'maintenance', label: 'Maintenance History' },
]

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const GROUP_BY = [
  { value: 'extinguisher', label: 'Extinguisher' },
  { value: 'inspector', label: 'Inspector' },
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
        <p className="mt-1 text-sm text-muted-foreground">Compliance analytics with PDF and CSV export.</p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* Report type */}
            <Field>
              <FieldLabel>Report</FieldLabel>
              <Select
                items={REPORTS}
                value={type}
                onValueChange={(v) => { if (v) setType(v) }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectPopup>
                  {REPORTS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>

            {/* Period — only for stock report */}
            {type === 'stock' && (
              <Field>
                <FieldLabel>Period</FieldLabel>
                <Select
                  items={PERIODS}
                  value={period}
                  onValueChange={(v) => { if (v) setPeriod(v) }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectPopup>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            )}

            {/* Group by — only for maintenance report */}
            {type === 'maintenance' && (
              <Field>
                <FieldLabel>Group by</FieldLabel>
                <Select
                  items={GROUP_BY}
                  value={by}
                  onValueChange={(v) => { if (v) setBy(v) }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectPopup>
                    {GROUP_BY.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            )}

            {/* Export buttons */}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" render={<a href={dl('csv')} />}>
                <FileCsv className="h-4 w-4" /> CSV
              </Button>
              <Button type="button" variant="outline" render={<a href={dl('pdf')} />}>
                <FilePdf className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      {report?.summary && report.summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {report.summary.map((s) => (
            <Card key={s.label}>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Data table ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>{report?.title ?? 'Report'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
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
                      <Td key={c.key}>
                        {DATE_KEYS.has(c.key) ? formatDate(row[c.key] as string) : row[c.key] ?? '—'}
                      </Td>
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
