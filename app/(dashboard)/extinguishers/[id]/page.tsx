'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton, TBody, Table, Td, Th } from '@/components/ui'

type Ext = {
  id: string; serialNumber: string; location: string; type: string; size: string
  installationDate: string; expiryDate: string; status: string
}
type Insp = { id: string; scheduledDate: string; status: string; inspectorFirstName: string | null; inspectorLastName: string | null }
type Maint = { id: string; maintenanceDate: string; actionsTaken: string; conditionsNoted: string | null }

const TYPE_LABEL: Record<string, string> = { water: 'Water', co2: 'CO₂', foam: 'Foam', dry_chemical: 'Dry Chemical' }
const STATUS: Record<string, { label: string; color: 'green' | 'amber' | 'red' | 'gray' | 'blue' }> = {
  active: { label: 'Active', color: 'green' },
  under_maintenance: { label: 'Under maintenance', color: 'amber' },
  expired: { label: 'Expired', color: 'red' },
  decommissioned: { label: 'Decommissioned', color: 'gray' },
  scheduled: { label: 'Scheduled', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
}

export default function ExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: extRes, isLoading } = useSWR(`/api/v1/extinguishers/${id}`, (k: string) => fetcher<Ext>(k))
  const { data: inspRes } = useSWR(`/api/v1/inspections?extinguisherId=${id}&limit=50`, (k: string) => fetcher<Insp[]>(k))
  const { data: maintRes } = useSWR(`/api/v1/maintenance?extinguisherId=${id}&limit=50`, (k: string) => fetcher<Maint[]>(k))

  const ext = extRes?.data
  const inspections = inspRes?.data ?? []
  const maintenance = maintRes?.data ?? []

  return (
    <div className="space-y-6">
      <Link href="/extinguishers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to extinguishers
      </Link>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !ext ? (
        <Card><CardContent><EmptyState title="Extinguisher not found" /></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle><span className="font-mono">{ext.serialNumber}</span></CardTitle>
              <Badge color={STATUS[ext.status]?.color ?? 'gray'}>{STATUS[ext.status]?.label ?? ext.status}</Badge>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Detail label="Location" value={ext.location} />
                <Detail label="Type" value={TYPE_LABEL[ext.type] ?? ext.type} />
                <Detail label="Size" value={ext.size} />
                <Detail label="Installed" value={formatDate(ext.installationDate)} />
                <Detail label="Expires" value={formatDate(ext.expiryDate)} />
              </dl>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Inspection history</h2>
            {inspections.length === 0 ? (
              <Card><CardContent><EmptyState title="No inspections" /></CardContent></Card>
            ) : (
              <Table>
                <thead><tr><Th>Date</Th><Th>Inspector</Th><Th>Status</Th></tr></thead>
                <TBody>
                  {inspections.map((i) => (
                    <tr key={i.id}>
                      <Td className="text-muted">{formatDate(i.scheduledDate)}</Td>
                      <Td className="text-muted">{i.inspectorFirstName ? `${i.inspectorFirstName} ${i.inspectorLastName}` : 'Unassigned'}</Td>
                      <Td><Badge color={STATUS[i.status]?.color ?? 'gray'}>{STATUS[i.status]?.label ?? i.status}</Badge></Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Maintenance history</h2>
            {maintenance.length === 0 ? (
              <Card><CardContent><EmptyState title="No maintenance records" /></CardContent></Card>
            ) : (
              <Table>
                <thead><tr><Th>Date</Th><Th>Actions taken</Th><Th>Conditions</Th></tr></thead>
                <TBody>
                  {maintenance.map((m) => (
                    <tr key={m.id}>
                      <Td className="whitespace-nowrap text-muted">{formatDate(m.maintenanceDate)}</Td>
                      <Td>{m.actionsTaken}</Td>
                      <Td className="text-muted">{m.conditionsNoted ?? '—'}</Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}
