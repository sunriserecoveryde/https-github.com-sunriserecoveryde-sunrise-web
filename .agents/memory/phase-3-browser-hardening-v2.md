---
name: Phase 3 browser test hardening v2 + v4 final closure
description: v4 final remediation complete. Covers credential rotation, trace sanitization, drizzle-kit Phase 2 proof, D-test strengthening, exact-equality permission tests, Topbar prod mode, v3 archive, and all v4 fixes.
---

## v4 Closure (branch feature/phase-3-clinical-documentation-foundation, commit 8733c9f)

**All gates met:**
- API Vitest: 572/572 × 3 clean runs (D, E, F)
- Sunrise OS Vitest: 136/136 × 4 runs (A, B, C, D)
- Playwright E2E: 19/19 × 3 clean runs (E, F, G)
- Phase 2 upgrade proof: PASS (phase-2-upgrade-proof-v2.txt)
- All combination runs: rate-alone, clinical→rate, rate→clinical, PW→rate, outbox→clinical, clinical→outbox — all passing
- Secret scan: 0 confirmed secrets
- Archive: `readiness/phase-3-clinical-documentation-foundation-review-v4.zip` (11.74 MB, 202 files)
- SHA256: `4ee7914f94cb49fb6c0693e0e79131a481e1e9a71280c501fe2c60caaa7416cc`

## v4 Root cause fixes (this session)

**D-7 void denial — `expectedVersion` missing:**
- `voidNoteSchema` requires BOTH `voidReason` AND `expectedVersion`
- Prior test only sent `voidReason` → 400. Fix: add `expectedVersion: 1` to void payload

**D-6/D-7 — Playwright `data` + explicit `Content-Type` conflict:**
- When `page.request.post()` receives both `headers: { "Content-Type": "application/json" }` AND `data: { ... }`, Playwright does NOT JSON-serialize the object
- Fix: remove the explicit `Content-Type` header; Playwright auto-sets it when `data` is a plain object
- **Why:** Playwright's `APIRequestContext` only auto-serializes when it controls the Content-Type. An explicit header overrides auto-detection and skips serialization.

**D-6 signed-card assertion false positive:**
- `[data-status="signed"]` matched a DIFFERENT note signed by Flow A (which stays visible)
- Fix: check only the specific `BROWSER_DRAFT_NOTE_ID` card's status attribute

**DB test isolation — billing_staff extra permissions:**
- `auth-p2c-security.test.ts §1-C` creates a `certified_clinician` role assignment for billing user in facility B
- If the test fails or is interrupted mid-run, the certified_clinician assignment is NOT cleaned up
- This causes subsequent runs to see billing_staff with `patient.create` / `patient.chart.view` → test failures
- Fix: manually `DELETE FROM sos_role_assignments WHERE user_id='...' AND role_id='certified_clinician'` between runs
- **Prevention:** The test HAS `afterAll` cleanup at line 1016 — it only leaks when test itself fails

**Billing user lookup:**
- Email: `billing@test.sunrise`
- User ID: `e123df74-81f1-4e2c-8013-d62da0c6130b`
- Table: `sos_user_accounts` (NOT `sos_users`) + `sos_user_identity_refs` (no email column — uses `ext_auth_ref`)

**e2e/tsconfig.json — allowImportingTsExtensions:**
- Global-setup.ts and browser spec use `.ts` extension imports (e.g. `import ... from "./sessions.ts"`)
- Fix: add `"allowImportingTsExtensions": true` to `e2e/tsconfig.json`
- Also exclude old API-only spec: `"exclude": ["clinical-notes-p3.spec.ts"]`

## Key decisions from v3 (preserved)

**Credential rotation flow:**
- `authSeed.ts` seeds ALL browser test users — run with `pnpm exec tsx src/seed/authSeed.ts` from api-server dir
- Always run authSeed WITHOUT env var override to use the current PHASE2D_TEST_PASSWORD secret

**Phase 2 upgrade proof (drizzle-kit only, no psql):**
- Create `lib/db/drizzle/phase2-proof/` with 0000-0005 SQL + `meta/_journal.json` (6 entries only)
- Create `lib/db/drizzle.phase2.config.ts` pointing to `drizzle/phase2-proof/`
- Run migrate → applies 0006 only (7 rows total); sos_clinical_notes: 24 constraints, 5 indexes, 1 trigger

**Rate-limit test flakiness:**
- `DELETE FROM sos_rate_limit_windows` before each API vitest run (global-teardown only clears loopback IPs)
- NEVER set PHASE2D_RATE_LIMIT_INTEGRATION externally when running full suite

**Playwright D-test specifics:**
- D-1 (cross-facility): hides note controls but does NOT render `[data-testid="access-denied"]`
- D-6 (sign denial): `sign-lock-btn` may not be visible — use `{ timeout: 5_000 }` on click
- Test count: 19 (Flow A–E: A=6, B=2, C=3, D=8-ish with auth, E=1 concurrency)

**lib/db pre-existing failures:**
- `constraints.test.ts` and `integration.test.ts`: `createOrganization` called without slug field
- 18 pass / 51 skip / 2 fail — pre-existing, do NOT fix for Phase 3

**SOS typecheck pre-existing failures:**
- `calendar.tsx` / `spinner.tsx`: React@19 dual-type conflict from pnpm hoisting
- Does NOT block SOS production build (EXIT:0) or Vitest (136/136)
