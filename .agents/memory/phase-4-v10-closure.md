---
name: Phase 4 v10 closure
description: Phase 4 evidence-only CSRF redaction closure — v10 final ZIP sha256 76c071e5; strict scanner; 0 secrets
---

## Status: CLOSED

**TESTED_COMMIT:** `ee1150fd80f8042f4497215628e60e7db5951a85`  
**ZIP SHA-256:** `76c071e51bfb31e9d22f7bf29b51b5eeb2ef6ffc3d9d4be224c58e5bd3f139d8`  
**ZIP path:** `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v10.zip`

---

## What changed from v9

**Single blocker fixed:** 15 raw X-CSRF-Token values across 13 Playwright trace ZIPs.

**Root cause:** v9 sanitizer applied `redact_json_obj` to JSONL lines but missed CSRF values embedded inside JSON string arrays (Playwright stores log lines like `"  X-CSRF-Token: hash.signature"` inside array fields, not as structured `{name,value}` objects).

**Fix:** Two-pass approach in `trace-resanitize.py`:
1. Pass 1: `redact_json_obj` handles structured `{name,value}` header/cookie arrays
2. Pass 2: `redact_string_values` deep-scans all string values in the parsed object
3. Pass 3: `redact_text` regex applied to serialized JSON output (catches anything remaining)
4. Regex extended to match dots (`.`) in CSRF token `hash.signature` format

**361 file modifications across all 48 traces** (vs 294 in v9 which missed embedded strings).

**Scanner updated to strict mode:**
- Removed "test artifact" exemption for CSRF in trace files
- Added "Trace internal files scanned" metric (700 files)
- Reports separate session/cookie/CSRF candidate counts
- Fails (exit 1) on any raw credential — no exemptions

---

## All gates

| Gate | Result |
|------|--------|
| API vitest | 679/679 × 4 passes (carried from v9) |
| SOS vitest | 136/136 × 4 passes (carried from v9) |
| Playwright (P3 + P4) | 48/48 × 3 passes (carried from v9) |
| TypeScript gates | 7/7 (carried from v9) |
| Isolation scenarios | 8/8 (carried from v9) |
| Migration proof | PASS (carried from v9) |
| ASCII path check | PASS |
| Trace ZIP integrity | 48/48 PASS |
| SHA256SUMS.txt | 226/226 OK |
| Info-ZIP extraction | PASS |
| Staging secret scan | PASS — Traces:48 Internal:700 CSRF:0 Session:0 Cookie:0 Confirmed:0 |
| Final-ZIP secret scan | PASS — Traces:48 Internal:700 CSRF:0 Session:0 Cookie:0 Confirmed:0 |
| Scanner SHA = ZIP SHA | YES |
| Scanner excludes CSRF as test artifact | NO (strict mode) |

---

## Key pitfall for future sessions

CSRF token format in Playwright traces is `hash.signature` (dot-separated). Regex must include `.` in the token character class: `[A-Za-z0-9+/=_\-\.]{8,}` — without the dot, the sanitizer only removes the hash part and leaves `.signature` visible, which the verification regex then re-matches as a hit.

Also: Playwright stores HTTP log lines inside JSON string arrays (not as structured `{name,value}` objects). A sanitizer that only processes structured headers will miss these. Always run a text-level regex pass on the full serialized output.
