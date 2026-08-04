---
name: Phase 3 browser test hardening v2
description: Round-2 reviewer remediation (15 blockers). Covers credential rotation, trace sanitization, drizzle-kit Phase 2 proof, D-test strengthening, exact-equality permission tests, Topbar prod mode, v3 archive.
---

## Key decisions

**Credential rotation flow:**
- `authSeed.ts` seeds ALL browser test users (including clinician@test.sunrise) — run with `pnpm exec tsx src/seed/authSeed.ts` from api-server dir, not ts-node
- When authSeed is run with a different password than what's in the secret, browser tests fail login (401). Always run authSeed WITHOUT env var override to use the current PHASE2D_TEST_PASSWORD secret
- Session table: `sos_sessions` (not `session`). `DELETE FROM sos_sessions` to revoke all

**Phase 2 upgrade proof (drizzle-kit only, no psql):**
- Create `lib/db/drizzle/phase2-proof/` with 0000-0005 SQL + `meta/_journal.json` (6 entries only)
- Create `lib/db/drizzle.phase2.config.ts` pointing to `drizzle/phase2-proof/`
- Run: `DATABASE_URL=<upgrade_url> pnpm --filter @workspace/db exec drizzle-kit migrate --config ./drizzle.phase2.config.ts` → applies 0000-0005
- Run full migrate → applies 0006 only (7 rows total)
- sos_clinical_notes: 24 constraints, 5 indexes, 1 trigger after 0006

**SHA256SUMS self-exclusion:**
- `build-sha256sums.sh` at `readiness/scripts/` — uses `find -! -name SHA256SUMS.txt`
- `manifest_entries = total_files - 1`

**Rate-limit test flakiness:**
- step-15 (auth-p2d-rate-limit.test.ts) flaky if run after Playwright (rate limit state bleeds)
- Fix: `DELETE FROM sos_rate_limit_windows` before each API vitest run
- The global-teardown only clears loopback IPs, not all keys

**Playwright D-test specifics:**
- D-1 (cross-facility): does NOT render `[data-testid="access-denied"]` — just hides note controls
- D-2, D-3 (security-admin, HR): DO render access-denied testid (proper AccessDenied component)
- D-6 (sign denial): `sign-lock-btn` may not be visible for non-owners — use `{ timeout: 5_000 }` on click
- Test count: 19 (was 17 before D-6 and D-7 were added)
- Trace capture: `--trace=on --output <dir>` to force all traces; default `retain-on-failure` doesn't save passing traces

**Production mode Topbar:**
- `VITE_SUNRISE_DATA_MODE=production` → renders static `data-testid="role-display"` instead of role-switcher dropdown
- `data-testid="role-switcher-btn"` only in demo mode

**v3 archive:**
- Path: `readiness/phase-3-clinical-documentation-foundation-review-v3.zip`
- SHA256: `9c6f0519b52b31ee8625298ba1ef8c56fa30c10d473ec0e8a4d1da321e7cf1a7`
- 126 entries in SHA256SUMS.txt (127 total files - 1 self-exclusion)
- Scripts: `readiness/scripts/build-sha256sums.sh`, `readiness/scripts/build-v3-archive.sh`
- Trace sanitizer: `e2e/sanitize-traces.py` (redacts cookies, session values, CSRF tokens from .trace/.network NDJSON files)
