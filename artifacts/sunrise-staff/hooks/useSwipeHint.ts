import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'swipe_hint_shown_';

/**
 * useSwipeHint – encapsulates the one-time swipe-gesture discovery hint.
 *
 * Returns `playHint: true` exactly once across all app launches for the given
 * `key` (persisted via AsyncStorage). Pass a unique key per swipeable list so
 * each list teaches the gesture independently.
 *
 * Passing `undefined` (or omitting the key) always returns `playHint: false`
 * and never touches AsyncStorage — safe to call unconditionally on every row.
 *
 * When the key changes between renders, `playHint` resets to `false`
 * synchronously before the async check completes, preventing stale `true`
 * state from leaking across key transitions.
 *
 * Usage:
 *   const { playHint } = useSwipeHint('nursing-notes');
 *   <SwipeableRow playHint={playHint} ... />
 */
export function useSwipeHint(key: string | undefined): { playHint: boolean } {
  const [playHint, setPlayHint] = useState(false);

  useEffect(() => {
    // No key → opt out entirely; also clear any stale true from a prior key.
    if (!key) {
      setPlayHint(false);
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${key}`;
    let cancelled = false;

    // Reset immediately so stale `true` can't leak when the key changes.
    setPlayHint(false);

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        if (stored === null) {
          // First launch for this key – show the hint and persist the flag.
          setPlayHint(true);
          await AsyncStorage.setItem(storageKey, '1');
        }
      } catch {
        // AsyncStorage failure is non-fatal; hint simply won't show.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { playHint };
}
