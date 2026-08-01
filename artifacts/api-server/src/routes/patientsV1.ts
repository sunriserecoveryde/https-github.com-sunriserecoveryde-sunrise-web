/**
 * Phase 1A — Patient List and Patient Detail API endpoints.
 *
 * All routes are scoped to the organisation and facility provided by the
 * dev-identity middleware (Phase 1A placeholder; replaced by real auth in
 * Phase 2).  Cross-organisation access is not possible because the orgId is
 * injected server-side, never trusted from query parameters or request body.
 *
 * Routes:
 *   GET /api/v1/patients              – list patients (org + optional facility scope)
 *   GET /api/v1/patients/:id          – single patient record
 *   GET /api/v1/patients/:id/episode  – active episode for one patient
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { listPatients, getPatient, getActiveEpisode, NotFoundError, DatabaseError } from "@workspace/db";

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

const uuidParam = z.string().uuid();

function getIdentity(req: Request): { orgId: string; facilityId: string | undefined } {
  if (!req.devIdentity) {
    throw new Error("devIdentity middleware not registered");
  }
  return req.devIdentity;
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (err instanceof DatabaseError) {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

// ── GET /api/v1/patients ─────────────────────────────────────────────────────

router.get("/v1/patients", async (req: Request, res: Response) => {
  try {
    const { orgId, facilityId } = getIdentity(req);
    const patients = await listPatients(orgId, facilityId);
    res.json(patients);
  } catch (err) {
    handleError(err, res);
  }
});

// ── GET /api/v1/patients/:id ─────────────────────────────────────────────────

router.get("/v1/patients/:id", async (req: Request, res: Response) => {
  const parse = uuidParam.safeParse(req.params.id);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }
  try {
    const { orgId } = getIdentity(req);
    const patient = await getPatient(parse.data, orgId);
    res.json(patient);
  } catch (err) {
    handleError(err, res);
  }
});

// ── GET /api/v1/patients/:id/episode ────────────────────────────────────────

router.get("/v1/patients/:id/episode", async (req: Request, res: Response) => {
  const parse = uuidParam.safeParse(req.params.id);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }
  try {
    const { orgId } = getIdentity(req);
    // First verify the patient belongs to this org (returns 404 if not).
    await getPatient(parse.data, orgId);
    const episode = await getActiveEpisode(parse.data, orgId);
    if (!episode) {
      res.status(404).json({ error: "No active episode found" });
      return;
    }
    res.json(episode);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
