import React, { useState, useMemo } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { OccupancyRing } from '../components/ui/OccupancyRing';
import {
  AlertTriangle, Clock, ChevronRight, UserPlus, FileText, Droplets, DollarSign,
  TrendingUp, BarChart3, Users, CalendarDays, Download, StickyNote, CheckCircle,
  ShieldAlert, Filter, X, Send, Zap,
} from 'lucide-react';
import { Screen } from '../App';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useRole } from '../context/RoleContext';
import { useDemoStore } from '../store/demoStore';
import { useCCStore } from '../store/commandCenterStore';
import { DrillDownModal, DrillDownColumn } from '../components/common/DrillDownModal';

const DEMO_BOOKING_URL =
  import.meta.env.VITE_DEMO_BOOKING_URL ||
  'mailto:demo@sunrisehealth.com?subject=Schedule%20a%20Live%20Demo';

// ── Chart data ────────────────────────────────────────────────────────────────
const CENSUS_TREND = [
  { date: 'Jun 19', census: 16, capacity: 22 },
  { date: 'Jun 22', census: 17, capacity: 22 },
  { date: 'Jun 24', census: 19, capacity: 22 },
  { date: 'Jun 27', census: 18, capacity: 22 },
  { date: 'Jun 29', census: 20, capacity: 22 },
  { date: 'Jul 1',  census: 21, capacity: 22 },
  { date: 'Jul 3',  census: 20, capacity: 22 },
  { date: 'Jul 6',  census: 19, capacity: 22 },
  { date: 'Jul 8',  census: 20, capacity: 22 },
  { date: 'Jul 10', census: 21, capacity: 22 },
  { date: 'Jul 12', census: 20, capacity: 22 },
  { date: 'Jul 14', census: 19, capacity: 22 },
  { date: 'Jul 16', census: 21, capacity: 22 },
  { date: 'Jul 18', census: 20, capacity: 22 },
  { date: 'Jul 19', census: 18, capacity: 22 },
  { date: 'Jul 22', census: 20, capacity: 22 },
];
const ADMISSIONS_TREND = [
  { week: 'W1 Jun', admissions: 4, discharges: 3 },
  { week: 'W2 Jun', admissions: 5, discharges: 4 },
  { week: 'W3 Jun', admissions: 3, discharges: 2 },
  { week: 'W4 Jun', admissions: 6, discharges: 5 },
  { week: 'W1 Jul', admissions: 4, discharges: 4 },
  { week: 'W2 Jul', admissions: 5, discharges: 3 },
  { week: 'W3 Jul', admissions: 2, discharges: 3 },
  { week: 'W4 Jul', admissions: 2, discharges: 1 },
];
const REVENUE_TREND = [
  { month: 'Jan', collected: 420, billed: 510 },
  { month: 'Feb', collected: 390, billed: 480 },
  { month: 'Mar', collected: 460, billed: 530 },
  { month: 'Apr', collected: 490, billed: 560 },
  { month: 'May', collected: 510, billed: 590 },
  { month: 'Jun', collected: 530, billed: 615 },
  { month: 'Jul', collected: 310, billed: 380 },
];

// ── Drill-down row data ───────────────────────────────────────────────────────
const DRILL_CENSUS_ROWS = MOCK_PATIENTS.filter(p => !p.id.startsWith('demo')).map(p => ({
  name: `${p.firstName} ${p.lastName}`, mrn: p.mrn, program: p.program,
  los: `${p.los}d`, counselor: p.counselor, bed: p.bed ?? '—', status: p.status ?? 'Occupied',
}));

const DRILL_AMA_ROWS = MOCK_PATIENTS.filter(p => p.amaRisk === 'High' && !p.id.startsWith('demo')).map(p => ({
  name: `${p.firstName} ${p.lastName}`, mrn: p.mrn, program: p.program,
  riskLevel: p.amaRisk, counselor: p.counselor, craving: `${p.craving}/10`, mood: `${p.mood}/10`,
  action: 'Counselor 1:1 required',
}));

const DRILL_COSIGNS_ROWS = [
  { counselor: 'Sarah Jenkins, LCPC', patient: 'Marcus Webb', noteType: 'Individual Progress', date: 'Jul 21', pending: '28h', priority: 'High' },
  { counselor: 'David Odom, LCADC', patient: 'Samantha Choi', noteType: 'Group Therapy', date: 'Jul 21', pending: '22h', priority: 'High' },
  { counselor: 'Maria Gonzales, LCADC', patient: 'James Thornton', noteType: 'Treatment Plan Update', date: 'Jul 20', pending: '48h', priority: 'Critical' },
  { counselor: 'David Odom, LCADC', patient: 'Robert Navarro', noteType: 'Family Session', date: 'Jul 22', pending: '4h', priority: 'Normal' },
];

const DRILL_LOS_ROWS = MOCK_PATIENTS.filter(p => !p.id.startsWith('demo')).map(p => ({
  name: `${p.firstName} ${p.lastName}`, mrn: p.mrn, program: p.program,
  los: p.los, admitDate: p.admitDate, expectedDischarge: p.expectedDischarge,
  counselor: p.counselor, insurance: p.insurance,
}));

const DRILL_DISCHARGES_ROWS = [
  { name: 'Ashley Monroe', mrn: 'MRN-49201', program: 'PHP', dischargeDate: 'Jul 22', disposition: 'Step Down to IOP', insurance: 'Cigna', counselor: 'David Odom' },
  { name: 'Carlos Reyes', mrn: 'MRN-30489', program: 'Residential', dischargeDate: 'Jul 21', disposition: 'Home with Aftercare', insurance: 'BlueCross', counselor: 'Maria Gonzales' },
  { name: 'Tanya Osei', mrn: 'MRN-77301', program: 'IOP', dischargeDate: 'Jul 20', disposition: 'Completion — Alumni', insurance: 'Aetna', counselor: 'Sarah Jenkins' },
];

const DRILL_REVENUE_ROWS = [
  { payer: 'BlueCross BlueShield', billed: '$82K', collected: '$71K', rate: '86.6%', claims: 18, denials: 2 },
  { payer: 'Aetna', billed: '$64K', collected: '$57K', rate: '89.1%', claims: 14, denials: 1 },
  { payer: 'Cigna', billed: '$58K', collected: '$49K', rate: '84.5%', claims: 12, denials: 2 },
  { payer: 'UnitedHealthcare', billed: '$72K', collected: '$64K', rate: '88.9%', claims: 15, denials: 2 },
  { payer: 'Medicaid (MD)', billed: '$61K', collected: '$51K', rate: '83.6%', claims: 16, denials: 3 },
  { payer: 'Medicare', billed: '$28K', collected: '$24K', rate: '85.7%', claims: 6, denials: 2 },
  { payer: 'Self-Pay / OOP', billed: '$15K', collected: '$9K', rate: '60.0%', claims: 4, denials: 0 },
];

