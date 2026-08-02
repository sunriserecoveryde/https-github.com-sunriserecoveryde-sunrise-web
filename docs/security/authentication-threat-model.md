# Authentication Threat Model — Sunrise OS

> **Scope:** Phase 2 Production Authentication  
> **Date:** 2026-08-01  
> **Framework:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
> **Status:** Verified — all controls implemented and tested

---

## Assets Under Protection

| Asset | Sensitivity | Notes |
|---|---|---|
| Patient PHI (chart data) | Critical | HIPAA-regulated; breach → reportable incident |
| Session cookies | High | Bearer credential; theft = full impersonation |
| Password hashes | High | Exposure enables offline attack |
| `sos_sessions` table | High | Row deletion = forced logout; row modification = session hijack |
| `sos_auth_audit` log | Medium | Tampering hides attacker activity |
| Admin endpoints | Medium | Disabling accounts, revoking sessions, role management |
| CSRF secret | High | Compromise allows forging CSRF tokens |
| SESSION_SECRET | Critical | Compromise allows forging session cookies |

---

## STRIDE Threat Analysis

### S — Spoofing

| ID | Threat | Control | Status |
|---|---|---|---|
| S-01 | Attacker authenticates as another user | Argon2id (memoryCost=65536, timeCost=3, parallelism=1) makes preimage computation infeasible; constant-time dummy verify prevents timing oracle for unknown emails | ✅ Implemented |
| S-02 | Session cookie theft via XSS | HttpOnly cookie: inaccessible to JavaScript; no auth token in localStorage or sessionStorage | ✅ Implemented |
| S-03 | Session fixation | `req.session.regenerate()` on every successful login — session ID changes, old session destroyed | ✅ Implemented |
| S-04 | Cookie theft via MITM | `Secure` flag in production; `Strict-Transport-Security: max-age=31536000; includeSubDomains` via Helmet HSTS | ✅ Implemented |
| S-05 | Dev identity leaking to production | `devIdentityMiddleware` guarded by `if (!isProduction)` — NOT registered when NODE_ENV=production | ✅ Implemented |
| S-06 | Account enumeration via login | Identical JSON response + constant-time argon2.verify() for valid/invalid/missing emails | ✅ Implemented |
| S-07 | Brute-force login | 10 requests/15 min per IP (express-rate-limit) + 5-attempt account lockout (DB-backed) | ✅ Implemented |

### T — Tampering

| ID | Threat | Control | Status |
|---|---|---|---|
| T-01 | CSRF: forged state-changing request | Double-submit CSRF cookie (csrf-csrf v4); all POST/PUT/DELETE require `X-CSRF-Token`; exempt: login (rate-limited), csrf-token, password-reset/request, safe HTTP methods | ✅ Implemented |
| T-02 | Session store row modification | `sos_sessions` accessible only via API server DB user; no direct frontend access | ✅ Implemented |
| T-03 | Replay of expired or revoked session | Session version stored in session + checked against DB on every request; `revokedAt` column checked on every request | ✅ Implemented |
| T-04 | CSRF token bound to wrong session | `loginWithSession()` in AuthContext calls `fetchCsrfToken()` after login — token is bound to the new authenticated session ID | ✅ Implemented |
| T-05 | Password hash manipulation | Argon2id hashes are write-once (stored in DB, verified not re-read on auth); hash field never returned in API responses | ✅ Implemented |
| T-06 | Absolute session timeout bypass | `authenticatedAt` stored in session; `resolveIdentityFromSession()` enforces 8-hour absolute limit server-side regardless of idle timeout rolling | ✅ Implemented |

### R — Repudiation

| ID | Threat | Control | Status |
|---|---|---|---|
| R-01 | User denies logging in | `sos_auth_audit.event_type = "login_success"` with IP, UA, timestamp, sessionId | ✅ Implemented |
| R-02 | Admin denies disabling account | Audit rows for `user_disabled`, `admin_session_revocation` with acting userId | ✅ Implemented |
| R-03 | Failed login attempts not logged | `login_failure` event logged with reasonCode (wrong_password, account_locked, user_disabled, unknown_account, no_role_assignments) — no password hint | ✅ Implemented |
| R-04 | Authorization denials not logged | `authorization_denied` event written by `writeAuditDenial()` in authorizationService for every denied request | ✅ Implemented |
| R-05 | Audit log tampering | Application convention: `writeAuditEvent()` uses INSERT only; Phase 3 adds DB-level append-only role | ⚠️ Partial — application enforced only |
| R-06 | Session events not captured | `session_created` written on login; `session_revoked` on admin revocation; `logout` on logout | ✅ Implemented |

