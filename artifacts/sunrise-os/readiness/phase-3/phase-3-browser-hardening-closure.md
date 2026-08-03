# Phase 3 Browser Test Hardening — Closure Report

**Date:** 2026-08-03  
**Branch:** `feature/phase-3-clinical-documentation-foundation`  
**Status: CLOSED — all gate requirements met**

---

## Gate Requirements

| Gate | Requirement | Result |
|------|-------------|--------|
| PW-1 | 17/17 Playwright × 3 consecutive clean full-suite runs | ✓ PASS (runs A, B, C) |
| VT-1 | 568/568 api-server vitest × 4 consecutive clean runs | ✓ PASS (runs A, B, C, D) |
| VT-2 | 136/136 sunrise-os vitest × 4 consecutive clean runs | ✓ PASS (runs A, B, C, D) |
| SS-1 | ≥20 screenshots from live Playwright session | ✓ PASS (25 screenshots) |
| DB-1 | No .gitignore holes for session artefacts | ✓ PASS (.gitignore added) |

---

## Root Causes Fixed This Session

### Bug 1 — Vite HMR storm (blank white page on every test)
**Symptom:** All browser tests produced a blank white screenshot; 1,649 aborted
`ComplianceDemoTour.tsx` requests in the Playwright network trace.  
**Root cause:** The `globalSetup` writes 8 session JSON files to
`e2e/sessions/` which is inside the Vite project root.  Vite's file watcher
detected each write and fired an HMR update, re-requesting all 50+ source
modules.  Each update aborted the previous batch, so the app never finished
loading — giving a pure-white page after 15 s.  
**Fix:** Added `server.watch.ignored: ["**/e2e/**", "**/playwright-results/**"]`
to `vite.playwright.config.ts`.  
**File:** `artifacts/sunrise-os/vite.playwright.config.ts`

### Bug 2 — E-1 test timeout (serial two-context setup)
**Symptom:** E-1 ("stale-version conflict") timed out at 120 s.  
**Root cause:** `navigateToPatient` + `openProgressNotesTab` ran sequentially
for both browser contexts; the `openProgressNotesTab` retry loop (3 × 3 s) adds
up to 9.6 s per context, and the `draftCard.toBeVisible({ timeout: 15_000 })`
for each context added another 30 s worst-case.  
**Fix:** (a) Added `test.setTimeout(180_000)` to E-1.  (b) Parallelised the
two-context setup with `Promise.all`.  
**File:** `artifacts/sunrise-os/e2e/clinical-notes-p3-browser.spec.ts`

### Bug 3 — Missing `orgSlug` in production login (A-2 would fail)
**Symptom:** The login POST body omitted `orgSlug`; the API's tenant-login path
rejects requests without it.  
**Fix:** Added `orgSlug: (import.meta.env.VITE_SUNRISE_ORG_SLUG ?? "sunrise")`
to the fetch body in `ProductionLogin.tsx`.  
**File:** `artifacts/sunrise-os/src/pages/ProductionLogin.tsx`

### Note — `trace: "on"` OOM with full 17-test suite
Running with `trace: "on"` for all 17 tests simultaneously exhausts available
memory and hangs the test runner (no output, OOM-killed).  Running individual
tests with `--grep` works fine.  The suite uses `retain-on-failure` by default;
to trace a specific test use:
```
pnpm --filter @workspace/sunrise-os exec playwright test --grep "E-1"
```

---

## Stability Proof Log

| Run | api-server vitest | sunrise-os vitest | Playwright |
|-----|-------------------|-------------------|------------|
| A   | 568/568 ✓         | 136/136 ✓         | 17/17 ✓    |
| B   | 568/568 ✓         | 136/136 ✓         | 17/17 ✓    |
| C   | 568/568 ✓         | 136/136 ✓         | 17/17 ✓    |
| D   | 568/568 ✓         | 136/136 ✓         | — (extra)  |

Total: 704 vitest tests × 4 runs, 17 Playwright tests × 3 runs.

---

## 25 Evidence Screenshots (e2e/screenshots/)

| # | File | Flow |
|---|------|------|
| 01 | login-page-production-mode.png | A — production login renders |
| 01 | compose-panel-open-new-note.png | A — compose panel opens |
| 01 | draft-note-dirty-before-save.png | A — draft content before save |
| 01 | progress-notes-tab-initial-state.png | A — initial tab state |
| 02 | clinician-dashboard-after-login.png | A — dashboard after login |
| 02 | draft-saved-note-appears-in-list.png | A — draft saved |
| ... | (25 total) | flows A–E |

---

## Files Changed This Session

| File | Change |
|------|--------|
| `vite.playwright.config.ts` | Added `server.watch.ignored` for e2e/ and playwright-results/ |
| `e2e/clinical-notes-p3-browser.spec.ts` | E-1: `test.setTimeout(180_000)`, parallel context setup |
| `src/pages/ProductionLogin.tsx` | Added `orgSlug` to login POST body |
| `.gitignore` (new) | Excludes `e2e/sessions/*.json`, `e2e/traces/`, `playwright-results/` |
| `playwright.config.ts` | Updated trace comment re: OOM on full suite |
