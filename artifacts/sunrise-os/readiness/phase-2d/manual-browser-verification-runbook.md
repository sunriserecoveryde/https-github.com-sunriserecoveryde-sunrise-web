# Phase 2D — Manual Browser Verification Runbook

**Version:** 1.0.0  
**Date:** 2026-08-02  
**Branch:** `readiness/p0-phase-2d-final-closure`  
**Purpose:** Human-executed Chromium verification of session security, CSRF enforcement,
and rate-limit behaviour that cannot be exercised by a headless automated runner.

> **Note:** Replit's sandboxed environment cannot run a real Chromium browser. These
> steps must be executed by a human using Chrome/Chromium DevTools against a locally
> running or deployed instance of the API server. Record actual outcomes in the
> companion results template.

---

## Prerequisites

| Item | Required value |
|------|---------------|
| API server URL | `http://localhost:3000` (or deployed URL) |
| Dev seed running | `pnpm --filter @workspace/api-server seed:auth` |
| DISABLE_AUTH_FALLBACK | `true` |
| PHASE2D_TEST_PASSWORD | Set (not shown) |
| Chrome version | ≥ 124 |
| DevTools | Network + Application tabs open |

---

## §BV-1  Cookie Security Attributes

**Goal:** Confirm session cookie carries `HttpOnly`, `SameSite=Lax`, and — in TLS
deployments — `Secure`. Confirm the `_csrf` cookie is readable by JS (no `HttpOnly`).

### Steps

1. Open `chrome://settings/clearBrowserData` → clear cookies for `localhost`.
2. Navigate to the login page (`/login`).
3. Open DevTools → **Application → Cookies → http://localhost:3000**.
4. **Before login:** confirm no `sos_session` or `sos_dev_session` cookie is present.
5. Submit valid credentials (org slug `sunrise`, email `clinician@test.sunrise`,
   password = PHASE2D_TEST_PASSWORD value).
6. After redirect, return to the Cookies panel.
7. **Record** for `sos_dev_session` (or `sos_session` in production):
   - `HttpOnly` column = **true**
   - `SameSite` = **Lax**
   - `Secure` = **true** (TLS only; http localhost may show false — acceptable)
   - `Path` = `/`
8. **Record** for `_csrf`:
   - `HttpOnly` = **false** (must be JS-readable)
   - `SameSite` = **Lax**
9. In DevTools **Console**, run `document.cookie`.
   - Must contain `_csrf=…` but **must NOT** contain `sos_session` or
     `sos_dev_session` (HttpOnly cookies are invisible to JS).
10. Capture a full-panel screenshot of the Cookies tab showing both rows.

**Expected:** `sos_*session` is HttpOnly; `_csrf` is not.

---

## §BV-2  CSRF Enforcement

**Goal:** Confirm that mutating routes reject requests with a missing or mismatched
CSRF token.

### Steps

1. While logged in (from BV-1), open DevTools → **Network**.
2. Click "Preserve log".
3. In DevTools **Console**, attempt a forged POST without CSRF header:

```javascript
fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => console.log('Status:', r.status));
```

4. **Record** response status — expected **403**.
5. Inspect the Network row → Preview tab. Record the `error` field value.
6. Attempt same POST with a wrong CSRF value:

```javascript
fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': 'bogus-token-value'
  }
}).then(r => console.log('Status:', r.status));
```

7. **Record** response status — expected **403**.
8. Capture Network panel screenshot showing the 403 responses.

**Expected:** Both attempts return 403 without touching session state.

---

## §BV-3  Session Invalidation After Logout

**Goal:** Confirm the session cookie is cleared and subsequent authenticated requests
return 401 after logout.

### Steps

1. While logged in, note the current `sos_dev_session` cookie value from the
   Application panel.
2. Obtain a CSRF token:

```javascript
const r = await fetch('/api/v1/auth/csrf-token');
const { csrfToken } = await r.json();
console.log(csrfToken);
```

3. Perform logout with the CSRF token:

```javascript
const csrfToken = '<paste from above>';
const res = await fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
});
console.log('Logout status:', res.status);
```

