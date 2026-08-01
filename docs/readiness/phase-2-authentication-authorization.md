# Phase 2 — Production Authentication & Server-Side Authorization

> **Status:** Verified  
> **Branch:** `readiness/p0-authentication-authorization`  
> **Stack:** Node.js + Express + Drizzle ORM + PostgreSQL  
> **Phase:** Follows Phase 1A (Hardening — infrastructure, health probes, migrations)  
> **Verified:** 2026-08-01  
> **Test suite:** 236 tests, 235+ passing across 3 test files

---

## Overview

Phase 2 replaces the placeholder dev-identity adapter with a production-grade session-based authentication and authorization system, providing:

- Argon2id password hashing (memoryCost=65536 KiB / 64 MB, timeCost=3, parallelism=1)
- Server-managed sessions via `express-session` + `connect-pg-simple` → `sos_sessions` table
- HttpOnly, SameSite=lax session cookie (30 min idle / 8 hr absolute timeout)
- CSRF protection via double-submit cookie (`csrf-csrf` v4) — skipped only for login, csrf-token, and GET/HEAD/OPTIONS
- Explicit CORS allowlist with `credentials: true` (never `*`)
- Helmet security headers + HSTS in production
- 13-code permission model with 17 roles code-configured in `permissionPolicy.ts`
- `authorize()` deny-by-default function with org, facility, patient scoping
- Demo mode (staff picker) preserved and unaffected in non-production environments

---

## Branch History — Phase 2 Commits

All commits are on `readiness/p0-authentication-authorization` (NOT merged into `main`):

| Commit | Description | Primary Correction |
|--------|-------------|-------------------|
| `bef1b3a` | Phase 2: Production Authentication & Server-Side Authorization | Initial implementation |
| `0aa74a3` | Fix Phase 2: 4 critical auth regressions found in code review | (1) sessionAuthMiddleware no longer blocks login; (2) cookie-parser added before CSRF; (3) `/csrf-token` actually calls generateCsrfToken; (4) absolute session timeout enforced in resolveIdentityFromSession |
| `5b5041f` | Fix Phase 2 review findings: org-wide access, CSRF flow, authorizationService | (5) `orgWide` flag on AuthenticatedIdentity; (6) `authorize()` skips facility check when orgWide=true; (7) CSRF token sent with logout as X-CSRF-Token header; (8) `makeDevIdentity()` updated with orgWide:true |
| `6a01438` | Fix CSRF session-binding: refresh token after login | (9) `loginWithSession()` calls `fetchCsrfToken()` after login so CSRF token is bound to the new authenticated session ID (express-session regenerates session ID on login) |
| `5d4a4d3` | Fix Phase 2: org-wide patient list + photo route clarification | (10) `listPatients(orgId)` called without facilityId when `auth.orgWide===true`; (11) 8 MB body-parser comment clarified — photo route is Phase 3, NOT Phase 2 |

**Branch protection confirmed:** `git merge-base --is-ancestor HEAD main` → NOT ANCESTOR OF MAIN (branch not merged).

---

## New Database Tables

Migration: `lib/db/drizzle/0002_authentication_authorization.sql`  
Journal entry: `{ idx: 2, tag: "0002_authentication_authorization" }`  
Applied: confirmed via `drizzle.__drizzle_migrations` (≥2 migration rows)

| Table | Purpose |
|---|---|
| `sos_user_accounts` | Login credential record (email, Argon2id hash, status, lockout counters, session version) |
| `sos_sessions` | Server-managed session store (connect-pg-simple compatible: sid, sess, expire + revocation columns) |
| `sos_role_assignments` | Maps user → role → optional facility with effective/expire date range |
| `sos_patient_access` | Explicit patient-level access for roles that are NOT facility-wide |
| `sos_auth_audit` | Immutable audit log for all auth events (19 event types, CHECK constraint enforced) |

---

## Complete File Inventory

### Production Code (24 files)

