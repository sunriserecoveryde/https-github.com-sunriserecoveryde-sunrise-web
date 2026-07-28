import React, { useState, useEffect, useRef } from 'react';
import sunriseLogo from '@assets/0_SunriseOS_Logo_transparent.png';
import { Bell, Search, Settings, MessageSquare, ChevronDown, Flag, LogOut, UserCircle, RotateCcw, ArrowLeftCircle } from 'lucide-react';
import { Screen } from '../../App';
import { NotificationPanel, ALL_NOTIFICATION_IDS } from './NotificationPanel';
import { CommandPalette } from './CommandPalette';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_CATEGORIES } from '../../data/mockRoles';
import { useDemoStore, resetDemoData } from '../../store/demoStore';

interface Props {
  navigate: (s: Screen, patientId?: string) => void;
  currentScreen: Screen;
}

export function Topbar({ navigate, currentScreen }: Props) {
  const [showNotif, setShowNotif] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifBtnRef = useRef<HTMLDivElement>(null);
  const rolePickerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { role, setRoleId } = useRole();
  const { currentStaff, logout } = useAuth();
  const { state: demoState } = useDemoStore();
  // Actual unread = all known notification IDs minus those already read
  const unreadCount = ALL_NOTIFICATION_IDS.filter(
    id => !demoState.notificationReadIds.includes(id),
  ).length;

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd(true);
        setShowNotif(false);
        setShowRolePicker(false);
      }
      if (e.key === 'Escape') {
        setShowNotif(false);
        setShowCmd(false);
        setShowRolePicker(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click-outside for role picker
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rolePickerRef.current && !rolePickerRef.current.contains(e.target as Node)) {
        setShowRolePicker(false);
      }
    };
    if (showRolePicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRolePicker]);

  // Click-outside for user menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const handleRoleSelect = (roleId: string) => {
    setRoleId(roleId);
    setShowRolePicker(false);
  };

  const avatarInitials = currentStaff
    ? currentStaff.photoInitials
    : 'OS';

  const avatarBg = currentStaff?.avatarBg ?? 'bg-sunrise-blue-light';

  const displayName = currentStaff
    ? `${currentStaff.firstName} ${currentStaff.lastName}`
    : 'Demo User';

  return (
    <>
      <div className="h-[var(--topbar-height)] bg-navy w-full fixed top-[var(--banner-height)] left-0 z-40 flex items-center justify-between px-4 shadow-md text-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={sunriseLogo} alt="Sunrise OS Logo" className="h-11 w-auto object-contain" />
            <span className="text-sm font-semibold tracking-wide text-slate-300">Sunrise OS</span>
          </div>

          <div className="hidden md:flex items-center gap-4 ml-8 border-l border-white/10 pl-6">
            <button onClick={() => navigate('Settings')} className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded transition-colors">
              <span className="text-sm font-medium">Sunrise Recovery Center</span>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </button>
            <button onClick={() => navigate('Settings')} className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded transition-colors">
              <span className="text-sm font-medium text-slate-300">Residential PHP IOP</span>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* ── Role Switcher ── */}
          <div className="relative mr-2" ref={rolePickerRef}>
            <button
              onClick={() => setShowRolePicker(p => !p)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded transition-colors border ${role.color} ${role.borderColor} hover:opacity-90`}
            >
              <div className={`w-2 h-2 rounded-full ${role.dotColor} shrink-0`} />
              <span className={`text-sm font-semibold ${role.textColor}`}>{role.shortLabel}</span>
              <ChevronDown className={`w-4 h-4 ${role.textColor} transition-transform ${showRolePicker ? 'rotate-180' : ''}`} />
            </button>

            {showRolePicker && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-navy border border-navy-light rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-light flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Switch Role</span>
                  <span className="text-[10px] text-slate-400">Demo — affects navigation &amp; access</span>
                </div>
                <div className="overflow-y-auto max-h-96 py-2">
                  {ROLE_CATEGORIES.map(cat => {
                    const catRoles = ROLES.filter(r => r.category === cat);
                    if (!catRoles.length) return null;
                    return (
                      <div key={cat} className="mb-1">
                        <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat}</div>
                        {catRoles.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleRoleSelect(r.id)}
                            className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${role.id === r.id ? 'bg-white/10' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${r.dotColor} mt-1.5 shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-semibold ${role.id === r.id ? r.textColor : 'text-white'}`}>{r.label}</div>
                              <div className="text-[10px] text-slate-400 leading-snug">{r.description}</div>
                            </div>
                            {role.id === r.id && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.color} ${r.textColor} border ${r.borderColor} shrink-0`}>Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-navy-light bg-navy">
                  <button
                    onClick={() => { navigate('RoleExplorer'); setShowRolePicker(false); }}
                    className="text-xs text-sunrise-amber hover:underline font-medium"
                  >
                    View full permission matrix →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search / Command Palette */}
          <button
            onClick={() => { setShowCmd(true); setShowNotif(false); setShowRolePicker(false); }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 transition-colors text-slate-300 text-xs mr-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-1 bg-white/20 rounded px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>

          {/* Flag Legend */}
          <button className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300 relative group">
            <Flag className="w-5 h-5" />
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-64 bg-white text-navy p-3 rounded shadow-xl border border-border z-50">
              <div className="font-semibold mb-2 text-sm border-b pb-1">Flag Legend</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-critical rounded-sm"/> Medical Alert</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sunrise-orange rounded-sm"/> Behavioral Concern</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sunrise-amber rounded-sm"/> Legal/Court</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sunrise-blue rounded-sm"/> Insurance/Financial</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-success rounded-sm"/> Success/Milestone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple rounded-sm"/> Psychiatric</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-navy-mid rounded-sm"/> AMA Risk</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal rounded-sm"/> Medication</div>
              </div>
            </div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifBtnRef}>
            <button
              onClick={() => { setShowNotif(prev => !prev); setShowCmd(false); setShowRolePicker(false); }}
              className={`p-2 hover:bg-white/10 rounded transition-colors relative ${showNotif ? 'bg-white/10' : ''}`}
            >
              <Bell className="w-5 h-5 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border border-navy flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <NotificationPanel onClose={() => setShowNotif(false)} navigate={navigate} />
            )}
          </div>

          {/* Messaging */}
          <button
            onClick={() => navigate('CommandCenter')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300"
            title="Go to Command Center"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('Settings')}
            className={`p-2 hover:bg-white/10 rounded transition-colors ${currentScreen === 'Settings' ? 'text-sunrise-amber' : 'text-slate-300'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* ── User Avatar & Menu ── */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(p => !p)}
              className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center font-bold text-sm border border-white/20 hover:ring-2 hover:ring-sunrise-amber/50 transition-all text-white`}
              title={displayName}
            >
              {avatarInitials}
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-navy border border-navy-light rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-navy-light">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center font-bold text-sm text-white shrink-0`}>
                      {avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                      {currentStaff && (
                        <div className="text-[10px] text-slate-400 truncate">{currentStaff.title}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { navigate('Settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    My Settings
                  </button>
                  <button
                    onClick={() => { navigate('RoleExplorer'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    Role Explorer
                  </button>
                </div>

                <div className="border-t border-navy-light py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ArrowLeftCircle className="w-4 h-4" />
                    Return to Profile Selection
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); setShowResetConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Demo Session
                  </button>
                </div>
                <div className="border-t border-navy-light py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showCmd && <CommandPalette onClose={() => setShowCmd(false)} navigate={navigate} />}

      {/* Reset Demo Session confirm dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-navy text-center mb-2">Reset Demo Session?</h2>
              <p className="text-sm text-slate text-center mb-5">
                This will clear all notification read states, clear audit history, and sign you out. Demo data will be restored to its default state.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowResetConfirm(false); resetDemoData(); logout(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow"
                >
                  Reset &amp; Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
