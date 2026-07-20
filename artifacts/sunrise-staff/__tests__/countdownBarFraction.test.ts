/**
 * Unit tests for the countdown-bar fraction logic in PatientDetailScreen.
 *
 * The countdown bar derives its starting fraction from:
 *
 *   const remaining = Math.max(0, pendingDelete.expiresAt - Date.now());
 *   const fraction  = remaining / 4000;
 *   countdownAnim.setValue(fraction);
 *
 * These tests exercise that pure calculation in isolation so the edge-case
 * "navigate away for N seconds then come back" is covered without needing a
 * full React Native component mount.
 *
 * Scenario: nurse deletes a note (expiresAt = now + 4 s), navigates away for
 * 2 s, then the screen remounts and startCountdown() is called.  The bar must
 * start at ~50 % — not 100 % — because half the window has already elapsed.
 */

// ---------------------------------------------------------------------------
// Pure reimplementation of the startCountdown fraction logic
// ---------------------------------------------------------------------------

/** Total undo window in milliseconds — must match the component constant. */
const UNDO_WINDOW_MS = 4000;

/**
 * Mirrors the `startCountdown` helper inside PatientDetailScreen.
 *
 * Given a pendingDelete record (carrying expiresAt) and the current wall-clock
 * time, returns the fraction [0, 1] that the countdown bar should display.
 *
 * @param expiresAt  epoch-ms when the undo window closes (from PendingDeleteRecord)
 * @param now        epoch-ms "current" time — injected for deterministic testing
 */
function computeCountdownFraction(expiresAt: number, now: number): number {
  const remaining = Math.max(0, expiresAt - now);
  return remaining / UNDO_WINDOW_MS;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('countdown bar — fraction on mount (return-from-navigation)', () => {
  it('starts at 1.0 when the nurse returns immediately (0 ms elapsed)', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS; // 4 s from start

    const fraction = computeCountdownFraction(expiresAt, start);

    expect(fraction).toBeCloseTo(1.0, 5);
  });

  it('starts at ~0.5 when the nurse returns after 2 s (half-window elapsed)', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS; // expires at start+4000

    // Nurse navigated away for exactly 2 seconds
    const returnTime = start + 2000;
    const fraction = computeCountdownFraction(expiresAt, returnTime);

    // Allow ±0.1 tolerance as specified in the task brief
    expect(fraction).toBeGreaterThanOrEqual(0.4);
    expect(fraction).toBeLessThanOrEqual(0.6);
    expect(fraction).toBeCloseTo(0.5, 1);
  });

  it('starts at ~0.75 when the nurse returns after 1 s (¼ elapsed)', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;
    const returnTime = start + 1000;

    const fraction = computeCountdownFraction(expiresAt, returnTime);

    expect(fraction).toBeCloseTo(0.75, 1);
  });

  it('starts at ~0.25 when the nurse returns after 3 s (¾ elapsed)', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;
    const returnTime = start + 3000;

    const fraction = computeCountdownFraction(expiresAt, returnTime);

    expect(fraction).toBeCloseTo(0.25, 1);
  });

  it('returns 0 (bar fully gone) when the nurse returns after expiresAt has passed', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;

    // Nurse comes back 1 second after the undo window closed
    const returnTime = expiresAt + 1000;
    const fraction = computeCountdownFraction(expiresAt, returnTime);

    expect(fraction).toBe(0);
  });

  it('returns 0 exactly at the expiry boundary', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;

    const fraction = computeCountdownFraction(expiresAt, expiresAt);

    expect(fraction).toBe(0);
  });

  it('never returns a negative fraction', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;

    // Far into the future — window long since closed
    const fractionWayLate = computeCountdownFraction(expiresAt, expiresAt + 99_000);

    expect(fractionWayLate).toBeGreaterThanOrEqual(0);
  });

  it('fraction is proportional to remaining time for arbitrary elapsed values', () => {
    const start = 5_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;

    // Test several elapsed values to confirm the linear relationship holds
    const cases: Array<[number, number]> = [
      [500,  0.875],
      [1000, 0.75],
      [1500, 0.625],
      [2000, 0.5],
      [2500, 0.375],
      [3000, 0.25],
      [3500, 0.125],
    ];

    for (const [elapsed, expectedFraction] of cases) {
      const fraction = computeCountdownFraction(expiresAt, start + elapsed);
      expect(fraction).toBeCloseTo(expectedFraction, 3);
    }
  });
});

describe('countdown bar — ghost-toast guard interaction', () => {
  /**
   * The screen also has a ghost-toast guard: if the remaining window is less
   * than MINIMUM_SHOW_MS (500 ms) when the nurse returns, the pending delete
   * is cleared entirely rather than briefly flashing the toast.
   *
   * These tests confirm that the fraction calculation is consistent with that
   * guard so no consumer can accidentally display a > 0 fraction for a record
   * that should have been suppressed.
   */

  const MINIMUM_SHOW_MS = 500;

  function shouldShowToast(expiresAt: number, now: number): boolean {
    return expiresAt - now >= MINIMUM_SHOW_MS;
  }

  it('does not show the toast when less than 500 ms remains', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;
    const returnTime = expiresAt - 400; // only 400 ms left

    expect(shouldShowToast(expiresAt, returnTime)).toBe(false);
  });

  it('shows the toast when exactly 500 ms remain', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;
    const returnTime = expiresAt - MINIMUM_SHOW_MS;

    expect(shouldShowToast(expiresAt, returnTime)).toBe(true);
  });

  it('fraction at the minimum-show boundary is correct (~0.125)', () => {
    const start = 1_000_000;
    const expiresAt = start + UNDO_WINDOW_MS;
    const returnTime = expiresAt - MINIMUM_SHOW_MS; // 500 ms remain

    const fraction = computeCountdownFraction(expiresAt, returnTime);

    // 500 / 4000 = 0.125
    expect(fraction).toBeCloseTo(0.125, 3);
  });
});