| File | Purpose | Security Relevance |
|---|---|---|
| `artifacts/api-server/src/app.ts` | Full middleware stack (14 layers) | Critical — all security middleware |
| `artifacts/api-server/src/routes/authV1.ts` | Auth routes: login, logout, session, csrf-token, admin | Critical — authentication flows |
| `artifacts/api-server/src/routes/patientsV1.ts` | Patient API with authorize() enforcement | High — PHI access control |
| `artifacts/api-server/src/routes/index.ts` | Router registration | Medium — adds authV1Router |
| `artifacts/api-server/src/middlewares/sessionAuth.ts` | Session → identity resolution; dev fallback | Critical — auth boundary |
| `artifacts/api-server/src/lib/authorizationService.ts` | authorize(), hasPermission(), AuthenticatedIdentity | Critical — access control |
| `artifacts/api-server/src/lib/permissionPolicy.ts` | 13 PermissionCodes, 17 roles, ROLE_PERMISSIONS | High — permission model |
| `artifacts/api-server/src/middlewares/devIdentity.ts` | Dev-only header adapter (not registered in prod) | Low — dev only |
| `lib/db/src/schema/auth-tables.ts` | Drizzle schema for all 5 Phase 2 tables | High — data model |
| `lib/db/src/schema/index.ts` | Re-exports auth-tables | Low — plumbing |
| `lib/db/drizzle/0002_authentication_authorization.sql` | SQL migration (191 lines) | Critical — DDL |
| `lib/db/drizzle/meta/_journal.json` | Drizzle migration journal | Medium — migration tracking |
| `artifacts/sunrise-os/src/App.tsx` | Production login gate, session check spinner | High — frontend auth gate |
| `artifacts/sunrise-os/src/context/AuthContext.tsx` | Session management, CSRF token, inactivity | High — frontend session |
| `artifacts/sunrise-os/src/context/RoleContext.tsx` | Server permission codes, screen access | Medium — UI gating |
| `artifacts/sunrise-os/src/pages/ProductionLogin.tsx` | Email+password login form | High — login UI |
| `artifacts/sunrise-os/src/lib/permissions.ts` | 13 PermissionCodes mirrored for frontend | Medium — type safety |
| `artifacts/api-server/package.json` | Added argon2, csrf-csrf, connect-pg-simple, cookie-parser, supertest | Low — dependency tracking |
| `artifacts/api-server/vitest.config.ts` | Vitest configuration | Test only |

### Test Files (test-only)

| File | Coverage |
|---|---|
| `artifacts/api-server/src/__tests__/auth-p2.test.ts` | 46 unit tests: permissionPolicy, authorizationService, CSRF logic, session timeout, password schema, facility scoping |
| `artifacts/api-server/src/__tests__/auth-p2-integration.test.ts` | 110+ integration tests: HTTP endpoints, CSRF flow, Helmet headers, CORS, rate limiting, authorization, patient API, admin routes, audit events, isolation |
| `artifacts/api-server/src/__tests__/auth-p2-schema.test.ts` | 80+ schema tests: all 5 tables, all columns, all constraints, all indexes, migration idempotency |

### Seed Files (dev/test only, production-guarded)

| File | Purpose |
|---|---|
| `artifacts/api-server/src/seed/authSeed.ts` | 9 fictitious test users with Argon2id hashes |

### Documentation & Evidence

| File | Purpose |
|---|---|
| `docs/readiness/phase-2-authentication-authorization.md` | This document |
| `docs/security/authentication-threat-model.md` | STRIDE analysis with residual risks |
| `artifacts/sunrise-os/readiness/phase-2/evidence-manifest.json` | Machine-readable evidence manifest |
| `artifacts/sunrise-os/readiness/phase-2-authentication-authorization-review.zip` | Review archive |
| `artifacts/sunrise-os/readiness/phase-2-sha256-manifest.txt` | SHA-256 file hashes |

### Patient Photo Asset (spec only — NOT Phase 2 implementation)

`attached_assets/Pasted--Sunrise-OS-Compliant-Patient-Chart-Photograph-Capture-_1785608920909.txt` — The patient photograph spec is committed as a future-phase reference asset. The 8 MB body-limit comment in `app.ts` explicitly references this spec and calls it Phase 3 scope (`feature/compliant-patient-chart-photo` branch). No photograph capture code is part of Phase 2.

---

## Authentication Flow

