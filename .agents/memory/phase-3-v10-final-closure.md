---
name: Phase 3 v10-final closure
description: v10-final CLOSED — 3 CSRF traces patched; recursive ZIP scanner (20 ZIPs/19 traces/4 HARs/0 confirmed secrets); ZIP sha256 9fd4213c
---

## v10-final Security Patch

**Context:** v10 was rejected because three Playwright traces contained raw X-CSRF-Token header values in the binary 0-trace.trace data (HTTP wire format, not JSON event format). The v10 scanner also scanned 0 files when given the final ZIP path.

### Traces patched
- `sanitized-traces/trace-D-4-billing-denial.zip` — 1 CSRF replacement
- `sanitized-traces/trace-D-6-another-author-sign-denial.zip` — 1 CSRF replacement
- `sanitized-traces/trace-D-7-original-author-void-denial.zip` — 1 CSRF replacement

**Patcher approach:** regex on raw bytes matching `(?i)(x-csrf-token\s*:\s*)([A-Za-z0-9\-._~+/]{16,}...)` — replaces the value portion with `[REDACTED]`. Covers both HTTP wire format and JSON-embedded header objects.

### Scanner fixes
1. **CSRF policy change:** raw X-CSRF-Token values → `confirmed_secret` (no test-artifact exemption)
2. **Recursive ZIP mode:** when the root target is a `.zip` file, `scan_file` calls `scan_zip` which opens the outer ZIP and recursively opens all nested ZIPs. This is how the final ZIP scan sees 20+ archives (1 outer + 19 trace ZIPs).
3. **Gate checks apply only in ZIP mode** (when root path is a `.zip` file): files ≥ 1, ZIP archives ≥ 20, trace archives = 19, HAR files = 4. Directory mode has no ZIP-count gate.
4. **HAR files inside ZIPs:** explicitly counted (not just files in outer directory).

### Final results
- Staging scan (directory): 163 files, 19 traces, 4 HARs, 0 CSRF, 0 confirmed secrets, EXIT:0
- Final ZIP scan (ZIP mode): 1 file, 20 ZIPs, 19 traces, 4 HARs, 0 CSRF, 0 confirmed secrets, EXIT:0
- `sha256sum -c SHA256SUMS.txt` → exit 0 (165 entries)
- ZIP: `artifacts/sunrise-os/readiness/phase-3-clinical-documentation-foundation-review-v10-final.zip`
- ZIP SHA256: `9fd4213c5dab2c2ea3f19e7a1d5a8ae1621cd219d4328455532c440ab11c27ce`

**Why CSRF tokens appeared in wire format but not JSON format:** The sanitize-traces-v8.py script redacts CSRF tokens in the Playwright trace JSON event structure (`"name":"x-csrf-token","value":"[REDACTED]"`). However, the binary `.trace` file also embeds raw HTTP request/response data as newline-delimited records where headers appear in the form `x-csrf-token: VALUE`. The sanitizer's regex pass did not cover this second encoding. The patcher operates directly on raw bytes and covers both formats.
