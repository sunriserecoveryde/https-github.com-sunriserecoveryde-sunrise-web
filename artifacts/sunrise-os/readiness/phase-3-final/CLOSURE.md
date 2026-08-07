# Phase 3 Clinical Documentation Foundation — Closure Report

**Branch:** `feature/phase-3-clinical-documentation-foundation`  
**Closed:** 2026-08-04  
**Final commit:** bf31d58  

---

## Gate Results

| Gate | Requirement | Result |
|------|-------------|--------|
| API vitest | 568/568 pass × 4 clean runs | ✅ (prior session) |
| SunriseOS vitest | 136/136 pass × 4 clean runs | ✅ (prior session) |
| Playwright stability | 17/17 × 3 consecutive clean runs | ✅ (this session) |
| Per-test traces | 17 traces, one per test, --trace on | ✅ (this session) |
| Archive ZIP | phase-3-clinical-documentation-foundation-review.zip | ✅ |

---

## Playwright Stability Evidence

All three runs: EXIT:0, no retries, no skips.

| Run | File | Result | Duration |
|-----|------|--------|----------|
| B1 | `readiness/phase-3-final/logs/stability-b1.txt` | 17/17 ✓ | 2.1m |
| B2 | `readiness/phase-3-final/logs/stability-b2.txt` | 17/17 ✓ | 1.8m |
| B3 | `readiness/phase-3-final/logs/stability-b3.txt` | 17/17 ✓ | 1.8m |

---

## Trace Collection Evidence

| Flow | Tests | File | Exit |
|------|-------|------|------|
| A | A-1..A-7 | `trace-flow-a-b1.txt` | 0 |
| B | B-1..B-2 | `trace-flow-b-b1.txt` | 0 |
| C | C-1..C-3 | `trace-flow-c-b1.txt` | 0 |
| D | D-1..D-3 | `trace-flow-d-b1.txt` | 0 |
| E | E-1      | `trace-flow-e-b1.txt` | 0 |

Playwright trace ZIPs: `playwright-results/` (one per test, includes HAR).

---

## Root-Cause Analysis — Regression Diagnosed and Fixed

The Phase 3 Playwright suite had a long-standing "A-3 regression" that prevented
17/17 stability passes. Root causes were identified through systematic log analysis.

### Root Cause 1 — Vite HMR Storm

**Symptom:** Hundreds of `/api/v1/auth/csrf-token` + `/api/v1/auth/session` pairs
every ~0.5 s for the entire 120 s test window.  No patient fetch.  Test timeout.

**Mechanism:** `vite.playwright.config.ts` had `watch.ignored` covering only
`**/e2e/**` and `**/playwright-results/**`.  The stability log file
(`readiness/phase-3-final/logs/stability-*.txt`) was written continuously by
the shell redirect and sat outside those ignored paths.  Vite's chokidar watcher
detected every line written → fired an HMR update → the SPA remounted → 
AuthContext's mount effect re-ran → csrf-token + auth/session fired again.

**Fix:** `server.hmr: false` in `vite.playwright.config.ts`.  Tests never need
live reload.  Extended `watch.ignored` to also cover `readiness/**` and
`playwright-report/**` as defence-in-depth.

### Root Cause 2 — `page.goto('load')` hang in sequential test contexts

**Symptom:** With HMR disabled, A-2 now passed, A-3 passed, but A-4 (and every
subsequent test) hung for 120 s.  Dashboard rendered (alerts/vitals every 5 s)
but `gotoAndAwaitReady`'s `Promise.all` never resolved.

**Mechanism:** `hmr: false` means Vite's warm module cache returns 304 Not
Modified for JS chunks on subsequent requests.  Playwright 1.38.0 / Chromium-1080
does not fire the CDP `Page.loadEventFired` lifecycle event for 304 navigations.
`page.goto(waitUntil:'load')` stalled indefinitely — the navigation timeout
(120 s = test timeout) hit before the event arrived.

**Fix:** `page.goto('/', { waitUntil: 'domcontentloaded' })`.  DOMContentLoaded
fires after the HTML is parsed regardless of subresource 304 status.  It is
immune to the warm-cache hang.

### Root Cause 3 — `navigateToPatient` fires before `AppInner` has the real userId key

**Symptom:** With the first two fixes, 16/17 tests passed.  C-3 (test 12)
consistently timed out with zero patient-fetch calls.  Auth/session fired and
the 60 s session poll confirmed `productionSession` was eventually set, but no
Dashboard or PatientDetail ever rendered.

**Mechanism:** `App.tsx` renders `<AppInner key={productionSession?.userId ?? 'prod-guest'}>`.
When the page first loads with storageState, `productionSession` is null
(initial state).  AuthContext fires auth/session.  `waitForResponse(auth/session)`
resolves at the CDP layer (response received in the browser) **before** React has
processed `res.json()` and called `setProductionSession(data)`.  `navigateToPatient`
then fires its popstate (`setActiveScreen('PatientDetail')`).  Milliseconds later,
`setProductionSession` commits → the key on AppInner changes from `'prod-guest'`
to the real userId → AppInner **remounts completely** → all routing state
(activeScreen, selectedPatientId) resets to defaults.  PatientDetail never opens.

The race was probabilistic: for tests 1–10, the CDP round-trip was fast enough
that `setProductionSession` had already committed before `navigateToPatient`
fired.  Test 12 (C-3), arriving in the 12th sequential browser context, had
slightly more variance.

**Fix:** Two-gate `gotoAndAwaitReady`:

1. `waitForResponse(auth/session)` — proves React is mounted.
2. `waitForResponse(alerts/vitals)` — proves `productionSession` is **committed**
   to React state, AppInner has remounted with the real userId key, and the
   Dashboard has fully rendered.  Only then is `navigateToPatient` safe to call.

---

## Files Changed (this session)

| File | Change |
|------|--------|
| `vite.playwright.config.ts` | `hmr: false`; extended `watch.ignored` |
| `e2e/clinical-notes-p3-browser.spec.ts` | `waitUntil:'domcontentloaded'`; two-gate `gotoAndAwaitReady` |
| `vite.config.ts` | Added `server.watch.ignored` (defence-in-depth for dev server; not used by Playwright) |

---

## Archive

`readiness/phase-3-clinical-documentation-foundation-review.zip` (520 KB)

Contents: 3 stability logs, 5 trace logs, spec file, Vite configs, playwright.config.ts.
