/**
 * NotificationPanel — Sunrise OS notification centre
 *
 * States per notification:
 *  Unread      → orange dot, bold title, coloured left border
 *  Read        → no dot, normal weight, transparent border
 *  Acknowledged → "✓ Ack" badge; still visible; enables snooze + resolve
 *  Snoozed     → hidden from active list until expiry; not counted
 *  Resolved    → hidden from active list; not counted (stored for audit)
 *
 * Critical-clinical gate:
 *  - Must be acknowledged before it can be snoozed or resolved.
 *  - Acknowledgment ≠ resolution; both are explicit separate actions.
 *  - Audit entry written on resolve.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  X, AlertCircle, AlertTriangle, Info, CheckCircle,
  ExternalLink, BellOff, Check, CheckCheck, Clock,
  MoreHorizontal, ShieldCheck,
} from 'lucide-react';
import { Screen } from '../../App';
import { MOCK_PATIENTS } from '../../data/mockPatients';
import { useDemoStore } from '../../store/demoStore';

interface Props {
  onClose: () => void;
  navigate: (s: Screen, patientId?: string) => void;
}

// ── Notification type ─────────────────────────────────────────────────────────

interface Notification {
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

export type NotifCategory =
  | 'critical-clinical'
  | 'documentation'
  | 'medication'
  | 'authorization'
  | 'billing'
  | 'compliance'
  | 'scheduling'
  | 'system';

// ── Action label derivation ───────────────────────────────────────────────────

function deriveActionLabel(
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

const SNOOZE_OPTIONS: { label: string; ms: () => number }[] = [
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
    const pid   = i === 0 ? 'p1'           : 'p2'; // stable patient surrogate for dedup
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

const ALL_NOTIFICATIONS = buildNotifications();

/** All stable notification IDs — exported so Topbar can derive the unread badge count */
export const ALL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS.map(n => n.id);

/** IDs of critical-clinical notifications — used to compute the topbar badge */
export const CRITICAL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS
  .filter(n => n.filterTag === 'critical-clinical')
  .map(n => n.id);

// ── Visual config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  critical: { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-l-red-400',    iconColor: 'text-red-500',   badge: 'bg-red-100 text-red-700' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-l-amber-400',  iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  info:     { icon: Info,          bg: 'bg-blue-50',   border: 'border-l-blue-400',   iconColor: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  success:  { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-l-green-400',  iconColor: 'text-green-500', badge: 'bg-green-100 text-green-700' },
};

