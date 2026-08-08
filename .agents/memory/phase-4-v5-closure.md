---
name: Phase 4 v5 Closure
description: v5 fully satisfies the Phase 4 v3 spec document. Supercedes v4 which had 9 spec failures. All 51 required response fields confirmed.
---

# Phase 4 v5 Closure

## Why v5 Was Needed (v4 Spec Failures)
1. §5 — 33 non-ASCII trace directory names (→, —)
2. §8 — 20 Phase 3 screenshots included (spec: none)
3. §9 — Wrong log filenames (api-run-a vs api-A, logs at root not in logs/)
4. §10 — Only 1/8 cross-suite checks (needed all 8)
5. §11 — Wrong migration proof path/filename
6. §12/13 — Combined gates.log instead of 7 separate TS/build log files
7. §15 — `secret-scanner.py` not included in archive
8. §16 — No frontend source files (PatientDetail.tsx, AuthContext.tsx, etc.)
9. §17 — Missing `evidence-only-diff.txt`

## What v5 Fixed
- Traces: 43 flat ZIP files with ASCII-only filenames in `traces/`
- Screenshots: Phase 4 only (41 files in `screenshots/p4/`, no p3/)
- Logs: `logs/api-A.log`…`api-D.log`, `sos-A.log`…, `playwright-A.log`…
- Cross-suite: 8/8 checks (all 7 new ones + cross-8 from v4)
- Migration proof: `evidence/migration/phase-3-to-phase-4-upgrade-proof.txt`
- TS/build: 7 separate log files in `evidence/ts-builds/`
- Source: 194 files including PatientDetail.tsx, AuthContext.tsx, pnpm-lock.yaml
- `evidence/secret-scan/secret-scanner.py` included
- `evidence/git/evidence-only-diff.txt` included

## Trace Sanitizer Fix
Binary sweep pass was added (`BINARY_REDACT_PATTERNS`) to catch `s%3A` URL-encoded
session tokens in `0-trace.network` binary-format files that the JSON/text pass missed.
Also added standalone `s%3A...` and `s:...<sig>` to REGEX_PATTERNS for text files.

## Scanner Fix
`database_credential` pattern narrowed to require `[A-Za-z0-9_\-\.]+` (no `[^` metacharacters)
to prevent the scanner from flagging its own regex patterns as credentials.

## ZIP Details
Path: `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v5.zip`
SHA256: `a22159d541ec516ca7e3bf065dec4a59c22252ca746953a5a2a628d85000b4df`

## Gate Results (all passed)
- API: 668/668 ×4
- SOS: 136/136 ×4
- Playwright: 43/43 ×3
- Cross-suite: 8/8 EXIT:0
- TS/build gates: 7/7 EXIT:0
- Migration proof: 22 steps PASS, EXIT:0
- Staging secret scan: 0 confirmed secrets (866 files, 43 nested ZIPs, 8 HARs)
- Final ZIP scan: 0 confirmed secrets (903 files, 43 nested/trace ZIPs, 0 HARs in ZIP)
- SHA256 verification: 320/320 files OK

## Final Application Code SHA
`eb88e9848241100afccbb23ee607119119644b15` (tests run against this commit)

Evidence tooling HEAD (sanitizer + scanner fixes):
`9f90989c5f3a3a2a8b80076bd0d2b4a275676a4d`

**Why:** Evidence tooling commits after eb88e98 only changed trace-sanitizer-v4.py and
secret-scanner-v4.py (evidence generation scripts) — no application source, test spec,
migration, or configuration changed.

**How to apply:** For any future evidence rebuild, run cross-suite checks 1-7 as separate
vitest runs of individual test files (not full suite), then cross-8 (PW + full API).
Trace sanitizer must use binary sweep pass for `.network` files.
