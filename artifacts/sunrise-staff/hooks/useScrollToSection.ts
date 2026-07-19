import { useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import type { ScrollView, LayoutChangeEvent } from 'react-native';
import {
  handleTargetParamChange,
  handleSectionLayout,
  type ScrollToSectionState,
} from './scrollToSectionLogic';

/**
 * Manages deep-link scroll-to-section behaviour for a ScrollView.
 *
 * Two code paths are handled:
 *  1. Already-mounted  – layout has already fired before `targetParam` becomes
 *     `targetValue`.  The scroll fires immediately inside the effect.
 *  2. Fresh-mount      – layout fires after `targetParam` becomes `targetValue`.
 *     A `pendingScroll` flag is set so the `onSectionLayout` handler fires the
 *     scroll once the section's Y position is known.
 *
 * The core logic lives in `scrollToSectionLogic.ts` and is unit-tested there
 * independently of the React / React-Native runtime.
 *
 * Usage (primary — owns the ScrollView ref):
 *   const { scrollViewRef, onSectionLayout } = useScrollToSection(scrollTo, 'notes');
 *   <ScrollView ref={scrollViewRef} …>…<View onLayout={onSectionLayout} />…</ScrollView>
 *
 * Usage (secondary — shares an existing ScrollView ref for additional sections):
 *   const { onSectionLayout } = useScrollToSection(scrollTo, 'vitals', scrollViewRef);
 *   <View onLayout={onSectionLayout} />
 */
export function useScrollToSection(
  targetParam: string | undefined,
  targetValue: string,
  /**
   * Pass the `scrollViewRef` returned by a primary `useScrollToSection` call so
   * multiple hook instances can share a single ScrollView.  When omitted, a new
   * ref is created (primary usage).
   */
  sharedScrollViewRef?: RefObject<ScrollView>,
) {
  const ownScrollViewRef = useRef<ScrollView>(null);
  const scrollViewRef = (sharedScrollViewRef ?? ownScrollViewRef) as RefObject<ScrollView>;
  const sectionY = useRef<number | null>(null);
  const pendingScroll = useRef(false);

  const state: ScrollToSectionState = {
    scrollViewRef,
    sectionY,
    pendingScroll,
  };

  useEffect(() => {
    handleTargetParamChange(targetParam, targetValue, state);
  }, [targetParam, targetValue]);

  const onSectionLayout = (e: LayoutChangeEvent) => {
    handleSectionLayout(e.nativeEvent.layout.y, state);
  };

  /** Imperatively scroll to the section immediately (if both ref and Y are known). */
  const scrollNow = () => {
    if (scrollViewRef.current != null && sectionY.current != null) {
      scrollViewRef.current.scrollTo({ y: sectionY.current, animated: true });
    }
  };

  return { scrollViewRef, onSectionLayout, scrollNow };
}
