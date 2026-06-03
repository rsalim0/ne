import { z } from 'zod'

export const inspectionStatusValues = ['scheduled', 'completed', 'overdue', 'cancelled'] as const

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Use HH:MM')

export const createInspectionSchema = z.object({
  extinguisherId: z.uuid({ error: 'Select an extinguisher' }),
  scheduledDate: dateStr,
  scheduledTime: timeStr.optional(),
  remarks: z.string().max(1000).optional(),
})

export const updateInspectionSchema = z
  .object({
    status: z.enum(inspectionStatusValues).optional(),
    inspectorId: z.uuid().nullable().optional(),
    scheduledDate: dateStr.optional(),
    scheduledTime: timeStr.optional(),
    remarks: z.string().max(1000).nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  })
