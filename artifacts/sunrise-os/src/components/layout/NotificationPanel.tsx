import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, AlertCircle, AlertTriangle, Info, CheckCircle,
  ExternalLink, BellOff, Check, CheckCheck, Clock, EyeOff,
} from 'lucide-react';
import { Screen } from '../../App';
import { MOCK_PATIENTS } from '../../data/mockPatients';
import { useDemoStore } from '../../store/demoStore';

interface Props {
  onClose: () => void;
  navigate: (s: Screen, patientId?: string) => void;
}

interface Notification {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  filterTag: NotifCategory;
  title: string;
  body: string;
  time: string;
  responsible?: string;
  patientId?: string;
  screen?: Screen;
  requiresAck?: boolean; // critical-clinical items need explicit acknowledgment
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

// ── Build static notification list ──────────────────────────────────────────
function buildNotifications(): Notification[] {
  const notes: Notification[] = [];

  MOCK_PATIENTS.forEach(p => {
    const name = `${p.firstName} ${p.lastName}`;

    if (p.amaRisk === 'High') {
      notes.push({
        id: `ama-${p.id}`, level: 'critical',
        category: 'AMA Risk', filterTag: 'critical-clinical',
        title: `AMA High Risk — ${name}`,
        body: `${p.program} | ${p.primaryDiagnosis.split(' ').slice(0, 4).join(' ')}. Immediate counselor check-in recommended.`,
        time: '8 min ago', responsible: 'Clinical Team',
        patientId: p.id, screen: 'PatientDetail', requiresAck: true,
      });
    }

    if (p.lastUa && p.lastUa !== 'Negative' && p.lastUa !== 'Pending') {
      notes.push({
        id: `ua-${p.id}`, level: 'critical',
        category: 'Positive UA', filterTag: 'critical-clinical',
        title: `Positive UA — ${name}`,
        body: `${p.lastUa}. Physician notification required. Treatment plan review recommended.`,
        time: '24 min ago', responsible: 'Prescriber',
        patientId: p.id, screen: 'PatientDetail', requiresAck: true,
      });
    }

    if (p.craving >= 7) {
      notes.push({
        id: `craving-${p.id}`, level: 'warning',
        category: 'Clinical Alert', filterTag: 'critical-clinical',
        title: `High Craving Score — ${name}`,
        body: `Craving ${p.craving}/10. Mood ${p.mood}/10. ${p.program}. MAT adjustment may be indicated.`,
        time: '1 hr ago', responsible: 'Primary Counselor',
        patientId: p.id, screen: 'PatientDetail',
      });
    }

    if (p.mood <= 3) {
      notes.push({
        id: `mood-${p.id}`, level: 'warning',
        category: 'Mood Alert', filterTag: 'critical-clinical',
        title: `Low Mood Score — ${name}`,
        body: `Mood self-report ${p.mood}/10. Safety screening recommended per policy.`,
        time: '2 hr ago', responsible: 'Assigned Counselor',
        patientId: p.id, screen: 'PatientDetail',
      });
    }

    p.notes?.forEach(n => {
      if (n.status === 'Awaiting Co-sign') {
        notes.push({
          id: `cosign-${p.id}-${n.id}`, level: 'info',
          category: 'Co-sign Required', filterTag: 'documentation',
          title: `Co-sign Required — ${name}`,
          body: `${n.type} by ${n.author} dated ${n.date}. Pending clinical director review.`,
          time: '3 hr ago', responsible: 'Clinical Supervisor',
          screen: 'CosignQueue',
        });
      }
    });
  });

  // Authorization alerts
  notes.push({
    id: 'auth-1', level: 'warning',
    category: 'Auth Expiring', filterTag: 'authorization',
    title: 'Authorization Expiring — Marcus Webb',
    body: 'Aetna authorization expires in 2 days (07/29). UR review required immediately.',
    time: '4 hr ago', responsible: 'UR Coordinator',
    screen: 'InsuranceAuthorization',
  });
  notes.push({
    id: 'auth-2', level: 'warning',
    category: 'Auth Expiring', filterTag: 'authorization',
    title: 'Authorization Expiring — Donna Reyes',
    body: 'BlueCross authorization expires in 3 days (07/30). Contact UR coordinator.',
    time: '4 hr ago', responsible: 'UR Coordinator',
    screen: 'InsuranceAuthorization',
  });

  // Documentation alerts
  notes.push({
    id: 'chart-1', level: 'info',
    category: 'Chart Deficiency', filterTag: 'documentation',
    title: '3 Charts Overdue for Completion',
    body: 'Jordan Kim, Tyler Brooks, Gregory Mills have documentation deficiencies >48 hours.',
    time: '6 hr ago', responsible: 'Assigned Clinicians',
    screen: 'ChartReview',
  });
  notes.push({
    id: 'discharge-1', level: 'info',
    category: 'Discharge Planning', filterTag: 'documentation',
    title: 'Discharge Tomorrow — Sarah Okafor',
    body: 'Expected discharge 07/28. Discharge checklist is 80% complete. Aftercare plan needs signature.',
    time: '8 hr ago', responsible: 'Primary Counselor',
    screen: 'Discharges',
  });

  // Medication alert
  notes.push({
    id: 'med-1', level: 'warning',
    category: 'Medication', filterTag: 'medication',
    title: 'MAR Incomplete — Evening Medications',
    body: '3 patients have evening medications unrecorded. Nursing follow-up required before midnight.',
    time: '5 hr ago', responsible: 'Charge Nurse',
    screen: 'NursingMAR', requiresAck: false,
  });

  // Compliance alert
  notes.push({
    id: 'compliance-1', level: 'warning',
    category: 'Credential Expiry', filterTag: 'compliance',
    title: 'Credential Expiring — Sarah Jenkins',
    body: 'CAC-AD III expires in 22 days. Renewal documentation must be submitted to HR.',
    time: '1 day ago', responsible: 'HR / Staff',
    screen: 'WorkforceCompliance',
  });

  // Scheduling alert
  notes.push({
    id: 'sched-1', level: 'info',
    category: 'Scheduling', filterTag: 'scheduling',
    title: 'Group Session Facilitator Conflict',
    body: 'Thursday 2:00 PM CBT group has no assigned facilitator. Assign before 48 hrs prior.',
    time: '2 hr ago', responsible: 'Clinical Supervisor',
    screen: 'GroupSchedule',
  });

  // Billing alert
  notes.push({
    id: 'billing-1', level: 'warning',
    category: 'Claim Denial', filterTag: 'billing',
    title: '12 Claims Denied This Month',
    body: 'Blue Cross: medical necessity not established (6). Medicaid: missing prior auth (6). Appeals due within 30 days.',
    time: '3 hr ago', responsible: 'Billing Team',
    screen: 'RevenueCycle',
  });

  // Milestones (system)
  notes.push({
    id: 'success-1', level: 'success',
    category: 'Milestone', filterTag: 'system',
    title: 'Milestone — Aaron Fletcher',
    body: '30 days continuous abstinence achieved. Consider milestone recognition at group today.',
    time: '9 hr ago', screen: 'PatientDetail', patientId: 'p15',
  });
  notes.push({
    id: 'success-2', level: 'success',
    category: 'Milestone', filterTag: 'system',
    title: 'Discharge Outcome — Michelle Park',
    body: 'IOP completion with housing secured and sponsor confirmed. Excellent outcome.',
    time: '10 hr ago', screen: 'PatientDetail', patientId: 'p20',
  });

  return notes;
}

const ALL_NOTIFICATIONS = buildNotifications();

/** All stable notification IDs — exported so Topbar can derive the unread badge count */
export const ALL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS.map(n => n.id);

/** IDs of critical-clinical notifications — used to compute the topbar badge */
export const CRITICAL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS
  .filter(n => n.filterTag === 'critical-clinical')
  .map(n => n.id);

const LEVEL_CONFIG = {
  critical: { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-l-red-400',    iconColor: 'text-red-500',   badge: 'bg-red-100 text-red-700' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-l-amber-400',  iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  info:     { icon: Info,          bg: 'bg-blue-50',   border: 'border-l-blue-400',   iconColor: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  success:  { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-l-green-400',  iconColor: 'text-green-500', badge: 'bg-green-100 text-green-700' },
};

const CATEGORY_TABS: { id: NotifCategory | 'all'; label: string }[] = [
  { id: 'all',              label: 'All' },
  { id: 'critical-clinical',label: 'Clinical' },
  { id: 'documentation',    label: 'Docs' },
  { id: 'medication',       label: 'Meds' },
  { id: 'authorization',    label: 'Auth' },
  { id: 'billing',          label: 'Billing' },
  { id: 'compliance',       label: 'Compliance' },
  { id: 'scheduling',       label: 'Scheduling' },
  { id: 'system',           label: 'System' },
];

export function NotificationPanel({ onClose, navigate }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<NotifCategory | 'all'>('all');
  const [pendingAck, setPendingAck] = useState<string | null>(null);
  const { state, markRead, markAllRead, snoozeNotification } = useDemoStore();

  // Click-outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Notifications with read + snoozed state merged from store
  const notifications = useMemo(() => {
    return ALL_NOTIFICATIONS
      .filter(n => !state.notificationSnoozedIds.includes(n.id))
      .map(n => ({
        ...n,
        read: state.notificationReadIds.includes(n.id),
      }));
  }, [state.notificationReadIds, state.notificationSnoozedIds]);

  // Filtered list
  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.filterTag === filter);
  }, [notifications, filter]);

  const unreadTotal   = notifications.filter(n => !n.read).length;
  const unreadVisible = visible.filter(n => !n.read).length;

  const handleAction = (n: typeof notifications[0]) => {
    if (n.requiresAck && !n.read) {
      setPendingAck(n.id);
      return;
    }
    markRead(n.id);
    if (n.screen) { navigate(n.screen, n.patientId); onClose(); }
  };

  const handleAcknowledge = (id: string) => {
    const n = notifications.find(x => x.id === id);
    markRead(id);
    setPendingAck(null);
    if (n?.screen) { navigate(n.screen, n.patientId); onClose(); }
  };

  const handleSnooze = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    snoozeNotification(id);
  };

