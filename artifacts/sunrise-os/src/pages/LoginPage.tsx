/**
 * LoginPage.tsx — Sunrise OS Premium Login
 *
 * Split-screen layout:
 *   Left  (~42%): Brand panel — navy gradient, sunrise glow, benefits, tagline
 *   Right (~58%): Profile-selection card — scrollable, accessible, configurable
 *
 * Design spec: attached_assets/Pasted-Redesign-the-Sunrise-OS-profile-selection…txt
 * Accessibility: WCAG 2.2 AA — 4.5:1 contrast, keyboard nav, reduced-motion, 44 px tap targets
 */

import React, { useState, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronRight,
  Shield,
  Sun,
  UserPlus,
  Search,
  X,
  CheckCircle2,
  Sparkles,
  BarChart2,
  FileText,
  Info,
  Eye,
  EyeOff,
  Minus,
} from 'lucide-react';
import { STAFF_MEMBERS, StaffMember } from '../data/mockStaff';
import { getRoleById, RoleDefinition, getPermission, Permission } from '../data/mockRoles';
import { useAuth } from '../context/AuthContext';
import sunriseLogo from '@assets/0_SunriseOS_Logo_transparent.png';

// ─── Role Explorer screen groups ─────────────────────────────────────────────
interface ScreenGroup { label: string; screens: { id: string; label: string }[] }
const SCREEN_GROUPS: ScreenGroup[] = [
  { label: 'Overview & Command', screens: [
    { id: 'Dashboard', label: 'Dashboard' },
    { id: 'CommandCenter', label: 'Command Center' },
    { id: 'PatientList', label: 'Patient List' },
    { id: 'RiskDashboard', label: 'Risk Dashboard' },
    { id: 'HelpSupport', label: 'Help & Support' },
  ]},
  { label: 'Clinical Documentation', screens: [
    { id: 'PatientDetail', label: 'Patient Detail' },
    { id: 'ChartReview', label: 'Chart Review' },
    { id: 'ProgressNotes', label: 'Progress Notes' },
    { id: 'TreatmentPlans', label: 'Treatment Plans' },
    { id: 'BiopsychosocialAssessment', label: 'Biopsychosocial' },
    { id: 'ASAMAssessments', label: 'ASAM Assessment' },
    { id: 'DischargeSummary', label: 'Discharge Summary' },
    { id: 'CrisisAssessment', label: 'Crisis Assessment' },
    { id: 'CosignQueue', label: 'Co-sign Queue' },
    { id: 'MyCaseload', label: 'My Caseload' },
  ]},
  { label: 'Group & Therapy', screens: [
    { id: 'GroupNotes', label: 'Group Notes' },
    { id: 'GroupSchedule', label: 'Group Schedule' },
    { id: 'GroupTherapyCurriculum', label: 'Group Curriculum' },
    { id: 'TelehealthConsults', label: 'Telehealth' },
    { id: 'ClinicalSupervision', label: 'Clinical Supervision' },
  ]},
  { label: 'Admissions & Census', screens: [
    { id: 'CensusBedBoard', label: 'Census / Bed Board' },
    { id: 'Admissions', label: 'Admissions' },
    { id: 'Discharges', label: 'Discharges' },
    { id: 'WaitlistManager', label: 'Waitlist Manager' },
    { id: 'BedManagement', label: 'Bed Management' },
  ]},
  { label: 'Medical & Pharmacy', screens: [
    { id: 'MedicationManagement', label: 'Medication Management' },
    { id: 'MATManagement', label: 'MAT Management' },
    { id: 'PhysicianOrders', label: 'Physician Orders' },
    { id: 'UADrugTesting', label: 'UA Drug Testing' },
    { id: 'MedicalRecords', label: 'Medical Records' },
    { id: 'WithdrawalManagement', label: 'Withdrawal Mgmt' },
  ]},
  { label: 'Scheduling & Comms', screens: [
    { id: 'AppointmentCalendar', label: 'Appointment Calendar' },
    { id: 'Scheduling', label: 'Scheduling' },
    { id: 'SecureMessaging', label: 'Secure Messaging' },
    { id: 'FamilyEngagement', label: 'Family Engagement' },
    { id: 'AftercarePlanning', label: 'Aftercare Planning' },
    { id: 'PeerSupport', label: 'Peer Support' },
  ]},
  { label: 'Finance & Revenue', screens: [
    { id: 'RevenueCycle', label: 'Revenue Cycle' },
    { id: 'Billing', label: 'Billing' },
    { id: 'BusinessDevelopment', label: 'Business Development' },
    { id: 'ReferralTracker', label: 'Referral Tracker' },
  ]},
  { label: 'Workforce & Compliance', screens: [
    { id: 'StaffDirectory', label: 'Staff Directory' },
    { id: 'CertificationTracker', label: 'Certifications' },
    { id: 'IncidentReporting', label: 'Incident Reports' },
    { id: 'QualityAssurance', label: 'Quality Assurance' },
    { id: 'Training', label: 'Training' },
    { id: 'Settings', label: 'Settings' },
  ]},
  { label: 'Analytics & Intelligence', screens: [
    { id: 'Analytics', label: 'Analytics' },
    { id: 'OutcomeTracking', label: 'Outcome Tracking' },
    { id: 'RecoveryEngagementScore', label: 'Recovery Score' },
    { id: 'ClinicalIntelligence', label: 'Clinical Intelligence' },
    { id: 'HandoffReport', label: 'Handoff Report' },
  ]},
];

