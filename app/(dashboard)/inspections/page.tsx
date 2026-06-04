'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/lib/user-context'
import { createInspectionSchema, inspectionStatusValues } from '@/lib/validation/inspection'

// COSS primitives
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'

// Legacy primitives kept from ui.tsx (no COSS equivalent)
import {
  Alert,
  Badge,
  Card,
  CardContent,
  EmptyState,
  Pagination,
  Skeleton,
  TBody,
  Table,
  Td,
  Th,
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

const STATUS_ITEMS = inspectionStatusValues.map((s) => ({ value: s, label: STATUS[s].label }))

export default function InspectionsPage() {
  const user = useUser()
  const canManage = user.role === 'admin' || user.role === 'inspector'

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [pageError, setPageError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (statusFilter) params.set('status', statusFilter)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const key = `/api/v1/inspections?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))
  const rows = data?.data ?? []
  const meta = data?.meta

  function openCreate() {
    setEditRow(null)
    setDialogOpen(true)
  }

  function openEdit(row: Row) {
    setEditRow(row)
    setDialogOpen(true)
  }

  function handleDone() {
    setDialogOpen(false)
    setEditRow(null)
    mutate()
  }

  async function setRowStatus(id: string, value: string) {
    setPageError('')
    try {
      await api.patch(`/api/v1/inspections/${id}`, { status: value })
      mutate()
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inspections</h1>
          <p className="mt-1 text-sm text-muted">Schedule and track inspection activities.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <CalendarPlus className="h-4 w-4" /> Schedule
          </Button>
        )}
      </div>

      {pageError && <Alert>{pageError}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Status</span>
          <Select
            items={[{ value: '', label: 'All' }, ...STATUS_ITEMS]}
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v ?? ''); setPage(1) }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="">All</SelectItem>
              {STATUS_ITEMS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">From</span>
          <DatePicker
            value={from}
            onChange={(v) => { setFrom(v); setPage(1) }}
            placeholder="Start date"
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">To</span>
          <DatePicker
            value={to}
            onChange={(v) => { setTo(v); setPage(1) }}
            placeholder="End date"
            className="w-44"
          />
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
                <Th>Extinguisher</Th>
                <Th>Scheduled</Th>
                <Th>Inspector</Th>
                <Th>Status</Th>
                {canManage && <Th className="text-right">Update</Th>}
                {canManage && <Th className="text-right">Edit</Th>}
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
                        <Select
                          items={STATUS_ITEMS}
                          value={r.status}
                          onValueChange={(v) => setRowStatus(r.id, v ?? '')}
                        >
                          <SelectTrigger className="w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectPopup>
                            {STATUS_ITEMS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectPopup>
                        </Select>
                      </div>
                    </Td>
                  )}
                  {canManage && (
                    <Td>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
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

      <InspectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRow={editRow}
        onDone={handleDone}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog form                                                          */
/* ------------------------------------------------------------------ */

type FormState = {
  extinguisherId: string
  scheduledDate: string
  scheduledTime: string
  remarks: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function InspectionDialog({
  open,
  onOpenChange,
  editRow,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editRow: Row | null
  onDone: () => void
}) {
  const isEdit = editRow !== null
  const { data } = useSWR(
    open ? '/api/v1/extinguishers?limit=100&sort=serialNumber&order=asc' : null,
    (k: string) => fetcher<ExtOpt[]>(k)
  )
  const options = data?.data ?? []

  const [form, setForm] = useState<FormState>({
    extinguisherId: editRow?.extinguisherSerial ?? '',
    scheduledDate: editRow?.scheduledDate ?? '',
    scheduledTime: editRow?.scheduledTime ?? '',
    remarks: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when dialog opens
  function handleOpenChange(v: boolean) {
    if (v) {
      setForm({
        extinguisherId: '',
        scheduledDate: '',
        scheduledTime: '',
        remarks: '',
      })
      setFieldErrors({})
      setApiError('')
    }
    onOpenChange(v)
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    if (fieldErrors[k]) setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    setFieldErrors({})

    const payload = {
      extinguisherId: form.extinguisherId,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime || undefined,
      remarks: form.remarks || undefined,
    }

    // Client-side validation
    const result = createInspectionSchema.safeParse(payload)
    if (!result.success) {
      const errs: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState
        if (key && !errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      if (isEdit && editRow) {
        await api.patch(`/api/v1/inspections/${editRow.id}`, payload)
      } else {
        await api.post('/api/v1/inspections', payload)
      }
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Save failed')
      setLoading(false)
    }
  }

  const extItems = options.map((o) => ({
    value: o.id,
    label: `${o.serialNumber} — ${o.location}`,
  }))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Inspection' : 'Schedule Inspection'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the scheduled date, time, or remarks for this inspection.'
              : 'Choose an extinguisher and set a future date to schedule an inspection.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            {apiError && (
              <div className="sm:col-span-2">
                <Alert>{apiError}</Alert>
              </div>
            )}

            {/* Extinguisher */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Extinguisher</FieldLabel>
                <Select
                  items={extItems}
                  value={form.extinguisherId}
                  onValueChange={(v) => set('extinguisherId', v ?? '')}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.extinguisherId}>
                    <SelectValue placeholder="Select extinguisher..." />
                  </SelectTrigger>
                  <SelectPopup>
                    {extItems.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                {fieldErrors.extinguisherId && (
                  <FieldError match>{fieldErrors.extinguisherId}</FieldError>
                )}
              </Field>
            </div>

            {/* Scheduled Date — future only */}
            <Field>
              <FieldLabel>Scheduled Date</FieldLabel>
              <DatePicker
                value={form.scheduledDate}
                onChange={(v) => set('scheduledDate', v)}
                placeholder="Pick a date"
                disablePast
                invalid={!!fieldErrors.scheduledDate}
                className="w-full"
              />
              {fieldErrors.scheduledDate && (
                <FieldError match>{fieldErrors.scheduledDate}</FieldError>
              )}
            </Field>

            {/* Scheduled Time */}
            <Field>
              <FieldLabel>Scheduled Time <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <Input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => set('scheduledTime', (e.target as HTMLInputElement).value)}
                aria-invalid={!!fieldErrors.scheduledTime}
              />
              {fieldErrors.scheduledTime && (
                <FieldError match>{fieldErrors.scheduledTime}</FieldError>
              )}
            </Field>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Remarks <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
                <Textarea
                  value={form.remarks}
                  onChange={(e) => set('remarks', (e.target as HTMLTextAreaElement).value)}
                  placeholder="Any notes for the inspector..."
                  aria-invalid={!!fieldErrors.remarks}
                />
                {fieldErrors.remarks && (
                  <FieldError match>{fieldErrors.remarks}</FieldError>
                )}
              </Field>
            </div>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Schedule inspection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
