/**
 * Unit tests for the pending-delete tombstone helpers.
 *
 * These guard against the regression where a failed DELETE permanently hides a
 * conversation because the tombstone is never cleared.  The TTL-based expiry
 * ensures that even if the app is force-quit mid-delete and never retries, the
 * conversation reappears on the device within 7 days.
 */

import {
  PENDING_DELETE_TTL_MS,
  parsePendingDeletes,
  normalizePendingDeletes,
  addEntryToRaw,
  removeEntryFromRaw,
} from "../pendingDeletes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = 1_753_000_000_000; // fixed reference timestamp (ms)
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function v2Entry(id: number, addedAt: number) {
  return { id, addedAt };
}

function v2Raw(...entries: Array<{ id: number; addedAt: number }>): string {
  return JSON.stringify(entries);
}

// ---------------------------------------------------------------------------
// parsePendingDeletes
// ---------------------------------------------------------------------------

describe("parsePendingDeletes", () => {
  it("returns empty set for null input", () => {
    expect(parsePendingDeletes(null, NOW).size).toBe(0);
  });

  it("returns empty set for invalid JSON", () => {
    expect(parsePendingDeletes("not-json", NOW).size).toBe(0);
  });

  it("returns empty set for non-array JSON", () => {
    expect(parsePendingDeletes('{"id":1}', NOW).size).toBe(0);
  });

  // ----- v1 backward compat (plain number[]) --------------------------------

  it("reads v1 plain-number-array format and keeps all entries (no timestamp → treated as live)", () => {
    const raw = JSON.stringify([1, 2, 3]);
    const result = parsePendingDeletes(raw, NOW);
    expect(result).toEqual(new Set([1, 2, 3]));
  });

  // ----- v2 timestamped format ----------------------------------------------

  it("keeps entries younger than TTL", () => {
    const raw = v2Raw(
      v2Entry(10, NOW - HOUR),       // 1 hour old → live
      v2Entry(20, NOW - 12 * HOUR),  // 12 hours old → live
    );
    const result = parsePendingDeletes(raw, NOW);
    expect(result).toEqual(new Set([10, 20]));
  });

  it("drops entries that have exceeded the 7-day TTL", () => {
    const raw = v2Raw(
      v2Entry(10, NOW - HOUR),            // live
      v2Entry(99, NOW - 7 * DAY - 1),     // expired by 1 ms
      v2Entry(88, NOW - 10 * DAY),        // expired
    );
    const result = parsePendingDeletes(raw, NOW);
    expect(result).toEqual(new Set([10]));
    expect(result.has(99)).toBe(false);
    expect(result.has(88)).toBe(false);
  });

  it("returns empty set when all entries are expired", () => {
    const raw = v2Raw(
      v2Entry(1, NOW - 7 * DAY - HOUR),
      v2Entry(2, NOW - 10 * DAY),
    );
    expect(parsePendingDeletes(raw, NOW).size).toBe(0);
  });

  it("treats an entry added exactly at TTL boundary as expired (strict <)", () => {
    const raw = v2Raw(v2Entry(5, NOW - PENDING_DELETE_TTL_MS));
    // NOW - addedAt === TTL → NOT < TTL → expired
    expect(parsePendingDeletes(raw, NOW).has(5)).toBe(false);
  });

  it("treats an entry added 1 ms before TTL boundary as live", () => {
    const raw = v2Raw(v2Entry(5, NOW - PENDING_DELETE_TTL_MS + 1));
    expect(parsePendingDeletes(raw, NOW).has(5)).toBe(true);
  });

  it("handles mixed v1 numbers and v2 objects in the same array", () => {
    // Defensive: should not happen in practice but must not crash
    const raw = JSON.stringify([
      1,                                  // v1 plain number → kept
      v2Entry(2, NOW - HOUR),             // v2 live → kept
      v2Entry(3, NOW - 8 * DAY),           // v2 expired → dropped
    ]);
    const result = parsePendingDeletes(raw, NOW);
    expect(result).toEqual(new Set([1, 2]));
  });
});

