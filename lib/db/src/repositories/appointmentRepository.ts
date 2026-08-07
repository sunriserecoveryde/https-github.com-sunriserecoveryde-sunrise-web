/**
 * Phase 4 — Scheduling and Appointments
 * Repository layer for sos_appointments.
 *
 * All queries are org-scoped (tenant-safe). Raw DB errors are wrapped in
 * typed application errors before leaving this module.
 */

import { db } from "../client";
import {
  sosAppointments,
  type SosAppointment,
  type InsertSosAppointment,
} from "../schema/appointments";
import { and, eq, lt, gte, lte, ne, isNull, or, not } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

// ── Appointment-specific errors ──────────────────────────────────────────────

export class AppointmentConcurrencyError extends Error {
  constructor() {
    super(
      "The appointment was modified by another request. Reload and retry.",
    );
    this.name = "AppointmentConcurrencyError";
  }
}

export class AppointmentConflictError extends Error {
  readonly conflictKind: "patient" | "staff";
  constructor(conflictKind: "patient" | "staff") {
    super(
      conflictKind === "patient"
        ? "Patient already has a scheduled appointment overlapping this time window."
        : "Assigned staff member already has a scheduled appointment overlapping this time window.",
    );
    this.name = "AppointmentConflictError";
    this.conflictKind = conflictKind;
  }
}

export class AppointmentStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentStatusError";
  }
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createAppointment(
  data: InsertSosAppointment,
): Promise<SosAppointment> {
  try {
    const rows = await db.insert(sosAppointments).values(data).returning();
    const row = rows[0];
    if (!row) throw new DatabaseError("Insert returned no rows");
    return row;
  } catch (err: unknown) {
    if (err instanceof DatabaseError) throw err;
    const cause = err as { code?: string; constraint?: string };
    if (cause?.code === "23514") {
      throw new DatabaseError("Appointment data violates a database constraint", err);
    }
    if (cause?.code === "23503") {
      throw new DatabaseError("Referenced entity not found", err);
    }
    throw new DatabaseError("Failed to create appointment", err);
  }
}

// ── Get by ID (org-scoped) ───────────────────────────────────────────────────

export async function getAppointmentById(
  id: string,
  orgId: string,
): Promise<SosAppointment | null> {
  try {
    const rows = await db
      .select()
      .from(sosAppointments)
      .where(and(eq(sosAppointments.id, id), eq(sosAppointments.orgId, orgId)))
      .limit(1);
    return rows[0] ?? null;
  } catch (err: unknown) {
    throw new DatabaseError("Failed to fetch appointment", err);
  }
}

// ── List patient appointments ────────────────────────────────────────────────

export interface ListPatientAppointmentsOptions {
  /** ISO timestamp used to split upcoming vs past. Defaults to NOW at call time. */
  pivotAt?: Date;
}

export interface PatientAppointmentList {
  upcoming: SosAppointment[];
  past: SosAppointment[];
}

export async function listPatientAppointments(
  orgId: string,
  patientId: string,
  options: ListPatientAppointmentsOptions = {},
): Promise<PatientAppointmentList> {
  const pivot = options.pivotAt ?? new Date();
  try {
    const rows = await db
      .select()
      .from(sosAppointments)
      .where(
        and(
          eq(sosAppointments.orgId, orgId),
          eq(sosAppointments.patientId, patientId),
        ),
      )
      .orderBy(sosAppointments.startsAt);

    const upcoming = rows.filter((r) => new Date(r.startsAt) >= pivot);
    const past = rows.filter((r) => new Date(r.startsAt) < pivot);
    return { upcoming, past };
  } catch (err: unknown) {
    throw new DatabaseError("Failed to list patient appointments", err);
  }
}

// ── List facility appointments (date-range) ──────────────────────────────────

export async function listFacilityAppointments(
  orgId: string,
  facilityId: string,
  from: Date,
  to: Date,
): Promise<SosAppointment[]> {
  try {
    return await db
      .select()
      .from(sosAppointments)
      .where(
        and(
          eq(sosAppointments.orgId, orgId),
          eq(sosAppointments.facilityId, facilityId),
          gte(sosAppointments.startsAt, from),
          lt(sosAppointments.startsAt, to),
        ),
      )
      .orderBy(sosAppointments.startsAt);
  } catch (err: unknown) {
    throw new DatabaseError("Failed to list facility appointments", err);
  }
}

// ── Update (optimistic concurrency) ─────────────────────────────────────────

export type AppointmentUpdateInput = Partial<
  Pick<
    SosAppointment,
    | "appointmentType"
    | "startsAt"
    | "endsAt"
    | "reason"
    | "internalNote"
    | "assignedUserId"
  >
