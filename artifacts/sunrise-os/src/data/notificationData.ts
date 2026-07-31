/**
 * notificationData.ts — Shared notification definitions for Sunrise OS
 *
 * Extracted from NotificationPanel so the shared active-notification hook and
 * the panel component can both import without creating a circular dependency.
 *
 * Nothing in this file depends on React — it is plain TypeScript.
 */
import { Screen } from '../App';
import { MOCK_PATIENTS } from './mockPatients';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifCategory =
  | 'critical-clinical'
  | 'documentation'
  | 'medication'
  | 'authorization'
  | 'billing'
  | 'compliance'
  | 'scheduling'
  | 'system';

export interface Notification {
  id: string;
  /**
   * Stable key used for deduplication.
   * Format: `{filterTag}:{category-slug}:{patientId|'_'}:{screen|'_'}`
   * Two notifications with the same dedupeKey are considered the same
   * unresolved issue — only the first is shown.
   */
  dedupeKey: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  filterTag: NotifCategory;
  title: string;
  body: string;
  time: string;
  responsible?: string;
  patientId?: string;
  screen?: Screen;
  /** True for critical-clinical items — acknowledgment required before snooze/resolve */
  requiresAck?: boolean;
  /** Pre-computed specific primary action label */
  actionLabel: string;
}

// ── Action label derivation ───────────────────────────────────────────────────

export function deriveActionLabel(
  filterTag: NotifCategory,
  category: string,
  screen?: Screen,
): string {
  if (filterTag === 'critical-clinical') {
    if (category === 'AMA Risk')       return 'Review AMA Risk';
    if (category === 'Positive UA')    return 'Open Patient Chart';
    if (category === 'Clinical Alert') return 'Open Patient Chart';
    if (category === 'Mood Alert')     return 'Open Patient Chart';
    return 'Open Patient Chart';
  }
  if (filterTag === 'documentation') {
    if (screen === 'CosignQueue') return 'Open Co-Sign Queue';
    if (screen === 'ChartReview') return 'Open Chart Review';
    if (screen === 'Discharges')  return 'Open Discharge Plan';
    return 'Open Documentation';
  }
  if (filterTag === 'medication')     return 'Review Medication Issue';
  if (filterTag === 'authorization')  return 'Open Authorization';
  if (filterTag === 'billing')        return 'Open Claim';
  if (filterTag === 'compliance')     return 'Review Compliance Item';
  if (filterTag === 'scheduling')     return 'Open Calendar';
  if (filterTag === 'system')         return 'Open Patient Chart';
  return 'Open';
}

// ── Snooze duration helpers ───────────────────────────────────────────────────

export const SNOOZE_OPTIONS: { label: string; ms: () => number }[] = [
  { label: 'Snooze 1 hour',         ms: () => Date.now() + 1  * 60 * 60 * 1000 },
  { label: 'Snooze 4 hours',        ms: () => Date.now() + 4  * 60 * 60 * 1000 },
  { label: 'Snooze until tomorrow', ms: () => Date.now() + 24 * 60 * 60 * 1000 },
];

// ── Build notification list (with deduplication) ───────────────────────────────