const DRILL_PENDING_ROWS = [
  { patient: 'Devon Patel', mrn: 'MRN-44782', payer: 'UnitedHealthcare', amount: '$12,400', submitted: 'Jul 14', aging: '8d', reason: 'Auth pending — day 18 review' },
  { patient: 'James Thornton', mrn: 'MRN-62841', payer: 'Cigna', amount: '$9,800', submitted: 'Jul 10', aging: '12d', reason: 'Clinical criteria supplemental requested' },
  { patient: 'Elaine Russo', mrn: 'MRN-28310', payer: 'Aetna', amount: '$8,100', submitted: 'Jul 12', aging: '10d', reason: 'Awaiting EOB — concurrent review in progress' },
  { patient: 'Marcus Webb', mrn: 'MRN-83921', payer: 'BlueCross', amount: '$14,600', submitted: 'Jul 8', aging: '14d', reason: 'Level of care appeal — secondary review' },
  { patient: 'Destiny Williams', mrn: 'MRN-55129', payer: 'Medicaid', amount: '$11,200', submitted: 'Jul 16', aging: '6d', reason: 'Documentation requested — UA chain of custody' },
  { patient: 'Robert Navarro', mrn: 'MRN-44782', payer: 'Aetna', amount: '$7,400', submitted: 'Jul 18', aging: '4d', reason: 'Standard processing — within SLA' },
  { patient: 'Ashley Monroe', mrn: 'MRN-49201', payer: 'Cigna', amount: '$10,600', submitted: 'Jul 19', aging: '3d', reason: 'Initial submission — authorization requested' },
  { patient: 'Samantha Choi', mrn: 'MRN-74563', payer: 'BlueCross', amount: '$9,900', submitted: 'Jul 20', aging: '2d', reason: 'Standard processing — within SLA' },
];

const DRILL_DENIED_ROWS = [
  { patient: 'T.B.', payer: 'Aetna', amount: '$9,800', denialDate: 'Jul 18', reason: 'Medical necessity not established — ASAM criteria insufficient', action: 'Appeal with updated clinical' },
  { patient: 'K.W.', payer: 'Cigna', amount: '$7,200', denialDate: 'Jul 16', reason: 'Level of care: PHP not supported — recommended OP', action: 'Peer-to-peer appeal scheduled' },
  { patient: 'L.P.', payer: 'Medicaid', amount: '$5,400', denialDate: 'Jul 15', reason: 'AMA discharge — no auth for return admission', action: 'Retroactive auth requested' },
  { patient: 'M.D.', payer: 'UnitedHealthcare', amount: '$11,200', denialDate: 'Jul 12', reason: 'Concurrent review not submitted timely', action: 'Internal process corrected; appeal filed' },
  { patient: 'A.S.', payer: 'BlueCross', amount: '$8,700', denialDate: 'Jul 10', reason: 'Co-insurance limit reached', action: 'Financial counseling offered' },
  { patient: 'R.C.', payer: 'Medicare', amount: '$6,100', denialDate: 'Jul 8', reason: 'Duplicate claim submission', action: 'Corrected claim resubmitted' },
  { patient: 'C.N.', payer: 'Self-Pay', amount: '$4,200', denialDate: 'Jul 5', reason: 'Payment plan defaulted', action: 'Financial counseling follow-up' },
  { patient: 'J.H.', payer: 'Aetna', amount: '$9,300', denialDate: 'Jul 3', reason: 'Prior auth not obtained before admission', action: 'Retroactive auth appeal in progress' },
  { patient: 'D.R.', payer: 'Cigna', amount: '$7,800', denialDate: 'Jun 30', reason: 'Experimental treatment code (group MAT)', action: 'Code corrected; claim resubmitted' },
  { patient: 'E.M.', payer: 'UnitedHealthcare', amount: '$6,500', denialDate: 'Jun 28', reason: 'Timely filing — submitted after 90-day window', action: 'Appeal filed with extenuating circumstances' },
  { patient: 'W.P.', payer: 'BlueCross', amount: '$8,100', denialDate: 'Jun 25', reason: 'Benefit exhausted — max days for residential', action: 'Step down to PHP; family notified' },
  { patient: 'S.T.', payer: 'Medicaid', amount: '$5,700', denialDate: 'Jun 22', reason: 'No referral on file for residential level', action: 'Referral obtained; retroactive submission' },
];

const DRILL_AUTH_RISK_ROWS = [
  { patient: 'Linda Farris', mrn: 'MRN-39018', payer: 'Cigna', program: 'PHP', authExpires: 'Jul 24', los: '14d', urContact: 'D. Hughes', action: 'Submit concurrent review today' },
  { patient: 'Robert Navarro', mrn: 'MRN-44782', payer: 'Aetna', program: 'Residential', authExpires: 'Jul 26', los: '18d', urContact: 'B. Hughes', action: 'Schedule peer-to-peer with Aetna MD' },
  { patient: 'Elaine Russo', mrn: 'MRN-28310', payer: 'BlueCross', program: 'Residential', authExpires: 'Jul 29', los: '22d', urContact: 'B. Hughes', action: 'Continue-stay letter needed from Dr. Chen' },
];

// ── Live alert type ───────────────────────────────────────────────────────────
interface LiveAlert {
  id: string; patientName: string; patientBed: string; scoreType: string;
  score: number; severity: string; nurseInitials: string; timestamp: string;
}

