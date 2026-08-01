/**
 * Sunrise OS — Phase 1A Hardened Schema
 *
 * Hardening additions vs original Phase 1A:
 *  - date columns use PostgreSQL DATE type (not text)
 *  - CHECK constraints on all status columns
 *  - CHECK constraint enforcing discharge_date >= admission_date
 *  - Composite UNIQUE indexes on (org_id, id) for FK integrity
 *  - Composite FOREIGN KEY constraints ensuring patient.org_id === facility.org_id
 *    and episode.org_id === patient.org_id === facility.org_id
 *  - Partial unique index on ext_auth_ref (unique per org when not null)
 */

import {
  pgTable,
  text,
  date,
  uuid,
  timestamp,
  index,
  uniqueIndex,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── sos_organizations ───────────────────────────────────────────────────────
export const sosOrganizations = pgTable(
  "sos_organizations",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    name:      text("name").notNull(),
    /**
     * Tenant identifier for login — unique across all orgs.
     * Added in Phase 2B migration 0002_authorization_correction.
     * Used in the login form: (orgSlug + email + password) identifies exactly one account.
     * Default "sunrise" is for demo/dev; production orgs receive a deliberate slug on creation.
     */
    slug:      text("slug").notNull().default("sunrise"),
    status:    text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Status must be one of the allowed values.
    ckStatus: check(
      "ck_sos_organizations_status",
      sql`${t.status} IN ('active', 'inactive', 'suspended')`,
    ),
    uniqueSlug: uniqueIndex("idx_sos_organizations_slug").on(t.slug),
  }),
);
export type SosOrganization = typeof sosOrganizations.$inferSelect;
export const insertSosOrganizationSchema = createInsertSchema(sosOrganizations).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosOrganization = z.infer<typeof insertSosOrganizationSchema>;

// ── sos_facilities ──────────────────────────────────────────────────────────
export const sosFacilities = pgTable(
  "sos_facilities",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    orgId:     uuid("org_id").notNull()
                 .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    status:    text("status").notNull().default("active"),
    timeZone:  text("time_zone").notNull().default("America/New_York"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId:    index("idx_sos_facilities_org_id").on(t.orgId),
    // Composite unique needed so patients/episodes can use (org_id, id) as FK target.
    uniqueOrgId: uniqueIndex("idx_sos_facilities_org_id_id").on(t.orgId, t.id),
    ckStatus:    check(
      "ck_sos_facilities_status",
      sql`${t.status} IN ('active', 'inactive', 'closed')`,
    ),
  }),
);
export type SosFacility = typeof sosFacilities.$inferSelect;
export const insertSosFacilitySchema = createInsertSchema(sosFacilities).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosFacility = z.infer<typeof insertSosFacilitySchema>;

// ── sos_user_identity_refs ──────────────────────────────────────────────────
export const sosUserIdentityRefs = pgTable(
  "sos_user_identity_refs",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    orgId:       uuid("org_id").notNull()
                   .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    extAuthRef:  text("ext_auth_ref"),   // populated in Phase 2
    status:      text("status").notNull().default("active"),
    createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId:    index("idx_sos_user_refs_org_id").on(t.orgId),
    // Composite unique: (org_id, id) so staff can composite-FK into this table.
    uniqueOrgId: uniqueIndex("idx_sos_user_refs_org_id_id").on(t.orgId, t.id),
    // ext_auth_ref must be unique per organisation (when not null).
    uniqueOrgExtAuthRef: uniqueIndex("idx_sos_user_refs_org_ext_auth_ref")
      .on(t.orgId, t.extAuthRef)
      .where(sql`${t.extAuthRef} IS NOT NULL`),
    ckStatus:    check(
      "ck_sos_user_refs_status",
      sql`${t.status} IN ('active', 'inactive', 'revoked')`,
    ),
  }),
);
export type SosUserIdentityRef = typeof sosUserIdentityRefs.$inferSelect;

// ── sos_staff_profiles ──────────────────────────────────────────────────────
export const sosStaffProfiles = pgTable(
  "sos_staff_profiles",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id").notNull()
                        .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    userId:           uuid("user_id"),  // nullable until Phase 2
    displayName:      text("display_name").notNull(),
    professionalRole: text("professional_role").notNull().default("clinician"),
    status:           text("status").notNull().default("active"),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_staff_profiles_org_id").on(t.orgId),
    // Composite FK: staff.org_id must equal user_identity.org_id — prevents cross-tenant
    // user identity assignment.  Only enforced when user_id is not null.
    fkOrgUser: foreignKey({
      columns: [t.orgId, t.userId],
      foreignColumns: [sosUserIdentityRefs.orgId, sosUserIdentityRefs.id],
      name: "fk_sos_staff_profiles_org_user",
    }).onDelete("set null"),
    ckStatus: check(
      "ck_sos_staff_profiles_status",
      sql`${t.status} IN ('active', 'inactive', 'terminated')`,
    ),
  }),
);
export type SosStaffProfile = typeof sosStaffProfiles.$inferSelect;
export const insertSosStaffProfileSchema = createInsertSchema(sosStaffProfiles).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosStaffProfile = z.infer<typeof insertSosStaffProfileSchema>;

