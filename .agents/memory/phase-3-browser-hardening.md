---
name: Phase 3 browser test hardening
description: Root causes fixed to achieve stable 17/17 Playwright runs for the Phase 3 clinical notes browser suite; session cookie name; Vite HMR fix; E-1 timeout.
---

## Bugs fixed to reach 17/17 Playwright stability

### Bug 1 — Vite HMR storm (blank white page)
**Symptom:** Every test produced a blank white screenshot; Playwright network trace showed 1,649 aborted `ComplianceDemoTour.tsx` requests.
**Root cause:** `globalSetup` writes 8 session JSON files to `e2e/sessions/` — inside the Vite project root. Vite's watcher fires an HMR update for each write. Each update re-requests all 50+ source modules and then aborts them when the next update arrives. The app never finishes loading.
**Fix:** `vite.playwright.config.ts` → `server.watch.ignored: ["**/e2e/**", "**/playwright-results/**"]`
**Why:** Any file written inside the Vite root during globalSetup (or test teardown) will trigger HMR unless explicitly ignored.
**How to apply:** Any future globalSetup or teardown that writes files inside an artifact's directory must add those paths to `watch.ignored` in the Playwright Vite config.

### Bug 2 — E-1 120 s timeout (serial two-context setup)
**Symptom:** E-1 ("stale-version conflict") timed out at 120 s consistently.
**Root cause:** `navigateToPatient` + `openProgressNotesTab` ran serially for both browser contexts. `openProgressNotesTab`'s `new-note-btn` retry loop costs 3×3 s = 9.6 s/context when the button doesn't appear (test patient has no active admission → button hidden). Two contexts = 19.2 s + 2×15 s draftCard visibility = 49 s before the actual conflict test.
**Fix:** (a) `test.setTimeout(180_000)` inside E-1. (b) Parallelised the two-context setup with `Promise.all`.
**Why:** Any test that sets up multiple browser contexts sequentially will multiply the navigation overhead.

### Bug 3 — Missing `orgSlug` in production login
**Symptom:** A-2 login would fail; API requires `orgSlug` for tenant-scoped login.
**Fix:** `ProductionLogin.tsx` POST body now includes `orgSlug: import.meta.env.VITE_SUNRISE_ORG_SLUG ?? "sunrise"`.

### Session cookie name
The session cookie is `sos_dev_session` (singular). The `globalSetup` creates sessions via `curl -i` (inline headers) and extracts the `Set-Cookie` value directly from stdout — NOT from a Netscape cookie jar (which has an `#HttpOnly_` prefix bug). Cookie value is stored URL-encoded as received.

### `trace: "on"` OOM on full 17-test suite
Running all 17 tests with `trace: "on"` hangs (OOM-kills the browser with no output). The config uses `retain-on-failure`. To trace a specific test: `playwright test --grep "E-1"`.

### Playwright runner and the sunrise-os workflow
Running `pnpm --filter @workspace/sunrise-os exec playwright test` while the `artifacts/sunrise-os: web` workflow is active hangs with no output. Use `node_modules/.bin/playwright test --config artifacts/sunrise-os/playwright.config.ts` from workspace root instead, or stop the workflow first.

## Stability evidence
- api-server vitest: 568/568 × 4 clean runs
- sunrise-os vitest: 136/136 × 4 clean runs  
- Playwright: 17/17 × 3 clean full-suite runs
- 25 screenshots in `e2e/screenshots/`
- Closure ZIP: `readiness/phase-3-browser-hardening-closure-review.zip`
- SHA-256: `c9ae9a8c302a96c530450c58f044a5e933544ea1582f6ae9c12b965a8e02677c`