  // Group by severity within filtered set
  const bySeverity = (['critical', 'warning', 'info', 'success'] as const)
    .map(level => ({ level, items: visible.filter(n => n.level === level) }))
    .filter(g => g.items.length > 0);

  return (
    <>
      <div
        ref={panelRef}
        className="absolute top-full right-0 mt-2 w-[460px] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Header */}
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

        {/* Category filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map(tab => {
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

        {/* Mark all in category */}
        {filter !== 'all' && unreadVisible > 0 && (
          <div className="px-4 py-1.5 border-b border-border bg-gray-50/60 flex justify-end">
            <button
              onClick={() => markAllRead(visible.map(n => n.id))}
              className="flex items-center gap-1 text-[11px] text-slate hover:text-navy transition-colors"
            >
              <Check className="w-3 h-3" /> Mark all {CATEGORY_TABS.find(t => t.id === filter)?.label} as read
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="overflow-y-auto max-h-[480px]">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate">
              <BellOff className="w-8 h-8 text-gray-300" aria-hidden="true" />
              <div className="text-sm font-medium">No notifications</div>
              <div className="text-xs">
                {filter !== 'all' ? 'Try switching to "All"' : 'You\'re all caught up'}
              </div>
            </div>
          ) : (
            bySeverity.map(({ level, items }) => {
              const groupUnread = items.filter(n => !n.read).length;
              return (
                <div key={level}>
                  <div className="px-4 py-1.5 bg-gray-50 border-b border-border flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate uppercase tracking-wide">
                      {level === 'critical' ? '🔴 Critical'
                        : level === 'warning' ? '🟡 Warnings'
                        : level === 'info' ? '🔵 Information'
                        : '🟢 Successes'}
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

                  {items.map(n => {
                    const cfg = LEVEL_CONFIG[n.level];
                    const NIcon = cfg.icon;
                    const needsAck = n.requiresAck && !n.read;

                    return (
                      <div
                        key={n.id}
                        role="article"
                        aria-label={n.title}
                        onClick={() => handleAction(n)}
                        className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 ${
                          !n.read ? `bg-white ${cfg.border}` : 'bg-gray-50/40 border-l-transparent'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`} aria-hidden="true">
                            <NIcon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
                                  {n.category}
                                </span>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 bg-orange rounded-full shrink-0" aria-label="Unread" />
                                )}
                                {needsAck && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-600 text-white">ACK REQUIRED</span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate shrink-0 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                                {n.time}
                              </span>
                            </div>
                            <div className={`text-xs mt-1 font-semibold ${n.read ? 'text-slate' : 'text-navy'}`}>
                              {n.title}
                            </div>
                            <div className="text-[11px] text-slate mt-0.5 leading-relaxed line-clamp-2">
                              {n.body}
                            </div>
                            {n.responsible && (
                              <div className="text-[11px] text-slate/70 mt-0.5">
                                Responsible: {n.responsible}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {n.screen && (
                                <div className="flex items-center gap-1 text-[11px] text-orange font-medium">
                                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                  {n.screen === 'PatientDetail'
                                    ? 'Open Patient'
                                    : n.screen === 'InsuranceAuthorization'
                                      ? 'View Authorization'
                                      : n.screen === 'CosignQueue'
                                        ? 'Review Note'
                                        : n.screen === 'RevenueCycle'
                                          ? 'Open Claim'
                                          : `Go to ${n.screen.replace(/([A-Z])/g, ' $1').trim()}`}
                                </div>
                              )}
                              <button
                                onClick={e => handleSnooze(n.id, e)}
                                className="flex items-center gap-1 text-[11px] text-slate hover:text-navy transition-colors"
                                title="Snooze — removes from active list"
                                aria-label={`Snooze ${n.title}`}
                              >
                                <EyeOff className="w-3 h-3" aria-hidden="true" /> Snooze
                              </button>
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

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-gray-50 flex items-center justify-between">
          <span className="text-[11px] text-slate">
            {unreadVisible > 0 ? `${unreadVisible} unread` : 'All caught up'}
            {filter !== 'all' && ` · Filtered`}
          </span>
          <button
            onClick={() => { navigate('CommandCenter'); onClose(); }}
            className="text-xs text-orange font-medium hover:underline"
          >
            View All in Command Center
          </button>
        </div>
      </div>

      {/* Acknowledgment modal for critical-clinical items */}
      {pendingAck && (() => {
        const n = notifications.find(x => x.id === pendingAck);
        if (!n) return null;
        const cfg = LEVEL_CONFIG[n.level];
        const NIcon = cfg.icon;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
                <NIcon className={`w-5 h-5 ${cfg.iconColor} shrink-0`} aria-hidden="true" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-red-700">Acknowledgment Required</div>
                  <div className="text-sm font-semibold text-navy mt-0.5">{n.title}</div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate">{n.body}</p>
                <p className="text-xs text-slate mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This is a <strong>critical clinical alert</strong>. By acknowledging, you confirm you have read and are taking responsibility for follow-up.
                </p>
              </div>
              <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={() => setPendingAck(null)}
                  className="text-sm text-slate hover:text-navy px-4 py-2 rounded border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAcknowledge(pendingAck)}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Acknowledge &amp; Open Record
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
