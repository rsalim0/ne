'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/lib/user-context'
import { inspectionStatusValues } from '@/lib/validation/inspection'
import {
  Alert, Badge, Button, Card, CardContent, EmptyState, Field, Input, Pagination,
  Select, Skeleton, TBody, Table, Td, Textarea, Th,
} from '@/components/ui'

type Row = {
  id: string
  scheduledDate: string
  scheduledTime: string | null
  status: (typeof inspectionStatusValues)[number]
  extinguisherSerial: string | null
  extinguisherLocation: string | null
  inspectorFirstName: string | null
  inspectorLastName: string | null
}
type ExtOpt = { id: string; serialNumber: string; location: string }

const STATUS: Record<Row['status'], { label: string; color: 'blue' | 'green' | 'red' | 'gray' }> = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
}

export default function InspectionsPage() {
  const user = useUser()
  const canManage = user.role === 'admin' || user.role === 'inspector'

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (status) params.set('status', status)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const key = `/api/v1/inspections?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))
  const rows = data?.data ?? []
  const meta = data?.meta

  async function setRowStatus(id: string, value: string) {
    setError('')
    try {
      await api.patch(`/api/v1/inspections/${id}`, { status: value })
      mutate()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inspections</h1>
          <p className="mt-1 text-sm text-muted">Schedule and track inspection activities.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <CalendarPlus className="h-4 w-4" /> Schedule
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && <ScheduleForm onDone={() => { setShowForm(false); mutate() }} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Status</label>
          <Select className="max-w-[160px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All</option>
            {inspectionStatusValues.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">From</label>
          <Input type="date" className="max-w-[170px]" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">To</label>
          <Input type="date" className="max-w-[170px]" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <Card><CardContent><EmptyState title="No inspections found" hint="Schedule one to get started." /></CardContent></Card>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Extinguisher</Th><Th>Scheduled</Th><Th>Inspector</Th><Th>Status</Th>
                {canManage && <Th className="text-right">Update</Th>}
              </tr>
            </thead>
            <TBody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <span className="block font-mono text-xs font-medium">{r.extinguisherSerial ?? '—'}</span>
                    <span className="block text-xs text-muted">{r.extinguisherLocation}</span>
                  </Td>
                  <Td className="text-muted">
                    {formatDate(r.scheduledDate)}{r.scheduledTime ? ` · ${r.scheduledTime.slice(0, 5)}` : ''}
                  </Td>
                  <Td className="text-muted">
                    {r.inspectorFirstName ? `${r.inspectorFirstName} ${r.inspectorLastName}` : 'Unassigned'}
                  </Td>
                  <Td><Badge color={STATUS[r.status].color}>{STATUS[r.status].label}</Badge></Td>
                  {canManage && (
                    <Td>
                      <div className="flex justify-end">
                        <Select className="max-w-[150px] py-1 text-xs" value={r.status} onChange={(e) => setRowStatus(r.id, e.target.value)}>
                          {inspectionStatusValues.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                        </Select>
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
            </TBody>
          </Table>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onPage={setPage} />
        </>
      )}
    </div>
  )
}

function ScheduleForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { data } = useSWR('/api/v1/extinguishers?limit=100&sort=serialNumber&order=asc', (k: string) => fetcher<ExtOpt[]>(k))
  const options = data?.data ?? []
  const [form, setForm] = useState({ extinguisherId: '', scheduledDate: '', scheduledTime: '', remarks: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/inspections', {
        extinguisherId: form.extinguisherId,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime || undefined,
        remarks: form.remarks || undefined,
      })
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Schedule failed')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Extinguisher">
              <Select value={form.extinguisherId} onChange={(e) => setForm((f) => ({ ...f, extinguisherId: e.target.value }))} required>
                <option value="">Select extinguisher...</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.serialNumber} — {o.location}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><Input type="date" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} required /></Field>
              <Field label="Time"><Input type="time" value={form.scheduledTime} onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))} /></Field>
            </div>
          </div>
          <Field label="Remarks (optional)">
            <Textarea value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Any notes for the inspector..." />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule inspection'}</Button>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
