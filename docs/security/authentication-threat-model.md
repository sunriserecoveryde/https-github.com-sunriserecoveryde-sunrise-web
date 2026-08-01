# Authentication Threat Model — Sunrise OS

> **Scope:** Phase 2 Production Authentication  
> **Date:** 2026-08-01  
> **Framework:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## Assets Under Protection

| Asset | Sensitivity | Notes |
|---|---|---|
| Patient PHI (chart data) | Critical | HIPAA-regulated; breach → reportable incident |
| Session cookies | High | Bearer credential; theft = full impersonation |
| Password hashes | High | Exposure enables offline attack |
| `sos_sessions` table | High | Row deletion = forced logout of all users |
| `sos_auth_audit` log | Medium | Tampering hides attacker activity |
| Admin endpoints | Medium | Disabling accounts, revoking sessions |

---

## STRIDE Threat Analysis

### S — Spoofing

| Threat | Control |
|---|---|
| Attacker authenticates as another user | Argon2id (64 MB) makes preimage computation infeasible; constant-time verify prevents timing oracle |
| Session cookie theft (XSS) | HttpOnly cookie: inaccessible to JavaScript |
| Session fixation | `req.session.regenerate()` on every successful login |
| Cookie theft via MITM | Secure flag in production; HSTS 1 year |

### T — Tampering

| Threat | Control |
|---|---|
| CSRF: forged state-changing request | Double-submit CSRF cookie; all POST/PUT/DELETE require `X-CSRF-Token` (except login/public) |
| Session store row modification | `sos_sessions` accessible only via API server (no direct DB grants to frontend) |
| Replay of expired session | Session version stored in session cookie; DB version checked on every request |

### R — Repudiation

| Threat | Control |
|---|---|
| User denies logging in | `sos_auth_audit.event_type = "login_success"` with IP, UA, timestamp |
| Admin denies disabling account | Audit rows for `user_disabled`, `admin_session_revocation` with acting user ID |
| Failed login attempts not logged | `login_failure` event logged (with reason code but NOT with password hint) |

### I — Information Disclosure

| Threat | Control |
|---|---|
| User enumeration via login response | Identical response body and timing for valid/invalid email/password |
| Session ID in logs | pino `redact: ["req.headers.cookie"]` prevents cookie logging |
| PHI in error responses | Patient routes return opaque 404 for cross-org/cross-facility; no field details in errors |
| Password hash in API response | `passwordHash` field never included in any API response |
| CORS data leak | Explicit allowlist; wildcard `*` never set |

### D — Denial of Service

| Threat | Control |
|---|---|
| Brute-force login | 10 requests / 15 min per IP on `POST /api/v1/auth/login` |
| Account lockout abuse | Failed-login counter + lockout only applied server-side; lockout visible to attacker-controlled identity only (silent per spec) |
| Session store exhaustion | Hourly prune of expired sessions via `connect-pg-simple` `pruneSessionInterval` |
| Large body DoS | 8 MB JSON limit on patient routes; `express.json()` default (1 MB) on all others |

### E — Elevation of Privilege

| Threat | Control |
|---|---|
| Horizontal escalation: access another patient | `authorize()` checks patient access row or facility-wide role before returning data; 404 (not 403) on mismatch |
| Vertical escalation: clinician reads admin endpoints | `requirePermission()` middleware; `user.manage` required for admin routes |
| Cross-org access | `org_id` from session only (never from request body or header); route rejects if session org ≠ resource org |
| Disabled account re-authentication | `status === "disabled"` check in login flow; session version bump revokes all existing sessions |
| Role expiry bypass | `expires_at` checked in `sessionAuthMiddleware` on every request |

---

## Residual Risks

| Risk | Likelihood | Impact | Mitigation Status |
|---|---|---|---|
| Compromised `SESSION_SECRET` → forge cookies | Low (env var protected) | Critical | Secret rotation procedure needed (Phase 3) |
| `connect-pg-simple` store unavailable (DB down) → API outage | Low | High | Health endpoint exposes DB state; circuit-breaker in Phase 3 |
| Password-reset email not yet implemented | Confirmed | Medium | Phase 3 — `POST /api/v1/auth/password-reset/complete` returns 501 |
| No multi-factor authentication | By design for MVP | Medium | Phase 4 scope — TOTP/WebAuthn |
| Audit log not write-protected at DB level | Accepted for MVP | Medium | Phase 3 — row-level security + append-only role |

---

## Security Test Cases

| ID | Scenario | Expected Result |
|---|---|---|
| AUTH-01 | Login with valid credentials | 200, session cookie set, no token in body |
| AUTH-02 | Login with wrong password | 401, generic message, audit row created |
| AUTH-03 | Login for disabled account | 401, generic message, `user_disabled` audit reason |
| AUTH-04 | Login after 10 attempts in 15 min | 429, rate limit header present |
| AUTH-05 | Access patient data without session cookie | 401 |
| AUTH-06 | Access patient data from different org | 404 (not 403 — opaque) |
| AUTH-07 | Access patient in different facility | 404 |
| AUTH-08 | POST /patients without X-CSRF-Token | 403 `ForbiddenError` |
| AUTH-09 | Admin disables user → existing session revoked | next request returns 401 |
| AUTH-10 | Session older than 8 hours → rejected | 401, client shows login |
| AUTH-11 | Expired role assignment → permission denied | 403 |
| AUTH-12 | No token written to localStorage or sessionStorage | Verified in unit tests |
| AUTH-13 | Login response body contains no passwordHash field | Verified |
| AUTH-14 | CORS: request from unlisted origin rejected | 403 CORS error |
| AUTH-15 | CORS: request from listed Replit dev domain passes | 200 |
