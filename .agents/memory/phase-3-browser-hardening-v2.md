---
name: Phase 3 browser test hardening v2
description: v5 CLOSED — final evidence archive details, PW HAR fix, all gate results
---

## v5 CLOSED — All gates met

**Final commit on branch `feature/phase-3-clinical-documentation-foundation`:**
- `5f979c0` — phase3-v5: fix HAR recording via contextOptions (PW 1.38 compatible)
- `95b1975` — phase3-v5: fix HAR recording (absolute path + omitContent for PW 1.38)
- `813d7b8` — phase3-v5: fix role label, mandatory assertions, TypeScript, traces, HAR, authSeed cleanup
- Evidence archive: `readiness/phase-3-clinical-documentation-foundation-review-v5.zip` (49M, 106 files)

## Gate results (v5)
- API vitest: 572/572 × 3 ✅
- SOS vitest: 136/136 × 3 ✅
- Playwright: 19/19 × 5 ✅ (≥3 required)
- Phase 2 upgrade proof: 17/17 steps, disposable DB ✅
- TypeScript API: EXIT:0 ✅
- TypeScript SOS: EXIT:0 ✅
- Traces: 19 sanitized ZIPs ✅
- HAR: 4 workflows ✅
- Screenshots: 33 ✅
- Secret scan: clean (3 false positives annotated) ✅

## Critical PW 1.38.0 HAR fix

**Why `test.use({ recordHar })` silently fails in 1.38:**
The Playwright 1.38 test fixture only reads known `PlaywrightTestOptions` keys (storageState, viewport, etc.). `recordHar` is a `BrowserContextOptions` key but NOT in `PlaywrightTestOptions`. Passing it top-level in `test.use()` is silently ignored.

**Fix:** Use `test.use({ contextOptions: { recordHar: { path: ABSOLUTE_PATH, omitContent: true } } })`. The `contextOptions` fixture is passed verbatim to `browser.newContext()`.

**Why:** `omitContent: true` is correct for 1.38 (not `content: "omit"` which came in 1.42, not `mode: "minimal"` which came in 1.44).

**Path must be absolute:** Use `path.join(import.meta.dirname, "har", "filename.har")` — relative paths resolve to `outputDir` which may be wrong.

## authSeed role cleanup
Before v5 runs, stale active `bht` assignments for the clinician test account caused the clinician role label to show "BHT". Fixed by adding a "revoke stale active assignments" loop in `authSeed.ts` before seeding. This is now part of the seed logic permanently.

## Trace config
`trace: "on"` (not `retain-on-failure`) ensures 19 traces always generated, even when all tests pass. Each test generates one trace.zip in `playwright-results/{test-slug}/trace.zip`. Sequential run (workers:1) means no conflicts.
