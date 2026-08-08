/**
 * Phase 4 — Scheduling and Appointments
 *
 * Defines sos_appointments: staff-created patient appointments.
 *
 * Approved statuses (Phase 4): scheduled, cancelled.
 * Approved appointment types: individual_therapy, medication_management,
 *   intake, follow_up, other.
 *
 * Cancellation is irreversible. Appointments are never hard-deleted.
 * All timestamps are TIMESTAMPTZ (UTC). Facility timezone is used at
 * the application layer for display and day-boundary queries.
 */

import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sosOrganizations } from "./sunrise-os";
import { sosFacilities } from "./sunrise-os";
import { sosPatients } from "./sunrise-os";
import { sosUserAccounts } from "./auth-tables";

// ── Appointment type union (Phase 4 approved set) ────────────────────────────
export const APPOINTMENT_TYPES = [
  "individual_therapy",
  "medication_management",
  "intake",
  "follow_up",
  "other",
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

// ── Appointment status union (Phase 4 approved set) ──────────────────────────
export const APPOINTMENT_STATUSES = ["scheduled", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// ── sos_appointments ─────────────────────────────────────────────────────────
export const sosAppointments = pgTable(
  "sos_appointments",
  {
    id:                 uuid("id").primaryKey().defaultRandom(),
    orgId:              uuid("org_id").notNull()
                          .references(() => sosOrganizations.id, { onDelete: "cascade" }),
    facilityId:         uuid("facility_id").notNull(),
    patientId:          uuid("patient_id").notNull(),
    assignedUserId:     uuid("assigned_user_id").notNull(),
    appointmentType:    text("appointment_type").notNull(),
    status:             text("status").notNull().default("scheduled"),
    startsAt:           timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt:             timestamp("ends_at", { withTimezone: true }).notNull(),
    reason:             text("reason").notNull(),
    internalNote:       text("internal_note"),
    createdByUserId:    uuid("created_by_user_id").notNull(),
    createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId:    uuid("updated_by_user_id"),
    updatedAt:          timestamp("updated_at", { withTimezone: true }),
    cancelledByUserId:  uuid("cancelled_by_user_id"),
    cancelledAt:        timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    version:            integer("version").notNull().default(1),
  },
  (t) => [
    // Composite FK — tenant-safe facility
    foreignKey({
      columns:            [t.orgId, t.facilityId],
      foreignColumns:     [sosFacilities.orgId, sosFacilities.id],
      name:               "fk_apt_org_facility",
    }).onDelete("restrict"),

    // Composite FK — tenant-safe patient
    foreignKey({
      columns:            [t.orgId, t.patientId],
      foreignColumns:     [sosPatients.orgId, sosPatients.id],
      name:               "fk_apt_org_patient",
    }).onDelete("restrict"),

    // Composite FK — assigned user (tenant-safe)
    foreignKey({
      columns:            [t.orgId, t.assignedUserId],
      foreignColumns:     [sosUserAccounts.orgId, sosUserAccounts.id],
      name:               "fk_apt_assigned_user",
    }).onDelete("restrict"),

    // Composite FK — creator (tenant-safe)
    foreignKey({
      columns:            [t.orgId, t.createdByUserId],
      foreignColumns:     [sosUserAccounts.orgId, sosUserAccounts.id],
      name:               "fk_apt_created_by",
    }).onDelete("restrict"),

    // Conflict-check indexes (partial — exclude cancelled)
    // Patient time overlap query
    index("idx_apt_patient_time").on(t.orgId, t.patientId, t.startsAt, t.endsAt),
    // Staff time overlap query
    index("idx_apt_staff_time").on(t.orgId, t.assignedUserId, t.startsAt, t.endsAt),
    // Facility schedule query (date-range list)
    index("idx_apt_facility_time").on(t.orgId, t.facilityId, t.startsAt),
    // Patient appointment history
    index("idx_apt_patient_history").on(t.orgId, t.patientId, t.startsAt),
  ],
);

export type SosAppointment = typeof sosAppointments.$inferSelect;
export type InsertSosAppointment = typeof sosAppointments.$inferInsert;
