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
 *
 * Overflow menu:
 *  - Rendered via ReactDOM.createPortal so it is never clipped by the panel's
 *    overflow-y:auto or max-height constraints.
 *  - Auto-flips above its trigger when insufficient space exists below.
 *  - Repositions on scroll (capture) and window resize.
 *  - Accessible: focus moves to first item on open; returns to trigger on close;
 *    Arrow keys navigate items; Escape closes.
 */

import React, {
  useEffect, useRef, useState, useMemo, useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import {
  X, ExternalLink, BellOff, Check, CheckCheck, Clock,
  MoreHorizontal, ShieldCheck, CheckCircle,
} from 'lucide-react';
import { Screen } from '../../App';
import { useDemoStore } from '../../store/demoStore';
import {
  ALL_NOTIFICATIONS, ALL_NOTIFICATION_IDS,
  LEVEL_CONFIG, CATEGORY_TABS, SNOOZE_OPTIONS,
  type NotifCategory,
} from '../../data/notificationData';
import { useActiveNotifications, type ActiveNotification } from '../../hooks/useActiveNotifications';

// Re-export so Topbar does not need a separate import path (backward compat)
export { ALL_NOTIFICATION_IDS } from '../../data/notificationData';
export { type NotifCategory } from '../../data/notificationData';

interface Props {
  onClose: () => void;
  navigate: (s: Screen, patientId?: string) => void;
}

// ── Portal overflow menu ───────────────────────────────────────────────────────

const MENU_WIDTH = 208; // w-52 = 13rem

interface MenuPos {
  openAbove: boolean;
  top?: number;
  bottom?: number;
  left: number;
}

function computeMenuPos(rect: DOMRect): MenuPos {
  const MENU_EST_H = 200; // conservative px estimate for flip decision
  const spaceBelow = window.innerHeight - rect.bottom;
  const openAbove   = spaceBelow < MENU_EST_H && rect.top > MENU_EST_H;
  const left = Math.min(
    Math.max(8, rect.right - MENU_WIDTH),
    window.innerWidth - MENU_WIDTH - 8,
  );
  if (openAbove) {
    return { openAbove: true, bottom: window.innerHeight - rect.top + 4, left };
  }
  return { openAbove: false, top: rect.bottom + 4, left };
}

interface OverflowMenuProps {
  notification: ActiveNotification;
  triggerEl: HTMLButtonElement;
  onClose: () => void;
  onSnooze: (id: string, ms: number) => void;
  onMarkRead: (id: string) => void;
  onResolve: (id: string) => void;
  onOpenAckModal: (id: string) => void;
}

function NotifOverflowMenu({
  notification: n,
  triggerEl,
  onClose,
  onSnooze,
  onMarkRead,
  onResolve,
  onOpenAckModal,
}: OverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MenuPos>(() =>
    computeMenuPos(triggerEl.getBoundingClientRect()),
  );

  // Focus first enabled menu item on mount
  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([disabled])',
    );
    first?.focus();
  }, []);

  // Return focus to the trigger button when the menu unmounts
  useEffect(() => () => { triggerEl.focus(); }, [triggerEl]);

  // Reposition on scroll (capture phase catches inner panel scroll too) + resize
  useEffect(() => {
    function reposition() {
      setPos(computeMenuPos(triggerEl.getBoundingClientRect()));
    }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [triggerEl]);

  // Click-outside: close unless click is on the trigger (handled by toggle)
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (triggerEl.contains(t)) return;
      onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [triggerEl, onClose]);

  // Arrow-key navigation + Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown'
      ? (idx + 1) % items.length
      : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  const needsAck   = !!(n.requiresAck && !n.acknowledged);
  const canResolve = !n.requiresAck || n.acknowledged;

  const style: React.CSSProperties = pos.openAbove
    ? { position: 'fixed', bottom: pos.bottom, left: pos.left, width: MENU_WIDTH, zIndex: 9999 }
    : { position: 'fixed', top: pos.top,    left: pos.left, width: MENU_WIDTH, zIndex: 9999 };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${n.title}`}
      style={style}
      className="bg-white border border-border rounded-xl shadow-xl overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {needsAck ? (
        <>
          <div className="px-3 py-2 text-[11px] text-slate bg-amber-50 border-b border-border">
            Acknowledge first to enable snooze and resolve.
          </div>
          <button
            role="menuitem"
            type="button"
            onClick={() => { onOpenAckModal(n.id); onClose(); }}
            className="w-full text-left text-xs px-3 py-2 text-navy font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:bg-gray-100"
          >
            <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
            Acknowledge
          </button>
          <div className="border-t border-border" />
        </>
      ) : (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate uppercase tracking-wider border-b border-border bg-gray-50">
            Snooze
          </div>
          {SNOOZE_OPTIONS.map(opt => (
            <button
              key={opt.label}
              role="menuitem"
              type="button"
              onClick={() => onSnooze(n.id, opt.ms())}
              className="w-full text-left text-xs px-3 py-2 text-slate hover:bg-gray-50 hover:text-navy transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:bg-gray-100"
            >
              <Clock className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              {opt.label}
            </button>
          ))}
          <div className="border-t border-border" />
        </>
      )}

      {!n.read && (
        <button
          role="menuitem"
          type="button"
          onClick={() => { onMarkRead(n.id); onClose(); }}
          className="w-full text-left text-xs px-3 py-2 text-slate hover:bg-gray-50 hover:text-navy transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:bg-gray-100"
        >
          <Check className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
          Mark as read
        </button>
      )}

      <button
        role="menuitem"
        type="button"
        disabled={!canResolve}
        onClick={() => { if (canResolve) { onResolve(n.id); onClose(); } }}
        className={`w-full text-left text-xs px-3 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:bg-gray-100 ${
          canResolve
            ? 'text-slate hover:bg-gray-50 hover:text-navy'
            : 'text-slate-300 cursor-not-allowed'
        }`}
      >
        <CheckCircle
          className={`w-3 h-3 shrink-0 ${canResolve ? 'text-green-500' : 'text-slate-300'}`}
          aria-hidden="true"
        />
        {canResolve ? 'Resolve' : 'Resolve (ack required)'}
      </button>
    </div>,
    document.body,
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationPanel({ onClose, navigate }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter]         = useState<NotifCategory | 'all'>('all');
  const [pendingAck, setPendingAck] = useState<string | null>(null);

  // Portal overflow state: which notification's menu is open + the trigger element
  const [overflowState, setOverflowState] = useState<{
    notifId: string;
    triggerEl: HTMLButtonElement;
  } | null>(null);

  // aria-live announcement when a snoozed notification reactivates
  const [liveMsg, setLiveMsg] = useState('');


  const {
    notifications,
    snoozedCount,
    resolvedCount,
    unreadTotal,
  } = useActiveNotifications();

  const {
    markRead, markAllRead,
    snoozeNotification,
    acknowledgeNotification,
    resolveNotification,
    addAuditEntry,
    state,
  } = useDemoStore();

  // ── Close overflow when panel closes ─────────────────────────────────────────
  // (Handled naturally: when NotificationPanel unmounts, overflowState cleanup
  //  in NotifOverflowMenu returns focus to trigger and removes listeners.)

  // Click-outside closes the panel (but not when clicking the overflow portal menu)
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t)) {
        // Don't close if click was inside a portal overflow menu
        const anyPortalMenu = document.querySelector('[role="menu"]');
        if (anyPortalMenu && anyPortalMenu.contains(t)) return;
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Escape: close overflow first, then panel
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (overflowState) { setOverflowState(null); return; }
      onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [overflowState, onClose]);

  // Announce when snoozed count drops (a snooze expired and notification reactivated)
  const prevSnoozedRef = useRef(snoozedCount);
  useEffect(() => {
    if (snoozedCount < prevSnoozedRef.current) {
      const diff = prevSnoozedRef.current - snoozedCount;
      setLiveMsg(`${diff} snoozed notification${diff > 1 ? 's' : ''} are now active again.`);
      const t = setTimeout(() => setLiveMsg(''), 4000);
      prevSnoozedRef.current = snoozedCount;
      return () => clearTimeout(t);
    }
    prevSnoozedRef.current = snoozedCount;
    return undefined;
  }, [snoozedCount]);

  // ── Filtered view ─────────────────────────────────────────────────────────

  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.filterTag === filter);
  }, [notifications, filter]);

  const unreadVisible = visible.filter(n => !n.read).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePrimaryAction = useCallback((n: ActiveNotification) => {
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
    const n = ALL_NOTIFICATIONS.find(x => x.id === id);
    if (n) {
      addAuditEntry({ staffName: 'Current User', action: 'Acknowledged', entity: 'Notification', detail: n.title });
    }
  }, [acknowledgeNotification, addAuditEntry]);

  /** Acknowledge + navigate (existing behaviour from modal primary button) */
  const handleAcknowledgeAndOpen = useCallback((id: string) => {
    const n = notifications.find(x => x.id === id);
    acknowledgeNotification(id);
    setPendingAck(null);
    addAuditEntry({
      staffName: 'Current User', action: 'Acknowledged', entity: 'Notification',
      detail: n?.title ?? id,
    });
    if (n?.screen) { navigate(n.screen, n.patientId); onClose(); }
  }, [notifications, acknowledgeNotification, addAuditEntry, navigate, onClose]);

  const handleResolve = useCallback((id: string) => {
    const n = ALL_NOTIFICATIONS.find(x => x.id === id);
    if (n?.requiresAck && !state.notificationAcknowledgedIds.includes(id)) return;
    resolveNotification(id);
    addAuditEntry({
      staffName: 'Current User', action: 'Resolved', entity: 'Notification',
      detail: n?.title ?? id,
    });
  }, [resolveNotification, addAuditEntry, state.notificationAcknowledgedIds]);

  const handleSnooze = useCallback((id: string, untilMs: number) => {
    snoozeNotification(id, untilMs);
  }, [snoozeNotification]);

  // Toggle overflow: open on a new notif, close if same notif clicked again
  const handleOverflowToggle = useCallback((
    e: React.MouseEvent<HTMLButtonElement>,
    notifId: string,
  ) => {
    e.stopPropagation();
    setOverflowState(prev =>
      prev?.notifId === notifId
        ? null
        : { notifId, triggerEl: e.currentTarget },
    );
  }, []);

  // ── Group by severity ─────────────────────────────────────────────────────

  const bySeverity = (['critical', 'warning', 'info', 'success'] as const)
    .map(level => ({ level, items: visible.filter(n => n.level === level) }))
    .filter(g => g.items.length > 0);

  // ── The notification whose overflow menu is open (if any) ─────────────────

  const overflowNotif = overflowState
    ? notifications.find(n => n.id === overflowState.notifId) ?? null
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Screen-reader live region for snooze expiry announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMsg}
      </div>

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
                {filter !== 'all' ? 'Try switching to "All"' : "You're all caught up"}
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

                              {/* ⋯ overflow trigger — no relative positioning; menu is portalled */}
                              <button
                                type="button"
                                onClick={e => handleOverflowToggle(e, n.id)}
                                aria-label={`More actions for ${n.title}`}
                                aria-expanded={overflowState?.notifId === n.id}
                                aria-haspopup="menu"
                                className="ml-auto p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
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

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 border-t border-border bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] text-slate">
            <span>
              {unreadVisible > 0 ? `${unreadVisible} unread` : 'All caught up'}
              {filter !== 'all' && ' · Filtered'}
            </span>
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

      {/* ── Portal overflow menu ─────────────────────────────────────────────── */}
      {overflowNotif && overflowState && (
        <NotifOverflowMenu
          key={overflowState.notifId}
          notification={overflowNotif}
          triggerEl={overflowState.triggerEl}
          onClose={() => setOverflowState(null)}
          onSnooze={(id, ms) => { handleSnooze(id, ms); setOverflowState(null); }}
          onMarkRead={(id) => { markRead(id); }}
          onResolve={(id) => { handleResolve(id); setOverflowState(null); }}
          onOpenAckModal={(id) => { setPendingAck(id); setOverflowState(null); }}
        />
      )}

      {/* ── Acknowledgment modal ─────────────────────────────────────────────── */}
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
                  read this alert and are taking responsibility for follow-up.{' '}
                  <strong>Acknowledgment does not resolve the alert.</strong>
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
                  <button
                    onClick={() => handleAcknowledgeOnly(pendingAck)}
                    className="flex items-center gap-2 text-sm font-medium text-navy border border-navy px-3 py-1.5 rounded hover:bg-navy/5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Acknowledge Only
                  </button>
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
