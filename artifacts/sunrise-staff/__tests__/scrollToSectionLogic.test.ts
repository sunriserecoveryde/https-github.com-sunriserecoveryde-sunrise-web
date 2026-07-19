/**
 * Unit tests for the deep-link scroll-to-section logic.
 *
 * Two code paths verified:
 *  1. Already-mounted  – sectionY and scrollViewRef are both set before
 *     handleTargetParamChange is called.  Scroll fires immediately.
 *  2. Fresh-mount      – handleTargetParamChange is called before layout fires.
 *     pendingScroll is set to true, then handleSectionLayout fires the scroll.
 *
 * These tests run in a plain Node environment (no React / React-Native runtime
 * required) because all logic lives in the pure scrollToSectionLogic module.
 */

import {
  handleTargetParamChange,
  handleSectionLayout,
  type ScrollToSectionState,
} from '../hooks/scrollToSectionLogic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScrollView() {
  return { scrollTo: jest.fn() };
}

function makeState(overrides: Partial<ScrollToSectionState> = {}): ScrollToSectionState {
  return {
    scrollViewRef: { current: null },
    sectionY: { current: null },
    pendingScroll: { current: false },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// handleTargetParamChange – param does not match
// ---------------------------------------------------------------------------

describe('handleTargetParamChange – no-op cases', () => {
  it('does nothing when targetParam is undefined', () => {
    const sv = makeScrollView();
    const state = makeState({ scrollViewRef: { current: sv }, sectionY: { current: 300 } });

    handleTargetParamChange(undefined, 'notes', state);

    expect(sv.scrollTo).not.toHaveBeenCalled();
    expect(state.pendingScroll.current).toBe(false);
  });

  it('does nothing when targetParam is a different value', () => {
    const sv = makeScrollView();
    const state = makeState({ scrollViewRef: { current: sv }, sectionY: { current: 300 } });

    handleTargetParamChange('vitals', 'notes', state);

    expect(sv.scrollTo).not.toHaveBeenCalled();
    expect(state.pendingScroll.current).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Path 1: Already-mounted
//   Layout fired before the deep-link param changes.
//   scrollViewRef and sectionY are both populated.
//   handleTargetParamChange must scroll immediately.
// ---------------------------------------------------------------------------

describe('handleTargetParamChange – already-mounted path', () => {
  it('scrolls immediately to the stored sectionY when both ref and Y are set', () => {
    const sv = makeScrollView();
    const NOTES_Y = 420;
    const state = makeState({
      scrollViewRef: { current: sv },
      sectionY: { current: NOTES_Y },
    });

    handleTargetParamChange('notes', 'notes', state);

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);
    expect(sv.scrollTo).toHaveBeenCalledWith({ y: NOTES_Y, animated: true });
    // pendingScroll stays false – scroll was immediate, no deferred intent
    expect(state.pendingScroll.current).toBe(false);
  });

  it('scrolls with the exact Y coordinate stored in sectionY', () => {
    const sv = makeScrollView();
    const state = makeState({
      scrollViewRef: { current: sv },
      sectionY: { current: 1024 },
    });

    handleTargetParamChange('notes', 'notes', state);

    expect(sv.scrollTo).toHaveBeenCalledWith({ y: 1024, animated: true });
  });

  it('falls back to fresh-mount path when scrollViewRef is null even if sectionY is set', () => {
    const state = makeState({ sectionY: { current: 300 } });

    handleTargetParamChange('notes', 'notes', state);

    expect(state.pendingScroll.current).toBe(true);
  });

  it('falls back to fresh-mount path when sectionY is null even if scrollViewRef is set', () => {
    const sv = makeScrollView();
    const state = makeState({ scrollViewRef: { current: sv } });

    handleTargetParamChange('notes', 'notes', state);

    expect(sv.scrollTo).not.toHaveBeenCalled();
    expect(state.pendingScroll.current).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Path 2: Fresh-mount
//   The deep-link param is set before layout fires.
//   handleTargetParamChange sets pendingScroll=true, then
//   handleSectionLayout fires the scroll once the Y coordinate is known.
// ---------------------------------------------------------------------------

describe('fresh-mount path: handleTargetParamChange + handleSectionLayout', () => {
  it('sets pendingScroll when ref and sectionY are both absent', () => {
    const state = makeState();

    handleTargetParamChange('notes', 'notes', state);

    expect(state.pendingScroll.current).toBe(true);
  });

  it('fires scroll in handleSectionLayout after pendingScroll is set', () => {
    const LAYOUT_Y = 560;
    const sv = makeScrollView();
    const state = makeState();

    // Step 1: param arrives (screen still mounting, layout not fired yet)
    handleTargetParamChange('notes', 'notes', state);
    expect(state.pendingScroll.current).toBe(true);

    // Step 2: layout fires – now scrollViewRef is attached and layout Y is known
    state.scrollViewRef.current = sv;
    handleSectionLayout(LAYOUT_Y, state);

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);
    expect(sv.scrollTo).toHaveBeenCalledWith({ y: LAYOUT_Y, animated: true });
  });

  it('clears pendingScroll after handleSectionLayout fires the scroll', () => {
    const sv = makeScrollView();
    const state = makeState();

    handleTargetParamChange('notes', 'notes', state);
    state.scrollViewRef.current = sv;
    handleSectionLayout(300, state);

    // Flag must be cleared so re-layouts don't scroll again
    expect(state.pendingScroll.current).toBe(false);
  });

  it('records sectionY in handleSectionLayout even when pendingScroll is false', () => {
    const state = makeState();

    // Layout fires normally (no pending scroll)
    handleSectionLayout(200, state);

    expect(state.sectionY.current).toBe(200);
    expect(state.pendingScroll.current).toBe(false);
  });

  it('does not scroll if scrollViewRef is still null when layout fires', () => {
    const state = makeState(); // scrollViewRef.current stays null

    handleTargetParamChange('notes', 'notes', state);
    // ref still not attached when layout fires
    handleSectionLayout(200, state);

    // Y is recorded, but scroll could not fire
    expect(state.sectionY.current).toBe(200);
    expect(state.pendingScroll.current).toBe(true);
  });

  it('does not scroll in handleSectionLayout when pendingScroll is false', () => {
    const sv = makeScrollView();
    const state = makeState({ scrollViewRef: { current: sv } });

    // No deep-link request was made → pendingScroll is false
    handleSectionLayout(300, state);

    expect(sv.scrollTo).not.toHaveBeenCalled();
  });
});
