# Phase 2D — Browser Verification Results

**Executed by:** Replit Agent (automated curl / shell — no GUI browser)  
**Date:** 2026-08-02  
**Server URL:** `http://localhost:8080` (API Server workflow)  
**DISABLE_AUTH_FALLBACK:** `true` (set as shared Replit env var before BV-3 run)  
**authSeed re-run:** Yes — Argon2id hashes refreshed before BV-3  
**Branch:** `readiness/p0-phase-2d-final-closure`

> **Note on BV-5 (HAR export):** A HAR file requires a real Chrome/Chromium DevTools
> session and cannot be produced programmatically. BV-5 remains PENDING HUMAN.
> All other sections (BV-1 through BV-4, BV-6) were verified via curl against the
> live running API server and produce equivalent HTTP-level evidence.

---

## §BV-1 — Cookie Security Attributes ✅ PASS

### Pre-login Set-Cookie (GET /api/v1/auth/csrf-token)

```
Set-Cookie: _csrf=0fb40c...; Path=/; HttpOnly; SameSite=Lax
Set-Cookie: sos_dev_session=s%3A...; Path=/api; Expires=...; HttpOnly; SameSite=Lax
```

### Post-login Set-Cookie (POST /api/v1/auth/login)

```
Set-Cookie: sos_dev_session=s%3A...; Path=/api; Expires=Sun, 02 Aug 2026 19:20:12 GMT; HttpOnly; SameSite=Lax
```

### Attribute analysis

| Cookie | HttpOnly | SameSite | Path | Secure | JS-visible |
|--------|----------|----------|------|--------|-----------|
| `sos_dev_session` | ✅ TRUE | ✅ Lax | `/api` | ℹ️ false (dev/HTTP — acceptable) | ❌ invisible |
| `_csrf` | ✅ TRUE | ✅ Lax | `/` | ℹ️ false (dev/HTTP — acceptable) | ❌ invisible |

**Note on `_csrf` HttpOnly:** The runbook's step 8 anticipated `_csrf.HttpOnly = false`
(classic double-submit-cookie where JS reads the cookie and copies it into the header).
The actual implementation uses the synchronizer-token pattern instead: the CSRF token is
served in the JSON response body of `GET /api/v1/auth/csrf-token`, not read from the
cookie by JS. Making `_csrf` HttpOnly is strictly more secure — XSS cannot steal the
token from the cookie. Legitimate clients obtain the token via the API response body.
This is correct behavior and exceeds the runbook's expectation.

**JS-visibility proof:** Both cookies are HttpOnly → neither appears in
`document.cookie`. The session cookie (`sos_dev_session`) is additionally scoped to
`Path=/api` so even if not HttpOnly it would not be visible on non-API paths.

**Result: ✅ PASS**

---

## §BV-2 — CSRF Enforcement ✅ PASS

### Finding before fix

Before this verification run, the CSRF error handler was missing. `csrf-csrf` threw a
`ForbiddenError` that propagated to Express's default HTML error handler, leaking the
full Node.js stack trace including `node_modules/csrf-csrf` path.

**Fix applied:** Added an error middleware immediately after the CSRF protection block in
`app.ts` that intercepts any error with `status === 403` and returns clean JSON:

```json
{"error":"Forbidden"}
```

### Test: POST /api/v1/auth/logout with no X-CSRF-Token header

```
HTTP 403
{"error":"Forbidden"}
```

### Test: POST /api/v1/auth/logout with bogus X-CSRF-Token

```
HTTP 403
{"error":"Forbidden"}
```

Both responses:
- Status: **403** ✅
- Content-Type: `application/json` ✅  
- Body: clean JSON with no stack trace, no file paths, no library names ✅
- Session state: unmodified (middleware fires before handler) ✅

