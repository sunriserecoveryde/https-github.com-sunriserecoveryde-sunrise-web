/**
 * Module-level in-memory store for staff-level permission overrides.
 * Changes made by the Security Administrator in StaffAdmin are persisted
 * here for the duration of the browser session. When a staff member logs in,
 * their effective permissions are: override (if set) → role default.
 */
import type { Permission } from './mockRoles';
import type { StaffAccessFlags } from './mockStaff';

// Screen-level permission overrides per staff member
const screenOverrides: Record<string, Record<string, Permission>> = {};

// Access flag overrides per staff member
const flagOverrides: Record<string, Partial<StaffAccessFlags>> = {};

// Audit log entries
export interface AuditEntry {
  id: string;
  timestamp: string;
  changedBy: string;   // staff name
  targetStaff: string;
  changeType: 'screen_permission' | 'access_flag';
  screen?: string;
  flag?: string;
  oldValue: string;
  newValue: string;
}

const auditLog: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-07-14 14:22', changedBy: 'Alex Kim', targetStaff: 'Michael Boyd', changeType: 'screen_permission', screen: 'IncidentReporting', oldValue: 'read', newValue: 'full' },
  { id: 'a2', timestamp: '2026-07-12 10:05', changedBy: 'Alex Kim', targetStaff: 'Amanda Lewis', changeType: 'screen_permission', screen: 'PatientList', oldValue: 'none', newValue: 'read' },
  { id: 'a3', timestamp: '2026-07-10 09:48', changedBy: 'Alex Kim', targetStaff: 'Linda Vance', changeType: 'access_flag', flag: 'billingCodes', oldValue: 'disabled', newValue: 'enabled' },
  { id: 'a4', timestamp: '2026-07-08 16:30', changedBy: 'Alex Kim', targetStaff: 'David Odom', changeType: 'screen_permission', screen: 'ASAMAssessments', oldValue: 'none', newValue: 'read' },
  { id: 'a5', timestamp: '2026-07-03 11:15', changedBy: 'Alex Kim', targetStaff: 'Carlos Rivera', changeType: 'screen_permission', screen: 'PatientList', oldValue: 'none', newValue: 'read' },
  { id: 'a6', timestamp: '2026-06-28 08:22', changedBy: 'Alex Kim', targetStaff: 'Kevin Wright', changeType: 'access_flag', flag: 'reportAccess', oldValue: 'own', newValue: 'department' },
];

// ─── Screen overrides ────────────────────────────────────────────────────────

export function getScreenOverride(staffId: string, screen: string): Permission | undefined {
  return screenOverrides[staffId]?.[screen];
}

export function setScreenOverride(staffId: string, screen: string, perm: Permission): void {
  if (!screenOverrides[staffId]) screenOverrides[staffId] = {};
  screenOverrides[staffId][screen] = perm;
}

export function clearScreenOverride(staffId: string, screen: string): void {
  if (screenOverrides[staffId]) {
    delete screenOverrides[staffId][screen];
  }
}

export function getAllScreenOverrides(staffId: string): Record<string, Permission> {
  return { ...(screenOverrides[staffId] ?? {}) };
}

// ─── Access flag overrides ────────────────────────────────────────────────────

export function getStaffFlags(staffId: string, defaults: StaffAccessFlags): StaffAccessFlags {
  return { ...defaults, ...(flagOverrides[staffId] ?? {}) };
}

export function setStaffFlag<K extends keyof StaffAccessFlags>(
  staffId: string,
  flag: K,
  value: StaffAccessFlags[K],
): void {
  if (!flagOverrides[staffId]) flagOverrides[staffId] = {};
  (flagOverrides[staffId] as StaffAccessFlags)[flag] = value;
}

export function getFlagOverrides(staffId: string): Partial<StaffAccessFlags> {
  return { ...(flagOverrides[staffId] ?? {}) };
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export function appendAudit(entry: Omit<AuditEntry, 'id'>): void {
  auditLog.unshift({ id: `a${Date.now()}`, ...entry });
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}
