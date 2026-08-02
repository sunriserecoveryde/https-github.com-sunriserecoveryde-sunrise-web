/**
 * Phase 1A Hardening — parseDataMode unit tests.
 *
 * Full truth table for all (raw, nodeEnv) combinations:
 *
 * nodeEnv        | raw           | Expected result
 * -------------- | ------------- | --------------------------------
 * development    | "demo"        | ok — demo
 * development    | "production"  | ok — production
 * development    | undefined     | ok — demo  (safe default)
 * development    | ""            | ok — demo  (safe default)
 * development    | "staging"     | error
 * development    | "PRODUCTION"  | error (case-sensitive)
 * test           | "demo"        | ok — demo
 * test           | "production"  | ok — production
 * test           | undefined     | ok — demo  (safe default)
 * production     | "production"  | ok — production
 * production     | "demo"        | error (MUST block in production)
 * production     | undefined     | error (must be explicit)
 * production     | ""            | error (must be explicit)
 * production     | "staging"     | error
 * production     | "PRODUCTION"  | error (case-sensitive)
 */

import { describe, it, expect } from "vitest";
import { parseDataMode } from "../dataMode";

// ─── Development environment ──────────────────────────────────────────────────

describe("parseDataMode — development environment", () => {
  it('accepts "demo" in development', () => {
    expect(parseDataMode("demo", "development")).toEqual({ ok: true, mode: "demo" });
  });

  it('accepts "production" in development', () => {
    expect(parseDataMode("production", "development")).toEqual({ ok: true, mode: "production" });
  });

  it("defaults to demo when undefined in development", () => {
    const result = parseDataMode(undefined, "development");
    expect(result).toEqual({ ok: true, mode: "demo" });
  });

  it("defaults to demo when empty string in development", () => {
    expect(parseDataMode("", "development")).toEqual({ ok: true, mode: "demo" });
  });

  it('fails closed for "staging" in development', () => {
    const result = parseDataMode("staging", "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("staging");
  });

  it('fails closed for "PRODUCTION" in development (case-sensitive)', () => {
    const result = parseDataMode("PRODUCTION", "development");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("PRODUCTION");
  });

  it("fails closed for arbitrary invalid strings in development", () => {
    for (const bad of ["true", "1", "yes", "mock", " production", "Production"]) {
      expect(parseDataMode(bad, "development").ok).toBe(false);
    }
  });

  it("development error message names accepted values", () => {
    const result = parseDataMode("invalid", "development");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('"demo"');
      expect(result.reason).toContain('"production"');
    }
  });
});

// ─── Test environment ─────────────────────────────────────────────────────────

describe("parseDataMode — test environment", () => {
  it('accepts "demo" in test', () => {
    expect(parseDataMode("demo", "test")).toEqual({ ok: true, mode: "demo" });
  });

  it('accepts "production" in test', () => {
    expect(parseDataMode("production", "test")).toEqual({ ok: true, mode: "production" });
  });

  it("defaults to demo when undefined in test", () => {
    expect(parseDataMode(undefined, "test")).toEqual({ ok: true, mode: "demo" });
  });
});

// ─── Production environment ───────────────────────────────────────────────────

describe("parseDataMode — production environment", () => {
  it('accepts only "production" in production', () => {
    expect(parseDataMode("production", "production")).toEqual({ ok: true, mode: "production" });
  });

  it('rejects "demo" in production — must never activate with real patients', () => {
    const result = parseDataMode("demo", "production");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("demo");
      expect(result.reason).toContain("production");
    }
  });

  it("rejects missing value in production — must be explicitly configured", () => {
    const result = parseDataMode(undefined, "production");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("production");
    }
  });

  it("rejects empty string in production — must be explicitly configured", () => {
    const result = parseDataMode("", "production");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("production");
    }
  });

  it('rejects "PRODUCTION" in production (case-sensitive)', () => {
    const result = parseDataMode("PRODUCTION", "production");
    expect(result.ok).toBe(false);
  });

  it("rejects arbitrary invalid strings in production", () => {
    for (const bad of ["staging", "true", "1", "mock", "test", " production"]) {
      expect(parseDataMode(bad, "production").ok).toBe(false);
    }
  });
});

// ─── No-env default (unit tests called without nodeEnv arg) ──────────────────

describe("parseDataMode — no nodeEnv argument (defaults to non-production)", () => {
  it('accepts "demo" with no env argument', () => {
    expect(parseDataMode("demo")).toEqual({ ok: true, mode: "demo" });
  });

  it('accepts "production" with no env argument', () => {
    expect(parseDataMode("production")).toEqual({ ok: true, mode: "production" });
  });

  it("defaults to demo when undefined with no env argument", () => {
    expect(parseDataMode(undefined)).toEqual({ ok: true, mode: "demo" });
  });
});

// ─── Fail-closed contract ─────────────────────────────────────────────────────

describe("parseDataMode — fail-closed contract", () => {
  it("never returns production mode for undefined input in any non-production environment", () => {
    for (const env of ["development", "test", undefined]) {
      const result = parseDataMode(undefined, env);
      if (result.ok) {
        expect(result.mode).not.toBe("production");
      }
    }
  });

  it('requires the exact string "production" to activate production mode', () => {
    const notProduction = ["Production", "PRODUCTION", "prod", "production ", " production"];
    for (const val of notProduction) {
      const result = parseDataMode(val, "development");
      const isProduction = result.ok && result.mode === "production";
      expect(isProduction).toBe(false);
    }
  });

  it("returns consistent results — same input always gives same output", () => {
    const pairs: Array<[string | undefined, string]> = [
      ["demo", "development"],
      ["production", "development"],
      ["production", "production"],
      ["demo", "production"],
      [undefined, "production"],
    ];
    for (const [raw, env] of pairs) {
      const r1 = parseDataMode(raw, env);
      const r2 = parseDataMode(raw, env);
      expect(r1).toEqual(r2);
    }
  });
});