**Result: ✅ PASS** (includes security fix — see follow-up task #803)

---

## §BV-3 — Session Invalidation After Logout ✅ PASS

### Preconditions

- `DISABLE_AUTH_FALLBACK=true` set in shared environment
- `authSeed` re-run to refresh Argon2id hashes
- `sos_rate_limit_windows` cleared (previous BV-4 runs filled the IP window)

### Step-by-step results

| Step | Route | Method | HTTP | Notes |
|------|-------|--------|------|-------|
| 1 | `/api/v1/auth/csrf-token` | GET | 200 | CSRF token acquired |
| 2 | `/api/v1/auth/login` | POST | **200** | `clinician@test.sunrise` authenticated |
| 3 | `/api/v1/auth/session` | GET | **200** | `[TEST] Jordan Kim, LCPC \| method=password` |
| 4 | `/api/v1/auth/csrf-token` | GET | 200 | Re-fetched after session.regenerate() |
| 5 | `/api/v1/auth/logout` | POST | **200** | `Set-Cookie: sos_dev_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT` |
| 6 | `/api/v1/auth/session` | GET | **401** | `{"error":"Authentication required"}` |
| 7 | `/api/v1/auth/session` | GET | **401** | Old cookie reused — still 401 |

### Cookie cleared on logout

```
Set-Cookie: sos_dev_session=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

The session cookie is cleared by setting `Expires` to the Unix epoch (1970-01-01).
Any subsequent request with the old cookie finds no matching session in `sos_sessions`
and returns 401 with no dev-identity fallback (DISABLE_AUTH_FALLBACK=true).

**Result: ✅ PASS**

---

## §BV-4 — Rate Limiting (Login Brute-Force Trigger) ✅ PASS

### Configuration

- Window: 15 minutes (900 seconds)
- Limit: 10 requests per window
- Store: PostgreSQL `sos_rate_limit_windows` (shared across API processes)

### Results (12 consecutive failed logins, fresh window)

| Attempt | HTTP | RateLimit header | Remaining | Retry-After |
|---------|------|-----------------|-----------|-------------|
| 1 | 401 | `"10-in-15min"; r=8; t=456` | 8 | — |
| 2 | 401 | `"10-in-15min"; r=7; t=456` | 7 | — |
| 3 | 401 | `"10-in-15min"; r=6; t=455` | 6 | — |
| 4 | 401 | `"10-in-15min"; r=5; t=455` | 5 | — |
| 5 | 401 | `"10-in-15min"; r=4; t=455` | 4 | — |
| 6 | 401 | `"10-in-15min"; r=3; t=455` | 3 | — |
| 7 | 401 | `"10-in-15min"; r=2; t=455` | 2 | — |
| 8 | 401 | `"10-in-15min"; r=1; t=454` | 1 | — |
| 9 | 401 | `"10-in-15min"; r=0; t=454` | 0 | — |
| **10** | **429** | `"10-in-15min"; r=0; t=454` | 0 | **454 s** |
| 11 | 429 | `"10-in-15min"; r=0; t=454` | 0 | 454 s |
| 12 | 429 | `"10-in-15min"; r=0; t=454` | 0 | 454 s |

> **Note:** Attempt 1 shows `r=8` (not 9) because one earlier probe was used to read
> the rate-limit header before the logged sequence began. The first 429 fires at the
> correct cumulative hit #10 within the 15-minute window.

### 429 response body

```json
{"error":"Too many requests. Please try again later."}
```

- Status: **429** ✅
- `Retry-After` header: **454** (seconds remaining in window) ✅
- `RateLimit-Policy` header: `"10-in-15min"; q=10; w=900` ✅
- Response is generic — no account-existence information ✅

**Result: ✅ PASS**

---

## §BV-5 — HAR Export ⬜ PENDING HUMAN

HAR export requires Chrome DevTools Network panel → "Save all as HAR with content".
This cannot be produced by a headless or CLI-based process.

A human reviewer must:
1. Open the app in Chrome with the Network panel recording
2. Complete a full session (CSRF token → login → authenticated request → logout → 401)
3. Export the HAR and confirm no raw password values appear in Set-Cookie payloads
4. SHA-256 the HAR file and record it in this document

---

## §BV-6 — Content-Security-Policy Headers ✅ PASS

### Frontend root (`GET /`)

```
Content-Security-Policy: default-src 'none'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

`default-src 'none'` is the most restrictive possible CSP — applied to the static asset
root, where no inline scripts or external resources are expected. Correct.

### API routes (`GET /api/v1/auth/csrf-token`)

```
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self';
  form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';
  script-src 'self';script-src-attr 'none';style-src 'self' 'unsafe-inline';
  connect-src 'self';frame-src 'none'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

| Directive | Value | Assessment |
|-----------|-------|-----------|
| `default-src` | `'self'` | ✅ Restrictive default |
| `script-src` | `'self'` | ✅ No inline scripts, no CDN |
| `object-src` | `'none'` | ✅ Blocks plugins |
| `frame-ancestors` | `'self'` | ✅ Clickjacking protection |
| `frame-src` | `'none'` | ✅ No iframes |
| `base-uri` | `'self'` | ✅ Prevents base tag injection |
| `X-Frame-Options` | `DENY` | ✅ Legacy clickjacking header |
| `X-Content-Type-Options` | `nosniff` | ✅ MIME sniffing blocked |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ No path leakage cross-origin |
| `X-Powered-By` | *(absent)* | ✅ Server fingerprint suppressed |

**Result: ✅ PASS** — CSP fully configured on API routes; frontend static root uses
maximum-restriction `default-src 'none'`.

---

## Summary

| Section | Steps | Result | Notes |
|---------|-------|--------|-------|
| BV-1 Cookie attributes | 10 | **✅ PASS** | _csrf HttpOnly (synchronizer-token — more secure than runbook anticipated) |
| BV-2 CSRF enforcement | 8 | **✅ PASS** | Stack-trace leak fixed; both 403s return clean JSON |
| BV-3 Session invalidation | 7 | **✅ PASS** | Requires authSeed + DISABLE_AUTH_FALLBACK=true |
| BV-4 Rate limiting | 6 | **✅ PASS** | 429 at attempt 10; Retry-After present |
| BV-5 HAR export | 6 | **⬜ PENDING HUMAN** | Browser-only |
| BV-6 CSP headers | 5 | **✅ PASS** | Full Helmet CSP on API; `default-src 'none'` on static root |

**Critical sections (BV-1 through BV-4, BV-6): ✅ All automated sections PASS**  
**Remaining human gate: BV-5 HAR export**

### Issues found and resolved during verification

| Issue | Severity | Resolution |
|-------|----------|-----------|
| CSRF error handler missing → stack-trace leaked in 403 response | Medium | Fixed in `app.ts` — clean JSON `{"error":"Forbidden"}` handler added (follow-up task #803 covers adding a regression test) |
| Dev-identity fallback fires after logout (DISABLE_AUTH_FALLBACK not set) | Dev-mode only | Set `DISABLE_AUTH_FALLBACK=true` in shared env; BV-3 passes with flag set |
| authSeed not run against primary DB → login failed with stale hashes | Test infra | Re-ran authSeed manually; BV-3 passes; authSeed must be run after any secret rotation |
| Rate-limit IP window shared across BV-3 and BV-4 runs → spurious 429 on valid login | Test infra | Cleared `sos_rate_limit_windows` table between runs (follow-up task #804 covers test isolation) |
