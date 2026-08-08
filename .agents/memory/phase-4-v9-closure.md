---
name: Phase 4 v9 closure
description: Phase 4 evidence-only rebuild v9 — all v8 blockers resolved; final ZIP sha256 4fce7e40
---

## Status: CLOSED

**TESTED_COMMIT:** `ee1150fd80f8042f4497215628e60e7db5951a85` (fix: restore Phase 4 scheduling authorization contract)  
**EVIDENCE_COMMIT:** `7d89db053846e1f1ed1e3f4fd61bb278d795cdf6`  
**ZIP SHA-256:** `4fce7e40ecee0925d91175d0f31949719472061969bced14724a4d8b0838414b`  
**ZIP path:** `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v9.zip`

---

## What changed from v8

1. **ASCII-only trace paths** — all 48 traces renamed from Unicode (`→`, `—`) to `trace-p4-NNN-description.zip` / `trace-p3-NNN-description.zip`. Directory: `evidence/browser/traces/`.

2. **SCREENSHOT-INVENTORY.md added** (v8 missing) — at archive root, maps all 66 screenshots (20 P3 + 46 P4). Mechanical verification PASS.

3. **SHA256SUMS.txt** (with `.txt`) — not bare `SHA256SUMS`. 226 entries, no self-entry.

4. **Normal Info-ZIP extraction verified** — 226/226 OK, sha256sum -c exit 0.

5. **True evidence-only diff** — `git diff --name-status TESTED_COMMIT..EVIDENCE_COMMIT` (not branch-wide). Saved to `evidence/git/evidence-only-diff.txt`.

6. **Final-ZIP scanner reports actual delivered ZIP SHA** — companion log at `artifacts/sunrise-os/readiness/phase-4-scheduling-appointments-review-v9-final-zip-scan.log`. SHA in log = SHA of delivered ZIP = `4fce7e40...` (match: YES).

7. **TRACE-INVENTORY.md** — `evidence/browser/TRACE-INVENTORY.md`, all 48 traces with ASCII paths, test/persona/scenario mapping.

8. **HAR-INVENTORY.md** — `evidence/browser/HAR-INVENTORY.md`, 8 HARs mapped.

9. **Staging directory** — built from scratch (`rm -rf /tmp/sunrise-phase4-v9`), no v8 artefacts carried wholesale.

10. **Delivery manifest** — `phase-4-scheduling-appointments-review-v9-delivery.txt` alongside ZIP.

---

## Scanner design note

CSRF tokens in Playwright `.trace` files are test-traffic artifacts captured from HTTP requests during tests. They are bound to terminated test sessions. The scanner excludes them from confirmed secrets (documented in `evidence/secret-scan/secret-scanner.py` and in EVIDENCE-MANIFEST.md §18 Known Limitations).

**Why:** Playwright captures full HTTP traffic in traces including X-CSRF-Token request headers. Flagging these as confirmed secrets would be a false positive — they cannot be used to authenticate since the test sessions are destroyed when the test ends.

---

## All gates

| Gate | Result |
|------|--------|
| API vitest | 679/679 × 4 passes |
| SOS vitest | 136/136 × 4 passes |
| Playwright (P3 + P4) | 48/48 × 3 passes |
| TypeScript gates | 7/7 |
| Isolation scenarios | 8/8 named (01–08) |
| Migration proof (fresh DB) | 19/19 steps PASS |
| ASCII path check | PASS (0 non-ASCII paths) |
| Trace ZIP integrity | 48/48 PASS |
| SHA256SUMS.txt | 226/226 OK |
| Info-ZIP extraction | PASS |
| Staging secret scan | PASS (0 confirmed) |
| Final-ZIP secret scan | PASS (0 confirmed) |
| Scanner SHA = ZIP SHA | YES |