// ── sos_patients ─────────────────────────────────────────────────────────────
export const sosPatients = pgTable(
  "sos_patients",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id").notNull()
                        .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId:       uuid("facility_id").notNull()
                        .references(() => sosFacilities.id, { onDelete: "restrict" }),
    mrn:              text("mrn").notNull(),
    firstName:        text("first_name").notNull(),
    lastName:         text("last_name").notNull(),
    dateOfBirth:      date("date_of_birth"),           // PostgreSQL DATE — YYYY-MM-DD
    gender:           text("gender"),
    insurancePayer:   text("insurance_payer"),
    primaryDiagnosis: text("primary_diagnosis"),
    status:           text("status").notNull().default("active"),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId:     index("idx_sos_patients_org_id").on(t.orgId),
    idxFacId:     index("idx_sos_patients_facility_id").on(t.facilityId),
    uniqueOrgMrn: uniqueIndex("idx_sos_patients_org_mrn").on(t.orgId, t.mrn),
    // Composite unique: (org_id, id) so episodes can use it as a FK target.
    uniqueOrgId:  uniqueIndex("idx_sos_patients_org_id_id").on(t.orgId, t.id),
    // Composite FK: patient.org_id must equal facility.org_id — prevents cross-tenant
    // facility assignment at the database level.
    fkOrgFacility: foreignKey({
      columns: [t.orgId, t.facilityId],
      foreignColumns: [sosFacilities.orgId, sosFacilities.id],
      name: "fk_sos_patients_org_facility",
    }).onDelete("restrict"),
    ckStatus: check(
      "ck_sos_patients_status",
      sql`${t.status} IN ('active', 'inactive', 'discharged', 'transferred')`,
    ),
  }),
);
export type SosPatient = typeof sosPatients.$inferSelect;
export const insertSosPatientSchema = createInsertSchema(sosPatients).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosPatient = z.infer<typeof insertSosPatientSchema>;

// ── sos_episodes_of_care ─────────────────────────────────────────────────────
export const sosEpisodesOfCare = pgTable(
  "sos_episodes_of_care",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    orgId:         uuid("org_id").notNull()
                     .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId:    uuid("facility_id").notNull()
                     .references(() => sosFacilities.id, { onDelete: "restrict" }),
    patientId:     uuid("patient_id").notNull()
                     .references(() => sosPatients.id, { onDelete: "cascade" }),
    program:       text("program").notNull().default("Residential"),
    levelOfCare:   text("level_of_care"),
    admissionDate: date("admission_date"),              // PostgreSQL DATE — YYYY-MM-DD
    dischargeDate: date("discharge_date"),              // PostgreSQL DATE — YYYY-MM-DD
    episodeStatus: text("episode_status").notNull().default("active"),
    createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId:     index("idx_sos_episodes_org_id").on(t.orgId),
    idxPatientId: index("idx_sos_episodes_patient_id").on(t.patientId),
    // Composite FK: episode.org_id must equal patient.org_id — cross-tenant episode
    // assignment is rejected at the database level.
    fkOrgPatient: foreignKey({
      columns: [t.orgId, t.patientId],
      foreignColumns: [sosPatients.orgId, sosPatients.id],
      name: "fk_sos_episodes_org_patient",
    }).onDelete("cascade"),
    // Composite FK: episode.org_id must equal facility.org_id.
    fkOrgFacility: foreignKey({
      columns: [t.orgId, t.facilityId],
      foreignColumns: [sosFacilities.orgId, sosFacilities.id],
      name: "fk_sos_episodes_org_facility",
    }).onDelete("restrict"),
    ckEpisodeStatus: check(
      "ck_sos_episodes_status",
      sql`${t.episodeStatus} IN ('active', 'discharged', 'transferred', 'completed', 'void')`,
    ),
    // Discharge must not precede admission.
    ckDateOrder: check(
      "ck_sos_episodes_date_order",
      sql`${t.dischargeDate} IS NULL OR ${t.admissionDate} IS NULL OR ${t.dischargeDate} >= ${t.admissionDate}`,
    ),
  }),
);
export type SosEpisodeOfCare = typeof sosEpisodesOfCare.$inferSelect;
export const insertSosEpisodeSchema = createInsertSchema(sosEpisodesOfCare).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosEpisode = z.infer<typeof insertSosEpisodeSchema>;
