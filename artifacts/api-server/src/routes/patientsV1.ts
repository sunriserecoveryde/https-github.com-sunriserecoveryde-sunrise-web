/**
 * Phase 2C — Patient List, Patient Detail, and Active Episode endpoints.
 * §1: Field-level DTO projection applied — response shape depends on permissions.
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
  type PatientQueryTier,
} from "@workspace/db";
import { authorize, getAuthorizedFacilitiesForPermission } from "../lib/authorizationService";
import { projectPatient, buildPatientPermissionSet } from "../lib/patientDTOs";
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

    // §1 (Phase 2C): DB query tier = maximum across all grants so data is always
    // available for any projection tier.  Per-patient response projection uses
    // only the permissions from grants that actually authorised each patient,
    // preventing higher-tier fields from leaking to patients accessible only
    // via a lower-tier grant (mixed-role / mixed-scope users).
    const globalPermSet = buildPatientPermissionSet(auth.grants.map((g) => g.permissions));
    const dbTier: PatientQueryTier = globalPermSet.has("patient.chart.view")
      ? "chart"
      : globalPermSet.has("patient.episode.view")
      ? "episode"
      : globalPermSet.has("patient.demographics.view")
      ? "demographics"
      : "identity";

    // Query each grant scope in parallel; tag results with the authorising grant.
    const scopeResults = await Promise.all(
      authorizedScopes.map(async ({ facilityId, orgWide, facilityWide, grant }) => {
        let patients: import("@workspace/db").PatientWithEpisode[];
        if (orgWide) {
          patients = await listPatients(auth.orgId, undefined, dbTier);
        } else if (facilityWide && facilityId) {
          patients = await listPatients(auth.orgId, facilityId, dbTier);
        } else if (!facilityWide) {
          // §6 exact-binding: caseload-limited scope restricts to the exact presenting
          // grant's roleAssignmentId so that patients bound to another assignment are
          // not surfaced for this grant.
          patients = await listAssignedPatients(
            auth.orgId, auth.userId, facilityId ?? undefined, dbTier,
            grant.roleAssignmentId,
          );
        } else {
          patients = [];
        }
        return { patients, grant };
      }),
    );

    // Build per-patient data map and per-patient authorising-grant permission set.
    // When the same patient is authorised by multiple grants (overlapping scopes),
    // the patient data is kept at the highest-tier version already stored, and
    // permissions from all authorising grants are unioned.  This ensures that a
    // patient reachable via a high-tier grant gets projected at the high tier,
    // while a patient reachable ONLY via a low-tier grant is projected at that
    // lower tier — never inheriting fields from an unrelated grant.
    type PermCode = typeof auth.grants[number]["permissions"][number];
    const patientDataMap  = new Map<string, (typeof scopeResults[number]["patients"])[number]>();
    const patientPermMap  = new Map<string, Set<PermCode>>();

    for (const { patients, grant } of scopeResults) {
      for (const patient of patients) {
        if (!patientDataMap.has(patient.id)) {
          patientDataMap.set(patient.id, patient);
        }
        if (!patientPermMap.has(patient.id)) {
          patientPermMap.set(patient.id, new Set<PermCode>());
        }
        for (const perm of grant.permissions) {
          patientPermMap.get(patient.id)!.add(perm);
        }
      }
    }

    // §1: Project each patient using only the permissions from grants that
    // actually authorised that patient.
    const projected = Array.from(patientDataMap.values()).map((patient) => {
      const effectivePerms = patientPermMap.get(patient.id) ?? new Set<PermCode>();
      return projectPatient(patient, effectivePerms as ReadonlySet<PermCode>);
    });

    setPatientCacheHeaders(res);
    res.json(projected);
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
