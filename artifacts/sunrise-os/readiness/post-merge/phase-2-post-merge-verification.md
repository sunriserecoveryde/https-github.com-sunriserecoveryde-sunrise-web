# Phase 2 Post-Merge Verification Report

**Date:** 2026-08-02  
**Branch verified:** `main`  
**Merge commit:** `005d70d` — Merge Phase 2 hardening (readiness/p0-phase-2d-final-closure → main)  
**Main HEAD at time of report:** `7da1d1b` (includes #803, #804, #805 merged after Phase 2)  
**Working-tree status:** Clean (one untracked attached_assets file, no modified tracked files)  
**Merge type:** Explicit merge commit (`--no-ff`)  

---

## 1. Git State

| Item | Value |
|------|-------|
| Phase 2D branch tip | `8c18a7d` |
| Merge commit | `005d70d` |
| Post-merge HEAD | `7da1d1b` |
| Working tree | Clean |
| Merge type | Merge commit (--no-ff) |

---

## 2. Required File Check

All 17 required Phase 2 files confirmed present on `main`:

| File | Status |
|------|--------|
| `lib/db/drizzle/0000_perpetual_rafael_vega.sql` | ✅ PRESENT |
| `lib/db/drizzle/0001_authentication_authorization.sql` | ✅ PRESENT |
| `lib/db/drizzle/0002_authorization_correction.sql` | ✅ PRESENT |
| `lib/db/drizzle/0003_phase_2c_closure.sql` | ✅ PRESENT |
| `lib/db/drizzle/0004_phase_2d_final_closure.sql` | ✅ PRESENT |
| `lib/db/drizzle/meta/_journal.json` | ✅ PRESENT |
| `lib/db/src/schema/auth-tables.ts` | ✅ PRESENT |
| `lib/db/src/repositories/patientRepo.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/authorizationService.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/auditOutboxWorker.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/pgRateLimiter.ts` | ✅ PRESENT |
| `artifacts/api-server/src/routes/authV1.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/adminAuthorizationService.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/permissionPolicy.ts` | ✅ PRESENT |
| `artifacts/api-server/src/lib/roleGrantPolicy.ts` | ✅ PRESENT |
| `artifacts/api-server/src/middlewares/sessionAuth.ts` | ✅ PRESENT |
| `artifacts/api-server/src/seed/authSeed.ts` | ✅ PRESENT |
| `lib/shared-permissions/src/index.ts` | ✅ PRESENT |

No omissions detected.

---

## 3. Clean Migration (Disposable Database)

**Method:** Created a brand-new PostgreSQL database, applied all migrations via
`drizzle-kit migrate --config lib/db/drizzle.config.ts` with a fresh DATABASE_URL
pointing to the disposable database. Destroyed the database after verification.

**Migration command exit code:** 0  
**Reapplication exit code:** 0 (idempotent — "migrations applied successfully")

### Tables created (18)

```
compliance_audit_state  conversations           grow_user_state
grow_users              messages                sos_audit_outbox
sos_auth_audit          sos_episodes_of_care    sos_facilities
sos_organizations       sos_patient_access      sos_patients
sos_rate_limit_windows  sos_role_assignments    sos_sessions
sos_staff_profiles      sos_user_accounts       sos_user_identity_refs
```

### Indexes verified (46 total)

Key security indexes confirmed:
- `idx_sos_user_accounts_org_email` (UNIQUE) — prevents duplicate emails per org
- `idx_sos_user_accounts_org_id_id` (UNIQUE) — tenant-scoped user identity
- `idx_sos_patients_org_mrn` (UNIQUE) — per-org MRN uniqueness
- `idx_sos_audit_outbox_pending` — efficient outbox worker polling
- `idx_sos_auth_audit_org_id`, `idx_sos_auth_audit_user_id` — audit queryability

### Foreign keys verified

All tenant-scoped FKs confirmed present, including:
- `sos_patients.org_id` → `sos_organizations.id` ON DELETE CASCADE
- `sos_patients.(org_id, facility_id)` → `sos_facilities.(org_id, id)` ON DELETE RESTRICT
- `sos_patient_access.(org_id, user_id)` → `sos_user_accounts.(org_id, id)` ON DELETE CASCADE
- `sos_patient_access.(org_id, patient_id)` → `sos_patients.(org_id, id)` ON DELETE CASCADE
- `sos_patient_access.role_assignment_id` → `sos_role_assignments.id` ON DELETE RESTRICT

### Check constraints verified

Key constraints confirmed:
- `ck_sos_patients_status` — status enum: active/inactive/discharged/transferred
- `ck_sos_patient_access_status` — access status enum: active/revoked/expired
- `ck_sos_patient_access_relationship` — relationship type enum (5 values)
- `ck_active_access_requires_assignment` — active access row must have a role_assignment_id
- `ck_sos_user_accounts_status` — account status enum (4 values)
- `ck_sos_user_accounts_mfa_status` — MFA status enum (4 values)

### Audit triggers verified

```
sos_audit_no_update                            sos_auth_audit  — blocks UPDATE on audit rows
sos_patient_access_assignment_integrity_check  sos_patient_access — FK integrity enforcement
sos_patient_access_facility_check              sos_patient_access — cross-tenant facility guard
```

### Audit/outbox tables verified

```
sos_audit_outbox    — durable outbox for async audit events
sos_auth_audit      — append-only authentication/authorization audit log
compliance_audit_state — compliance module state
```

### Idempotency

Second `drizzle-kit migrate` call on already-migrated database exited 0 with no changes applied.

### Seed

authSeed successfully seeded 18 fictitious test personas including org-admin, facility-admin,
clinician, nurse, billing, readonly, disabled, and security-admin roles.

### Database destroyed

Disposable database dropped after verification. No residual state.

**Migration result:** ✅ PASS

---

## 4. Test Suite Results

**Environment:** `PHASE2D_TEST_PASSWORD` secret available, `DISABLE_AUTH_FALLBACK=true`

| Metric | Count |
|--------|-------|
| Test files discovered | 11 |
| Tests discovered | 418 |
| Tests passed | **410** |
| Tests failed | **8** |
| Tests skipped | 0 |

| Test category | Status |
|---------------|--------|
| Real PostgreSQL tests (schema, migration, session, auth) | ✅ All passing |
| Real HTTP tests (auth-p2-live-session, auth-p2b-live-session, exact-binding) | ✅ All passing |
| Restart tests (rate-limiter step-03, outbox-worker step-01) | ✅ All passing |
| Multi-instance tests (rate-limiter step-05, outbox-worker step-03) | ✅ step-05 passing |
| Browser/manual tests (BV-5 HAR export) | ⬜ PENDING HUMAN |
| CSRF tests (16 steps) | ✅ All passing |
| Session cookie attribute tests (9 checks) | ✅ All passing |
| Security header tests (Helmet) | ✅ All passing |

### Failing tests (8)

All 8 failures are in `src/__tests__/auth-p2-integration.test.ts > patient API — 13 response scenarios`:

| Test | Root cause |
|------|------------|
| patient-02: GET /patients with dev identity → 200 + array | DISABLE_AUTH_FALLBACK=true → 401 |
| patient-03: patient list has Cache-Control: private, no-store | Depends on patient-02 (no response) |
| patient-04: patient list has Pragma: no-cache | Depends on patient-02 |
| patient-06: GET /patients/:id for non-existent patient → 404 | DISABLE_AUTH_FALLBACK=true → 401 |
| patient-08: GET /patients/:id/episode for non-existent patient → 404 | DISABLE_AUTH_FALLBACK=true → 401 |
| patient-09: patient list response has no duplicate IDs | DISABLE_AUTH_FALLBACK=true → 401 |
| patient-11: Patient routes are protected (not publicly accessible) | Test expects 200 with dev identity; gets 401 |
| patient-12: patient detail response does not leak passwordHash | Depends on patient-11 |

**Root cause:** `DISABLE_AUTH_FALLBACK=true` is set as a shared Replit environment variable.
This env var was intentionally set during Phase 2D BV-3 verification to prove session
invalidation. It disables the `devIdentityMiddleware` fallback. These 8 tests were written
during Phase 1A when dev-identity was the only auth mechanism. They rely on an automatic
identity injection that DISABLE_AUTH_FALLBACK suppresses.

**Nature of regression:** Environmental — the shared env var is overriding dev-mode behaviour.
The Phase 2 code itself is correct. These tests are testing Phase 1 dev-only behaviour
that Phase 2 intentionally replaced with real session authentication.

**Fix required (one of):**
1. Remove `DISABLE_AUTH_FALLBACK=true` from the shared dev environment (allows dev-identity
   fallback to work again, restoring these tests). Appropriate if the env var was only needed
   for BV-3 verification and is not a permanent production hardening requirement.
2. Update the 8 failing tests to authenticate via the real CSRF/login flow before calling
   patient endpoints. This is the correct long-term fix — these tests should not depend on
   the dev-identity shortcut now that real auth exists.

**Tests saved to:** `readiness/post-merge/phase-2-main-test-results.txt`

---

## 5. TypeScript Results

| Package | Command | Result | Duration |
|---------|---------|--------|----------|
| lib-db | `tsc --noEmit` | ✅ 0 errors, 0 warnings | ~553ms |
| api-server | `tsc --noEmit` | ✅ 0 errors, 0 warnings | ~3680ms |
| sunrise-os | `tsc --noEmit` | ✅ 0 errors, 0 warnings | ~3559ms |

**TypeScript result:** ✅ PASS — all three packages clean

---

## 6. Production Build Results

| Artifact | Command | Result | Output | Duration |
|----------|---------|--------|--------|----------|
| api-server | `node ./build.mjs` | ✅ Exit 0 | `dist/index.mjs` 3.0 MB | ~751ms |
| sunrise-os | `vite build --config vite.config.ts` | ✅ Exit 0 | `dist/public/assets/index.js` 4.86 MB | ~13.3s |

**Warnings (non-blocking):**
- Sunrise OS: chunk size warning on `index-*.js` (4,856 kB > 500 kB threshold). Expected —
  this is a 53-screen SPA. Gzip size is 1,260 kB. No code splitting applied.
- API server: dist/index.mjs is 3.0 MB (includes all node_modules bungled by esbuild). Acceptable.

**Build logs saved to:** `readiness/post-merge/build-logs/`

**Production build result:** ✅ PASS

---

## 7. Production Smoke Test

**Conditions:** Real PostgreSQL, real API server (port 8080), `DISABLE_AUTH_FALLBACK=true`,
no dev identity headers, no mock responses. Fictitious test credentials only.

**Note:** Login field is `email` (not `username`). authSeed was run to refresh Argon2id
hashes before the smoke test.

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| 1. Login page / health check | 200 | ✅ 200 | `GET /health/live` |
| 2. Pre-login CSRF endpoint | 200 | ✅ 200 | Token issued; `_csrf` HttpOnly cookie set |
| 3. Fictitious user login | 200 | ✅ 200 | `clinician@test.sunrise`, role verified |
| 4. Session endpoint | 200 | ✅ 200 | Session persisted; email confirmed |
| 5. Authorized patient list | 200 | ✅ 200 | 11 patients returned |
| 6. Minimum-necessary projection | no passwordHash | ✅ PASS | `passwordHash` absent from response |
| 7. Authorized patient detail | 200 | ✅ 200 | `passwordHash` absent from detail |
| 8. Unauthorized patient access | 404 | ✅ 404 | Out-of-scope returns 404 (no enumeration) |
| 9. Browser refresh / session persistence | 200 | ✅ 200 | Session survives second request |
| 10. Logout | 200 | ✅ 200 | Post-login CSRF token used (token rotates on login) |
| 11. Protected API returns 401 after logout | 401 | ✅ 401 | Session invalidated correctly |

**Note on step 8:** Out-of-scope patients return 404 rather than 403. This is correct
security policy — returning 403 would confirm the patient's existence to unauthorized
requesters. 404 prevents record-existence enumeration.

**Note on steps 10-11:** The CSRF token rotates on login (Phase 2B fix, commit 6a01438).
The pre-login token is invalidated. A fresh `/auth/csrf-token` call must be made post-login
before logout. The smoke test confirms this works correctly.

**Smoke test result:** ✅ ALL 11 STEPS PASS

---

## 8. Missing File Check

No required Phase 2 files were omitted from the merge. All 17 key files verified present.
All 5 migrations present in `lib/db/drizzle/` and journal.

---

## 9. Known Limitations

| Item | Status |
|------|--------|
| BV-5 HAR export | ⬜ PENDING HUMAN — browser-only, cannot be produced via CLI |
| 10-persona browser walkthrough | ⬜ PENDING HUMAN — requires manual sign-off |
| Password reset endpoint | 503 (email infrastructure deferred to Phase 3) |
| MFA enrollment | Not implemented (deferred to Phase 3) |
| DB-level append-only audit enforcement | Trigger exists; DB role enforcement deferred |
| Primary DB migration journal | Shows 2 entries (hashes, not tag names) — cosmetic; all 18 tables confirmed present |

---

## 10. Regression Findings

### REGRESSION-001 (Environmental) — 8 tests failing in `auth-p2-integration.test.ts`

| Attribute | Value |
|-----------|-------|
| Severity | Medium — test count regression; no security or functionality impact |
| File | `src/__tests__/auth-p2-integration.test.ts` |
| Tests affected | 8 (patient-02, -03, -04, -06, -08, -09, -11, -12) |
| Root cause | `DISABLE_AUTH_FALLBACK=true` shared env var disables dev-identity fallback |
| Code defect | None — merged code is correct |
| Fix option 1 | Remove `DISABLE_AUTH_FALLBACK` from shared dev env (quick) |
| Fix option 2 | Update 8 tests to use real session auth (correct long-term approach) |
| Introduced by | Setting `DISABLE_AUTH_FALLBACK=true` for Phase 2D BV-3 verification |
| Pre-existing at merge | Yes — was failing on the branch before merge |

No other regressions found.

---

## Final Result

```
PHASE 2 MERGE REGRESSION FOUND
```

**Regression:** 8 tests in `auth-p2-integration.test.ts` fail because `DISABLE_AUTH_FALLBACK=true`
is set as a permanent shared environment variable, disabling the dev-identity fallback those
tests rely on.

**All other checks passed:**
- ✅ All 17 required Phase 2 files present
- ✅ Clean migration from empty database (18 tables, indexes, FKs, constraints, triggers)
- ✅ Migration idempotency confirmed
- ✅ TypeScript clean across all 3 packages
- ✅ Production builds clean
- ✅ Production smoke test — all 11 steps pass

**Action required before Phase 3:**  
Resolve REGRESSION-001 by either removing `DISABLE_AUTH_FALLBACK` from the shared dev
environment or updating the 8 affected tests to use real session authentication.
Once zero tests fail, this report can be reissued as `PHASE 2 MERGE VERIFIED`.
