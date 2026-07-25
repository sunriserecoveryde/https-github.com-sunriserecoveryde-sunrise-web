/**
 * Pure helpers for the pending-delete tombstone mechanism.
 *
 * Tombstones suppress ghost entries after a delete that was started but not
 * yet confirmed by the server (e.g. app force-quit mid-request).  To prevent
 * a failed delete from permanently hiding a conversation, every tombstone
 * carries an `addedAt` timestamp and is automatically discarded after
 * PENDING_DELETE_TTL_MS (7 days).  Seven days is long enough for the DELETE
 * to be retried successfully across intermittent outages, but bounded so that
 * a permanently-rejected DELETE can never suppress a conversation forever.
 *
 * Storage format (v2 — backward-compatible with the legacy plain number[] v1):
 *   JSON array of { id: number, addedAt: number }
 *
 * Keeping the helpers pure (no AsyncStorage calls) makes them trivially
 * unit-testable without a React Native environment.
 */

/** Maximum age a tombstone is trusted before being silently discarded. */
export const PENDING_DELETE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface PendingDeleteEntry {
  id: number;
  addedAt: number; // Date.now() timestamp
}

// ---------------------------------------------------------------------------
// parsePendingDeletes
// ---------------------------------------------------------------------------

/**
 * Parse the raw JSON string from AsyncStorage and return only the ids whose
 * tombstones have not yet expired.
 *
 * Handles two legacy formats transparently:
 *   v1 — plain number array   e.g. [1, 2, 3]
 *   v2 — stamped entry array  e.g. [{id:1, addedAt:1234567890}]
 *
 * @param raw     The raw string from AsyncStorage (null when key is absent).
 * @param nowMs   Current time as Date.now() — injected for testability.
 */
export function parsePendingDeletes(
  raw: string | null,
  nowMs: number
): Set<number> {
  if (!raw) return new Set();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }
  if (!Array.isArray(parsed)) return new Set();

  const result = new Set<number>();
  for (const item of parsed) {
    if (typeof item === "number") {
      // v1 format — no timestamp, treat as recently added (keep)
      result.add(item);
    } else if (
      item !== null &&
      typeof item === "object" &&
      typeof (item as PendingDeleteEntry).id === "number" &&
      typeof (item as PendingDeleteEntry).addedAt === "number"
    ) {
      const entry = item as PendingDeleteEntry;
      if (nowMs - entry.addedAt < PENDING_DELETE_TTL_MS) {
        result.add(entry.id);
      }
      // Expired entries are silently dropped — the conversation will reappear
      // on the next loadConversations, restoring visibility.
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// serializePendingDeletes
// ---------------------------------------------------------------------------

/**
 * Serialize a map of { id → addedAt } to the v2 JSON format for storage.
 */
export function serializePendingDeletes(
  entries: Map<number, number>
): string {
  const arr: PendingDeleteEntry[] = [];
  for (const [id, addedAt] of entries) {
    arr.push({ id, addedAt });
  }
  return JSON.stringify(arr);
}

// ---------------------------------------------------------------------------
// normalizePendingDeletes
// ---------------------------------------------------------------------------

/**
 * Convert any v1 (plain number) entries to v2 (timestamped) and drop expired
 * v2 entries, returning the canonical JSON string that should be written back
 * to AsyncStorage.
 *
 * Returns `null` when the resulting set is empty — the caller should then
 * remove the AsyncStorage key entirely rather than writing an empty array.
 *
 * This is used by the `readPendingDeletes` wrapper to perform a one-shot
 * migration: after the first read on an upgraded device, all v1 entries gain
 * a bounded lifetime (`addedAt = nowMs`) and will expire normally after TTL.
 *
 * @param raw    Raw string from AsyncStorage (null when key is absent).
 * @param nowMs  Current time as Date.now() — injected for testability.
 */
export function normalizePendingDeletes(
  raw: string | null,
  nowMs: number
): string | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const map = new Map<number, number>();
  for (const item of parsed) {
    if (typeof item === "number") {
      // v1 — stamp with nowMs so it expires after one TTL window.
      // Only add if not already present (idempotent).
      if (!map.has(item)) map.set(item, nowMs);
    } else if (
      item !== null &&
      typeof item === "object" &&
      typeof (item as PendingDeleteEntry).id === "number" &&
      typeof (item as PendingDeleteEntry).addedAt === "number"
    ) {
      const entry = item as PendingDeleteEntry;
      if (nowMs - entry.addedAt < PENDING_DELETE_TTL_MS) {
        // Live v2 entry — preserve original timestamp.
        if (!map.has(entry.id)) map.set(entry.id, entry.addedAt);
      }
      // Expired v2 entries are silently dropped.
    }
  }

  if (map.size === 0) return null;
  return serializePendingDeletes(map);
}

// ---------------------------------------------------------------------------
// addEntryToRaw / removeEntryFromRaw
// ---------------------------------------------------------------------------

/**
 * Add a new tombstone entry to the raw JSON string and return the updated
 * serialized string.  Existing entries (including their timestamps) are
 * preserved; expired ones are pruned at the same time.
 */
export function addEntryToRaw(
  raw: string | null,
  convId: number,
  nowMs: number
): string {
  // Parse existing live entries
  const liveIds = parsePendingDeletes(raw, nowMs);

  // Reconstruct the full entry map with preserved timestamps where possible
  let existingEntries: PendingDeleteEntry[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (
          item !== null &&
          typeof item === "object" &&
          typeof (item as PendingDeleteEntry).id === "number" &&
          typeof (item as PendingDeleteEntry).addedAt === "number" &&
          liveIds.has((item as PendingDeleteEntry).id)
        ) {
          existingEntries.push(item as PendingDeleteEntry);
        }
      }
    }
  } catch {
    // Start fresh
  }

  // Upsert the new entry
  const map = new Map<number, number>(existingEntries.map((e) => [e.id, e.addedAt]));
  map.set(convId, nowMs);
  return serializePendingDeletes(map);
}

/**
 * Remove a single tombstone entry from the raw JSON string and return the
 * updated serialized string (or null if the set is now empty, signalling that
 * the key should be removed from AsyncStorage).
 */
export function removeEntryFromRaw(
  raw: string | null,
  convId: number,
  nowMs: number
): string | null {
  const liveIds = parsePendingDeletes(raw, nowMs);
  liveIds.delete(convId);
  if (liveIds.size === 0) return null;

  // Re-read timestamps from storage where possible
  let existingEntries: PendingDeleteEntry[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (
          item !== null &&
          typeof item === "object" &&
          typeof (item as PendingDeleteEntry).id === "number" &&
          typeof (item as PendingDeleteEntry).addedAt === "number" &&
          liveIds.has((item as PendingDeleteEntry).id)
        ) {
          existingEntries.push(item as PendingDeleteEntry);
        }
      }
    }
  } catch {
    // Fallback: build from liveIds with nowMs (slightly wrong timestamp, but safe)
    existingEntries = [...liveIds].map((id) => ({ id, addedAt: nowMs }));
  }

  const map = new Map<number, number>(existingEntries.map((e) => [e.id, e.addedAt]));
  return serializePendingDeletes(map);
}