function buildNotifications(): Notification[] {
  const raw: Notification[] = [];

  MOCK_PATIENTS.forEach(p => {
    const name = `${p.firstName} ${p.lastName}`;

    if (p.amaRisk === 'High') {
      const filterTag: NotifCategory = 'critical-clinical';
      const category = 'AMA Risk';
      const screen: Screen = 'PatientDetail';
      raw.push({
        id: `ama-${p.id}`,
        dedupeKey: `${filterTag}:ama:${p.id}:${screen}`,
        level: 'critical', category, filterTag,
        title: `AMA High Risk — ${name}`,
        body: `${p.program} | ${p.primaryDiagnosis.split(' ').slice(0, 4).join(' ')}. Immediate counselor check-in recommended.`,
        time: '8 min ago', responsible: 'Clinical Team',
        patientId: p.id, screen, requiresAck: true,
        actionLabel: deriveActionLabel(filterTag, category, screen),
      });
    }

    if (p.lastUa && p.lastUa !== 'Negative' && p.lastUa !== 'Pending') {
      const filterTag: NotifCategory = 'critical-clinical';
      const category = 'Positive UA';
      const screen: Screen = 'PatientDetail';
      raw.push({
        id: `ua-${p.id}`,
        dedupeKey: `${filterTag}:ua:${p.id}:${screen}`,
        level: 'critical', category, filterTag,
        title: `Positive UA — ${name}`,
        body: `${p.lastUa}. Physician notification required. Treatment plan review recommended.`,
        time: '24 min ago', responsible: 'Prescriber',
        patientId: p.id, screen, requiresAck: true,
        actionLabel: deriveActionLabel(filterTag, category, screen),
      });
    }

    if (p.craving >= 7) {
      const filterTag: NotifCategory = 'critical-clinical';
      const category = 'Clinical Alert';
      const screen: Screen = 'PatientDetail';
      raw.push({
        id: `craving-${p.id}`,
        dedupeKey: `${filterTag}:craving:${p.id}:${screen}`,
        level: 'warning', category, filterTag,
        title: `High Craving Score — ${name}`,
        body: `Craving ${p.craving}/10. Mood ${p.mood}/10. ${p.program}. MAT adjustment may be indicated.`,
        time: '1 hr ago', responsible: 'Primary Counselor',
        patientId: p.id, screen,
        actionLabel: deriveActionLabel(filterTag, category, screen),
      });
    }

    if (p.mood <= 3) {
      const filterTag: NotifCategory = 'critical-clinical';
      const category = 'Mood Alert';
      const screen: Screen = 'PatientDetail';
      raw.push({
        id: `mood-${p.id}`,
        dedupeKey: `${filterTag}:mood:${p.id}:${screen}`,
        level: 'warning', category, filterTag,
        title: `Low Mood Score — ${name}`,
        body: `Mood self-report ${p.mood}/10. Safety screening recommended per policy.`,
        time: '2 hr ago', responsible: 'Assigned Counselor',
        patientId: p.id, screen,
        actionLabel: deriveActionLabel(filterTag, category, screen),
      });
    }

    p.notes?.forEach(n => {
      if (n.status === 'Awaiting Co-sign') {
        const filterTag: NotifCategory = 'documentation';
        const category = 'Co-sign Required';
        const screen: Screen = 'CosignQueue';
        raw.push({
          id: `cosign-${p.id}-${n.id}`,
          dedupeKey: `${filterTag}:cosign:${p.id}:${n.id}`,
          level: 'info', category, filterTag,
          title: `Co-sign Required — ${name}`,
          body: `${n.type} by ${n.author} dated ${n.date}. Pending clinical director review.`,
          time: '3 hr ago', responsible: 'Clinical Supervisor',
          screen, actionLabel: deriveActionLabel(filterTag, category, screen),
        });
      }
    });
  });

  // Authorization
  (['auth-1', 'auth-2'] as const).forEach((id, i) => {
    const filterTag: NotifCategory = 'authorization';
    const category = 'Auth Expiring';
    const screen: Screen = 'InsuranceAuthorization';
    const name  = i === 0 ? 'Marcus Webb'  : 'Donna Reyes';
    const pid   = i === 0 ? 'p1'           : 'p2';
    const days  = i === 0 ? '2 days (07/29)' : '3 days (07/30)';
    const payer = i === 0 ? 'Aetna'        : 'BlueCross';
    raw.push({
      id,
      dedupeKey: `${filterTag}:auth-expiring:${pid}:${screen}`,
      level: 'warning', category, filterTag,
      title: `Authorization Expiring — ${name}`,
      body: `${payer} authorization expires in ${days}. UR review required immediately.`,
      time: '4 hr ago', responsible: 'UR Coordinator',
      screen, actionLabel: deriveActionLabel(filterTag, category, screen),
    });
  });

  // Documentation
  {
    const filterTag: NotifCategory = 'documentation';
    const screen: Screen = 'ChartReview';
    raw.push({
      id: 'chart-1',
      dedupeKey: `${filterTag}:chart-deficiency:_:${screen}`,
      level: 'info', category: 'Chart Deficiency', filterTag,
      title: '3 Charts Overdue for Completion',
      body: 'Jordan Kim, Tyler Brooks, Gregory Mills have documentation deficiencies >48 hours.',
      time: '6 hr ago', responsible: 'Assigned Clinicians',
      screen, actionLabel: deriveActionLabel(filterTag, 'Chart Deficiency', screen),
    });

    const dscreen: Screen = 'Discharges';
    raw.push({
      id: 'discharge-1',
      dedupeKey: `${filterTag}:discharge-planning:sarah-okafor:${dscreen}`,
      level: 'info', category: 'Discharge Planning', filterTag,
      title: 'Discharge Tomorrow — Sarah Okafor',
      body: 'Expected discharge 07/28. Discharge checklist is 80% complete. Aftercare plan needs signature.',
      time: '8 hr ago', responsible: 'Primary Counselor',
      screen: dscreen, actionLabel: deriveActionLabel(filterTag, 'Discharge Planning', dscreen),
    });
  }

  // Medication
  {
    const filterTag: NotifCategory = 'medication';
    const screen: Screen = 'NursingMAR';
    raw.push({
      id: 'med-1',
      dedupeKey: `${filterTag}:mar-incomplete:_:${screen}`,
      level: 'warning', category: 'Medication', filterTag,
      title: 'MAR Incomplete — Evening Medications',
      body: '3 patients have evening medications unrecorded. Nursing follow-up required before midnight.',
      time: '5 hr ago', responsible: 'Charge Nurse',
      screen, requiresAck: false,
      actionLabel: deriveActionLabel(filterTag, 'Medication', screen),
    });
  }

  // Compliance
  {
    const filterTag: NotifCategory = 'compliance';
    const screen: Screen = 'WorkforceCompliance';
    raw.push({
      id: 'compliance-1',
      dedupeKey: `${filterTag}:credential-expiry:sarah-jenkins:${screen}`,
      level: 'warning', category: 'Credential Expiry', filterTag,
      title: 'Credential Expiring — Sarah Jenkins',
      body: 'CAC-AD III expires in 22 days. Renewal documentation must be submitted to HR.',
      time: '1 day ago', responsible: 'HR / Staff',
      screen, actionLabel: deriveActionLabel(filterTag, 'Credential Expiry', screen),
    });
  }

  // Scheduling
  {
    const filterTag: NotifCategory = 'scheduling';
    const screen: Screen = 'GroupSchedule';
    raw.push({
      id: 'sched-1',
      dedupeKey: `${filterTag}:session-conflict:_:${screen}`,
      level: 'info', category: 'Scheduling', filterTag,
      title: 'Group Session Facilitator Conflict',
      body: 'Thursday 2:00 PM CBT group has no assigned facilitator. Assign before 48 hrs prior.',
      time: '2 hr ago', responsible: 'Clinical Supervisor',
      screen, actionLabel: deriveActionLabel(filterTag, 'Scheduling', screen),
    });
  }

  // Billing
  {
    const filterTag: NotifCategory = 'billing';
    const screen: Screen = 'RevenueCycle';
    raw.push({
      id: 'billing-1',
      dedupeKey: `${filterTag}:claim-denial:_:${screen}`,
      level: 'warning', category: 'Claim Denial', filterTag,
      title: '12 Claims Denied This Month',
      body: 'Blue Cross: medical necessity not established (6). Medicaid: missing prior auth (6). Appeals due within 30 days.',
      time: '3 hr ago', responsible: 'Billing Team',
      screen, actionLabel: deriveActionLabel(filterTag, 'Claim Denial', screen),
    });
  }

  // System / milestones
  {
    const filterTag: NotifCategory = 'system';
    const screen: Screen = 'PatientDetail';
    raw.push({
      id: 'success-1',
      dedupeKey: `${filterTag}:milestone:p15:${screen}`,
      level: 'success', category: 'Milestone', filterTag,
      title: 'Milestone — Aaron Fletcher',
      body: '30 days continuous abstinence achieved. Consider milestone recognition at group today.',
      time: '9 hr ago', screen, patientId: 'p15',
      actionLabel: deriveActionLabel(filterTag, 'Milestone', screen),
    });
    raw.push({
      id: 'success-2',
      dedupeKey: `${filterTag}:milestone:p20:${screen}`,
      level: 'success', category: 'Milestone', filterTag,
      title: 'Discharge Outcome — Michelle Park',
      body: 'IOP completion with housing secured and sponsor confirmed. Excellent outcome.',
      time: '10 hr ago', screen, patientId: 'p20',
      actionLabel: deriveActionLabel(filterTag, 'Milestone', screen),
    });
  }

  // Deduplicate: only the first notification per dedupeKey reaches the active list
  const seenKeys = new Set<string>();
  return raw.filter(n => {
    if (seenKeys.has(n.dedupeKey)) return false;
    seenKeys.add(n.dedupeKey);
    return true;
  });
}

