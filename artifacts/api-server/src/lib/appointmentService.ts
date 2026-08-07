/**
 * Phase 4 — Scheduling and Appointments
 * Service layer for sos_appointments.
 *
 * Enforces:
 *  - Patient authorization (via authorize() from authorizationService)
 *  - Permission checks per operation
 *  - Ownership constraints (edit/cancel own vs. supervisor override)
 *  - Conflict detection (patient and staff time-overlap)
 *  - Past-appointment rejection
 *  - Assigned-user validation (must hold scheduling-eligible role at facility)
 *  - internal_note visibility (creator and clinical_supervisor only)
 *  - Optimistic concurrency (version-based updates in repository)
 *  - Transactional audit events (appointment_created/updated/cancelled)
 *
 * Authorization rules (Phase 4 approved matrix):
 *  - appointment.create                — clinical_supervisor, certified_clinician,
 *                                        mh_therapist, prescriber, nursing
 *  - appointment.view                  — same + bht, aftercare_staff
 *  - appointment.edit                  — clinical_supervisor (any); others (own only)
 *  - appointment.cancel                — clinical_supervisor (any); others (own only)
 *  - appointment.view_facility_schedule — all scheduling roles
 *
 * NOTE: Appointment content MUST NOT appear in audit metadata.
 */

import { db } from "@workspace/db";
import {
  sosAppointments,
  sosAuthAudit,
  sosRoleAssignments,
  type SosAppointment,
} from "@workspace/db";
import {
  getAppointmentById,
  listPatientAppointments,
  listFacilityAppointments,
  updateAppointment as repoUpdate,
  cancelAppointment as repoCancel,
  hasPatientOverlap,
  hasStaffOverlap,
  AppointmentConflictError,
  AppointmentConcurrencyError,
  AppointmentStatusError,
  type AppointmentUpdateInput,
  type PatientAppointmentList,
} from "@workspace/db";
import { getPatient, getFacility } from "@workspace/db";
import { and, eq, or, isNull, gte, lte } from "drizzle-orm";
import { facilityDayToUtcBoundaries } from "./timezoneUtils";
import {
  authorize,
  type AuthenticatedIdentity,
} from "./authorizationService";
import type { PermissionCode } from "./permissionPolicy";
import type { Request } from "express";
import { logger } from "./logger";

// Re-export repo errors for route-handler use
export {
  AppointmentConflictError,
  AppointmentConcurrencyError,
  AppointmentStatusError,
};

// ── Auth context ─────────────────────────────────────────────────────────────

interface AuthContext {
  identity: AuthenticatedIdentity;
  req: Request;
}

// ── Service errors ────────────────────────────────────────────────────────────

export class AppointmentOwnershipError extends Error {
  constructor() {
    super("You can only edit or cancel appointments you created.");
    this.name = "AppointmentOwnershipError";
  }
}

export class AppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentValidationError";
  }
}

// ── Scheduling-eligible roles (for assigned-user validation) ─────────────────
// Roles that hold appointment.create permission. Must stay in sync with permissionPolicy.ts.

const SCHEDULING_ELIGIBLE_ROLES = new Set([
  "clinical_supervisor",
  "certified_clinician",
  "mh_therapist",
  "prescriber",
  "nursing",
]);

// ── Transactional audit writer ────────────────────────────────────────────────

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function writeAuditTx(
  tx: DbTx,
  orgId: string,
  userId: string,
  eventType: "appointment.created" | "appointment.updated" | "appointment.cancelled",
  req: Request,
  appointmentId: string,
): Promise<void> {
  await tx.insert(sosAuthAudit).values({
    orgId,
    userId,
    eventType,
    ipAddress: req.ip ?? undefined,
    metadata: { appointmentId },
  });
}

// ── internal_note redaction ───────────────────────────────────────────────────
// Per Phase 4 decision: internal_note is visible only to the appointment creator
// and to clinical_supervisor roles. All other callers receive null.

function redactInternalNote(
  apt: SosAppointment,
  identity: AuthenticatedIdentity,
): SosAppointment {
  if (apt.internalNote === null) return apt;

  const isSupervisor = identity.grants.some(
    (g) => g.roleId === "clinical_supervisor",
  );
  const isCreator = apt.createdByUserId === identity.userId;

  if (isSupervisor || isCreator) return apt;

  return { ...apt, internalNote: null };
}

