import { Router } from "express";

// ─── In-memory vitals alert store ─────────────────────────────────────────────
// Alerts expire after KEEP_DURATION_MS. The store is intentionally in-process
// (no DB) so the demo has zero setup friction — restart resets to a clean slate.

export interface VitalsAlert {
  id: string;
  patientName: string;
  patientBed: string;
  scoreType: "COWS" | "CIWA";
  score: number;
  severity: string;
  nurseInitials: string;
  timestamp: string;
}

const KEEP_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const store: VitalsAlert[] = [];

const router = Router();

// POST /api/alerts/vitals — mobile nurse submits a critical score alert
router.post("/alerts/vitals", (req, res) => {
  const alert: VitalsAlert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    patientName:   req.body.patientName   ?? "Unknown",
    patientBed:    req.body.patientBed    ?? "—",
    scoreType:     req.body.scoreType     ?? "COWS",
    score:         Number(req.body.score) || 0,
    severity:      req.body.severity      ?? "Critical",
    nurseInitials: req.body.nurseInitials ?? "RN",
  };
  store.unshift(alert);
  if (store.length > 100) store.pop();
  res.json({ ok: true, alert });
});

// GET /api/alerts/vitals — web dashboard polls for recent alerts
router.get("/alerts/vitals", (_req, res) => {
  const cutoff = Date.now() - KEEP_DURATION_MS;
  res.json({
    alerts: store.filter(a => new Date(a.timestamp).getTime() > cutoff),
  });
});

export default router;
