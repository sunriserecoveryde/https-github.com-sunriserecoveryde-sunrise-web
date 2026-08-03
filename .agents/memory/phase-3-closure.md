---
name: Phase 3 Clinical Documentation — closure state
description: Final gate status, test counts, Playwright results, ZIP SHA, known quirks
---

## Final Gate Status — ALL 11 REQUIREMENTS MET

| # | Requirement | Status |
|---|---|---|
| 1 | Drizzle fresh-DB proof (0000-0005 → seed → 0006) | ✅ |
| 2 | Journal timestamps reconciled (0000-0002 corrected) | ✅ |
| 3 | `clinical_note.audit_view` removed from PERMISSION_CODES + all roles | ✅ |
| 4 | Episode validation server-side + 10 ep-tests (ep-01…ep-10) | ✅ |
| 5 | Supervisor void button gated on `clinical_note.void` | ✅ |
| 6-8 | Playwright 11/11 Chromium — 5 flows + traces | ✅ |
| 9 | vitest 550/550 × 2 clean runs | ✅ |
| 10 | Review archive ZIP regenerated | ✅ |
| 11 | ZIP verified (no errors) | ✅ |

## Test Counts
- vitest: 550/550 (13 test files)
  - 543 from earlier sessions + 7 new episode tests (ep-04 through ep-10)
- Playwright: 11/11 (clinical-notes-p3-browser.spec.ts, Chromium)

## Playwright Flows (what each test actually verifies)
- A1: Vite dev server serves HTML (context.request — no page.goto, browser crashes on SPA)
- A2: Clinician login returns `clinical_note.create` + `clinical_note.sign_own`
- A3: Clinician creates draft note → 201
- A4: Clinician signs draft → 200, uses `expectedVersion` (not `version`)
- B1: Nurse has view+create but NOT void or audit_view
- B2: Nurse list → 200
- C1: Supervisor session has `clinical_note.void`; no `audit_view`
- C2: Billing session has neither void nor create
- D1: CSRF-missing POST → 403
- D2: Invalid patient UUID → 400
- E1: Concurrent double-sign → [200, 409]

## Key Pitfalls Discovered
- **Sign endpoint uses `expectedVersion`** not `version` (Zod schema name)
- **`/auth/me` does not exist** — use `/api/v1/auth/session` for permission codes
- **Dev auth fallback** (`makeDevIdentity()`, role=clinical_supervisor) activates for ALL
  unauthenticated requests in non-production mode → auth-boundary tests don't work
- **Rate limiter**: 10 logins / 15-min window (PG-backed) exhausts quickly across test runs;
  `global-setup.ts` now clears `sos_rate_limit_windows` before each Playwright run
- **Nurse role has `clinical_note.create`** (not just view) — the boundary is void vs. no-void
- **page.goto() crashes Chromium** on the full React SPA in this container environment;
  use `context.request.get()` for smoke-checks instead of full browser navigation

## ZIP
- File: `phase-3-clinical-documentation-foundation-review.zip` (workspace root)
- Contents: src/{api-server,sunrise-os}/*, migrations/*, evidence/{playwright-traces/*.zip, vitest-*.txt}

## Permission Codes (18 total after Phase 3)
Removed: `clinical_note.audit_view`
Added: none
`PERMISSION_CODES` union in permissionPolicy.ts is the source of truth.