// ── Patient authorization ──────────────────────────────────────────────────────

async function authorizePatientAccess(
  ctx: AuthContext,
  patientId: string,
  orgId: string,
  permission: PermissionCode,
): Promise<{ facilityId: string }> {
  const patient = await getPatient(patientId, orgId);
  if (!patient) {
    // Audit denial
    await db.insert(sosAuthAudit).values({
      orgId,
      userId: ctx.identity.userId,
      eventType: "authorization_denied",
      ipAddress: ctx.req.ip ?? undefined,
      metadata: { reason: "patient_not_found", patientId },
    });
    throw Object.assign(new Error("Patient not found"), { name: "NotFoundError" });
  }

  const decision = await authorize({
    identity:   ctx.identity,
    permission,
    orgId,
    facilityId: patient.facilityId,
    patientId:  patient.id,
    ipAddress:  ctx.req.ip,
  });

  if (!decision.allowed) {
    throw Object.assign(new Error("Access denied"), { name: "AccessDeniedError" });
  }

  return { facilityId: patient.facilityId };
}

// ── Assigned user validation ──────────────────────────────────────────────────

async function validateAssignedUser(
  orgId: string,
  assignedUserId: string,
  facilityId: string,
): Promise<void> {
  // The assigned user must hold at least one active scheduling-eligible role at the facility.
  const now = new Date();
  const rows = await db
    .select({ roleId: sosRoleAssignments.roleId })
    .from(sosRoleAssignments)
    .where(
      and(
        eq(sosRoleAssignments.orgId, orgId),
        eq(sosRoleAssignments.userId, assignedUserId),
        eq(sosRoleAssignments.status, "active"),
        // §5 contract: assignment must explicitly name the selected facility.
        // An org-wide role (facility_id IS NULL) does NOT qualify for appointment assignment.
        eq(sosRoleAssignments.facilityId, facilityId),
        // effectiveAt must be in the past (assignment has started)
        lte(sosRoleAssignments.effectiveAt, now),
        // expiresAt must be null or in the future (assignment hasn't expired)
        or(
          isNull(sosRoleAssignments.expiresAt),
          gte(sosRoleAssignments.expiresAt, now),
        ),
      ),
    )
    .limit(10);

  const hasEligibleRole = rows.some((r) =>
    SCHEDULING_ELIGIBLE_ROLES.has(r.roleId),
  );

  if (!hasEligibleRole) {
    throw new AppointmentValidationError(
      "The assigned user does not hold an active scheduling-eligible role at this facility.",
    );
  }
}

// ── Create ───────────────────────────────────────────────────────────────────

export interface CreateAppointmentInput {
  patientId: string;
  facilityId?: string; // if omitted, derived from patient record
  assignedUserId: string;
  appointmentType: string;
  startsAt: string; // ISO 8601 with offset
  endsAt: string;   // ISO 8601 with offset
  reason: string;
  internalNote?: string | null;
}

export async function createAppointmentService(
  ctx: AuthContext,
  orgId: string,
  input: CreateAppointmentInput,
): Promise<SosAppointment> {
  const { identity, req } = ctx;

  // 1. Patient access + appointment.create permission (also derives facilityId)
  const { facilityId: patientFacilityId } = await authorizePatientAccess(
    ctx, input.patientId, orgId, "appointment.create",
  );
  const facilityId = input.facilityId ?? patientFacilityId;

  // 2. Time validation — reject past starts_at
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    throw new AppointmentValidationError("starts_at and ends_at must be valid ISO 8601 timestamps");
  }
  if (startsAt <= new Date()) {
    throw new AppointmentValidationError("starts_at must be in the future");
  }
  if (endsAt <= startsAt) {
    throw new AppointmentValidationError("ends_at must be after starts_at");
  }

  // 3. Assigned user must be scheduling-eligible at facility
  await validateAssignedUser(orgId, input.assignedUserId, facilityId);

  // 4. Conflict detection
  if (await hasPatientOverlap(orgId, input.patientId, startsAt, endsAt)) {
    throw new AppointmentConflictError("patient");
  }
  if (await hasStaffOverlap(orgId, input.assignedUserId, startsAt, endsAt)) {
    throw new AppointmentConflictError("staff");
  }

  // 5. Insert + audit (transactional)
  const apt = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(sosAppointments)
      .values({
        orgId,
        facilityId,
        patientId:       input.patientId,
        assignedUserId:  input.assignedUserId,
        appointmentType: input.appointmentType,
        status:          "scheduled",
        startsAt,
        endsAt,
        reason:          input.reason,
        internalNote:    input.internalNote ?? null,
        createdByUserId: identity.userId,
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Insert returned no rows");

    await writeAuditTx(tx, orgId, identity.userId, "appointment.created", req, row.id);
    return row;
  });

  return redactInternalNote(apt, identity);
}

