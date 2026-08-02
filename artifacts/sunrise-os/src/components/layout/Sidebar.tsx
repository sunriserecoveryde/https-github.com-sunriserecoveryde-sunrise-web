import React, {
  useState, useEffect, useCallback, useRef,
} from "react";
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  FileText, ClipboardList, CheckSquare, ListTodo, Activity,
  CalendarDays, UsersRound, CalendarClock,
  AlertTriangle, TrendingUp, BarChart3,
  Network, Briefcase, FileWarning, Bed,
  Receipt, ShieldCheck, GraduationCap, FileBarChart,
  HelpCircle, Settings, Droplets, Siren, UserCog,
  Pill, Heart, Stethoscope, LineChart, Clipboard,
  ArrowLeftRight, Star, CreditCard, MapPin, BookUser, Download,
  Video, UserCheck, FolderOpen, DollarSign, BookOpen, HandHelping,
  Award, ClipboardCheck, MessageSquare, ListOrdered, Grid3X3,
  Eye, Sparkles, Brain, FlaskConical, Building2, FileSearch,
  ChevronRight, PanelLeftClose, PanelLeftOpen,
  Pin, PinOff, X, Clock,
} from "lucide-react";
import { Screen } from "../../App";
import { useRole } from "../../context/RoleContext";
import { useAuth } from "../../context/AuthContext";
import {
  useSidebarPrefs,
  MAX_PINNED_VISIBLE,
  RecentPatient,
  PinnedPatient,
} from "../../hooks/useSidebarPrefs";
import { getPatientById } from "../../data/mockPatients";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  currentScreen: Screen;
  navigate: (s: Screen, patientId?: string) => void;
  /** Set by App.tsx when navigating to PatientDetail — used to register recents. */
  currentPatientId?: string | null;
}

// ── Static nav data ───────────────────────────────────────────────────────────