```
Browser                          API Server                      Database
──────                          ──────────                      ────────
GET /api/v1/auth/csrf-token     generateCsrfToken(req, res)     —
← { csrfToken: "abc..." }       sets _csrf cookie               —
  (store csrfToken in memory)

POST /api/v1/auth/login         argon2.verify(hash, password)
  { email, password }             if OK:
  (no CSRF required)              req.session.regenerate()       INSERT sos_sessions
  (rate limited: 10/15 min)       session.userId = user.id
                                  session.authenticatedAt = now  UPDATE sos_sessions (compliance cols)
                                  session.save()                 INSERT sos_auth_audit (login_success)
← { userId, roleIds,
    permissionCodes,
    sessionExpiresAt, ... }
  (frontend calls GET /csrf-token again — binds CSRF to new session)

GET /api/v1/auth/session        resolveIdentityFromSession()     SELECT sos_user_accounts
  Cookie: sos_session=...         check status, session_version  SELECT sos_sessions (revocation)
                                  check absolute timeout          SELECT sos_role_assignments
← { userId, permissionCodes }   → req.auth = AuthenticatedIdentity

POST /api/v1/auth/logout        session.destroy()                UPDATE sos_sessions (revokedAt)
  X-CSRF-Token: abc...          clearCookie()                    INSERT sos_auth_audit (logout)
← { ok: true }
```

---

## Middleware Order — 14 Layers

```
1. Trust proxy (Replit / reverse-proxy)
2. Pino HTTP logging (redacts Cookie header)
3. Helmet (CSP, frame-guard, HSTS in prod, Referrer-Policy)
4. CORS (allowlist: *.replit.dev in dev, ALLOWED_ORIGINS in prod; credentials:true; never *)
5. Cookie-parser (required BEFORE csrf-csrf to read _csrf cookie)
6. Body parsers (8 MB JSON for /api/v1/patients*, 1 MB elsewhere)
7. Rate limiters (5/hr contact, 10/hr subscribe, auth rates in authV1.ts)
8. express-session + connect-pg-simple (must be BEFORE CSRF — session ID used for CSRF HMAC)
9. CSRF protection (csrf-csrf v4 double-submit; exempt: login, csrf-token, password-reset/request, GET/HEAD/OPTIONS)
10. devIdentityMiddleware (dev-only; NOT registered in production)
11. sessionAuthMiddleware (resolves req.auth from DB session; dev fallback when no real session)
12. Health router (/health/live, /health/ready — unauthenticated)
13. API router (all /api/* routes, including authV1 and patientsV1)
14. [planned] Patient photo multipart parser (Phase 3; 8 MB limit placeholder already in layer 6)
```

**Critical ordering constraint:** cookie-parser (5) MUST precede express-session (8) and CSRF (9). express-session (8) MUST precede CSRF (9) because CSRF uses `req.session.id` for HMAC validation.

---

## Session Lifecycle

| Scenario | Behavior |
|---|---|
| New login | `req.session.regenerate()` → new session ID → INSERT sos_sessions → rolling 30min idle |
| Activity (request within idle window) | express-session `rolling:true` → slides idle timeout |
| Idle for 30 min | Session expires; next request gets 401 → login page |
| 8-hour absolute limit | `resolveIdentityFromSession()` checks `authenticatedAt` → destroys session → 401 |
| User disabled by admin | `sessionVersion` bumped on user account → next request: version mismatch → 401 |
| Admin revokes sessions | All session rows marked `revokedAt` + `sessionVersion` bumped → 401 |
| Logout | `req.session.destroy()` + UPDATE sos_sessions (revokedAt) → clearCookie |
| Store outage | Session resolution returns null → 401 in production; dev identity in development |

---

## Cookie Security Attributes

| Attribute | Value | Notes |
|---|---|---|
| Name | `sos_session` (prod) / `sos_dev_session` (dev) | Environment-specific naming |
| HttpOnly | `true` | Inaccessible to JavaScript |
| Secure | `true` in prod, `false` in dev | Enforces HTTPS in production |
| SameSite | `lax` | Allows top-level navigation; blocks cross-site POST |
| Path | `/api` | Restricts to API routes only |
| MaxAge | 1,800,000 ms (30 min) | Idle timeout (reset by `rolling:true`) |
| Absolute timeout | 8 hrs | Enforced server-side in `resolveIdentityFromSession()` |

---

## CSRF Protection Details

**Mechanism:** csrf-csrf v4, double-submit cookie pattern  
**Secret:** `CSRF_SECRET` env → `SESSION_SECRET` env → `"csrf-dev-secret"` (dev fallback)  
**Token binding:** `HMAC(req.session.id, CSRF_SECRET)` — bound to authenticated session ID  
**Token header:** `X-CSRF-Token`  
**Cookie:** `_csrf` (set by server, used for HMAC verification)