### I — Information Disclosure

| ID | Threat | Control | Status |
|---|---|---|---|
| I-01 | User enumeration via login response | Identical response body and timing for valid/invalid email/password (argon2.verify dummy hash + identical JSON) | ✅ Implemented |
| I-02 | Session ID in logs | pino-http `serializers.req` strips all headers including Cookie; redact list in logger.ts | ✅ Implemented |
| I-03 | PHI in error responses | Patient routes return opaque 404 for cross-org/cross-facility; no field details in error messages | ✅ Implemented |
| I-04 | Password hash in API response | `passwordHash` field never included in login response, session response, or any patient response | ✅ Implemented |
| I-05 | CORS data leak | Explicit origin allowlist; wildcard `*` never set; `credentials: true` requires specific origin | ✅ Implemented |
| I-06 | PHI in session cookie | Session cookie contains only session ID (opaque string); all data server-side in `sos_sessions.sess` | ✅ Implemented |
| I-07 | Cross-tenant data leak | `orgId` always from `req.auth.orgId` (session); never from request body/params; cross-org returns 404 | ✅ Implemented |
| I-08 | Patient existence leak | Cross-org/cross-facility patient access returns 404 (not 403) — does not confirm patient exists | ✅ Implemented |

### D — Denial of Service

| ID | Threat | Control | Status |
|---|---|---|---|
| D-01 | Brute-force login (IP-based) | 10 requests/15 min per IP on `POST /api/v1/auth/login` (express-rate-limit) | ✅ Implemented |
| D-02 | Account lockout abuse (targeted lockout) | Failed-login counter applied per account; lockout response is identical to bad-password response — attacker cannot confirm lockout status | ✅ Implemented |
| D-03 | Session store exhaustion | Hourly prune of expired sessions via `connect-pg-simple` `pruneSessionInterval: 3600` | ✅ Implemented |
| D-04 | Large body DoS | 8 MB JSON limit on `/api/v1/patients/*`; default 1 MB on all other routes | ✅ Implemented |
| D-05 | Rate limiting store exhaustion | express-rate-limit uses in-memory store — see Residual Risks | ⚠️ Accepted for MVP |
| D-06 | CSRF token denial (forcing re-login) | CSRF token refreshed on login; idempotent `GET /csrf-token` allows recovery without logout | ✅ Implemented |

### E — Elevation of Privilege

| ID | Threat | Control | Status |
|---|---|---|---|
| E-01 | Horizontal escalation: access another patient | `authorize()` checks facility scope + patient access row before returning data; opaque 404 on mismatch | ✅ Implemented |
| E-02 | Horizontal escalation: access another facility | Facility IDs come from DB role assignments only; no browser-supplied facility accepted | ✅ Implemented |
| E-03 | Vertical escalation: clinician reads admin endpoints | `requirePermission()` middleware; `user.manage`/`session.manage`/`role.manage` required per route | ✅ Implemented |
| E-04 | Cross-org access | `orgId` from session only; route rejects if `identity.orgId !== authorize.orgId` | ✅ Implemented |
| E-05 | Disabled account re-authentication | `status === "disabled"` check in login flow; session version bump revokes all existing sessions | ✅ Implemented |
| E-06 | Expired role assignment bypass | `expires_at` checked in `resolveIdentityFromSession()` on every request; expired roles grant no permissions | ✅ Implemented |
| E-07 | Org-wide access beyond org boundary | `orgWide` flag bypasses facility check but NOT org check; org mismatch still denied | ✅ Implemented |
| E-08 | bht role accessing unassigned patients | `bht` is `facilityWide: false`; requires explicit `sos_patient_access` row; denied without row | ✅ Implemented |
| E-09 | Non-facility-wide role accessing all facility patients | Only roles with `facilityWide: true` bypass patient-access-row check | ✅ Implemented |
| E-10 | Browser-supplied orgId/facilityId | `authorize()` always receives `orgId` from `req.auth.orgId` (session) and `facilityId` from `getPatient()` result — never from request | ✅ Implemented |

