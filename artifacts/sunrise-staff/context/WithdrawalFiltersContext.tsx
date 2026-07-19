import React, { createContext, useCallback, useContext, useState } from 'react';

export type WithdrawalScoreFilter = 'all' | 'cows' | 'ciwa' | 'alerts';

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

const WithdrawalFiltersContext = createContext<WithdrawalFiltersContextValue | null>(null);

export function WithdrawalFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WithdrawalFiltersState>(DEFAULT_STATE);

  const setScoreFilter = useCallback((filter: WithdrawalScoreFilter) => {
    setState(prev => ({ ...prev, scoreFilter: filter }));
  }, []);

  const dismissBanner = useCallback(() => {
    setState(prev => ({ ...prev, bannerDismissed: true }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(DEFAULT_STATE);
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
