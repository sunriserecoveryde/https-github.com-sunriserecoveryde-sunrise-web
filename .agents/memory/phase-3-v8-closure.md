---
name: Phase 3 v8 closure
description: Final closure state for phase-3-clinical-documentation-foundation-review-v8.zip — all gates met, credential rotation root-cause documented.
---

## Status: CLOSED

**Branch:** `feature/phase-3-clinical-documentation-foundation`  
**Final commit:** `0d93ee5` (evidence: phase-3-v8 ZIP …)  
**ZIP:** `artifacts/sunrise-os/readiness/phase-3-clinical-documentation-foundation-review-v8.zip`  
**ZIP SHA-256:** `e933d580b1b28f1b10dbf6adc03e21d7b9f8cf1d261df023ed658b72ec2d475f`

## Gate results

| Gate | Result |
|---|---|
| API vitest | 573×4 ✓ |
| SOS vitest | 136×4 ✓ |
| PW browser | 19×3 ✓ |
| Cross-suite | 6/6 ✓ |
| Traces sanitized | 19/19 ✓ |
| HARs sanitized | 4/4 ✓ |
| Screenshots | 20/20 canonical ✓ |
| Migrations applied | 7/7 ✓ |
| Secret scan (staging) | 0 CRITICAL/HIGH ✓ |
| Secret scan (ZIP) | 0 CRITICAL/HIGH ✓ |
| Permission codes | exactly 5 ✓ |
| Credential rotation | completed ✓ |

## Credential rotation root cause (important for future runs)

**Why v8 A-run first attempt failed at login (401):**

pnpm injects Replit Secrets as environment variables into all subprocess invocations.  
Running `PHASE2D_TEST_PASSWORD=new_value pnpm ...` does NOT override the Replit secret injection — the old value from the secret store silently wins.

**Correct sequence for any future rotation:**
1. Use `requestSecrets({ keys: ["PHASE2D_TEST_PASSWORD"] })` to update the Replit secret to the new value first.
2. AFTER the secret is updated, run `cd artifacts/api-server && node_modules/.bin/tsx src/seed/authSeed.ts` — it will pick up the new value from the environment.
3. Revoke sessions: `psql "$DATABASE_URL" -c "DELETE FROM sos_sessions WHERE user_id IN (SELECT id FROM sos_user_accounts WHERE email = ANY(ARRAY[...]))"`
4. Run tests — they will inherit the new value from the Replit secret automatically.

**Do NOT** try to pass a new password via inline env override (`VAR=value pnpm ...`) when running Playwright tests — pnpm's Replit secret injection overrides it.

## 5 approved permission codes

`clinical_note.create`, `clinical_note.view`, `clinical_note.edit_own_draft`, `clinical_note.sign_own`, `clinical_note.void`

**Explicitly excluded:** `clinical_note.sign`, `clinical_note.export`, `clinical_note.audit_view`

## Migration state

7 migrations applied in `drizzle.__drizzle_migrations` (0000–0006). SQL files live at `lib/db/drizzle/*.sql`. No `_journal.json` in `artifacts/api-server/drizzle/` — correct path is `lib/db/drizzle/meta/_journal.json`.

## v7 → v8 changes

- `e2e/clinical-notes-p3-browser.spec.ts`: 20 named screenshots, exact status assertions (D-5=403, D-6=403, D-7=404, D-1=404), `unassigned-denial` snap #13 added, `.catch()` → try/catch, `fs.rmSync` clears dir before each run.
- `e2e/clinical-notes-p3.spec.ts`: removed `?? ""` fallback — throws if PHASE2D_TEST_PASSWORD absent.
- `e2e/SCREENSHOT-INVENTORY.md`: 20-entry manifest added.
- `e2e/sanitize-traces-v8.py`: canonical ASCII name mapping for all 19 traces.
- `readiness/scripts/secret-scanner-v8.py`: recursive scanner (opens nested ZIPs, HARs).
- `api-server/src/seed/rotateTestPasswords.ts`: rotation helper (argon2id, self-verify, session revoke).