// ---------------------------------------------------------------------------
// addEntryToRaw
// ---------------------------------------------------------------------------

describe("addEntryToRaw", () => {
  it("creates a new entry when storage is empty (null)", () => {
    const updated = addEntryToRaw(null, 42, NOW);
    const result = parsePendingDeletes(updated, NOW);
    expect(result).toEqual(new Set([42]));
  });

  it("adds to existing live entries without losing them", () => {
    const existing = v2Raw(v2Entry(1, NOW - HOUR));
    const updated = addEntryToRaw(existing, 2, NOW);
    const result = parsePendingDeletes(updated, NOW);
    expect(result).toEqual(new Set([1, 2]));
  });

  it("prunes expired entries at the same time as adding a new one", () => {
    const existing = v2Raw(
      v2Entry(1, NOW - HOUR),       // live
      v2Entry(99, NOW - 8 * DAY),    // expired
    );
    const updated = addEntryToRaw(existing, 2, NOW);
    const result = parsePendingDeletes(updated, NOW);
    expect(result).toEqual(new Set([1, 2]));
    expect(result.has(99)).toBe(false);
  });

  it("is idempotent — adding the same id twice doesn't duplicate it", () => {
    const step1 = addEntryToRaw(null, 5, NOW);
    const step2 = addEntryToRaw(step1, 5, NOW + HOUR);
    const result = parsePendingDeletes(step2, NOW + HOUR);
    expect(result).toEqual(new Set([5]));
  });
});

// ---------------------------------------------------------------------------
// removeEntryFromRaw
// ---------------------------------------------------------------------------

