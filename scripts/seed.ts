import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  users,
  fireExtinguishers,
  inspections,
  maintenanceRecords,
  type UserRole,
  type ExtinguisherType,
  type ExtinguisherSize,
  type ExtinguisherStatus,
  type InspectionStatus,
} from '@/lib/db/schema'

/**
 * Idempotent seed: safe to run multiple times.
 * Default password for all seeded users: "Password123"
 */
async function main() {
  const passwordHash = await bcrypt.hash('Password123', 12)

  // ---- Users -------------------------------------------------------------
  const seedUsers: { firstName: string; lastName: string; email: string; role: UserRole }[] = [
    { firstName: 'Site', lastName: 'Admin', email: 'admin@fems.local', role: 'admin' },
    { firstName: 'Ivan', lastName: 'Inspector', email: 'inspector@fems.local', role: 'inspector' },
    { firstName: 'Uma', lastName: 'User', email: 'user@fems.local', role: 'user' },
  ]
  await db
    .insert(users)
    .values(seedUsers.map((u) => ({ ...u, passwordHash })))
    .onConflictDoNothing({ target: users.email })

  const allUsers = await db.select().from(users)
  const inspector = allUsers.find((u) => u.email === 'inspector@fems.local')!
  const user = allUsers.find((u) => u.email === 'user@fems.local')!

  // ---- Fire extinguishers ------------------------------------------------
  const types: ExtinguisherType[] = ['water', 'co2', 'foam', 'dry_chemical']
  const sizes: ExtinguisherSize[] = ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs']
  const locations = [
    'Building A - Floor 1 - Lobby',
    'Building A - Floor 2 - Kitchen',
    'Building B - Server Room',
    'Building B - Warehouse',
    'Building C - Parking Level 1',
    'Building C - Workshop',
  ]
  const extData = Array.from({ length: 12 }, (_, idx) => {
    const i = idx + 1
    const installYear = 2019 + (i % 5)
    const expired = i % 4 === 0
    const status: ExtinguisherStatus = expired ? 'expired' : i % 5 === 0 ? 'under_maintenance' : 'active'
    return {
      serialNumber: `FE-${String(i).padStart(4, '0')}`,
      location: locations[i % locations.length],
      type: types[i % types.length],
      size: sizes[i % sizes.length],
      installationDate: `${installYear}-01-15`,
      expiryDate: expired ? '2024-06-01' : `${installYear + 6}-01-15`,
      status,
    }
  })
  await db
    .insert(fireExtinguishers)
    .values(extData)
    .onConflictDoNothing({ target: fireExtinguishers.serialNumber })

  const exts = await db.select().from(fireExtinguishers)

  // ---- Inspections (only if none yet) -----------------------------------
  const [{ c: inspCount }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(inspections)
  if (Number(inspCount) === 0 && exts.length > 0) {
    const statuses: InspectionStatus[] = ['scheduled', 'completed', 'overdue', 'cancelled']
    await db.insert(inspections).values(
      exts.slice(0, 8).map((e, i) => ({
        extinguisherId: e.id,
        scheduledDate:
          statuses[i % 4] === 'overdue' ? '2024-05-01' : `2026-0${(i % 8) + 1}-10`.slice(0, 10),
        scheduledTime: '09:30:00',
        inspectorId: i % 2 === 0 ? inspector.id : null,
        requestedBy: user.id,
        status: statuses[i % 4],
        remarks: i % 3 === 0 ? 'Routine scheduled inspection' : null,
      }))
    )
  }

  // ---- Maintenance records (only if none yet) ---------------------------
  const [{ c: maintCount }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(maintenanceRecords)
  if (Number(maintCount) === 0 && exts.length > 0) {
    await db.insert(maintenanceRecords).values(
      exts.slice(0, 5).map((e, i) => ({
        extinguisherId: e.id,
        inspectorId: inspector.id,
        actionsTaken: i % 2 === 0 ? 'Recharged and pressure-tested' : 'Replaced safety pin and inspected hose',
        maintenanceDate: `2025-1${i % 2}-05`.slice(0, 10),
        conditionsNoted: i % 2 === 0 ? 'Minor corrosion on bracket' : 'Good overall condition',
      }))
    )
  }

  console.log('✅ Seed complete. Login with admin@fems.local / inspector@fems.local / user@fems.local (password: Password123)')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
