import React, { useState, useEffect, useRef } from 'react';
import sunriseLogo from '@assets/0_SunriseOS_Logo_1784397889924.png';
import { Bell, Search, Settings, MessageSquare, ChevronDown, Flag, X } from 'lucide-react';
import { Screen } from '../../App';
import { NotificationPanel } from './NotificationPanel';
import { CommandPalette } from './CommandPalette';
import { useRole } from '../../context/RoleContext';
import { ROLES, ROLE_CATEGORIES } from '../../data/mockRoles';

interface Props {
  navigate: (s: Screen, patientId?: string) => void;
  currentScreen: Screen;
}

const UNREAD_COUNT = 7;

export function Topbar({ navigate, currentScreen }: Props) {
  const [showNotif, setShowNotif] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const notifBtnRef = useRef<HTMLDivElement>(null);
  const rolePickerRef = useRef<HTMLDivElement>(null);
  const { role, setRoleId } = useRole();

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

  const handleRoleSelect = (roleId: string) => {
    setRoleId(roleId);
    setShowRolePicker(false);
  };

  return (
    <>
      <div className="h-[var(--topbar-height)] bg-navy w-full fixed top-[var(--banner-height)] left-0 z-40 flex items-center justify-between px-4 shadow-md text-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={sunriseLogo} alt="Sunrise OS Logo" className="h-8 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight">Sunrise OS</span>
          </div>

          <div className="hidden md:flex items-center gap-4 ml-8 border-l border-white/10 pl-6">
            <button className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded transition-colors">
              <span className="text-sm font-medium">Sunrise Recovery Center</span>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </button>
            <button className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded transition-colors">
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
                  <span className="text-[10px] text-slate-400">Demo — affects navigation & access</span>
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border border-navy"></span>
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

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-sunrise-blue-light flex items-center justify-center font-bold text-sm ml-2 border border-white/20 cursor-pointer hover:ring-2 hover:ring-sunrise-amber/50 transition-all">
            JC
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showCmd && <CommandPalette onClose={() => setShowCmd(false)} navigate={navigate} />}
    </>
  );
}
