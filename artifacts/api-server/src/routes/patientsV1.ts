/**
 * Phase 2 — Patient List, Patient Detail, and Active Episode endpoints.
 *
 * Identity is resolved from the real session (req.auth) set by sessionAuthMiddleware.
 * All three endpoints use the central authorizationService to enforce:
 *   - Org scope (always from the session, never from the browser)
 *   - Facility scope (from role assignments in sos_role_assignments)
 *   - Patient access (facility-wide roles or explicit sos_patient_access row)
 *
 * Opaque 404 is returned for cross-org and cross-facility access to prevent
 * leaking the existence of records the caller has no right to see.
 *
 * Routes:
 *   GET /api/v1/patients              – list patients for authorized facilities
 *   GET /api/v1/patients/:id          – single patient record
 *   GET /api/v1/patients/:id/episode  – active episode for one patient
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  listPatients,
  getPatient,
  getActiveEpisode,
  NotFoundError,
  DatabaseError,
} from "@workspace/db";
import { authorize } from "../lib/authorizationService";
import { logger } from "../lib/logger";

const router = Router();

// ── helpers ───────────────────────────────────────────────────────────────────

const uuidParam = z.string().uuid();

function handleDbError(err: unknown, res: Response): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (err instanceof DatabaseError) {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }
  logger.error({ err }, "patientsV1: unexpected error");
  res.status(500).json({ error: "Internal server error" });
}

// Private, no-store cache headers for all patient responses (spec §19).
function setPatientCacheHeaders(res: Response): void {
  res.set("Cache-Control", "private, no-store");
  res.set("Pragma", "no-cache");
}

// ── GET /api/v1/patients ─────────────────────────────────────────────────────

router.get("/v1/patients", async (req: Request, res: Response) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Check list permission first (cheap — no DB call needed).
  const decision = await authorize({
    identity:   auth,
    permission: "patient.list.view",
    orgId:      auth.orgId,
    ipAddress:  req.ip,
  });
  if (!decision.allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    let patients: Awaited<ReturnType<typeof listPatients>>;

    if (auth.orgWide) {
      // Org-wide roles (facilityId=null assignments) can see the entire org census.
      // listPatients(orgId, undefined) returns all patients in the org.
      patients = await listPatients(auth.orgId);
    } else {
      // Facility-scoped users: query per assigned facility and merge.
      // The browser does NOT supply a facility filter — it comes from the session.
      const facilityIds = auth.facilityIds;

      if (facilityIds.length === 0) {
        // No authorized facilities and not org-wide — no patients to return.
        setPatientCacheHeaders(res);
        res.json([]);
        return;
      }

      const patientArrays = await Promise.all(
        facilityIds.map((fId) => listPatients(auth.orgId, fId)),
      );
      patients = patientArrays.flat();
    }

    // Deduplicate by patient ID (edge case: multiple facility assignments).
    const seen = new Set<string>();
    const unique = patients.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    setPatientCacheHeaders(res);
    res.json(unique);
  } catch (err) {
    handleDbError(err, res);
  }
});

// ── GET /api/v1/patients/:id ─────────────────────────────────────────────────

router.get("/v1/patients/:id", async (req: Request, res: Response) => {
  const parse = uuidParam.safeParse(req.params.id);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }

  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const patientId = parse.data;

  try {
    // Fetch patient first to get facilityId for scope check.
    // Returns 404 for cross-org (getPatient checks org_id).
    const patient = await getPatient(patientId, auth.orgId);

    // Authorize with facility and patient scope.
    const decision = await authorize({
      identity:   auth,
      permission: "patient.chart.view",
      orgId:      auth.orgId,
      facilityId: patient.facilityId,
      patientId,
      ipAddress:  req.ip,
    });

    if (!decision.allowed) {
      // Opaque 404 — do not reveal the patient exists but the caller cannot see it.
      res.status(404).json({ error: "Not found" });
      return;
    }

    setPatientCacheHeaders(res);
    res.json(patient);
  } catch (err) {
    handleDbError(err, res);
  }
});

// ── GET /api/v1/patients/:id/episode ─────────────────────────────────────────

router.get("/v1/patients/:id/episode", async (req: Request, res: Response) => {
  const parse = uuidParam.safeParse(req.params.id);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }

  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const patientId = parse.data;

  try {
    // Patient must exist in the org.
    const patient = await getPatient(patientId, auth.orgId);

    // Authorize episode access.
    const decision = await authorize({
      identity:   auth,
      permission: "patient.episode.view",
      orgId:      auth.orgId,
      facilityId: patient.facilityId,
      patientId,
      ipAddress:  req.ip,
    });

    if (!decision.allowed) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const episode = await getActiveEpisode(patientId, auth.orgId);
    if (!episode) {
      res.status(404).json({ error: "No active episode found" });
      return;
    }

    setPatientCacheHeaders(res);
    res.json(episode);
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
