import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type WithdrawalScoreFilter = 'all' | 'cows' | 'ciwa' | 'alerts';

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
};

const VALID_SCORE_FILTERS: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

const WithdrawalFiltersContext = createContext<WithdrawalFiltersContextValue | null>(null);

export function WithdrawalFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WithdrawalFiltersState>(DEFAULT_STATE);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Rehydrate persisted values on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SCORE_FILTER_KEY),
      AsyncStorage.getItem(BANNER_DISMISSED_KEY),
      AsyncStorage.getItem(FILTER_NOTICE_DISMISSED_KEY),
      AsyncStorage.getItem(LAST_DISCHARGE_PATIENT_KEY),
    ]).then(([storedFilter, storedBannerDismissed, storedDismissed, storedLastDischarge]) => {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        ...(storedFilter && VALID_SCORE_FILTERS.includes(storedFilter as WithdrawalScoreFilter)
          ? { scoreFilter: storedFilter as WithdrawalScoreFilter }
          : {}),
        ...(storedBannerDismissed === 'true' ? { bannerDismissed: true } : {}),
        ...(storedDismissed ? { filterNoticeDismissedForPatientId: storedDismissed } : {}),
        // Rehydrate lastTrackedDischargePatientId so trackDischargePatientId can
        // correctly detect whether the post-restart discharge is truly new.
        ...(storedLastDischarge ? { lastTrackedDischargePatientId: storedLastDischarge } : {}),
      }));
    }).catch(() => {/* ignore read errors */});
  }, []);

  const setScoreFilter = useCallback((filter: WithdrawalScoreFilter) => {
    setState(prev => ({ ...prev, scoreFilter: filter }));
    AsyncStorage.setItem(SCORE_FILTER_KEY, filter).catch(() => {/* ignore write errors */});
  }, []);

  const dismissBanner = useCallback(() => {
    setState(prev => ({ ...prev, bannerDismissed: true }));
    AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true').catch(() => {/* ignore write errors */});
  }, []);

  const dismissFilterNotice = useCallback((patientId: string) => {
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
    setState(DEFAULT_STATE);
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
