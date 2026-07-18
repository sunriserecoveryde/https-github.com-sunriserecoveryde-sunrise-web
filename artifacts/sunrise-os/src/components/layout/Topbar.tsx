import React from 'react';
import sunriseLogo from '@assets/0_SunriseOS_Logo_1784397889924.png';
import { Bell, Search, Settings, MessageSquare, ChevronDown, Flag } from 'lucide-react';

export function Topbar() {
  return (
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

      <div className="flex items-center gap-3">
        <button className="hidden md:flex items-center gap-2 bg-sunrise-amber/20 text-sunrise-amber hover:bg-sunrise-amber/30 px-3 py-1.5 rounded transition-colors border border-sunrise-amber/30 mr-2">
          <span className="text-sm font-semibold">Clinical Director</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        <button className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300 relative group">
          <Flag className="w-5 h-5" />
          <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-64 bg-white text-navy p-3 rounded shadow-xl border border-border">
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
        <button className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border border-navy"></span>
        </button>
        <button className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300">
          <MessageSquare className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-sunrise-blue-light flex items-center justify-center font-bold text-sm ml-2 border border-white/20">
          JC
        </div>
      </div>
    </div>
  );
}
