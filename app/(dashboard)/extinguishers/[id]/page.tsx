'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/lib/user-context'
import {
  createExtinguisherSchema,
  extinguisherSizeValues,
  extinguisherStatusValues,
  extinguisherTypeValues,
} from '@/lib/validation/extinguisher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Alert,
  Badge,
  EmptyState,
  Skeleton,
  TBody,
  Table,
  Td,
  Th,
} from '@/components/ui'

type Ext = {
  id: string
  serialNumber: string
  location: string
  type: (typeof extinguisherTypeValues)[number]
  size: (typeof extinguisherSizeValues)[number]
  installationDate: string
  expiryDate: string
  status: (typeof extinguisherStatusValues)[number]
}

type Insp = {
  id: string
  scheduledDate: string
  status: string
  inspectorFirstName: string | null
  inspectorLastName: string | null
}

type Maint = {
  id: string
  maintenanceDate: string
  actionsTaken: string
  conditionsNoted: string | null
}

const TYPE_LABEL: Record<string, string> = {
  water: 'Water',
  co2: 'CO₂',
  foam: 'Foam',
  dry_chemical: 'Dry Chemical',
}

const EXT_STATUS: Record<
  string,
  { label: string; color: 'green' | 'amber' | 'red' | 'gray' }
> = {
  active: { label: 'Active', color: 'green' },
  under_maintenance: { label: 'Under maintenance', color: 'amber' },
  expired: { label: 'Expired', color: 'red' },
  decommissioned: { label: 'Decommissioned', color: 'gray' },
}

const INSP_STATUS: Record<
  string,
  { label: string; color: 'green' | 'amber' | 'red' | 'gray' | 'blue' }
> = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
}

const TYPE_ITEMS = extinguisherTypeValues.map((v) => ({ value: v, label: TYPE_LABEL[v] }))
const SIZE_ITEMS = extinguisherSizeValues.map((v) => ({ value: v, label: v }))
const STATUS_ITEMS = extinguisherStatusValues.map((v) => ({
  value: v,
  label: EXT_STATUS[v]?.label ?? v,
}))

type FormData = {
  serialNumber: string
  location: string
  type: (typeof extinguisherTypeValues)[number]
  size: (typeof extinguisherSizeValues)[number]
  installationDate: string
  expiryDate: string
  status: (typeof extinguisherStatusValues)[number]
}

type FieldErrors = Partial<Record<keyof FormData | '_cross', string>>

