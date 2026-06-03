import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  time,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRoleEnum = pgEnum('user_role', ['admin', 'inspector', 'user'])

export const extinguisherTypeEnum = pgEnum('extinguisher_type', [
  'water',
  'co2',
  'foam',
  'dry_chemical',
])

export const extinguisherSizeEnum = pgEnum('extinguisher_size', [
  '2.5 lbs',
  '5 lbs',
  '9 lbs',
  '12 lbs',
])

export const extinguisherStatusEnum = pgEnum('extinguisher_status', [
  'active',
  'under_maintenance',
  'expired',
  'decommissioned',
])

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'scheduled',
  'completed',
  'overdue',
  'cancelled',
])

/* ------------------------------------------------------------------ */
/* Users (User Management Service)                                     */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('users_role_idx').on(t.role)]
)

/* ------------------------------------------------------------------ */
/* Fire Extinguishers (Fire Extinguisher Management Service)           */
/* ------------------------------------------------------------------ */

export const fireExtinguishers = pgTable(
  'fire_extinguishers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serialNumber: varchar('serial_number', { length: 100 }).notNull().unique(),
    location: varchar('location', { length: 255 }).notNull(),
    type: extinguisherTypeEnum('type').notNull(),
    size: extinguisherSizeEnum('size').notNull(),
    installationDate: date('installation_date').notNull(),
    expiryDate: date('expiry_date').notNull(),
    status: extinguisherStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('fe_status_idx').on(t.status),
    index('fe_type_idx').on(t.type),
    index('fe_expiry_idx').on(t.expiryDate),
  ]
)

/* ------------------------------------------------------------------ */
/* Inspections (Inspection Management Service)                         */
/* ------------------------------------------------------------------ */

export const inspections = pgTable(
  'inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    extinguisherId: uuid('extinguisher_id')
      .notNull()
      .references(() => fireExtinguishers.id, { onDelete: 'cascade' }),
    scheduledDate: date('scheduled_date').notNull(),
    scheduledTime: time('scheduled_time'),
    inspectorId: uuid('inspector_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    requestedBy: uuid('requested_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: inspectionStatusEnum('status').notNull().default('scheduled'),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('insp_extinguisher_idx').on(t.extinguisherId),
    index('insp_inspector_idx').on(t.inspectorId),
    index('insp_status_idx').on(t.status),
    index('insp_date_idx').on(t.scheduledDate),
  ]
)

/* ------------------------------------------------------------------ */
/* Maintenance Records (Maintenance Management Service)                */
/* ------------------------------------------------------------------ */

export const maintenanceRecords = pgTable(
  'maintenance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    extinguisherId: uuid('extinguisher_id')
      .notNull()
      .references(() => fireExtinguishers.id, { onDelete: 'cascade' }),
    inspectorId: uuid('inspector_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    inspectionId: uuid('inspection_id').references(() => inspections.id, {
      onDelete: 'set null',
    }),
    actionsTaken: text('actions_taken').notNull(),
    maintenanceDate: date('maintenance_date').notNull(),
    conditionsNoted: text('conditions_noted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('maint_extinguisher_idx').on(t.extinguisherId),
    index('maint_inspector_idx').on(t.inspectorId),
    index('maint_date_idx').on(t.maintenanceDate),
  ]
)

/* ------------------------------------------------------------------ */
/* Sessions (JWT invalidation / true logout)                           */
/* ------------------------------------------------------------------ */

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jti: varchar('jti', { length: 64 }).notNull().unique(),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
)

/* ------------------------------------------------------------------ */
/* Password resets                                                     */
/* ------------------------------------------------------------------ */

export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pwreset_user_idx').on(t.userId)]
)

/* ------------------------------------------------------------------ */
/* Notifications (inspection scheduling alerts)                        */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notif_user_idx').on(t.userId)]
)

/* ------------------------------------------------------------------ */
/* Audit logs (system activity monitoring + logging)                  */
/* ------------------------------------------------------------------ */

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 64 }),
    metadata: jsonb('metadata'),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_actor_idx').on(t.actorUserId)]
)

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type FireExtinguisher = typeof fireExtinguishers.$inferSelect
export type NewFireExtinguisher = typeof fireExtinguishers.$inferInsert
export type Inspection = typeof inspections.$inferSelect
export type NewInspection = typeof inspections.$inferInsert
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert
export type Session = typeof sessions.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect

export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type ExtinguisherType = (typeof extinguisherTypeEnum.enumValues)[number]
export type ExtinguisherSize = (typeof extinguisherSizeEnum.enumValues)[number]
export type ExtinguisherStatus = (typeof extinguisherStatusEnum.enumValues)[number]
export type InspectionStatus = (typeof inspectionStatusEnum.enumValues)[number]