describe("removeEntryFromRaw", () => {
  it("returns null when the only entry is removed (signals key deletion)", () => {
    const raw = v2Raw(v2Entry(7, NOW - HOUR));
    expect(removeEntryFromRaw(raw, 7, NOW)).toBeNull();
  });

  it("returns null for empty/null input", () => {
    expect(removeEntryFromRaw(null, 7, NOW)).toBeNull();
  });

  it("removes the specified entry and keeps the rest", () => {
    const raw = v2Raw(v2Entry(1, NOW - HOUR), v2Entry(2, NOW - 2 * HOUR));
    const updated = removeEntryFromRaw(raw, 1, NOW);
    expect(updated).not.toBeNull();
    const result = parsePendingDeletes(updated!, NOW);
    expect(result).toEqual(new Set([2]));
  });

  it("is a no-op when the id is not present", () => {
    const raw = v2Raw(v2Entry(1, NOW - HOUR));
    const updated = removeEntryFromRaw(raw, 999, NOW);
    // Entry 1 is still there
    expect(updated).not.toBeNull();
    const result = parsePendingDeletes(updated!, NOW);
    expect(result).toEqual(new Set([1]));
  });

  it("also prunes expired entries while removing the target", () => {
    const raw = v2Raw(
      v2Entry(1, NOW - HOUR),     // live — target to remove
      v2Entry(2, NOW - HOUR * 2), // live — keep
      v2Entry(3, NOW - 8 * DAY),  // expired — should be pruned
    );
    const updated = removeEntryFromRaw(raw, 1, NOW);
    expect(updated).not.toBeNull();
    const result = parsePendingDeletes(updated!, NOW);
    expect(result).toEqual(new Set([2]));
    expect(result.has(3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizePendingDeletes — v1→v2 migration
// ---------------------------------------------------------------------------

describe("normalizePendingDeletes", () => {
  it("returns null for null input", () => {
    expect(normalizePendingDeletes(null, NOW)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(normalizePendingDeletes("bad", NOW)).toBeNull();
  });

  it("returns null when all entries are expired (empty result)", () => {
    const raw = v2Raw(v2Entry(1, NOW - 8 * DAY), v2Entry(2, NOW - 10 * DAY));
    expect(normalizePendingDeletes(raw, NOW)).toBeNull();
  });

  it("stamps v1 plain-number entries with nowMs so they get a bounded lifetime", () => {
    const raw = JSON.stringify([42, 99]); // v1
    const result = normalizePendingDeletes(raw, NOW);
    expect(result).not.toBeNull();
    // After normalization, reading at NOW should still see both ids
    expect(parsePendingDeletes(result!, NOW)).toEqual(new Set([42, 99]));
  });

  it("v1 entries stamped at T expire at T + TTL — they cannot hide a conversation forever", () => {
    const v1Raw = JSON.stringify([7]); // legacy plain number
    const T = NOW;

    // Normalize at time T: stamps addedAt = T
    const normalizedAtT = normalizePendingDeletes(v1Raw, T)!;
    expect(normalizedAtT).not.toBeNull();

    // Still live at T + TTL - 1
    expect(parsePendingDeletes(normalizedAtT, T + PENDING_DELETE_TTL_MS - 1).has(7)).toBe(true);

    // Expired at exactly T + TTL
    expect(parsePendingDeletes(normalizedAtT, T + PENDING_DELETE_TTL_MS).has(7)).toBe(false);

    // Definitely gone at T + 8 days
    expect(parsePendingDeletes(normalizedAtT, T + 8 * DAY).has(7)).toBe(false);
  });

  it("preserves original timestamps for live v2 entries (does not reset their clock)", () => {
    const originalAddedAt = NOW - HOUR * 2;
    const raw = v2Raw(v2Entry(10, originalAddedAt));
    const result = normalizePendingDeletes(raw, NOW)!;
    const parsed: Array<{ id: number; addedAt: number }> = JSON.parse(result);
    expect(parsed[0].addedAt).toBe(originalAddedAt); // unchanged
  });

  it("drops expired v2 entries and keeps live ones during normalization", () => {
    const raw = v2Raw(
      v2Entry(1, NOW - HOUR),     // live
      v2Entry(2, NOW - 8 * DAY),  // expired
    );
    const result = normalizePendingDeletes(raw, NOW)!;
    const ids = parsePendingDeletes(result, NOW);
    expect(ids).toEqual(new Set([1]));
  });

  it("handles a mix of v1 and v2 entries — v1 gets stamped, expired v2 dropped", () => {
    const raw = JSON.stringify([
      5,                              // v1 → stamped with nowMs
      v2Entry(6, NOW - HOUR),         // live v2 → preserved
      v2Entry(7, NOW - 8 * DAY),       // expired v2 → dropped
    ]);
    const result = normalizePendingDeletes(raw, NOW)!;
    const ids = parsePendingDeletes(result, NOW);
    expect(ids).toEqual(new Set([5, 6]));
    expect(ids.has(7)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5xx delete failure — full lifecycle integration
// ---------------------------------------------------------------------------

/**
 * Simulates the complete cycle described in task 469:
 *   1. User triggers a delete → tombstone is written via addEntryToRaw.
 *   2. The DELETE request returns a 5xx error → removeEntryFromRaw is NOT
 *      called (the server-side delete did not succeed, so the client must
 *      keep the tombstone until the DELETE is retried or the TTL expires).
 *   3. App is force-quit and restarted → the raw string is re-read from
 *      AsyncStorage and passed to parsePendingDeletes (simulated here by
 *      re-using the stored raw value).
 *   4. Immediately after restart the conversation is still suppressed.
 *   5. After PENDING_DELETE_TTL_MS the tombstone expires and the
 *      conversation reappears in loadConversations (i.e. is no longer in
 *      the filtered-out set).
 */
describe("5xx delete failure — full lifecycle", () => {
  it("suppresses the conversation after a 5xx, then lets it reappear after 7 days", () => {
    const CONV_ID = 1001;
    const deleteAttemptTime = NOW;

    // --- Step 1: user triggers delete — tombstone written to storage ---
    const rawAfterAdd = addEntryToRaw(null, CONV_ID, deleteAttemptTime);

    // --- Step 2: DELETE returns 5xx — removeEntryFromRaw is NOT called;
    //             tombstone remains as-is in storage.

    // --- Step 3: app is force-quit; on the next cold start the app reads
    //             the stored raw string (simulated by re-using rawAfterAdd).
    const rawOnRestart = rawAfterAdd; // same bytes, as if read from AsyncStorage

    // --- Step 4: immediately after restart the conversation is still suppressed ---
    const filteredImmediately = parsePendingDeletes(
      rawOnRestart,
      deleteAttemptTime + HOUR // 1 hour after the failed delete
    );
    expect(filteredImmediately.has(CONV_ID)).toBe(true);

    // Also check at 6 days 23 hours — still filtered (just inside TTL)
    const almostExpired = parsePendingDeletes(
      rawOnRestart,
      deleteAttemptTime + PENDING_DELETE_TTL_MS - 1
    );
    expect(almostExpired.has(CONV_ID)).toBe(true);

    // --- Step 5: 7 days pass — tombstone expires, conversation reappears ---
    // This mirrors readPendingDeletes being called on the next app open after
    // the TTL has elapsed; the id must no longer be in the filtered set.
    const filteredAfterTTL = parsePendingDeletes(
      rawOnRestart,
      deleteAttemptTime + PENDING_DELETE_TTL_MS
    );
    expect(filteredAfterTTL.has(CONV_ID)).toBe(false);

    // Extra: well past expiry (8 days) — definitely not filtered
    const filteredAt8Days = parsePendingDeletes(
      rawOnRestart,
      deleteAttemptTime + 8 * DAY
    );
    expect(filteredAt8Days.has(CONV_ID)).toBe(false);
  });

  it("does not affect other live tombstones when one expires after a 5xx", () => {
    // Two conversations: one deleted just now (fresh tombstone), one deleted
    // 8 days ago (expired).  A 5xx on the second one must not suppress it
    // past the TTL while the first remains correctly suppressed.
    const FRESH_ID = 2001;
    const STALE_ID = 2002;

    const now = NOW;
    // STALE_ID was added 8 days ago (already past TTL)
    const rawWithStale = addEntryToRaw(null, STALE_ID, now - 8 * DAY);
    // FRESH_ID added now (its DELETE also fails with 5xx)
    const rawBothIds = addEntryToRaw(rawWithStale, FRESH_ID, now);

    // Immediately: only the fresh id is filtered (stale has expired)
    const immediateSet = parsePendingDeletes(rawBothIds, now);
    expect(immediateSet.has(FRESH_ID)).toBe(true);
    expect(immediateSet.has(STALE_ID)).toBe(false);

    // 7 days later: fresh id also expires
    const afterTTLSet = parsePendingDeletes(
      rawBothIds,
      now + PENDING_DELETE_TTL_MS
    );
    expect(afterTTLSet.has(FRESH_ID)).toBe(false);
    expect(afterTTLSet.has(STALE_ID)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TTL expiry integration — the key regression guard
// ---------------------------------------------------------------------------

describe("TTL expiry integration", () => {
  it("a tombstone written before a network failure expires and stops filtering after 7 days", () => {
    // Scenario: DELETE failed, tombstone was written, app never retried.
    // After 7 days the conversation must stop being filtered.

    const writeTime = NOW;
    const raw = addEntryToRaw(null, 42, writeTime);

    // One hour after write: still filtered
    expect(parsePendingDeletes(raw, writeTime + HOUR).has(42)).toBe(true);

    // Just before expiry (TTL - 1 ms): still filtered
    expect(
      parsePendingDeletes(raw, writeTime + PENDING_DELETE_TTL_MS - 1).has(42)
    ).toBe(true);

    // At exactly TTL: expired
    expect(
      parsePendingDeletes(raw, writeTime + PENDING_DELETE_TTL_MS).has(42)
    ).toBe(false);

    // 8 days after write: definitely expired
    expect(parsePendingDeletes(raw, writeTime + 8 * DAY).has(42)).toBe(false);
  });
});
