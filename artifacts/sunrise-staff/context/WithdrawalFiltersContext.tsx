import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type WithdrawalScoreFilter = 'all' | 'cows' | 'ciwa' | 'alerts';

// ─────────────────────────────────────────────────────────────────────────────
// Persisted keys and their cold-start flash guards
// ─────────────────────────────────────────────────────────────────────────────
// Every AsyncStorage key managed by this context is registered here.  When you
// add a new key you MUST add a matching row and choose the guard style that
// prevents the UI from flashing incorrect content on cold start.
//
// Guard styles (see hooks/useRehydratedValue.ts for the canonical pattern):
//   A) useRehydratedValue(isRehydrating, value, loadingValue)
//      Best for booleans and enums where the loading placeholder is obvious.
//   B) Opacity animation — start at 0, fade to 1 once !isRehydrating.
//      Best for chip/tab bars where a value change is visually jarring.
//   C) Raw !isRehydrating guard in JSX — use when the condition involves a
//      runtime value (e.g. a patient ID) so the intent stays explicit.
//
// ┌──────────────────────────────────────────────┬──────────────────────┬───────┐
// │ AsyncStorage key                             │ Context field        │ Guard │
// ├──────────────────────────────────────────────┼──────────────────────┼───────┤
// │ @withdrawal_score_filter                     │ scoreFilter          │ B     │
// │ @withdrawal_banner_dismissed                 │ bannerDismissed      │ A     │
// │ @filter_notice_dismissed_patient_id          │ filterNoticeDismissed│ C     │
// │                                              │   ForPatientId       │       │
// │ @filter_notice_last_discharge_patient_id     │ lastTrackedDischarge │ —     │
// │                                              │   PatientId          │       │
// │                                              │ (internal only;      │       │
// │                                              │  not used in render) │       │
// └──────────────────────────────────────────────┴──────────────────────┴───────┘
//
// See vitals.tsx for the reference implementation of each guard style.
// ─────────────────────────────────────────────────────────────────────────────

const SCORE_FILTER_KEY = '@withdrawal_score_filter';
const BANNER_DISMISSED_KEY = '@withdrawal_banner_dismissed';
const FILTER_NOTICE_DISMISSED_KEY = '@filter_notice_dismissed_patient_id';
const LAST_DISCHARGE_PATIENT_KEY = '@filter_notice_last_discharge_patient_id';

interface WithdrawalFiltersState {
  scoreFilter: WithdrawalScoreFilter;
  bannerDismissed: boolean;
  /** Patient ID for which the filter notice has been dismissed, or null if not dismissed. */
  filterNoticeDismissedForPatientId: string | null;
  /**
   * The last discharge patient ID seen by the screen. Stored in context (not a local ref)
   * so it survives tab navigation and won't spuriously reset on remount.
   */
  lastTrackedDischargePatientId: string | null;
  /**
   * True while AsyncStorage is being read on mount. UI that depends on persisted state
   * (e.g. the filter notice dismissed flag) should be hidden until this is false to
   * prevent a flash of incorrect content on cold start.
   */
  isRehydrating: boolean;
}

interface WithdrawalFiltersContextValue extends WithdrawalFiltersState {
  setScoreFilter: (filter: WithdrawalScoreFilter) => void;
  dismissBanner: () => void;
  clearFilters: () => void;
  /** Dismiss the filter notice for the given pending-discharge patient ID. */
  dismissFilterNotice: (patientId: string) => void;
  /**
   * Call on every render with the current discharge patient ID (or null).
   * Resets the dismissed state only when the patient ID actually changes,
   * even across tab navigation.
   */
  trackDischargePatientId: (patientId: string | null) => void;
}

const DEFAULT_STATE: WithdrawalFiltersState = {
  scoreFilter: 'all',
  bannerDismissed: false,
  filterNoticeDismissedForPatientId: null,
  lastTrackedDischargePatientId: null,
  isRehydrating: true,
};

const VALID_SCORE_FILTERS: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

const WithdrawalFiltersContext = createContext<WithdrawalFiltersContextValue | null>(null);

// Fields that can be mutated by the user during the rehydration window.
type RehydratableFields = Partial<Pick<
  WithdrawalFiltersState,
  'scoreFilter' | 'bannerDismissed' | 'filterNoticeDismissedForPatientId'
>>;

