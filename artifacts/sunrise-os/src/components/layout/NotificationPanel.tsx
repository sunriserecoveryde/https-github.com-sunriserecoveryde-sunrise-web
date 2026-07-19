import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, ExternalLink } from 'lucide-react';
import { Screen } from '../../App';
import { MOCK_PATIENTS } from '../../data/mockPatients';

interface Props {
  onClose: () => void;
  navigate: (s: Screen, patientId?: string) => void;
}

interface Notification {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  title: string;
  body: string;
  time: string;
  patientId?: string;
  screen?: Screen;
  read: boolean;
}

// Derive real alerts from mock patient data
function buildNotifications(): Notification[] {
  const notes: Notification[] = [];

  MOCK_PATIENTS.forEach(p => {
    const name = `${p.firstName} ${p.lastName}`;

    // AMA High risk
    if (p.amaRisk === 'High') {
      notes.push({
        id: `ama-${p.id}`, level: 'critical', category: 'AMA Risk',
        title: `AMA High Risk — ${name}`,
        body: `${p.program} | ${p.primaryDiagnosis.split(' ').slice(0,4).join(' ')}. Immediate counselor check-in recommended.`,
        time: '8 min ago', patientId: p.id, screen: 'PatientDetail', read: false,
      });
    }

    // Positive UA
    if (p.lastUa && p.lastUa !== 'Negative' && p.lastUa !== 'Pending') {
      notes.push({
        id: `ua-${p.id}`, level: 'critical', category: 'Positive UA',
        title: `Positive UA — ${name}`,
        body: `${p.lastUa}. Physician notification required. Treatment plan review recommended.`,
        time: '24 min ago', patientId: p.id, screen: 'PatientDetail', read: false,
      });
    }

    // High craving
    if (p.craving >= 7) {
      notes.push({
        id: `craving-${p.id}`, level: 'warning', category: 'Clinical Alert',
        title: `High Craving Score — ${name}`,
        body: `Craving ${p.craving}/10. Mood ${p.mood}/10. ${p.program}. MAT adjustment may be indicated.`,
        time: '1 hr ago', patientId: p.id, screen: 'PatientDetail', read: p.craving < 8,
      });
    }

    // Low mood
    if (p.mood <= 3) {
      notes.push({
        id: `mood-${p.id}`, level: 'warning', category: 'Mood Alert',
        title: `Low Mood Score — ${name}`,
        body: `Mood self-report ${p.mood}/10. Safety screening recommended per policy.`,
        time: '2 hr ago', patientId: p.id, screen: 'PatientDetail', read: false,
      });
    }

    // Awaiting co-sign notes
    p.notes?.forEach(n => {
      if (n.status === 'Awaiting Co-sign') {
        notes.push({
          id: `cosign-${p.id}-${n.id}`, level: 'info', category: 'Co-sign Required',
          title: `Co-sign Required — ${name}`,
          body: `${n.type} by ${n.author} dated ${n.date}. Pending clinical director review.`,
          time: '3 hr ago', screen: 'CosignQueue', read: false,
        });
      }
    });
  });

  // Static operational alerts
  notes.push({
    id: 'auth-1', level: 'warning', category: 'Authorization',
    title: 'Authorization Expiring — Marcus Webb',
    body: 'Aetna authorization expires in 2 days (07/21). UR review required immediately.',
    time: '4 hr ago', screen: 'RevenueCycle', read: false,
  });
  notes.push({
    id: 'auth-2', level: 'warning', category: 'Authorization',
    title: 'Authorization Expiring — Donna Reyes',
    body: 'BlueCross authorization expires in 3 days (07/22). Contact UR coordinator.',
    time: '4 hr ago', screen: 'RevenueCycle', read: false,
  });
  notes.push({
    id: 'chart-1', level: 'info', category: 'Chart Deficiency',
    title: '3 Charts Overdue for Completion',
    body: 'Jordan Kim, Tyler Brooks, Gregory Mills have documentation deficiencies >48 hours.',
    time: '6 hr ago', screen: 'ChartReview', read: true,
  });
  notes.push({
    id: 'discharge-1', level: 'info', category: 'Discharge Planning',
    title: 'Discharge Tomorrow — Sarah Okafor',
    body: 'Expected discharge 07/20. Discharge checklist is 80% complete. Aftercare plan needs signature.',
    time: '8 hr ago', screen: 'Discharges', read: true,
  });
  notes.push({
    id: 'success-1', level: 'success', category: 'Milestone',
    title: 'Milestone — Aaron Fletcher',
    body: '30 days continuous abstinence achieved. Consider milestone recognition at group today.',
    time: '9 hr ago', screen: 'PatientDetail', patientId: 'p15', read: true,
  });
  notes.push({
    id: 'success-2', level: 'success', category: 'Milestone',
    title: 'Discharge Outcome — Michelle Park',
    body: 'IOP completion with housing secured and sponsor confirmed. Excellent outcome.',
    time: '10 hr ago', screen: 'PatientDetail', patientId: 'p20', read: true,
  });

  return notes;
}

const LEVEL_CONFIG = {
  critical: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', icon_color: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', icon_color: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  info:     { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', icon_color: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  success:  { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', icon_color: 'text-green-500', badge: 'bg-green-100 text-green-700' },
};

export function NotificationPanel({ onClose, navigate }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const notifications = buildNotifications();
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleAction = (n: Notification) => {
    if (n.screen) {
      navigate(n.screen, n.patientId);
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-navy text-sm">Notifications</span>
          {unread > 0 && (
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-orange hover:underline">Mark all read</button>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[520px]">
        {['critical', 'warning', 'info', 'success'].map(level => {
          const items = notifications.filter(n => n.level === level);
          if (items.length === 0) return null;
          const cfg = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
          const Icon = cfg.icon;
          return (
            <div key={level}>
              <div className="px-4 py-2 bg-gray-50 border-b border-border">
                <span className="text-xs font-semibold text-slate uppercase tracking-wide">
                  {level === 'critical' ? '🔴 Critical' : level === 'warning' ? '🟡 Warnings' : level === 'info' ? '🔵 Information' : '🟢 Successes'}
                  <span className="ml-2 text-slate font-normal">({items.length})</span>
                </span>
              </div>
              {items.map(n => {
                const NIcon = LEVEL_CONFIG[n.level as keyof typeof LEVEL_CONFIG].icon;
                const ncfg = LEVEL_CONFIG[n.level as keyof typeof LEVEL_CONFIG];
                return (
                  <div
                    key={n.id}
                    onClick={() => handleAction(n)}
                    className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ncfg.bg}`}>
                        <NIcon className={`w-3.5 h-3.5 ${ncfg.icon_color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ncfg.badge}`}>{n.category}</span>
                            {!n.read && <span className="w-1.5 h-1.5 bg-orange rounded-full shrink-0" />}
                          </div>
                          <span className="text-xs text-slate shrink-0">{n.time}</span>
                        </div>
                        <div className="font-semibold text-navy text-xs mt-1">{n.title}</div>
                        <div className="text-xs text-slate mt-0.5 leading-relaxed">{n.body}</div>
                        {n.screen && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-orange font-medium">
                            <ExternalLink className="w-3 h-3" />
                            {n.screen === 'PatientDetail' ? 'View Patient' : `Go to ${n.screen.replace(/([A-Z])/g, ' $1').trim()}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border bg-gray-50 text-center">
        <button className="text-sm text-orange font-medium hover:underline">View All Notifications</button>
      </div>
    </div>
  );
}
