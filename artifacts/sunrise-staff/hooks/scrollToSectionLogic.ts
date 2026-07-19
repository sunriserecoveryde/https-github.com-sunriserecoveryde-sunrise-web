/**
 * Pure (non-React) logic for the deep-link scroll-to-section feature.
 *
 * Keeping this separate from the React hook lets unit tests exercise both
 * code paths (already-mounted and fresh-mount) without needing a React /
 * React-Native test environment.
 *
 * State shape used by the hook – callers own these refs:
 */
export interface ScrollToSectionState {
  /** Ref to the ScrollView (nullable until it mounts). */
  scrollViewRef: { current: { scrollTo(opts: { y: number; animated: boolean }): void } | null };
  /** Y-coordinate of the target section once layout has fired. */
  sectionY: { current: number | null };
  /** True when a scroll was requested before layout had fired. */
  pendingScroll: { current: boolean };
}

/**
 * Called from the `useEffect` that watches `targetParam`.
 *
 * Already-mounted path:
 *   Both `scrollViewRef.current` and `sectionY.current` are already set →
 *   scroll fires immediately.
 *
 * Fresh-mount path:
 *   Layout hasn't fired yet → sets `pendingScroll` so `handleSectionLayout`
 *   can fire the scroll once the Y coordinate is known.
 */
export function handleTargetParamChange(
  targetParam: string | undefined,
  targetValue: string,
  state: ScrollToSectionState,
): void {
  if (targetParam !== targetValue) return;

  if (state.scrollViewRef.current != null && state.sectionY.current != null) {
    // Already-mounted: layout has already fired, scroll immediately.
    state.scrollViewRef.current.scrollTo({ y: state.sectionY.current, animated: true });
  } else {
    // Fresh-mount: record intent; handleSectionLayout will fire the scroll.
    state.pendingScroll.current = true;
  }
}

/**
 * Called from the `onLayout` prop of the target section View.
 *
 * Always records the section Y.  If `pendingScroll` is set and the
 * ScrollView ref is available, fires the scroll and clears the flag so
 * subsequent re-layouts don't repeat the scroll.
 */
export function handleSectionLayout(
  y: number,
  state: ScrollToSectionState,
): void {
  state.sectionY.current = y;
  if (state.pendingScroll.current && state.scrollViewRef.current != null) {
    state.pendingScroll.current = false;
    state.scrollViewRef.current.scrollTo({ y, animated: true });
  }
}