export function WithdrawalFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WithdrawalFiltersState>(DEFAULT_STATE);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Captures user mutations that arrive before rehydration completes so the
  // Promise.all callback can merge them on top rather than overwrite them.
  const preLoadEditsRef = useRef<RehydratableFields>({});
  const isRehydratingRef = useRef(true);

  // Rehydrate persisted values on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SCORE_FILTER_KEY),
      AsyncStorage.getItem(BANNER_DISMISSED_KEY),
      AsyncStorage.getItem(FILTER_NOTICE_DISMISSED_KEY),
      AsyncStorage.getItem(LAST_DISCHARGE_PATIENT_KEY),
    ]).then(([storedFilter, storedBannerDismissed, storedDismissed, storedLastDischarge]) => {
      if (!mountedRef.current) return;
      isRehydratingRef.current = false;
      const pending = preLoadEditsRef.current;
      preLoadEditsRef.current = {};
      setState(prev => ({
        ...prev,
        // Prefer any user edit that arrived during the load window over the
        // stored value — the user's intent wins over the persisted snapshot.
        ...(pending.scoreFilter == null &&
            storedFilter &&
            VALID_SCORE_FILTERS.includes(storedFilter as WithdrawalScoreFilter)
          ? { scoreFilter: storedFilter as WithdrawalScoreFilter }
          : {}),
        ...(pending.scoreFilter != null ? { scoreFilter: pending.scoreFilter } : {}),
        ...(pending.bannerDismissed == null && storedBannerDismissed === 'true'
          ? { bannerDismissed: true }
          : {}),
        ...(pending.bannerDismissed != null ? { bannerDismissed: pending.bannerDismissed } : {}),
        ...(pending.filterNoticeDismissedForPatientId == null && storedDismissed
          ? { filterNoticeDismissedForPatientId: storedDismissed }
          : {}),
        ...(pending.filterNoticeDismissedForPatientId != null
          ? { filterNoticeDismissedForPatientId: pending.filterNoticeDismissedForPatientId }
          : {}),
        // Rehydrate lastTrackedDischargePatientId so trackDischargePatientId can
        // correctly detect whether the post-restart discharge is truly new.
        ...(storedLastDischarge ? { lastTrackedDischargePatientId: storedLastDischarge } : {}),
        isRehydrating: false,
      }));
    }).catch(() => {
      // Even on read errors, clear the loading flag so UI is not permanently hidden.
      if (mountedRef.current) {
        isRehydratingRef.current = false;
        preLoadEditsRef.current = {};
        setState(prev => ({ ...prev, isRehydrating: false }));
      }
    });
  }, []);

  const setScoreFilter = useCallback((filter: WithdrawalScoreFilter) => {
    if (isRehydratingRef.current) preLoadEditsRef.current.scoreFilter = filter;
    setState(prev => ({ ...prev, scoreFilter: filter }));
    AsyncStorage.setItem(SCORE_FILTER_KEY, filter).catch(() => {/* ignore write errors */});
  }, []);

  const dismissBanner = useCallback(() => {
    if (isRehydratingRef.current) preLoadEditsRef.current.bannerDismissed = true;
    setState(prev => ({ ...prev, bannerDismissed: true }));
    AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true').catch(() => {/* ignore write errors */});
  }, []);

  const dismissFilterNotice = useCallback((patientId: string) => {
    if (isRehydratingRef.current) preLoadEditsRef.current.filterNoticeDismissedForPatientId = patientId;
    setState(prev => ({ ...prev, filterNoticeDismissedForPatientId: patientId }));
    AsyncStorage.setItem(FILTER_NOTICE_DISMISSED_KEY, patientId).catch(() => {/* ignore write errors */});
  }, []);

  const trackDischargePatientId = useCallback((patientId: string | null) => {
    setState(prev => {
      if (prev.lastTrackedDischargePatientId === patientId) return prev; // no change, no reset
      // Truly new (or cleared) discharge event — reset dismissal and record new ID.
      // Both keys are cleared/updated together so storage stays consistent.
      if (patientId) {
        AsyncStorage.setItem(LAST_DISCHARGE_PATIENT_KEY, patientId).catch(() => {/* ignore */});
      } else {
        AsyncStorage.removeItem(LAST_DISCHARGE_PATIENT_KEY).catch(() => {/* ignore */});
      }
      AsyncStorage.removeItem(FILTER_NOTICE_DISMISSED_KEY).catch(() => {/* ignore */});
      return {
        ...prev,
        lastTrackedDischargePatientId: patientId,
        filterNoticeDismissedForPatientId: null,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    // Reset to defaults but keep isRehydrating false — rehydration only happens on mount,
    // not on runtime resets like shift handoff.
    setState({ ...DEFAULT_STATE, isRehydrating: false });
    AsyncStorage.removeItem(SCORE_FILTER_KEY).catch(() => {/* ignore remove errors */});
    AsyncStorage.removeItem(BANNER_DISMISSED_KEY).catch(() => {/* ignore remove errors */});
    AsyncStorage.removeItem(FILTER_NOTICE_DISMISSED_KEY).catch(() => {/* ignore remove errors */});
    AsyncStorage.removeItem(LAST_DISCHARGE_PATIENT_KEY).catch(() => {/* ignore remove errors */});
  }, []);

  return (
    <WithdrawalFiltersContext.Provider value={{ ...state, setScoreFilter, dismissBanner, clearFilters, dismissFilterNotice, trackDischargePatientId }}>
      {children}
    </WithdrawalFiltersContext.Provider>
  );
}

export function useWithdrawalFilters(): WithdrawalFiltersContextValue {
  const ctx = useContext(WithdrawalFiltersContext);
  if (!ctx) throw new Error('useWithdrawalFilters must be used inside WithdrawalFiltersProvider');
  return ctx;
}
