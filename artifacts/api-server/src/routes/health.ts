/**
 * Health check endpoints.
 *
 *   GET /health/live   — liveness: server process is running.
 *   GET /health/ready  — readiness: server + database are reachable.
 *
 * Neither endpoint exposes secrets, credentials, or internal connection strings.
 * The readiness response includes only {"status","database"} fields.
 */

import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

/**
 * Liveness probe — always returns 200 while the process is alive.
 * Kubernetes / Replit deployment uses this to decide whether to restart.
 */
router.get("/health/live", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Readiness probe — checks that the database is reachable before returning 200.
 * Returns 503 when the DB is unavailable so load-balancers / orchestrators
 * stop sending traffic until connectivity is restored.
 */
router.get("/health/ready", async (_req, res) => {
  try {
    // Lightweight connectivity check — no data returned.
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});

export default router;
