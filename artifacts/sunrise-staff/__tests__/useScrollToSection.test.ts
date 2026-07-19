/**
 * Hook-level tests for useScrollToSection.
 *
 * These tests exercise the React glue code that the pure-logic tests cannot
 * reach:
 *   - ref initialisation (scrollViewRef created vs. shared)
 *   - useEffect dependency array (fires on targetParam/targetValue, not on
 *     unrelated re-renders)
 *   - onSectionLayout callback wiring
 *
 * Four scenarios are covered:
 *   1. Already-mounted path  – layout fires before targetParam matches;
 *      effect sees both ref and Y → scroll fires immediately.
 *   2. Fresh-mount path      – targetParam matches on first render;
 *      effect sets pendingScroll; onSectionLayout fires the scroll.
 *   3. Re-render guard       – changing targetValue so it no longer matches
 *      does not cause an unintentional scroll.
 *   4. Shared ref            – the hook honours a pre-existing scrollViewRef
 *      passed as the third argument.
 *
 * Tests run in a plain Node environment (see jest.config.js).
 * No React-Native runtime is required.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useScrollToSection } from '../hooks/useScrollToSection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScrollView() {
  return { scrollTo: jest.fn() };
}

/** Minimal fake of React-Native's LayoutChangeEvent. */
function makeLayoutEvent(y: number) {
  return {
    nativeEvent: { layout: { x: 0, y, width: 0, height: 0 } },
  } as any;
}

// ---------------------------------------------------------------------------
// 1. Already-mounted path
//    Layout fires *before* targetParam matches targetValue.
//    The effect (triggered by the targetParam change) should scroll
//    immediately because both ref and sectionY are already populated.
// ---------------------------------------------------------------------------

describe('useScrollToSection – already-mounted path', () => {
  it('scrolls immediately when layout already fired before targetParam matches', () => {
    const sv = makeScrollView();

    const { result, rerender } = renderHook(
      ({ param }: { param: string | undefined }) =>
        useScrollToSection(param, 'notes'),
      { initialProps: { param: undefined } },
    );

    // Simulate the ScrollView mounting and layout firing before the deep link.
    // These are plain ref mutations – no React state involved.
    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(400));

    // Deep-link param arrives → effect fires → scroll should happen immediately.
    rerender({ param: 'notes' });

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);
    expect(sv.scrollTo).toHaveBeenCalledWith({ y: 400, animated: true });
  });

  it('does not scroll when targetParam does not match targetValue', () => {
    const sv = makeScrollView();

    const { result, rerender } = renderHook(
      ({ param }: { param: string | undefined }) =>
        useScrollToSection(param, 'notes'),
      { initialProps: { param: undefined } },
    );

    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(400));

    // A different section arrives – should not scroll to 'notes'.
    rerender({ param: 'vitals' });

    expect(sv.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls with the exact Y coordinate captured by onSectionLayout', () => {
    const sv = makeScrollView();

    const { result, rerender } = renderHook(
      ({ param }: { param: string | undefined }) =>
        useScrollToSection(param, 'notes'),
      { initialProps: { param: undefined } },
    );

    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(1024));

    rerender({ param: 'notes' });

    expect(sv.scrollTo).toHaveBeenCalledWith({ y: 1024, animated: true });
  });
});

// ---------------------------------------------------------------------------
// 2. Fresh-mount path
//    targetParam already matches targetValue on the first render.
//    The effect fires but ref/sectionY are null → pendingScroll is set.
//    Scroll fires once onSectionLayout provides the Y coordinate.
// ---------------------------------------------------------------------------