// ── Comparison data (this week vs prior week) ─────────────────────────────────
const CLINICAL_COMPARISONS = [
  { key: 'census',     label: 'Census',        delta: '+2',    dir: 'up'   as const },
  { key: 'ama',        label: 'AMA Risk',      delta: '-1',    dir: 'down' as const },
  { key: 'cosigns',   label: 'Co-signs',       delta: '+1',    dir: 'up'   as const },
  { key: 'los',        label: 'Avg LOS',       delta: '-0.3d', dir: 'down' as const },
  { key: 'discharges', label: 'Discharges',    delta: '+1',    dir: 'up'   as const },
];
const FINANCIAL_COMPARISONS = [
  { key: 'revenue',    label: 'MTD Revenue',   delta: '+$22K', dir: 'up'   as const },
  { key: 'rate',       label: 'Collection',    delta: '+0.8%', dir: 'up'   as const },
  { key: 'pending',    label: 'Pending Claims',delta: '-$8K',  dir: 'down' as const },
  { key: 'denied',     label: 'Denied Claims', delta: '-2',    dir: 'down' as const },
  { key: 'authrisk',   label: 'Auth Risk',     delta: '+1',    dir: 'up'   as const },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
function DeltaBadge({ delta, dir, label }: { delta: string; dir: 'up' | 'down'; label: string }) {
  const isGood =
    (label === 'AMA Risk' && dir === 'down') ||
    (label === 'Denied Claims' && dir === 'down') ||
    (label === 'Pending Claims' && dir === 'down') ||
    (dir === 'up' && label !== 'AMA Risk' && label !== 'Denied Claims' && label !== 'Pending Claims' && label !== 'Auth Risk');
  const color = isGood ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200';
  const arrow = dir === 'up' ? '▲' : '▼';
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 border rounded-lg text-xs ${color}`}>
      <span className="font-bold">{arrow} {delta}</span>
      <span className="text-[10px] mt-0.5 font-medium opacity-70">vs last wk</span>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────
const COLS_CENSUS: DrillDownColumn[] = [
  { key: 'name',    label: 'Patient',   render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'mrn',     label: 'MRN',       render: (v) => <span className="font-mono text-xs text-slate">{v as string}</span> },
  { key: 'program', label: 'Program',   render: (v) => <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{v as string}</span> },
  { key: 'los',     label: 'LOS',       render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'bed',     label: 'Bed' },
  { key: 'counselor', label: 'Counselor' },
];
const COLS_AMA: DrillDownColumn[] = [
  { key: 'name',       label: 'Patient',    render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'mrn',        label: 'MRN',        render: (v) => <span className="font-mono text-xs text-slate">{v as string}</span> },
  { key: 'program',    label: 'Program' },
  { key: 'riskLevel',  label: 'Risk',       render: (v) => <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{v as string}</span> },
  { key: 'craving',    label: 'Cravings' },
  { key: 'mood',       label: 'Mood' },
  { key: 'counselor',  label: 'Counselor' },
];
const COLS_COSIGNS: DrillDownColumn[] = [
  { key: 'counselor', label: 'Counselor', render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'patient',   label: 'Patient' },
  { key: 'noteType',  label: 'Note Type' },
  { key: 'date',      label: 'Created' },
  { key: 'pending',   label: 'Pending',  render: (v, row) => {
    const r = row as { priority: string; pending: string };
    return <span className={`font-bold ${r.priority === 'Critical' ? 'text-red-600' : r.priority === 'High' ? 'text-amber-600' : 'text-slate'}`}>{r.pending}</span>;
  }},
];
const COLS_LOS: DrillDownColumn[] = [
  { key: 'name',       label: 'Patient', render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'mrn',        label: 'MRN',     render: (v) => <span className="font-mono text-xs text-slate">{v as string}</span> },
  { key: 'program',    label: 'Program' },
  { key: 'los',        label: 'LOS',     render: (v) => <span className={`font-bold ${(v as number) > 30 ? 'text-amber-600' : 'text-navy'}`}>{v as number}d</span> },
  { key: 'admitDate',  label: 'Admit' },
  { key: 'expectedDischarge', label: 'Exp. DC' },
];
const COLS_DISCHARGES: DrillDownColumn[] = [
  { key: 'name',          label: 'Patient',     render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'mrn',           label: 'MRN',         render: (v) => <span className="font-mono text-xs text-slate">{v as string}</span> },
  { key: 'program',       label: 'Program' },
  { key: 'dischargeDate', label: 'DC Date' },
  { key: 'disposition',   label: 'Disposition' },
  { key: 'insurance',     label: 'Payer' },
  { key: 'counselor',     label: 'Counselor' },
];
const COLS_REVENUE: DrillDownColumn[] = [
  { key: 'payer',    label: 'Payer',     render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'billed',   label: 'Billed',    render: (v) => <span className="font-bold text-blue-700">{v as string}</span> },
  { key: 'collected',label: 'Collected', render: (v) => <span className="font-bold text-green-700">{v as string}</span> },
  { key: 'rate',     label: 'Rate',      render: (v) => {
    const n = parseFloat(v as string);
    return <span className={`font-bold ${n >= 88 ? 'text-green-700' : n >= 83 ? 'text-amber-600' : 'text-red-600'}`}>{v as string}</span>;
  }},
  { key: 'claims',   label: 'Claims' },
  { key: 'denials',  label: 'Denials' },
];
const COLS_PENDING: DrillDownColumn[] = [
  { key: 'patient',  label: 'Patient',  render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'payer',    label: 'Payer' },
  { key: 'amount',   label: 'Amount',   render: (v) => <span className="font-bold text-amber-700">{v as string}</span> },
  { key: 'submitted',label: 'Submitted' },
  { key: 'aging',    label: 'Aging',    render: (v) => {
    const n = parseInt(v as string);
    return <span className={`font-bold ${n >= 14 ? 'text-red-600' : n >= 7 ? 'text-amber-600' : 'text-slate'}`}>{v as string}</span>;
  }},
  { key: 'reason',   label: 'Status / Note' },
];
const COLS_DENIED: DrillDownColumn[] = [
  { key: 'patient',    label: 'Patient' },
  { key: 'payer',      label: 'Payer' },
  { key: 'amount',     label: 'Amount',  render: (v) => <span className="font-bold text-red-700">{v as string}</span> },
  { key: 'denialDate', label: 'Denied' },
  { key: 'reason',     label: 'Reason' },
  { key: 'action',     label: 'Action' },
];
const COLS_AUTH_RISK: DrillDownColumn[] = [
  { key: 'patient',    label: 'Patient',     render: (v) => <span className="font-semibold text-navy">{v as string}</span> },
  { key: 'mrn',        label: 'MRN',         render: (v) => <span className="font-mono text-xs text-slate">{v as string}</span> },
  { key: 'payer',      label: 'Payer' },
  { key: 'program',    label: 'Program' },
  { key: 'authExpires',label: 'Auth Expires',render: (v) => <span className="font-bold text-red-600">{v as string}</span> },
  { key: 'urContact',  label: 'UR Contact' },
  { key: 'action',     label: 'Required Action' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface DrillDownState {
  title: string;
  subtitle?: string;
  badge?: { label: string; color: string };
  rows: Record<string, unknown>[];
  columns: DrillDownColumn[];
  navigateLabel?: string;
  onNavigate?: () => void;
}

export function Dashboard({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const { role, canAccessScreen } = useRole();
  const { addAuditEntry } = useDemoStore();
  const { alerts: ccAlerts } = useCCStore();
  const highRiskPatients = MOCK_PATIENTS.filter(p => p.amaRisk === 'High').slice(0, 8);

  // ── Live nurse alerts ───────────────────────────────────────────────────────
  const [liveAlerts, setLiveAlerts] = React.useState<LiveAlert[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/alerts/vitals');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setLiveAlerts(data.alerts ?? []);
      } catch { /* server not ready or offline — silent */ }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // ── Dashboard view ──────────────────────────────────────────────────────────
  type DashView = 'clinical' | 'bht' | 'financial' | 'operations' | 'bizdev' | 'hr' | 'aftercare' | 'admin';
  const dashView: DashView =
    role.id === 'bht'                    ? 'bht'        :
    role.id === 'billing_staff' ||
    role.id === 'accounting_staff' ||
    role.id === 'ownership'              ? 'financial'  :
    role.id === 'director_of_operations' ||
    role.id === 'bht_supervisor'         ? 'operations' :
    role.id === 'business_development'   ? 'bizdev'     :
    role.id === 'human_resources'        ? 'hr'         :
    role.id === 'aftercare_staff'        ? 'aftercare'  :
    ['Clinical', 'Medical', 'Nursing & Direct Care'].includes(role.category) ? 'clinical' :
    'admin';

  const isClinical   = dashView === 'clinical';
  const isBHT        = dashView === 'bht';
  const isFinancial  = dashView === 'financial';
  const isOperations = dashView === 'operations';
  const isBizDev     = dashView === 'bizdev';
  const isHR         = dashView === 'hr';
  const isAftercare  = dashView === 'aftercare';
  const isAdmin      = dashView === 'admin';

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterLoc,  setFilterLoc]  = useState('All');
  const [filterLOC,  setFilterLOC]  = useState('All');
  const [filterDate, setFilterDate] = useState('This Week');

  // ── Drill-down state ────────────────────────────────────────────────────────
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

  // ── Export modal state ──────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false);

  // ── Executive note state ────────────────────────────────────────────────────
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [execNotes, setExecNotes] = useState<Array<{ id: string; text: string; ts: string; author: string }>>([]);

  // ── Reviewed alerts ─────────────────────────────────────────────────────────
  const [reviewedAlerts, setReviewedAlerts] = useState<Set<string>>(new Set());
  const markReviewed = (alertId: string, alertLabel: string) => {
    setReviewedAlerts(prev => new Set([...prev, alertId]));
    addAuditEntry({ staffName: role.label, action: 'Marked Alert Reviewed', entity: 'Dashboard Alert', detail: alertLabel });
  };

  // ── CC open alert counts ────────────────────────────────────────────────────
  const ccOpenAlerts = useMemo(() => {
    const open = ccAlerts.filter(a => a.status !== 'Resolved');
    return { total: open.length, critical: open.filter(a => a.priority === 'Critical').length };
  }, [ccAlerts]);

  const canSeeCC = canAccessScreen('CommandCenter');

  // ── Filter bar (shared by clinical, financial, operations views) ────────────
  const FilterBar = () => (
    <div className="flex items-center gap-3 flex-wrap bg-white border border-border rounded-lg px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate mr-1">
        <Filter className="w-3.5 h-3.5" /> Filters
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate">Location:</label>
        <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-white text-navy font-medium focus:outline-none focus:ring-1 focus:ring-orange">
          <option>All</option>
          <option>Rockville, MD</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate">Level of Care:</label>
        <select value={filterLOC} onChange={e => setFilterLOC(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-white text-navy font-medium focus:outline-none focus:ring-1 focus:ring-orange">
          <option>All</option>
          <option>Residential</option>
          <option>PHP</option>
          <option>IOP</option>
          <option>Detox</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate">Date Range:</label>
        <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-white text-navy font-medium focus:outline-none focus:ring-1 focus:ring-orange">
          <option>This Week</option>
          <option>Last Week</option>
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      {(filterLoc !== 'All' || filterLOC !== 'All' || filterDate !== 'This Week') && (
        <button onClick={() => { setFilterLoc('All'); setFilterLOC('All'); setFilterDate('This Week'); }}
          className="flex items-center gap-1 text-xs text-sunrise-blue hover:underline">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
      <div className="ml-auto text-xs text-slate">
        Showing: <strong className="text-navy">{filterLoc === 'All' ? 'All locations' : filterLoc}</strong>
        {filterLOC !== 'All' && <span> · <strong className="text-navy">{filterLOC}</strong></span>}
        {' · '}<strong className="text-navy">{filterDate}</strong>
      </div>
    </div>
  );

  // ── Comparison row (shows period-over-period deltas) ────────────────────────
  const ComparisonRow = ({ comparisons }: { comparisons: typeof CLINICAL_COMPARISONS }) => (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-slate-50 border border-border rounded-lg">
      <span className="text-xs font-semibold text-slate mr-1">vs prior {filterDate === 'This Week' ? 'week' : filterDate === 'This Month' ? 'month' : 'period'}:</span>
      {comparisons.map(c => <DeltaBadge key={c.key} delta={c.delta} dir={c.dir} label={c.label} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-navy border border-white/10 px-5 py-3 rounded-lg shadow-sm flex items-center justify-between">
        <div className="font-medium text-white">
          <span className="font-bold mr-2 text-sunrise-orange">{role.label}</span>
          <span className="text-slate-300">— Sunrise Recovery Center</span>
        </div>
        <div className="flex gap-5 text-sm text-slate-300">
          <span>Active Census: <strong className="text-white">18/22</strong></span>
          <span>Shift: <strong className="text-white">Day</strong></span>
          {isFinancial && <span>MTD Revenue: <strong className="text-white">$310K</strong></span>}
          {isHR && <span>Staff Count: <strong className="text-white">12 active</strong></span>}
          {canSeeCC && ccOpenAlerts.critical > 0 && (
            <button onClick={() => navigate('CommandCenter')} className="flex items-center gap-1.5 text-red-300 hover:text-red-200 transition-colors font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
              {ccOpenAlerts.critical} Critical Alert{ccOpenAlerts.critical !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ── CLINICAL VIEW ──────────────────────────────────────────────────── */}
      {isClinical && !isBHT && (
        <>
          <FilterBar />

          {/* Live nurse alerts */}
          {liveAlerts.filter(a => !dismissedIds.has(a.id)).length > 0 && (
            <div className="space-y-1.5">
              {liveAlerts.filter(a => !dismissedIds.has(a.id)).map(alert => (
                <div key={alert.id} className="bg-red-50 border border-red-400 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">!</span>
                  <span className="text-sm font-medium text-red-900 flex-1">
                    <strong>LIVE · Nurse Alert:</strong>{' '}
                    {alert.patientName} (Bed {alert.patientBed}) — {alert.scoreType} {alert.score} · <em>{alert.severity}</em> · logged by {alert.nurseInitials}
                  </span>
                  <span className="text-xs text-red-400 shrink-0 mr-2">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => setDismissedIds(prev => new Set([...prev, alert.id]))} className="text-red-400 hover:text-red-600 shrink-0" aria-label="Dismiss">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Static alerts with Mark Reviewed */}
          <div className="space-y-2">
            {[
              { id: 'ama-alert', level: 'high', icon: AlertTriangle, iconColor: 'text-high', bg: 'bg-high-bg border-high/20', text: 'AMA Risk Alert: 2 clients flagged HIGH for early departure', screen: 'RiskDashboard' as Screen },
            ].map(al => (
              <div key={al.id} className={`${al.bg} border px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm ${reviewedAlerts.has(al.id) ? 'opacity-50' : ''}`}>
                <al.icon className={`w-5 h-5 ${al.iconColor} shrink-0`} />
                <span className="text-sm font-medium text-navy flex-1"><strong>{al.text}</strong></span>
                {reviewedAlerts.has(al.id) ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Reviewed</span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => navigate(al.screen)} className="text-xs text-sunrise-blue font-medium hover:underline">View →</button>
                    <button onClick={() => markReviewed(al.id, al.text)} className="text-xs bg-white border border-border text-slate hover:text-navy hover:border-navy font-medium px-2 py-1 rounded transition-colors">Mark Reviewed</button>
                  </div>
                )}
              </div>
            ))}
            {canAccessScreen('CosignQueue') && (
              <div className={`bg-moderate-bg border border-moderate/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm ${reviewedAlerts.has('cosign-alert') ? 'opacity-50' : ''}`}>
                <Clock className="w-5 h-5 text-moderate shrink-0" />
                <span className="text-sm font-medium text-navy flex-1">4 co-sign requests pending from primary counselors</span>
                {reviewedAlerts.has('cosign-alert') ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Reviewed</span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => navigate('CosignQueue')} className="text-xs text-sunrise-blue font-medium hover:underline">Review →</button>
                    <button onClick={() => markReviewed('cosign-alert', '4 co-sign requests pending')} className="text-xs bg-white border border-border text-slate hover:text-navy hover:border-navy font-medium px-2 py-1 rounded transition-colors">Mark Reviewed</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <MetricCard title="Census" value="18/22" subtitle="81.8% Occupancy" color="orange"
              onClick={() => setDrillDown({ title: 'Active Census', subtitle: `${filterLoc !== 'All' ? filterLoc + ' · ' : ''}${filterLOC !== 'All' ? filterLOC + ' · ' : ''}${filterDate}`, badge: { label: '18 patients', color: 'bg-orange-100 text-orange-700' }, rows: DRILL_CENSUS_ROWS, columns: COLS_CENSUS, navigateLabel: 'Open Bed Board', onNavigate: () => { setDrillDown(null); navigate('CensusBedBoard'); } })} />
            {canAccessScreen('RiskDashboard') && (
              <MetricCard title="AMA Risk" value="2" subtitle="High Risk Clients" color="red"
                onClick={() => setDrillDown({ title: 'High AMA Risk Clients', subtitle: 'Clients with elevated early-departure risk', badge: { label: '2 high risk', color: 'bg-red-100 text-red-700' }, rows: DRILL_AMA_ROWS, columns: COLS_AMA, navigateLabel: 'Risk Dashboard', onNavigate: () => { setDrillDown(null); navigate('RiskDashboard'); } })} />
            )}
            {canAccessScreen('CosignQueue') && (
              <MetricCard title="Pending Co-signs" value="4" subtitle="Action Required" color="amber"
                onClick={() => setDrillDown({ title: 'Pending Co-sign Requests', subtitle: 'Notes awaiting supervisor co-signature', badge: { label: '4 pending', color: 'bg-amber-100 text-amber-700' }, rows: DRILL_COSIGNS_ROWS, columns: COLS_COSIGNS, navigateLabel: 'Co-sign Queue', onNavigate: () => { setDrillDown(null); navigate('CosignQueue'); } })} />
            )}
            <MetricCard title="Avg LOS" value="18.4" subtitle="Days" trend={{ value: '1.2', direction: 'down' }} color="blue"
              onClick={() => setDrillDown({ title: 'Length of Stay — All Active Patients', subtitle: 'Current LOS by patient', rows: DRILL_LOS_ROWS, columns: COLS_LOS, navigateLabel: 'Outcome Tracking', onNavigate: () => { setDrillDown(null); navigate('OutcomeTracking'); } })} />
            {canAccessScreen('Discharges') && (
              <MetricCard title="Discharges" value="3" subtitle="This Week" color="green"
                onClick={() => setDrillDown({ title: 'Discharges This Week', subtitle: `${filterDate}`, rows: DRILL_DISCHARGES_ROWS, columns: COLS_DISCHARGES, navigateLabel: 'Discharges', onNavigate: () => { setDrillDown(null); navigate('Discharges'); } })} />
            )}
          </div>

          {/* Period comparison */}
          <ComparisonRow comparisons={CLINICAL_COMPARISONS} />

          {/* Command Center summary for authorized users */}
          {canSeeCC && (
            <button onClick={() => navigate('CommandCenter')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-navy/5 border border-navy/15 hover:bg-navy/10 rounded-lg transition-colors group">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-sunrise-orange" />
                <div className="text-left">
                  <div className="font-semibold text-navy text-sm">Command Center</div>
                  <div className="text-xs text-slate">{ccOpenAlerts.total} open alerts · {ccOpenAlerts.critical} critical requiring immediate action</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {ccOpenAlerts.critical > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{ccOpenAlerts.critical} Critical</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate group-hover:text-navy transition-colors" />
              </div>
            </button>
          )}

          {/* Main 2-Col */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-navy mb-4">Program Utilization</h3>
                <div className="flex items-center gap-6 mb-6">
                  <OccupancyRing percentage={81.8} />
                  <div className="flex-1 space-y-4">
                    {[
                      { label: 'Residential', val: '8/10', pct: '80%', color: 'bg-sunrise-blue' },
                      { label: 'PHP', val: '5/6', pct: '83%', color: 'bg-sunrise-orange' },
                      { label: 'IOP', val: '5/6', pct: '83%', color: 'bg-purple' },
                    ].map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate">{p.label}</span>
                          <span className="text-navy font-bold">{p.val}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`${p.color} h-2 rounded-full`} style={{ width: p.pct }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {canAccessScreen('RecoveryEngagementScore') && (
                  <>
                    <h3 className="font-bold text-navy mb-3 mt-8">Recovery Engagement Score</h3>
                    <div className="bg-bg p-4 rounded-md border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate">Average Score</span>
                        <span className="text-xl font-bold text-navy">72/100</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden mt-2">
                        <div className="bg-critical" style={{ width: '10%' }} title="Low: 10%"></div>
                        <div className="bg-sunrise-amber" style={{ width: '30%' }} title="Med: 30%"></div>
                        <div className="bg-success" style={{ width: '60%' }} title="High: 60%"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-navy p-6 rounded-lg shadow-sm border-l-4 border-l-sunrise-orange relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-sunrise-orange">&#9728;</span> AI Clinical Brief
                </h3>
                <p className="text-slate-300 text-sm mb-4">Generated summary of today&apos;s critical action items across the census.</p>
                <div className="space-y-3">
                  {[
                    { name: 'Marcus Webb (Res)', note: 'High AMA risk reported during morning group. Expressed severe cravings. Dr. Chen adjusting Suboxone. Action: Counselor Sarah Jenkins needs to conduct 1:1 check-in before lunch.' },
                    { name: 'Samantha Choi (Res)', note: 'Restricted meals for last 24h. Psychiatric flags active. Action: Schedule immediate consult with Dr. Stone; dietary monitoring required.' },
                    { name: 'Devon Patel (Res)', note: 'Recent UA returned positive for Methamphetamine. Mild paranoia noted in nursing notes. Action: Hold from group therapy today, initiate behavioral protocol.' },
                  ].map(item => (
                    <div key={item.name} className="bg-white/10 p-3 rounded text-sm">
                      <strong className="text-sunrise-orange">{item.name}:</strong> {item.note}
                    </div>
                  ))}
                </div>
              </div>

              {canAccessScreen('PatientDetail') && (
                <div className="bg-white p-5 rounded-lg shadow-sm border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy">Priority Clients</h3>
                    <button onClick={() => navigate('PatientList')} className="text-sm text-sunrise-blue font-medium hover:underline flex items-center">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3 pl-4 rounded-tl">Flags</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Prog</th>
                          <th className="p-3">Acuity</th>
                          <th className="p-3">RES</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {highRiskPatients.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                            <td className="p-3 pl-4"><div className="flex gap-1">{p.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} />)}</div></td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                                <div>
                                  <div className="font-bold text-navy">{p.firstName} {p.lastName}</div>
                                  <div className="text-[10px] text-slate">{p.mrn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3"><span className="text-xs font-semibold text-slate">{p.program}</span></td>
                            <td className="p-3"><AcuityBadge acuity={p.amaRisk === 'High' ? 'Critical' : 'High'} /></td>
                            <td className="p-3"><RecoveryScoreBadge score={p.recoveryScore} /></td>
                            <td className="p-3"><button onClick={() => navigate('PatientDetail', p.id)} className="text-sunrise-blue text-xs font-medium hover:underline">Review Chart</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-border rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy">Quick Actions</span>
              <span className="text-xs text-slate">Common tasks for today</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: 'New Admission', icon: UserPlus, screen: 'Admissions' as Screen, color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                { label: 'New Progress Note', icon: FileText, screen: 'ProgressNotes' as Screen, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
                { label: 'Co-sign Queue (4)', icon: FileText, screen: 'CosignQueue' as Screen, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                { label: 'UA Results', icon: Droplets, screen: 'UADrugTesting' as Screen, color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
                { label: 'Open Incidents (2)', icon: AlertTriangle, screen: 'IncidentReporting' as Screen, color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
                { label: 'Chart Review', icon: Clock, screen: 'ChartReview' as Screen, color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
              ].filter(a => canAccessScreen(a.screen)).map(({ label, icon: Icon, screen, color }) => (
                <button key={label} onClick={() => navigate(screen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Census Trend + Admissions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-navy text-sm">30-Day Census Trend</h3>
                <button onClick={() => navigate('CensusBedBoard')} className="text-xs text-sunrise-blue font-medium hover:underline flex items-center gap-1">
                  Bed Board <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate mb-4">Daily census vs. 22-bed capacity</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="censusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8761A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8761A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number, name: string) => [v, name === 'census' ? 'Census' : 'Capacity']} />
                  <Area type="monotone" dataKey="capacity" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" fill="url(#capGrad)" name="capacity" />
                  <Area type="monotone" dataKey="census" stroke="#E8761A" strokeWidth={2} fill="url(#censusGrad)" name="census" dot={{ r: 2.5, fill: '#E8761A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {canAccessScreen('Admissions') ? (
              <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-navy text-sm">Weekly Admissions vs. Discharges</h3>
                  <button onClick={() => navigate('Admissions')} className="text-xs text-sunrise-blue font-medium hover:underline flex items-center gap-1">
                    Admissions <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate mb-4">7-week flow — admissions in, discharges out</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ADMISSIONS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="admissions" fill="#3B9ED4" radius={[3,3,0,0]} name="Admissions" />
                    <Bar dataKey="discharges" fill="#E8761A" radius={[3,3,0,0]} name="Discharges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-navy text-sm mb-4">Group Schedule Today</h3>
                <div className="space-y-2">
                  {[
                    { time: '9:00 AM', group: 'Morning Meditation', room: 'Rm 1', count: 8 },
                    { time: '10:30 AM', group: 'CBT Skills Group', room: 'Rm 2', count: 6 },
                    { time: '1:00 PM', group: 'Relapse Prevention', room: 'Rm 1', count: 10 },
                    { time: '3:00 PM', group: 'Process Group', room: 'Rm 3', count: 7 },
                  ].map(g => (
                    <div key={g.time} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="font-medium text-navy text-sm">{g.group}</div>
                        <div className="text-xs text-slate">{g.time} · {g.room}</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{g.count} clients</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── BHT VIEW ───────────────────────────────────────────────────────── */}
      {isBHT && (
        <>
          <div className="bg-moderate-bg border border-moderate/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
            <Users className="w-5 h-5 text-moderate" />
            <span className="text-sm font-medium text-navy">3 clients need 15-minute checks this hour. See shift handoff for assignments.</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Active Census" value="18" subtitle="Clients on unit" color="blue" onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Groups Today" value="4" subtitle="Scheduled sessions" color="green" onClick={() => navigate('GroupSchedule')} />
            <MetricCard title="Open Incidents" value="2" subtitle="Needs follow-up" color="red" onClick={() => navigate('IncidentReporting')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy mb-3">Today&apos;s Group Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM', group: 'Morning Meditation', room: 'Rm 1' },
                  { time: '10:30 AM', group: 'CBT Skills Group', room: 'Rm 2' },
                  { time: '1:00 PM', group: 'Relapse Prevention', room: 'Rm 1' },
                  { time: '3:00 PM', group: 'Process Group', room: 'Rm 3' },
                ].map(g => (
                  <div key={g.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{g.group}</div><div className="text-xs text-slate">{g.time} · {g.room}</div></div>
                    <button onClick={() => navigate('GroupSchedule')} className="text-xs text-sunrise-blue hover:underline">View</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy mb-3">Recent Training</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'De-escalation Techniques', due: 'Due Jul 30', status: 'bg-amber-100 text-amber-700' },
                  { name: 'Suicide Prevention (QPR)', due: 'Completed Jun 15', status: 'bg-green-100 text-green-700' },
                  { name: 'Trauma-Informed Care', due: 'Due Aug 15', status: 'bg-blue-100 text-blue-700' },
                ].map(t => (
                  <div key={t.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-navy font-medium">{t.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status}`}>{t.due}</span>
                  </div>
                ))}
                <button onClick={() => navigate('Training')} className="text-xs text-sunrise-blue hover:underline mt-1">View all training</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FINANCIAL / OWNERSHIP VIEW ─────────────────────────────────────── */}
      {isFinancial && (
        <>
          <FilterBar />

          {/* Executive action bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <BarChart3 className="w-4 h-4 text-sunrise-orange" />
              Executive Dashboard — {filterDate}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-slate-50 border border-border hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <StickyNote className="w-3.5 h-3.5" /> Add Executive Note
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy/90 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Executive Summary
              </button>
            </div>
          </div>

          {/* Executive notes */}
          {execNotes.length > 0 && (
            <div className="space-y-2">
              {execNotes.map(note => (
                <div key={note.id} className="flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <StickyNote className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-navy">{note.text}</div>
                    <div className="text-xs text-slate mt-1">{note.author} · {new Date(note.ts).toLocaleString()}</div>
                  </div>
                  <button onClick={() => setExecNotes(prev => prev.filter(n => n.id !== note.id))} className="text-slate hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            <MetricCard title="MTD Revenue" value="$310K" subtitle="Jul billed to date" color="green"
              onClick={() => setDrillDown({ title: 'MTD Revenue by Payer', subtitle: `${filterDate} · ${filterLoc !== 'All' ? filterLoc : 'All Locations'}`, badge: { label: '$310K collected', color: 'bg-green-100 text-green-700' }, rows: DRILL_REVENUE_ROWS, columns: COLS_REVENUE, navigateLabel: 'Revenue Cycle', onNavigate: () => { setDrillDown(null); navigate('RevenueCycle'); } })} />
            <MetricCard title="Collection Rate" value="87.3%" subtitle="Last 30 days" trend={{ value: '2.1', direction: 'up' }} color="blue"
              onClick={() => setDrillDown({ title: 'Collection Rate — Payer Breakdown', subtitle: 'Billed vs. collected by payer', rows: DRILL_REVENUE_ROWS, columns: COLS_REVENUE, navigateLabel: 'Revenue Cycle', onNavigate: () => { setDrillDown(null); navigate('RevenueCycle'); } })} />
            <MetricCard title="Pending Claims" value="$84K" subtitle="Awaiting payment" color="amber"
              onClick={() => setDrillDown({ title: 'Pending Claims', subtitle: 'Claims awaiting payment — sorted by aging', badge: { label: '8 claims', color: 'bg-amber-100 text-amber-700' }, rows: DRILL_PENDING_ROWS, columns: COLS_PENDING, navigateLabel: 'Insurance Authorization', onNavigate: () => { setDrillDown(null); navigate('InsuranceAuthorization'); } })} />
            <MetricCard title="Denied Claims" value="12" subtitle="This month" color="red"
              onClick={() => setDrillDown({ title: 'Denied Claims — This Month', subtitle: 'Claims denied with reason and appeal status', badge: { label: '12 denials', color: 'bg-red-100 text-red-700' }, rows: DRILL_DENIED_ROWS, columns: COLS_DENIED, navigateLabel: 'Revenue Cycle', onNavigate: () => { setDrillDown(null); navigate('RevenueCycle'); } })} />
            <MetricCard title="Auth Risk" value="3" subtitle="At risk of expiry" color="orange" icon={ShieldAlert}
              onClick={() => setDrillDown({ title: 'Authorization Risk — 3 Patients', subtitle: 'Active authorizations expiring within 7 days', badge: { label: 'Action needed', color: 'bg-orange-100 text-orange-700' }, rows: DRILL_AUTH_RISK_ROWS, columns: COLS_AUTH_RISK, navigateLabel: 'Insurance Authorization', onNavigate: () => { setDrillDown(null); navigate('InsuranceAuthorization'); } })} />
          </div>

          {/* Period comparison */}
          <ComparisonRow comparisons={FINANCIAL_COMPARISONS} />

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-navy text-sm">Revenue Trend — Billed vs. Collected</h3>
                <button onClick={() => navigate('RevenueCycle')} className="text-xs text-sunrise-blue font-medium hover:underline">Revenue Cycle &#8594;</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}K`} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`$${v}K`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="billed" fill="#3B9ED4" radius={[3,3,0,0]} name="Billed" />
                  <Bar dataKey="collected" fill="#27ae60" radius={[3,3,0,0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">30-Day Census Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="censusGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8761A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8761A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="census" stroke="#E8761A" strokeWidth={2} fill="url(#censusGrad2)" name="Census" dot={{ r: 2.5, fill: '#E8761A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── OPERATIONS / BHT SUPERVISOR VIEW ──────────────────────────────── */}
      {isOperations && (
        <>
          <FilterBar />
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Bed Occupancy" value="18/22" subtitle="81.8%" color="orange"
              onClick={() => setDrillDown({ title: 'Active Census', rows: DRILL_CENSUS_ROWS, columns: COLS_CENSUS, navigateLabel: 'Bed Board', onNavigate: () => { setDrillDown(null); navigate('CensusBedBoard'); } })} />
            <MetricCard title="Waitlist" value="7" subtitle="Pending placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Open Incidents" value="2" subtitle="Needs review" color="red" onClick={() => navigate('IncidentReporting')} />
            <MetricCard title="Staff on Shift" value="8" subtitle="Day shift active" color="blue" onClick={() => navigate('StaffScheduling')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">Bed Status</h3>
              <div className="space-y-2">
                {[
                  { program: 'Residential (10 beds)', occupied: 8, color: 'bg-sunrise-blue' },
                  { program: 'PHP (6 slots)', occupied: 5, color: 'bg-sunrise-orange' },
                  { program: 'IOP (6 slots)', occupied: 5, color: 'bg-purple' },
                ].map(p => (
                  <div key={p.program}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate">{p.program}</span>
                      <span className="font-bold text-navy">{p.occupied}/{parseInt(p.program.match(/\d+/)![0])}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${p.color} h-2 rounded-full`} style={{ width: `${p.occupied / parseInt(p.program.match(/\d+/)![0]) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">Certifications Expiring (60 days)</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins, LCPC', cert: 'CAC-AD III', days: 22, urgent: true },
                  { name: 'Kevin Wright', cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres, RN', cert: 'BLS', days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.days}d</span>
                  </div>
                ))}
                <button onClick={() => navigate('CertificationTracker')} className="text-xs text-sunrise-blue hover:underline">View all &#8594;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BUSINESS DEVELOPMENT VIEW ──────────────────────────────────────── */}
      {isBizDev && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="MTD Referrals" value="23" subtitle="New this month" color="blue" trend={{ value: '4', direction: 'up' }} onClick={() => navigate('ReferralTracker')} />
            <MetricCard title="Occupancy" value="81.8%" subtitle="18/22 beds" color="green" onClick={() => navigate('Dashboard')} />
            <MetricCard title="Waitlist" value="7" subtitle="Ready for placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Alumni Active" value="142" subtitle="In program" color="orange" onClick={() => navigate('AlumniProgram')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Top Referral Sources — July</h3>
              <div className="space-y-2">
                {[
                  { source: 'MedStar Georgetown University Hospital', referrals: 7 },
                  { source: 'Saint Thomas West', referrals: 5 },
                  { source: 'Self / Family', referrals: 4 },
                  { source: 'Probation / Courts', referrals: 4 },
                  { source: 'AA / NA Community', referrals: 3 },
                ].map(r => (
                  <div key={r.source} className="flex items-center justify-between text-sm">
                    <span className="text-navy">{r.source}</span>
                    <span className="font-bold text-sunrise-blue">{r.referrals}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Outcomes Summary (aggregate)</h3>
              <div className="space-y-3">
                {[
                  { label: '30-day sobriety (alumni)', value: '78%', color: 'bg-green-500' },
                  { label: '90-day treatment completion', value: '64%', color: 'bg-sunrise-blue' },
                  { label: 'Alumni program engagement', value: '55%', color: 'bg-purple' },
                  { label: 'Family satisfaction score', value: '4.6/5', color: 'bg-sunrise-orange' },
                ].map(o => (
                  <div key={o.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{o.label}</span><strong className="text-navy">{o.value}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── HR VIEW ────────────────────────────────────────────────────────── */}
      {isHR && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Total Staff" value="12" subtitle="Active employees" color="blue" onClick={() => navigate('StaffScheduling')} />
            <MetricCard title="Certs Expiring" value="3" subtitle="Within 60 days" color="amber" onClick={() => navigate('CertificationTracker')} />
            <MetricCard title="Training Due" value="5" subtitle="Overdue items" color="red" onClick={() => navigate('Training')} />
            <MetricCard title="Supervision Done" value="8/12" subtitle="This month" color="green" onClick={() => navigate('ClinicalSupervision')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Staff by Department</h3>
              <div className="space-y-2 text-sm">
                {[
                  { dept: 'Clinical / Counseling', count: 4 },
                  { dept: 'Medical / Nursing', count: 3 },
                  { dept: 'Operations / BHT', count: 3 },
                  { dept: 'Administrative', count: 2 },
                ].map(d => (
                  <div key={d.dept} className="flex justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-slate">{d.dept}</span>
                    <span className="font-bold text-navy">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Renewals</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins', cert: 'CAC-AD III', days: 22, urgent: true },
                  { name: 'Kevin Wright', cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres', cert: 'BLS', days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.days}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ADMIN / INTAKE STAFF VIEW ─────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Today&apos;s Appointments" value="11" subtitle="Scheduled today" color="blue" onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Waitlist" value="7" subtitle="Pending placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Active Census" value="18" subtitle="Current clients" color="orange" onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Unread Messages" value="3" subtitle="Secure inbox" color="green" onClick={() => navigate('SecureMessaging')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Today&apos;s Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM', name: 'New Intake — Marcus Webb', type: 'Admission', badge: 'bg-green-100 text-green-700' },
                  { time: '10:30 AM', name: 'Follow-up — Devon Patel', type: 'Appt', badge: 'bg-blue-100 text-blue-700' },
                  { time: '1:00 PM', name: 'Discharge — Ashley Monroe', type: 'Discharge', badge: 'bg-orange-100 text-orange-700' },
                  { time: '3:00 PM', name: 'Insurance verify — Samantha Choi', type: 'Insurance', badge: 'bg-purple-100 text-purple-700' },
                ].map(a => (
                  <div key={a.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.time}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.badge}`}>{a.type}</span>
                  </div>
                ))}
                <button onClick={() => navigate('AppointmentCalendar')} className="text-xs text-sunrise-blue hover:underline">View full calendar &#8594;</button>
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Waitlist — Top Priority</h3>
              <div className="space-y-2">
                {[
                  { name: 'Jordan Hayes', source: 'ER Referral', payer: 'Medicaid', days: 3, pri: 'P1' },
                  { name: 'Casey Nguyen', source: 'Self-refer', payer: 'BCBS', days: 7, pri: 'P2' },
                  { name: 'Alex Morales', source: 'Probation', payer: 'Medicaid', days: 10, pri: 'P2' },
                ].map(w => (
                  <div key={w.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div>
                      <div className="font-medium text-navy">{w.name}</div>
                      <div className="text-xs text-slate">{w.source} · {w.payer}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.pri === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{w.pri}</span>
                      <div className="text-xs text-slate mt-0.5">{w.days}d waiting</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('WaitlistManager')} className="text-xs text-sunrise-blue hover:underline">View waitlist &#8594;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── AFTERCARE VIEW ─────────────────────────────────────────────────── */}
      {isAftercare && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Alumni Active" value="142" subtitle="In program" color="blue" onClick={() => navigate('AlumniProgram')} />
            <MetricCard title="30-Day Sobriety" value="78%" subtitle="Recent alumni" color="green" onClick={() => navigate('OutcomeTracking')} />
            <MetricCard title="Appts This Week" value="11" subtitle="Follow-up sessions" color="orange" onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Discharges (30d)" value="14" subtitle="Available for contact" color="amber" onClick={() => navigate('AftercarePlanning')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Alumni Appointments</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'Marcus Webb', date: 'Jul 23 — 2:00 PM', type: '30-day check-in' },
                  { name: 'Devon Patel', date: 'Jul 22 — 10:00 AM', type: '60-day follow-up' },
                  { name: 'Ashley Monroe', date: 'Jul 23 — 1:00 PM', type: '90-day review' },
                ].map(a => (
                  <div key={a.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.type}</div></div>
                    <span className="text-xs text-slate">{a.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Alumni Engagement Scores</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { period: '30d', score: 78 }, { period: '60d', score: 71 },
                  { period: '90d', score: 65 }, { period: '6mo', score: 58 },
                  { period: '12mo', score: 52 },
                ]} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Sobriety rate']} />
                  <Bar dataKey="score" fill="#27ae60" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Demo CTA strip */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 bg-violet-600 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-violet-100 text-sm">
          <CalendarDays className="w-4 h-4 shrink-0 opacity-80" />
          <span>Exploring Sunrise? Talk to our team and see it live in your environment.</span>
        </div>
        <a href={DEMO_BOOKING_URL} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 transition-colors text-sm font-semibold px-4 py-1.5 rounded shadow-sm">
          <CalendarDays className="w-3.5 h-3.5" />
          Schedule a live demo →
        </a>
      </div>

      {/* ── Drill-down modal ───────────────────────────────────────────────── */}
      {drillDown && (
        <DrillDownModal
          title={drillDown.title}
          subtitle={drillDown.subtitle}
          badge={drillDown.badge}
          rows={drillDown.rows}
          columns={drillDown.columns}
          onClose={() => setDrillDown(null)}
          onNavigate={drillDown.onNavigate}
          navigateLabel={drillDown.navigateLabel}
          footnote={`${drillDown.rows.length} records · Demo data only — not real patient information`}
        />
      )}

      {/* ── Export Executive Summary modal ─────────────────────────────────── */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowExport(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border">
            {/* Watermark overlay */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="absolute text-slate-200 font-black text-4xl whitespace-nowrap select-none"
                    style={{ transform: `rotate(-30deg) translate(${(i % 2) * 220 - 110}px, ${Math.floor(i / 2) * 80 - 40}px)` }}>
                    DEMO — FICTITIOUS DATA
                  </span>
                ))}
              </div>
              <div className="px-8 py-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-slate uppercase tracking-wider font-semibold mb-1">Sunrise Recovery Center</div>
                    <h2 className="text-xl font-bold text-navy">Executive Summary Report</h2>
                    <div className="text-sm text-slate mt-0.5">{filterDate} · {filterLoc !== 'All' ? filterLoc : 'All Locations'} · Generated July 22, 2026</div>
                  </div>
                  <button onClick={() => setShowExport(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Census', value: '18/22', note: '81.8% occupancy' },
                    { label: 'MTD Revenue', value: '$310K', note: '+$22K vs last week' },
                    { label: 'Collection Rate', value: '87.3%', note: '+0.8% vs last week' },
                    { label: 'Denied Claims', value: '12', note: '-2 vs last week' },
                    { label: 'Auth Risk', value: '3', note: 'Expiring within 7d' },
                    { label: 'Avg LOS', value: '18.4d', note: '-0.3d vs last week' },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 border border-border rounded-lg p-3">
                      <div className="text-xs text-slate font-semibold uppercase tracking-wide">{m.label}</div>
                      <div className="text-2xl font-extrabold text-navy mt-1">{m.value}</div>
                      <div className="text-xs text-slate mt-0.5">{m.note}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium">
                  ⚠ This is a demo preview. In production, clicking "Download PDF" would generate a properly formatted executive report with your facility name, logo, and live data.
                </div>
              </div>
            </div>
            <div className="px-8 py-4 border-t border-border bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-slate">Demo mode · Export preview only · Not actual data</span>
              <div className="flex gap-2">
                <button onClick={() => setShowExport(false)} className="text-sm text-slate hover:text-navy px-4 py-2 rounded border border-border">Close</button>
                <button onClick={() => setShowExport(false)} className="flex items-center gap-2 text-sm font-semibold text-white bg-navy hover:bg-navy/90 px-4 py-2 rounded">
                  <Download className="w-3.5 h-3.5" /> Download PDF (Demo)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Executive Note modal ───────────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNoteModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold text-navy flex items-center gap-2"><StickyNote className="w-4 h-4 text-sunrise-orange" /> Add Executive Note</h2>
              <button onClick={() => setShowNoteModal(false)} className="p-1.5 rounded hover:bg-slate-100 text-slate"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-xs text-slate">Notes are visible on this dashboard and saved to the audit log for this session.</p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Enter your executive note here…"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-navy resize-none focus:outline-none focus:ring-2 focus:ring-orange/40"
                rows={4}
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => { setShowNoteModal(false); setNoteText(''); }} className="text-sm text-slate hover:text-navy px-4 py-2 rounded border border-border">Cancel</button>
              <button
                disabled={!noteText.trim()}
                onClick={() => {
                  const note = { id: `note-${Date.now()}`, text: noteText.trim(), ts: new Date().toISOString(), author: role.label };
                  setExecNotes(prev => [note, ...prev]);
                  addAuditEntry({ staffName: role.label, action: 'Added Executive Note', entity: 'Dashboard', detail: noteText.trim().slice(0, 100) });
                  setNoteText('');
                  setShowNoteModal(false);
                }}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-navy hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
