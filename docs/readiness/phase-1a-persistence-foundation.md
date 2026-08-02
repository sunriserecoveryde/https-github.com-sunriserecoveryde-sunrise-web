# Phase 1A — Server-Backed Persistence Foundation

**Branch:** `readiness/p0-persistence-foundation`  
**Status:** Complete — awaiting review  
**Date:** 2026-08-01  
**Version:** 1.1 (updated to reflect final corrections)

---

## 1. Existing frameworks

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript, Vite 7 | SPA, path-routed via Replit artifact proxy |
| UI styling | Tailwind CSS 4 | Utility-first |
| API server | Express 5 + TypeScript | `artifacts/api-server` |
| Database | PostgreSQL (Replit-provisioned) | `DATABASE_URL` injected at runtime |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`) | Schema-first, type-safe |
| Schema migration | `drizzle-kit push` | No migration files; schema diffed and pushed directly |
| Monorepo | pnpm workspaces | `lib/db`, `artifacts/api-server`, `artifacts/sunrise-os` |

---

## 2. Database package structure (`lib/db`)

```
lib/db/
  drizzle.config.ts           Drizzle-kit config (reads DATABASE_URL)
  vitest.config.ts            Test config
  src/
    client.ts                 Pool + db singleton (pg pool → drizzle adapter)
    index.ts                  Barrel: re-exports client, schema, repositories
    schema/
      index.ts                Re-exports all schema modules
      sunrise-os.ts           6 Sunrise OS tables (see §4)
    repositories/
      errors.ts               DatabaseError, NotFoundError, AccessDeniedError
      organizationRepo.ts     createOrganization, getOrganization, listOrganizations
      facilityRepo.ts         createFacility, getFacility, listFacilities
      staffRepo.ts            createStaff, getStaff, listStaff (Phase 1A scaffolding)
      patientRepo.ts          listPatients, getPatient, createPatient → PatientWithEpisode
      episodeRepo.ts          createEpisode, getActiveEpisode, listPatientEpisodes
      index.ts                Barrel export for all repositories
      __tests__/
        integration.test.ts   23 integration tests against live dev DB
