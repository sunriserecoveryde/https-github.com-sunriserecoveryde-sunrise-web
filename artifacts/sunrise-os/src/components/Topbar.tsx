import React, { useState } from 'react';
import { Search, Bell, MessageSquare, Settings, Menu, Sun, ChevronDown } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const [roleOpen, setRoleOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("Charge Nurse");

  const roles = [
    { name: "Clinical Coordinator", desc: "House-wide operations", dot: "bg-purple" },
    { name: "Attending Physician", desc: "Medical decision making", dot: "bg-critical" },
    { name: "Charge Nurse", desc: "Unit management", dot: "bg-routine" },
    { name: "Therapy Lead", desc: "Rehab services", dot: "bg-success" }
  ];

  return (
    <header className="fixed top-[36px] left-0 right-0 h-[64px] bg-navy flex items-center pr-4 z-[900] shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
      {/* Brand */}
      <div className="w-[240px] min-w-[240px] flex items-center px-4 border-r border-white/10 h-full shrink-0">
        <button className="md:hidden mr-3 text-white/70" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Sun className="text-sunrise-orange" size={28} />
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-[19px] font-extrabold tracking-tight text-sunrise-orange">Sunrise</span>
              <span className="text-[19px] font-extrabold tracking-tight text-sunrise-blue">OS</span>
            </div>
            <span className="text-[8px] text-white/30 tracking-[0.1em] uppercase -mt-1 font-bold">v6</span>
          </div>
        </div>
      </div>

      {/* Center Nav */}
      <div className="flex items-center gap-2 flex-1 min-w-0 px-4">
        <select className="bg-white/5 border border-white/15 text-white py-1.5 px-3 rounded-md text-xs outline-none cursor-pointer hidden md:block">
          <option className="bg-navy-mid">Metro General Hospital</option>
        </select>
        <select className="bg-white/5 border border-white/15 text-white py-1.5 px-3 rounded-md text-xs outline-none cursor-pointer hidden md:block">
          <option className="bg-navy-mid">3-North ICU</option>
        </select>
        <div className="relative flex-1 max-w-[260px] hidden sm:block">
          <Search className="absolute left-2.5 top-1.5 text-white/30" size={14} />
          <input 
            type="text" 
            placeholder="Search patients, orders..." 
            className="w-full bg-white/5 border border-white/15 text-white py-1.5 pr-3 pl-8 rounded-md text-xs outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Role Switcher */}
        <div className="relative mr-2">
          <button 
            onClick={() => setRoleOpen(!roleOpen)}
            className="flex items-center gap-2 bg-sunrise-orange/15 border border-sunrise-orange/40 text-sunrise-amber py-1.5 px-3 rounded-md text-xs font-bold transition-colors hover:bg-sunrise-orange/25"
          >
            <span className="text-sm">👤</span>
            <span className="hidden sm:inline">{activeRole}</span>
            <ChevronDown size={14} className="ml-1 opacity-70" />
          </button>

          {roleOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 bg-navy-mid border border-white/15 rounded-xl p-1.5 min-w-[260px] shadow-2xl z-[600] animate-in slide-in-from-top-2">
              <div className="text-[9px] font-extrabold text-white/30 uppercase px-3 pt-2 pb-1 tracking-wider">Select Role Perspective</div>
              {roles.map(r => (
                <button 
                  key={r.name}
                  onClick={() => { setActiveRole(r.name); setRoleOpen(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${activeRole === r.name ? 'bg-sunrise-orange/15' : 'hover:bg-white/10'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0`}></div>
                  <div className="flex flex-col">
                    <span className="text-white text-[12.5px] font-semibold">{r.name}</span>
                    <span className="text-white/40 text-[10.5px] mt-[1px]">{r.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/75 flex items-center justify-center relative hover:bg-white/10 transition-colors">
          <Bell size={15} />
          <div className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full border-[1.5px] border-navy"></div>
        </button>
        <button className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/75 flex items-center justify-center hover:bg-white/10 transition-colors hidden sm:flex">
          <MessageSquare size={15} />
        </button>
        <button className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/75 flex items-center justify-center hover:bg-white/10 transition-colors hidden sm:flex">
          <Settings size={15} />
        </button>
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-sunrise-orange to-sunrise-amber flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 ml-1">
          JC
        </button>
      </div>
    </header>
  );
};

export default Topbar;