function PermBadge({ perm }: { perm: Permission }) {
  if (perm === 'full') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
      <Eye className="w-2.5 h-2.5" />Full
    </span>
  );
  if (perm === 'read') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
      <Eye className="w-2.5 h-2.5" />Read
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-200">
      <EyeOff className="w-2.5 h-2.5" />None
    </span>
  );
}

interface RoleExplorerPanelProps {
  staff: StaffMember;
  role: RoleDefinition | undefined;
  onClose: () => void;
}

function RoleExplorerPanel({ staff, role, onClose }: RoleExplorerPanelProps) {
  const fullCount = role
    ? SCREEN_GROUPS.flatMap(g => g.screens).filter(s => getPermission(role.id, s.id) === 'full').length
    : 0;
  const readCount = role
    ? SCREEN_GROUPS.flatMap(g => g.screens).filter(s => getPermission(role.id, s.id) === 'read').length
    : 0;

  return (
    <div
      className="absolute inset-y-0 right-0 flex flex-col rounded-r-[20px] overflow-hidden z-20"
      style={{
        width: '380px',
        background: 'rgba(8,22,37,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Panel header */}
      <div className="shrink-0 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role Explorer</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${staff.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {staff.photoInitials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white truncate">{staff.firstName} {staff.lastName}</div>
            <div className="text-[12px] text-slate-400 truncate">{staff.title}</div>
          </div>
        </div>
        {role && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${role.color} ${role.textColor} ${role.borderColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} />
              {role.label}
            </span>
            <span className="text-[10px] text-green-400">✓ {fullCount} full</span>
            <span className="text-[10px] text-blue-400">👁 {readCount} read</span>
          </div>
        )}
      </div>

      {/* Permission matrix */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {SCREEN_GROUPS.map(group => {
          const hasAny = role && group.screens.some(s => getPermission(role.id, s.id) !== 'none');
          return (
            <div key={group.label}>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
                style={{ color: hasAny ? '#F28C28' : 'rgba(255,255,255,0.25)' }}
              >
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {group.screens.map(screen => {
                  const perm = role ? getPermission(role.id, screen.id) : 'none';
                  return (
                    <div
                      key={screen.id}
                      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg ${
                        perm === 'full' ? 'bg-green-900/20' : perm === 'read' ? 'bg-blue-900/20' : 'opacity-40'
                      }`}
                    >
                      <span className="text-[11px] text-slate-300 truncate">{screen.label}</span>
                      <PermBadge perm={perm} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-[10px] text-slate-500">Permissions shown for demo role. Production access is managed by Security Admin.</p>
      </div>
    </div>
  );
}

// ─── Config (make this page reusable by externalising these values) ────────────

interface OrgConfig {
  facilityName: string;
  tagline: string;
  poweredBy: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  version: string;
  benefits: { icon: React.ReactNode; text: string }[];
  brandStatement: string;
}

const ORG: OrgConfig = {
  facilityName: 'Sunrise Recovery Center',
  tagline: 'The operating system built for behavioral healthcare.',
  poweredBy: 'Powered by Sunrise OS',
  supportEmail: 'support@sunriserecovery.com',
  privacyUrl: '#privacy',
  termsUrl: '#terms',
  version: 'v2.4',
  benefits: [
    { icon: <FileText className="w-4 h-4 shrink-0" aria-hidden />, text: 'Clinical documentation made simpler' },
    { icon: <Shield    className="w-4 h-4 shrink-0" aria-hidden />, text: 'Compliance and operations in one place' },
    { icon: <BarChart2 className="w-4 h-4 shrink-0" aria-hidden />, text: 'Better visibility into care, census, and outcomes' },
  ],
  brandStatement: 'Secure. Connected. Built for recovery organizations.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatLastLogin(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return 'Active recently';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return `${diffD} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProfileRowProps {
  staff: StaffMember;
  role: RoleDefinition | undefined;
  isSelected: boolean;
  isAnyLoading: boolean;
  onSelect: (id: string) => void;
  onExplore: (staff: StaffMember) => void;
  prefersReducedMotion: boolean;
}

function ProfileRow({ staff, role, isSelected, isAnyLoading, onSelect, onExplore, prefersReducedMotion }: ProfileRowProps) {
  const credStr = staff.credentials.length > 0
    ? staff.credentials.slice(0, 3).join(', ')
    : null;

  const lastLoginLabel = formatLastLogin(staff.lastLogin);
  const facilityShort = staff.facility.replace('Sunrise Recovery Center — ', '');

  return (
    <motion.button
      type="button"
      onClick={() => !isAnyLoading && onSelect(staff.id)}
      disabled={isAnyLoading}
      aria-label={`Sign in as ${staff.firstName} ${staff.lastName}, ${staff.title}${lastLoginLabel ? `, last active ${lastLoginLabel}` : ''}`}
      whileHover={prefersReducedMotion ? {} : { x: 2 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
      transition={{ duration: 0.15 }}
      style={{
        background: isSelected
          ? 'rgba(47,128,237,0.14)'
          : 'rgba(15,34,53,0.55)',
        borderColor: isSelected
          ? 'rgba(47,128,237,0.55)'
          : 'rgba(255,255,255,0.09)',
        outline: 'none',
      }}
      className={[
        'relative w-full flex items-center gap-4 px-4 rounded-xl border',
        'text-left transition-all focus-visible:ring-2 focus-visible:ring-[#2F80ED] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0f2235]',
        'hover:border-[rgba(47,128,237,0.35)] hover:bg-[rgba(47,128,237,0.08)]',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'min-h-[72px] py-3.5',
        isSelected ? 'border-[rgba(47,128,237,0.55)]' : '',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        className={`w-11 h-11 rounded-full ${staff.avatarBg} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md`}
        aria-hidden="true"
      >
        {staff.photoInitials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-semibold leading-tight truncate"
            style={{ color: '#F8FAFC', fontSize: '17px' }}
          >
            {staff.firstName} {staff.lastName}
          </span>
          {credStr && (
            <span
              className="hidden sm:inline text-[13px] font-normal shrink-0"
              style={{ color: '#B8C4D0' }}
            >
              {credStr}
            </span>
          )}
        </div>

        {/* Title */}
        <div
          className="text-[14px] leading-tight mt-0.5 truncate"
          style={{ color: '#B8C4D0' }}
        >
          {staff.title}
        </div>

        {/* Facility + role badge */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-[13px] shrink-0"
            style={{ color: '#8A9BAD' }}
          >
            {facilityShort}
          </span>
          {role && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${role.color} ${role.textColor} ${role.borderColor} shrink-0`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} aria-hidden />
              {role.shortLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right side: last login + explore + chevron */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
        {lastLoginLabel && (
          <span
            className="text-[12px] whitespace-nowrap hidden sm:block"
            style={{ color: '#8A9BAD' }}
          >
            {lastLoginLabel}
          </span>
        )}
        <div className="flex items-center gap-1">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Explore permissions for ${staff.firstName} ${staff.lastName}`}
            onClick={e => { e.stopPropagation(); onExplore(staff); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onExplore(staff); } }}
            className="p-1 rounded hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED] cursor-pointer"
            title="View role permissions"
          >
            <Info className="w-3.5 h-3.5" style={{ color: '#8A9BAD' }} aria-hidden />
          </div>
          {isSelected ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[#2F80ED]"
            >
              <Sun className="w-4 h-4 animate-spin" aria-hidden />
            </motion.div>
          ) : (
            <ChevronRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: '#8A9BAD' }}
              aria-hidden
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Left Brand Panel ─────────────────────────────────────────────────────────

function BrandPanel({ org }: { org: OrgConfig }) {
  return (
    <aside
      className="hidden lg:flex flex-col relative overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse 90% 55% at 15% 115%, rgba(242,140,40,0.22) 0%, transparent 65%)',
          'radial-gradient(ellipse 60% 40% at 5%  108%, rgba(255,179,71,0.10) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 30% at 30% 120%, rgba(242,140,40,0.08) 0%, transparent 50%)',
          'linear-gradient(160deg, #071522 0%, #0B1F33 55%, #091828 100%)',
        ].join(', '),
        width: '42%',
        minWidth: '320px',
        padding: '24px',
      }}
      aria-label="Sunrise OS brand panel"
    >
      {/* Decorative overlays (absolute — out of flex flow) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        }}
        aria-hidden
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-60px', left: '-40px',
          width: '360px', height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(242,140,40,0.28) 0%, rgba(242,140,40,0.08) 40%, transparent 70%)',
          filter: 'blur(24px)',
        }}
        aria-hidden
      />

      {/* ── Text — in DOM first so it can establish natural height; visually last via order ── */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          order: 2,
        }}
      >
        <h1
          className="font-bold leading-tight mb-6 w-full"
          style={{
            color: '#F8FAFC',
            fontSize: 'clamp(22px, 2vw, 34px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {org.tagline}
        </h1>

        <ul className="space-y-4 inline-flex flex-col items-start mb-6" role="list" aria-label="Platform benefits">
          {org.benefits.map((b, i) => (
            <li key={i} className="flex items-center gap-3" style={{ color: '#B8C4D0' }}>
              <div className="p-1.5 rounded-lg shrink-0" style={{ background: 'rgba(242,140,40,0.14)', color: '#F28C28' }}>
                {b.icon}
              </div>
              <span className="text-[15px] leading-snug text-left">{b.text}</span>
            </li>
          ))}
        </ul>

        <div className="w-full">
          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} aria-hidden />
          <p className="text-[14px] font-medium mb-1" style={{ color: '#8A9BAD' }}>{org.brandStatement}</p>
          <p className="text-[12px]" style={{ color: '#4A5A6B' }}>Sunrise OS {org.version} &nbsp;·&nbsp; Demo Environment</p>
        </div>
      </div>

      {/* ── Logo — grows to fill all space above the text (order: 1) ── */}
      <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', order: 1 }}>
        <img
          src={sunriseLogo}
          alt="Sunrise OS logo"
          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    </aside>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth();
  const [loadingId, setLoadingId]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [explorerStaff, setExplorerStaff] = useState<StaffMember | null>(null);
  const searchId = useId();
  const listId   = useId();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const handleSelect = (staffId: string) => {
    setLoadingId(staffId);
    setTimeout(() => login(staffId), prefersReducedMotion ? 0 : 680);
  };

  const filtered = STAFF_MEMBERS.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const role = getRoleById(s.roleId);
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      (role?.label ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: '#071522' }}
    >
      {/* Demo mode banner */}
      <div
        className="text-center py-1.5 text-xs font-medium tracking-wide shrink-0"
        style={{
          background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 50%, #c2410c 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.18)',
          color: '#ffffff',
        }}
        role="banner"
        aria-label="Demo environment notice"
      >
        ⚠ Demo Mode &nbsp;·&nbsp; Fictitious Data Only &nbsp;—&nbsp; Not for Clinical Use
      </div>

      {/* Split-screen body — locked to remaining viewport height, no outer scroll */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left brand panel ── */}
        <BrandPanel org={ORG} />

        {/* ── Right login area: 24 px (¼ in) padding on all sides, card fills the rest ── */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: 'rgba(7,21,34,0.95)', padding: '24px' }}
          aria-label="Profile selection"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4 shrink-0">
            <img
              src={sunriseLogo}
              alt="Sunrise OS"
              className="h-8 w-auto object-contain"
              style={{ filter: 'invert(1) hue-rotate(180deg) saturate(1.2)', mixBlendMode: 'screen' }}
            />
          </div>

          {/* Card — fills all remaining space in the right panel */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col min-h-0 w-full relative overflow-hidden"
            style={{
              background: 'rgba(15,34,53,0.88)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(16px)',
              padding: '32px',
            }}
          >
            {/* Role Explorer overlay panel */}
            <AnimatePresence>
              {explorerStaff && (
                <motion.div
                  className="absolute inset-0 z-20"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                >
                  <RoleExplorerPanel
                    staff={explorerStaff}
                    role={getRoleById(explorerStaff.roleId)}
                    onClose={() => setExplorerStaff(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card header */}
            <header className="mb-6 shrink-0">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <p
                    className="font-bold leading-tight"
                    style={{ color: '#F8FAFC', fontSize: '22px', letterSpacing: '-0.01em' }}
                  >
                    {ORG.facilityName}
                  </p>
                  <p
                    className="text-[13px] font-medium mt-0.5"
                    style={{ color: '#F28C28' }}
                  >
                    {ORG.poweredBy}
                  </p>
                </div>
                <Sparkles
                  className="w-5 h-5 mt-0.5 shrink-0"
                  style={{ color: 'rgba(242,140,40,0.50)' }}
                  aria-hidden
                />
              </div>

              <div
                className="h-px mb-5"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                aria-hidden
              />

              <h2
                className="font-bold"
                style={{ color: '#F8FAFC', fontSize: '28px', letterSpacing: '-0.015em', lineHeight: 1.15 }}
              >
                {getGreeting()}
              </h2>
              <p
                className="mt-1.5 text-[16px]"
                style={{ color: '#B8C4D0' }}
              >
                Choose your profile to continue securely.
              </p>
            </header>

            {/* Search */}
            <div className="relative mb-4 shrink-0">
              <label htmlFor={searchId} className="sr-only">Search profiles by name, role, or department</label>
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#8A9BAD' }}
                aria-hidden
              />
              <input
                id={searchId}
                type="search"
                placeholder="Search by name, role, or department…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[14px] placeholder:text-[#4A5A6B] focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#F8FAFC',
                  caretColor: '#F28C28',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(47,128,237,0.45)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                aria-controls={listId}
                aria-label="Search profiles"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" style={{ color: '#8A9BAD' }} aria-hidden />
                </button>
              )}
            </div>

            {/* Profile list — grows to fill all available card height */}
            <div
              id={listId}
              role="listbox"
              aria-label="Staff profiles"
              aria-live="polite"
              className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((staff, idx) => (
                  <motion.div
                    key={staff.id}
                    role="option"
                    aria-selected={loadingId === staff.id}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18, delay: idx * 0.04 }}
                  >
                    <ProfileRow
                      staff={staff}
                      role={getRoleById(staff.roleId)}
                      isSelected={loadingId === staff.id}
                      isAnyLoading={loadingId !== null}
                      onSelect={handleSelect}
                      onExplore={setExplorerStaff}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div
                  className="text-center py-8 text-[14px]"
                  style={{ color: '#8A9BAD' }}
                  role="status"
                >
                  No profiles match &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Footer — pinned to bottom of card */}
            <div className="shrink-0 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Use another account */}
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="flex items-center gap-2 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED] rounded px-1 mb-4"
                style={{ color: '#2F80ED' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#5B9EF5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#2F80ED'; }}
                aria-label="Show all profiles"
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden />
                Use another account
              </button>

              {/* Security badge */}
              <div
                className="flex items-center justify-center gap-1.5 rounded-lg py-2 mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                role="note"
                aria-label="Security information"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#4A9B6F' }} aria-hidden />
                <span className="text-[12px]" style={{ color: '#8A9BAD' }}>
                  Secure access &nbsp;·&nbsp; Session protected &nbsp;·&nbsp; Authorized users only
                </span>
              </div>

              {/* Footer links */}
              <nav
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
                aria-label="Account and legal links"
              >
                {[
                  { label: 'Forgot your password?', href: '#forgot' },
                  { label: 'Contact support', href: `mailto:${ORG.supportEmail}` },
                  { label: 'Privacy', href: ORG.privacyUrl },
                  { label: 'Terms', href: ORG.termsUrl },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED] rounded"
                    style={{ color: '#4A5A6B' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#B8C4D0'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#4A5A6B'; }}
                    onClick={e => e.preventDefault()}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Mobile brand statement */}
          <p
            className="lg:hidden mt-4 text-center text-[12px] shrink-0"
            style={{ color: '#4A5A6B' }}
          >
            {ORG.brandStatement}
          </p>
        </main>
      </div>
    </div>
  );
}
