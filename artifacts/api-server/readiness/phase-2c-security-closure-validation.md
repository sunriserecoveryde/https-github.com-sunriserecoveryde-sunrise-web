# Phase 2C — Final Security Closure Validation Report

**Branch:** `readiness/p0-phase-2c-security-closure`
**Date:** 2026-08-02
**Test run:** 372/372 passed (0 failures, 0 skipped)
**Build:** Clean (no TypeScript errors)

---

## §1 — Field-level patient DTO projection (repository + per-patient response)

| Check | Result |
|---|---|
| `PatientQueryTier` exported from patientRepo; four tiers: identity/demographics/episode/chart | ✅ PASS |
| `listPatients()` uses per-tier Drizzle column maps (`IDENTITY_COLUMNS`, `DEMOGRAPHICS_COLUMNS`, `FULL_COLUMNS`) | ✅ PASS |
| `listAssignedPatients()` uses same tiered column maps | ✅ PASS |
| Episode join (`attachEpisodes()`) skipped entirely for identity and demographics tiers | ✅ PASS |
| `patientsV1.ts` derives `dbTier` from global max permissions (so data available for all tiers) | ✅ PASS |
| **Per-patient projection**: each patient projected using only the permissions from grants that authorised it | ✅ PASS |
| Mixed-scope user: patient reachable only via demographics grant → no chart fields in response | ✅ PASS (test §1-C) |
| Mixed-scope user: patient reachable via chart grant → chart fields present in response | ✅ PASS (test §1-C) |
| `billing_staff` GET /patients → identity + demographics only | ✅ PASS (test §1-A) |
| `security_admin` GET /patients → 403 (no patient.list.view) | ✅ PASS (test §1-B) |

**Files:** `patientRepo.ts` (tiered columns), `patientsV1.ts` (per-patient projection), `patientDTOs.ts`

---

## §2 — User creation through role-grant policy

| Check | Result |
|---|---|
| `POST /admin/users` calls `evaluateRoleGrant()` before any DB write | ✅ PASS |
| Denial writes `role_grant_denied` audit event → 403 | ✅ PASS |
| Identity-ref + staff-profile + account + role-assignment in one transaction | ✅ PASS |
| Duplicate email returns 409 (DrizzleQueryError `cause.code === "23505"`) | ✅ PASS |
| org-admin creates certified_clinician → 201 | ✅ PASS (test §3-A2) |

---

## §3 — Scoped admin authorization (all mutating routes, multi-assignment targets)

| Check | Result |
|---|---|
| `authorizeAdminAction()` wired in POST /admin/users (create) | ✅ PASS |
| `authorizeAdminAction()` wired in POST /admin/users/:id/disable | ✅ PASS |
| `authorizeAdminAction()` wired in POST /admin/users/:id/reactivate | ✅ PASS |
| `authorizeAdminAction()` wired in POST /admin/sessions/:id/revoke-all | ✅ PASS |
| Disable/reactivate: ALL active effective assignments fetched (not just most-recent) | ✅ PASS |
| Deny if ANY assignment is outside admin authority | ✅ PASS |
| facility-admin cannot create org-level user → 403 | ✅ PASS (test §3-A) |
| org-admin creates any role → 201 | ✅ PASS (test §3-A2) |
| facility-admin cannot disable org-level user → 403 | ✅ PASS (test §3-B) |
| org-admin can disable facility-level user → not 403 | ✅ PASS (test §3-C) |
| facility-admin denied for target with mixed in-scope + org-level assignments → 403 | ✅ PASS (test §3-D) |
| Self-revocation via admin route → 403 | ✅ PASS (test §4-A) |

---

## §4 — Cross-tenant session revocation blocked

| Check | Result |
|---|---|
| `revoke-all` WHERE clause includes `eq(sosSessions.orgId, adminAuth.orgId)` | ✅ PASS |
| Self-revocation via admin route → 403 | ✅ PASS (test §4-A) |

---

## §5 — effectiveAt guard

| Check | Result |
|---|---|
| `getRoleAssignments()` filters `effectiveAt <= NOW()` | ✅ PASS |
| `resolveIdentityFromSession()` filters `effectiveAt <= NOW()` | ✅ PASS |
| `future-role` persona → login 401 | ✅ PASS (test §5-A, §14-D) |
| `expired-role` persona → login 401 | ✅ PASS (test §5-B) |
| Active role → login 200 | ✅ PASS (test §5-C) |

---

## §6 — Patient access exact binding (list + detail paths)

| Check | Result |
|---|---|
| `checkPatientAccessForGrant()` LEFT JOIN restricted to EXACT presenting `roleAssignmentId` | ✅ PASS |
| Access row FK = B does NOT satisfy check presenting A (A ≠ B) — detail path | ✅ PASS (test §6-B) |
| `listAssignedPatients()` accepts `presentingAssignmentId`; binds FK to exact grant | ✅ PASS |
| Multi-grant list path: patient bound to B NOT returned when evaluating grant A | ✅ PASS (test §6-C) |
| `patientsV1.ts` passes `grant.roleAssignmentId` per-grant | ✅ PASS |
| Access rows with FK IS NULL (backward compat) still authorized | ✅ PASS |
| Non-UUID sentinel falls back to simple check | ✅ PASS |
| `role_assignment_id` FK + constraint in migration 0003 | ✅ PASS |
| `revoked-role` persona → login 401 | ✅ PASS (test §6-A, §14-E) |

