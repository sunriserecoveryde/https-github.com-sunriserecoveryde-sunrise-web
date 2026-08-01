/**
 * Phase 2B — Patient List, Patient Detail, and Active Episode endpoints.
 *
 * Key change from Phase 2: patient-list filtering uses scoped grants instead
 * of the flat orgWide/facilityIds model.
 *
 * Rules:
 *   - Org-wide clinical grant  → all patients in the org
 *   - Facility-scoped clinical grant (facilityWide=true) → patients in that facility
 *   - Caseload-limited grant (facilityWide=false) → explicitly assigned patients only
 *   - Multiple valid grants → exact union of independently authorized records
 *   - Frontend filter parameters are IGNORED — scope always comes from the session.
 *   - No full facility census for caseload-limited users.
 *
 * Routes:
 *   GET /api/v1/patients              – patient list for authorized grants
 *   GET /api/v1/patients/:id          – single patient record
 *   GET /api/v1/patients/:id/episode  – active episode for one patient
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  listPatients,
  listAssignedPatients,
  getPatient,
  getActiveEpisode,
  NotFoundError,
  DatabaseError,
} from "@workspace/db";
import { authorize, getAuthorizedFacilitiesForPermission } from "../lib/authorizationService";
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
  const hasAnyListGrant = auth.grants.some((g) =>
    g.permissions.includes("patient.list.view"),
  );
  if (!hasAnyListGrant) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    // Get all grants that authorize patient.list.view.
    // Each grant is evaluated independently — a permission from one grant
    // cannot inherit facility scope from another grant.
    const authorizedScopes = getAuthorizedFacilitiesForPermission(
      auth,
      "patient.list.view",
    );

    if (authorizedScopes.length === 0) {
      setPatientCacheHeaders(res);
      res.json([]);
      return;
    }

    // Query patients per grant scope, then union results.
    const patientSets = await Promise.all(
      authorizedScopes.map(({ facilityId, orgWide, facilityWide }) => {
        if (orgWide) {
          // Org-wide grant: all patients in the org.
          return listPatients(auth.orgId);
        }
        if (facilityWide && facilityId) {
          // Facility-scoped grant with full facility access: all patients in facility.
          return listPatients(auth.orgId, facilityId);
        }
        if (!facilityWide) {
          // Caseload-limited (BHT, aftercare, billing): explicitly assigned patients only.
          // No full facility census.
          return listAssignedPatients(auth.orgId, auth.userId, facilityId ?? undefined);
        }
        return Promise.resolve([]);
      }),
    );

    // Deduplicate by patient ID (multiple grants may cover overlapping patients).
    const seen = new Set<string>();
    const unique = patientSets
      .flat()
      .filter((p) => {
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
    const patient = await getPatient(patientId, auth.orgId);

    const decision = await authorize({
      identity:   auth,
      permission: "patient.chart.view",
      orgId:      auth.orgId,
      facilityId: patient.facilityId,
      patientId,
      ipAddress:  req.ip,
    });

    if (!decision.allowed) {
      // Opaque 404 — do not reveal that the patient exists in a different facility.
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
    const patient = await getPatient(patientId, auth.orgId);

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
