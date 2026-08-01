---
name: Phase 2 Authentication/Authorization Hardening
description: Key pitfalls, fixes, and invariants from the Phase 2 Evidence Correction pass
---

## Critical Pitfalls Resolved

### Migration journal idx gap
drizzle-kit v0.31: if migration files have an idx gap (e.g., 0 then 2 skipping 1), the DDL executes but the tracking row is NOT inserted. Fix: rename files to eliminate the gap, add IF NOT EXISTS to all CREATE TABLE/INDEX.

### connect-pg-simple session revocation vs destroy
`session.destroy()` **deletes** the row from `sos_sessions`. If you need to preserve the row for audit (e.g., to verify `revoked_at`), do NOT call `session.destroy()`. Instead: update `revoked_at`, clear session fields, call `session.save()`. The `resolveIdentityFromSession` middleware already checks `revoked_at IS NULL`.

### Dev identity fallback masking test failures
`sessionAuthMiddleware` falls back to a synthetic dev identity when `NODE_ENV !== 'production'` and no real session exists. This causes GET /session to return 200 after logout in test env. Fix: `DISABLE_AUTH_FALLBACK=true` guard in the middleware; set it in test `beforeAll`.

**Why:** The fallback exists for demo/dev mode where no real auth is needed. Tests that verify "unauthenticated → 401" must suppress it.

### Rate limiter vs test suite
express-rate-limit with in-memory MemoryStore triggers 429 after 10 login requests per IP. A test suite making 25+ logins will fail. Fix: `skip: () => process.env.NODE_ENV === 'test'`.

**How to apply:** Add `skip` to authRateLimiter only. DB-backed account lockout (sos_user_accounts.failed_login_count) is NOT skipped — it provides the durable defense.

### sos_staff_profiles FK
`sos_staff_profiles.user_id` FK → `sos_user_identity_refs(org_id, id)`, NOT `sos_user_accounts.id`. When seeding, use `identityRef.id` (the identity ref row created 3 lines earlier), not `account.id`.

### CSRF token cross-session behavior
csrf-csrf v4 HMAC is `HMAC(session_id, CSRF_SECRET)`. After `session.regenerate()` on login, the old session ID is gone and the old token fails. After revocation-without-destroy, the SID is the same so the token is still valid — CSRF passes but auth layer rejects. These are independent layers.

### Seed importable for tests
Export `seed` as `runAuthSeed()` from authSeed.ts and gate auto-run on `process.argv[1]?.includes("authSeed")`. Vitest handles TS transpilation, so `import { runAuthSeed } from "../seed/authSeed"` works in test beforeAll. Set timeout ≥120s for 9×Argon2id hashes.

## Known Residual Risks
- Rate limiter in-memory store: PRODUCTION_BLOCKER before multi-instance deploy (R-01)
- sos_auth_audit: no DB trigger preventing UPDATE/DELETE, convention-only (R-02)
- GET /session displayName shows userId when staffProfile not found (staffProfile.userId = identityRef.id, not account.id) (R-03)