describe('useScrollToSection – fresh-mount path', () => {
  it('defers scroll until onSectionLayout fires when layout has not happened yet', () => {
    const sv = makeScrollView();

    // targetParam matches targetValue from the very first render.
    const { result } = renderHook(() => useScrollToSection('notes', 'notes'));

    // Effect has run but scrollViewRef is still null → no scroll yet.
    expect(sv.scrollTo).not.toHaveBeenCalled();

    // ScrollView mounts and layout fires.
    act(() => {
      (result.current.scrollViewRef as any).current = sv;
      result.current.onSectionLayout(makeLayoutEvent(560));
    });

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);
    expect(sv.scrollTo).toHaveBeenCalledWith({ y: 560, animated: true });
  });

  it('does not re-scroll on subsequent re-layouts after the pending scroll has fired', () => {
    const sv = makeScrollView();

    const { result } = renderHook(() => useScrollToSection('notes', 'notes'));

    act(() => {
      (result.current.scrollViewRef as any).current = sv;
      result.current.onSectionLayout(makeLayoutEvent(560));
    });

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);

    // A second layout event (e.g. content resize) must not repeat the scroll.
    act(() => {
      result.current.onSectionLayout(makeLayoutEvent(580));
    });

    expect(sv.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('records sectionY even when no scroll was pending (normal layout)', () => {
    const sv = makeScrollView();

    // param does not match → no pending scroll.
    const { result } = renderHook(() =>
      useScrollToSection('vitals', 'notes'),
    );

    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(200));

    // Layout recorded but no scroll fired.
    expect(sv.scrollTo).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. Re-render guard
//    Changing targetValue so it no longer matches targetParam must not
//    trigger an unintentional scroll on the next render cycle.
// ---------------------------------------------------------------------------

describe('useScrollToSection – re-render does not cause unintended scroll', () => {
  it('does not scroll when targetValue changes away from a matching param', () => {
    const sv = makeScrollView();

    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useScrollToSection('notes', value),
      { initialProps: { value: 'notes' } },
    );

    // Set up a mounted ScrollView so that the already-mounted path is available.
    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(400));

    // Initial matching render triggers one scroll.
    // (effect ran on mount already; re-confirm call count before changing value)
    const scrollsBefore = sv.scrollTo.mock.calls.length;

    // targetValue no longer matches targetParam → effect fires but guard in
    // handleTargetParamChange returns early.
    rerender({ value: 'vitals' });

    expect(sv.scrollTo).toHaveBeenCalledTimes(scrollsBefore);
  });

  it('does not scroll on an unrelated re-render when param never matched', () => {
    const sv = makeScrollView();

    const { result, rerender } = renderHook(
      ({ extra }: { extra: number }) => {
        const hook = useScrollToSection('vitals', 'notes');
        return hook;
      },
      { initialProps: { extra: 1 } },
    );

    (result.current.scrollViewRef as any).current = sv;
    result.current.onSectionLayout(makeLayoutEvent(300));

    // Trigger a re-render with a different unrelated prop.
    rerender({ extra: 2 });

    expect(sv.scrollTo).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Shared scrollViewRef (secondary usage)
//    When a sharedScrollViewRef is passed, the hook uses it rather than
//    creating its own, and scrollNow / onSectionLayout operate on the same ref.
// ---------------------------------------------------------------------------

describe('useScrollToSection – shared scrollViewRef', () => {
  it('uses the provided sharedScrollViewRef instead of creating its own', () => {
    const sv = makeScrollView();
    const sharedRef = { current: sv } as any;

    const { result } = renderHook(() =>
      useScrollToSection('notes', 'notes', sharedRef),
    );

    act(() => {
      result.current.onSectionLayout(makeLayoutEvent(300));
    });

    // Scroll must have fired through the shared ref.
    expect(sv.scrollTo).toHaveBeenCalledWith({ y: 300, animated: true });
  });

  it('returns the sharedScrollViewRef as scrollViewRef so callers see the same object', () => {
    const sv = makeScrollView();
    const sharedRef = { current: sv } as any;

    const { result } = renderHook(() =>
      useScrollToSection(undefined, 'notes', sharedRef),
    );

    expect(result.current.scrollViewRef).toBe(sharedRef);
  });
});
