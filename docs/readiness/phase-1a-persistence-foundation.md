# Phase 1A — Server-Backed Persistence Foundation

**Branch:** `readiness/p0-persistence-foundation`  
**Status:** Complete  
**Date:** 2026-08-01  
**Author:** Phase 1A implementation

---

## Overview

Phase 1A establishes the production-ready database layer for Sunrise OS patient data. Before this phase, the application read exclusively from `MOCK_PATIENTS` — an in-memory TypeScript array that resets on every page refresh. After Phase 1A, a PostgreSQL-backed patient list and patient detail page can serve data from a real database while the existing mock/demo path remains fully intact.

This phase is intentionally narrow in scope. It does **not** migrate clinical notes, medications, authorizations, assessments, billing, or any page other than Patient List and Patient Detail.

---

## Architecture

### Data Mode Switching

The environment variable `VITE_SUNRISE_DATA_MODE` controls the data source:

| Value | Behaviour |
|---|---|
| `"demo"` (default) | Reads from `MOCK_PATIENTS` — unchanged, safe for demonstrations |
| `"production"` | Fetches patients from `/api/v1/patients` — must NOT fall back to mock data |

The mode is exposed to the frontend via `artifacts/sunrise-os/src/lib/dataMode.ts`.

```bash
# To run in production mode during development:
VITE_SUNRISE_DATA_MODE=production pnpm --filter @workspace/sunrise-os run dev
```

---

### Database Schema (`lib/db/src/schema/sunrise-os.ts`)

Six tables were added, prefixed `sos_` to avoid collisions with existing tables:

```
sos_organizations          ← tenant root; one row per customer
    │
    ├── sos_facilities     ← physical / virtual treatment location
    │       │
    │       └── sos_patients    ← basic patient identity (Phase 1A)
    │               │
    │               └── sos_episodes_of_care  ← admission → discharge
    │
    ├── sos_user_identity_refs  ← auth identity placeholder (Phase 2)
    │
    └── sos_staff_profiles ← staff linked to user identity
```

**Key design decisions:**
- UUID primary keys with `.defaultRandom()` — consistent with existing tables
- `timestamp("...", { withTimezone: true })` — consistent with existing tables
- MRN uniqueness enforced per organisation (`UNIQUE(org_id, mrn)`) — not globally
- `sosPatients` → `sosFacilities` is `RESTRICT` on delete to prevent accidental patient data loss
- `sos_` prefix isolates Phase 1A tables from pre-existing `grow_`, `conversations`, `messages`, `compliance_*` tables

Schema pushed with `drizzle-kit push` (no migration files — follows existing project convention).

---

### Repository Layer (`lib/db/src/repositories/`)

| File | Exports |
|---|---|
| `errors.ts` | `DatabaseError`, `NotFoundError`, `AccessDeniedError` |
| `organizationRepo.ts` | `createOrganization`, `getOrganization`, `listOrganizations` |
| `facilityRepo.ts` | `createFacility`, `getFacility`, `listFacilities` |
| `staffRepo.ts` | `createStaffProfile`, `createUserIdentityRef`, `getStaffProfile`, `listStaffProfiles` |
| `patientRepo.ts` | `listPatients`, `getPatient`, `createPatient` (+ `PatientWithEpisode` type) |
| `episodeRepo.ts` | `createEpisode`, `getActiveEpisode`, `listPatientEpisodes` |

**Cross-tenant safety:** `orgId` is always a required server-side WHERE condition. Cross-organisation reads are structurally impossible — they cannot be caused by a missing auth check or a malicious client parameter.

**Circular dependency resolution:**  
Repositories import `db` from `lib/db/src/client.ts` (not `index.ts`). The main `index.ts` then safely re-exports from both `client.ts` and `repositories/`. This breaks what would otherwise be a circular module dependency.

```
index.ts ──exports──> client.ts  (pool + db)
index.ts ──exports──> schema/
index.ts ──exports──> repositories/
repositories/*.ts ──imports──> client.ts  (NOT index.ts)
```

---

### API Routes (`artifacts/api-server/src/routes/patientsV1.ts`)

