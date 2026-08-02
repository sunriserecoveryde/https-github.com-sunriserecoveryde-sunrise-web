---
name: Phase 2C Security Closure
description: Durable lessons from Phase 2C auth hardening — per-patient/per-grant projection, exact FK binding, all-assignment admin scope, session fault isolation, tiered DB projection, Drizzle error detection
---

## Per-patient/per-authorising-grant projection (patient list)

`GET /patients` must project each patient using ONLY the permissions from grants that authorised that patient — not the global union of all the caller's grants. A user with chart access on facility B and demographics-only on facility A must get demographics-level response for facility-A patients.

Implementation: build `patientPermMap: Map<patientId, Set<PermCode>>` while collecting `scopeResults`. Each patient accumulates permissions from every grant that returns it. `projectPatient(patient, patientPermMap.get(id))` is called per-patient.

**Why:** Global-union projection was the critical finding caught in code review. It directly violates minimum-necessary disclosure for mixed-role/mixed-scope users.

**How to apply:** Any new list endpoint returning records gated by per-grant scope must use the same per-record authorising-grant permission accumulation pattern.

## Exact assignment binding — detail AND list paths

`checkPatientAccessForGrant` (detail): LEFT JOIN includes `eq(sosRoleAssignments.id, roleAssignmentId)`. WHERE: `FK IS NULL OR (FK = presentedId AND JOIN matched)`.

`listAssignedPatients` (list): accepts `presentingAssignmentId?`. LEFT JOIN conditioned on that ID; WHERE rejects rows with FK ≠ presentedId. Route passes `grant.roleAssignmentId` per-grant from `getAuthorizedFacilitiesForPermission`.

## Admin scope: ALL active assignments for target, not just most-recent

Disable/reactivate routes fetch ALL active effective assignments and call `authorizeAdminAction` for each. Deny if any is out of scope. `ORDER BY ... LIMIT 1` is unsafe for multi-assignment users.

## Session fault isolation: destroy session on post-login tx failure

Catch block after `req.session.save()` must call `req.session.destroy()` + `res.clearCookie()` if `req.session.userId` is set. Test: `vi.spyOn(db, "transaction").mockImplementationOnce(...)` → expect 503, then GET /auth/session → 401.

## Drizzle ESM: postgres errors in err.cause, not err.message

`DrizzleQueryError.message = "Failed query: ..."`. Postgres code/message is in `err.cause.code` / `err.cause.message`. Check `err.cause?.code === "23505"` for unique violations.

## ck_sos_auth_audit_event_type must stay in sync with event types

Any new audit event type must be added to both migration SQL (DROP/ADD CONSTRAINT) and Drizzle schema simultaneously. A missing event type causes 503 in the route that writes it.

## PatientQueryTier: per-tier Drizzle column maps

`listPatients` and `listAssignedPatients` accept `PatientQueryTier`. Identity/demographics tiers use narrow column maps and skip `attachEpisodes`. DB tier = global max (so data is available for all projection tiers); response projection is per-patient/per-grant.

## Evidence Handoff: reproducibility proof structure

Final evidence lives in `artifacts/sunrise-os/readiness/phase-2c/`:
- `evidence-manifest.json` — structured §1-§18 coverage with SHA-256 per source file
- `clean-migration-proof.md` — disposable DB (`phase2c_proof_db`) created, 4 migrations applied, schema verified (18 tables / 42 indexes / 37 constraints / 4 triggers / 4 journal entries)
- `phase-2c-final-review.zip` — 26 files, 111 KB, ZIP SHA-256 `11de5b0ec9e412273f9e3aeeac41cb084a4d3ce7dfc7d8be2da2f8161a556c06`

Reproducibility fixes committed (d7e57ec): `lib/db` declarations were stale (old 3-arg listAssignedPatients signature) — always rebuild `lib/db` with `tsc -p tsconfig.json` when the repo's declaration is older than the source. Also: `sunrise-os` vite.config.ts now guards `!isBuild` before throwing on missing PORT/BASE_PATH — required for CI production builds. devSeed org insert was missing `slug` field after migration 0002 made it NOT NULL.

§13-§15 (manual browser walk-through, devtools screenshots, HAR) cannot be performed by an agent; automated HTTP substitutes provided and noted in manifest.
