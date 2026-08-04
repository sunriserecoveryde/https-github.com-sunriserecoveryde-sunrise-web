---
name: Phase 3 browser test hardening v2
description: Three root causes for Playwright stability failures in the Sunrise OS Phase 3 suite; permanent fixes; independent review blockers and how each was resolved.
---

# Phase 3 Browser Test Hardening — Final Root Causes

## Root Cause 1: Vite HMR storm

**Pattern:** Hundreds of `/api/v1/auth/csrf-token` + `/api/v1/auth/session` pairs every ~0.5 s for the entire 120 s test window.

**Cause:** `vite.playwright.config.ts` had `watch.ignored` but did NOT cover `readiness/` (where stability logs are written). Each log line write triggered a Vite HMR update → AuthContext remounted → csrf+session fired again.

**Fix:** `server.hmr: false` in `vite.playwright.config.ts`. Tests never need HMR. Extended `watch.ignored` to also cover `readiness/**` and `playwright-report/**`.

## Root Cause 2: page.goto('load') hang after warm Vite cache

**Pattern:** With HMR disabled, tests after the first one hang for 120 s at `gotoAndAwaitReady`. Dashboard rendered (alerts/vitals polling) but `page.goto` Promise never resolved.

**Cause:** `hmr: false` causes Vite to return 304 Not Modified for JS chunks. Playwright 1.38.0 + Chromium-1080 does NOT fire the CDP `Page.loadEventFired` event for 304 responses. `page.goto(waitUntil:'load')` stalls indefinitely.

**Fix:** `page.goto('/', { waitUntil: 'domcontentloaded' })`. DOMContentLoaded fires after HTML parse regardless of 304 status.

## Root Cause 3: navigateToPatient fires before AppInner has the real userId key

**Pattern:** Intermittent (every 10–20 tests): PatientDetail never opens, zero patient-fetch API calls, only 60 s session polls. Test timeout.

**Cause:** `App.tsx` keys AppInner by `productionSession?.userId ?? 'prod-guest'`. `waitForResponse(auth/session)` resolves at the CDP layer (response received) BEFORE React has called `setProductionSession(data)`. `navigateToPatient` dispatches its popstate while AppInner is still on the `'prod-guest'` key. When `setProductionSession` commits, AppInner remounts (new key) and ALL routing state (selectedPatientId, activeScreen) resets to defaults. The popstate is silently lost.

**Fix:** Two-gate `gotoAndAwaitReady`:
1. `waitForResponse(auth/session)` — React is mounted
2. `waitForResponse(alerts/vitals)` — productionSession is committed, AppInner has remounted with real userId key, Dashboard is rendered

Only after BOTH gates resolve is `navigateToPatient` safe to call.

## Independent reviewer blockers resolved (Phase 3 v2 archive)

**Blocker 1 (no trace.zip):** Run `--trace on` + immediately copy trace.zip before next run overwrites them. playwright-results/ is overwritten by each run; capture before any subsequent run.

**Blocker 2 (demo-mode screenshots):** playwright.config.ts sets `VITE_SUNRISE_DATA_MODE=production`. Screenshots from that run are production mode. A-1 asserts DemoBanner is absent.

**Blocker 6 (manual SQL upgrade proof):** Drizzle-kit skips 0006 when DB `created_at` for applied migrations is HIGHER than 0006's `_journal.json` "when" value. This happens when the reconcile script (which sets Aug 2026 created_at) is used. Proof with normal-runner: set `created_at = journal "when"` values for 0000-0005, then run `drizzle-kit migrate` — correctly applies 0006 since 0005's "when" < 0006's "when".

**Blocker 11 (swallowed assertion catches):** `.catch(() => {})` on `expect(x).not.toBeVisible()` lines must be removed. `waitForLoadState("networkidle", ...).catch(() => {})` should be replaced with `waitForTimeout(300)` — the SPA has continuous polling; networkidle never completes. `.catch(() => false)` on `.isVisible()` (used in conditional if-blocks) is safe and not the same as swallowing an assertion.

## Key file: vite.playwright.config.ts

The Playwright webServer uses `vite.playwright.config.ts` (NOT `vite.config.ts`). Changes to `vite.config.ts` do NOT affect Playwright tests. Always edit `vite.playwright.config.ts` for test-server behavior.

## drizzle-kit migration upgrade proof note

On a clean Phase 2 install (drizzle-kit applied all migrations, created_at = journal "when" values), migration 0006 applies normally via drizzle-kit because 0006's "when" (1754438400000) > 0005's "when" (1754352000000). The issue only arises when `created_at` for earlier rows is set to a LATER timestamp (e.g., by a reconcile script using CURRENT_TIMESTAMP).