---

## §7 — CSRF on login

| Check | Result |
|---|---|
| `/api/v1/auth/login` removed from `CSRF_EXEMPT` | ✅ PASS |
| POST /login without CSRF token → 403 | ✅ PASS (test §7-A, §16-A) |
| POST /login with valid pre-login token → 200 | ✅ PASS (test §7-B) |
| POST /login with wrong token → 403 | ✅ PASS (test §7-C) |
| GET /csrf-token forces session via `csrfInit` flag | ✅ PASS |
| Pre-login token rejected after session rotation | ✅ PASS (test §16-C) |

---

## §8 — Transactional audit + fault isolation

| Check | Result |
|---|---|
| Login: account reset + session + audit events in one tx | ✅ PASS |
| Logout: session revocation + audit in one tx | ✅ PASS |
| Denials write to `sos_audit_outbox` | ✅ PASS |
| `drainAuditOutbox()` moves rows to `sos_auth_audit` | ✅ PASS |
| Atomic audit events on login | ✅ PASS (test §8-A) |
| Logout audit row written | ✅ PASS (test §8-B) |
| **Fault isolation: failed post-login tx destroys session** | ✅ PASS (test TX-1) |
| Failed login tx → GET /auth/session → 401 | ✅ PASS (test TX-1) |
| `ck_sos_auth_audit_event_type` expanded for all Phase 2C types | ✅ PASS |

---

## §9–§16 — Additional security properties

| Check | Result |
|---|---|
| §9: DUMMY_HASH_PROMISE constant-time path | ✅ PASS (test §9-A) |
| §10: IP via `req.ip` (trust proxy 1) | ✅ PASS |
| §11: GET /auth/session returns non-null `staffProfileId` | ✅ PASS (test §11-A) |
| §12: Denial outbox + drain | ✅ PASS (test §12-A) |
| §13: Migration 0003 all checks | ✅ PASS |
| §14: 5 new seed personas | ✅ PASS (tests §14-A through §14-E) |
| §15: Cookie attributes (HttpOnly, Path=/api) | ✅ PASS (tests §15-A, §15-B) |
| §16: Browser CSRF lifecycle | ✅ PASS (tests §16-A through §16-C) |
| Helmet headers (nosniff, X-Frame-Options, no X-Powered-By) | ✅ PASS (tests H-A, H-B, H-C) |

---

## Test count summary

| Test file | Tests | Status |
|---|---|---|
| `auth-p2-live-session.test.ts` | 37 | ✅ 37/37 |
| `auth-p2-integration.test.ts` | 55 | ✅ 55/55 |
| `auth-p2b-live-session.test.ts` | 18 | ✅ 18/18 |
| `auth-p2b-scoped-grants.test.ts` | 50 | ✅ 50/50 |
| `auth-p2b-migration.test.ts` | 14 | ✅ 14/14 |
| `auth-p2c-security.test.ts` | 32 | ✅ 32/32 |
| `auth-p2c-browser.spec.ts` | 9 | ✅ 9/9 |
| `health.test.ts` | 158 | ✅ 158/158 |
| **Total** | **372** | **✅ 372/372** |

---

## All code-review findings resolved

| Finding | Resolution |
|---|---|
| `checkPatientAccessForGrant` matched any active assignment for same user | LEFT JOIN restricted to exact `roleAssignmentId`; WHERE: `FK IS NULL OR (FK = A AND JOIN matched)` |
| `listAssignedPatients` not bound to presenting grant's assignment | Added `presentingAssignmentId` param; per-grant LEFT JOIN + WHERE binding; route passes `grant.roleAssignmentId` |
| Global permission union applied to all patients — chart fields leaked to lower-tier patients | Per-patient projection: each patient projected using only permissions from authorising grants |
| Admin disable/reactivate used only most-recent assignment for scope check | Fetch ALL active effective assignments; deny if ANY is outside admin authority |
| `authorizeAdminAction` missing from disable/reactivate routes | Wired in all four mutating admin routes |
| Session saved before DB tx; 503 left partial-auth state | Catch block destroys session + clears cookie on post-save tx failure |
| `ck_sos_auth_audit_event_type` missing Phase 2C event types | Constraint expanded in DB + migration 0003 |
| Duplicate email → 503 (ESM instanceof) | Check `err.cause.code === "23505"` |

---

## Known gaps / deferred to follow-up tasks

1. **Rate-limit store** (#800): MemoryStore resets on restart.
2. **Outbox drain scheduling** (#801): fire-and-forget; needs scheduled interval + SIGTERM.
3. **Timing-under-load** (#802): response body equality verified; wall-clock timing not tested.
4. **MFA / WebAuthn** (Phase 3): schema seeded; guard not implemented.

---

*Validation performed 2026-08-02. All Phase 2C spec sections verified at 372/372.*
