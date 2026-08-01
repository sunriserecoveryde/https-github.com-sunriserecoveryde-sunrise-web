# Phase 2 — Production Authentication & Server-Side Authorization

> **Status:** Implemented  
> **Branch:** `readiness/p0-authentication-authorization`  
> **Stack:** Node.js + Express + Drizzle ORM + PostgreSQL  
> **Phase:** Follows Phase 1A (Hardening — infrastructure, health probes, migrations)

---

## Overview

Phase 2 replaces the placeholder dev-identity adapter with a production-grade session-based authentication and authorization system, providing:

- Argon2id password hashing (64 MB memory, t=3, p=1)
- Server-managed sessions via `express-session` + `connect-pg-simple` → `sos_sessions` table
- HttpOnly, SameSite=lax session cookie (30 min idle / 8 hr absolute timeout)
- CSRF protection via double-submit cookie (`csrf-csrf` v4) — skipped only for login, csrf-token, and GET/HEAD/OPTIONS
- Explicit CORS allowlist with `credentials: true`
- Helmet security headers + HSTS in production
- 13-code permission model with 17 roles code-configured in `permissionPolicy.ts`
- `authorize()` deny-by-default function with org, facility, patient scoping
- Demo mode (staff picker) preserved and unaffected

---

## New Database Tables

Migration: `lib/db/drizzle/0002_authentication_authorization.sql`

| Table | Purpose |
|---|---|
| `sos_user_identity_refs` | Org-namespaced stable ID for each user; survives email changes |
| `sos_user_accounts` | Login credential record (email, argon2 hash, status, lockout counters) |
| `sos_sessions` | Server-managed session store (used by `connect-pg-simple`); includes expiry, revocation, and session-version fields |
| `sos_role_assignments` | Maps user → role → optional facility with effective/expire date range |
| `sos_patient_access` | Explicit patient-level access for roles that are not facility-wide |
| `sos_auth_audit` | Immutable audit log for login, logout, password changes, admin actions |

---

## Authentication Flow

```
Browser                          API Server                      Database
──────                          ──────────                      ────────
POST /api/v1/auth/login
  { email, password }
  (no CSRF required — rate-limited)
                                argon2.verify(passwordHash)
                                  if OK → regenerate session     INSERT sos_sessions
                                  set session.userId             (sid, sess, expire)
                                  return 200 {userId, roles, …}
  Set-Cookie: sos_session=…
  (HttpOnly; SameSite=lax; Secure in prod)

Subsequent requests (include credentials)
  Cookie: sos_session=…
                                sessionAuthMiddleware
                                  load user + roles from DB
                                  check session_version matches
                                  attach req.auth (AuthenticatedIdentity)
                                
  POST /api/v1/patients (state-changing)
    X-CSRF-Token: <token>       doubleCsrfProtection validates HMAC
```

---

## Permission Codes (13)

```
patient.list.view       patient.chart.view      patient.demographics.view
patient.episode.view    patient.create          patient.update
patient.export          organization.admin      facility.admin
user.manage             role.manage             session.manage
audit.authentication.view
```

Permission codes are defined in:
- **Server:** `artifacts/api-server/src/lib/permissionPolicy.ts`
- **Frontend:** `artifacts/sunrise-os/src/lib/permissions.ts`

---

## Role → Permission Map

Configured in `permissionPolicy.ts`. 17 roles including:

| Role | Facility-wide? | Key permissions |
|---|---|---|
| `cmo` | ✅ | all |
| `director_of_operations` | ✅ | all except `organization.admin` |
| `certified_clinician` | ❌ | chart, episode, create, update, export |
| `nursing` | ❌ | chart, episode, MAR-related |
| `billing_staff` | ❌ | list, export, revenue-cycle |
| `bht` | ❌ | list only |
| `compliance_officer` | ✅ | audit, compliance read |

---

## API Endpoints

### Auth (public)

| Method | Path | Rate limit |
|---|---|---|
| `POST` | `/api/v1/auth/login` | 10/15 min |
| `POST` | `/api/v1/auth/logout` | — |
| `GET` | `/api/v1/auth/session` | — |
| `GET` | `/api/v1/auth/csrf-token` | — |
| `POST` | `/api/v1/auth/password-reset/request` | 5/hour |
| `POST` | `/api/v1/auth/password-reset/complete` | (stub, 501) |

### Admin (require `user.manage` or `session.manage`)

| Method | Path |
|---|---|
| `POST` | `/api/v1/admin/users` |
| `POST` | `/api/v1/admin/users/:id/disable` |
| `POST` | `/api/v1/admin/users/:id/reactivate` |
| `POST` | `/api/v1/admin/sessions/:userId/revoke-all` |
| `POST` | `/api/v1/admin/role-assignments` |

---

## Security Properties

### Session Cookie
- Name: `sos_session` (production) / `sos_dev_session` (development)
- HttpOnly: ✅ (inaccessible to JavaScript)
- Secure: ✅ in production
- SameSite: `lax`
- Path: `/api` (not leaked on non-API requests)
- Idle timeout: 30 minutes (rolling — reset on activity)
- Absolute timeout: 8 hours (checked server-side via `createdAt` in `sos_sessions`)