4. **Record** logout status — expected **200** or **204**.
5. Check the Application → Cookies panel. **Record** whether `sos_dev_session`
   cookie is now absent or has an empty/expired value.
6. Attempt to hit an authenticated route:

```javascript
fetch('/api/v1/auth/session', { credentials: 'include' })
  .then(r => console.log('Session after logout:', r.status));
```

7. **Record** status — expected **401** (not 200).
8. Capture the Console and Cookies panel screenshots.

**Expected:** Cookie cleared; session route returns 401.

---

## §BV-4  Rate Limiting — Login Brute-Force Trigger

**Goal:** Confirm that repeated failed logins from the same IP trigger HTTP 429 and
that the response includes a `Retry-After` header.

> ⚠️ Run against a **development/test** instance only. This will briefly lock the
> test account.

### Steps

1. Clear cookies for localhost.
2. Obtain a CSRF token from the terminal or console:

```javascript
const r = await fetch('/api/v1/auth/csrf-token');
const d = await r.json(); console.log(d.csrfToken);
```

3. Fire 6 rapid failed logins (adjust count per `PHASE2D_RATE_LIMIT_MAX` if set):

```javascript
const csrfToken = '<paste>';
for (let i = 0; i < 6; i++) {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      orgSlug: 'sunrise',
      email: 'clinician@test.sunrise',
      password: 'wrong-password-' + i,
    }),
  });
  console.log(`Attempt ${i+1}: ${res.status}`, res.headers.get('retry-after'));
}
```

4. **Record** the status code of each attempt.
   - First N attempts (N < limit): 401
   - Attempt that triggers the limit: **429**
5. **Record** the `Retry-After` header value from the 429 response.
6. Capture Network panel screenshot showing the 429 row with response headers.

**Expected:** 429 after exceeding the window limit; `Retry-After` header present.

---

## §BV-5  DevTools HAR Export

**Goal:** Produce a HAR file covering BV-1 through BV-4 for evidence archival.

### Steps

1. With the full Network log captured from BV-1 through BV-4:
2. Right-click any row in the Network panel → **"Save all as HAR with content"**.
3. Save as `phase-2d-browser-session-YYYY-MM-DD.har`.
4. Open the HAR file in a text editor and confirm:
   - No `Set-Cookie` headers contain raw password values.
   - `sos_dev_session` cookie values are opaque session IDs (not JWTs or plaintext).
5. SHA-256 the HAR file: `sha256sum phase-2d-browser-session-YYYY-MM-DD.har`
6. **Record** the SHA-256 in the results template.

**Expected:** HAR captured; no credentials visible in cookie payload.

---

## §BV-6  Content-Security-Policy Header (Optional — Hardening)

**Goal:** Verify CSP headers are present on HTML responses (if configured).

### Steps

1. Navigate to the root of the frontend (`/`).
2. In Network panel, click the initial document request.
3. In the **Headers** tab, look for `Content-Security-Policy` or
   `Content-Security-Policy-Report-Only`.
4. **Record** the full header value if present.
5. If absent, record "CSP not yet configured" — this is acceptable for Phase 2D
   (CSP hardening is a Phase 3 item).

---

## Checklist Summary

| Section | Step Count | Result |
|---------|-----------|--------|
| BV-1 Cookie attributes | 10 steps | ☐ Pass / ☐ Fail / ☐ Skipped |
| BV-2 CSRF enforcement | 8 steps | ☐ Pass / ☐ Fail / ☐ Skipped |
| BV-3 Session invalidation | 8 steps | ☐ Pass / ☐ Fail / ☐ Skipped |
| BV-4 Rate limiting 429 | 6 steps | ☐ Pass / ☐ Fail / ☐ Skipped |
| BV-5 HAR export | 6 steps | ☐ Pass / ☐ Fail / ☐ Skipped |
| BV-6 CSP headers | 5 steps | ☐ Pass / ☐ Fail / ☐ N/A |

**Overall:** ☐ All critical sections passed (BV-1 through BV-5)

---

*Executed by:* ___________________________  
*Date:* ___________________________  
*Chrome version:* ___________________________  
*Instance URL:* ___________________________  
