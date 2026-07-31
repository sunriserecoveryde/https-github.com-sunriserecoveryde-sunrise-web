/**
 * useNotifNow — global snooze-expiry timer
 *
 * A single module-level interval runs every 60 seconds regardless of how many
 * components are mounted.  scheduleSnoozeCheck() adds a precise early-wake
 * timeout so the Topbar badge updates the moment a snooze expires rather than
 * waiting up to 60 s.
 *
 * Rules:
 *  - One setInterval (fallback) — never duplicated.
 *  - At most one smart setTimeout outstanding at any time.
 *  - No component lifecycle needed; timer runs for the life of the module.
 */
import { useSyncExternalStore } from 'react';

let _now = Date.now();
let _smartTimer: ReturnType<typeof setTimeout> | null = null;
const _listeners = new Set<() => void>();

function _tick(): void {
  _now = Date.now();
  _listeners.forEach(fn => fn());
}

// Fallback: fires every 60 s so no expiry is missed by more than ~1 min.
setInterval(_tick, 60_000);

/**
 * Schedule an early tick at `earliestExpiryMs`.
 * Call this every time a snooze is set so the timer wakes up precisely
 * when the first pending snooze is due to expire.
 */
export function scheduleSnoozeCheck(earliestExpiryMs: number): void {
  const delay = earliestExpiryMs - Date.now();
  // Skip if it would fire at or after the 60-s fallback anyway
  if (delay >= 60_000) return;
  if (_smartTimer !== null) clearTimeout(_smartTimer);
  _smartTimer = setTimeout(() => {
    _smartTimer = null;
    _tick();
  }, Math.max(0, delay) + 100); // +100 ms: ensures Date.now() is definitely past expiry
}

function _subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

/** Current epoch ms — re-renders all callers on every timer tick. */
export function useNotifNow(): number {
  return useSyncExternalStore(_subscribe, () => _now);
}
