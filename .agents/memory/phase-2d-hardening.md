---
name: Phase 2D Hardening
description: Phase 2D final closure — exact assignment binding, outbox worker, credential rotation, 414/414 tests green.
---

# Phase 2D Final Closure

**Branch:** `readiness/p0-phase-2d-final-closure`  
**Commit:** `f765913` (second commit with ZIP added separately)  
**Test result:** 414 passed / 0 failed / 22 skipped

## Credential rotation
- `DEV_TEST_PASSWORD` renamed to `PHASE2D_TEST_PASSWORD` everywhere
- No fallback in any test file — tests throw with a clear error if unset
- Value stored as Replit Secret; never in code or logs

## Key decisions

### NULL FK elimination
- Removed `isNull(sosPatientAccess.roleAssignmentId)` OR-branch from both:
  - `authorizationService.checkPatientAccessForGrant`
  - `patientRepo.listAssignedPatients`
- Active rows must have an exact FK; no backward-compat null path

### Migration 0004
- PL/pgSQL backfill loop: quarantine NULL rows before constraint creation
- RESTRICT FK replaces SET NULL FK on `sos_patient_access.role_assignment_id`
- `ck_active_access_requires_assignment` CHECK: active rows must have non-NULL FK
- `sos_patient_access_assignment_integrity` BEFORE trigger: cross-column user/org/facility consistency

### Schema additions
- `sosPatientAccess.quarantinedReason` text (nullable)
- `sosAuditOutbox.failedPermanently` boolean NOT NULL DEFAULT false
- `boolean` import added to `lib/db/src/schema/auth-tables.ts`

### AuditOutboxWorker
- `FOR UPDATE SKIP LOCKED` for multi-worker concurrency
- Exponential back-off (base 1s, cap 60s)
- `failed_permanently` state after maxAttempts
- SIGTERM-safe `stop()`, `getHealth()` health counters
- Singleton `getAuditOutboxWorker()` in auditOutboxWorker.ts

### Rate limiter test env vars
- `PHASE2D_RATE_LIMIT_INTEGRATION=true` enables PgRateLimitStore in authV1
- `PHASE2D_RATE_LIMIT_WINDOW_MS`, `PHASE2D_RATE_LIMIT_MAX` override window/limit

## Pitfalls discovered
- Zod v4 `.email()` rejects TLDs containing digits (e.g. `.p2d`) — use `.test` or `.dev`
- `mrn` column on `sos_patients` is NOT NULL — fixture INSERTs must include it
- Phase 2D trigger blocks INSERT of active patient_access row with revoked assignment → insert as active first, then revoke assignment separately
- `boolean` import must be added to drizzle/pg-core import list for `failedPermanently` column
- tsconfig `exclude: ["src/**/*.spec.ts"]` needed because @playwright/test is not installed
- lib/db needs `tsc --build` after schema changes before api-server `tsc --noEmit` will pass

## Evidence package
- ZIP: `artifacts/sunrise-os/readiness/phase-2d-access-binding-evidence-review.zip`
- Evidence manifest: `artifacts/sunrise-os/readiness/phase-2d/evidence-manifest.json`
- Clean migration proof: `artifacts/sunrise-os/readiness/phase-2d/clean-migration-proof.txt`
- Browser runbook: `artifacts/sunrise-os/readiness/phase-2d/manual-browser-verification-runbook.md`

## Additional findings
- `express-rate-limit` v8.6.0 initialises `config.limit` from `passedOptions.max ?? 5` first; setting both `limit:` and `max:` is required to guarantee the override works.
- `AuditOutboxWorker.start()` must be called from `src/index.ts` post-listen to enable startup recovery; forgetting this leaves pending events unprocessed.
- Shell env-var assignments like `PHASE2D_RATE_LIMIT_MAX=2 node ...` did not override the built process in testing; use `export` or pass via env file for reliable subprocess env injection.

**Why:** Phase 2 is a multi-phase security hardening track. Phase 3 must not start until browser verification (BV-1 through BV-5) is completed by a human reviewer.