```

### Circular-dependency fix

`client.ts` was extracted as a standalone module so `repositories/*.ts` can import
from `./client` without importing through `index.ts`, which re-exports repositories.
This prevents a circular `index → repositories → index` dependency.

---

## 3. API route structure (`artifacts/api-server`)

```
artifacts/api-server/src/
  app.ts                      Express app; mounts devIdentityMiddleware + router
  routes/
    index.ts                  Registers all sub-routers under /api
    patientsV1.ts             GET /api/v1/patients, /:id, /:id/episode
  middlewares/
    devIdentity.ts            [DEV ONLY] Reads X-Dev-* headers → req.devIdentity
  seed/
    developmentSeed.ts        Idempotent dev seed; blocked in NODE_ENV=production
```

---

## 4. Repository / service boundaries

All repository functions require explicit `orgId` (and where relevant `facilityId`) as
caller-supplied parameters. There is no implicit ambient context. A call that omits or
supplies a wrong `orgId` returns an empty result set or a `NotFoundError` — never a
cross-tenant record.

| Repository | Scope enforced | Cross-tenant result |
|---|---|---|
| `listPatients(orgId, facilityId?)` | `WHERE org_id = $orgId [AND facility_id = $facilityId]` | Empty array |
| `getPatient(id, orgId)` | `WHERE id = $id AND org_id = $orgId` | `NotFoundError` |
| `createPatient(data)` | `orgId` in insert payload | n/a |
| `getActiveEpisode(patientId, orgId)` | Patient verified first; episode `WHERE org_id = $orgId` | `null` |
| `listPatientEpisodes(patientId, orgId)` | `WHERE org_id = $orgId` | Empty array |
| `getFacility(id, orgId)` | `WHERE id = $id AND org_id = $orgId` | `NotFoundError` |
| `listFacilities(orgId)` | `WHERE org_id = $orgId` | Empty array |

---

## 5. Development identity adapter

**File:** `artifacts/api-server/src/middlewares/devIdentity.ts`

- **Purpose:** Temporary placeholder for Phase 2 authentication. Allows API development
  before a real auth layer exists.
- **Registration:** `app.use("/api/v1", devIdentityMiddleware)` — only when
  `process.env.NODE_ENV !== 'production'` (see `app.ts` line 71).
- **Behaviour:** Reads `X-Dev-Org-Id` and `X-Dev-Facility-Id` request headers.
  Falls back to seed UUIDs (`DEV_SEED_ORG_ID`, `DEV_SEED_FACILITY_ID`) when headers
  are absent.
- **Identity represented:** Org `00000000-0000-4000-a000-000000000001`
  ("[TEST] Sunrise Health Maryland"), Facility `00000000-0000-4000-a000-000000000002`
  ("[TEST] Baltimore Treatment Center").
- **No staff identity is resolved** in Phase 1A; `req.devIdentity` carries only
  `orgId` and `facilityId`.

### Security properties (Phase 1A)

| Property | Status |
|---|---|
| Adapter active in `NODE_ENV=production` | **No** — registration is inside `if (process.env.NODE_ENV !== 'production')` |
| Browser can supply arbitrary org/facility | **Yes, in dev mode** — this is the known Phase 1A limitation |
| Browser can supply arbitrary org/facility in production | **No** — middleware is never registered |
| Routes return 401 without devIdentity in production | Effectively yes — `getIdentity(req)` throws `Error("devIdentity middleware not registered")` → 500; Phase 2 must return 401 |
| Adapter labelled temporary | **Yes** — file-level JSDoc and `⚠️` warning; must be removed in Phase 2 |

> **Known security limitation (Phase 1A):** In development mode, any browser request
> can set `X-Dev-Org-Id` to any UUID and retrieve that organisation's records.
> This is acceptable only while the database contains exclusively fictitious seed data
> and the server is not reachable from the internet. This limitation must be resolved
> in Phase 2 before real patient data is stored.

---

## 6. Tenant and facility scoping

- **Tenant root:** `org_id` (UUID). Every table that holds patient or clinical data
  carries `org_id` as a non-nullable foreign key with `ON DELETE CASCADE`.
- **Facility scope:** `facility_id` on `sos_patients` and `sos_episodes_of_care`.
  `listPatients` accepts an optional `facilityId` parameter; if omitted, all facilities
  within the org are returned.
- **Cross-tenant opacity:** `getPatient` uses `AND org_id = $orgId` in the WHERE
  clause. A patient that exists in Org B, queried with Org A's identity, returns a
  `NotFoundError`. The API maps this to HTTP 404 — the same response as a patient that
  does not exist at all — so the API never reveals whether a record exists in another org.

---

## 7. Data mode

### Configuration

```
VITE_SUNRISE_DATA_MODE=demo        # default — safe for demonstrations
VITE_SUNRISE_DATA_MODE=production  # fetches from /api/v1/patients
```

**Source:** `artifacts/sunrise-os/src/lib/dataMode.ts`

```ts
export const DATA_MODE: DataMode =
  (import.meta.env.VITE_SUNRISE_DATA_MODE as DataMode | undefined) === "production"
    ? "production"
    : "demo";
```

Any value other than the string `"production"` is treated as demo. This is a
strict equality check — there is no implicit truthy fallback.

### Demo mode behaviour (unchanged by Phase 1A)

- `activePatients` in `PatientList` is set to `MOCK_PATIENTS` unconditionally.
- All other pages (ProgressNotes, FinancialCounseling, RecoveryEngagementScore, etc.)
  continue to use `MOCK_PATIENTS` directly — Phase 1A did not migrate them.
- No API calls are made.
- The "Demo Mode · Fictitious Data Only — Not for Clinical Use" orange banner displays.

### Production mode behaviour (Phase 1A)

`PatientList.tsx` — Census tab:

| State | activePatients value | UI |
|---|---|---|
| Loading (fetch in flight) | `[]` (empty array) | "Loading from server…" banner; empty table |
| Fetch success | `serverPatients` (array from API) | Table populated from server records |
| Fetch error | `[]` (stays empty) | Error banner; empty table; **no mock rows** |

`PatientDetail.tsx`:

| State | `serverPatient` | `patient` used | UI |
|---|---|---|---|
| Loading | `null` | `_PROD_LOADING_STUB` (typed stub, never rendered) | Loading spinner (early return gate) |
| Fetch success | `Patient` | `serverPatient` | Full chart |
| Fetch error | `null` + `serverPatientError=true` | stub (never rendered) | Error panel with back link; **no mock chart** |
| Patient not found (404) | `null` + `serverPatientError=true` | stub (never rendered) | Error panel (same); **no mock substitution** |

> **Critical invariant:** When `DATA_MODE === 'production'`, `MOCK_PATIENTS` is never
> the source of truth for the rendered patient list or patient detail. The early-return
> guard at line 163 of `PatientDetail.tsx` prevents the main chart from rendering until
> `serverPatient` is non-null.

---

## 8. MOCK_PATIENTS references — production-path audit

The following files reference `MOCK_PATIENTS` but are **outside the Phase 1A production
data path**. They remain in demo-only state and are documented as deferred work:

| File | Usage | Production risk |
|---|---|---|
| `PatientList.tsx` | `activePatients = DATA_MODE === 'production' ? (serverPatients ?? []) : MOCK_PATIENTS` | None — gated by DATA_MODE check |
| `PatientDetail.tsx` | `DATA_MODE === 'production' ? (serverPatient ?? stub) : (MOCK_PATIENTS.find(...) \|\| MOCK_PATIENTS[0])` | None — production branch never reaches MOCK_PATIENTS |
| `PatientList.tsx` (line 18) | `MOCK_PATIENTS.forEach(...)` — module-level WITHDRAWAL_SCORES computation | Demo-mode input only; not rendered in production path |
| `ProgressNotes.tsx` | Patient picker, note display | Not migrated — Phase 1B |
| `NoteIntelligencePanel.tsx` | AI note context | Not migrated — Phase 1B |
| `ProgressNoteAIAssist.tsx` | AI assist patient lookup | Not migrated — Phase 1B |
| `CommandPalette.tsx` | Global patient search | Not migrated — Phase 1B |
| `FinancialCounseling.tsx` | Patient financial records | Not migrated — future phase |
| `RecoveryEngagementScore.tsx` | Population analytics | Not migrated — future phase |
| `MedicalRecords.tsx` | ROI / records management | Not migrated — future phase |
| `notificationData.ts` | Notification data generation | Not migrated — future phase |

No file in the production data path (PatientList, PatientDetail) silently uses
`MOCK_PATIENTS` when `DATA_MODE === 'production'`.

---

## 9. localStorage / browser storage audit

| Location | Key(s) | Classification | Patient data? |
|---|---|---|---|
| `useSidebarPrefs.ts` | `sunrise-os:sidebar-prefs:<staffId>` | UI preference — pinned patients (id, displayName, program) | Stores patient ID + display name as a UI navigation aid. Does not store clinical data. Server is authoritative. |
| `CommandPalette.tsx` | `DEMO_QUERY_KEY`, `RECENT_DEMO_QUERIES_KEY` | sessionStorage — demo-mode search history | Demo only; fictitious patient names from MOCK_PATIENTS |
| `Sidebar.tsx` | `SESSION_OPEN_KEY`, `SESSION_COMPACT_KEY` | sessionStorage — sidebar open/compact state | Non-clinical UI preference |
| `UADrugTesting.tsx` | `sunrise-os:ua-workflow-items` | Non-clinical workflow UI state | No patient identity stored |
| `WorkforceCompliance.tsx` | `COMPLIANCE_STD_FILTER_KEY`, `COMPLIANCE_GAP_FILTER_KEY`, `COMPLIANCE_AUDIT_PRESETS_KEY`, etc. | UI filter preferences and audit presets | Non-clinical |
| `useRecordingStore.ts` | IndexedDB `sunrise-os-recordings` | Session audio blobs (in-progress recording) | Transient audio only; discarded on cancel; not patient record |

**Result:** No production patient or episode records are stored in browser storage.
Browser storage does not override server records. The `useSidebarPrefs` "pinned patient"
entries store a patient ID and display name as a navigation convenience; this is not
clinical data and the server is the authoritative source for all patient fields.

---

## 10. API contracts

### Endpoints (Phase 1A)

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | GET | `/api/v1/patients` | List patients (org + optional facility scope) |
| 2 | GET | `/api/v1/patients/:id` | Single patient + active episode |
| 3 | GET | `/api/v1/patients/:id/episode` | Active episode only |

#### GET /api/v1/patients

| Field | Value |
|---|---|
| Identity source | `req.devIdentity.orgId` + `req.devIdentity.facilityId` (Phase 1A) |
| Tenant scope | `WHERE org_id = $orgId` (always) |
| Facility scope | `WHERE facility_id = $facilityId` (when facilityId header present) |
| Empty behaviour | Returns `[]` — 200 OK |
| Auth absent (production) | 500 (Phase 2 will return 401) |
| DB error | 503 `{"error":"Service temporarily unavailable"}` |

**Sample response (sanitized, fictitious seed data):**
```json
[
  {
    "id": "00000000-0000-4000-a000-000000000101",
    "orgId": "00000000-0000-4000-a000-000000000001",
    "facilityId": "00000000-0000-4000-a000-000000000002",
    "mrn": "SEED-001",
    "firstName": "Alice",
    "lastName": "Testington",
    "dateOfBirth": "1988-03-14",
    "gender": "F",
    "insurancePayer": "BlueCross",
    "primaryDiagnosis": "Severe Opioid Use Disorder",
    "status": "active",
    "createdAt": "2026-08-01T11:41:10.484Z",
    "updatedAt": "2026-08-01T11:41:10.484Z",
    "episode": {
      "id": "8154b48c-5136-474a-ac7a-993d4c4c634c",
      "orgId": "00000000-0000-4000-a000-000000000001",
      "facilityId": "00000000-0000-4000-a000-000000000002",
      "patientId": "00000000-0000-4000-a000-000000000101",
      "program": "Residential",
      "levelOfCare": "3.7",
      "admissionDate": "2026-07-20",
      "dischargeDate": null,
      "episodeStatus": "active",
      "createdAt": "2026-08-01T11:41:10.488Z",
      "updatedAt": "2026-08-01T11:41:10.488Z"
    }
  }
]
```

#### GET /api/v1/patients/:id

| Field | Value |
|---|---|
| Validation | `:id` must be a valid UUID (zod) — 400 if not |
| Not-found | 404 `{"error":"Not found"}` — same response whether patient doesn't exist or belongs to another org |
| Access-denied | Indistinguishable from not-found (404) — cross-tenant opacity |
| DB error | 503 |

#### GET /api/v1/patients/:id/episode

| Field | Value |
|---|---|
| Validation | `:id` UUID validated first |
| Patient check | `getPatient(id, orgId)` runs first — returns 404 if cross-tenant |
| No active episode | 404 `{"error":"No active episode found"}` |
| DB error | 503 |

---

## 11. Deferred work

### Phase 2 (authentication)

- Replace `devIdentityMiddleware` with a real auth layer (Replit Auth / Clerk / JWT).
- Populate `sos_user_identity_refs.ext_auth_ref` with identity-provider subject claims.
- All `/api/v1` routes must return 401 for unauthenticated requests.
- Remove `X-Dev-Org-Id` / `X-Dev-Facility-Id` from `dataMode.ts` DEV_HEADERS.

### Phase 1B (clinical data persistence)

- `sos_patient_notes` table and repository for progress notes.
- `sos_treatment_goals` table and repository.
- `sos_asam_assessments` table and repository.
- API routes for notes, goals, ASAM.
- Migrate `ProgressNotes.tsx`, `PatientDetail.tsx` note/goal sections to server mode.

### Future phases

- Migrate remaining pages (FinancialCounseling, RecoveryEngagementScore, MedicalRecords,
  CommandPalette global search, notification data) to server-backed data.
- Replace the "Demo Mode" banner logic with a production-ready suppression mechanism.
- Audit trail persistence (`sos_audit_events` table).
- Per-user role and permission persistence.

---

## 12. Known limitations (Phase 1A)

1. **No authentication.** The dev identity adapter trusts browser-supplied headers in
   development mode. This is acceptable only while the database contains fictitious seed
   data and the server is not internet-accessible.
2. **Error responses in production.** When `devIdentityMiddleware` is absent
   (`NODE_ENV=production`) and a request reaches an `/api/v1` route, `getIdentity(req)`
   throws and the route returns 500. Phase 2 must intercept this earlier and return 401.
3. **Clinical data not persisted.** Notes, goals, ASAM scores, medications, and vitals
   remain in-memory mock data even in production mode.
4. **Demo Mode banner not suppressed in production mode.** The orange banner remains
   visible regardless of `DATA_MODE`. It must be removed or gated before real patient
   data is used.
5. **`sos_user_identity_refs.ext_auth_ref` is always null.** The column exists for
   Phase 2 but is not populated.
6. **No audit persistence.** Clinical actions are logged to the in-memory `demoStore`
   only.
