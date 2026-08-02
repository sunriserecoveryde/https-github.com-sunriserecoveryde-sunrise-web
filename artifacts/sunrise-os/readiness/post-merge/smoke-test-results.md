# Phase 2 Post-Merge Smoke Test Results

**Date:** 2026-08-02  
**API port:** 8080  
**Conditions:** `DISABLE_AUTH_FALLBACK=true`, real PostgreSQL, real API server, no dev headers  
**Persona:** `clinician@test.sunrise` (Certified Clinician, Facility 1)  
**authSeed:** Re-run to refresh Argon2id hashes before test  

## Results

| # | Step | HTTP | Result |
|---|------|------|--------|
| 1 | `GET /health/live` | 200 | ✅ PASS |
| 2 | `GET /api/v1/auth/csrf-token` | 200 | ✅ PASS — token issued |
| 3 | `POST /api/v1/auth/login` (email + orgSlug) | 200 | ✅ PASS |
| 4 | `GET /api/v1/auth/session` | 200 | ✅ PASS |
| 5 | `GET /api/v1/patients` | 200 | ✅ PASS — 11 patients |
| 6 | Projection check — no passwordHash | — | ✅ PASS |
| 7 | `GET /api/v1/patients/:id` | 200 | ✅ PASS — no passwordHash |
| 8 | `GET /api/v1/patients/:out-of-scope-id` | 404 | ✅ PASS — no enumeration |
| 9 | Second `GET /api/v1/auth/session` | 200 | ✅ PASS — session persists |
| 10 | `POST /api/v1/auth/logout` (post-login CSRF) | 200 | ✅ PASS |
| 11 | `GET /api/v1/auth/session` after logout | 401 | ✅ PASS — session invalidated |

**Result: ALL 11 STEPS PASS**

## Notes

- Login uses field `email` (not `username`) per the `loginSchema` in `authV1.ts`
- CSRF token rotates on login; pre-login token is invalidated. A fresh `/auth/csrf-token`
  call is required between login and logout.
- Step 8 returns 404 (not 403) for out-of-scope patients. This is correct policy:
  returning 403 would confirm the patient exists to an unauthorised requester.
- Patient list returns 11 patients for the clinician persona (Facility 1 caseload).
