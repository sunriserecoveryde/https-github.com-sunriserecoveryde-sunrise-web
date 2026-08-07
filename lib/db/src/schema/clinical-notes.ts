/**
 * Phase 3 — Clinical Documentation Foundation
 *
 * Defines sos_clinical_notes: the primary clinical note table.
 *
 * Two approved note types: progress_note, nursing_note.
 * Status lifecycle: draft → signed | draft → voided | signed → voided.
 *
 * Signed notes are immutable (enforced by DB trigger
 * sos_clinical_notes_no_edit_after_sign). Only voiding is permitted after
 * signature, and voiding preserves all clinical content.
 */

import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  index,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sosOrganizations } from "./sunrise-os";
import { sosFacilities } from "./sunrise-os";
import { sosPatients } from "./sunrise-os";
import { sosEpisodesOfCare } from "./sunrise-os";
import { sosUserAccounts } from "./auth-tables";

// ── Note type union ──────────────────────────────────────────────────────────
export const CLINICAL_NOTE_TYPES = ["progress_note", "nursing_note"] as const;
export type ClinicalNoteType = (typeof CLINICAL_NOTE_TYPES)[number];

// ── Note status union ────────────────────────────────────────────────────────
export const CLINICAL_NOTE_STATUSES = ["draft", "signed", "voided"] as const;
export type ClinicalNoteStatus = (typeof CLINICAL_NOTE_STATUSES)[number];

// ── sos_clinical_notes ───────────────────────────────────────────────────────
export const sosClinicalNotes = pgTable(
  "sos_clinical_notes",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    orgId:            uuid("org_id").notNull()
                        .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId:       uuid("facility_id").notNull(),
    patientId:        uuid("patient_id").notNull(),
    episodeId:        uuid("episode_id"),
    authorUserId:     uuid("author_user_id").notNull(),
    noteType:         text("note_type").notNull(),
    status:           text("status").notNull().default("draft"),
    content:          text("content").notNull(),
    version:          integer("version").notNull().default(1),
    signedAt:         timestamp("signed_at", { withTimezone: true }),
    signedByUserId:   uuid("signed_by_user_id"),
    voidedAt:         timestamp("voided_at", { withTimezone: true }),
    voidedByUserId:   uuid("voided_by_user_id"),
    voidReason:       text("void_reason"),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Indexes
    idxPatient:      index("idx_sos_clinical_notes_patient")
                       .on(t.orgId, t.patientId, t.createdAt),
    idxAuthor:       index("idx_sos_clinical_notes_author")
                       .on(t.orgId, t.authorUserId, t.status),
    idxFacilityDate: index("idx_sos_clinical_notes_facility_date")
                       .on(t.orgId, t.facilityId, t.createdAt),

    // Constraints
    ckNoteType: check(
      "ck_sos_clinical_notes_note_type",
      sql`${t.noteType} IN ('progress_note', 'nursing_note')`,
    ),
    ckStatus: check(
      "ck_sos_clinical_notes_status",
      sql`${t.status} IN ('draft', 'signed', 'voided')`,
    ),
    ckVersion: check(
      "ck_sos_clinical_notes_version",
      sql`${t.version} > 0`,
    ),
    ckSignedConsistency: check(
      "ck_sos_clinical_notes_signed_consistency",
      sql`(${t.status} = 'signed') = (${t.signedAt} IS NOT NULL AND ${t.signedByUserId} IS NOT NULL)`,
    ),
    ckVoidConsistency: check(
      "ck_sos_clinical_notes_void_consistency",
      sql`(${t.status} = 'voided') = (${t.voidedAt} IS NOT NULL AND ${t.voidedByUserId} IS NOT NULL AND ${t.voidReason} IS NOT NULL)`,
    ),

    // Foreign keys
    fkOrgFacility: foreignKey({
      columns: [t.orgId, t.facilityId],
      foreignColumns: [sosFacilities.orgId, sosFacilities.id],
      name: "fk_sos_clinical_notes_org_facility",
    }).onDelete("restrict"),
    fkOrgPatient: foreignKey({
      columns: [t.orgId, t.patientId],
      foreignColumns: [sosPatients.orgId, sosPatients.id],
      name: "fk_sos_clinical_notes_org_patient",
    }).onDelete("restrict"),
    fkEpisode: foreignKey({
      columns: [t.episodeId],
      foreignColumns: [sosEpisodesOfCare.id],
      name: "fk_sos_clinical_notes_episode",
    }).onDelete("restrict"),
    fkAuthor: foreignKey({
      columns: [t.orgId, t.authorUserId],
      foreignColumns: [sosUserAccounts.orgId, sosUserAccounts.id],
      name: "fk_sos_clinical_notes_author",
    }).onDelete("restrict"),
    fkSignedBy: foreignKey({
      columns: [t.orgId, t.signedByUserId],
      foreignColumns: [sosUserAccounts.orgId, sosUserAccounts.id],
      name: "fk_sos_clinical_notes_signed_by",
    }).onDelete("restrict"),
    fkVoidedBy: foreignKey({
      columns: [t.orgId, t.voidedByUserId],
      foreignColumns: [sosUserAccounts.orgId, sosUserAccounts.id],
      name: "fk_sos_clinical_notes_voided_by",
    }).onDelete("restrict"),
  }),
);

export type SosClinicalNote = typeof sosClinicalNotes.$inferSelect;
export type InsertSosClinicalNote = typeof sosClinicalNotes.$inferInsert;
