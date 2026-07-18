import React from 'react';
import { Screen } from '@/App';
import { LayoutDashboard, Users, UserPlus, LogOut, FileText, ClipboardList, CheckSquare, BedDouble, UserCheck, AlertTriangle, Activity, Award, ShieldCheck, BookOpen, Settings, HelpCircle, X } from 'lucide-react';

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, isOpen, onClose }) => {
  const NavItem = ({ screen, icon: Icon, label, badge, amBadge }: { screen: Screen, icon: any, label: string, badge?: number, amBadge?: boolean }) => {
    const isActive = activeScreen === screen;
    return (
      <button 
        onClick={() => onNavigate(screen)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors border-l-4 ${
          isActive 
            ? 'bg-sunrise-orange/15 text-sunrise-amber border-sunrise-orange' 
            : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white/90'
        }`}
      >
        <Icon size={16} className={isActive ? 'text-sunrise-orange' : 'opacity-70'} />
        <span>{label}</span>
        {badge !== undefined && (
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-[1px] rounded-full text-white ${amBadge ? 'bg-moderate' : 'bg-critical'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 px-4 pt-4 pb-1.5">
      {label}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[750] md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-[100px] left-0 bottom-0 w-[240px] bg-navy-mid border-r border-white/5 z-[800] overflow-y-auto pb-6 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex md:hidden justify-end p-2">
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white/90">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel label="Overview" />
          <NavItem screen="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem screen="command-center" icon={Activity} label="Command Center" />

          <SectionLabel label="Clinical" />
          <NavItem screen="patient-list" icon={Users} label="Patient List" badge={24} />
          <NavItem screen="dashboard" icon={UserPlus} label="Admissions" />
          <NavItem screen="dashboard" icon={LogOut} label="Discharges" />

          <SectionLabel label="Documentation" />
          <NavItem screen="patient-detail" icon={FileText} label="Chart Review" />
          <NavItem screen="order-entry" icon={ClipboardList} label="Order Entry" badge={7} amBadge />
          <NavItem screen="dashboard" icon={CheckSquare} label="Co-sign Queue" badge={3} />

          <SectionLabel label="Operations" />
          <NavItem screen="bed-management" icon={BedDouble} label="Bed Management" />
          <NavItem screen="dashboard" icon={UserCheck} label="Staff Assignments" />
          <NavItem screen="dashboard" icon={AlertTriangle} label="Incident Reports" />

          <SectionLabel label="Analytics" />
          <NavItem screen="outcomes" icon={Award} label="Outcomes" />
          <NavItem screen="dashboard" icon={Activity} label="Quality Metrics" />

          <SectionLabel label="Compliance" />
          <NavItem screen="dashboard" icon={ShieldCheck} label="Audits" />
          <NavItem screen="dashboard" icon={BookOpen} label="Training" badge={2} />
        </div>

        <div className="mt-8 border-t border-white/5 pt-2">
          <NavItem screen="dashboard" icon={Settings} label="Settings" />
          <NavItem screen="dashboard" icon={HelpCircle} label="Help & Support" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
