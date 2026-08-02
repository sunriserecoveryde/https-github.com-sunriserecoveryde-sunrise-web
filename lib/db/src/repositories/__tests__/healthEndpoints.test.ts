/**
 * Phase 1A Hardening — health endpoint tests.
 *
 * Verifies that /health/live and /health/ready behave correctly
 * using real DB connectivity (integration tests against dev database).
 *
 * These tests call the running dev api-server via HTTP.
 * The server is expected to be running on localhost at $PORT or 8080.
 */

import { describe, it, expect } from "vitest";

const API_PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const BASE = `http://localhost:${API_PORT}`;

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

describe("/health/live — liveness probe", () => {
  it("returns HTTP 200 with status ok", async () => {
    const { status, body } = await get("/health/live");
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "ok" });
  });

  it("does not expose secrets or credentials in the response", async () => {
    const { body } = await get("/health/live");
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/password|secret|token|key|credential|database_url/i);
  });
});

describe("/health/ready — readiness probe", () => {
  it("returns HTTP 200 when database is reachable", async () => {
    const { status, body } = await get("/health/ready");
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "ok", database: "connected" });
  });

  it("does not expose database connection string in the response", async () => {
    const { body } = await get("/health/ready");
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/postgres:\/\/|password|host|port|username|ssl/i);
  });

  it("health endpoints are reachable without authentication headers", async () => {
    // Health routes must not require identity — they sit outside requireIdentity middleware.
    const { status } = await get("/health/ready");
    // Should NOT return 401.
    expect(status).not.toBe(401);
  });
});