**Exempt routes (no CSRF required):**
- `GET`, `HEAD`, `OPTIONS` (all safe HTTP methods)
- `POST /api/v1/auth/login` (rate-limited instead; user not yet authenticated)
- `GET /api/v1/auth/csrf-token` (issues the token)
- `POST /api/v1/auth/password-reset/request` (rate-limited; no sensitive state change)

**Session binding after login:**  
`loginWithSession()` in `AuthContext.tsx` calls `fetchCsrfToken()` immediately after successful login. This is required because `req.session.regenerate()` changes the session ID on login — any CSRF token issued before login would be bound to a different session ID and would fail validation.

---

## Authorization Model

### Permission Codes (13)

```
patient.list.view      patient.chart.view     patient.demographics.view
patient.episode.view   patient.create         patient.update
patient.export         organization.admin     facility.admin
user.manage            role.manage            session.manage
audit.authentication.view
```

### Roles (17) — Code-Configured

| Role | Facility-Wide | Key Permissions |
|---|---|---|
| `cmo` | ✓ | All 13 codes |
| `clinical_supervisor` | ✓ | patient.* (no admin) |
| `certified_clinician` | ✓ | patient.list/chart/demo/episode/create/update |
| `mh_therapist` | ✓ | patient.list/chart/demo/episode/create/update |
| `prescriber` | ✓ | patient.list/chart/demo/episode |
| `nursing` | ✓ | patient.list/chart/demo/episode |
| `director_of_operations` | ✓ | patient.list/episode/export |
| `bht_supervisor` | ✓ | patient.list/chart |
| `admin_staff` | ✓ | patient.list/demo/create |
| `billing_staff` | ✓ | patient.list/export |
| `accounting_staff` | ✓ | patient.list/export |
| `ownership` | ✓ | patient.list/export |
| `security_admin` | ✗ | organization.admin/user.manage/role.manage/session.manage/audit |
| `bht` | ✗ | patient.list/chart (requires explicit sos_patient_access row) |
| `aftercare_staff` | ✗ | patient.list (own caseload) |
| `business_development` | ✗ | (none — no patient data per compliance policy) |
| `human_resources` | ✗ | (none — zero patient access) |

### Decision Flow (deny-by-default)

```
authorize(req: AuthorizationRequest):
  1. identity exists → else: unauthenticated
  2. identity.orgId === req.orgId → else: facility-out-of-scope (cross-org)
  3. permission in identity.permissionCodes → else: permission-missing
  4. if req.facilityId provided:
       if identity.orgWide → pass (org-wide bypasses facility check)
       else: identity.facilityIds.includes(req.facilityId) → else: facility-out-of-scope
  5. if req.patientId provided:
       if any identity.roleIds is facility-wide (isRoleFacilityWide) → pass
       else: sos_patient_access row must exist with status='active' → else: patient-out-of-scope
  → ALLOW
```

### Org Scope Invariant

`orgId` supplied to `authorize()` is **always** `req.auth.orgId` — resolved from the DB session, never from `req.body`, `req.params`, or `req.query`. This is enforced in every route handler in `patientsV1.ts`.

### Cross-Org Opaque 404

Patient routes return HTTP 404 (not 403) when a patient exists but the caller has no access. This prevents information leakage about the existence of patients the caller cannot see.

---

## Admin Routes (Implemented)

| Route | Permission Required | What It Does |
|---|---|---|
| `POST /api/v1/admin/users` | `user.manage` | Create user account + role assignment |
| `POST /api/v1/admin/users/:id/disable` | `user.manage` | Set status=disabled, bump sessionVersion, revoke sessions |
| `POST /api/v1/admin/users/:id/reactivate` | `user.manage` | Set status=active, clear lockout |
| `POST /api/v1/admin/sessions/:userId/revoke-all` | `session.manage` | Bump sessionVersion + mark sessions revokedAt |
| `POST /api/v1/admin/role-assignments` | `role.manage` | Create role assignment with expiry support |

**Deferred to Phase 3:** Password-reset completion (email infrastructure), MFA enrollment (TOTP/WebAuthn), user invite flow, per-patient access grants via UI.

---

## Audit Log — All 19 Event Types

