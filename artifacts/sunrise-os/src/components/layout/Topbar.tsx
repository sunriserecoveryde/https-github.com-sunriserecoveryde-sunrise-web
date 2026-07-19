import React, { useState, useEffect, useRef } from 'react';
import sunriseLogo from '@assets/0_SunriseOS_Logo_1784397889924.png';
import { Bell, Search, Settings, MessageSquare, ChevronDown, Flag, X } from 'lucide-react';
import { Screen } from '../../App';
import { NotificationPanel } from './NotificationPanel';
import { CommandPalette } from './CommandPalette';

interface Props {
  navigate: (s: Screen, patientId?: string) => void;
  currentScreen: Screen;
}

// Derive unread count from same logic as NotificationPanel
const UNREAD_COUNT = 7;

export function Topbar({ navigate, currentScreen }: Props) {
  const [showNotif, setShowNotif] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const notifBtnRef = useRef<HTMLDivElement>(null);

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd(true);
        setShowNotif(false);
      }
      if (e.key === 'Escape') {
        setShowNotif(false);
        setShowCmd(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
          {/* Role badge */}
          <button className="hidden md:flex items-center gap-2 bg-sunrise-amber/20 text-sunrise-amber hover:bg-sunrise-amber/30 px-3 py-1.5 rounded transition-colors border border-sunrise-amber/30 mr-2">
            <span className="text-sm font-semibold">Clinical Director</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Search / Command Palette */}
          <button
            onClick={() => { setShowCmd(true); setShowNotif(false); }}
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
              onClick={() => { setShowNotif(prev => !prev); setShowCmd(false); }}
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

      {/* Command Palette (portal-style, rendered outside the fixed topbar) */}
      {showCmd && <CommandPalette onClose={() => setShowCmd(false)} navigate={navigate} />}
    </>
  );
}
