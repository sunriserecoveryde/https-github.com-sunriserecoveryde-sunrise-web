CREATE TABLE "grow_user_state" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"state" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grow_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grow_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"device_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_preview" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_audit_state" (
	"org_id" text PRIMARY KEY NOT NULL,
	"completed_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"corr_action_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"audit_reset_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sos_episodes_of_care" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"facility_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"program" text DEFAULT 'Residential' NOT NULL,
	"level_of_care" text,
	"admission_date" date,
	"discharge_date" date,
	"episode_status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_episodes_status" CHECK ("sos_episodes_of_care"."episode_status" IN ('active', 'discharged', 'transferred', 'completed', 'void')),
	CONSTRAINT "ck_sos_episodes_date_order" CHECK ("sos_episodes_of_care"."discharge_date" IS NULL OR "sos_episodes_of_care"."admission_date" IS NULL OR "sos_episodes_of_care"."discharge_date" >= "sos_episodes_of_care"."admission_date")
);
--> statement-breakpoint
CREATE TABLE "sos_facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"time_zone" text DEFAULT 'America/New_York' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_facilities_status" CHECK ("sos_facilities"."status" IN ('active', 'inactive', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "sos_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_organizations_status" CHECK ("sos_organizations"."status" IN ('active', 'inactive', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "sos_patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"facility_id" uuid NOT NULL,
	"mrn" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" date,
	"gender" text,
	"insurance_payer" text,
	"primary_diagnosis" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_patients_status" CHECK ("sos_patients"."status" IN ('active', 'inactive', 'discharged', 'transferred'))
);
--> statement-breakpoint
CREATE TABLE "sos_staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"professional_role" text DEFAULT 'clinician' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_staff_profiles_status" CHECK ("sos_staff_profiles"."status" IN ('active', 'inactive', 'terminated'))
);
--> statement-breakpoint
CREATE TABLE "sos_user_identity_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"ext_auth_ref" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sos_user_refs_status" CHECK ("sos_user_identity_refs"."status" IN ('active', 'inactive', 'revoked'))
);
--> statement-breakpoint
-- ── Composite-FK prerequisite indexes ────────────────────────────────────────
-- These unique indexes MUST be created before the composite foreign-key
-- constraints that reference them.  PostgreSQL requires a unique constraint
-- or unique index on the referenced column tuple before the FK can be added.
--
--   fk_sos_patients_org_facility   → sos_facilities(org_id, id)
--   fk_sos_episodes_org_facility   → sos_facilities(org_id, id)
CREATE UNIQUE INDEX "idx_sos_facilities_org_id_id" ON "sos_facilities" USING btree ("org_id","id");--> statement-breakpoint
--   fk_sos_episodes_org_patient    → sos_patients(org_id, id)
CREATE UNIQUE INDEX "idx_sos_patients_org_id_id" ON "sos_patients" USING btree ("org_id","id");--> statement-breakpoint
--   fk_sos_staff_profiles_org_user → sos_user_identity_refs(org_id, id)
CREATE UNIQUE INDEX "idx_sos_user_refs_org_id_id" ON "sos_user_identity_refs" USING btree ("org_id","id");--> statement-breakpoint
-- ── Simple foreign keys ───────────────────────────────────────────────────────
ALTER TABLE "grow_user_state" ADD CONSTRAINT "grow_user_state_user_id_grow_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."grow_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_episodes_of_care" ADD CONSTRAINT "sos_episodes_of_care_org_id_sos_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."sos_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_episodes_of_care" ADD CONSTRAINT "sos_episodes_of_care_facility_id_sos_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."sos_facilities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_episodes_of_care" ADD CONSTRAINT "sos_episodes_of_care_patient_id_sos_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."sos_patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ── Composite foreign keys (cross-tenant isolation) ───────────────────────────
-- These require the unique indexes above to already exist.
ALTER TABLE "sos_episodes_of_care" ADD CONSTRAINT "fk_sos_episodes_org_patient" FOREIGN KEY ("org_id","patient_id") REFERENCES "public"."sos_patients"("org_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_episodes_of_care" ADD CONSTRAINT "fk_sos_episodes_org_facility" FOREIGN KEY ("org_id","facility_id") REFERENCES "public"."sos_facilities"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_facilities" ADD CONSTRAINT "sos_facilities_org_id_sos_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."sos_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_patients" ADD CONSTRAINT "sos_patients_org_id_sos_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."sos_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_patients" ADD CONSTRAINT "sos_patients_facility_id_sos_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."sos_facilities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_patients" ADD CONSTRAINT "fk_sos_patients_org_facility" FOREIGN KEY ("org_id","facility_id") REFERENCES "public"."sos_facilities"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_staff_profiles" ADD CONSTRAINT "sos_staff_profiles_org_id_sos_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."sos_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_staff_profiles" ADD CONSTRAINT "fk_sos_staff_profiles_org_user" FOREIGN KEY ("org_id","user_id") REFERENCES "public"."sos_user_identity_refs"("org_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_user_identity_refs" ADD CONSTRAINT "sos_user_identity_refs_org_id_sos_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."sos_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ── Remaining indexes ─────────────────────────────────────────────────────────
CREATE INDEX "idx_sos_episodes_org_id" ON "sos_episodes_of_care" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_sos_episodes_patient_id" ON "sos_episodes_of_care" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_sos_facilities_org_id" ON "sos_facilities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_sos_patients_org_id" ON "sos_patients" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_sos_patients_facility_id" ON "sos_patients" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sos_patients_org_mrn" ON "sos_patients" USING btree ("org_id","mrn");--> statement-breakpoint
CREATE INDEX "idx_sos_staff_profiles_org_id" ON "sos_staff_profiles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_sos_user_refs_org_id" ON "sos_user_identity_refs" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sos_user_refs_org_ext_auth_ref" ON "sos_user_identity_refs" USING btree ("org_id","ext_auth_ref") WHERE "sos_user_identity_refs"."ext_auth_ref" IS NOT NULL;
