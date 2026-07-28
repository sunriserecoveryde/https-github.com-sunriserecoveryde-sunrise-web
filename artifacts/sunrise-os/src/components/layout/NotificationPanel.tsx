import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, ExternalLink, BellOff, Check, CheckCheck } from 'lucide-react';
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
  filterTag: 'clinical' | 'auth' | 'documents' | 'milestones';
  title: string;
  body: string;
  time: string;
  patientId?: string;
  screen?: Screen;
}

// ── Build static notification list (no read state — that lives in demoStore) ────
function buildNotifications(): Notification[] {
  const notes: Notification[] = [];

  MOCK_PATIENTS.forEach(p => {
    const name = `${p.firstName} ${p.lastName}`;

    if (p.amaRisk === 'High') {
      notes.push({
        id: `ama-${p.id}`, level: 'critical', category: 'AMA Risk', filterTag: 'clinical',
        title: `AMA High Risk — ${name}`,
        body: `${p.program} | ${p.primaryDiagnosis.split(' ').slice(0, 4).join(' ')}. Immediate counselor check-in recommended.`,
        time: '8 min ago', patientId: p.id, screen: 'PatientDetail',
      });
    }

    if (p.lastUa && p.lastUa !== 'Negative' && p.lastUa !== 'Pending') {
      notes.push({
        id: `ua-${p.id}`, level: 'critical', category: 'Positive UA', filterTag: 'clinical',
        title: `Positive UA — ${name}`,
        body: `${p.lastUa}. Physician notification required. Treatment plan review recommended.`,
        time: '24 min ago', patientId: p.id, screen: 'PatientDetail',
      });
    }

    if (p.craving >= 7) {
      notes.push({
        id: `craving-${p.id}`, level: 'warning', category: 'Clinical Alert', filterTag: 'clinical',
        title: `High Craving Score — ${name}`,
        body: `Craving ${p.craving}/10. Mood ${p.mood}/10. ${p.program}. MAT adjustment may be indicated.`,
        time: '1 hr ago', patientId: p.id, screen: 'PatientDetail',
      });
    }

    if (p.mood <= 3) {
      notes.push({
        id: `mood-${p.id}`, level: 'warning', category: 'Mood Alert', filterTag: 'clinical',
        title: `Low Mood Score — ${name}`,
        body: `Mood self-report ${p.mood}/10. Safety screening recommended per policy.`,
        time: '2 hr ago', patientId: p.id, screen: 'PatientDetail',
      });
    }

    p.notes?.forEach(n => {
      if (n.status === 'Awaiting Co-sign') {
        notes.push({
          id: `cosign-${p.id}-${n.id}`, level: 'info', category: 'Co-sign Required', filterTag: 'documents',
          title: `Co-sign Required — ${name}`,
          body: `${n.type} by ${n.author} dated ${n.date}. Pending clinical director review.`,
          time: '3 hr ago', screen: 'CosignQueue',
        });
      }
    });
  });

  notes.push({
    id: 'auth-1', level: 'warning', category: 'Authorization', filterTag: 'auth',
    title: 'Authorization Expiring — Marcus Webb',
    body: 'Aetna authorization expires in 2 days (07/29). UR review required immediately.',
    time: '4 hr ago', screen: 'RevenueCycle',
  });
  notes.push({
    id: 'auth-2', level: 'warning', category: 'Authorization', filterTag: 'auth',
    title: 'Authorization Expiring — Donna Reyes',
    body: 'BlueCross authorization expires in 3 days (07/30). Contact UR coordinator.',
    time: '4 hr ago', screen: 'RevenueCycle',
  });
  notes.push({
    id: 'chart-1', level: 'info', category: 'Chart Deficiency', filterTag: 'documents',
    title: '3 Charts Overdue for Completion',
    body: 'Jordan Kim, Tyler Brooks, Gregory Mills have documentation deficiencies >48 hours.',
    time: '6 hr ago', screen: 'ChartReview',
  });
  notes.push({
    id: 'discharge-1', level: 'info', category: 'Discharge Planning', filterTag: 'documents',
    title: 'Discharge Tomorrow — Sarah Okafor',
    body: 'Expected discharge 07/28. Discharge checklist is 80% complete. Aftercare plan needs signature.',
    time: '8 hr ago', screen: 'Discharges',
  });
  notes.push({
    id: 'success-1', level: 'success', category: 'Milestone', filterTag: 'milestones',
    title: 'Milestone — Aaron Fletcher',
    body: '30 days continuous abstinence achieved. Consider milestone recognition at group today.',
    time: '9 hr ago', screen: 'PatientDetail', patientId: 'p15',
  });
  notes.push({
    id: 'success-2', level: 'success', category: 'Milestone', filterTag: 'milestones',
    title: 'Discharge Outcome — Michelle Park',
    body: 'IOP completion with housing secured and sponsor confirmed. Excellent outcome.',
    time: '10 hr ago', screen: 'PatientDetail', patientId: 'p20',
  });

  return notes;
}

