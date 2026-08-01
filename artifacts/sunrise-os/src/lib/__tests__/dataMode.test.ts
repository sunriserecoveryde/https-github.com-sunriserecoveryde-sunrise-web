/**
 * Phase 1A Hardening — parseDataMode unit tests.
 *
 * Verifies fail-closed behaviour: only "demo" and "production" are valid modes.
 * Any other value returns an error that blocks the application.
 */

import { describe, it, expect } from "vitest";
import { parseDataMode } from "../dataMode";

describe("parseDataMode — explicit value parsing", () => {
  it('accepts "demo" as a valid mode', () => {
    const result = parseDataMode("demo");
    expect(result).toEqual({ ok: true, mode: "demo" });
  });

  it('accepts "production" as a valid mode', () => {
    const result = parseDataMode("production");
    expect(result).toEqual({ ok: true, mode: "production" });
  });

  it("defaults to demo when value is undefined (safe default — not production)", () => {
    const result = parseDataMode(undefined);
    expect(result).toEqual({ ok: true, mode: "demo" });
  });

  it("defaults to demo when value is empty string", () => {
    const result = parseDataMode("");
    expect(result).toEqual({ ok: true, mode: "demo" });
  });

  it('fails closed for "staging" — invalid value', () => {
    const result = parseDataMode("staging");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("staging");
    }
  });

  it('fails closed for "PRODUCTION" — value is case-sensitive', () => {
    const result = parseDataMode("PRODUCTION");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("PRODUCTION");
    }
  });

  it('fails closed for "Demo" — value is case-sensitive', () => {
    const result = parseDataMode("Demo");
    expect(result.ok).toBe(false);
  });

  it("fails closed for arbitrary invalid strings", () => {
    for (const bad of ["true", "1", "yes", "mock", "test", " production"]) {
      const result = parseDataMode(bad);
      expect(result.ok).toBe(false);
    }
  });

  it("error reason message names the accepted values", () => {
    const result = parseDataMode("invalid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('"demo"');
      expect(result.reason).toContain('"production"');
    }
  });
});

describe("parseDataMode — fail-closed contract", () => {
  it("never returns production mode for undefined input", () => {
    const result = parseDataMode(undefined);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).not.toBe("production");
    }
  });

  it("never returns production mode for empty input", () => {
    const result = parseDataMode("");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).not.toBe("production");
    }
  });

  it('requires the exact string "production" to activate production mode', () => {
    const notProduction = ["Production", "PRODUCTION", "prod", "production ", " production"];
    for (const val of notProduction) {
      const result = parseDataMode(val);
      const isProduction = result.ok && result.mode === "production";
      expect(isProduction).toBe(false);
    }
  });
});
