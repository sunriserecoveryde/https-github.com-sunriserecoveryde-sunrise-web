---
name: Phase 3 browser test hardening v2
description: Three root causes for Playwright stability failures in the Sunrise OS Phase 3 suite, and the permanent fixes. Supersedes earlier phase-3-browser-hardening entry.
---

# Phase 3 Browser Test Hardening — Final Root Causes

## Root Cause 1: Vite HMR storm

**Pattern:** Hundreds of `/api/v1/auth/csrf-token` + `/api/v1/auth/session` pairs every ~0.5 s for the entire 120 s test window.

**Cause:** `vite.playwright.config.ts` had `watch.ignored` but did NOT cover `readiness/` (where stability logs are written). Each log line write triggered a Vite HMR update → the SPA remounted → AuthContext's mount effect re-ran → csrf+session fired again.

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

## Why CDP 'load' hangs with warm Vite cache + hmr:false

When Vite's module cache is warm and `hmr:false`, it serves 304 responses for JS chunks. Playwright 1.38.0's CDP implementation does not fire `Page.loadEventFired` for 304 navigations. Always use `waitUntil: 'domcontentloaded'` for page.goto in Playwright tests against a warm Vite dev server.

## Key file: vite.playwright.config.ts

The Playwright webServer uses `vite.playwright.config.ts` (NOT `vite.config.ts`). Changes to `vite.config.ts` do NOT affect Playwright tests. Always edit `vite.playwright.config.ts` for test-server behavior.
