import { z } from 'zod'
import { registerSchema, emailSchema } from './auth'

const roleSchema = z.enum(['admin', 'inspector', 'user'])

/** Admin-created user (can set role). */
export const createUserSchema = registerSchema.extend({
  role: roleSchema.default('user'),
})

/** Self profile update — at least one field required. */
export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100).trim().optional(),
    lastName: z.string().min(1).max(100).trim().optional(),
    email: emailSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  })

/** Admin update of another user. */
export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).max(100).trim().optional(),
    lastName: z.string().min(1).max(100).trim().optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  })

export { roleSchema }
