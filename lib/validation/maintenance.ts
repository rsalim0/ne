import { z } from 'zod'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')

export const createMaintenanceSchema = z.object({
  extinguisherId: z.uuid({ error: 'Select an extinguisher' }),
  actionsTaken: z.string().min(1, 'Required').max(2000).trim(),
  maintenanceDate: dateStr,
  conditionsNoted: z.string().max(2000).trim().optional(),
  inspectionId: z.uuid().optional(),
})
