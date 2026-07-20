import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Shield, ChevronRight, Clock } from 'lucide-react';
import { STAFF_MEMBERS, StaffMember } from '../data/mockStaff';
import { getRoleById } from '../data/mockRoles';
import { useAuth } from '../context/AuthContext';
import sunriseLogo from '@assets/0_SunriseOS_Logo_1784397889924.png';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface StaffCardProps {
  staff: StaffMember;
  onSelect: (id: string) => void;
  loading: boolean;
}

function StaffCard({ staff, onSelect, loading }: StaffCardProps) {
  const role = getRoleById(staff.roleId);
  const credStr = staff.credentials.length ? `, ${staff.credentials.join(', ')}` : '';

  return (
    <motion.button
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => !loading && onSelect(staff.id)}
      className="relative bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-5 text-left hover:bg-white/15 transition-colors group focus:outline-none focus:ring-2 focus:ring-sunrise-amber/60"
    >
      {/* Status dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          staff.status === 'active' ? 'bg-green-400' :
          staff.status === 'on-leave' ? 'bg-amber-400' : 'bg-red-400'
        }`} />
      </div>

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full ${staff.avatarBg} flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md`}>
        {staff.photoInitials}
      </div>

      {/* Name + credentials */}
      <div className="font-bold text-white text-sm leading-snug">
        {staff.firstName} {staff.lastName}{credStr}
      </div>
      <div className="text-slate-300 text-xs mt-0.5 mb-2 leading-snug">{staff.title}</div>

      {/* Role badge */}
      {role && (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${role.color} ${role.textColor} ${role.borderColor}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} />
          {role.shortLabel}
        </div>
      )}

      {/* Department */}
      <div className="text-slate-400 text-[10px] mt-2">{staff.department}</div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </motion.button>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (staffId: string) => {
    setLoadingId(staffId);
    // Short artificial delay for realism
    setTimeout(() => login(staffId), 600);
  };

  const filtered = STAFF_MEMBERS.filter(s =>
    searchQuery === '' ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (getRoleById(s.roleId)?.label ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-navy flex flex-col" style={{
      background: 'linear-gradient(135deg, #0e1c30 0%, #152238 50%, #1a2840 100%)'
    }}>
      {/* Demo Mode Banner */}
      <div className="bg-purple-900/60 border-b border-purple-500/30 text-purple-200 text-xs text-center py-1.5 font-medium tracking-wide">
        DEMO MODE &nbsp;·&nbsp; Fictitious patient data only &nbsp;·&nbsp; Not for clinical use
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12">
        {/* Logo + branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="flex flex-col items-center gap-2 mb-1">
            <img src={sunriseLogo} alt="Sunrise OS" className="h-[60px] w-auto object-contain" />
            <span className="text-3xl font-extrabold text-white tracking-tight">Sunrise OS</span>
          </div>
          <div className="text-slate-300 text-sm">Sunrise Recovery Center</div>

          <div className="mt-6 text-center">
            <div className="text-xl font-semibold text-white">{getGreeting()}.</div>
            <div className="text-slate-300 text-sm mt-1">Select your profile to sign in.</div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-5xl mb-6"
        >
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunrise-amber/50 focus:border-sunrise-amber/50"
          />
        </motion.div>

        {/* Staff grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          <AnimatePresence>
            {filtered.map(staff => (
              <div key={staff.id} className="relative">
                <StaffCard
                  staff={staff}
                  onSelect={handleSelect}
                  loading={loadingId !== null}
                />
                {/* Loading overlay */}
                {loadingId === staff.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-navy/80 rounded-2xl flex flex-col items-center justify-center gap-2"
                  >
                    <Sun className="w-6 h-6 text-sunrise-amber animate-spin" />
                    <span className="text-white text-xs font-medium">Signing in…</span>
                  </motion.div>
                )}
              </div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-12 text-sm">
              No staff members match &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>HIPAA-compliant session management &nbsp;·&nbsp; All access logged</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>Sessions auto-expire after 8 hours of inactivity</span>
        </div>
        <div className="text-slate-600 text-[10px] mt-1">
          Sunrise OS v2.4 &nbsp;·&nbsp; Sunrise Recovery Center &nbsp;·&nbsp; Demo Environment
        </div>
      </div>
    </div>
  );
}