interface SidebarItem {
  id: Screen;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarSection {
  key: string;
  title: string;
  items: SidebarItem[];
}

const ALL_SECTIONS: SidebarSection[] = [
  {
    key: "overview",
    title: "OVERVIEW",
    items: [
      { id: "Dashboard",     label: "Dashboard",      icon: LayoutDashboard },
      { id: "CommandCenter", label: "Command Center",  icon: Activity },
    ],
  },
  {
    key: "patient-care",
    title: "PATIENT CARE",
    items: [
      { id: "CensusBedBoard",    label: "Census & Bed Board",   icon: Bed },
      { id: "PatientList",       label: "Patient List",         icon: Users, badge: 18 },
      { id: "Admissions",        label: "Admissions / Intake",  icon: UserPlus },
      { id: "Discharges",        label: "Discharges",           icon: LogOut },
      { id: "MATManagement",     label: "MAT Management",       icon: Pill },
      { id: "FamilyEngagement",  label: "Family Engagement",    icon: Heart },
      { id: "PhysicianOrders",   label: "Physician Orders",     icon: Stethoscope },
      { id: "PeerSupport",       label: "Peer Support",         icon: HandHelping },
      { id: "TelehealthConsults",label: "Telehealth",           icon: Video },
      { id: "NursingMAR",        label: "Medication MAR",       icon: Clipboard },
      { id: "WithdrawalMonitor", label: "Withdrawal Monitor",   icon: Activity },
      { id: "ShiftHandoff",      label: "Shift Handoff",        icon: ArrowLeftRight },
      { id: "CrisisAssessment",  label: "Crisis Assessment",    icon: AlertTriangle },
      { id: "WaitlistManager",   label: "Waitlist Manager",     icon: ListOrdered },
      { id: "ReferralTracker",   label: "Referral Tracker",     icon: Network },
      { id: "BedManagement",     label: "Bed Management",       icon: Bed },
      { id: "AftercarePlanning", label: "Aftercare Planning",   icon: MapPin },
      { id: "AlumniProgram",     label: "Alumni Program",       icon: Heart },
    ],
  },
  {
    key: "documentation",
    title: "DOCUMENTATION",
    items: [
      { id: "ChartReview",              label: "Chart Review",             icon: FileText },
      { id: "ProgressNotes",            label: "Progress Notes",           icon: ClipboardList, badge: 5 },
      { id: "TreatmentPlans",           label: "Treatment Plans",          icon: CheckSquare,   badge: 3 },
      { id: "ASAMAssessments",          label: "ASAM Assessments",         icon: ListTodo },
      { id: "ClinicalForms",            label: "Admissions Screening",     icon: ClipboardCheck },
      { id: "BiopsychosocialAssessment",label: "Biopsychosocial Intake",   icon: ClipboardList },
      { id: "DischargeSummary",         label: "Discharge Summary",        icon: Download },
      { id: "MedicalRecords",           label: "Medical Records / ROI",    icon: FolderOpen },
      { id: "GroupNotes",               label: "Group Notes",              icon: UsersRound },
      { id: "GroupTherapyCurriculum",   label: "Group Curriculum Library", icon: BookOpen },
      { id: "CosignQueue",              label: "Co-sign Queue",            icon: FileWarning, badge: 4 },
      { id: "MyCaseload",               label: "My Caseload",              icon: BookUser },
    ],
  },
  {
    key: "operations",
    title: "OPERATIONS",
    items: [
      { id: "AppointmentCalendar", label: "Appointment Calendar", icon: CalendarDays },
      { id: "GroupSchedule",       label: "Group Schedule",       icon: CalendarClock },
      { id: "StaffScheduling",     label: "Staff Scheduling",     icon: UserCog },
      { id: "BusinessDevelopment", label: "Business Development", icon: Briefcase },
      { id: "SecureMessaging",     label: "Secure Messaging",     icon: MessageSquare, badge: 3 },
      { id: "UADrugTesting",       label: "UA / Drug Testing",    icon: Droplets },
      { id: "IncidentReporting",   label: "Incident Reports",     icon: Siren },
    ],
  },
  {
    key: "financial",
    title: "FINANCIAL",
    items: [
      { id: "RevenueCycle",           label: "Revenue Cycle",         icon: Receipt },
      { id: "FinancialCounseling",    label: "Financial Counseling",  icon: DollarSign },
      { id: "InsuranceAuthorization", label: "Insurance Auth / UR",   icon: CreditCard },
      { id: "AuditCompliance",        label: "Audit Readiness",       icon: ShieldCheck },
      { id: "ChartAuditTool",         label: "Chart Audit Tool",      icon: FileSearch },
      { id: "QualityImprovement",     label: "Quality Improvement",   icon: Star },
      { id: "FormularyManagement",    label: "Formulary & Drug Ref",  icon: ClipboardCheck },
    ],
  },
  {
    key: "intelligence",
    title: "INTELLIGENCE",
    items: [
      { id: "ClinicalIntelligence",    label: "Clinical Intelligence",     icon: Brain,          badge: 3 },
      { id: "RiskDashboard",           label: "Risk Dashboard",            icon: AlertTriangle },
      { id: "RecoveryEngagementScore", label: "Recovery Engagement Score", icon: TrendingUp },
      { id: "OutcomeTracking",         label: "Outcome Tracking",          icon: BarChart3 },
      { id: "MeasurementBasedCare",    label: "Measurement-Based Care",    icon: ClipboardCheck },
      { id: "PopulationAnalytics",     label: "Population Analytics",      icon: LineChart },
      { id: "AIAssistant",             label: "Sunrise AI",                icon: Sparkles },
      { id: "DAPNoteWorkflow",         label: "DAP Note Workflow",         icon: FlaskConical },
    ],
  },
  {
    key: "administration",
    title: "ADMINISTRATION",
    items: [
      { id: "StaffAdmin",           label: "Staff Administration",     icon: ShieldCheck },
      { id: "WorkforceCompliance",  label: "Workforce Compliance",     icon: Building2, badge: 4 },
      { id: "CertificationTracker", label: "Credentialing & Licenses", icon: Award },
      { id: "Training",             label: "Training & LMS",           icon: GraduationCap, badge: 2 },
      { id: "ClinicalSupervision",  label: "Clinical Supervision",     icon: UserCheck },
    ],
  },
];

// Flat map: screenId → section key — used for auto-expand on navigation.
const SCREEN_TO_SECTION: Record<string, string> = {};
for (const sec of ALL_SECTIONS) {
  for (const item of sec.items) {
    SCREEN_TO_SECTION[item.id] = sec.key;
  }
}

const DEFAULT_OPEN       = new Set(["overview"]);
const SESSION_OPEN_KEY   = "sunrise_sidebar_open_v1";
const SESSION_COMPACT_KEY = "sidebar_compact";

function getSectionForScreen(screen: Screen): string | null {
  return SCREEN_TO_SECTION[screen] ?? null;
}

function loadOpenKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_OPEN_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set(DEFAULT_OPEN);
}

