import {
  pgTable,
  text,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── sos_organizations ──────────────────────────────────────────────────────────
// One row per customer organisation (tenant root).
export const sosOrganizations = pgTable("sos_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type SosOrganization = typeof sosOrganizations.$inferSelect;
export const insertSosOrganizationSchema = createInsertSchema(sosOrganizations).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosOrganization = z.infer<typeof insertSosOrganizationSchema>;

// ── sos_facilities ─────────────────────────────────────────────────────────────
// A physical or virtual treatment facility belonging to one organisation.
export const sosFacilities = pgTable(
  "sos_facilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    timeZone: text("time_zone").notNull().default("America/New_York"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_facilities_org_id").on(t.orgId),
  }),
);
export type SosFacility = typeof sosFacilities.$inferSelect;
export const insertSosFacilitySchema = createInsertSchema(sosFacilities).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosFacility = z.infer<typeof insertSosFacilitySchema>;

// ── sos_user_identity_refs ─────────────────────────────────────────────────────
// Placeholder for Phase 2 authentication.  extAuthRef will hold an identity-
// provider subject claim once real auth is implemented.
export const sosUserIdentityRefs = pgTable(
  "sos_user_identity_refs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    extAuthRef: text("ext_auth_ref"), // will be populated in Phase 2
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_user_refs_org_id").on(t.orgId),
  }),
);
export type SosUserIdentityRef = typeof sosUserIdentityRefs.$inferSelect;

// ── sos_staff_profiles ─────────────────────────────────────────────────────────
// Human-readable staff profile — linked to a user identity (nullable until Phase 2).
export const sosStaffProfiles = pgTable(
  "sos_staff_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => sosUserIdentityRefs.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    professionalRole: text("professional_role").notNull().default("clinician"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_staff_profiles_org_id").on(t.orgId),
  }),
);
export type SosStaffProfile = typeof sosStaffProfiles.$inferSelect;
export const insertSosStaffProfileSchema = createInsertSchema(sosStaffProfiles).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosStaffProfile = z.infer<typeof insertSosStaffProfileSchema>;

// ── sos_patients ───────────────────────────────────────────────────────────────
// Minimum patient identity fields for Phase 1A.  Clinical data (notes,
// assessments, medications, etc.) will be added in later phases.
export const sosPatients = pgTable(
  "sos_patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => sosFacilities.id, { onDelete: "restrict" }),
    mrn: text("mrn").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: text("date_of_birth"),
    gender: text("gender"),
    insurancePayer: text("insurance_payer"),
    primaryDiagnosis: text("primary_diagnosis"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_patients_org_id").on(t.orgId),
    idxFacilityId: index("idx_sos_patients_facility_id").on(t.facilityId),
    // MRN is unique per organisation, not globally.
    uniqueOrgMrn: uniqueIndex("idx_sos_patients_org_mrn").on(t.orgId, t.mrn),
  }),
);
export type SosPatient = typeof sosPatients.$inferSelect;
export const insertSosPatientSchema = createInsertSchema(sosPatients).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosPatient = z.infer<typeof insertSosPatientSchema>;

// ── sos_episodes_of_care ───────────────────────────────────────────────────────
// A single treatment episode — admission through discharge.
export const sosEpisodesOfCare = pgTable(
  "sos_episodes_of_care",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => sosFacilities.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => sosPatients.id, { onDelete: "cascade" }),
    program: text("program").notNull().default("Residential"),
    levelOfCare: text("level_of_care"),
    admissionDate: text("admission_date"),
    dischargeDate: text("discharge_date"),
    episodeStatus: text("episode_status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxOrgId: index("idx_sos_episodes_org_id").on(t.orgId),
    idxPatientId: index("idx_sos_episodes_patient_id").on(t.patientId),
  }),
);
export type SosEpisodeOfCare = typeof sosEpisodesOfCare.$inferSelect;
export const insertSosEpisodeSchema = createInsertSchema(sosEpisodesOfCare).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSosEpisode = z.infer<typeof insertSosEpisodeSchema>;
