import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type Role = 'nursing' | 'bht' | 'counselor';

// ── Persistence ────────────────────────────────────────────────────────────
//
// Persisted keys and their cold-start flash guards
//
// Guard styles (see hooks/useRehydratedValue.ts for the canonical pattern):
//   B) Opacity animation — start at 0, fade to 1 once !isRehydrating.
//      Best for chip/tab bars where a value change is visually jarring.
//
// ┌──────────────────────────────────────────────┬──────────────────────┬───────┐
// │ AsyncStorage key                             │ Context field        │ Guard │
// ├──────────────────────────────────────────────┼──────────────────────┼───────┤
// │ @sunrise_role                                │ role                 │ B     │
// └──────────────────────────────────────────────┴──────────────────────┴───────┘
//
// See mar.tsx for the reference implementation of the shimmer guard.

const ROLE_KEY = '@sunrise_role';
const VALID_ROLES: Role[] = ['nursing', 'bht', 'counselor'];

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  /**
   * True while AsyncStorage is being read on mount.  UI that depends on the
   * persisted role (e.g. the RN / BHT toggle bar) should show a shimmer
   * skeleton until this is false to prevent a cold-start flash.
   */
  isRehydrating: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'nursing',
  setRole: () => {},
  isRehydrating: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('nursing');
  const [isRehydrating, setIsRehydrating] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Rehydrate persisted role on mount
  useEffect(() => {
    AsyncStorage.getItem(ROLE_KEY)
      .then(stored => {
        if (!mountedRef.current) return;
        if (stored && VALID_ROLES.includes(stored as Role)) {
          setRoleState(stored as Role);
        }
        setIsRehydrating(false);
      })
      .catch(() => {
        // Even on read errors, clear the loading flag so the toggle is not
        // permanently hidden.
        if (mountedRef.current) setIsRehydrating(false);
      });
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    AsyncStorage.setItem(ROLE_KEY, r).catch(() => { /* ignore write errors */ });
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, isRehydrating }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
