/**
 * DemoBanner visibility tests — data mode gate.
 *
 * The DemoBanner is rendered in App.tsx with:
 *   {DATA_MODE === 'demo' && <DemoBanner />}
 *
 * These tests verify the parseDataMode logic that controls DATA_MODE,
 * which is the sole gate for banner visibility.
 *
 * Requirements:
 *  - Demo mode (VITE_SUNRISE_DATA_MODE=demo):      banner visible
 *  - Production mode (VITE_SUNRISE_DATA_MODE=production): banner absent
 *  - Unset in development:                          treated as demo (safe default)
 *  - Production environment + "demo":              configuration error (banner must not render)
 *  - Production environment + missing:             configuration error (banner must not render)
 */

import { describe, it, expect } from "vitest";
import { parseDataMode } from "../lib/dataMode";

describe("DemoBanner — parseDataMode gate (development environment)", () => {
  it('demo mode: parseDataMode("demo") → mode="demo" → banner VISIBLE', () => {
    const result = parseDataMode("demo", "development");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("demo");
  });

  it('production mode: parseDataMode("production") → mode="production" → banner ABSENT', () => {
    const result = parseDataMode("production", "development");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("production");
  });

  it("unset in development → treated as demo (safe default) → banner VISIBLE", () => {
    const result = parseDataMode(undefined, "development");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("demo");
  });

  it("empty string in development → treated as demo → banner VISIBLE", () => {
    const result = parseDataMode("", "development");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("demo");
  });

  it("unrecognised value → error (banner must not render — error screen shown instead)", () => {
    const result = parseDataMode("staging", "development");
    expect(result.ok).toBe(false);
  });
});

describe("DemoBanner — parseDataMode gate (production environment)", () => {
  it('production env + "production" → ok → banner ABSENT', () => {
    const result = parseDataMode("production", "production");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("production");
  });

  it('production env + "demo" → error (demo forbidden in prod) → banner ABSENT', () => {
    const result = parseDataMode("demo", "production");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/demo.*not permitted|not permitted.*demo/i);
  });

  it("production env + missing → error (must be explicit) → banner ABSENT", () => {
    const result = parseDataMode(undefined, "production");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/must be set/i);
  });
});

describe("DemoBanner gate — App.tsx integration rule", () => {
  it("only demo mode should render the banner (no other mode)", () => {
    // Enumerate every mode outcome and confirm only 'demo' should trigger the banner.
    const shouldShowBanner = (raw: string | undefined, env: string): boolean => {
      const result = parseDataMode(raw, env);
      if (!result.ok) return false; // error screen, not the app
      return result.mode === "demo";
    };

    expect(shouldShowBanner("demo", "development")).toBe(true);
    expect(shouldShowBanner("production", "development")).toBe(false);
    expect(shouldShowBanner(undefined, "development")).toBe(true);   // defaults to demo in dev
    expect(shouldShowBanner("production", "production")).toBe(false);
    expect(shouldShowBanner("demo", "production")).toBe(false);      // parse error → no banner
    expect(shouldShowBanner(undefined, "production")).toBe(false);   // parse error → no banner
  });
});
