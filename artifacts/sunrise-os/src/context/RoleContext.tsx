/**
 * RoleContext — Phase 2
 *
 * In DEMO mode:
 *   Role and permission resolution uses the code-defined mockRoles.ts matrix.
 *   Staff-level overrides from permissionStore still apply.
 *
 * In PRODUCTION mode:
 *   Permission codes come from the server session (via AuthContext.productionSession).
 *   The role is still resolved from mockRoles.ts for display purposes (color, label).
 *   The server is ALWAYS authoritative — client permission checks are for UI only.
 *
 * Important: this context mirrors the server-side PermissionCode union. Any
 * changes to the permission vocabulary must be reflected in both:
 *   - artifacts/api-server/src/lib/permissionPolicy.ts
 *   - artifacts/sunrise-os/src/lib/permissions.ts
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_ROLE_ID, getRoleById, getPermission, canAccess, Permission, RoleDefinition } from '../data/mockRoles';
import { getScreenOverride } from '../data/permissionStore';
import { DATA_MODE } from '../lib/dataMode';
import type { PermissionCode } from '../lib/permissions';
import type { Screen } from '../App';

interface RoleContextValue {
  roleId: string;
  setRoleId: (id: string) => void;
  role: RoleDefinition;
  getPermissionForScreen: (screen: Screen) => Permission;
  canAccessScreen: (screen: Screen) => boolean;
  /** Production mode: full list of permission codes from the server session. */
  serverPermissionCodes: PermissionCode[];
  /** Check a server-side permission code (production mode). */
  hasServerPermission: (code: PermissionCode) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  children:             ReactNode;
  defaultRoleId?:       string;
  staffId?:             string;
  /** Production mode: permission codes from GET /api/v1/auth/session. */
  serverPermissionCodes?: PermissionCode[];
}

export function RoleProvider({
  children,
  defaultRoleId,
  staffId,
  serverPermissionCodes: serverCodes = [],
}: RoleProviderProps) {
  const [roleId, setRoleId] = useState<string>(defaultRoleId ?? DEFAULT_ROLE_ID);
  const role = getRoleById(roleId) ?? getRoleById(DEFAULT_ROLE_ID)!;
  const isProduction = DATA_MODE === 'production';

  const getPermissionForScreen = (screen: Screen): Permission => {
    if (isProduction) {
      // In production mode the server permission codes drive access.
      // Map the 13 server codes to the demo Permission type for backward compat.
      // Patient-related screens require patient.chart.view; list requires patient.list.view.
      return deriveScreenPermissionFromServerCodes(screen, serverCodes);
    }

    // Demo mode: check staff override first, then role default.
    if (staffId) {
      const override = getScreenOverride(staffId, screen);
      if (override !== undefined) return override;
    }
    return getPermission(roleId, screen);
  };

  const canAccessScreen = (screen: Screen): boolean =>
    getPermissionForScreen(screen) !== 'none';

  const hasServerPermission = (code: PermissionCode): boolean =>
    isProduction ? serverCodes.includes(code) : true; // demo: always true for UI

  const value: RoleContextValue = {
    roleId,
    setRoleId,
    role,
    getPermissionForScreen,
    canAccessScreen,
    serverPermissionCodes: serverCodes,
    hasServerPermission,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a Permission level from server-side permission codes.
 * This is a conservative mapping used for UI gating only.
 * The server always re-checks before returning data.
 */
function deriveScreenPermissionFromServerCodes(
  screen: Screen,
  codes: PermissionCode[],
): Permission {
  const has = (c: PermissionCode) => codes.includes(c);

  // Patient screens
  if (screen === 'PatientList')   return has('patient.list.view')  ? 'read' : 'none';
  if (screen === 'PatientDetail') return has('patient.chart.view') ? 'read' : 'none';
  if (screen === 'ChartReview')   return has('patient.chart.view') ? 'read' : 'none';

  // Admin screens
  if (screen === 'StaffAdmin')    return has('user.manage') ? 'full' : 'none';
  if (screen === 'AuditCompliance') return has('audit.authentication.view') ? 'read' : 'none';

  // All other screens: grant access if any permission is held (conservative).
  // In production the server enforces the actual boundary.
  return codes.length > 0 ? 'read' : 'none';
}
