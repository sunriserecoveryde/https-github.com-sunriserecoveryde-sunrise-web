import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type WithdrawalScoreFilter = 'all' | 'cows' | 'ciwa' | 'alerts';

const SCORE_FILTER_KEY = '@withdrawal_score_filter';

interface WithdrawalFiltersState {
  scoreFilter: WithdrawalScoreFilter;
  bannerDismissed: boolean;
}

interface WithdrawalFiltersContextValue extends WithdrawalFiltersState {
  setScoreFilter: (filter: WithdrawalScoreFilter) => void;
  dismissBanner: () => void;
  clearFilters: () => void;
}

const DEFAULT_STATE: WithdrawalFiltersState = {
  scoreFilter: 'all',
  bannerDismissed: false,
};

const VALID_SCORE_FILTERS: WithdrawalScoreFilter[] = ['all', 'cows', 'ciwa', 'alerts'];

const WithdrawalFiltersContext = createContext<WithdrawalFiltersContextValue | null>(null);

export function WithdrawalFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WithdrawalFiltersState>(DEFAULT_STATE);

  // Rehydrate persisted scoreFilter on mount
  useEffect(() => {
    AsyncStorage.getItem(SCORE_FILTER_KEY).then(stored => {
      if (stored && VALID_SCORE_FILTERS.includes(stored as WithdrawalScoreFilter)) {
        setState(prev => ({ ...prev, scoreFilter: stored as WithdrawalScoreFilter }));
      }
    }).catch(() => {/* ignore read errors */});
  }, []);

  const setScoreFilter = useCallback((filter: WithdrawalScoreFilter) => {
    setState(prev => ({ ...prev, scoreFilter: filter }));
    AsyncStorage.setItem(SCORE_FILTER_KEY, filter).catch(() => {/* ignore write errors */});
  }, []);

  const dismissBanner = useCallback(() => {
    setState(prev => ({ ...prev, bannerDismissed: true }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(DEFAULT_STATE);
    AsyncStorage.removeItem(SCORE_FILTER_KEY).catch(() => {/* ignore remove errors */});
  }, []);

  return (
    <WithdrawalFiltersContext.Provider value={{ ...state, setScoreFilter, dismissBanner, clearFilters }}>
      {children}
    </WithdrawalFiltersContext.Provider>
  );
}

export function useWithdrawalFilters(): WithdrawalFiltersContextValue {
  const ctx = useContext(WithdrawalFiltersContext);
  if (!ctx) throw new Error('useWithdrawalFilters must be used inside WithdrawalFiltersProvider');
  return ctx;
}