// ── Get ───────────────────────────────────────────────────────────────────────

export async function getAppointmentService(
  ctx: AuthContext,
  orgId: string,
  appointmentId: string,
): Promise<SosAppointment> {
  const { identity } = ctx;

  const apt = await getAppointmentById(appointmentId, orgId);
  if (!apt) throw Object.assign(new Error("Appointment not found"), { name: "NotFoundError" });

  // Check patient access
  await authorizePatientAccess(ctx, apt.patientId, orgId, "appointment.view");

  return redactInternalNote(apt, identity);
}

// ── List patient appointments ─────────────────────────────────────────────────

export async function listPatientAppointmentsService(
  ctx: AuthContext,
  orgId: string,
  patientId: string,
): Promise<PatientAppointmentList> {
  const { identity } = ctx;

  await authorizePatientAccess(ctx, patientId, orgId, "appointment.view");

  const list = await listPatientAppointments(orgId, patientId);

  return {
    upcoming: list.upcoming.map((a) => redactInternalNote(a, identity)),
    past:     list.past.map((a) => redactInternalNote(a, identity)),
  };
}

// ── List facility appointments (schedule view) ───────────────────────────────

/**
 * Result shape for the facility schedule endpoint.
 * Includes the facility's IANA timezone so the UI can display local times
 * without relying on the browser's implicit timezone.
 */
export interface FacilityScheduleResult {
  appointments:    SosAppointment[];
  facilityTimezone: string;
}

export async function listFacilityAppointmentsService(
  ctx: AuthContext,
  orgId: string,
  facilityId: string,
  date: string, // YYYY-MM-DD — interpreted in the facility's IANA timezone
): Promise<FacilityScheduleResult> {
  const { identity } = ctx;

  // Permission check: appointment.view_facility_schedule at this facility
  const decision = await authorize({
    identity,
    permission: "appointment.view_facility_schedule",
    orgId,
    facilityId,
    ipAddress: ctx.req.ip,
  });
  if (!decision.allowed) {
    throw Object.assign(new Error("Access denied"), { name: "AccessDeniedError" });
  }

  // Load facility to obtain its authoritative IANA timezone
  const facility = await getFacility(facilityId, orgId);
  const facilityTimezone = facility.timeZone; // e.g. "America/New_York"

  // Convert the facility-local calendar day to UTC [from, to) boundaries.
  // Uses the facility's timezone — never UTC or browser-local.
  const { from, to } = facilityDayToUtcBoundaries(date, facilityTimezone);

  const apts = await listFacilityAppointments(orgId, facilityId, from, to);

  // Per-row patient access filter for non-facilityWide roles (bht, aftercare_staff)
  const filtered: SosAppointment[] = [];
  for (const apt of apts) {
    const patientDecision = await authorize({
      identity,
      permission: "appointment.view",
      orgId,
      facilityId: apt.facilityId,
      patientId:  apt.patientId,
      ipAddress:  ctx.req.ip,
    });
    if (patientDecision.allowed) {
      filtered.push(redactInternalNote(apt, identity));
    }
  }

  return { appointments: filtered, facilityTimezone };
}

// ── Edit ──────────────────────────────────────────────────────────────────────

export interface EditAppointmentInput {
  version:         number;
  appointmentType?: string;
  startsAt?:       string;
  endsAt?:         string;
  reason?:         string;
  internalNote?:   string | null;
  assignedUserId?: string;
}