const CATEGORY_TABS: { id: NotifCategory | 'all'; label: string }[] = [
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

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationPanel({ onClose, navigate }: Props) {
  const panelRef       = useRef<HTMLDivElement>(null);
  const overflowRef    = useRef<HTMLDivElement>(null);
  const [filter, setFilter]           = useState<NotifCategory | 'all'>('all');
  const [pendingAck, setPendingAck]   = useState<string | null>(null);
  const [overflowId, setOverflowId]   = useState<string | null>(null);

  // Tick every 60 seconds so snooze expiry is re-evaluated without user interaction
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const {
    state,
    markRead, markAllRead,
    snoozeNotification,
    acknowledgeNotification,
    resolveNotification,
    addAuditEntry,
  } = useDemoStore();

  // Click-outside for the panel itself
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Click-outside for the overflow menu
  useEffect(() => {
    if (!overflowId) return;
    function handler(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowId(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [overflowId]);

  // Escape closes overflow menu first, then panel
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (overflowId) { setOverflowId(null); return; }
      onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [overflowId, onClose]);

  // Merge state — exclude resolved and actively snoozed
  const notifications = useMemo(() => {
    return ALL_NOTIFICATIONS
      .filter(n => {
        if (state.notificationResolvedIds.includes(n.id)) return false;
        const snoozedUntil = state.notificationSnoozeExpiry[n.id] ?? 0;
        if (snoozedUntil > now) return false;
        return true;
      })
      .map(n => ({
        ...n,
        read:         state.notificationReadIds.includes(n.id),
        acknowledged: state.notificationAcknowledgedIds.includes(n.id),
      }));
  }, [
    state.notificationReadIds,
    state.notificationAcknowledgedIds,
    state.notificationResolvedIds,
    state.notificationSnoozeExpiry,
    now,
  ]);

  // Active snooze count — for footer display
  const snoozedCount = useMemo(() =>
    ALL_NOTIFICATIONS.filter(n => (state.notificationSnoozeExpiry[n.id] ?? 0) > now).length,
    [state.notificationSnoozeExpiry, now],
  );

  const resolvedCount = state.notificationResolvedIds.length;

  // Filtered view
  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.filterTag === filter);
  }, [notifications, filter]);

  // Counts — both exclude resolved + snoozed (via `notifications`)
  const unreadTotal   = notifications.filter(n => !n.read).length;
  const unreadVisible = visible.filter(n => !n.read).length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePrimaryAction = useCallback((n: typeof notifications[0]) => {
    // Critical-clinical, not yet acknowledged → open acknowledgment modal
    if (n.requiresAck && !n.acknowledged) {
      setPendingAck(n.id);
      return;
    }
    markRead(n.id);
    if (n.screen) { navigate(n.screen, n.patientId); onClose(); }
  }, [markRead, navigate, onClose]);

  /** Acknowledge only — does NOT resolve or navigate */
  const handleAcknowledgeOnly = useCallback((id: string) => {
    acknowledgeNotification(id);
    setPendingAck(null);
    // Write audit entry for the acknowledgment
    const n = ALL_NOTIFICATIONS.find(x => x.id === id);
    if (n) {
      addAuditEntry({
        staffName: 'Current User',
        action: 'Acknowledged',
        entity: 'Notification',
        detail: n.title,
      });
    }
  }, [acknowledgeNotification, addAuditEntry]);

  /** Acknowledge + navigate (existing behaviour from modal primary button) */
  const handleAcknowledgeAndOpen = useCallback((id: string) => {
    const n = notifications.find(x => x.id === id);
    acknowledgeNotification(id);
    setPendingAck(null);
    addAuditEntry({
      staffName: 'Current User',
      action: 'Acknowledged',
      entity: 'Notification',
      detail: n?.title ?? id,
    });
    if (n?.screen) { navigate(n.screen, n.patientId); onClose(); }
  }, [notifications, acknowledgeNotification, addAuditEntry, navigate, onClose]);

  const handleResolve = useCallback((id: string) => {
    const n = ALL_NOTIFICATIONS.find(x => x.id === id);
    // Guard: critical-clinical must be acknowledged first (UI also enforces this)
    if (n?.requiresAck && !state.notificationAcknowledgedIds.includes(id)) return;
    resolveNotification(id);
    setOverflowId(null);
    addAuditEntry({
      staffName: 'Current User',
      action: 'Resolved',
      entity: 'Notification',
      detail: n?.title ?? id,
    });
  }, [resolveNotification, addAuditEntry, state.notificationAcknowledgedIds]);

  const handleSnooze = useCallback((id: string, untilMs: number) => {
    snoozeNotification(id, untilMs);
    setOverflowId(null);
  }, [snoozeNotification]);

  // ── Group by severity for rendering ─────────────────────────────────────────

  const bySeverity = (['critical', 'warning', 'info', 'success'] as const)
    .map(level => ({ level, items: visible.filter(n => n.level === level) }))
    .filter(g => g.items.length > 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        ref={panelRef}
        className="absolute top-full right-0 mt-2 w-[480px] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy text-sm">Notifications</span>
            {unreadTotal > 0 && (
              <span className="text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadTotal > 0 && (
              <button
                onClick={() => markAllRead(ALL_NOTIFICATION_IDS)}
                className="flex items-center gap-1 text-[11px] text-orange hover:text-orange-700 font-medium px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors ml-1"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-slate" />
            </button>
          </div>
        </div>

        {/* ── Category filter tabs ── */}
        <div className="flex gap-1 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map(tab => {
            // Per-tab unread = active (not resolved/snoozed) + unread + matching tag
            const tabUnread = tab.id === 'all'
              ? unreadTotal
              : notifications.filter(n => n.filterTag === tab.id && !n.read).length;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange ${
                  filter === tab.id
                    ? 'bg-navy text-white'
                    : 'text-slate hover:bg-gray-100 hover:text-navy'
                }`}
              >
                {tab.label}
                {tabUnread > 0 && (
                  <span className={`text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold ${
                    filter === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mark all in current category */}
        {filter !== 'all' && unreadVisible > 0 && (
          <div className="px-4 py-1.5 border-b border-border bg-gray-50/60 flex justify-end">
            <button
              onClick={() => markAllRead(visible.map(n => n.id))}
              className="flex items-center gap-1 text-[11px] text-slate hover:text-navy transition-colors"
            >
              <Check className="w-3 h-3" />
              Mark all {CATEGORY_TABS.find(t => t.id === filter)?.label} as read
            </button>
          </div>
        )}

        {/* ── Notification list ── */}
        <div className="overflow-y-auto max-h-[480px]">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate">
              <BellOff className="w-8 h-8 text-gray-300" aria-hidden="true" />
              <div className="text-sm font-medium">No active notifications</div>
              <div className="text-xs">
                {filter !== 'all' ? 'Try switching to "All"' : 'You\'re all caught up'}
              </div>
            </div>
          ) : (
            bySeverity.map(({ level, items }) => {
              const groupUnread = items.filter(n => !n.read).length;
              return (
                <div key={level}>
                  {/* Severity group header */}
                  <div className="px-4 py-1.5 bg-gray-50 border-b border-border flex items-center justify-between sticky top-0 z-10">
                    <span className="text-[11px] font-semibold text-slate uppercase tracking-wide">
                      {level === 'critical' ? '🔴 Critical'
                        : level === 'warning' ? '🟡 Warnings'
                        : level === 'info'    ? '🔵 Information'
                        :                       '🟢 Successes'}
                      <span className="ml-1.5 font-normal normal-case">({items.length})</span>
                    </span>
                    {groupUnread > 0 && (
                      <button
                        onClick={() => markAllRead(items.map(n => n.id))}
                        className="flex items-center gap-1 text-[10px] text-slate hover:text-navy transition-colors"
                        title="Mark group as read"
                      >
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>

                  {/* Notification rows */}
                  {items.map(n => {
                    const cfg     = LEVEL_CONFIG[n.level];
                    const NIcon   = cfg.icon;
                    const needsAck = n.requiresAck && !n.acknowledged;
                    const canResolve = !n.requiresAck || n.acknowledged;
                    const isOverflow = overflowId === n.id;

                    return (
                      <div
                        key={n.id}
                        role="article"
                        aria-label={n.title}
                        className={`px-4 py-3 border-b border-border last:border-0 border-l-2 transition-colors ${
                          !n.read
                            ? `bg-white ${cfg.border}`
                            : 'bg-gray-50/40 border-l-transparent'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Severity icon */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}
                            aria-hidden="true"
                          >
                            <NIcon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Row 1: badges + time */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Category badge */}
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
                                  {n.category}
                                </span>
                                {/* Unread dot */}
                                {!n.read && (
                                  <span
                                    className="w-1.5 h-1.5 bg-orange rounded-full shrink-0"
                                    aria-label="Unread"
                                  />
                                )}
                                {/* Ack required badge */}
                                {needsAck && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-600 text-white uppercase tracking-wide">
                                    Ack Required
                                  </span>
                                )}
                                {/* Acknowledged badge */}
                                {n.acknowledged && !needsAck && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-700 flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
                                    Ack
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-slate flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                                  {n.time}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: title */}
                            <div className={`text-xs mt-1 font-semibold ${n.read ? 'text-slate' : 'text-navy'}`}>
                              {n.title}
                            </div>

                            {/* Row 3: body */}
                            <div className="text-[11px] text-slate mt-0.5 leading-relaxed line-clamp-2">
                              {n.body}
                            </div>

                            {/* Row 4: responsible */}
                            {n.responsible && (
                              <div className="text-[11px] text-slate/70 mt-0.5">
                                Responsible: {n.responsible}
                              </div>
                            )}

                            {/* Row 5: actions */}
                            <div className="flex items-center justify-between mt-2 gap-2">
                              {/* Specific primary action */}
                              {n.screen && (
                                <button
                                  type="button"
                                  onClick={() => handlePrimaryAction(n)}
                                  className="flex items-center gap-1 text-[11px] text-orange font-semibold hover:text-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange rounded"
                                >
                                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                  {n.actionLabel}
                                </button>
                              )}

                              {/* Overflow menu ⋯ */}
                              <div className="relative ml-auto" ref={isOverflow ? overflowRef : undefined}>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOverflowId(isOverflow ? null : n.id);
                                  }}
                                  aria-label={`More options for ${n.title}`}
                                  aria-expanded={isOverflow}
                                  aria-haspopup="menu"
                                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>

                                {isOverflow && (
                                  <div
                                    role="menu"
                                    className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                                  >
                                    {/* Snooze options — only available after ack for critical-clinical */}
                                    {(!n.requiresAck || n.acknowledged) ? (
                                      <>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate uppercase tracking-wider border-b border-border bg-gray-50">
                                          Snooze
                                        </div>
                                        {SNOOZE_OPTIONS.map(opt => (
                                          <button
                                            key={opt.label}
                                            role="menuitem"
                                            type="button"
                                            onClick={e => { e.stopPropagation(); handleSnooze(n.id, opt.ms()); }}
                                            className="w-full text-left text-xs px-3 py-2 text-slate hover:bg-gray-50 hover:text-navy transition-colors flex items-center gap-2"
                                          >
                                            <Clock className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                                            {opt.label}
                                          </button>
                                        ))}
                                        <div className="border-t border-border" />
                                      </>
                                    ) : (
                                      <>
                                        <div className="px-3 py-2 text-[11px] text-slate bg-amber-50 border-b border-border">
                                          Acknowledge first to enable snooze and resolve.
                                        </div>
                                        <button
                                          role="menuitem"
                                          type="button"
                                          onClick={e => { e.stopPropagation(); setPendingAck(n.id); setOverflowId(null); }}
                                          className="w-full text-left text-xs px-3 py-2 text-navy font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                          <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
                                          Acknowledge
                                        </button>
                                        <div className="border-t border-border" />
                                      </>
                                    )}

                                    {/* Mark as read */}
                                    {!n.read && (
                                      <button
                                        role="menuitem"
                                        type="button"
                                        onClick={e => { e.stopPropagation(); markRead(n.id); setOverflowId(null); }}
                                        className="w-full text-left text-xs px-3 py-2 text-slate hover:bg-gray-50 hover:text-navy transition-colors flex items-center gap-2"
                                      >
                                        <Check className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                                        Mark as read
                                      </button>
                                    )}

                                    {/* Resolve */}
                                    <button
                                      role="menuitem"
                                      type="button"
                                      disabled={!canResolve}
                                      onClick={e => { e.stopPropagation(); if (canResolve) handleResolve(n.id); }}
                                      className={`w-full text-left text-xs px-3 py-2 transition-colors flex items-center gap-2 ${
                                        canResolve
                                          ? 'text-slate hover:bg-gray-50 hover:text-navy'
                                          : 'text-slate-300 cursor-not-allowed'
                                      }`}
                                    >
                                      <CheckCircle className={`w-3 h-3 shrink-0 ${canResolve ? 'text-green-500' : 'text-slate-300'}`} aria-hidden="true" />
                                      {canResolve ? 'Resolve' : 'Resolve (ack required)'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 border-t border-border bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] text-slate">
            <span>{unreadVisible > 0 ? `${unreadVisible} unread` : 'All caught up'}{filter !== 'all' && ' · Filtered'}</span>
            {snoozedCount > 0 && (
              <span className="text-slate/60">· {snoozedCount} snoozed</span>
            )}
            {resolvedCount > 0 && (
              <span className="text-slate/60">· {resolvedCount} resolved</span>
            )}
          </div>
          <button
            onClick={() => { navigate('CommandCenter'); onClose(); }}
            className="text-xs text-orange font-medium hover:underline shrink-0"
          >
            View All in Command Center
          </button>
        </div>
      </div>

      {/* ── Acknowledgment modal ──────────────────────────────────────────────── */}
      {pendingAck && (() => {
        const n = notifications.find(x => x.id === pendingAck)
          ?? ALL_NOTIFICATIONS.find(x => x.id === pendingAck);
        if (!n) return null;
        const cfg   = LEVEL_CONFIG[n.level];
        const NIcon = cfg.icon;
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.6)' }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
                <NIcon className={`w-5 h-5 ${cfg.iconColor} shrink-0`} aria-hidden="true" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-red-700">
                    Acknowledgment Required
                  </div>
                  <div className="text-sm font-semibold text-navy mt-0.5">{n.title}</div>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-sm text-slate">{n.body}</p>
                {n.responsible && (
                  <p className="text-xs text-slate/70 mt-1">Responsible: {n.responsible}</p>
                )}
                <p className="text-xs text-slate mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This is a <strong>critical clinical alert</strong>. Acknowledging confirms you have
                  read this alert and are taking responsibility for follow-up.
                  <strong> Acknowledgment does not resolve the alert.</strong>
                </p>
              </div>

              <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={() => setPendingAck(null)}
                  className="text-sm text-slate hover:text-navy px-4 py-2 rounded border border-border transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {/* Acknowledge only — stays in list, does NOT navigate */}
                  <button
                    onClick={() => handleAcknowledgeOnly(pendingAck)}
                    className="flex items-center gap-2 text-sm font-medium text-navy border border-navy px-3 py-1.5 rounded hover:bg-navy/5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Acknowledge Only
                  </button>
                  {/* Acknowledge + open record */}
                  <button
                    onClick={() => handleAcknowledgeAndOpen(pendingAck)}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acknowledge &amp; Open Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
