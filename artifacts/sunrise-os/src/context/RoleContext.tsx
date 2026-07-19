import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_ROLE_ID, getRoleById, getPermission, canAccess, Permission, RoleDefinition } from '../data/mockRoles';
import { getScreenOverride } from '../data/permissionStore';
import type { Screen } from '../App';

interface RoleContextValue {
  roleId: string;
  setRoleId: (id: string) => void;
  role: RoleDefinition;
  getPermissionForScreen: (screen: Screen) => Permission;
  canAccessScreen: (screen: Screen) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  children: ReactNode;
  defaultRoleId?: string;   // initial role (set from logged-in staff member)
  staffId?: string;         // logged-in staff ID (used to check individual overrides)
}

export function RoleProvider({ children, defaultRoleId, staffId }: RoleProviderProps) {
  const [roleId, setRoleId] = useState<string>(defaultRoleId ?? DEFAULT_ROLE_ID);
  const role = getRoleById(roleId) ?? getRoleById(DEFAULT_ROLE_ID)!;

  const getPermissionForScreen = (screen: Screen): Permission => {
    // 1. Check staff-level permission overrides first
    if (staffId) {
      const override = getScreenOverride(staffId, screen);
      if (override !== undefined) return override;
    }
    // 2. Fall back to role default
    return getPermission(roleId, screen);
  };

  const canAccessScreen = (screen: Screen): boolean =>
    getPermissionForScreen(screen) !== 'none';

  const value: RoleContextValue = {
    roleId,
    setRoleId,
    role,
    getPermissionForScreen,
    canAccessScreen,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