export async function editAppointmentService(
  ctx: AuthContext,
  orgId: string,
  appointmentId: string,
  input: EditAppointmentInput,
): Promise<SosAppointment> {
  const { identity, req } = ctx;

  const apt = await getAppointmentById(appointmentId, orgId);
  if (!apt) throw Object.assign(new Error("Appointment not found"), { name: "NotFoundError" });

  // Patient access + appointment.edit permission
  await authorizePatientAccess(ctx, apt.patientId, orgId, "appointment.edit");

  // Ownership: non-supervisor roles can only edit their own appointments
  const isSupervisor = identity.grants.some(
    (g) => g.roleId === "clinical_supervisor",
  );
  if (!isSupervisor && apt.createdByUserId !== identity.userId) {
    throw new AppointmentOwnershipError();
  }

  // Time validation if times are being changed
  const effectiveStartsAt = input.startsAt ? new Date(input.startsAt) : new Date(apt.startsAt);
  const effectiveEndsAt   = input.endsAt   ? new Date(input.endsAt)   : new Date(apt.endsAt);

  let startsAt: Date | undefined;
  let endsAt: Date | undefined;

  if (input.startsAt !== undefined) {
    startsAt = new Date(input.startsAt);
    if (isNaN(startsAt.getTime())) {
      throw new AppointmentValidationError("starts_at must be a valid ISO 8601 timestamp");
    }
    if (startsAt <= new Date()) {
      throw new AppointmentValidationError("starts_at must be in the future");
    }
  }
  if (input.endsAt !== undefined) {
    endsAt = new Date(input.endsAt);
    if (isNaN(endsAt.getTime())) {
      throw new AppointmentValidationError("ends_at must be a valid ISO 8601 timestamp");
    }
  }
  if (effectiveEndsAt <= effectiveStartsAt) {
    throw new AppointmentValidationError("ends_at must be after starts_at");
  }

  // Assigned user validation if changing assigned user
  const effectiveAssignedUserId = input.assignedUserId ?? apt.assignedUserId;
  if (input.assignedUserId !== undefined) {
    await validateAssignedUser(orgId, input.assignedUserId, apt.facilityId);
  }

  // Conflict detection using effective times
  const checkStart = startsAt ?? new Date(apt.startsAt);
  const checkEnd   = endsAt   ?? new Date(apt.endsAt);
  if (await hasPatientOverlap(orgId, apt.patientId, checkStart, checkEnd, appointmentId)) {
    throw new AppointmentConflictError("patient");
  }
  if (await hasStaffOverlap(orgId, effectiveAssignedUserId, checkStart, checkEnd, appointmentId)) {
    throw new AppointmentConflictError("staff");
  }

  const updateData: AppointmentUpdateInput = {};
  if (input.appointmentType !== undefined) updateData.appointmentType = input.appointmentType;
  if (startsAt !== undefined)              updateData.startsAt        = startsAt;
  if (endsAt !== undefined)                updateData.endsAt          = endsAt;
  if (input.reason !== undefined)          updateData.reason          = input.reason;
  if ("internalNote" in input)             updateData.internalNote    = input.internalNote ?? null;
  if (input.assignedUserId !== undefined)  updateData.assignedUserId  = input.assignedUserId;

  const updated = await db.transaction(async (tx) => {
    const result = await repoUpdate(
      appointmentId, orgId, input.version, updateData, identity.userId,
    );
    await writeAuditTx(tx, orgId, identity.userId, "appointment.updated", req, appointmentId);
    return result;
  });

  return redactInternalNote(updated, identity);
}

// ── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelAppointmentService(
  ctx: AuthContext,
  orgId: string,
  appointmentId: string,
  version: number,
  cancellationReason: string,
): Promise<SosAppointment> {
  const { identity, req } = ctx;

  const apt = await getAppointmentById(appointmentId, orgId);
  if (!apt) throw Object.assign(new Error("Appointment not found"), { name: "NotFoundError" });

  // Patient access + appointment.cancel permission
  await authorizePatientAccess(ctx, apt.patientId, orgId, "appointment.cancel");

  // Ownership: non-supervisor roles can only cancel their own appointments
  const isSupervisor = identity.grants.some(
    (g) => g.roleId === "clinical_supervisor",
  );
  if (!isSupervisor && apt.createdByUserId !== identity.userId) {
    throw new AppointmentOwnershipError();
  }

  const cancelled = await db.transaction(async (tx) => {
    const result = await repoCancel(
      appointmentId, orgId, version, identity.userId, cancellationReason,
    );
    await writeAuditTx(tx, orgId, identity.userId, "appointment.cancelled", req, appointmentId);
    return result;
  });

  return redactInternalNote(cancelled, identity);
}