>;

export async function updateAppointment(
  id: string,
  orgId: string,
  expectedVersion: number,
  data: AppointmentUpdateInput,
  updatedByUserId: string,
): Promise<SosAppointment> {
  try {
    const rows = await db
      .update(sosAppointments)
      .set({
        ...data,
        updatedByUserId,
        updatedAt: new Date(),
        version: expectedVersion + 1,
      })
      .where(
        and(
          eq(sosAppointments.id, id),
          eq(sosAppointments.orgId, orgId),
          eq(sosAppointments.version, expectedVersion),
          eq(sosAppointments.status, "scheduled"),
        ),
      )
      .returning();

    if (rows.length === 0) {
      // Disambiguate: was it a concurrency loss or not-found?
      const existing = await getAppointmentById(id, orgId);
      if (!existing) throw new NotFoundError("Appointment", id);
      if (existing.status === "cancelled") {
        throw new AppointmentStatusError("Cannot edit a cancelled appointment");
      }
      throw new AppointmentConcurrencyError();
    }

    return rows[0]!;
  } catch (err: unknown) {
    if (
      err instanceof NotFoundError ||
      err instanceof AppointmentConcurrencyError ||
      err instanceof AppointmentStatusError ||
      err instanceof DatabaseError
    )
      throw err;
    throw new DatabaseError("Failed to update appointment", err);
  }
}

// ── Cancel (optimistic concurrency) ─────────────────────────────────────────

export async function cancelAppointment(
  id: string,
  orgId: string,
  expectedVersion: number,
  cancelledByUserId: string,
  cancellationReason: string,
): Promise<SosAppointment> {
  const now = new Date();
  try {
    const rows = await db
      .update(sosAppointments)
      .set({
        status: "cancelled",
        cancelledByUserId,
        cancelledAt: now,
        cancellationReason,
        updatedByUserId: cancelledByUserId,
        updatedAt: now,
        version: expectedVersion + 1,
      })
      .where(
        and(
          eq(sosAppointments.id, id),
          eq(sosAppointments.orgId, orgId),
          eq(sosAppointments.version, expectedVersion),
          eq(sosAppointments.status, "scheduled"),
        ),
      )
      .returning();

    if (rows.length === 0) {
      const existing = await getAppointmentById(id, orgId);
      if (!existing) throw new NotFoundError("Appointment", id);
      if (existing.status === "cancelled") {
        throw new AppointmentStatusError("Appointment is already cancelled");
      }
      throw new AppointmentConcurrencyError();
    }

    return rows[0]!;
  } catch (err: unknown) {
    if (
      err instanceof NotFoundError ||
      err instanceof AppointmentConcurrencyError ||
      err instanceof AppointmentStatusError ||
      err instanceof DatabaseError
    )
      throw err;
    throw new DatabaseError("Failed to cancel appointment", err);
  }
}

// ── Conflict checks (partial-index queries) ──────────────────────────────────
//
// For overlap detection: two intervals [A.starts, A.ends) and [B.starts, B.ends)
// overlap iff A.starts < B.ends AND A.ends > B.starts.

export async function hasPatientOverlap(
  orgId: string,
  patientId: string,
  startsAt: Date,
  endsAt: Date,
  excludeId?: string,
): Promise<boolean> {
  try {
    const conditions = [
      eq(sosAppointments.orgId, orgId),
      eq(sosAppointments.patientId, patientId),
      eq(sosAppointments.status, "scheduled"),
      lt(sosAppointments.startsAt, endsAt),
      gte(sosAppointments.endsAt, startsAt),
    ];
    if (excludeId) conditions.push(ne(sosAppointments.id, excludeId));

    const rows = await db
      .select({ id: sosAppointments.id })
      .from(sosAppointments)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  } catch (err: unknown) {
    throw new DatabaseError("Failed to check patient appointment overlap", err);
  }
}

export async function hasStaffOverlap(
  orgId: string,
  assignedUserId: string,
  startsAt: Date,
  endsAt: Date,
  excludeId?: string,
): Promise<boolean> {
  try {
    const conditions = [
      eq(sosAppointments.orgId, orgId),
      eq(sosAppointments.assignedUserId, assignedUserId),
      eq(sosAppointments.status, "scheduled"),
      lt(sosAppointments.startsAt, endsAt),
      gte(sosAppointments.endsAt, startsAt),
    ];
    if (excludeId) conditions.push(ne(sosAppointments.id, excludeId));

    const rows = await db
      .select({ id: sosAppointments.id })
      .from(sosAppointments)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  } catch (err: unknown) {
    throw new DatabaseError("Failed to check staff appointment overlap", err);
  }
}
