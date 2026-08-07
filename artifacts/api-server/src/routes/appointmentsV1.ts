/**
 * Phase 4 — Scheduling and Appointments
 * Express router for appointment endpoints.
 *
 * Endpoints:
 *   POST   /api/v1/patients/:patientId/appointments        — create
 *   GET    /api/v1/patients/:patientId/appointments        — list patient appointments
 *   GET    /api/v1/appointments/:id                        — get single appointment
 *   PATCH  /api/v1/appointments/:id                        — edit (optimistic concurrency)
 *   POST   /api/v1/appointments/:id/cancel                 — cancel
 *   GET    /api/v1/facilities/:facilityId/appointments     — facility schedule (date param)
 *
 * Pattern reference: clinicalNotesV1.ts
 */

import { Router, Request, Response } from "express";
import { z } from "zod/v4";
import {
  createAppointmentService,
  getAppointmentService,
  listPatientAppointmentsService,
  listFacilityAppointmentsService,
  editAppointmentService,
  cancelAppointmentService,
  AppointmentOwnershipError,
  AppointmentValidationError,
  AppointmentConflictError,
  AppointmentConcurrencyError,
  AppointmentStatusError,
  type FacilityScheduleResult,
} from "../lib/appointmentService";
import { logger } from "../lib/logger";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = [
  "individual_therapy",
  "medication_management",
  "intake",
  "follow_up",
  "other",
] as const;

// ISO 8601 datetime with mandatory timezone offset
const isoDatetimeWithOffset = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Must be ISO 8601 datetime with explicit timezone offset",
  );

function parseUuid(val: unknown): string | null {
  const r = z.string().uuid().safeParse(val);
  return r.success ? r.data : null;
}

function mapError(err: unknown, res: Response): void {
  if (err instanceof AppointmentValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof AppointmentConflictError) {
    res.status(409).json({ error: err.message, conflictKind: err.conflictKind });
    return;
  }
  if (err instanceof AppointmentOwnershipError) {
    res.status(403).json({ error: err.message });
    return;
  }
  if (err instanceof AppointmentStatusError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof AppointmentConcurrencyError) {
    res.status(409).json({ error: err.message });
    return;
  }
  const anyErr = err as { name?: string; status?: number };
  if (anyErr?.name === "NotFoundError" || anyErr?.name === "AccessDeniedError") {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  if (anyErr?.name === "AuthorizationError") {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (anyErr?.status === 401) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  logger.error({ err }, "Unhandled appointment route error");
  res.status(500).json({ error: "Internal server error" });
}

// ── POST /api/v1/patients/:patientId/appointments ────────────────────────────

const createBodySchema = z.object({
  facilityId:       z.string().uuid().optional(), // if omitted, derived from patient server-side
  assignedUserId:   z.string().uuid(),
  appointmentType:  z.enum(APPOINTMENT_TYPES),
  startsAt:         isoDatetimeWithOffset,
  endsAt:           isoDatetimeWithOffset,
  reason:           z.string().min(1).max(1000),
  internalNote:     z.string().max(2000).nullable().optional(),
});

router.post(
  "/v1/patients/:patientId/appointments",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const patientId = parseUuid(req.params["patientId"]);
    if (!patientId) { res.status(400).json({ error: "Invalid patientId" }); return; }

    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    try {
      const apt = await createAppointmentService(
        { identity: auth, req },
        auth.orgId,
        { patientId, ...parsed.data },
      );
      res.status(201).json({ appointment: apt });
    } catch (err) {
      mapError(err, res);
    }
  },
);

// ── GET /api/v1/patients/:patientId/appointments ─────────────────────────────

router.get(
  "/v1/patients/:patientId/appointments",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const patientId = parseUuid(req.params["patientId"]);
    if (!patientId) { res.status(400).json({ error: "Invalid patientId" }); return; }

    try {
      const list = await listPatientAppointmentsService(
        { identity: auth, req },
        auth.orgId,
        patientId,
      );
      res.json({ appointments: list });
    } catch (err) {
      mapError(err, res);
    }
  },
);

// ── GET /api/v1/appointments/:id ──────────────────────────────────────────────

router.get(
  "/v1/appointments/:id",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const id = parseUuid(req.params["id"]);
    if (!id) { res.status(400).json({ error: "Invalid appointment id" }); return; }

    try {
      const apt = await getAppointmentService({ identity: auth, req }, auth.orgId, id);
      res.json({ appointment: apt });
    } catch (err) {
      mapError(err, res);
    }
  },
);

// ── PATCH /api/v1/appointments/:id ───────────────────────────────────────────

const editBodySchema = z.object({
  version:         z.number().int().min(1),
  appointmentType: z.enum(APPOINTMENT_TYPES).optional(),
  startsAt:        isoDatetimeWithOffset.optional(),
  endsAt:          isoDatetimeWithOffset.optional(),
  reason:          z.string().min(1).max(1000).optional(),
  internalNote:    z.string().max(2000).nullable().optional(),
  assignedUserId:  z.string().uuid().optional(),
});

router.patch(
  "/v1/appointments/:id",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const id = parseUuid(req.params["id"]);
    if (!id) { res.status(400).json({ error: "Invalid appointment id" }); return; }

    const parsed = editBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    try {
      const apt = await editAppointmentService(
        { identity: auth, req },
        auth.orgId,
        id,
        parsed.data,
      );
      res.json({ appointment: apt });
    } catch (err) {
      mapError(err, res);
    }
  },
);

// ── POST /api/v1/appointments/:id/cancel ─────────────────────────────────────

const cancelBodySchema = z.object({
  version:            z.number().int().min(1),
  cancellationReason: z.string().min(1).max(1000),
});

router.post(
  "/v1/appointments/:id/cancel",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const id = parseUuid(req.params["id"]);
    if (!id) { res.status(400).json({ error: "Invalid appointment id" }); return; }

    const parsed = cancelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    try {
      const apt = await cancelAppointmentService(
        { identity: auth, req },
        auth.orgId,
        id,
        parsed.data.version,
        parsed.data.cancellationReason,
      );
      res.json({ appointment: apt });
    } catch (err) {
      mapError(err, res);
    }
  },
);

// ── GET /api/v1/facilities/:facilityId/appointments ──────────────────────────

const facilityScheduleQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

router.get(
  "/v1/facilities/:facilityId/appointments",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) { res.status(401).json({ error: "Not authenticated" }); return; }

    const facilityId = parseUuid(req.params["facilityId"]);
    if (!facilityId) { res.status(400).json({ error: "Invalid facilityId" }); return; }

    const parsed = facilityScheduleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsed.error.issues });
      return;
    }

    try {
      const result: FacilityScheduleResult = await listFacilityAppointmentsService(
        { identity: auth, req },
        auth.orgId,
        facilityId,
        parsed.data.date,
      );
      // facilityTimezone is included so the UI can format times without
      // relying on the browser's implicit timezone (Phase 4 contract §2).
      res.json({
        appointments:    result.appointments,
        facilityTimezone: result.facilityTimezone,
      });
    } catch (err) {
      mapError(err, res);
    }
  },
);

export default router;
