import { Router } from "express";

// ─── In-memory compliance audit state store ────────────────────────────────────
// Keyed by orgId (defaults to "default" for the demo environment).
// Intentionally in-process — no DB setup required. A server restart resets the
// store, but the frontend also mirrors to localStorage so a restart is not a
// data-loss event for the officer: the next PUT re-hydrates the server copy.

export interface ComplianceAuditState {
  completedIds: string[];
  evidenceInputs: Record<string, string>;
  corrActionInputs: Record<string, string>;
  ownerInputs: Record<string, string>;
  updatedAt: string;
}

const DEFAULT_STATE: ComplianceAuditState = {
  completedIds: [],
  evidenceInputs: {},
  corrActionInputs: {},
  ownerInputs: {},
  updatedAt: new Date().toISOString(),
};

// One entry per org — demo uses "default"
const store: Record<string, ComplianceAuditState> = {};

const router = Router();

// GET /api/compliance/audit-state?orgId=default
router.get("/compliance/audit-state", (req, res) => {
  const orgId = String(req.query["orgId"] ?? "default");
  res.json(store[orgId] ?? DEFAULT_STATE);
});

// PUT /api/compliance/audit-state?orgId=default
// Body: { completedIds, evidenceInputs, corrActionInputs, ownerInputs }
router.put("/compliance/audit-state", (req, res) => {
  const orgId = String(req.query["orgId"] ?? "default");
  const body = req.body as Partial<ComplianceAuditState>;

  const prev = store[orgId] ?? DEFAULT_STATE;
  store[orgId] = {
    completedIds:    Array.isArray(body.completedIds)           ? body.completedIds    : prev.completedIds,
    evidenceInputs:  body.evidenceInputs  && typeof body.evidenceInputs  === "object" ? body.evidenceInputs  : prev.evidenceInputs,
    corrActionInputs:body.corrActionInputs && typeof body.corrActionInputs=== "object" ? body.corrActionInputs: prev.corrActionInputs,
    ownerInputs:     body.ownerInputs     && typeof body.ownerInputs     === "object" ? body.ownerInputs     : prev.ownerInputs,
    updatedAt: new Date().toISOString(),
  };

  res.json({ ok: true, updatedAt: store[orgId].updatedAt });
});

export default router;