// ── Module-level constants (stable IDs) ───────────────────────────────────────

export const ALL_NOTIFICATIONS: Notification[] = buildNotifications();

/** All stable notification IDs */
export const ALL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS.map(n => n.id);

/** IDs of critical-clinical notifications — used to compute the topbar badge */
export const CRITICAL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS
  .filter(n => n.filterTag === 'critical-clinical')
  .map(n => n.id);

// ── Visual config ─────────────────────────────────────────────────────────────

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const LEVEL_CONFIG: Record<
  Notification['level'],
  { icon: LucideIcon; bg: string; border: string; iconColor: string; badge: string }
> = {
  critical: { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-l-red-400',    iconColor: 'text-red-500',   badge: 'bg-red-100 text-red-700' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-l-amber-400',  iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  info:     { icon: Info,          bg: 'bg-blue-50',   border: 'border-l-blue-400',   iconColor: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  success:  { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-l-green-400',  iconColor: 'text-green-500', badge: 'bg-green-100 text-green-700' },
};

export const CATEGORY_TABS: { id: NotifCategory | 'all'; label: string }[] = [
  { id: 'all',               label: 'All' },
  { id: 'critical-clinical', label: 'Clinical' },
  { id: 'documentation',     label: 'Docs' },
  { id: 'medication',        label: 'Meds' },
  { id: 'authorization',     label: 'Auth' },
  { id: 'billing',           label: 'Billing' },
  { id: 'compliance',        label: 'Compliance' },
  { id: 'scheduling',        label: 'Scheduling' },
  { id: 'system',            label: 'System' },
];