const ALL_NOTIFICATIONS = buildNotifications();

/** All stable notification IDs — exported so Topbar can derive the unread badge count */
export const ALL_NOTIFICATION_IDS: string[] = ALL_NOTIFICATIONS.map(n => n.id);

const LEVEL_CONFIG = {
  critical: { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-l-red-400',    icon_color: 'text-red-500',   badge: 'bg-red-100 text-red-700' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-l-amber-400',  icon_color: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  info:     { icon: Info,          bg: 'bg-blue-50',   border: 'border-l-blue-400',   icon_color: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  success:  { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-l-green-400',  icon_color: 'text-green-500', badge: 'bg-green-100 text-green-700' },
};

type FilterTab = 'all' | 'clinical' | 'auth' | 'documents' | 'milestones';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'clinical',   label: 'Clinical' },
  { id: 'auth',       label: 'Auth' },
  { id: 'documents',  label: 'Docs' },
  { id: 'milestones', label: 'Milestones' },
];

export function NotificationPanel({ onClose, navigate }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const { state, markRead, markAllRead } = useDemoStore();

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

  // Notifications with read state merged from store
  const notifications = useMemo(() => {
    return ALL_NOTIFICATIONS.map(n => ({
      ...n,
      read: state.notificationReadIds.includes(n.id),
    }));
  }, [state.notificationReadIds]);

  // Filtered list
  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.filterTag === filter);
  }, [notifications, filter]);

  const unreadTotal  = notifications.filter(n => !n.read).length;
  const unreadVisible = visible.filter(n => !n.read).length;
  const allIds        = ALL_NOTIFICATIONS.map(n => n.id);

  const handleAction = (n: typeof notifications[0]) => {
    markRead(n.id);
    if (n.screen) {
      navigate(n.screen, n.patientId);
      onClose();
    }
  };

  // Group by severity for display (within filtered set)
  const bySeverity = (['critical', 'warning', 'info', 'success'] as const)
    .map(level => ({ level, items: visible.filter(n => n.level === level) }))
    .filter(g => g.items.length > 0);

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[440px] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-navy text-sm">Notifications</span>
          {unreadTotal > 0 && (
            <span className="text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
              {unreadTotal}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadTotal > 0 && (
            <button
              onClick={() => markAllRead(allIds)}
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
          >
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border bg-white overflow-x-auto">
        {FILTER_TABS.map(tab => {
          const tabUnread = tab.id === 'all'
            ? unreadTotal
            : notifications.filter(n => n.filterTag === tab.id && !n.read).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-navy text-white'
                  : 'text-slate hover:bg-gray-100 hover:text-navy'
              }`}
            >
              {tab.label}
              {tabUnread > 0 && (
                <span
                  className={`text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold ${
                    filter === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {tabUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto max-h-[480px]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate">
            <BellOff className="w-8 h-8 text-gray-300" />
            <div className="text-sm font-medium">No notifications</div>
            <div className="text-xs">
              {filter !== 'all' ? 'Try switching to "All"' : 'You\'re all caught up'}
            </div>
          </div>
        ) : (
          bySeverity.map(({ level, items }) => {
            const cfg = LEVEL_CONFIG[level];
            const groupUnread = items.filter(n => !n.read).length;
            return (
              <div key={level}>
                {/* Group header */}
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
                  const ncfg = LEVEL_CONFIG[n.level];
                  const NIcon = ncfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleAction(n)}
                      className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 ${
                        !n.read ? `bg-white ${ncfg.border}` : 'bg-gray-50/40 border-l-transparent'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ncfg.bg}`}>
                          <NIcon className={`w-3.5 h-3.5 ${ncfg.icon_color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${ncfg.badge}`}>
                                {n.category}
                              </span>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 bg-orange rounded-full shrink-0" title="Unread" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate shrink-0">{n.time}</span>
                          </div>
                          <div className={`text-xs mt-1 font-semibold ${n.read ? 'text-slate' : 'text-navy'}`}>
                            {n.title}
                          </div>
                          <div className="text-[11px] text-slate mt-0.5 leading-relaxed line-clamp-2">
                            {n.body}
                          </div>
                          {n.screen && (
                            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-orange font-medium">
                              <ExternalLink className="w-3 h-3" />
                              {n.screen === 'PatientDetail'
                                ? 'View Patient'
                                : `Go to ${n.screen.replace(/([A-Z])/g, ' $1').trim()}`}
                            </div>
                          )}
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
          View All Notifications
        </button>
      </div>
    </div>
  );
}