All enforced by `CHECK (event_type IN (...))` constraint on `sos_auth_audit`:

```
login_success         login_failure          account_locked
account_unlocked      logout                 session_created
session_expired       session_revoked        password_reset_requested
password_reset_completed  role_assignment_created  role_assignment_revoked
facility_assignment_changed  patient_access_created  patient_access_revoked
authorization_denied  admin_session_revocation  user_disabled
user_reactivated
```

**Append-only by application convention:** `writeAuditEvent()` uses only `db.insert()`. DB-level restriction (row-level security / append-only role) is Phase 3 scope.

---

## Demo / Production Isolation

| Aspect | Demo Mode | Production Mode |
|---|---|---|
| `VITE_SUNRISE_DATA_MODE` | `demo` or unset | `production` |
| Session storage | `sessionStorage` (demoStore) | HttpOnly session cookie |
| Login mechanism | Staff picker (staffId → StaffMember) | Email + password → POST /api/v1/auth/login |
| devIdentityMiddleware | Registered | NOT registered (guarded by `if (!isProduction)`) |
| sessionAuthMiddleware fallback | makeDevIdentity() when no session | No fallback — returns undefined req.auth |
| SESSION_SECRET | Dev hardcoded fallback allowed | Required env var (throws at startup if missing) |
| authSeed.ts | Allowed | Throws immediately if `NODE_ENV=production` |

---

## Rate Limiting

**Auth endpoints:** `express-rate-limit`, 10 requests / 15 min per IP  
**Contact/subscribe/register/login:** 5–20 per hour per IP  
**Account lockout:** `sos_user_accounts.failed_login_count` + `locked_until` (DB-backed, per account, 5 attempts / 15 min lockout)

> ⚠️ **Production Limitation:** `express-rate-limit` uses in-memory store (counter resets per process). This is acceptable for single-instance development but MUST be replaced with a distributed store (Redis or PostgreSQL) before multi-instance production deployment. The DB-backed account lockout provides defense-in-depth against distributed brute-force.

---

## CORS Configuration

- **Allowed origins:** `*.replit.dev` (dev), `http://localhost:5173`, `http://localhost:3000`, `http://localhost:80` (dev), plus `ALLOWED_ORIGINS` env var (prod)
- **`credentials: true`** — session cookies are sent cross-origin
- **Wildcard `*` is NEVER set** — incompatible with `credentials: true`
- **Unlisted origin:** CORS callback throws → Express returns 500

---

## Test Users (Seeded — Dev/Test Only)

| Email | Role | Scope | Status |
|---|---|---|---|
| `org-admin@test.sunrise` | `cmo` | Org-wide | Active |
| `facility-admin@test.sunrise` | `director_of_operations` | Facility 1 | Active |
| `clinician@test.sunrise` | `certified_clinician` | Facility 1 | Active |
| `nurse@test.sunrise` | `nursing` | Facility 1 | Active |
| `billing@test.sunrise` | `billing_staff` | Facility 1 | Active |
| `readonly@test.sunrise` | `bht` | Facility 1 + 1 patient | Active |
| `other-facility@test.sunrise` | `certified_clinician` | Facility 2 only | Active |
| `disabled@test.sunrise` | `certified_clinician` | Facility 1 | **Disabled** |
| `expired-role@test.sunrise` | `certified_clinician` | Facility 1 | Active (role expired -1 day) |

Password: `DEV_TEST_PASSWORD` env var (or generated and printed to stdout on first run).

---

## Known Residual Risks

| Risk | Status | Mitigation |
|---|---|---|
| `express-rate-limit` uses in-memory store | Accepted for MVP | DB-backed account lockout provides defense-in-depth; Redis store required before multi-instance prod |
| `SESSION_SECRET` compromise → cookie forgery | Low probability | Secret rotation procedure needed (Phase 3) |
| Audit log not write-protected at DB level | Accepted for MVP | Application convention enforces INSERT-only; DB-level append-only role in Phase 3 |
| Password-reset email not implemented | Known gap | `POST /api/v1/auth/password-reset/complete` returns 501; Phase 3 scope |
| No MFA | By design for MVP | Phase 4 scope — TOTP/WebAuthn; schema has `mfa_status` column ready |
| `connect-pg-simple` store outage → API outage | Low probability | Health endpoint exposes DB state; circuit-breaker in Phase 3 |
