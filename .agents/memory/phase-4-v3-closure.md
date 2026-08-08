---
name: Phase 4 v3 closure
description: Phase 4 scheduling evidence archive v3 — all gates met, ZIP finalized
---

## State: CLOSED

| Field | Value |
|---|---|
| Final commit SHA | `e913efa0310553ac921b5e066493501212e4e0f3` |
| Branch | `feature/phase-4-scheduling-and-appointments` |
| ZIP path | `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v3.zip` |
| ZIP SHA256 | `421f01ae58ced3ff0b1ec3c68b4406afcb41b6e249b8dec28ab8bbf942ef3e79` |

## Test Gate Results

| Suite | Runs | Tests/Run | All Passed |
|---|---|---|---|
| API (`@workspace/api-server`) | 4 (A–D) | 668 | ✓ |
| SOS (`@workspace/sunrise-os`) | 4 (A–D) | 136 | ✓ |
| Playwright browser | 4 (A–C + final) | 43 | ✓ |
| Cross-suite isolation | 1 | 8 checks | ✓ |
| TypeScript (db, api, sos) | 1 | 3 packages | ✓ |
| Migration proof | 1 | 28 steps | ✓ |
| Secret scanner (staging + ZIP) | 2 | — | 0 findings |

## Key Fixes Relative to v2

1. **Screenshot isolation** — Phase 3 spec calls `fs.rmSync(screenshotDir)` at load time, wiping Phase 4 screenshots generated in the same Playwright run. Fix: Phase 4 spec uses `screenshots-p4/` directory (not `screenshots/`).
2. **Migration proof** — was checking for 6 SQL files (found 14 including `phase2-proof/` subdirectory); fixed to `find -maxdepth 1 -name "*.sql"` expecting 8. Was checking for SQLite journal (`__drizzle_migrations`); fixed to `meta/_journal.json` (Drizzle JSON format). Wrong table names: `sos_orgs` → `sos_organizations`, `sos_outbox` → `sos_audit_outbox`.
3. **HARs** — Contaminated v2 HARs deleted; 5 required HARs regenerated via `recordHar` in spec; sanitized with `sanitize-har-v3.py`; scanner verified 0 credentials.
4. **Traces** — All 24 trace ZIPs have ASCII-only filenames (§ and → chars removed from Playwright describe names in spec v3).
5. **TEST_PATIENT_EMPTY_ID** — `00000000-0000-4000-a000-000000000098` added to seed for empty-state test.

## Architecture Notes

- `screenshotDir` for Phase 4: `artifacts/sunrise-os/e2e/screenshots-p4/` (41 screenshots)
- `screenshotDir` for Phase 3: `artifacts/sunrise-os/e2e/screenshots/` (20 screenshots, wiped per run)
- Migration count is **8** (0000–0007; Phase 4 added `0007_scheduling_and_appointments.sql`)
- Outbox table: `sos_audit_outbox` (auth event worker); columns: id, org_id, user_id, session_id, event_type, outcome, reason_code, target_user_id, ip_address, user_agent_summary, metadata, attempts, error_detail, processed_at, created_at, failed_permanently
- `sos_organizations` (not `sos_orgs`) is the correct table name

**Why:** Documents non-obvious fixes that took multiple iterations to resolve; prevents repeat failures in future phases.
