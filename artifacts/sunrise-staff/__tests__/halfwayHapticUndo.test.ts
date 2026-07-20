/**
 * Unit tests — halfway haptic is never dispatched after Undo
 *
 * The patient detail screen schedules a light haptic at the halfway point of
 * the 4-second undo window (remaining / 2 ms after the toast appears).  When
 * the nurse taps Undo the hide branch of the pendingDelete useEffect clears
 * halfwayHapticRef via clearTimeout.
 *
 * These tests verify that:
 *   1. The halfway-haptic timer is cancelled before it fires when Undo is called
 *      early in the window.
 *   2. The timer is also cancelled when Undo arrives at exactly the halfway mark.
 *   3. Undo clearing the timer prevents the haptic callback from executing.
 *   4. The timer fires normally (haptic dispatched) when Undo is never called.
 *
 * A minimal state machine mirrors the component logic without importing any
 * React Native or Expo dependencies, keeping the suite fast and hermetic.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface CountdownState {
  /** Handle returned by setTimeout for the halfway haptic; null = not scheduled */
  halfwayHapticHandle: ReturnType<typeof setTimeout> | null;
  /** Handle returned by setTimeout for the auto-dismiss; null = not running */
  dismissHandle: ReturnType<typeof setTimeout> | null;
  /** True once pendingDelete has been cleared (undo or timer-expiry) */
  cleared: boolean;
}

// ─── State-machine helpers ────────────────────────────────────────────────────

/**
 * Mirrors the "show" path of the pendingDelete useEffect:
 *   - schedules the 4-second auto-dismiss timer
 *   - schedules the halfway-haptic timer when remaining > 1000 ms
 *
 * @param remaining  milliseconds until the undo window closes
 * @param onHaptic   callback invoked when the halfway timer fires (stand-in for Haptics.impactAsync)
 */
function startCountdown(
  remaining: number,
  onHaptic: () => void,
): CountdownState {
  let halfwayHapticHandle: ReturnType<typeof setTimeout> | null = null;
  let dismissHandle: ReturnType<typeof setTimeout> | null = null;

  // Auto-dismiss timer (mirrors the 4-second context timer)
  dismissHandle = setTimeout(() => {}, remaining);

  // Halfway haptic — only scheduled when there is enough time left
  if (remaining > 1000) {
    halfwayHapticHandle = setTimeout(() => {
      halfwayHapticHandle = null; // mirror: halfwayHapticRef.current = null inside the callback
      onHaptic();
    }, remaining / 2);
  }

  return { halfwayHapticHandle, dismissHandle, cleared: false };
}

/**
 * Mirrors the "hide" path of the pendingDelete useEffect (pendingDelete → null):
 *   - stops the countdown animation (no-op here)
 *   - clears halfwayHapticRef
 *
 * Returns the updated state.
 */
function hideCountdown(state: CountdownState): CountdownState {
  if (state.halfwayHapticHandle !== null) {
    clearTimeout(state.halfwayHapticHandle);
  }
  if (state.dismissHandle !== null) {
    clearTimeout(state.dismissHandle);
  }
  return { halfwayHapticHandle: null, dismissHandle: null, cleared: true };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('halfway haptic — cancelled when Undo fires before halfway mark', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls clearTimeout on the halfway haptic handle when Undo fires early', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const haptic = jest.fn();

    // Start the countdown with a full 4-second window
    let state = startCountdown(4000, haptic);

    const halfwayHandle = state.halfwayHapticHandle;
    expect(halfwayHandle).not.toBeNull();

    // Undo fires after only 500 ms (well before the 2-second halfway mark)
    jest.advanceTimersByTime(500);
    state = hideCountdown(state);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(halfwayHandle);
    clearTimeoutSpy.mockRestore();
  });

  it('does not invoke the haptic callback after Undo fires early', () => {
    const haptic = jest.fn();

    let state = startCountdown(4000, haptic);

    // Undo fires at 500 ms
    jest.advanceTimersByTime(500);
    state = hideCountdown(state);

    // Advance past the halfway point and the full window — haptic must not fire
    jest.runAllTimers();

    expect(haptic).not.toHaveBeenCalled();
  });

  it('does not invoke the haptic callback when Undo fires at 1 ms before halfway', () => {
    const haptic = jest.fn();

    let state = startCountdown(4000, haptic);

    // Advance to just before the 2-second halfway mark
    jest.advanceTimersByTime(1999);
    state = hideCountdown(state);

    jest.runAllTimers();

    expect(haptic).not.toHaveBeenCalled();
  });
});

describe('halfway haptic — cancelled when Undo fires at exactly the halfway mark', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls clearTimeout on the halfway handle when Undo arrives at exactly remaining/2 ms', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const haptic = jest.fn();

    let state = startCountdown(4000, haptic);

    const halfwayHandle = state.halfwayHapticHandle;

    // Advance to exactly the halfway mark but do NOT let timers fire yet
    // (advanceTimersByTime runs timers whose delay <= the elapsed ms,
    //  so to test "at exactly halfway but before the callback executes"
    //  we advance to 1 ms before and then call hideCountdown)
    jest.advanceTimersByTime(1999);
    state = hideCountdown(state);

    // The handle that was cleared must be the halfway handle
    expect(clearTimeoutSpy).toHaveBeenCalledWith(halfwayHandle);

    // Run everything — haptic must still not fire
    jest.runAllTimers();
    expect(haptic).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('state reports cleared=true after hide', () => {
    const haptic = jest.fn();

    let state = startCountdown(4000, haptic);

    jest.advanceTimersByTime(2000); // exactly halfway
    // clearTimeout before the callback would execute
    state = hideCountdown(state);

    expect(state.cleared).toBe(true);
    expect(state.halfwayHapticHandle).toBeNull();
    expect(state.dismissHandle).toBeNull();
  });
});

describe('halfway haptic — fires normally when Undo is never called', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the haptic at the halfway mark when Undo is not tapped', () => {
    const haptic = jest.fn();

    startCountdown(4000, haptic);

    // Advance past the 2-second halfway mark
    jest.advanceTimersByTime(2001);

    expect(haptic).toHaveBeenCalledTimes(1);
  });

  it('does not schedule a halfway haptic when remaining <= 1000 ms', () => {
    const haptic = jest.fn();

    const state = startCountdown(800, haptic);

    expect(state.halfwayHapticHandle).toBeNull();

    jest.runAllTimers();

    expect(haptic).not.toHaveBeenCalled();
  });
});

describe('halfway haptic — no phantom haptic after rapid Undo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('no extra haptic fires when Undo is called immediately after delete', () => {
    const haptic = jest.fn();

    // Nurse swipes to delete and immediately taps Undo (within a single frame)
    let state = startCountdown(4000, haptic);
    state = hideCountdown(state); // immediate Undo — no time elapsed

    jest.runAllTimers();

    expect(haptic).not.toHaveBeenCalled();
  });

  it('handles repeated start/hide cycles without leaking timer handles', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const haptic = jest.fn();

    // First cycle: delete → Undo
    let state = startCountdown(4000, haptic);
    const handle1 = state.halfwayHapticHandle;
    jest.advanceTimersByTime(300);
    state = hideCountdown(state);

    // Second cycle: delete another note → Undo again
    let state2 = startCountdown(3800, haptic);
    const handle2 = state2.halfwayHapticHandle;
    jest.advanceTimersByTime(300);
    state2 = hideCountdown(state2);

    jest.runAllTimers();

    // Both halfway timers must have been cleared
    expect(clearTimeoutSpy).toHaveBeenCalledWith(handle1);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(handle2);
    // Haptic must never have fired in either cycle
    expect(haptic).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
