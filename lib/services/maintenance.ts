import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  maintenanceRecords,
  fireExtinguishers,
  users,
  type MaintenanceRecord,
  type NewMaintenanceRecord,
} from '@/lib/db/schema'

export type MaintenanceRow = MaintenanceRecord & {
  extinguisherSerial: string | null
  extinguisherLocation: string | null
  inspectorFirstName: string | null
  inspectorLastName: string | null
}

export async function createMaintenance(data: NewMaintenanceRecord): Promise<MaintenanceRecord> {
  const [row] = await db.insert(maintenanceRecords).values(data).returning()
  return row
}

export async function getMaintenanceById(id: string): Promise<MaintenanceRecord | null> {
  const [row] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).limit(1)
  return row ?? null
}

export async function listMaintenance(params: {
  limit: number
  offset: number
  extinguisherId?: string
  inspectorId?: string
  from?: string
  to?: string
}): Promise<{ rows: MaintenanceRow[]; total: number }> {
  const conds: SQL[] = []
  if (params.extinguisherId) conds.push(eq(maintenanceRecords.extinguisherId, params.extinguisherId))
  if (params.inspectorId) conds.push(eq(maintenanceRecords.inspectorId, params.inspectorId))
  if (params.from) conds.push(gte(maintenanceRecords.maintenanceDate, params.from))
  if (params.to) conds.push(lte(maintenanceRecords.maintenanceDate, params.to))
  const where = conds.length ? and(...conds) : undefined

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: maintenanceRecords.id,
        extinguisherId: maintenanceRecords.extinguisherId,
        inspectorId: maintenanceRecords.inspectorId,
        inspectionId: maintenanceRecords.inspectionId,
        actionsTaken: maintenanceRecords.actionsTaken,
        maintenanceDate: maintenanceRecords.maintenanceDate,
        conditionsNoted: maintenanceRecords.conditionsNoted,
        createdAt: maintenanceRecords.createdAt,
        extinguisherSerial: fireExtinguishers.serialNumber,
        extinguisherLocation: fireExtinguishers.location,
        inspectorFirstName: users.firstName,
        inspectorLastName: users.lastName,
      })
      .from(maintenanceRecords)
      .leftJoin(fireExtinguishers, eq(maintenanceRecords.extinguisherId, fireExtinguishers.id))
      .leftJoin(users, eq(maintenanceRecords.inspectorId, users.id))
      .where(where)
      .orderBy(desc(maintenanceRecords.maintenanceDate))
      .limit(params.limit)
      .offset(params.offset),
    db.select({ value: count() }).from(maintenanceRecords).where(where),
  ])

  return { rows: rows as MaintenanceRow[], total: Number(totalRows[0]?.value ?? 0) }
}
