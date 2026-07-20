/**
 * useRehydratedValue
 *
 * Cold-start flash guard for any persisted UI state.
 *
 * ## Problem
 * Values loaded from AsyncStorage are not available synchronously on mount.
 * Without a guard, a component renders its initial (default) state for a brief
 * frame before the stored value arrives — causing a visible "flash" of the wrong
 * UI (e.g. a dismissed banner re-appearing, or the wrong filter chip appearing
 * selected).
 *
 * ## Solution
 * Return `loadingValue` while `isRehydrating` is true, then transparently return
 * the real `value` once AsyncStorage has been read. Consumers never see the
 * intermediate default — they see either the loading placeholder or the truth.
 *
 * ## Usage
 *
 * ### Boolean flag (e.g. bannerDismissed)
 * Use `true` as the loading default so the element stays hidden while loading:
 * ```tsx
 * const { isRehydrating, bannerDismissed: rawBannerDismissed } = useWithdrawalFilters();
 * const bannerDismissed = useRehydratedValue(isRehydrating, rawBannerDismissed, true);
 * // Render guard: { !bannerDismissed && <AlertBanner /> }
 * // During load: hidden (true). After load: real value.
 * ```
 *
 * ### Enum / string (e.g. scoreFilter)
 * When the loading placeholder matches the visual default (e.g. 'all') there is
 * no flash regardless, but you may still want an opacity animation to signal the
 * transition. In that case combine with an `Animated.Value` that fades in once
 * `isRehydrating` is false — see `vitals.tsx` for the reference implementation.
 *
 * ### Nullable string (e.g. filterNoticeDismissedForPatientId)
 * When the guard condition involves a runtime value (e.g. a patient ID), use the
 * raw `isRehydrating` flag directly in the condition rather than wrapping the
 * value — it keeps the intent explicit:
 * ```tsx
 * { !isRehydrating && someCondition && filterNoticeDismissedForPatientId !== patientId && <Notice /> }
 * ```
 *
 * ## Registration rule
 * Every persisted key in WithdrawalFiltersContext MUST be listed in the
 * "Persisted keys and their guards" comment block at the top of that file.
 * When you add a new key, add its entry there and decide which guard style
 * applies (hook, opacity animation, or raw `!isRehydrating`).
 *
 * @param isRehydrating - the `isRehydrating` flag from WithdrawalFiltersContext
 * @param value         - the real persisted value (available after rehydration)
 * @param loadingValue  - placeholder returned while rehydration is in progress
 */
export function useRehydratedValue<T>(
  isRehydrating: boolean,
  value: T,
  loadingValue: T,
): T {
  return isRehydrating ? loadingValue : value;
}
