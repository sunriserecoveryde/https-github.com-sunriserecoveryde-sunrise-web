import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_ROLE_ID, getRoleById, getPermission, canAccess, Permission, RoleDefinition } from '../data/mockRoles';
import type { Screen } from '../App';

interface RoleContextValue {
  roleId: string;
  setRoleId: (id: string) => void;
  role: RoleDefinition;
  getPermissionForScreen: (screen: Screen) => Permission;
  canAccessScreen: (screen: Screen) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<string>(DEFAULT_ROLE_ID);
  const role = getRoleById(roleId) ?? getRoleById(DEFAULT_ROLE_ID)!;

  const value: RoleContextValue = {
    roleId,
    setRoleId,
    role,
    getPermissionForScreen: (screen: Screen) => getPermission(roleId, screen),
    canAccessScreen: (screen: Screen) => canAccess(roleId, screen),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
