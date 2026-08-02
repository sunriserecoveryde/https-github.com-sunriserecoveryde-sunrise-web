/**
 * Global error handler — no-leak tests.
 *
 * Verifies that uncaught route errors ALWAYS return:
 *   - HTTP 500
 *   - Content-Type: application/json
 *   - Body exactly { error: "Internal Server Error" } — no message, no stack,
 *     no node_modules paths, no internal file paths
 *
 * This contract holds in both production and development/test modes.
 *
 * These tests use a minimal stand-alone Express application (no DB, no auth)
 * so they run fast and without external dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { globalErrorHandler } from "../middlewares/globalErrorHandler";

// ── Helper: build a tiny Express app with fault-injection routes ──────────────

function makeApp() {
  const app = express();

  // Route that throws a plain TypeError (simulates an unhandled runtime error).
  app.get("/fault/throw", (_req: Request, _res: Response) => {
    throw new TypeError("simulated TypeError in route handler");
  });

  // Route that calls next(err) explicitly (simulates a DB / service error).
  app.get("/fault/next", (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error("simulated error via next(err)"));
  });

  // Route that passes an error with a custom .status property.
  // The global handler must ignore this and always return 500.
  app.get("/fault/status", (_req: Request, _res: Response, next: NextFunction) => {
    const err = Object.assign(new Error("simulated 422 domain error"), { status: 422 });
    next(err);
  });

  // Route that passes an error whose message contains node_modules paths and
  // stack-frame-like text — these must NEVER appear in the HTTP response body.
  app.get("/fault/leaky-message", (_req: Request, _res: Response, next: NextFunction) => {
    const err = new Error(
      "ENOENT: no such file or directory, open '/app/node_modules/some-lib/index.js'\n" +
      "    at Object.openSync (node:fs:596:3)\n" +
      "    at Function.readFileSync (node:fs:464:35)\n" +
      "    at /app/src/routes/patients.ts:42:12",
    );
    next(err);
  });

  // Route that passes a non-Error value (string, plain object, etc.).
  app.get("/fault/non-error", (_req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    next("a raw string error" as any);
  });

  // Mount the global error handler last.
  app.use(globalErrorHandler);

  return app;
}

// ── Production mode ───────────────────────────────────────────────────────────

describe("globalErrorHandler — production mode", () => {
  let prevEnv: string | undefined;

  beforeEach(() => {
    prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
  });

  it("thrown TypeError → 500, Content-Type: application/json", async () => {
    const res = await request(makeApp()).get("/fault/throw");
    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    console.log("[808 prod throw] status=500, json | PASS");
  });

  it("thrown TypeError → body is exactly { error: 'Internal Server Error' }", async () => {
    const res = await request(makeApp()).get("/fault/throw");
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 prod throw] exact body | PASS");
  });

  it("next(err) → body has no 'message' or 'stack' property", async () => {
    const res = await request(makeApp()).get("/fault/next");
    const body = res.body as Record<string, unknown>;
    expect(body).not.toHaveProperty("message");
    expect(body).not.toHaveProperty("stack");
    console.log("[808 prod next] no message/stack keys | PASS");
  });

  it("next(err) → no stack-trace tokens in response body", async () => {
    const res = await request(makeApp()).get("/fault/next");
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("at Function.");
    expect(raw).not.toContain(".ts:");
    expect(raw).not.toContain(".js:");
    console.log("[808 prod next] no stack tokens | PASS");
  });

  it("response body is not raw HTML", async () => {
    const res = await request(makeApp()).get("/fault/throw");
    expect(res.text).not.toContain("<!DOCTYPE");
    expect(res.text).not.toContain("<html");
    console.log("[808 prod throw] not HTML | PASS");
  });

  it("error with .status 422 → still returns 500 (global handler always returns 500)", async () => {
    const res = await request(makeApp()).get("/fault/status");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 prod status] 422 err → 500 response | PASS");
  });

  it("error message containing node_modules paths → none of those paths appear in body", async () => {
    const res = await request(makeApp()).get("/fault/leaky-message");
    expect(res.status).toBe(500);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("at Function.");
    expect(raw).not.toContain("index.js");
    expect(raw).not.toContain("patients.ts");
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 prod leaky-message] no paths leaked | PASS");
  });

  it("non-Error value thrown → 500, clean JSON body", async () => {
    const res = await request(makeApp()).get("/fault/non-error");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 prod non-error] clean JSON | PASS");
  });
});

// ── Development / test mode ───────────────────────────────────────────────────

describe("globalErrorHandler — development mode", () => {
  let prevEnv: string | undefined;

  beforeEach(() => {
    prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
  });

  it("thrown TypeError → still JSON, not raw HTML", async () => {
    const res = await request(makeApp()).get("/fault/throw");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.text).not.toContain("<!DOCTYPE");
    expect(res.text).not.toContain("<html");
    console.log("[808 dev throw] JSON not HTML | PASS");
  });

  it("thrown TypeError → 500, no stack key, no node_modules in body", async () => {
    const res = await request(makeApp()).get("/fault/throw");
    expect(res.status).toBe(500);
    const body = res.body as Record<string, unknown>;
    expect(body).not.toHaveProperty("stack");
    expect(JSON.stringify(body)).not.toContain("node_modules");
    console.log("[808 dev throw] no stack/node_modules | PASS");
  });

  it("body is exactly { error: 'Internal Server Error' } in dev mode too", async () => {
    const res = await request(makeApp()).get("/fault/next");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 dev next] exact body in dev | PASS");
  });

  it("error message containing node_modules paths → not returned in dev mode either", async () => {
    const res = await request(makeApp()).get("/fault/leaky-message");
    expect(res.status).toBe(500);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("node_modules");
    expect(raw).not.toContain("at Object.");
    expect(raw).not.toContain("index.js");
    expect(res.body).toEqual({ error: "Internal Server Error" });
    console.log("[808 dev leaky-message] no paths in dev mode either | PASS");
  });
});