export default function ExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useUser()
  const canEdit = user.role === 'admin' || user.role === 'inspector'

  const {
    data: extRes,
    isLoading,
    mutate: mutateExt,
  } = useSWR(`/api/v1/extinguishers/${id}`, (k: string) => fetcher<Ext>(k))
  const { data: inspRes } = useSWR(
    `/api/v1/inspections?extinguisherId=${id}&limit=50`,
    (k: string) => fetcher<Insp[]>(k)
  )
  const { data: maintRes } = useSWR(
    `/api/v1/maintenance?extinguisherId=${id}&limit=50`,
    (k: string) => fetcher<Maint[]>(k)
  )

  const ext = extRes?.data
  const inspections = inspRes?.data ?? []
  const maintenance = maintRes?.data ?? []

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Link
        href="/extinguishers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to extinguishers
      </Link>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !ext ? (
        <div className="bg-card text-card-foreground border rounded-2xl">
          <div className="px-5 py-4">
            <EmptyState title="Extinguisher not found" />
          </div>
        </div>
      ) : (
        <>
          {/* Detail card */}
          <div className="bg-card text-card-foreground border rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-base font-semibold text-foreground font-mono">
                  {ext.serialNumber}
                </h1>
                <Badge color={EXT_STATUS[ext.status]?.color ?? 'gray'}>
                  {EXT_STATUS[ext.status]?.label ?? ext.status}
                </Badge>
              </div>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  <PencilSimple className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <Detail label="Location" value={ext.location} />
                <Detail label="Type" value={TYPE_LABEL[ext.type] ?? ext.type} />
                <Detail label="Size" value={ext.size} />
                <Detail label="Installed" value={formatDate(ext.installationDate)} />
                <Detail label="Expires" value={formatDate(ext.expiryDate)} />
              </dl>
            </div>
          </div>

          {/* Inspection history */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Inspection history</h2>
            {inspections.length === 0 ? (
              <div className="bg-card text-card-foreground border rounded-2xl">
                <div className="px-5 py-4">
                  <EmptyState title="No inspections" />
                </div>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Inspector</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <TBody>
                  {inspections.map((i) => (
                    <tr key={i.id}>
                      <Td className="text-muted-foreground">{formatDate(i.scheduledDate)}</Td>
                      <Td className="text-muted-foreground">
                        {i.inspectorFirstName
                          ? `${i.inspectorFirstName} ${i.inspectorLastName}`
                          : 'Unassigned'}
                      </Td>
                      <Td>
                        <Badge color={INSP_STATUS[i.status]?.color ?? 'gray'}>
                          {INSP_STATUS[i.status]?.label ?? i.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>

          {/* Maintenance history */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Maintenance history</h2>
            {maintenance.length === 0 ? (
              <div className="bg-card text-card-foreground border rounded-2xl">
                <div className="px-5 py-4">
                  <EmptyState title="No maintenance records" />
                </div>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Actions taken</Th>
                    <Th>Conditions</Th>
                  </tr>
                </thead>
                <TBody>
                  {maintenance.map((m) => (
                    <tr key={m.id}>
                      <Td className="whitespace-nowrap text-muted-foreground">
                        {formatDate(m.maintenanceDate)}
                      </Td>
                      <Td>{m.actionsTaken}</Td>
                      <Td className="text-muted-foreground">{m.conditionsNoted ?? '—'}</Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>

          {/* Edit dialog */}
          {canEdit && (
            <ExtinguisherEditDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              ext={ext}
              onDone={() => {
                setDialogOpen(false)
                mutateExt()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Detail helper                                                              */
/* -------------------------------------------------------------------------- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Edit Dialog                                                                */
/* -------------------------------------------------------------------------- */

function ExtinguisherEditDialog({
  open,
  onOpenChange,
  ext,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ext: Ext
  onDone: () => void
}) {
  const [form, setFormState] = useState<FormData>(() => ({
    serialNumber: ext.serialNumber,
    location: ext.location,
    type: ext.type,
    size: ext.size,
    installationDate: ext.installationDate,
    expiryDate: ext.expiryDate,
    status: ext.status,
  }))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) {
      setFormState({
        serialNumber: ext.serialNumber,
        location: ext.location,
        type: ext.type,
        size: ext.size,
        installationDate: ext.installationDate,
        expiryDate: ext.expiryDate,
        status: ext.status,
      })
      setFieldErrors({})
      setApiError('')
    }
    onOpenChange(next)
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormState((f) => ({ ...f, [key]: value }))
    setFieldErrors((fe) => {
      const next = { ...fe }
      delete next[key]
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const parsed = createExtinguisherSchema.safeParse(form)
    if (!parsed.success) {
      const errs: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormData
        if (key && !errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    // Cross-field: expiryDate must be after installationDate
    if (
      parsed.data.installationDate &&
      parsed.data.expiryDate &&
      parsed.data.expiryDate <= parsed.data.installationDate
    ) {
      setFieldErrors({ _cross: 'Expiry date must be after the installation date.' })
      return
    }

    setLoading(true)
    try {
      await api.patch(`/api/v1/extinguishers/${ext.id}`, parsed.data)
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit extinguisher</DialogTitle>
          <DialogDescription>Update the details for {ext.serialNumber}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            {apiError && (
              <div className="sm:col-span-2">
                <Alert>{apiError}</Alert>
              </div>
            )}
            {fieldErrors._cross && (
              <div className="sm:col-span-2">
                <Alert>{fieldErrors._cross}</Alert>
              </div>
            )}

            {/* Serial Number */}
            <Field>
              <FieldLabel>Serial number</FieldLabel>
              <Input
                value={form.serialNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setField('serialNumber', e.target.value)
                }
                placeholder="e.g. EXT-2024-001"
                aria-invalid={!!fieldErrors.serialNumber}
              />
              {fieldErrors.serialNumber && (
                <FieldError match>{fieldErrors.serialNumber}</FieldError>
              )}
            </Field>

            {/* Location */}
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input
                value={form.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setField('location', e.target.value)
                }
                placeholder="e.g. Building A, Floor 2"
                aria-invalid={!!fieldErrors.location}
              />
              {fieldErrors.location && (
                <FieldError match>{fieldErrors.location}</FieldError>
              )}
            </Field>

            {/* Type */}
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                items={TYPE_ITEMS}
                value={form.type}
                onValueChange={(v) => setField('type', v as FormData['type'])}
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectPopup>
                  {TYPE_ITEMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.type && <FieldError match>{fieldErrors.type}</FieldError>}
            </Field>

            {/* Size */}
            <Field>
              <FieldLabel>Size</FieldLabel>
              <Select
                items={SIZE_ITEMS}
                value={form.size}
                onValueChange={(v) => setField('size', v as FormData['size'])}
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.size}>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectPopup>
                  {SIZE_ITEMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.size && <FieldError match>{fieldErrors.size}</FieldError>}
            </Field>

            {/* Installation Date */}
            <Field>
              <FieldLabel>Installation date</FieldLabel>
              <DatePicker
                value={form.installationDate}
                onChange={(v) => setField('installationDate', v)}
                disableFuture
                invalid={!!fieldErrors.installationDate}
                placeholder="Select installation date"
              />
              {fieldErrors.installationDate && (
                <FieldError match>{fieldErrors.installationDate}</FieldError>
              )}
            </Field>

            {/* Expiry Date */}
            <Field>
              <FieldLabel>Expiry date</FieldLabel>
              <DatePicker
                value={form.expiryDate}
                onChange={(v) => setField('expiryDate', v)}
                disablePast
                invalid={!!fieldErrors.expiryDate}
                placeholder="Select expiry date"
              />
              {fieldErrors.expiryDate && (
                <FieldError match>{fieldErrors.expiryDate}</FieldError>
              )}
            </Field>

            {/* Status */}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                value={form.status}
                onValueChange={(v) => setField('status', v as FormData['status'])}
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.status}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectPopup>
                  {STATUS_ITEMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.status && <FieldError match>{fieldErrors.status}</FieldError>}
            </Field>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