function saveOpenKeys(keys: Set<string>): void {
  try { sessionStorage.setItem(SESSION_OPEN_KEY, JSON.stringify([...keys])); } catch { /* ignore */ }
}

function saveCompact(v: boolean): void {
  try { sessionStorage.setItem(SESSION_COMPACT_KEY, String(v)); } catch { /* ignore */ }
}

// ── Sidebar component ─────────────────────────────────────────────────────────

export function Sidebar({ currentScreen, navigate, currentPatientId }: SidebarProps) {
  const { canAccessScreen, getPermissionForScreen } = useRole();
  const { currentStaff } = useAuth();
  const staffId = currentStaff?.id ?? null;

  const {
    prefs,
    addRecent, removeRecent, clearRecent,
    pinPatient, unpinPatient,
    addFavorite, removeFavorite,
  } = useSidebarPrefs(staffId);

  // ── Sidebar open/collapse state ──────────────────────────────────────────
  const [openKeys, setOpenKeys] = useState<Set<string>>(loadOpenKeys);
  const [compact, setCompact]   = useState<boolean>(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_COMPACT_KEY) : null;
    return raw === "true";
  });

  // Compact-mode patient flyout: "recent" | "pinned" | null
  const [compactPanel, setCompactPanel] = useState<"recent" | "pinned" | null>(null);
  const compactRecentRef = useRef<HTMLButtonElement>(null);
  const compactPinnedRef = useRef<HTMLButtonElement>(null);

  // Accessible live-region for pin/favorite announcements
  const [liveMsg, setLiveMsg] = useState("");
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    setLiveMsg(msg);
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(() => setLiveMsg(""), 4_000);
  }, []);

  // ── CSS var ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.setProperty("--nav-width", compact ? "56px" : "240px");
  }, [compact]);

  // ── Auto-expand the group that contains the active screen ────────────────
  useEffect(() => {
    const key = getSectionForScreen(currentScreen);
    if (!key) return;
    setOpenKeys(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      saveOpenKeys(next);
      return next;
    });
  }, [currentScreen]);

  // ── Record a recent patient when PatientDetail is opened ─────────────────
  useEffect(() => {
    if (currentScreen !== "PatientDetail" || !currentPatientId || !staffId) return;
    const patient = getPatientById(currentPatientId);
    if (!patient) return;
    const entry: RecentPatient = {
      id:          patient.id,
      displayName: `${patient.firstName} ${patient.lastName}`,
      program:     patient.program,
      openedAt:    Date.now(),
    };
    addRecent(entry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, currentPatientId]);

  // ── Close compact flyout on outside click ────────────────────────────────
  useEffect(() => {
    if (!compactPanel) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        compactRecentRef.current?.contains(target) ||
        compactPinnedRef.current?.contains(target)
      ) return;
      const panel = document.getElementById("sidebar-compact-patient-panel");
      if (panel?.contains(target)) return;
      setCompactPanel(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [compactPanel]);

  const toggleSection = useCallback((key: string) => {
    setOpenKeys(prev => {
      const next = new Set(prev);
      const activeKey = getSectionForScreen(currentScreen);
      if (key === activeKey && prev.has(key)) return prev;
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      saveOpenKeys(next);
      return next;
    });
  }, [currentScreen]);

  const toggleCompact = useCallback(() => {
    setCompact(prev => {
      const next = !prev;
      saveCompact(next);
      if (next) setCompactPanel(null);
      return next;
    });
  }, []);

  // ── Role-filtered canonical sections ────────────────────────────────────
  const visibleSections = ALL_SECTIONS
    .map(sec => {
      const visibleItems = sec.items.filter(item => canAccessScreen(item.id));
      const allReadOnly  = visibleItems.length > 0 &&
        visibleItems.every(item => getPermissionForScreen(item.id) === "read");
      return { ...sec, items: visibleItems, allReadOnly };
    })
    .filter(sec => sec.items.length > 0);

  const isFooterActive =
    currentScreen === "Settings" ||
    currentScreen === "HelpSupport" ||
    currentScreen === "RoleExplorer";

  // ── Derived shortcut data (permission-filtered) ───────────────────────────

  // Favorite modules: only show those the user can still access
  const visibleFavorites = prefs.favoriteModules.filter(m => canAccessScreen(m));

  // Pinned patients: discharged patients stay (with label); permission-unaware
  // in this demo (no per-patient permission scope) — show all pinned.
  const visiblePinned  = prefs.pinnedPatients;
  const overflowPinned = visiblePinned.length > MAX_PINNED_VISIBLE;
  const shownPinned    = overflowPinned
    ? visiblePinned.slice(0, MAX_PINNED_VISIBLE)
    : visiblePinned;

  // For recent patients: indicate if a patient is also pinned
  const pinnedIds = new Set(prefs.pinnedPatients.map(p => p.id));

  // Lookup a module's label + icon from ALL_SECTIONS
  function getModuleMeta(id: Screen): { label: string; Icon: React.ElementType } | null {
    for (const sec of ALL_SECTIONS) {
      const item = sec.items.find(i => i.id === id);
      if (item) return { label: item.label, Icon: item.icon };
    }
    return null;
  }

  // Sections that appear before "patient-care" are rendered inline;
  // "overview" is the first entry in ALL_SECTIONS — after it we inject the
  // three dynamic sections, then continue with the remaining groups.
  const overviewSection   = visibleSections.find(s => s.key === "overview");
  const remainingSections = visibleSections.filter(s => s.key !== "overview");

  const hasFavorites = visibleFavorites.length > 0;
  const hasRecent    = prefs.recentPatients.length > 0;
  const hasPinned    = visiblePinned.length > 0;

  // Sub-sections open state (separate from canonical sections)
  const [favOpen,    setFavOpen]    = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(true);

  // ── Render helpers ────────────────────────────────────────────────────────

  /** Standard nav item (expanded mode) */
  function NavItem({ item }: { item: SidebarItem }) {
    const Icon      = item.icon;
    const isActive  = currentScreen === item.id;
    const perm      = getPermissionForScreen(item.id);
    const isReadOnly = perm === "read";
    const isFav     = prefs.favoriteModules.includes(item.id);

    return (
      <li>
        <div className={`group relative flex items-center border-r-2 transition-colors ${
          isActive
            ? "bg-sunrise-blue/20 border-sunrise-orange"
            : "border-transparent hover:bg-white/5"
        }`}>
          {/* Main nav button */}
          <button
            onClick={() => navigate(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex items-center justify-between px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
              isActive
                ? "text-white"
                : isReadOnly
                  ? "hover:text-slate-400 text-slate-600"
                  : "hover:text-white"
            }`}
            title={isReadOnly ? `${item.label} — View only` : item.label}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={`w-4 h-4 flex-none transition-colors ${
                isActive ? "text-sunrise-orange" : isReadOnly ? "text-slate-600 group-hover:text-slate-400" : "text-slate-400 group-hover:text-white"
              }`} />
              <span className={`truncate text-sm ${isActive ? "font-medium" : ""} ${isReadOnly ? "italic" : ""}`}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-none ml-1">
              {isReadOnly && (
                <Eye className={`w-3 h-3 flex-none ${isActive ? "text-white/60" : "text-slate-600 group-hover:text-slate-400"}`} />
              )}
              {item.badge ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-sunrise-orange text-white" : "bg-navy-light text-white"
                }`}>{item.badge}</span>
              ) : null}
            </div>
          </button>

          {/* Star / favorite toggle — visible on hover (not compact mode) */}
          <button
            onClick={() => {
              if (isFav) {
                removeFavorite(item.id);
                announce(`Removed ${item.label} from Favorites`);
              } else if (visibleFavorites.length < 6) {
                addFavorite(item.id);
                announce(`Added ${item.label} to Favorites`);
              }
            }}
            aria-label={isFav ? `Remove ${item.label} from Favorites` : `Add ${item.label} to Favorites`}
            aria-pressed={isFav}
            className={`flex-none p-1.5 mr-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange ${
              isFav
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-slate-600 hover:text-yellow-400"
            }`}
            tabIndex={0}
          >
            <Star className={`w-3 h-3 ${isFav ? "fill-current" : ""}`} />
            <span className="sr-only">{isFav ? "Favorited" : "Not favorited"}</span>
          </button>
        </div>
      </li>
    );
  }

  /** Standard nav item (compact mode) */
  function CompactNavItem({ item }: { item: SidebarItem }) {
    const Icon     = item.icon;
    const isActive = currentScreen === item.id;
    const perm     = getPermissionForScreen(item.id);
    const isReadOnly = perm === "read";

    return (
      <li>
        <button
          onClick={() => navigate(item.id)}
          title={isReadOnly ? `${item.label} — View only` : item.label}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          className={`relative group w-full flex items-center justify-center h-9 transition-colors ${
            isActive
              ? "bg-sunrise-blue/20 border-r-2 border-sunrise-orange"
              : "hover:bg-white/5 border-r-2 border-transparent"
          }`}
        >
          <Icon className={`w-4 h-4 flex-none ${
            isActive ? "text-sunrise-orange" : isReadOnly ? "text-slate-600" : "text-slate-400 group-hover:text-white"
          }`} />
          {item.badge ? (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] flex items-center justify-center rounded-full bg-sunrise-orange text-white font-bold">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </button>
      </li>
    );
  }

  /** Collapsible section header used by the three dynamic sections */
  function DynSectionHeader({
    id, label, isOpen, onToggle, onClear, clearLabel,
  }: {
    id: string;
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    onClear?: () => void;
    clearLabel?: string;
  }) {
    return (
      <div className="flex items-center">
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`dyn-section-${id}`}
          className="flex-1 px-4 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors"
        >
          {label}
          <ChevronRight className={`w-3 h-3 flex-none transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
        </button>
        {onClear && isOpen && (
          <button
            onClick={onClear}
            aria-label={clearLabel}
            title={clearLabel}
            className="px-2 py-1.5 text-slate-600 hover:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange rounded"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  /** Patient row used in both Recent and Pinned sections */
  function PatientRow({
    patient,
    isRecent,
    isPinnedAlso,
  }: {
    patient: RecentPatient | PinnedPatient;
    isRecent: boolean;
    isPinnedAlso?: boolean;
  }) {
    const isPinned       = "pinnedAt" in patient
      ? true
      : pinnedIds.has(patient.id);
    const isDischarge    = "discharged" in patient && (patient as PinnedPatient).discharged;
    const isActivePatient =
      currentScreen === "PatientDetail" && currentPatientId === patient.id;

    return (
      <li>
        <div className={`group relative flex items-center border-r-2 transition-colors ${
          isActivePatient
            ? "bg-sunrise-blue/20 border-sunrise-orange"
            : "border-transparent hover:bg-white/5"
        }`}>
          {/* Navigation button */}
          <button
            onClick={() => navigate("PatientDetail", patient.id)}
            className={`flex-1 min-w-0 flex items-center gap-2 px-4 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
              isActivePatient ? "text-white" : "text-slate-300 hover:text-white"
            }`}
            aria-current={isActivePatient ? "page" : undefined}
          >
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1 min-w-0">
                <span className="truncate text-sm font-medium leading-tight">{patient.displayName}</span>
                {isPinnedAlso && (
                  <Pin className="w-2.5 h-2.5 flex-none text-blue-400 fill-current" aria-label="Pinned" />
                )}
              </span>
              <span className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-slate-500 truncate">{patient.program}</span>
                {isDischarge && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 px-1 rounded">
                    Discharged
                  </span>
                )}
              </span>
            </span>
          </button>

          {/* Action buttons — visible on hover */}
          <div className="flex-none flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {/* Pin/unpin toggle */}
            {isPinned ? (
              <button
                onClick={() => {
                  unpinPatient(patient.id);
                  announce(`Unpinned ${patient.displayName}`);
                }}
                aria-label={`Unpin ${patient.displayName}`}
                className="p-1 rounded text-blue-400 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange"
              >
                <PinOff className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => {
                  pinPatient({
                    id: patient.id,
                    displayName: patient.displayName,
                    program: patient.program,
                    pinnedAt: Date.now(),
                  });
                  announce(`Pinned ${patient.displayName}`);
                }}
                aria-label={`Pin ${patient.displayName}`}
                className="p-1 rounded text-slate-600 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange"
              >
                <Pin className="w-3 h-3" />
              </button>
            )}

            {/* Remove from recent */}
            {isRecent && (
              <button
                onClick={() => {
                  removeRecent(patient.id);
                  announce(`Removed ${patient.displayName} from Recent Patients`);
                }}
                aria-label={`Remove ${patient.displayName} from Recent Patients`}
                className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </li>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  Compact-mode patient flyout panel
  // ─────────────────────────────────────────────────────────────────────────────

  const CompactPatientFlyout = compactPanel ? (
    <div
      id="sidebar-compact-patient-panel"
      role="dialog"
      aria-label={compactPanel === "recent" ? "Recent Patients" : "Pinned Patients"}
      className="fixed left-[56px] top-[calc(var(--banner-height)+var(--topbar-height))] z-[9000] w-56 bg-navy-mid border border-navy-light rounded-r-lg shadow-xl py-2"
    >
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-navy-light mb-1">
        {compactPanel === "recent" ? "Recent Patients" : "Pinned Patients"}
      </div>
      {compactPanel === "recent" && (
        <>
          {prefs.recentPatients.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500 italic">No recently opened patients</p>
          ) : (
            <ul>
              {prefs.recentPatients.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => { navigate("PatientDetail", p.id); setCompactPanel(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
                  >
                    <span className="block text-sm text-slate-200 truncate">{p.displayName}</span>
                    <span className="block text-[10px] text-slate-500">{p.program}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {compactPanel === "pinned" && (
        <>
          {visiblePinned.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500 italic">No pinned patients</p>
          ) : (
            <ul>
              {visiblePinned.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => { navigate("PatientDetail", p.id); setCompactPanel(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span className="block text-sm text-slate-200 truncate">{p.displayName}</span>
                      {p.discharged && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded flex-none">D</span>
                      )}
                    </div>
                    <span className="block text-[10px] text-slate-500">{p.program}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  //  Canonical section renderer (shared between overview and remaining groups)
  // ─────────────────────────────────────────────────────────────────────────────

  function renderSection(sec: (typeof visibleSections)[0]) {
    const isOpen    = openKeys.has(sec.key);
    const activeKey = getSectionForScreen(currentScreen);
    const hasActive = sec.key === activeKey;

    return (
      <div key={sec.key} className="mb-1">
        {compact ? (
          <div className="mx-2 my-2 border-t border-navy-light/60" aria-hidden="true" />
        ) : (
          <button
            onClick={() => toggleSection(sec.key)}
            className={`w-full px-4 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider transition-colors ${
              sec.allReadOnly ? "text-slate-600 hover:text-slate-500" : "text-slate-400 hover:text-slate-300"
            }`}
            aria-expanded={isOpen}
            aria-controls={`nav-section-${sec.key}`}
          >
            <span className="flex items-center gap-2">
              {sec.title}
              {sec.allReadOnly && (
                <span className="normal-case text-[9px] font-medium text-slate-600 tracking-normal">(View only)</span>
              )}
            </span>
            <ChevronRight
              className={`w-3 h-3 flex-none transition-transform duration-200 ${isOpen ? "rotate-90" : ""} ${hasActive && !isOpen ? "text-sunrise-orange" : ""}`}
            />
          </button>
        )}

        <ul
          id={`nav-section-${sec.key}`}
          className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
            compact || isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          {compact
            ? sec.items.map(item => <CompactNavItem key={item.id} item={item} />)
            : sec.items.map(item => <NavItem key={item.id} item={item} />)}
        </ul>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Accessible live-region for pin / favorite announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMsg}</div>

      <div
        className={`${compact ? "w-[56px]" : "w-[var(--nav-width)]"} bg-navy-mid h-[calc(100vh-var(--banner-height)-var(--topbar-height))] fixed left-0 top-[calc(var(--banner-height)+var(--topbar-height))] overflow-y-auto no-scrollbar border-r border-navy-light flex flex-col text-slate-300 transition-[width] duration-200`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ── Compact toggle ─────────────────────────────────────────────── */}
        <div className={`flex ${compact ? "justify-center" : "justify-end"} px-2 pt-3 pb-1`}>
          <button
            onClick={toggleCompact}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            title={compact  ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact
              ? <PanelLeftOpen  className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 pb-4">

          {/* ── 1. OVERVIEW (always first) ──────────────────────────────── */}
          {overviewSection && renderSection(overviewSection)}

          {/* ── 2. FAVORITES ───────────────────────────────────────────── */}
          {(hasFavorites || !compact) && (
            <div className="mb-1">
              {compact ? (
                <>
                  <div className="mx-2 my-2 border-t border-navy-light/60" aria-hidden="true" />
                  {/* In compact: show each favorite icon with tooltip */}
                  {visibleFavorites.map(id => {
                    const meta = getModuleMeta(id);
                    if (!meta) return null;
                    const { label, Icon } = meta;
                    const isActive = currentScreen === id;
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(id)}
                        title={`${label} (Favorite)`}
                        aria-label={`${label} — Favorite`}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative group w-full flex items-center justify-center h-9 transition-colors ${
                          isActive
                            ? "bg-sunrise-blue/20 border-r-2 border-sunrise-orange"
                            : "hover:bg-white/5 border-r-2 border-transparent"
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-none ${isActive ? "text-sunrise-orange" : "text-yellow-500 group-hover:text-yellow-300"}`} />
                        <Star className="absolute bottom-1 right-1 w-2 h-2 text-yellow-400 fill-current" aria-hidden="true" />
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <DynSectionHeader
                    id="favorites"
                    label="Favorites"
                    isOpen={favOpen}
                    onToggle={() => setFavOpen(v => !v)}
                  />
                  <ul
                    id="dyn-section-favorites"
                    className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                      favOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {visibleFavorites.length === 0 ? (
                      <li className="px-4 py-2 text-xs text-slate-500 italic">
                        No favorites yet — click ★ on any module
                      </li>
                    ) : (
                      visibleFavorites.map(id => {
                        const meta = getModuleMeta(id);
                        if (!meta) return null;
                        const { label, Icon } = meta;
                        const isActive = currentScreen === id;
                        return (
                          <li key={id}>
                            <div className={`group relative flex items-center border-r-2 transition-colors ${
                              isActive
                                ? "bg-sunrise-blue/20 border-sunrise-orange"
                                : "border-transparent hover:bg-white/5"
                            }`}>
                              <button
                                onClick={() => navigate(id)}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex-1 flex items-center gap-3 px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
                                  isActive ? "text-white font-medium" : "text-slate-300 hover:text-white"
                                }`}
                              >
                                <Icon className={`w-4 h-4 flex-none ${isActive ? "text-sunrise-orange" : "text-yellow-500"}`} />
                                <span className="truncate">{label}</span>
                                <Star className="w-3 h-3 text-yellow-400 fill-current flex-none ml-auto" aria-hidden="true" />
                              </button>
                              {/* Remove from favorites */}
                              <button
                                onClick={() => {
                                  removeFavorite(id);
                                  announce(`Removed ${label} from Favorites`);
                                }}
                                aria-label={`Remove ${label} from Favorites`}
                                className="flex-none p-1.5 mr-1 rounded text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* ── 3. RECENT PATIENTS ─────────────────────────────────────── */}
          {(hasRecent || !compact) && (
            <div className="mb-1">
              {compact ? (
                <>
                  <div className="mx-2 my-2 border-t border-navy-light/60" aria-hidden="true" />
                  <button
                    ref={compactRecentRef}
                    onClick={() => setCompactPanel(p => p === "recent" ? null : "recent")}
                    title={`Recent Patients (${prefs.recentPatients.length})`}
                    aria-label={`Recent Patients — ${prefs.recentPatients.length} patient${prefs.recentPatients.length !== 1 ? "s" : ""}`}
                    aria-expanded={compactPanel === "recent"}
                    className={`relative w-full flex items-center justify-center h-9 transition-colors hover:bg-white/5 border-r-2 border-transparent ${compactPanel === "recent" ? "bg-white/10" : ""}`}
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    {prefs.recentPatients.length > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] flex items-center justify-center rounded-full bg-slate-600 text-white font-bold">
                        {prefs.recentPatients.length}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <DynSectionHeader
                    id="recent"
                    label="Recent Patients"
                    isOpen={recentOpen}
                    onToggle={() => setRecentOpen(v => !v)}
                    onClear={hasRecent ? () => { clearRecent(); announce("Cleared Recent Patients"); } : undefined}
                    clearLabel="Clear Recent Patients"
                  />
                  <ul
                    id="dyn-section-recent"
                    className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                      recentOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {!hasRecent ? (
                      <li className="px-4 py-2 text-xs text-slate-500 italic">
                        No recently opened patients
                      </li>
                    ) : (
                      prefs.recentPatients.map(p => (
                        <PatientRow
                          key={p.id}
                          patient={p}
                          isRecent={true}
                          isPinnedAlso={pinnedIds.has(p.id)}
                        />
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* ── 4. PINNED PATIENTS ─────────────────────────────────────── */}
          {(hasPinned || !compact) && (
            <div className="mb-1">
              {compact ? (
                <>
                  <button
                    ref={compactPinnedRef}
                    onClick={() => setCompactPanel(p => p === "pinned" ? null : "pinned")}
                    title={`Pinned Patients (${visiblePinned.length})`}
                    aria-label={`Pinned Patients — ${visiblePinned.length} patient${visiblePinned.length !== 1 ? "s" : ""}`}
                    aria-expanded={compactPanel === "pinned"}
                    className={`relative w-full flex items-center justify-center h-9 transition-colors hover:bg-white/5 border-r-2 border-transparent ${compactPanel === "pinned" ? "bg-white/10" : ""}`}
                  >
                    <Pin className="w-4 h-4 text-slate-400" />
                    {visiblePinned.length > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                        {visiblePinned.length}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <DynSectionHeader
                    id="pinned"
                    label="Pinned Patients"
                    isOpen={pinnedOpen}
                    onToggle={() => setPinnedOpen(v => !v)}
                  />
                  <ul
                    id="dyn-section-pinned"
                    className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                      pinnedOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {!hasPinned ? (
                      <li className="px-4 py-2 text-xs text-slate-500 italic">
                        No pinned patients
                      </li>
                    ) : (
                      <>
                        {shownPinned.map(p => (
                          <PatientRow
                            key={p.id}
                            patient={p}
                            isRecent={false}
                          />
                        ))}
                        {overflowPinned && (
                          <li>
                            <button
                              onClick={() => navigate("PatientList")}
                              className="w-full px-4 py-1.5 text-xs text-sunrise-orange hover:text-orange-300 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange"
                            >
                              View All Pinned Patients →
                            </button>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* ── 5–10. Remaining canonical sections ─────────────────────── */}
          {remainingSections.map(sec => renderSection(sec))}
        </div>

        {/* ── Footer: Settings, Help, Role Explorer ──────────────────────── */}
        <div className={`border-t border-navy-light ${compact ? "py-2 space-y-1" : "p-4 space-y-1"}`}>
          {[
            canAccessScreen("Settings")    && { id: "Settings"    as Screen, label: "Settings",       icon: Settings    },
            canAccessScreen("HelpSupport") && { id: "HelpSupport" as Screen, label: "Help & Support",  icon: HelpCircle  },
                                              { id: "RoleExplorer" as Screen, label: "Role Explorer",   icon: Grid3X3     },
          ].filter(Boolean).map(item => {
            if (!item) return null;
            const Icon     = item.icon;
            const isActive = currentScreen === item.id;
            if (compact) {
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full flex justify-center items-center h-9 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
                    isActive ? "text-white" : "text-slate-500 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sunrise-orange" : ""}`} />
                </button>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset rounded-md ${
                  isActive ? "text-white" : "text-slate-500 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 flex-none ${isActive ? "text-sunrise-orange" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact patient flyout — rendered outside sidebar to avoid clipping */}
      {compact && CompactPatientFlyout}
    </>
  );
}
