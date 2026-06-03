CREATE TYPE "public"."extinguisher_size" AS ENUM('2.5 lbs', '5 lbs', '9 lbs', '12 lbs');--> statement-breakpoint
CREATE TYPE "public"."extinguisher_status" AS ENUM('active', 'under_maintenance', 'expired', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."extinguisher_type" AS ENUM('water', 'co2', 'foam', 'dry_chemical');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('scheduled', 'completed', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'inspector', 'user');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(64),
	"metadata" jsonb,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_extinguishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"location" varchar(255) NOT NULL,
	"type" "extinguisher_type" NOT NULL,
	"size" "extinguisher_size" NOT NULL,
	"installation_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" "extinguisher_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fire_extinguishers_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"extinguisher_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" time,
	"inspector_id" uuid,
	"requested_by" uuid,
	"status" "inspection_status" DEFAULT 'scheduled' NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"extinguisher_id" uuid NOT NULL,
	"inspector_id" uuid,
	"inspection_id" uuid,
	"actions_taken" text NOT NULL,
	"maintenance_date" date NOT NULL,
	"conditions_noted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"jti" varchar(64) NOT NULL,
	"user_agent" text,
	"ip" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_extinguisher_id_fire_extinguishers_id_fk" FOREIGN KEY ("extinguisher_id") REFERENCES "public"."fire_extinguishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_extinguisher_id_fire_extinguishers_id_fk" FOREIGN KEY ("extinguisher_id") REFERENCES "public"."fire_extinguishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "fe_status_idx" ON "fire_extinguishers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fe_type_idx" ON "fire_extinguishers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fe_expiry_idx" ON "fire_extinguishers" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "insp_extinguisher_idx" ON "inspections" USING btree ("extinguisher_id");--> statement-breakpoint
CREATE INDEX "insp_inspector_idx" ON "inspections" USING btree ("inspector_id");--> statement-breakpoint
CREATE INDEX "insp_status_idx" ON "inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "insp_date_idx" ON "inspections" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "maint_extinguisher_idx" ON "maintenance_records" USING btree ("extinguisher_id");--> statement-breakpoint
CREATE INDEX "maint_inspector_idx" ON "maintenance_records" USING btree ("inspector_id");--> statement-breakpoint
CREATE INDEX "maint_date_idx" ON "maintenance_records" USING btree ("maintenance_date");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pwreset_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");