### Session Version Invalidation
Each `sos_user_accounts` row has a `session_version` integer. Sessions store the version at creation time. If an admin disables a user or revokes all sessions, the version is incremented. The `sessionAuthMiddleware` rejects sessions whose stored version doesn't match.

### CSRF
- Strategy: double-submit cookie (`csrf-csrf` v4)
- Token cookie: `_csrf` (readable by JS; SameSite=lax prevents cross-origin reads)
- Header: `X-CSRF-Token`
- Exempt: GET/HEAD/OPTIONS, login, csrf-token, password-reset/request
- Secret: from `CSRF_SECRET` env var (falls back to `SESSION_SECRET`)

### Password Hashing
- Algorithm: Argon2id
- Memory: 64 MB
- Time: 3 iterations
- Parallelism: 1
- Constant-time verification (dummy hash used when user not found)

### CORS
- Explicit allowlist: `REPLIT_DEV_DOMAIN`, `ALLOWED_ORIGINS` env var, localhost in dev
- `credentials: true`
- No wildcard `*` origin in production

### Helmet Headers
- `Content-Security-Policy` — restricts script/style/connect sources
- `Strict-Transport-Security` — 1 year, includeSubDomains (production only)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy`
- `X-Content-Type-Options: nosniff`

---

## Frontend Integration

### Demo Mode (unchanged)
`VITE_SUNRISE_DATA_MODE=demo` → staff picker login → session in `sessionStorage`. No server calls.

### Production Mode
`VITE_SUNRISE_DATA_MODE=production`:
1. On mount: `GET /api/v1/auth/session` → 200 (already logged in) or 401 (show login page)
2. Login: `ProductionLogin` component → `POST /api/v1/auth/login`
3. Token storage: **none** — session established via HttpOnly cookie only
4. Logout: `POST /api/v1/auth/logout` → server revokes session
5. Session expiry polling: every 60 seconds, checks `GET /api/v1/auth/session`; 401 → auto-logout

### Permission Codes in UI
`useRole().hasServerPermission(code)` checks server-granted codes for navigation gating and button visibility. The server always re-enforces before returning data.

---

## Test Users (Development Only)

Provisioned by: `pnpm --filter @workspace/api-server run seed:auth`

| Email | Role | Notes |
|---|---|---|
| `org-admin@test.sunrise` | `cmo` | All permissions |
| `facility-admin@test.sunrise` | `director_of_operations` | Facility 1 |
| `clinician@test.sunrise` | `certified_clinician` | Facility 1 |
| `nurse@test.sunrise` | `nursing` | Facility 1 |
| `billing@test.sunrise` | `billing_staff` | Facility 1 |
| `readonly@test.sunrise` | `bht` | Explicit patient access row |
| `other-facility@test.sunrise` | `certified_clinician` | Facility 2 only |
| `disabled@test.sunrise` | — | Account disabled |
| `expired-role@test.sunrise` | `certified_clinician` | Role expired yesterday |

Password: set via `DEV_TEST_PASSWORD` env var.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes (prod) | HMAC secret for session signing |
| `CSRF_SECRET` | No | CSRF HMAC secret (falls back to `SESSION_SECRET`) |
| `ALLOWED_ORIGINS` | Prod | Comma-separated production CORS origins |
| `SESSION_IDLE_TIMEOUT_MS` | No | Default: 1800000 (30 min) |
| `SESSION_ABSOLUTE_TIMEOUT_MS` | No | Default: 28800000 (8 hr) |
| `DEV_TEST_PASSWORD` | Dev | Password for test user seed |

---

## Files Changed

### New
- `lib/db/drizzle/0002_authentication_authorization.sql`
- `lib/db/src/schema/auth-tables.ts`
- `artifacts/api-server/src/lib/permissionPolicy.ts`
- `artifacts/api-server/src/lib/authorizationService.ts`
- `artifacts/api-server/src/middlewares/sessionAuth.ts`
- `artifacts/api-server/src/routes/authV1.ts`
- `artifacts/api-server/src/seed/authSeed.ts`
- `artifacts/sunrise-os/src/pages/ProductionLogin.tsx`
- `artifacts/sunrise-os/src/lib/permissions.ts`
- `docs/readiness/phase-2-authentication-authorization.md` (this file)
- `docs/security/authentication-threat-model.md`

### Modified
- `artifacts/api-server/src/app.ts` (session, CSRF, helmet, CORS, sessionAuthMiddleware)
- `artifacts/api-server/src/routes/index.ts` (authV1Router)
- `artifacts/api-server/src/routes/patientsV1.ts` (req.auth + authorize())
- `artifacts/sunrise-os/src/context/AuthContext.tsx` (production session flow)
- `artifacts/sunrise-os/src/context/RoleContext.tsx` (serverPermissionCodes)
- `lib/db/src/schema/index.ts` (auth-tables export)
- `lib/db/drizzle/meta/_journal.json` (migration entry)

---

## Known Limitations (Phase 3 Scope)

- `POST /api/v1/auth/password-reset/complete` returns 501 — full implementation requires transactional email
- Multi-tenant org selector: currently login matches email across all orgs; Phase 3 adds subdomain routing
- `lib/shared-permissions` package (wired as workspace dep) — currently permission codes are duplicated in server + frontend; Phase 3 consolidates to a shared package
- Compliance officer can request audit logs but no audit export API endpoint yet
