import { and, asc, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  inspections,
  fireExtinguishers,
  users,
  type Inspection,
  type NewInspection,
  type InspectionStatus,
} from '@/lib/db/schema'

export type InspectionRow = Inspection & {
  extinguisherSerial: string | null
  extinguisherLocation: string | null
  inspectorFirstName: string | null
  inspectorLastName: string | null
}

export async function createInspection(data: NewInspection): Promise<Inspection> {
  const [row] = await db.insert(inspections).values(data).returning()
  return row
}

export async function getInspectionById(id: string): Promise<Inspection | null> {
  const [row] = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1)
  return row ?? null
}

export async function updateInspection(
  id: string,
  patch: Partial<NewInspection>
): Promise<Inspection | null> {
  const [row] = await db.update(inspections).set(patch).where(eq(inspections.id, id)).returning()
  return row ?? null
}

const SORTABLE = {
  scheduledDate: inspections.scheduledDate,
  status: inspections.status,
  createdAt: inspections.createdAt,
} as const

export async function listInspections(params: {
  limit: number
  offset: number
  status?: InspectionStatus
  extinguisherId?: string
  inspectorId?: string
  from?: string
  to?: string
  sort?: string
  order: 'asc' | 'desc'
}): Promise<{ rows: InspectionRow[]; total: number }> {
  const conds: SQL[] = []
  if (params.status) conds.push(eq(inspections.status, params.status))
  if (params.extinguisherId) conds.push(eq(inspections.extinguisherId, params.extinguisherId))
  if (params.inspectorId) conds.push(eq(inspections.inspectorId, params.inspectorId))
  if (params.from) conds.push(gte(inspections.scheduledDate, params.from))
  if (params.to) conds.push(lte(inspections.scheduledDate, params.to))
  const where = conds.length ? and(...conds) : undefined

  const sortCol = SORTABLE[params.sort as keyof typeof SORTABLE] ?? inspections.scheduledDate
  const orderBy = params.order === 'asc' ? asc(sortCol) : desc(sortCol)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: inspections.id,
        extinguisherId: inspections.extinguisherId,
        scheduledDate: inspections.scheduledDate,
        scheduledTime: inspections.scheduledTime,
        inspectorId: inspections.inspectorId,
        requestedBy: inspections.requestedBy,
        status: inspections.status,
        remarks: inspections.remarks,
        createdAt: inspections.createdAt,
        extinguisherSerial: fireExtinguishers.serialNumber,
        extinguisherLocation: fireExtinguishers.location,
        inspectorFirstName: users.firstName,
        inspectorLastName: users.lastName,
      })
      .from(inspections)
      .leftJoin(fireExtinguishers, eq(inspections.extinguisherId, fireExtinguishers.id))
      .leftJoin(users, eq(inspections.inspectorId, users.id))
      .where(where)
      .orderBy(orderBy)
      .limit(params.limit)
      .offset(params.offset),
    db.select({ value: count() }).from(inspections).where(where),
  ])

  return { rows: rows as InspectionRow[], total: Number(totalRows[0]?.value ?? 0) }
}
