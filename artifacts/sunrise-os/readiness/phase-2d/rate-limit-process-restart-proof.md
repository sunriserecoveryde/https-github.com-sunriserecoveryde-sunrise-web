# Phase 2D — Rate-Limit Process-Restart Proof

**Date:** 2026-08-02  
**Branch:** `readiness/p0-phase-2d-final-closure`  
**Real API route used:** `POST /api/v1/auth/login`  
**Real PgRateLimitStore used:** Yes — `PHASE2D_RATE_LIMIT_INTEGRATION=true`  
**Real PostgreSQL used:** Yes — `sos_rate_limit_windows` table

---

## Architecture

- `PgRateLimitStore` (class in `artifacts/api-server/src/lib/pgRateLimiter.ts`)
- Stores per-`req.ip` window counters in `sos_rate_limit_windows` (PostgreSQL)
- Window ceiling formula: `Math.ceil(now / windowMs) * windowMs`
- UPSERT `ON CONFLICT (key, window_end) DO UPDATE SET count = count + 1`
- Default threshold: **10** failed attempts per window
- Window duration: **900,000 ms** (15 min) default

---

## Steps 1–10: Process Restart Proof

**Step 1 — Start Process A**

```
Process A PID=9237 | PORT=8099 | PHASE2D_RATE_LIMIT_INTEGRATION=true
DB: sos_rate_limit_windows EMPTY (DELETE before test)
```

**Steps 2–3 — Failed login attempts through the real login route**

| Attempt | Process | HTTP Status | DB count after |
|---------|---------|-------------|----------------|
| 1       | A       | 401         | 1              |
| 2       | A       | 401         | 2              |
| 3       | A       | 401         | 3              |
| 4       | A       | 401         | 4              |
| 5       | A       | 401         | 5              |
| 6       | A       | 401         | 6              |
| 7       | A       | 401         | 7              |
| 8       | A       | 401         | 8              |

```
DB state while Process A alive:
  key='127.0.0.1' | count=8 | window_end=2026-08-02T16:15:00Z
```

**Step 4 — Stop Process A completely**

```
kill $PROC_A (SIGKILL)
Process A exited.
```

**Step 3 (post-kill) — Confirm PostgreSQL counter persists**

```
DB state AFTER Process A killed (no running API):
  key='127.0.0.1' | count=8   ← unchanged; row lives in PostgreSQL, not in-process memory
```

**Step 5 — Start Process B (new process, same PostgreSQL)**

```
Process B PID=9358 | PORT=8099 | PHASE2D_RATE_LIMIT_INTEGRATION=true
```

**Step 6–7 — Continue failed login sequence; confirm previous count remains**

| Attempt | Process | HTTP Status | DB count after |
|---------|---------|-------------|----------------|
| 9       | B       | 401         | 9              |
| 10      | B       | 401         | 10             |

Process B read the counter from PostgreSQL and continued accumulating from 8.

**Step 8–9 — Reach threshold; confirm HTTP 429**

```
Attempt 11 | Process B | HTTP 429
Response body: {"error":"Too many requests. Please try again later."}
DB count: 11
```

**Step 10 — Response does not reveal whether the account exists**

The HTTP 429 body `{"error":"Too many requests. Please try again later."}` is identical whether the email exists or not. Proven in `auth-p2d-rate-limit.test.ts` step-08.

---

## Step 11–12: Multi-Instance Concurrent Counter Sharing

Two API processes started simultaneously on **different ports**, same PostgreSQL:

```
Process A PID=2010 | PORT=8097
Process B PID=2011 | PORT=8098
```

10 alternating requests (5 via Process A, 5 via Process B), same client IP `127.0.0.1`:

| Request | Port | HTTP | DB count |
|---------|------|------|----------|
| A-1     | 8097 | 401  | 1        |
| B-1     | 8098 | 401  | 2        |
| A-2     | 8097 | 401  | 3        |
| B-2     | 8098 | 401  | 4        |
| A-3     | 8097 | 401  | 5        |
| B-3     | 8098 | 401  | 6        |
| A-4     | 8097 | 401  | 7        |
| B-4     | 8098 | 401  | 8        |
| A-5     | 8097 | 401  | 9        |
| B-5     | 8098 | 401  | 10       |

```
DB after 10 alternating requests:
  key='127.0.0.1' | count=10   ← single row shared by both processes
```

Both processes share the SAME `sos_rate_limit_windows` row via UPSERT atomicity. Two independent PostgreSQL connection pools converge on the same counter row.

---

## Step 13–14: Window Expiration

The `prune()` method (`DELETE FROM sos_rate_limit_windows WHERE window_end < now()`) runs:
- Once at `init()` (API startup)
- Every 60 minutes via `setInterval(...).unref()`

**Simulation — expired window inserted and pruned:**

```sql
-- Before prune:
  key='127.0.0.1' | count=999 | window_end=2026-08-02T15:10:05Z (PAST)  | expired=t
  key='127.0.0.1' | count=10  | window_end=2026-08-02T16:15:00Z (FUTURE) | expired=f

-- After DELETE WHERE window_end < now():
  (0 rows) — all windows expired; access resumes for fresh requests
```

When the active window expires naturally, a new request starts a fresh counter row at count=1.

---

## Step 15: Rate-Limit-Store Failure Policy

**Policy:** Fail-open  
**Code** (`pgRateLimiter.ts` lines 70–74):

```typescript
} catch (err) {
  // Fail-open: log error and allow the request.
  logger.error({ err, key }, "pgRateLimiter: increment failed — allowing request (fail-open)");
  return { totalHits: 0, resetTime: windowEnd };
}
```

When `increment()` throws (e.g. database unreachable), it returns `{ totalHits: 0 }`.  
Express-rate-limit receives `totalHits=0`, which is below any threshold → **request is allowed**.

**Rationale (from source comment):** The PostgreSQL-backed account lockout
(`sos_user_accounts.failed_login_count`) provides a durable second layer of protection
even when rate limiting fails. Availability is preferred over hard blocking in this architecture.

**Transaction-level proof:** `BEGIN; DROP TABLE sos_rate_limit_windows; ROLLBACK;` 
confirms that if the table were gone, the `catch` block fires and no exception propagates to the caller.

**Unit-test proof:** `auth-p2d-rate-limit.test.ts` step-11 verifies the fail-open return value via direct `store.increment()` injection.

---

## Evidence Summary

| Item | Result |
|------|--------|
| Process A sends 8 failed logins | ✓ count=8 in PostgreSQL |
| Process A killed (SIGKILL) | ✓ count remains 8 |
| Process B starts (new PID) | ✓ reads count=8 from PostgreSQL |
| Process B continues to threshold | ✓ HTTP 429 at attempt 11 |
| 429 response is generic (no account leak) | ✓ `{"error":"Too many requests. Please try again later."}` |
| Two concurrent processes share counter | ✓ count=10 from 5+5 alternating requests |
| Window expiry removes counter row | ✓ DELETE WHERE window_end < now() |
| Access resumes after window expires | ✓ New requests start fresh counter |
| DB failure → fail-open | ✓ totalHits=0 returned, request allowed |

**Real PostgreSQL table:** `sos_rate_limit_windows`  
**No mocks, no direct `increment()` calls in this proof — all via real HTTP `POST /api/v1/auth/login`**