Mounted at `/api/v1/patients`:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/patients` | List patients for the caller's org + facility |
| `GET` | `/api/v1/patients/:id` | Single patient record (404 if wrong org) |
| `GET` | `/api/v1/patients/:id/episode` | Active episode for a patient |

All routes require `req.devIdentity` (injected by the dev-identity middleware). In production, routes return 500 if the middleware is not registered. The devIdentity guard is structural — not enforced by a conditional check inside the route.

---

### Dev-Identity Middleware (`artifacts/api-server/src/middlewares/devIdentity.ts`)

**Development only.** Registered only when `NODE_ENV !== 'production'`.

Reads `X-Dev-Org-Id` and `X-Dev-Facility-Id` request headers, falling back to the known seed organisation/facility IDs when headers are absent. This allows the frontend to work without authentication during Phase 1A.

**This middleware provides NO security.** It must be replaced entirely by Phase 2 authentication.

Default seed IDs:
```
X-Dev-Org-Id:      00000000-0000-4000-a000-000000000001
X-Dev-Facility-Id: 00000000-0000-4000-a000-000000000002
```

---

### Frontend Changes

#### `artifacts/sunrise-os/src/pages/PatientList.tsx`

- Added `useEffect` that fetches `/api/v1/patients` in production mode
- `activePatients = serverPatients ?? MOCK_PATIENTS` — demo mode falls back transparently
- Loading, error, and success status indicators shown in Census tab when `DATA_MODE === 'production'`
- Module-level `WITHDRAWAL_SCORES` (clinical demo data) unchanged — withdrawal scores are not in the DB yet

#### `artifacts/sunrise-os/src/pages/PatientDetail.tsx`

- Added `useEffect` that fetches `/api/v1/patients/:id` in production mode
- `patient = serverPatient ?? mockFallback` — transparent demo fallback
- `adaptForDetail()` maps the DB record to the full `Patient` UI type with empty clinical fields
- Clinical data (notes, goals, medications, assessments) shows empty until Phase 4 migration

---

### Development Seed (`artifacts/api-server/src/seed/developmentSeed.ts`)

Creates idempotent test data (deletes and recreates on each run):

```
1 organisation  — [TEST] Sunrise Health Maryland
1 facility      — [TEST] Baltimore Treatment Center
5 staff profiles
10 patients     — clearly fictitious, labelled [TEST-*] MRN prefixes
10 episodes     — one active episode per patient
```

Run via:
```bash
cd /home/runner/workspace/artifacts/api-server
pnpm exec tsx src/seed/developmentSeed.ts
```

---

### Integration Tests (`lib/db/src/repositories/__tests__/integration.test.ts`)

15+ integration tests covering all repositories:

- `organizationRepo`: create, retrieve by id, null for non-existent, list
- `facilityRepo`: create, retrieve within org, NotFoundError for wrong org, list, cross-org isolation
- `patientRepo`: create with all fields, retrieve within org, NotFoundError for wrong org, list, facility-scoped list, empty for unknown org, unique MRN constraint
- `episodeRepo`: create, retrieve active episode, episode joined via getPatient, episode joined via listPatients, null active episode, cross-org isolation, list all episodes

Each suite creates its own test org and cleans up via cascade delete in `afterAll`. Tests use a random `TEST_RUN_ID` suffix to avoid collisions when run concurrently.

Run via:
```bash
pnpm --filter @workspace/db run test
```

---

## What Was NOT Changed (Phase 1A Scope Boundary)

| Area | Status |
|---|---|
| Clinical notes | Not migrated — Phase 4 |
| Medications & MAR | Not migrated — Phase 4 |
| ASAM assessments | Not migrated — Phase 5 |
| Authorizations / billing | Not migrated — future phase |
| Authentication | Not implemented — Phase 2 |
| Audit trail | Not migrated — Phase 6 |
| Any page other than Patient List / Detail | Not migrated |
| Mock data paths | Unchanged — demo mode works exactly as before |
| localStorage | No patient data added to localStorage |

---

## Verification Steps

1. **Schema applied:** `pnpm --filter @workspace/db push` — ran successfully against dev DB
2. **Seed executed:** 10 patients + episodes created with deterministic IDs
3. **TypeScript check:** `pnpm --filter @workspace/api-server run typecheck` — passes with 0 errors
4. **Integration tests:** `pnpm --filter @workspace/db run test` — 15+ tests across 4 suites
5. **Demo mode unchanged:** Patient List and Detail continue to work with mock data
6. **Production mode:** Set `VITE_SUNRISE_DATA_MODE=production`, visit Patient List, see server-backed patients

---

## Files Changed

### New Files
- `lib/db/src/client.ts` — database client singleton (extracted to avoid circular dep)
- `lib/db/src/schema/sunrise-os.ts` — 6 new tables
- `lib/db/src/repositories/errors.ts`
- `lib/db/src/repositories/organizationRepo.ts`
- `lib/db/src/repositories/facilityRepo.ts`
- `lib/db/src/repositories/staffRepo.ts`
- `lib/db/src/repositories/patientRepo.ts`
- `lib/db/src/repositories/episodeRepo.ts`
- `lib/db/src/repositories/index.ts`
- `lib/db/src/repositories/__tests__/integration.test.ts`
- `lib/db/vitest.config.ts`
- `artifacts/api-server/src/middlewares/devIdentity.ts`
- `artifacts/api-server/src/routes/patientsV1.ts`
- `artifacts/api-server/src/seed/developmentSeed.ts`
- `artifacts/sunrise-os/src/lib/dataMode.ts`
- `docs/readiness/phase-1a-persistence-foundation.md` (this file)

### Modified Files
- `lib/db/src/index.ts` — re-exports client + repositories
- `lib/db/src/schema/index.ts` — re-exports sunrise-os schema
- `lib/db/package.json` — added repositories export path, vitest devDep, test script
- `artifacts/api-server/src/app.ts` — registers devIdentity middleware for `/api/v1`
- `artifacts/api-server/src/routes/index.ts` — mounts patientsV1Router
- `artifacts/api-server/package.json` — added seed:dev script, tsx devDep
- `artifacts/sunrise-os/src/pages/PatientList.tsx` — dual-mode patient fetch
- `artifacts/sunrise-os/src/pages/PatientDetail.tsx` — dual-mode patient fetch
