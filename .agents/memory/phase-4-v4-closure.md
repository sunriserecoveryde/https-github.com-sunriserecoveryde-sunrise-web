---
name: Phase 4 v4 Closure
description: Final gate-passing state for Phase 4 Scheduling & Appointments evidence package (v4). Supercedes v3 (which had contaminated traces/HARs).
---

# Phase 4 v4 Closure

## Final Code SHA
`eb88e9848241100afccbb23ee607119119644b15` (branch: `feature/phase-4-scheduling-and-appointments`)

Evidence-only commit (ZIP): immediately after above on the same branch.

## Evidence ZIP
`artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v4.zip`
SHA256: `8ba270e0ee4b27dd5a9fff93a5855b211a5c66399ef7f92b3399b5dc46879cc6`

## Gate Results (all passed)
- API: 668/668 ×4
- SOS: 136/136 ×4  
- Playwright: 43/43 ×3
- Isolation-8 (PW → rate-limiter): 8/8 PASS
- 7 TS/build gates: ALL PASS
- Migration proof (Phase 3→4): 22/22 PASS, EXIT:0
- HAR sanitization: 8 files, 0 confirmed secrets
- Trace sanitization: 43 ZIPs, 0 confirmed secrets
- Staging secret scan: 0 confirmed secrets
- Final ZIP secret scan: 0 confirmed secrets (850 files scanned, 43 trace ZIPs, 0 HAR files inside ZIP)

## Migration Proof Key Facts
- Script: `artifacts/sunrise-os/e2e/phase3-to-phase4-upgrade-proof.sh`
- sos_staff_profiles.user_id FK → sos_user_identity_refs(org_id, id) (not sos_user_accounts)
- sos_role_assignments.user_id FK → sos_user_accounts(org_id, id)
- Migration 0007 hash (drizzle-kit computed): f9584e3e78fb3880bed1e8fed4514759c38cf0cc9d9de73f0cf7ff078c97a135
- Production DB hash (originally applied): ee6c269a... (file modified after initial deployment)
- sos_appointments indexes: idx_apt_facility_time, idx_apt_patient_history, idx_apt_patient_time, idx_apt_staff_time

## Commit Chain (proof script iterations)
76e17f7 — HAR removal + new scripts (application code frozen here)
6e210b1 — fix: staff_profiles FK (user_id → IDR_ID not USR_ID)
a5048ae — fix: index names for sos_appointments
d1239d1 — fix: reason column in appointment inserts
3e79022 — fix: pipefail trap in constraint rejection tests
eb88e98 — chore: screenshots update (FINAL CODE SHA)

## Session Revocations (before v4 build)
458 sessions revoked, reason: 'v4-evidence-revocation-v3-contaminated'

## v3 Failure Reasons (fixed in v4)
1. Trace contamination: 169+ raw session/CSRF values → fixed by trace-sanitizer-v4.py
2. HAR contamination → fixed by har-sanitizer-v4.py; raw HARs removed from git
3. Isolation-8 "skipped" → now actually run with cross-8-playwright-then-rate-limiter.log
4. Migration proof applied all 8 to empty DB → now proves Phase 3→4 upgrade path
5. Only 14 source files → now 102 source files
6. No screenshot inventory → SCREENSHOT-INVENTORY.md with 61 screenshots
7. Only 3 TS/build gates → 7 gates verified
8. Git tree not proven clean → git diff HEAD output saved
9. Scanner counts not specific → v4 scanner reports exact counts per category

**Why:** Store to avoid v5 repeat. Application code hasn't changed — only proof tooling was iterated.
**How to apply:** If another evidence build is needed, start from script at commit eb88e98 and check sos_staff_profiles/user_identity_refs FK carefully before seeding proof DB.
