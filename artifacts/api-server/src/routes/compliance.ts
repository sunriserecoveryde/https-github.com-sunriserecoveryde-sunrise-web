import { Router } from "express";
import { db } from "@workspace/db";
import { complianceAuditState } from "@workspace/db";
import { eq } from "drizzle-orm";

// ─── Compliance audit state ────────────────────────────────────────────────────
// Persisted to the `compliance_audit_state` PostgreSQL table (one row per org).
// A server restart no longer resets progress — reads and writes go straight to DB.

export interface ComplianceAuditState {
  completedIds: string[];
  evidenceInputs: Record<string, string>;
  corrActionInputs: Record<string, string>;
  ownerInputs: Record<string, string>;
  updatedAt: string;
  /** ISO string of the last full audit reset, or null if never reset. */
  auditResetAt: string | null;
}

const DEFAULT_STATE: ComplianceAuditState = {
  completedIds: [],
  evidenceInputs: {},
  corrActionInputs: {},
  ownerInputs: {},
  updatedAt: new Date().toISOString(),
  auditResetAt: null,
};

const router = Router();

// GET /api/compliance/audit-state?orgId=default
router.get("/compliance/audit-state", async (req, res) => {
  const orgId = String(req.query["orgId"] ?? "default");

  try {
    const rows = await db
      .select()
      .from(complianceAuditState)
      .where(eq(complianceAuditState.orgId, orgId))
      .limit(1);

    if (rows.length === 0) {
      res.json(DEFAULT_STATE);
      return;
    }

    const row = rows[0];
    res.json({
      completedIds:     row.completedIds     ?? [],
      evidenceInputs:   row.evidenceInputs   ?? {},
      corrActionInputs: row.corrActionInputs ?? {},
      ownerInputs:      row.ownerInputs      ?? {},
      updatedAt:        row.updatedAt.toISOString(),
      auditResetAt:     row.auditResetAt ? row.auditResetAt.toISOString() : null,
    } satisfies ComplianceAuditState);
  } catch (err) {
    res.status(500).json({ error: "Failed to read audit state", detail: String(err) });
  }
});

// PUT /api/compliance/audit-state?orgId=default
// Body: { completedIds, evidenceInputs, corrActionInputs, ownerInputs }
router.put("/compliance/audit-state", async (req, res) => {
  const orgId = String(req.query["orgId"] ?? "default");
  const body = req.body as Partial<ComplianceAuditState>;

  // Fetch the current row so we can merge partial updates.
  let prev: ComplianceAuditState = DEFAULT_STATE;
  try {
    const rows = await db
      .select()
      .from(complianceAuditState)
      .where(eq(complianceAuditState.orgId, orgId))
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      prev = {
        completedIds:     row.completedIds     ?? [],
        evidenceInputs:   row.evidenceInputs   ?? {},
        corrActionInputs: row.corrActionInputs ?? {},
        ownerInputs:      row.ownerInputs      ?? {},
        updatedAt:        row.updatedAt.toISOString(),
        auditResetAt:     row.auditResetAt ? row.auditResetAt.toISOString() : null,
      };
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read existing audit state", detail: String(err) });
    return;
  }

  const merged = {
    completedIds:     Array.isArray(body.completedIds)                                     ? body.completedIds     : prev.completedIds,
    evidenceInputs:   body.evidenceInputs   && typeof body.evidenceInputs   === "object"   ? body.evidenceInputs   : prev.evidenceInputs,
    corrActionInputs: body.corrActionInputs && typeof body.corrActionInputs === "object"   ? body.corrActionInputs : prev.corrActionInputs,
    ownerInputs:      body.ownerInputs      && typeof body.ownerInputs      === "object"   ? body.ownerInputs      : prev.ownerInputs,
  };

  try {
    await db
      .insert(complianceAuditState)
      .values({
        orgId,
        ...merged,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: complianceAuditState.orgId,
        set: {
          completedIds:     merged.completedIds,
          evidenceInputs:   merged.evidenceInputs,
          corrActionInputs: merged.corrActionInputs,
          ownerInputs:      merged.ownerInputs,
          updatedAt:        new Date(),
        },
      });

    res.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to save audit state", detail: String(err) });
  }
});

// DELETE /api/compliance/audit-log?orgId=default
// Stamps auditResetAt = now() on the server so that any subsequent GET returns
// a reset timestamp the client can compare against its local copy.  The client
// uses this to detect "the reset was committed server-side" and clears its own
// cached audit log, preventing a slow GET response from re-populating a trail
// the officer already erased.
router.delete("/compliance/audit-log", async (req, res) => {
  const orgId = String(req.query["orgId"] ?? "default");
  const now = new Date();

  try {
    await db
      .insert(complianceAuditState)
      .values({
        orgId,
        completedIds:     [],
        evidenceInputs:   {},
        corrActionInputs: {},
        ownerInputs:      {},
        updatedAt:        now,
        auditResetAt:     now,
      })
      .onConflictDoUpdate({
        target: complianceAuditState.orgId,
        set: {
          auditResetAt: now,
          updatedAt:    now,
        },
      });

    res.json({ ok: true, auditResetAt: now.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to record audit reset", detail: String(err) });
  }
});

export default router;