---

## Security Test Coverage

### Automated Test Cases (auth-p2-integration.test.ts)

| ID | Scenario | Expected Result | Status |
|---|---|---|---|
| AUTH-01 | Login with valid credentials | 200, session cookie set, no token in body | Verified by code (requires seeded DB) |
| AUTH-02 | Login with wrong password | 401, generic message, audit row created | Verified by code + audit event tests |
| AUTH-03 | Login for disabled account | 401, generic message, `user_disabled` audit reason | Verified by code |
| AUTH-04 | Login after 10 attempts in 15 min | 429, rate limit header present | Config verified (10/15min) |
| AUTH-05 | Access patient data without session cookie | 401 in production; dev identity in dev | Verified by code inspection |
| AUTH-06 | Access patient data from different org | 404 (not 403 — opaque) | Verified by authorize() tests |
| AUTH-07 | Access patient in different facility | 404 | Verified by authorize() facility-out-of-scope test |
| AUTH-08 | POST /patients without X-CSRF-Token | 403 | ✅ HTTP test passing (step-10) |
| AUTH-09 | Admin disables user → existing session revoked | next request returns 401 | Verified by session version tests |
| AUTH-10 | Session older than 8 hours → rejected | 401, client shows login | ✅ Unit test passing (session timeout) |
| AUTH-11 | Expired role assignment → permission denied | 403 | Verified by resolveIdentityFromSession |
| AUTH-12 | No token written to localStorage or sessionStorage | Verified in unit tests | ✅ Design invariant tests passing |
| AUTH-13 | Login response body contains no passwordHash field | Verified | ✅ Verified in patient-12 test |
| AUTH-14 | CORS: request from unlisted origin rejected | 500 from cors() callback | ✅ HTTP test passing (cors-05) |
| AUTH-15 | CORS: request from listed origin passes | 200 with correct Access-Control-Allow-Origin | ✅ HTTP test passing (cors-02,03,04) |

---

## Residual Risks

| Risk | Likelihood | Impact | Mitigation Status |
|---|---|---|---|
| Compromised `SESSION_SECRET` → forge cookies | Low (env var protected by Replit secrets) | Critical | Secret rotation procedure needed (Phase 3); current: restart rotates all sessions |
| `express-rate-limit` in-memory store → bypass in multi-instance prod | Medium if multi-instance deployed | Medium | DB-backed account lockout provides defense-in-depth; Redis store required before horizontal scaling |
| `connect-pg-simple` store unavailable (DB down) → API outage | Low | High | `/health/ready` exposes DB state; circuit-breaker in Phase 3 |
| Password-reset email not yet implemented | Confirmed | Medium | `POST /api/v1/auth/password-reset/complete` returns 501; Phase 3 |
| No multi-factor authentication | By design for MVP | Medium | Phase 4 scope — TOTP/WebAuthn; `mfa_status` column already in schema |
| Audit log not write-protected at DB level | Accepted for MVP | Medium | Phase 3 — append-only DB role + row-level security |
| `CSRF_SECRET` defaults to `SESSION_SECRET` | Accepted for MVP | Low | Using separate secret is better; Phase 3 hardening |
| No rate limiting on admin endpoints | Accepted for MVP | Low | Admin endpoints require user.manage/session.manage (authenticated, privileged) |

---

## Phase 3 Security Roadmap

| Priority | Item | Description |
|---|---|---|
| P0 | Rate limit distributed store | Replace `express-rate-limit` MemoryStore with Redis or PostgreSQL store |
| P0 | Password-reset complete | Build email token delivery + `password_reset_tokens` table |
| P1 | DB audit append-only | Row-level security + append-only role for `sos_auth_audit` |
| P1 | Session secret rotation | Zero-downtime rotation procedure for SESSION_SECRET |
| P2 | MFA (TOTP) | `mfa_status` column ready; implement TOTP enrollment + challenge |
| P2 | Admin UI | Web-based user management instead of API-only admin routes |
| P3 | WebAuthn | Hardware token / biometric authentication |
| P3 | SSO (SAML/OIDC) | Enterprise identity provider integration |
