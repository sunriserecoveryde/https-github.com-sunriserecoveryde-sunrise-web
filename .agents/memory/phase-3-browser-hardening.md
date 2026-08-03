---
name: Phase 3 browser test hardening
description: Four root-cause bugs that prevented full-suite 17/17 in the Playwright browser tests; fixes and detection patterns.
---

# Phase 3 True Browser Test Hardening

Four distinct root causes were found and fixed to reach stable 17/17 across 3 consecutive full-suite runs.

## 1. Fixture note left in voided state (C-1 failure)

**Rule:** `browserTestSeed.ts` must DELETE + re-INSERT both fixture notes — never `onConflictDoNothing`.

**Why:** C-3 voids `BROWSER_SIGNED_NOTE_ID`. On the next run, `onConflictDoNothing` silently skips the insert, leaving the note voided. C-1 then looks for `void-note-btn-<id>` but `status='voided'` suppresses the Void button.

**How to apply:** Any time a test mutates a fixture row's `status`, the seed must unconditionally reset it via DELETE + INSERT, not via upsert.

## 2. IP-based rate limiter exhausted mid-suite (D-1 through E-1 failure)

**Rule:** The Playwright `webServer` env in `playwright.config.ts` must include `PHASE2D_RATE_LIMIT_MAX: "1000"`.

**Why:** The test API server runs `dev` which hardcodes `NODE_ENV=development`, so the rate limiter skip condition (`NODE_ENV === "test"`) is never true. Default max=10 per 15-min window is exhausted by ~11 logins (A-1 through C-3). D-1 onward see "Too many login attempts" and the login form never dismisses.

**How to apply:** The `pnpm run dev` script sets `NODE_ENV=development`. Always set `PHASE2D_RATE_LIMIT_MAX` (or `PHASE2D_RATE_LIMIT_WINDOW_MS`) explicitly when running the API for Playwright. Do not rely on `NODE_ENV=test` to skip rate limiting — it will be overridden.

## 3. Tab-click dropped during concurrent API re-render (A-6, second openProgressNotesTab call)

**Rule:** `openProgressNotesTab` must confirm the tab switch via `waitForSelector('[data-testid="new-note-btn"]')`, retrying the click up to 3 times.

**Why:** A single `click({ force: true }) + waitForNetworkIdle` is sufficient for the first navigation to PatientDetail (clean state). On the second navigation (navigate-away-and-back), the patient API response arrives concurrently with the React `setActiveTab` call, silently swallowing the click. The `new-note-btn` never appears and `[data-testid="note-content"]` times out.

**How to apply:** Any spec helper that switches a React tab must confirm the destination state is reached, not just fire the click.

## 4. PermissionCode union missing Phase 3 clinical codes (TypeScript build error)

**Rule:** `src/lib/permissions.ts` must include all codes referenced in `RoleContext.tsx`'s `deriveScreenPermissionFromServerCodes`.

**Why:** Phase 3 added `clinical_note.create`, `clinical_note.view`, `clinical_note.sign`, `clinical_note.void`, `clinical_note.export` to the server policy but forgot to add them to the frontend `PERMISSION_CODES` array. TypeScript build passes only when both lists are in sync.

**How to apply:** Whenever a new permission code is added to `artifacts/api-server/src/lib/permissionPolicy.ts`, also add it to `artifacts/sunrise-os/src/lib/permissions.ts`.

## 5. vitest step-15 one-time flake (not a regression)

`auth-p2d-rate-limit.test.ts step-15` uses a real PgRateLimitStore and is sensitive to leftover `sos_rate_limit_windows` rows from Playwright runs in the same DB. Step-15 has its own cleanup at start and finish; the flake is resolved on the second vitest run. Not caused by any code change — it's a shared-DB ordering artefact.
