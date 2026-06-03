import { asc, count, desc, eq, lt, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { fireExtinguishers, inspections, maintenanceRecords, users } from '@/lib/db/schema'
import type { ReportTable } from '@/lib/reports/types'

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

/* ----------------------------- Stock report ---------------------------- */

export async function stockReportTable(period: 'daily' | 'monthly' | 'yearly'): Promise<ReportTable> {
  const fmt = period === 'yearly' ? 'YYYY' : period === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD'
  const periodExpr = sql<string>`to_char(${fireExtinguishers.createdAt}, ${fmt})`
  // Group/order by ordinal: reusing a parameterized expression across SELECT and
  // GROUP BY produces mismatched bind params that Postgres won't match.
  const rows = await db
    .select({ period: periodExpr, total: count() })
    .from(fireExtinguishers)
    .groupBy(sql`1`)
    .orderBy(sql`1 desc`)

  const total = rows.reduce((acc, r) => acc + Number(r.total), 0)
  return {
    title: `Stock Report (${period})`,
    filename: `stock-report-${period}`,
    columns: [
      { key: 'period', label: period === 'yearly' ? 'Year' : period === 'monthly' ? 'Month' : 'Day' },
      { key: 'count', label: 'Extinguishers Registered' },
    ],
    rows: rows.map((r) => ({ period: r.period, count: Number(r.total) })),
    summary: [
      { label: 'Total extinguishers', value: total },
      { label: 'Periods reported', value: rows.length },
    ],
  }
}

/* -------------------------- Inspection report --------------------------- */

export async function inspectionReportTable(): Promise<ReportTable> {
  const t = today()
  const list = await db
    .select({
      serial: fireExtinguishers.serialNumber,
      location: fireExtinguishers.location,
      scheduledDate: inspections.scheduledDate,
      status: inspections.status,
    })
    .from(inspections)
    .leftJoin(fireExtinguishers, eq(inspections.extinguisherId, fireExtinguishers.id))
    .orderBy(desc(inspections.scheduledDate))
    .limit(1000)

  let completed = 0
  let pending = 0
  let overdue = 0
  const rows = list.map((i) => {
    let category: string
    if (i.status === 'completed') {
      completed++
      category = 'Completed'
    } else if (i.status === 'cancelled') {
      category = 'Cancelled'
    } else if (i.status === 'overdue' || (i.status === 'scheduled' && i.scheduledDate < t)) {
      overdue++
      category = 'Overdue'
    } else {
      pending++
      category = 'Pending'
    }
    return { serial: i.serial, location: i.location, scheduledDate: i.scheduledDate, category }
  })

  return {
    title: 'Inspection Report',
    filename: 'inspection-report',
    columns: [
      { key: 'serial', label: 'Serial' },
      { key: 'location', label: 'Location' },
      { key: 'scheduledDate', label: 'Scheduled' },
      { key: 'category', label: 'Status' },
    ],
    rows,
    summary: [
      { label: 'Completed', value: completed },
      { label: 'Pending', value: pending },
      { label: 'Overdue', value: overdue },
    ],
  }
}

/* ---------------------------- Expired report ---------------------------- */

export async function expiredReportTable(): Promise<ReportTable> {
  const t = today()
  const list = await db
    .select()
    .from(fireExtinguishers)
    .where(or(lt(fireExtinguishers.expiryDate, t), eq(fireExtinguishers.status, 'expired')))
    .orderBy(asc(fireExtinguishers.expiryDate))

  return {
    title: 'Expired Extinguishers',
    filename: 'expired-extinguishers',
    columns: [
      { key: 'serialNumber', label: 'Serial' },
      { key: 'location', label: 'Location' },
      { key: 'type', label: 'Type' },
      { key: 'size', label: 'Size' },
      { key: 'expiryDate', label: 'Expiry' },
      { key: 'status', label: 'Status' },
    ],
    rows: list.map((e) => ({
      serialNumber: e.serialNumber,
      location: e.location,
      type: e.type,
      size: e.size,
      expiryDate: e.expiryDate,
      status: e.status,
    })),
    summary: [{ label: 'Total expired', value: list.length }],
  }
}

/* -------------------------- Maintenance report -------------------------- */

export async function maintenanceReportTable(
  by: 'extinguisher' | 'inspector',
  id?: string
): Promise<ReportTable> {
  if (by === 'inspector') {
    const rows = await db
      .select({
        inspector: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, 'Unassigned')`,
        total: count(),
        last: sql<string>`max(${maintenanceRecords.maintenanceDate})`,
      })
      .from(maintenanceRecords)
      .leftJoin(users, eq(maintenanceRecords.inspectorId, users.id))
      .where(id ? eq(maintenanceRecords.inspectorId, id) : undefined)
      .groupBy(maintenanceRecords.inspectorId, users.firstName, users.lastName)
      .orderBy(desc(count()))

    return {
      title: 'Maintenance Activities per Inspector',
      filename: 'maintenance-by-inspector',
      columns: [
        { key: 'inspector', label: 'Inspector' },
        { key: 'total', label: 'Activities' },
        { key: 'last', label: 'Last activity' },
      ],
      rows: rows.map((r) => ({ inspector: r.inspector, total: Number(r.total), last: r.last })),
      summary: [{ label: 'Inspectors', value: rows.length }],
    }
  }

  const rows = await db
    .select({
      serial: fireExtinguishers.serialNumber,
      location: fireExtinguishers.location,
      total: count(),
      last: sql<string>`max(${maintenanceRecords.maintenanceDate})`,
    })
    .from(maintenanceRecords)
    .leftJoin(fireExtinguishers, eq(maintenanceRecords.extinguisherId, fireExtinguishers.id))
    .where(id ? eq(maintenanceRecords.extinguisherId, id) : undefined)
    .groupBy(fireExtinguishers.serialNumber, fireExtinguishers.location)
    .orderBy(desc(count()))

  return {
    title: 'Maintenance Activities per Extinguisher',
    filename: 'maintenance-by-extinguisher',
    columns: [
      { key: 'serial', label: 'Serial' },
      { key: 'location', label: 'Location' },
      { key: 'total', label: 'Activities' },
      { key: 'last', label: 'Last activity' },
    ],
    rows: rows.map((r) => ({ serial: r.serial, location: r.location, total: Number(r.total), last: r.last })),
    summary: [{ label: 'Extinguishers serviced', value: rows.length }],
  }
}

/* --------------------------- Dashboard stats ---------------------------- */

export type DashboardStats = {
  extinguishers: { total: number; active: number; underMaintenance: number; expired: number; expiringSoon: number }
  inspections: { pending: number; overdue: number }
  maintenance: { total: number }
}

const num = (v: unknown) => Number(v ?? 0)

/**
 * Dashboard stats in 3 sequential queries using conditional aggregation
 * (`count(*) FILTER`). Sequential + few round trips avoids the connection
 * contention that many concurrent queries cause through Supabase's pooler.
 */
export async function dashboardStats(): Promise<DashboardStats> {
  const t = today()
  const soon = inDays(30)

  const [ext] = await db
    .select({
      total: count(),
      active: sql`count(*) filter (where ${fireExtinguishers.status} = 'active')`,
      underMaintenance: sql`count(*) filter (where ${fireExtinguishers.status} = 'under_maintenance')`,
      expired: sql`count(*) filter (where ${fireExtinguishers.expiryDate} < ${t} or ${fireExtinguishers.status} = 'expired')`,
      expiringSoon: sql`count(*) filter (where ${fireExtinguishers.expiryDate} >= ${t} and ${fireExtinguishers.expiryDate} <= ${soon})`,
    })
    .from(fireExtinguishers)

  const [insp] = await db
    .select({
      pending: sql`count(*) filter (where ${inspections.status} = 'scheduled' and ${inspections.scheduledDate} >= ${t})`,
      overdue: sql`count(*) filter (where ${inspections.status} = 'overdue' or (${inspections.status} = 'scheduled' and ${inspections.scheduledDate} < ${t}))`,
    })
    .from(inspections)

  const [maint] = await db.select({ total: count() }).from(maintenanceRecords)

  return {
    extinguishers: {
      total: num(ext?.total),
      active: num(ext?.active),
      underMaintenance: num(ext?.underMaintenance),
      expired: num(ext?.expired),
      expiringSoon: num(ext?.expiringSoon),
    },
    inspections: { pending: num(insp?.pending), overdue: num(insp?.overdue) },
    maintenance: { total: num(maint?.total) },
  }
}
