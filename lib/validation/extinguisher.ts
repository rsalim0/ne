import { z } from 'zod'

export const extinguisherTypeValues = ['water', 'co2', 'foam', 'dry_chemical'] as const
export const extinguisherSizeValues = ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'] as const
export const extinguisherStatusValues = ['active', 'under_maintenance', 'expired', 'decommissioned'] as const

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')

export const createExtinguisherSchema = z.object({
  serialNumber: z.string().min(1, 'Required').max(100).trim(),
  location: z.string().min(1, 'Required').max(255).trim(),
  type: z.enum(extinguisherTypeValues),
  size: z.enum(extinguisherSizeValues),
  installationDate: dateStr,
  expiryDate: dateStr,
  status: z.enum(extinguisherStatusValues).default('active'),
})

export const updateExtinguisherSchema = z
  .object({
    serialNumber: z.string().min(1).max(100).trim().optional(),
    location: z.string().min(1).max(255).trim().optional(),
    type: z.enum(extinguisherTypeValues).optional(),
    size: z.enum(extinguisherSizeValues).optional(),
    installationDate: dateStr.optional(),
    expiryDate: dateStr.optional(),
    status: z.enum(extinguisherStatusValues).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  })
