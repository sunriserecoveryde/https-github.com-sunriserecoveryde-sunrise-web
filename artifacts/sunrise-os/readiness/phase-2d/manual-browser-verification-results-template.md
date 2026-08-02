# Phase 2D — Manual Browser Verification Results

**Executed by:** ___________________________  
**Date:** ___________________________  
**Chrome version:** ___________________________  
**API instance URL:** ___________________________  
**Branch:** `readiness/p0-phase-2d-final-closure`

---

## §BV-1 Cookie Security Attributes

**`sos_dev_session` cookie attributes:**

| Attribute | Expected | Actual | Pass? |
|-----------|---------|--------|-------|
| HttpOnly | true | | ☐ |
| SameSite | Lax | | ☐ |
| Secure (TLS only) | true | | ☐ / N/A |
| Path | / | | ☐ |

**`_csrf` cookie attributes:**

| Attribute | Expected | Actual | Pass? |
|-----------|---------|--------|-------|
| HttpOnly | false | | ☐ |
| SameSite | Lax | | ☐ |

**Console `document.cookie` output (redact session values):**
```
_csrf=<redacted>
[paste sanitised output here — must NOT contain sos_session]
```

**Screenshot path:** `screenshots/bv1-cookies-panel.png`

**Result:** ☐ Pass  ☐ Fail  ☐ Skipped  
**Notes:**

---

## §BV-2 CSRF Enforcement

**Attempt 1 — no CSRF header:**

| Field | Expected | Actual | Pass? |
|-------|---------|--------|-------|
| HTTP status | 403 | | ☐ |
| `error` body field | csrf\|forbidden (partial match) | | ☐ |

**Attempt 2 — wrong CSRF value:**

| Field | Expected | Actual | Pass? |
|-------|---------|--------|-------|
| HTTP status | 403 | | ☐ |

**Screenshot path:** `screenshots/bv2-csrf-403.png`

**Result:** ☐ Pass  ☐ Fail  ☐ Skipped  
**Notes:**

---

## §BV-3 Session Invalidation After Logout

| Step | Expected | Actual | Pass? |
|------|---------|--------|-------|
| Logout response status | 200 or 204 | | ☐ |
| `sos_dev_session` present after logout | No (absent/expired) | | ☐ |
| `/auth/session` after logout | 401 | | ☐ |

**Screenshot path:** `screenshots/bv3-logout-session.png`

**Result:** ☐ Pass  ☐ Fail  ☐ Skipped  
**Notes:**

---

## §BV-4 Rate Limiting — Login Brute-Force

| Attempt # | Expected status | Actual status | Pass? |
|-----------|----------------|---------------|-------|
| 1 | 401 | | ☐ |
| 2 | 401 | | ☐ |
| 3 | 401 | | ☐ |
| 4 | 401 | | ☐ |
| 5 | 401 | | ☐ |
| 6 (trigger) | 429 | | ☐ |

**`Retry-After` header value on 429 response:** ___________________________

**Screenshot path:** `screenshots/bv4-rate-limit-429.png`

**Result:** ☐ Pass  ☐ Fail  ☐ Skipped  
**Notes:**

---

## §BV-5 HAR Export

| Check | Expected | Actual | Pass? |
|-------|---------|--------|-------|
| HAR file saved | Yes | | ☐ |
| No raw passwords in Set-Cookie | Confirmed | | ☐ |
| Session cookie value is opaque ID | Confirmed | | ☐ |

**HAR filename:** `phase-2d-browser-session-YYYY-MM-DD.har`  
**HAR SHA-256:** ___________________________

**Result:** ☐ Pass  ☐ Fail  ☐ Skipped  
**Notes:**

---

## §BV-6 CSP Headers (Optional)

**`Content-Security-Policy` header value (or "not configured"):**
```
[paste here]
```

**Result:** ☐ Present  ☐ Not configured (Phase 3 item)  
**Notes:**

---

## Overall Sign-Off

| Critical section | Result |
|-----------------|--------|
| BV-1 Cookie attributes | ☐ Pass  ☐ Fail  ☐ Skipped |
| BV-2 CSRF enforcement | ☐ Pass  ☐ Fail  ☐ Skipped |
| BV-3 Session invalidation | ☐ Pass  ☐ Fail  ☐ Skipped |
| BV-4 Rate limiting 429 | ☐ Pass  ☐ Fail  ☐ Skipped |
| BV-5 HAR export | ☐ Pass  ☐ Fail  ☐ Skipped |

**Phase 2D browser verification:** ☐ PASSED  ☐ FAILED  ☐ PENDING  

**Reviewer signature:** ___________________________  
**Date signed:** ___________________________  
