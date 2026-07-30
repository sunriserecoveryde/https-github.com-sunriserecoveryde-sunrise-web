import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Screen } from '../App';
import {
  Users, ShieldCheck, AlertTriangle, CheckCircle, Clock, XCircle,
  Plus, ChevronDown, ChevronUp, Award, GraduationCap, UserCheck,
  UserCog, FileText, TrendingUp, BarChart2, Briefcase, Calendar,
  LogOut, Search, Building2, MapPin, Star, ClipboardList, Download,
  Printer
} from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { ToastAction } from '../components/ui/toast';
import { ComplianceDemoTour, TOUR_STEPS } from '../components/ComplianceDemoTour';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; requestedReqId?: string | null; }

// ─── Types ─────────────────────────────────────────────────────────────────────

type EmploymentType = 'Full-Time' | 'Part-Time' | 'PRN' | 'Contractor' | 'Intern' | 'Volunteer';
type EmploymentStatus = 'Active' | 'Onboarding' | 'Leave' | 'Separated';
type ScreeningResult = 'Clear' | 'Flag' | 'Pending' | 'Overdue';
type ReviewStatus = 'Scheduled' | 'Completed' | 'Overdue' | 'Pending Signature';
type ReviewType = '30-Day' | '60-Day' | '90-Day' | 'Annual' | 'Probationary' | 'PIP';
type OnboardStatus = 'In Progress' | 'Pending Approval' | 'Complete' | 'Overdue';

type AuditActionType = 'Marked Met' | 'Evidence Linked' | 'Action Plan Saved';
interface EmployeeProfile {
  id: string;
  name: string;
  preferredName?: string;
  title: string;
  department: 'Clinical' | 'Medical' | 'Nursing' | 'Operations' | 'Administration';
  employmentType: EmploymentType;
  status: EmploymentStatus;
  supervisor: string;
  location: string;
  levelOfCare: string[];
  hireDate: string;
  probationEnd?: string;
  requiredCredentials: string[];
  systemRole: string;
  onboardingPct: number;
  onboardStatus: OnboardStatus;
  exclusionLastChecked: string;
  exclusionNextDue: string;
  exclusionStatus: ScreeningResult;
  backgroundStatus: ScreeningResult;
  trainingCompliance: number; // %
  supervisionStatus: 'Current' | 'Overdue' | 'N/A';
  nextReviewDate: string;
  nextReviewType: ReviewType;
  credentialAlerts: number;
}

interface ExclusionRecord {
  staffId: string;
  staffName: string;
  role: string;
  oig: { result: ScreeningResult; date: string; by: string };
  sam: { result: ScreeningResult; date: string; by: string };
  stateMedicaid: { result: ScreeningResult; date: string; by: string };
  criminalBG: { result: ScreeningResult; date: string; by: string };
  sexOffender: { result: ScreeningResult; date: string; by: string };
  drugScreen: { result: ScreeningResult; date: string; by: string };
  tbHealth: { result: ScreeningResult; date: string; by: string };
  nextRoutineCheck: string;
  notes?: string;
}

interface PerformanceReview {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  type: ReviewType;
  dueDate: string;
  completedDate?: string;
  status: ReviewStatus;
  reviewer: string;
  metrics: {
    docTimeliness: number;
    caseloadManagement: number;
    trainingCompliance: number;
    supervisionParticipation: number;
    teamworkConduct: number;
    ethicsCompliance: number;
  };
  overallRating?: number;
  employeeComments?: string;
  goals: string[];
  followUpDate?: string;
}

interface OnboardingEmployee {
  id: string;
  name: string;
  title: string;
  startDate: string;
  positionType: 'Clinical' | 'Case Manager' | 'Nurse' | 'BHT' | 'Admin';
  status: OnboardStatus;
  completedTasks: string[];
  pendingTasks: string[];
  blockedOn?: string;
}

interface OffboardingCase {
  id: string;
  name: string;
  title: string;
  lastWorkingDate: string;
  reason: 'Resignation' | 'Termination' | 'Retirement' | 'Contract End';
  initiatedBy: string;
  steps: { label: string; done: boolean; dueDate: string; assignedTo: string }[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'EP-001', name: 'James S. Collins III', title: 'Clinical Supervisor',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'CEO / Executive Director', location: 'Rockville, MD',
    levelOfCare: ['Residential', 'PHP', 'IOP', 'OP'],
    hireDate: '2019-03-15', requiredCredentials: ['CAC-AD', 'BAS (Board Approved Supervisor)'],
    systemRole: 'Clinical Supervisor', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 90, supervisionStatus: 'N/A',
    nextReviewDate: '2026-09-15', nextReviewType: 'Annual', credentialAlerts: 1,
  },
  {
    id: 'EP-002', name: 'Sarah Jenkins', title: 'Primary Counselor',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'James S. Collins III', location: 'Rockville, MD',
    levelOfCare: ['Residential', 'IOP'],
    hireDate: '2022-08-01', requiredCredentials: ['LCPC', 'CAC-AD'],
    systemRole: 'Certified Clinician', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 88, supervisionStatus: 'Current',
    nextReviewDate: '2026-08-01', nextReviewType: 'Annual', credentialAlerts: 1,
  },
  {
    id: 'EP-003', name: 'David Odom', title: 'Primary Counselor',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'James S. Collins III', location: 'Rockville, MD',
    levelOfCare: ['PHP', 'IOP'],
    hireDate: '2023-02-14', requiredCredentials: ['LCADC'],
    systemRole: 'Certified Clinician', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 82, supervisionStatus: 'Current',
    nextReviewDate: '2026-08-14', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-004', name: 'Maria Gonzalez', title: 'Staff Accountant',
    department: 'Administration', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'CEO / Executive Director', location: 'Rockville, MD (HQ)',
    levelOfCare: [],
    hireDate: '2023-01-09', requiredCredentials: ['CPA'],
    systemRole: 'Finance Staff', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 100, supervisionStatus: 'N/A',
    nextReviewDate: '2027-01-09', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-005', name: 'Jessica Torres', title: 'Director of Nursing',
    department: 'Nursing', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'Dr. Robert Chen', location: 'Rockville, MD',
    levelOfCare: ['Residential', 'PHP'],
    hireDate: '2020-11-01', requiredCredentials: ['RN', 'CARN'],
    systemRole: 'Nursing Staff', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 100, supervisionStatus: 'N/A',
    nextReviewDate: '2026-11-01', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-006', name: 'Kevin Wright', title: 'Behavioral Health Technician',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'James S. Collins III', location: 'Rockville, MD',
    levelOfCare: ['Residential'],
    hireDate: '2023-09-18', probationEnd: '2023-12-18',
    requiredCredentials: ['CAC-AD'],
    systemRole: 'BHT', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 58, supervisionStatus: 'Overdue',
    nextReviewDate: '2026-07-28', nextReviewType: 'Annual', credentialAlerts: 1,
  },
  {
    id: 'EP-007', name: 'Aisha Thompson', title: 'Counselor (CSC-AD)',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'James S. Collins III', location: 'Rockville, MD',
    levelOfCare: ['PHP', 'IOP'],
    hireDate: '2024-01-08', probationEnd: '2024-04-08',
    requiredCredentials: ['CSC-AD'],
    systemRole: 'Certified Clinician', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 95, supervisionStatus: 'Current',
    nextReviewDate: '2027-01-08', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-008', name: 'Darnell Hughes', title: 'BHT — New Hire',
    department: 'Clinical', employmentType: 'Full-Time', status: 'Onboarding',
    supervisor: 'Kevin Wright', location: 'Rockville, MD',
    levelOfCare: ['Residential'],
    hireDate: '2026-07-14', probationEnd: '2026-10-14',
    requiredCredentials: ['ADT (in progress)'],
    systemRole: 'BHT', onboardingPct: 62, onboardStatus: 'In Progress',
    exclusionLastChecked: '2026-07-14', exclusionNextDue: '2027-07-14', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 40, supervisionStatus: 'Current',
    nextReviewDate: '2026-08-14', nextReviewType: '30-Day', credentialAlerts: 0,
  },
  {
    id: 'EP-009', name: 'Linda Vance', title: 'Billing & UR Coordinator',
    department: 'Administration', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'CEO / Executive Director', location: 'Rockville, MD',
    levelOfCare: [],
    hireDate: '2021-03-22', requiredCredentials: ['N/A — Administrative'],
    systemRole: 'Billing Staff', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 100, supervisionStatus: 'N/A',
    nextReviewDate: '2026-10-22', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-010', name: 'Marcus Thomas', title: 'Peer Support Specialist (ADT)',
    department: 'Clinical', employmentType: 'Part-Time', status: 'Active',
    supervisor: 'James S. Collins III', location: 'Rockville, MD',
    levelOfCare: ['IOP', 'OP'],
    hireDate: '2024-05-01', requiredCredentials: ['ADT'],
    systemRole: 'Peer Support', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 75, supervisionStatus: 'Current',
    nextReviewDate: '2026-11-01', nextReviewType: 'Annual', credentialAlerts: 0,
  },
  {
    id: 'EP-011', name: 'Renée M. Caldwell', title: 'Director of Human Resources',
    department: 'Administration', employmentType: 'Full-Time', status: 'Active',
    supervisor: 'CEO / Executive Director', location: 'Rockville, MD',
    levelOfCare: [],
    hireDate: '2018-06-11', requiredCredentials: ['SHRM-SCP', 'PHR'],
    systemRole: 'HR Director', onboardingPct: 100, onboardStatus: 'Complete',
    exclusionLastChecked: '2026-01-10', exclusionNextDue: '2027-01-10', exclusionStatus: 'Clear',
    backgroundStatus: 'Clear', trainingCompliance: 100, supervisionStatus: 'N/A',
    nextReviewDate: '2026-12-11', nextReviewType: 'Annual', credentialAlerts: 0,
  },
];

const EXCLUSION_RECORDS: ExclusionRecord[] = EMPLOYEES.map(e => ({
  staffId: e.id,
  staffName: e.name,
  role: e.title,
  oig:         { result: 'Clear' as ScreeningResult, date: e.exclusionLastChecked, by: 'James S. Collins III' },
  sam:         { result: 'Clear' as ScreeningResult, date: e.exclusionLastChecked, by: 'James S. Collins III' },
  stateMedicaid: { result: 'Clear' as ScreeningResult, date: e.exclusionLastChecked, by: 'James S. Collins III' },
  criminalBG:  { result: e.backgroundStatus, date: e.hireDate, by: 'HR / Third-Party Vendor' },
  sexOffender: { result: 'Clear' as ScreeningResult, date: e.hireDate, by: 'HR / Third-Party Vendor' },
  drugScreen:  { result: e.status === 'Onboarding' ? 'Pending' as ScreeningResult : 'Clear' as ScreeningResult, date: e.hireDate, by: 'HR' },
  tbHealth:    { result: e.status === 'Onboarding' ? 'Pending' as ScreeningResult : 'Clear' as ScreeningResult, date: e.hireDate, by: 'HR' },
  nextRoutineCheck: e.exclusionNextDue,
  notes: e.id === 'EP-006'
    ? 'OIG and SAM re-check due 2027-01-10. CAC-AD credential expired — restricted from independent documentation pending renewal.'
    : undefined,
}));

const PERFORMANCE_REVIEWS: PerformanceReview[] = [
  {
    id: 'PR-001', staffId: 'EP-002', staffName: 'Sarah Jenkins', title: 'Primary Counselor',
    type: 'Annual', dueDate: '2026-08-01', status: 'Scheduled', reviewer: 'James S. Collins III',
    metrics: { docTimeliness: 94, caseloadManagement: 88, trainingCompliance: 88, supervisionParticipation: 100, teamworkConduct: 95, ethicsCompliance: 100 },
    goals: ['Complete LCPC renewal by 9/1/2026', 'Achieve 96%+ documentation timeliness Q4', 'Lead one group therapy session per week independently'],
    followUpDate: '2027-02-01',
  },
  {
    id: 'PR-002', staffId: 'EP-006', staffName: 'Kevin Wright', title: 'BHT',
    type: 'Annual', dueDate: '2026-07-28', status: 'Overdue', reviewer: 'James S. Collins III',
    metrics: { docTimeliness: 61, caseloadManagement: 70, trainingCompliance: 58, supervisionParticipation: 50, teamworkConduct: 82, ethicsCompliance: 95 },
    goals: ['Complete overdue training modules by 8/15/2026', 'Achieve 80%+ documentation timeliness', 'CAC-AD renewal submission by 9/1/2026'],
  },
  {
    id: 'PR-003', staffId: 'EP-008', staffName: 'Darnell Hughes', title: 'BHT — New Hire',
    type: '30-Day', dueDate: '2026-08-14', status: 'Scheduled', reviewer: 'Kevin Wright',
    metrics: { docTimeliness: 80, caseloadManagement: 75, trainingCompliance: 40, supervisionParticipation: 100, teamworkConduct: 90, ethicsCompliance: 100 },
    goals: ['Complete all onboarding training by 8/30/2026', 'Shadow 3 individual sessions', 'Enroll in ADT program'],
    followUpDate: '2026-09-14',
  },
  {
    id: 'PR-004', staffId: 'EP-003', staffName: 'David Odom', title: 'Primary Counselor',
    type: 'Annual', dueDate: '2026-08-14', completedDate: undefined, status: 'Scheduled', reviewer: 'James S. Collins III',
    metrics: { docTimeliness: 78, caseloadManagement: 85, trainingCompliance: 82, supervisionParticipation: 88, teamworkConduct: 90, ethicsCompliance: 100 },
    goals: ['Improve documentation timeliness to 88%+', 'Complete Seeking Safety facilitator training', 'Pursue group supervision leadership role'],
    followUpDate: '2027-02-14',
  },
  {
    id: 'PR-005', staffId: 'EP-010', staffName: 'Marcus Thomas', title: 'Peer Support Specialist',
    type: 'Annual', dueDate: '2026-11-01', status: 'Scheduled', reviewer: 'James S. Collins III',
    metrics: { docTimeliness: 90, caseloadManagement: 80, trainingCompliance: 75, supervisionParticipation: 92, teamworkConduct: 98, ethicsCompliance: 100 },
    goals: ['Complete outstanding training modules by 9/1/2026', 'Expand peer contact outreach to alumni program', 'Pursue ADT renewal 60 days prior to expiry'],
  },
  {
    id: 'PR-006', staffId: 'EP-011', staffName: 'Renée M. Caldwell', title: 'Director of Human Resources',
    type: 'Annual', dueDate: '2026-12-11', status: 'Scheduled', reviewer: 'CEO / Executive Director',
    metrics: { docTimeliness: 98, caseloadManagement: 96, trainingCompliance: 100, supervisionParticipation: 100, teamworkConduct: 99, ethicsCompliance: 100 },
    goals: [
      'Complete OIG / exclusion screening automation rollout by Q4 2026',
      'Reduce time-to-onboard for clinical hires to 10 business days',
      'Implement performance review completion tracking dashboard for all supervisors',
      'SHRM-SCP recertification — submit PDC credits by 12/31/2026',
    ],
    followUpDate: '2027-06-11',
  },
];

const ONBOARDING_CASES: OnboardingEmployee[] = [
  {
    id: 'OB-001', name: 'Darnell Hughes', title: 'BHT — New Hire',
    startDate: '2026-07-14', positionType: 'BHT', status: 'In Progress',
    completedTasks: [
      'Offer letter & job description signed',
      'Background & exclusion screening — Clear',
      'I-9 completed',
      'HIPAA training (online)',
      '42 CFR Part 2 training (online)',
      'EHR account created — BHT role',
      'ID badge and keycard issued',
    ],
    pendingTasks: [
      'CPR / First Aid certification',
      'Suicide risk & emergency response training',
      'Mandated reporter training',
      'Clinical documentation training',
      'Crisis de-escalation (CPI) — scheduled 7/29',
      'Cultural humility & trauma-informed care',
      'EHR competency assessment',
      'Clinical shadowing — 8 hours minimum',
      'Supervisor approval for independent work',
    ],
    blockedOn: 'CPI training not yet completed — cannot work unsupervised on residential floor',
  },
];

const OFFBOARDING_CASES: OffboardingCase[] = [
  {
    id: 'OFF-001', name: 'Rachel Kim', title: 'RN (Resigned)',
    lastWorkingDate: '2026-08-08', reason: 'Resignation', initiatedBy: 'James S. Collins III',
    steps: [
      { label: 'EHR access disabled', done: false, dueDate: '2026-08-08', assignedTo: 'IT / StaffAdmin' },
      { label: 'Remote access & VPN revoked', done: false, dueDate: '2026-08-08', assignedTo: 'IT' },
      { label: 'Patient caseload reassigned', done: false, dueDate: '2026-08-05', assignedTo: 'Jessica Torres, RN' },
      { label: 'Unsigned notes & pending co-signs completed', done: false, dueDate: '2026-08-07', assignedTo: 'Rachel Kim (before last day)' },
      { label: 'MAR handoff completed', done: false, dueDate: '2026-08-07', assignedTo: 'Jessica Torres, RN' },
      { label: 'ID badge and keycard returned', done: false, dueDate: '2026-08-08', assignedTo: 'Operations' },
      { label: 'Equipment returned (laptop, phone)', done: false, dueDate: '2026-08-08', assignedTo: 'IT' },
      { label: 'Final payroll notification sent to ADP', done: false, dueDate: '2026-08-09', assignedTo: 'Linda Vance' },
      { label: 'Personnel record retention schedule confirmed', done: false, dueDate: '2026-08-15', assignedTo: 'HR' },
    ],
  },
];

// ─── Status helpers ─────────────────────────────────────────────────────────────

function statusDot(result: ScreeningResult) {
  if (result === 'Clear') return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />;
  if (result === 'Pending') return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />;
  if (result === 'Overdue') return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1.5" />;
}

function reviewStatusChip(s: ReviewStatus) {
  const map: Record<ReviewStatus, string> = {
    'Scheduled': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
    'Overdue': 'bg-red-100 text-red-700',
    'Pending Signature': 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[s]}`}>{s}</span>;
}

function metricBar(val: number) {
  const color = val >= 90 ? 'bg-green-500' : val >= 75 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${val}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-navy w-7 text-right">{val}%</span>
    </div>
  );
}

// ─── Sub-module quick-nav cards ────────────────────────────────────────────────

const SUB_MODULES = [
  { label: 'Credentialing & Licenses', icon: Award, screen: 'CertificationTracker' as Screen, alerts: 4, desc: 'License status · Expiry alerts · CEU tracking · NPI · CAQH' },
  { label: 'Training & LMS', icon: GraduationCap, screen: 'Training' as Screen, alerts: 2, desc: 'Compliance matrix · Scheduled sessions · Policy acknowledgments' },
  { label: 'Clinical Supervision', icon: UserCheck, screen: 'ClinicalSupervision' as Screen, alerts: 1, desc: 'Supervision hours · Session notes · Competency scores · Licensure progress' },
  { label: 'Staff Scheduling', icon: UserCog, screen: 'StaffScheduling' as Screen, alerts: 0, desc: 'Shift coverage · Credential-based restrictions · Census staffing' },
];

const COMP_STANDARDS: Array<Exclude<CompStandard, 'All'>> = [
  'CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy',
];

function ComplianceSparkline({ history }: { history: ScoreHistoryEntry[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const points = history.slice(-8);
  if (points.length < 2) return null;

  const W = 200, H = 36, PAD_X = 6, PAD_Y = 5;
  const scores = points.map(p => p.score);
  const minS = Math.max(0,   Math.min(...scores) - 4);
  const maxS = Math.min(100, Math.max(...scores) + 4);
  const rangeS = maxS - minS || 1;

  const toX = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
  const toY = (s: number)  => (H - PAD_Y) - ((s - minS) / rangeS) * (H - PAD_Y * 2);

  const polyPts = points.map((p, i) => `${toX(i).toFixed(1)},${toY(p.score).toFixed(1)}`).join(' ');

  const hoverEntry = tooltip !== null ? points[tooltip.idx] : null;
  const hoverX = tooltip !== null ? toX(tooltip.idx) : 0;
  const hoverY = tooltip !== null ? toY(points[tooltip.idx].score) : 0;

  return (
    <div className="relative mt-1.5 mb-2" onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 36, overflow: 'visible' }}>
        {/* filled area under line */}
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon
          points={`${toX(0).toFixed(1)},${H} ${polyPts} ${toX(points.length - 1).toFixed(1)},${H}`}
          fill="url(#spark-fill)"
        />
        <polyline
          points={polyPts}
          fill="none" stroke="#22c55e" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)} cy={toY(p.score)}
            r={i === points.length - 1 ? 3.5 : 2.5}
            fill={i === points.length - 1 ? '#22c55e' : '#fff'}
            stroke="#22c55e" strokeWidth="1.5"
            style={{ cursor: 'default' }}
            onMouseEnter={() => setTooltip({ idx: i })}
          />
        ))}
      </svg>
      {hoverEntry && (
        <div
          className="absolute z-20 px-2 py-1 bg-navy text-white text-[10px] font-semibold rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${(hoverX / W) * 100}%`,
            bottom: `calc(${((H - hoverY) / H) * 100}% + 6px)`,
            transform: 'translateX(-50%)',
          }}
        >
          {new Date(hoverEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} — {hoverEntry.score}%
        </div>
      )}
      <div className="flex justify-between text-[9px] text-slate/60 mt-0.5 px-0.5">
        <span>{new Date(points[0].timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
        <span className="text-green-600 font-semibold">
          {points[points.length - 1].score > points[0].score
            ? `▲ +${points[points.length - 1].score - points[0].score} pts`
            : points[points.length - 1].score < points[0].score
              ? `▼ ${points[points.length - 1].score - points[0].score} pts`
              : '—'}
        </span>
        <span>{new Date(points[points.length - 1].timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
      </div>
    </div>
  );
}
function DashboardTab({ navigate, onOpenComplianceStandards, completedIds, evidenceInputs, corrActionInputs, scoreHistory }: {
  navigate: (s: Screen) => void;
  onOpenComplianceStandards: (filter?: Exclude<CompStandard, 'All'>) => void;
  completedIds: Set<string>;
  evidenceInputs: Record<string, string>;
  corrActionInputs: Record<string, string>;
  scoreHistory: ScoreHistoryEntry[];
}) {
  const activeCount = EMPLOYEES.filter(e => e.status === 'Active').length;
  const onboardingCount = EMPLOYEES.filter(e => e.status === 'Onboarding').length;
  const credAlerts = EMPLOYEES.reduce((n, e) => n + e.credentialAlerts, 0);
  const trainingGaps = EMPLOYEES.filter(e => e.trainingCompliance < 80).length;
  const supervisionOverdue = EMPLOYEES.filter(e => e.supervisionStatus === 'Overdue').length;
  const reviewsOverdue = PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue').length;

  const compMet = COMP_REQUIREMENTS.filter(r => reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
  const compTotal = COMP_REQUIREMENTS.length;
  const compScore = Math.round((compMet / compTotal) * 100);
  const compDot = compScore >= 90 ? 'green' : compScore >= 75 ? 'amber' : 'red';
  const compColor = compScore >= 90 ? 'text-green-600' : compScore >= 75 ? 'text-amber-600' : 'text-red-600';

  const kpis: Array<{ label: string; value: string | number; sub: string; color: string; dot: string; detail: string; onClick?: () => void }> = [
    {
      label: 'Compliance Audit Score', value: `${compScore}%`,
      sub: `${compMet} of ${compTotal} requirements met or remediated`,
      color: compColor, dot: compDot,
      detail: '__RINGS__',
      onClick: onOpenComplianceStandards,
    },
    {
      label: 'Active Employees / Contractors', value: `${activeCount} / ${EMPLOYEES.length}`,
      sub: `${onboardingCount} currently onboarding`, color: 'text-navy', dot: 'green',
      detail: 'Full-Time · Part-Time · PRN · Contractor',
    },
    {
      label: 'Credential Expirations', value: credAlerts, sub: 'Expiring within 120 days',
      color: credAlerts > 0 ? 'text-amber-600' : 'text-green-600', dot: credAlerts > 0 ? 'amber' : 'green',
      detail: 'Tap Credentialing to view each expiry and renewal status',
    },
    {
      label: 'Training Compliance Gaps', value: trainingGaps, sub: 'Staff below 80% required completion',
      color: trainingGaps > 1 ? 'text-red-600' : 'text-amber-600', dot: trainingGaps > 1 ? 'red' : 'amber',
      detail: 'Kevin Wright (58%) · Darnell Hughes (40%) · Marcus Thomas (75%)',
    },
    {
      label: 'Overdue Supervision', value: supervisionOverdue, sub: 'Supervisees past due date',
      color: supervisionOverdue > 0 ? 'text-red-600' : 'text-green-600', dot: supervisionOverdue > 0 ? 'red' : 'green',
      detail: 'Kevin Wright — monthly supervision not recorded this period',
    },
    {
      label: 'Exclusion Screening Current', value: '10 / 10', sub: 'OIG + SAM + State Medicaid',
      color: 'text-green-600', dot: 'green',
      detail: 'All staff clear — next routine check: Jan 2027',
    },
    {
      label: 'Background Checks Current', value: '10 / 10', sub: 'Criminal BG + sex-offender registry',
      color: 'text-green-600', dot: 'green',
      detail: 'Rachel Kim new hire check pending (start date: 8/8)',
    },
    {
      label: 'Onboarding Completion', value: `${Math.round(ONBOARDING_CASES.reduce((s, o) => s + (EMPLOYEES.find(e => e.name === o.name)?.onboardingPct ?? 0), 0) / Math.max(ONBOARDING_CASES.length, 1))}%`,
      sub: `${ONBOARDING_CASES.length} employee(s) in progress`,
      color: 'text-amber-600', dot: 'amber',
      detail: 'Darnell Hughes (62%) — blocked on CPI certification',
    },
    {
      label: 'Performance Reviews Due', value: reviewsOverdue, sub: 'Overdue reviews requiring action',
      color: reviewsOverdue > 0 ? 'text-red-600' : 'text-green-600', dot: reviewsOverdue > 0 ? 'red' : 'green',
      detail: 'Kevin Wright annual review overdue — reviewer: James S. Collins III',
    },
    {
      label: 'Staff Outside Verified Scope', value: 0, sub: 'Scheduled outside credential',
      color: 'text-green-600', dot: 'green',
      detail: 'Credential-based schedule check: all current assignments verified',
    },
    {
      label: 'Active Offboarding Tasks', value: OFFBOARDING_CASES.length, sub: 'Pending checklist items',
      color: OFFBOARDING_CASES.length > 0 ? 'text-amber-600' : 'text-green-600',
      dot: OFFBOARDING_CASES.length > 0 ? 'amber' : 'green',
      detail: 'Rachel Kim separation — 9 checklist items outstanding',
    },
    {
      label: 'Vacant Positions', value: 1, sub: 'Open requisitions / unfilled seats',
      color: 'text-amber-600', dot: 'amber',
      detail: 'RN — posted 7/18/2026 · Residential floor coverage gap evenings',
    },
    {
      label: 'Pending Personnel Incidents', value: 0, sub: 'Incidents awaiting HR review',
      color: 'text-green-600', dot: 'green',
      detail: 'No open employee relations cases',
    },
  ];

  const dotColor: Record<string, string> = {
    green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-500',
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-navy">Workforce Compliance Dashboard</h2>
          <span className="text-xs text-slate">As of July 27, 2026 · Rockville, MD</span>
        </div>
        <p className="text-sm text-slate mb-5">Know who is qualified, properly trained, appropriately supervised, correctly scheduled, and authorized to serve clients — before a compliance problem occurs.</p>
        <div id="wc-tour-dashboard" className="grid grid-cols-3 gap-4">
          {kpis.map((kpi, i) => {
            const isRingsCard = kpi.detail === '__RINGS__';
            if (kpi.onClick) {
              return (
                <button key={i} onClick={() => kpi.onClick!()}
                  id={i === 0 ? 'tour-compliance-score-card' : undefined}
                  className="card hover:border-orange/40 hover:bg-orange/5 transition-colors text-left group">
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-xs font-semibold text-slate uppercase tracking-wide leading-tight pr-2 group-hover:text-orange transition-colors">{kpi.label}</div>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${dotColor[kpi.dot]}`} />
                  </div>
                  <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs text-slate mt-0.5 mb-1">{kpi.sub}</div>
                  {isRingsCard && scoreHistory.length >= 2 && (
                    <ComplianceSparkline history={scoreHistory} />
                  )}
                  {isRingsCard ? (
                    <div className="border-t border-border pt-2">
                      <div className="grid grid-cols-6 gap-1" onClick={e => e.stopPropagation()}>
                        {(['CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'] as const).map(std => {
                          const reqs = COMP_REQUIREMENTS.filter(r => r.standard === std);
                          const met  = reqs.filter(r => reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
                          const pct  = reqs.length > 0 ? Math.round((met / reqs.length) * 100) : 100;
                          const col  = pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
                          const R = 14; const C = 16; const circ = 2 * Math.PI * R;
                          return (
                            <button key={std} title={`${std}: ${met}/${reqs.length} (${pct}%) — click to filter`}
                              onClick={e => { e.stopPropagation(); onOpenComplianceStandards(std); }}
                              className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
                              <svg width="32" height="32" viewBox="0 0 32 32">
                                <circle cx={C} cy={C} r={R} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                <circle cx={C} cy={C} r={R} fill="none" stroke={col} strokeWidth="4"
                                  strokeDasharray={`${(met / (reqs.length || 1)) * circ} ${circ}`}
                                  transform={`rotate(-90 ${C} ${C})`}
                                  style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                                <text x={C} y={C + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill={col}>{pct}%</text>
                              </svg>
                              <span className="text-[8px] text-slate text-center leading-none">{STD_SHORT[std]}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[9px] text-slate mt-1.5">Tap a ring to open that framework's requirements</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate border-t border-border pt-2 leading-relaxed">{kpi.detail}</div>
                  )}
                </button>
              );
            }
            return (
              <div key={i} className="card hover:border-orange/30 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide leading-tight pr-2">{kpi.label}</div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${dotColor[kpi.dot]}`} />
                </div>
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate mt-0.5 mb-2">{kpi.sub}</div>
                <div className="text-[10px] text-slate border-t border-border pt-2 leading-relaxed">{kpi.detail}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div id="wc-tour-submodules">
        <h3 className="text-sm font-bold text-navy mb-3">Workforce Sub-Modules</h3>
        <div className="grid grid-cols-4 gap-4">
          {SUB_MODULES.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.label} onClick={() => navigate(m.screen)}
                className="card text-left hover:border-orange/40 hover:bg-orange/5 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center group-hover:bg-orange transition-colors">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {m.alerts > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{m.alerts}</span>
                  )}
                </div>
                <div className="text-sm font-bold text-navy group-hover:text-orange transition-colors">{m.label}</div>
                <div className="text-[10px] text-slate mt-1 leading-relaxed">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-navy mb-3">Payroll & Integration Status <span className="text-[10px] font-normal text-slate ml-2">Phase 2 — integration stubs</span></h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'ADP Workforce Now', status: 'Not Connected', note: 'Send approved hours, position, location, employment status' },
            { name: 'Paychex Flex', status: 'Not Connected', note: 'Receive payroll-status confirmations and PTO balances' },
            { name: 'Gusto', status: 'Not Connected', note: 'Contractor and benefits sync — employee identifiers only' },
          ].map(intg => (
            <div key={intg.name} className="card border-dashed">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-navy">{intg.name}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{intg.status}</span>
              </div>
              <p className="text-[10px] text-slate leading-relaxed">{intg.note}</p>
              <button className="mt-3 text-xs text-orange font-semibold hover:underline">Configure integration →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Employee Profiles Tab ─────────────────────────────────────────────────────

function EmployeeProfilesTab() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const depts = ['All', 'Clinical', 'Medical', 'Nursing', 'Operations', 'Administration'];
  const types: Array<EmploymentType | 'All'> = ['All', 'Full-Time', 'Part-Time', 'PRN', 'Contractor', 'Intern', 'Volunteer'];

  const filtered = EMPLOYEES.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    const matchType = typeFilter === 'All' || e.employmentType === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  const statusChip = (s: EmploymentStatus) => {
    const m: Record<EmploymentStatus, string> = {
      Active: 'bg-green-100 text-green-700',
      Onboarding: 'bg-blue-100 text-blue-700',
      Leave: 'bg-amber-100 text-amber-700',
      Separated: 'bg-gray-100 text-gray-500',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m[s]}`}>{s}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or title…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-orange" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-orange">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-orange">
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(emp => {
          const isExpanded = expandedId === emp.id;
          return (
            <div key={emp.id} className="border border-border rounded-xl overflow-hidden hover:border-orange/30 transition-colors">
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-navy text-sm">{emp.name}</span>
                    {statusChip(emp.status)}
                    <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{emp.employmentType}</span>
                  </div>
                  <div className="text-xs text-slate mt-0.5">{emp.title} · {emp.department} · {emp.location}</div>
                </div>
                <div className="flex gap-6 text-center shrink-0">
                  {emp.credentialAlerts > 0 && (
                    <div><div className="text-sm font-bold text-amber-600">{emp.credentialAlerts}</div><div className="text-[10px] text-slate">Cred Alerts</div></div>
                  )}
                  <div>
                    <div className={`text-sm font-bold ${emp.trainingCompliance < 80 ? 'text-red-600' : 'text-green-600'}`}>{emp.trainingCompliance}%</div>
                    <div className="text-[10px] text-slate">Training</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${emp.supervisionStatus === 'Overdue' ? 'text-red-600' : emp.supervisionStatus === 'N/A' ? 'text-slate' : 'text-green-600'}`}>{emp.supervisionStatus}</div>
                    <div className="text-[10px] text-slate">Supervision</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate self-center" /> : <ChevronDown className="w-4 h-4 text-slate self-center" />}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 bg-gray-50 grid grid-cols-3 gap-6 text-xs">
                  <div className="space-y-3">
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Employment</div>
                      <div className="space-y-0.5 text-navy">
                        <div><span className="text-slate">Type:</span> {emp.employmentType}</div>
                        <div><span className="text-slate">Hire Date:</span> {emp.hireDate}</div>
                        {emp.probationEnd && <div><span className="text-slate">Probation End:</span> {emp.probationEnd}</div>}
                        <div><span className="text-slate">Supervisor:</span> {emp.supervisor}</div>
                        <div><span className="text-slate">System Role:</span> {emp.systemRole}</div>
                      </div>
                    </div>
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Location & Levels of Care</div>
                      <div className="text-navy">{emp.location}</div>
                      {emp.levelOfCare.length > 0
                        ? <div className="flex flex-wrap gap-1 mt-1">{emp.levelOfCare.map(l => <span key={l} className="text-[10px] bg-navy/10 text-navy px-1.5 py-0.5 rounded">{l}</span>)}</div>
                        : <div className="text-slate">Administrative — no direct LOC</div>
                      }
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Required Credentials</div>
                      <div className="space-y-0.5">
                        {emp.requiredCredentials.map(c => <div key={c} className="text-navy">• {c}</div>)}
                      </div>
                    </div>
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Screening Status</div>
                      <div className="space-y-0.5 text-navy">
                        <div className="flex items-center">{statusDot(emp.exclusionStatus)}<span>Exclusion check: {emp.exclusionLastChecked}</span></div>
                        <div className="flex items-center">{statusDot(emp.backgroundStatus)}<span>Background check: {emp.hireDate}</span></div>
                        <div className="text-slate">Next routine: {emp.exclusionNextDue}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Next Performance Review</div>
                      <div className="text-navy">{emp.nextReviewType} — due {emp.nextReviewDate}</div>
                      <div className="text-slate">Reviewer: {emp.supervisor}</div>
                    </div>
                    <div><div className="text-[10px] font-semibold text-slate uppercase mb-1">Compliance Summary</div>
                      <div className="space-y-1.5">
                        <div><div className="text-slate mb-0.5">Training {emp.trainingCompliance}%</div>{metricBar(emp.trainingCompliance)}</div>
                        <div><div className="text-slate mb-0.5">Onboarding {emp.onboardingPct}%</div>{metricBar(emp.onboardingPct)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exclusion & Screening Tab ─────────────────────────────────────────────────

const SCREENING_COLS: Array<{ key: keyof Omit<ExclusionRecord, 'staffId' | 'staffName' | 'role' | 'nextRoutineCheck' | 'notes'>; label: string }> = [
  { key: 'oig',          label: 'HHS-OIG' },
  { key: 'sam',          label: 'SAM.gov' },
  { key: 'stateMedicaid',label: 'State Medicaid' },
  { key: 'criminalBG',   label: 'Criminal BG' },
  { key: 'sexOffender',  label: 'Sex Offender' },
  { key: 'drugScreen',   label: 'Drug Screen' },
  { key: 'tbHealth',     label: 'TB / Health' },
];

function ExclusionTab({ readOnly }: { readOnly?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate max-w-2xl">
            Healthcare organizations must routinely screen employees, contractors, interns, and volunteers against the OIG exclusion list. Employing an excluded individual creates civil monetary-penalty exposure. SunriseOS tracks each check with source, date, and responsible reviewer.
          </p>
        </div>
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shrink-0 ml-4">
          <Plus className="w-3.5 h-3.5" />Run Screening
        </LockedButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-slate">
              <th className="text-left py-2.5 pr-4 font-semibold uppercase text-[10px] tracking-wide">Staff Member</th>
              {SCREENING_COLS.map(c => (
                <th key={c.key} className="text-center px-2 py-2.5 font-semibold uppercase text-[10px] tracking-wide">{c.label}</th>
              ))}
              <th className="text-left px-2 py-2.5 font-semibold uppercase text-[10px] tracking-wide">Next Check</th>
            </tr>
          </thead>
          <tbody>
            {EXCLUSION_RECORDS.map(rec => (
              <tr key={rec.staffId} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="py-2.5 pr-4">
                  <div className="font-semibold text-navy">{rec.staffName}</div>
                  <div className="text-slate">{rec.role}</div>
                </td>
                {SCREENING_COLS.map(c => {
                  const field = rec[c.key] as { result: ScreeningResult; date: string; by: string };
                  return (
                    <td key={c.key} className="text-center px-2 py-2.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center justify-center">{statusDot(field.result)}</div>
                        <div className={`text-[9px] font-medium ${field.result === 'Clear' ? 'text-green-700' : field.result === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                          {field.result}
                        </div>
                        <div className="text-slate text-[9px]">{field.date}</div>
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-2.5 text-navy font-medium">{rec.nextRoutineCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
        <div className="font-bold mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />OIG Exclusion Compliance Reminder</div>
        <p>CMS requires ongoing OIG and SAM.gov checks — not just at hire. SunriseOS recommends monthly re-checks for all billable staff and quarterly for volunteers and non-billing contractors. Employing an excluded individual can result in civil monetary penalties up to $20,000 per item of false claim plus three times the amount claimed. <span className="underline cursor-pointer">HHS-OIG Exclusions Program guidance →</span></p>
      </div>
    </div>
  );
}

// ─── Onboarding Tab ────────────────────────────────────────────────────────────

const CLINICAL_ONBOARDING_TEMPLATE = [
  'Offer letter & job description signed', 'Background & exclusion screening',
  'License verification', 'I-9 completed', 'Confidentiality agreement',
  'HIPAA training', '42 CFR Part 2 training', 'Clinical documentation training',
  'ASAM criteria training', 'Suicide risk & emergency response training',
  'Mandated reporter training', 'Cultural humility & trauma-informed care',
  'EHR competency assessment', 'Clinical shadowing (8 hrs minimum)',
  'Supervisor approval — independent work authorization',
];

function OnboardingTab({ readOnly }: { readOnly?: boolean }) {
  const [showTemplate, setShowTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">Each position has a configurable onboarding pathway. Independent work is blocked until all required items are approved by the designated supervisor.</p>
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" />New Onboardee
        </LockedButton>
      </div>

      {ONBOARDING_CASES.map(ob => {
        const total = ob.completedTasks.length + ob.pendingTasks.length;
        const pct = Math.round((ob.completedTasks.length / total) * 100);
        return (
          <div key={ob.id} className="card border-l-4 border-l-orange">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-navy">{ob.name}</div>
                <div className="text-xs text-slate">{ob.title} · Started {ob.startDate}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy">{pct}%</div>
                <div className="text-[10px] text-slate">Complete</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-orange h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {ob.blockedOn && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span><strong>Blocked:</strong> {ob.blockedOn}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-semibold text-slate uppercase mb-2">Completed ({ob.completedTasks.length})</div>
                <div className="space-y-1">
                  {ob.completedTasks.map(t => (
                    <div key={t} className="flex items-start gap-1.5 text-green-700">
                      <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" /><span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate uppercase mb-2">Pending ({ob.pendingTasks.length})</div>
                <div className="space-y-1">
                  {ob.pendingTasks.map(t => (
                    <div key={t} className="flex items-start gap-1.5 text-amber-700">
                      <Clock className="w-3 h-3 shrink-0 mt-0.5" /><span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="card">
        <button onClick={() => setShowTemplate(showTemplate ? null : 'clinical')} className="flex items-center justify-between w-full">
          <div className="text-sm font-bold text-navy">Onboarding Pathway Templates</div>
          {showTemplate ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
        </button>
        {showTemplate && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] font-semibold text-slate uppercase mb-2">Clinical Employee Template</div>
              <div className="space-y-1">
                {CLINICAL_ONBOARDING_TEMPLATE.map((t, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-navy">
                    <ClipboardList className="w-3 h-3 shrink-0 mt-0.5 text-slate" /><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate uppercase mb-2">Position Types with Distinct Pathways</div>
              <div className="space-y-1 text-navy">
                {['Clinical Employee (counselors, therapists)', 'Medical Staff (physicians, nurses, prescribers)', 'Case Manager', 'Behavioral Health Technician', 'Peer Support Specialist (ADT)', 'Administrative Staff', 'Contractor', 'Intern / Student Trainee', 'Volunteer'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-slate shrink-0" /><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance Reviews Tab ────────────────────────────────────────────────────

function PerformanceTab({ readOnly }: { readOnly?: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const overdue = PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue');
  const upcoming = PERFORMANCE_REVIEWS.filter(r => r.status === 'Scheduled');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
          {[
            { label: 'Scheduled', value: upcoming.length, color: 'text-blue-600' },
            { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? 'text-red-600' : 'text-green-600' },
            { label: 'Total Reviews', value: PERFORMANCE_REVIEWS.length, color: 'text-navy' },
          ].map(k => (
            <div key={k.label} className="card py-3">
              <div className="text-xs text-slate font-semibold uppercase">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" />New Review
        </LockedButton>
      </div>

      <div className="space-y-3">
        {PERFORMANCE_REVIEWS.map(rev => {
          const isExpanded = expandedId === rev.id;
          const overallAvg = Math.round(Object.values(rev.metrics).reduce((s, v) => s + v, 0) / Object.values(rev.metrics).length);
          return (
            <div key={rev.id} className="border border-border rounded-xl overflow-hidden hover:border-orange/30 transition-colors">
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rev.id)}>
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {rev.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy text-sm">{rev.staffName}</span>
                    <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{rev.type}</span>
                    {reviewStatusChip(rev.status)}
                  </div>
                  <div className="text-xs text-slate mt-0.5">{rev.title} · Due: {rev.dueDate} · Reviewer: {rev.reviewer}</div>
                </div>
                <div className="flex gap-4 items-center shrink-0">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${overallAvg >= 90 ? 'text-green-600' : overallAvg >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{overallAvg}%</div>
                    <div className="text-[10px] text-slate">Avg Score</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 bg-gray-50 grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] font-semibold text-slate uppercase mb-3">Performance Metrics</div>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'Documentation Timeliness', val: rev.metrics.docTimeliness },
                        { label: 'Caseload Management', val: rev.metrics.caseloadManagement },
                        { label: 'Training Compliance', val: rev.metrics.trainingCompliance },
                        { label: 'Supervision Participation', val: rev.metrics.supervisionParticipation },
                        { label: 'Teamwork & Conduct', val: rev.metrics.teamworkConduct },
                        { label: 'Ethics Compliance', val: rev.metrics.ethicsCompliance },
                      ].map(m => (
                        <div key={m.label}>
                          <div className="text-slate mb-0.5">{m.label}</div>
                          {metricBar(m.val)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-semibold text-slate uppercase mb-2">Goals & Development</div>
                      <div className="space-y-1 text-xs text-navy">
                        {rev.goals.map((g, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <Star className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" /><span>{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {rev.followUpDate && (
                      <div>
                        <div className="text-[10px] font-semibold text-slate uppercase mb-1">Follow-up Review</div>
                        <div className="text-xs text-navy">{rev.followUpDate}</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <LockedButton locked={readOnly} onClick={() => {}} className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />Complete Review
                      </LockedButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="text-sm font-bold text-navy mb-2">Review Cadence & Types</div>
        <div className="grid grid-cols-3 gap-3 text-xs text-navy">
          {[
            { type: '30 / 60 / 90-Day', desc: 'New hire check-ins during probationary period. Required for all full-time and part-time staff.' },
            { type: 'Annual Evaluation', desc: 'Comprehensive performance, competency, and goals review. Completed by direct supervisor.' },
            { type: 'Performance Improvement Plan', desc: 'Structured corrective plan with measurable goals, timelines, and consequences. HR oversight required.' },
          ].map(t => (
            <div key={t.type} className="bg-gray-50 rounded-lg p-3 border border-border">
              <div className="font-semibold text-navy mb-1">{t.type}</div>
              <div className="text-slate text-[10px] leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-slate border-t border-border pt-3">
          <strong>AI Policy:</strong> SunriseOS AI may summarize verified information or identify missing requirements, but a human must review every employment decision. AI does not discipline, rank, terminate, or deny promotion automatically.
        </div>
      </div>
    </div>
  );
}

// ─── Offboarding Tab ───────────────────────────────────────────────────────────

function OffboardingTab({ readOnly }: { readOnly?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate max-w-2xl">
          Offboarding connects directly to SunriseOS security. EHR access, remote access, caseload, and documentation obligations must be resolved before the last working date.
          Personnel records are preserved under the applicable HIPAA and EEOC retention schedule.
        </p>
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shrink-0 ml-4">
          <Plus className="w-3.5 h-3.5" />New Separation
        </LockedButton>
      </div>

      {OFFBOARDING_CASES.map(ob => {
        const done = ob.steps.filter(s => s.done).length;
        const total = ob.steps.length;
        const pct = Math.round((done / total) * 100);
        return (
          <div key={ob.id} className="card border-l-4 border-l-red-400">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-navy">{ob.name}</div>
                <div className="text-xs text-slate">{ob.title} · {ob.reason} · Last day: {ob.lastWorkingDate}</div>
                <div className="text-xs text-slate">Initiated by: {ob.initiatedBy}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy">{pct}%</div>
                <div className="text-[10px] text-slate">{done}/{total} steps</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-2">
              {ob.steps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 text-xs p-2.5 rounded-lg border ${step.done ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                  {step.done
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                    : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className={`font-medium ${step.done ? 'text-green-800 line-through' : 'text-amber-800'}`}>{step.label}</div>
                    <div className="text-slate">Due: {step.dueDate} · {step.assignedTo}</div>
                  </div>
                  {!step.done && (
                    <LockedButton locked={readOnly} onClick={() => {}} className="text-[10px] bg-white border border-amber-300 text-amber-700 px-2 py-1 rounded hover:bg-amber-50 shrink-0">
                      Mark done
                    </LockedButton>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="card">
        <div className="text-sm font-bold text-navy mb-3">Retention Schedule Reference</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { doc: 'I-9 Records', rule: '3 years from hire OR 1 year after employment ends — whichever is later (USCIS)' },
            { doc: 'Personnel File', rule: '7 years after separation (general EEOC / state guidance)' },
            { doc: 'Medical / Accommodation Records', rule: 'Separate from personnel file — 3 years minimum (ADA)' },
            { doc: 'Payroll Records', rule: '3 years (FLSA) · 4 years (IRS)' },
            { doc: 'Training & Supervision Records', rule: '6 years recommended (HIPAA compliance audit window)' },
            { doc: 'Background Check Documentation', rule: '5 years (FCRA consumer report records)' },
          ].map(r => (
            <div key={r.doc} className="bg-gray-50 border border-border rounded-lg p-2.5">
              <div className="font-semibold text-navy mb-0.5">{r.doc}</div>
              <div className="text-slate text-[10px] leading-relaxed">{r.rule}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compliance Standards Tab ──────────────────────────────────────────────────

type CompStandard = 'All' | 'CARF' | 'HIPAA' | '42 CFR Part 2' | 'State (MD OHCQ)' | 'Medicaid' | 'Internal Policy';

interface CompRequirement {
  id: string;
  standard: Exclude<CompStandard, 'All'>;
  category: string;
  requirement: string;
  frequency: string;
  status: 'Met' | 'Partial' | 'Gap' | 'N/A';
  dueDate?: string;
}

const COMP_REQUIREMENTS: CompRequirement[] = [
  { id: 'CR-001', standard: 'CARF', category: 'Access to Services', requirement: 'Written access to services policy with eligibility criteria and referral processes', frequency: 'Annual review', status: 'Met', dueDate: '2026-12-01' },
  { id: 'CR-002', standard: 'CARF', category: 'Clinical Records', requirement: 'Individual service plan present for all clients within 30 days of admission', frequency: 'Per admission', status: 'Met' },
  { id: 'CR-003', standard: 'CARF', category: 'Human Resources', requirement: 'Written job descriptions for all positions with required qualifications', frequency: 'Annual review', status: 'Met', dueDate: '2026-12-01' },
  { id: 'CR-004', standard: 'CARF', category: 'Quality Improvement', requirement: 'Annual performance measurement plan with documented QAPI projects', frequency: 'Annual', status: 'Partial', dueDate: '2026-11-01' },
  { id: 'CR-005', standard: 'CARF', category: 'Rights & Responsibilities', requirement: 'Client rights and responsibilities document provided at admission and signed', frequency: 'Per admission', status: 'Met' },
  { id: 'CR-006', standard: 'HIPAA', category: 'Privacy Rule', requirement: 'Notice of Privacy Practices (NPP) provided to every patient at intake', frequency: 'Per admission', status: 'Met' },
  { id: 'CR-007', standard: 'HIPAA', category: 'Security Rule', requirement: 'Annual HIPAA security risk assessment completed and documented', frequency: 'Annual', status: 'Partial', dueDate: '2026-09-01' },
  { id: 'CR-008', standard: 'HIPAA', category: 'Training', requirement: 'All staff complete HIPAA training within 30 days of hire and annually', frequency: 'Annual', status: 'Met' },
  { id: 'CR-009', standard: 'HIPAA', category: 'Breach Notification', requirement: 'Breach notification policy and designated HIPAA Privacy Officer in place', frequency: 'Ongoing', status: 'Met' },
  { id: 'CR-010', standard: '42 CFR Part 2', category: 'Confidentiality', requirement: 'Written consent for disclosure of SUD records separate from HIPAA consent', frequency: 'Per disclosure', status: 'Met' },
  { id: 'CR-011', standard: '42 CFR Part 2', category: 'Records Security', requirement: 'SUD treatment records stored separately with additional access controls', frequency: 'Ongoing', status: 'Met' },
  { id: 'CR-012', standard: '42 CFR Part 2', category: 'Staff Training', requirement: 'All clinical staff trained on 42 CFR Part 2 vs. HIPAA distinctions', frequency: 'Annual', status: 'Partial', dueDate: '2026-08-15' },
  { id: 'CR-013', standard: 'State (MD OHCQ)', category: 'Licensing', requirement: 'Residential and PHP/IOP programs licensed annually by MD BHBIS / OHCQ', frequency: 'Annual renewal', status: 'Met', dueDate: '2027-01-31' },
  { id: 'CR-014', standard: 'State (MD OHCQ)', category: 'Incident Reporting', requirement: 'Critical incidents reported to OHCQ within 24 hours of occurrence', frequency: 'Per incident', status: 'Met' },
  { id: 'CR-015', standard: 'State (MD OHCQ)', category: 'Staffing', requirement: 'Minimum staffing ratios maintained per MD OHCQ COMAR 10.47 requirements', frequency: 'Ongoing', status: 'Met' },
  { id: 'CR-016', standard: 'Medicaid', category: 'Enrollment', requirement: 'All billing providers enrolled in Maryland Medicaid with current NPIs', frequency: 'Annual / change events', status: 'Met' },
  { id: 'CR-017', standard: 'Medicaid', category: 'Prior Authorization', requirement: 'Prior authorization obtained before rendering billable Level of Care services', frequency: 'Per admission', status: 'Partial', dueDate: '2026-08-01' },
  { id: 'CR-018', standard: 'Medicaid', category: 'Documentation', requirement: 'All Medicaid-billable services documented within 24 hours per billing standards', frequency: 'Per service', status: 'Partial', dueDate: '2026-08-01' },
  { id: 'CR-019', standard: 'Internal Policy', category: 'HR', requirement: 'Annual performance reviews completed for all staff on anniversary dates', frequency: 'Annual per employee', status: 'Gap', dueDate: '2026-08-14' },
  { id: 'CR-020', standard: 'Internal Policy', category: 'Clinical', requirement: 'Group therapy sessions documented with attendance and participation notes', frequency: 'Per session', status: 'Met' },
];

const STATUS_CHIP: Record<CompRequirement['status'], string> = {
  Met: 'bg-green-100 text-green-700',
  Partial: 'bg-amber-100 text-amber-700',
  Gap: 'bg-red-100 text-red-700',
  'N/A': 'bg-gray-100 text-gray-500',
};

/**
 * A requirement counts toward the "met" total when:
 *   (a) its base status is 'Met', or
 *   (b) the officer manually marked it via completedIds, or
 *   (c) the officer linked evidence AND saved a corrective action plan —
 *       indicating substantive remediation work has been done.
 */
function reqIsEffectivelyMet(
  req: CompRequirement,
  completedIds: Set<string>,
  evidence: Record<string, string>,
  corrAction: Record<string, string>,
): boolean {
  return (
    req.status === 'Met' ||
    completedIds.has(req.id) ||
    (!!evidence[req.id]?.trim() && !!corrAction[req.id]?.trim())
  );
}

const STD_SHORT: Record<Exclude<CompStandard, 'All'>, string> = {
  'CARF': 'CARF',
  'HIPAA': 'HIPAA',
  '42 CFR Part 2': '42 CFR §2',
  'State (MD OHCQ)': 'MD OHCQ',
  'Medicaid': 'Medicaid',
  'Internal Policy': 'Internal',
};

function ComplianceStandardsTab({ readOnly, completedIds, setCompletedIds, evidenceInputs, setEvidenceInputs, corrActionInputs, setCorrActionInputs, ownerInputs, setOwnerInputs, requestedStdFilter, onRequestedFilterApplied, auditLog, addAuditEntry, clearAuditLog, requestedReqId, appendScoreHistory, rollbackScoreHistory, onDemoDataCleared, onAuditCycleStarted, onAuditCycleReset, isTourActive, storageQuotaFull, onQuotaFlagCleared }: {
  readOnly?: boolean;
  completedIds: Set<string>;
  setCompletedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  evidenceInputs: Record<string, string>;
  setEvidenceInputs: (next: Record<string, string>) => void;
  corrActionInputs: Record<string, string>;
  setCorrActionInputs: (next: Record<string, string>) => void;
  ownerInputs: Record<string, string>;
  setOwnerInputs: (next: Record<string, string>) => void;
  requestedStdFilter?: Exclude<CompStandard, 'All'> | null;
  onRequestedFilterApplied?: () => void;
  auditLog: AuditLogEntry[];
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearAuditLog: () => void;
  requestedReqId?: string | null;
  appendScoreHistory: (ids: Set<string>, evidence: Record<string, string>, corrAction: Record<string, string>) => void;
  /** Removes score-history entries added on or after the given ISO timestamp, rolling back phantom sparkline points. */
  rollbackScoreHistory?: () => void;
  onDemoDataCleared?: () => void;
  /** Called when a reset is confirmed so the parent can hide the "Load Sample Audit" CTA. */
  onAuditCycleStarted?: () => void;
  /** Called when the last Met mark is undone (completedIds drops to 0) so the parent can restore the "Load Sample Audit" CTA. */
  onAuditCycleReset?: () => void;
  /** When true, add id="tour-first-gap-row" to the first non-met requirement row */
  isTourActive?: boolean;
  /** #685 — true when the last localStorage write hit a quota error; triggers auto-scroll + export highlight */
  storageQuotaFull?: boolean;
  /** Called once the highlight has been acknowledged (user clicks an export button) */
  onQuotaFlagCleared?: () => void;
}) {
  // #565 — persist filter selection across tab switches
  const [stdFilter, setStdFilterRaw] = useState<CompStandard>(() => {
    try { return (localStorage.getItem(COMPLIANCE_STD_FILTER_KEY) as CompStandard) || 'All'; } catch { return 'All'; }
  });
  const setStdFilter = (v: CompStandard) => {
    setStdFilterRaw(v);
    safeSet(COMPLIANCE_STD_FILTER_KEY, v);
  };
  const [gapFilter, setGapFilterRaw] = useState<'All' | 'Needs Evidence' | 'Needs Action Plan' | 'Both Missing'>(() => {
    try { return (localStorage.getItem(COMPLIANCE_GAP_FILTER_KEY) as 'All' | 'Needs Evidence' | 'Needs Action Plan' | 'Both Missing') || 'All'; } catch { return 'All'; }
  });
  const setGapFilter = (v: 'All' | 'Needs Evidence' | 'Needs Action Plan' | 'Both Missing') => {
    setGapFilterRaw(v);
    safeSet(COMPLIANCE_GAP_FILTER_KEY, v);
  };

  // #581 — apply filter requested from Dashboard ring click
  useEffect(() => {
    if (requestedStdFilter) { setStdFilter(requestedStdFilter); onRequestedFilterApplied?.(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedStdFilter]);

  // #591 — deep-link: auto-expand and scroll to a specific requirement on mount
  useEffect(() => {
    if (!requestedReqId) return;
    const req = COMP_REQUIREMENTS.find(r => r.id === requestedReqId);
    if (!req) return;
    // Ensure the row is visible by aligning filters to include it
    setStdFilter(req.standard as CompStandard);
    setGapFilter('All');
    setSelectedReq(requestedReqId);
    // Scroll to the row after React has rendered the expanded state
    const timer = setTimeout(() => {
      document.getElementById(`comp-req-${requestedReqId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [exportToast, setExportToast] = useState<number | false>(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditFilter, setAuditFilter] = useState<AuditActionType | 'All'>('All');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvExportError, setCsvExportError] = useState(false);

  // Collapse the audit trail automatically whenever the log is empty (e.g. after a reset)
  useEffect(() => {
    if (auditLog.length === 0) setShowAuditTrail(false);
  }, [auditLog.length]);

  // #685 — ref for the audit trail container so we can scroll to it
  const auditTrailRef = useRef<HTMLDivElement>(null);

  // #685 — when a storage-quota warning fires, expand the audit trail and scroll to it
  useEffect(() => {
    if (!storageQuotaFull) return;
    setShowAuditTrail(true);
    const timer = setTimeout(() => {
      auditTrailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [storageQuotaFull]);

  // #597 — audit reset log
  const { currentStaff } = useAuth();
  interface ResetLogEntry { userName: string; timestamp: string; action: 'AUDIT_RESET' }
  const [lastResetEntry, setLastResetEntry] = useState<ResetLogEntry | null>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_AUDIT_RESET_LOG_KEY);
      return stored ? (JSON.parse(stored) as ResetLogEntry) : null;
    } catch { return null; }
  });

  // #589 — free-text "Other" owner mode per requirement
  const EMPLOYEE_NAMES = new Set(EMPLOYEES.filter(e => e.status !== 'Separated').map(e => e.name));
  const [otherOwnerMode, setOtherOwnerMode] = useState<Set<string>>(() => {
    // otherOwnerMode is a *transient* session Set — it starts empty on every page load.
    // That is intentional: free-text owner names survive a reload via ownerInputs, which is
    // persisted to localStorage. The second branch of isOtherMode (below) re-derives "Other"
    // state from the stored value at runtime, so this Set only needs to track selections made
    // during the current session (e.g. when the user picks "Other (type a name)…" and hasn't
    // typed anything yet). Do NOT replace this empty initialiser with a localStorage read —
    // isOtherMode already handles the reload case correctly.
    return new Set<string>();
  });
  // isOtherMode returns true when either:
  //   (a) the officer chose "Other (type a name)…" during this session (transient Set), OR
  //   (b) the persisted ownerInput value is non-empty and not in the known employee list.
  // Branch (b) is what makes free-text owner names survive a full page reload: ownerInputs is
  // loaded from localStorage on mount, so any previously typed name reactivates the text input
  // automatically without needing otherOwnerMode to be persisted. Guard against removing branch
  // (b) — doing so would silently break reload persistence even though the value is still saved.
  const isOtherMode = (reqId: string) =>
    otherOwnerMode.has(reqId) ||
    (!!(ownerInputs[reqId]?.trim()) && !EMPLOYEE_NAMES.has(ownerInputs[reqId]));

  const doExportGapListCsv = () => {
    // Only export requirements that are NOT effectively met — i.e. true open gaps
    const gaps = COMP_REQUIREMENTS.filter(r => {
      if (stdFilter !== 'All' && r.standard !== stdFilter) return false;
      return !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs);
    });

    if (gaps.length === 0) {
      alert('No open gaps to export' + (stdFilter !== 'All' ? ` for ${stdFilter}` : '') + '. All requirements are currently met or remediated.');
      return;
    }

    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = ['ID', 'Standard', 'Category', 'Requirement', 'Status', 'Due Date', 'Evidence Filed', 'Corrective Plan Filed', 'Owner'];
    const rows = gaps.map(r => [
      escape(r.id),
      escape(r.standard),
      escape(r.category),
      escape(r.requirement),
      escape(r.status),
      escape(r.dueDate ?? ''),
      escape(evidenceInputs[r.id]?.trim() ? 'Yes' : 'No'),
      escape(corrActionInputs[r.id]?.trim() ? 'Yes' : 'No'),
      escape(ownerInputs[r.id]?.trim() ?? ''),
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const scopeLabel = stdFilter !== 'All' ? `-${stdFilter.replace(/[^a-zA-Z0-9]/g, '')}` : '';
    a.href = url;
    a.download = `compliance-gap-list${scopeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportToast(gaps.length);
    setTimeout(() => setExportToast(false), 2500);
  };

  const exportGapListCsv = () => {
    // Check for unsaved evidence/corrective-action text AND for evidence that was
    // previously saved but has since been cleared without being re-linked.
    let unsavedCount = 0;
    let clearedCount = 0;
    const clearedIds: Array<{ id: string; title: string }> = [];
    const unsavedIds: Array<{ id: string; title: string }> = [];
    COMP_REQUIREMENTS.forEach(r => {
      if (stdFilter !== 'All' && r.standard !== stdFilter) return;
      if ((!!evidenceInputs[r.id]?.trim() && !evidenceConfirmed.has(r.id)) ||
          (!!corrActionInputs[r.id]?.trim() && !corrConfirmed.has(r.id))) {
        unsavedCount++;
        unsavedIds.push({ id: r.id, title: r.requirement });
      }
      if (evidenceCleared.has(r.id) || corrCleared.has(r.id)) {
        clearedCount++;
        clearedIds.push({ id: r.id, title: r.requirement });
      }
    });

    if (unsavedCount > 0 || clearedCount > 0) {
      setShowUnsavedExportWarn({ unsaved: unsavedCount, cleared: clearedCount, clearedIds, unsavedIds, action: 'csv', onContinue: doExportGapListCsv });
      return;
    }
    doExportGapListCsv();
  };

  const printGapList = (overrideStd?: Exclude<CompStandard, 'All'>) => {
    const activeStd: CompStandard = overrideStd ?? stdFilter;

    // Wrap the actual print body so it can be reused by the bypass path in the
    // unsaved-export warning modal.
    const doPrint = () => {
      const gaps = COMP_REQUIREMENTS.filter(r => {
        if (activeStd !== 'All' && r.standard !== activeStd) return false;
        return !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs);
      });

    const scopeLabel = activeStd !== 'All' ? ` — ${activeStd}` : '';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // #591 — Build deep-link URL so each QR code lands directly on that requirement row
    const appBase = window.location.href.split('#')[0];
    const deepLinkUrl = (reqId: string) =>
      `${appBase}#WorkforceCompliance?req=${encodeURIComponent(reqId)}`;

    const rows = gaps.map(r => {
      const evidFiled = evidenceInputs[r.id]?.trim() ? `Yes — ${evidenceInputs[r.id].trim()}` : 'No';
      const corrFiled = corrActionInputs[r.id]?.trim() ? `Yes — ${corrActionInputs[r.id].trim()}` : 'No';
      const statusColor = r.status === 'Gap' ? '#dc2626' : r.status === 'Partial' ? '#d97706' : '#1e3a5f';
      const url = deepLinkUrl(r.id);
      const qrSrc = `https://chart.googleapis.com/chart?chs=72x72&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8`;
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;font-weight:600;white-space:nowrap;">${r.id}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;white-space:nowrap;">${r.standard}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;white-space:nowrap;">${r.category}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;line-height:1.4;">${r.requirement}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;white-space:nowrap;">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:${r.status === 'Gap' ? '#fee2e2' : r.status === 'Partial' ? '#fef3c7' : '#f1f5f9'};color:${statusColor};">${r.status}</span>
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;white-space:nowrap;text-align:center;">${r.dueDate ?? '—'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:${evidenceInputs[r.id]?.trim() ? '#15803d' : '#94a3b8'};">${evidFiled}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:${corrActionInputs[r.id]?.trim() ? '#15803d' : '#94a3b8'};">${corrFiled}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;">${ownerInputs[r.id] ?? '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;vertical-align:middle;">
            <img src="${qrSrc}" width="64" height="64" alt="Open ${r.id} in app" style="display:block;margin:0 auto 3px;" />
            <div style="font-size:8px;color:#94a3b8;word-break:break-all;max-width:80px;line-height:1.2;">${r.id}</div>
          </td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Compliance Gap List${scopeLabel} — Sunrise Recovery Center</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; padding: 32px 40px; }
    @media print {
      body { padding: 20px 28px; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm 1.8cm; size: landscape; }
    }
    header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #f97316; padding-bottom: 14px; margin-bottom: 18px; }
    .org-name { font-size: 18px; font-weight: 800; color: #1e3a5f; }
    .report-title { font-size: 13px; font-weight: 600; color: #f97316; margin-top: 3px; }
    .meta { font-size: 11px; color: #64748b; margin-top: 2px; }
    .header-right { text-align: right; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
    .stat-bar { display: flex; gap: 24px; margin-bottom: 18px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .stat { text-align: center; }
    .stat-val { font-size: 22px; font-weight: 800; }
    .stat-lbl { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead { background: #1e3a5f; color: #fff; }
    thead th { padding: 10px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; text-align: left; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #fff7ed; }
    footer { margin-top: 22px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
    .print-btn { margin-bottom: 18px; padding: 10px 22px; background: #1e3a5f; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .print-btn:hover { background: #f97316; }
    .qr-note { margin-bottom: 14px; font-size: 11px; color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print / Save as PDF</button>
  <header>
    <div>
      <div class="org-name">Sunrise Recovery Center</div>
      <div class="report-title">Compliance Gap List${scopeLabel}</div>
      <div class="meta">Rockville, MD &nbsp;·&nbsp; Generated ${today} &nbsp;·&nbsp; CONFIDENTIAL — For Internal Use Only</div>
    </div>
    <div class="header-right">
      <div class="meta" style="font-size:12px;font-weight:700;color:#1e3a5f;">Open Gaps</div>
      <div style="font-size:32px;font-weight:800;color:${gaps.length > 0 ? '#dc2626' : '#22c55e'};">${gaps.length}</div>
      <div class="meta">of ${COMP_REQUIREMENTS.length} total requirements</div>
    </div>
  </header>

  <div class="stat-bar">
    <div class="stat"><div class="stat-val" style="color:#dc2626;">${gaps.filter(r => r.status === 'Gap').length}</div><div class="stat-lbl">Open Gaps</div></div>
    <div class="stat"><div class="stat-val" style="color:#d97706;">${gaps.filter(r => r.status === 'Partial').length}</div><div class="stat-lbl">Partial</div></div>
    <div class="stat"><div class="stat-val" style="color:#0891b2;">${gaps.filter(r => evidenceInputs[r.id]?.trim()).length}</div><div class="stat-lbl">Evidence Filed</div></div>
    <div class="stat"><div class="stat-val" style="color:#0891b2;">${gaps.filter(r => corrActionInputs[r.id]?.trim()).length}</div><div class="stat-lbl">Action Plan Filed</div></div>
    <div class="stat"><div class="stat-val" style="color:#475569;">${gaps.filter(r => !evidenceInputs[r.id]?.trim() && !corrActionInputs[r.id]?.trim()).length}</div><div class="stat-lbl">No Action Yet</div></div>
  </div>

  ${gaps.length === 0
    ? `<div style="text-align:center;padding:48px;color:#22c55e;font-size:18px;font-weight:700;">✓ All requirements met or remediated${activeStd !== 'All' ? ` for ${activeStd}` : ''}.</div>`
    : `<p class="qr-note">📱 <strong>Assign owners without opening the app:</strong> scan the QR code in the last column to jump directly to that requirement in SunriseOS, then use the Owner dropdown to delegate.</p>
    <table>
    <thead>
      <tr>
        <th style="width:52px;">ID</th>
        <th style="width:100px;">Standard</th>
        <th style="width:110px;">Category</th>
        <th>Requirement</th>
        <th style="width:68px;text-align:center;">Status</th>
        <th style="width:80px;text-align:center;">Due Date</th>
        <th style="width:130px;">Evidence Filed</th>
        <th style="width:130px;">Corrective Plan</th>
        <th style="width:110px;">Owner</th>
        <th style="width:90px;text-align:center;">Open in App</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`}

  <footer>
    <span>SunriseOS Compliance Module &nbsp;·&nbsp; This list reflects open gaps as of the print date. Verify all items against source documentation before audit submission.</span>
    <span>Page <span class="pagenum"></span></span>
  </footer>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=1100,height=750');
      if (!win) { alert('Pop-up blocked — please allow pop-ups for this page to print.'); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
    }; // end doPrint

    // Same pre-flight guard as exportGapListCsv — block if any evidence was
    // cleared but not re-linked, or if there is unsaved typed text.
    let unsavedCount = 0;
    let clearedCount = 0;
    const clearedIds: Array<{ id: string; title: string }> = [];
    const unsavedIds: Array<{ id: string; title: string }> = [];
    COMP_REQUIREMENTS.forEach(r => {
      if (activeStd !== 'All' && r.standard !== activeStd) return;
      if ((!!evidenceInputs[r.id]?.trim() && !evidenceConfirmed.has(r.id)) ||
          (!!corrActionInputs[r.id]?.trim() && !corrConfirmed.has(r.id))) {
        unsavedCount++;
        unsavedIds.push({ id: r.id, title: r.requirement });
      }
      if (evidenceCleared.has(r.id) || corrCleared.has(r.id)) {
        clearedCount++;
        clearedIds.push({ id: r.id, title: r.requirement });
      }
    });
    if (unsavedCount > 0 || clearedCount > 0) {
      setShowUnsavedExportWarn({ unsaved: unsavedCount, cleared: clearedCount, clearedIds, unsavedIds, action: 'print', onContinue: doPrint });
      return;
    }
    doPrint();
  };

  const [compSaved, setCompSaved] = useState<string | null>(null);
  const saveCompAction = (msg: string) => { setCompSaved(msg); setTimeout(() => setCompSaved(null), 2500); };
  const [evidenceSavedId, setEvidenceSavedId] = useState<string | null>(null);
  const [corrSavedId, setCorrSavedId] = useState<string | null>(null);
  const [warnUnsaved, setWarnUnsaved] = useState<string | null>(null);
  // Track fields that were previously confirmed but then cleared — these need
  // a "re-link" indicator even though the input is now empty (so the normal
  // "Unsaved changes" check, which requires non-empty text, won't fire alone).
  // On mount, re-seed from persisted confirmed sets so the indicator survives
  // a full page reload: any ID that was confirmed but whose input is now empty
  // must still show the "Evidence removed — re-link to restore" banner.
  const [evidenceCleared, setEvidenceCleared] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_EVIDENCE_CONFIRMED_KEY);
      const confirmed: string[] = stored ? JSON.parse(stored) : [];
      return new Set<string>(confirmed.filter(id => !evidenceInputs[id]?.trim()));
    } catch {
      return new Set<string>();
    }
  });
  const [corrCleared, setCorrCleared] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_CORR_CONFIRMED_KEY);
      const confirmed: string[] = stored ? JSON.parse(stored) : [];
      return new Set<string>(confirmed.filter(id => !corrActionInputs[id]?.trim()));
    } catch {
      return new Set<string>();
    }
  });
  const [showUnsavedExportWarn, setShowUnsavedExportWarn] = useState<{
    unsaved: number;
    cleared: number;
    clearedIds: Array<{ id: string; title: string }>;
    unsavedIds: Array<{ id: string; title: string }>;
    action: 'csv' | 'print';
    onContinue: () => void;
  } | false>(false);
  const [evidenceConfirmed, setEvidenceConfirmedRaw] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_EVIDENCE_CONFIRMED_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [corrConfirmed, setCorrConfirmedRaw] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_CORR_CONFIRMED_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Persist confirmed sets to localStorage on every update so they survive
  // a full page reload and don't produce false "unsaved" warnings.
  const setEvidenceConfirmed = (updater: (prev: Set<string>) => Set<string>) => {
    setEvidenceConfirmedRaw(prev => {
      const next = updater(prev);
      safeSet(COMPLIANCE_EVIDENCE_CONFIRMED_KEY, JSON.stringify([...next]));
      return next;
    });
  };
  const setCorrConfirmed = (updater: (prev: Set<string>) => Set<string>) => {
    setCorrConfirmedRaw(prev => {
      const next = updater(prev);
      safeSet(COMPLIANCE_CORR_CONFIRMED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const checkUnsavedBeforeClose = (reqId: string) => {
    const hasEvidence = !!evidenceInputs[reqId]?.trim();
    const hasCorr = !!corrActionInputs[reqId]?.trim();
    const evidenceUnsaved = hasEvidence && !evidenceConfirmed.has(reqId);
    const corrUnsaved = hasCorr && !corrConfirmed.has(reqId);
    const evidenceClearedForRow = evidenceCleared.has(reqId);
    const corrClearedForRow = corrCleared.has(reqId);

    if (evidenceClearedForRow || corrClearedForRow) {
      const clearedFields = [evidenceClearedForRow && 'evidence', corrClearedForRow && 'corrective action'].filter(Boolean).join(' and ');
      setWarnUnsaved(`Saved ${clearedFields} removed — re-link to restore before closing.`);
      setTimeout(() => setWarnUnsaved(null), 4000);
    } else if (evidenceUnsaved || corrUnsaved) {
      const fields = [evidenceUnsaved && 'evidence', corrUnsaved && 'corrective action'].filter(Boolean).join(' and ');
      setWarnUnsaved(`Unsaved ${fields} — click "Link Evidence" or "Save Action Plan" to keep it.`);
      setTimeout(() => setWarnUnsaved(null), 3500);
    }
  };

  const standards: CompStandard[] = ['All', 'CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'];
  const gapFilterOptions: Array<'All' | 'Needs Evidence' | 'Needs Action Plan' | 'Both Missing'> = ['All', 'Needs Evidence', 'Needs Action Plan', 'Both Missing'];

  const filtered = COMP_REQUIREMENTS.filter(r => {
    if (stdFilter !== 'All' && r.standard !== stdFilter) return false;
    const missingEvidence = !evidenceInputs[r.id]?.trim();
    const missingPlan = !corrActionInputs[r.id]?.trim();
    if (gapFilter === 'Needs Evidence') return missingEvidence;
    if (gapFilter === 'Needs Action Plan') return missingPlan;
    if (gapFilter === 'Both Missing') return missingEvidence && missingPlan;
    return true;
  });

  const met = COMP_REQUIREMENTS.filter(r => reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
  const total = COMP_REQUIREMENTS.length;
  const score = Math.round((met / total) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate">Track evidence of compliance, assign corrective actions, and assess audit readiness across all regulatory standards.</div>
        <div className="flex items-center gap-2">
          {/* #576 — show Reset whenever any audit data exists, including confirmed-only */}
          {/* #598 — hide Reset entirely for read-only users */}
          <div className="flex flex-col items-end gap-1">
            {!readOnly && (completedIds.size > 0 || evidenceConfirmed.size > 0 || corrConfirmed.size > 0 ||
              Object.values(evidenceInputs).some(v => v.trim()) || Object.values(corrActionInputs).some(v => v.trim()) || Object.values(ownerInputs).some(v => v.trim())) && (
              <button
                onClick={() => { setResetPhrase(''); setShowResetConfirm(true); }}
                className="border border-border text-sm px-4 py-2 rounded-xl text-slate hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                Reset Audit Cycle
              </button>
            )}
            {/* #597 — always show last-reset attribution when one exists */}
            {lastResetEntry && (
              <span className="text-[10px] text-slate leading-none">
                Last reset by <span className="font-semibold text-navy">{lastResetEntry.userName}</span> on {new Date(lastResetEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(lastResetEntry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button
            onClick={() => printGapList()}
            className="border border-border text-sm px-4 py-2 rounded-xl text-slate hover:bg-gray-50 hover:border-navy/40 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Gap List{stdFilter !== 'All' ? ` — ${stdFilter}` : ''}
          </button>
          <button
            id="tour-gap-export"
            onClick={exportGapListCsv}
            className="border border-border text-sm px-4 py-2 rounded-xl text-slate hover:bg-gray-50 hover:border-navy/40 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Gap List{stdFilter !== 'All' ? ` — ${stdFilter}` : ''}
          </button>
          <button onClick={() => setShowReport(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Generate Readiness Report
          </button>
        </div>
      </div>

      {/* ── Per-standard evidence progress rings ────────────────────────────── */}
      <div id="tour-standards-rings" className="card p-4">
        {/* Overall stat strip */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${score >= 90 ? 'text-green-600' : score >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
            <span className="text-sm text-slate">Overall — {met} of {total} requirements met or remediated</span>
          </div>
          <div className="flex gap-5 text-xs text-right">
            <div>
              <span className="text-red-600 font-bold text-lg">{COMP_REQUIREMENTS.filter(r => r.status === 'Gap' && !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length}</span>
              <div className="text-slate">Open Gaps</div>
            </div>
            <div>
              <span className="text-amber-600 font-bold text-lg">{COMP_REQUIREMENTS.filter(r => r.status === 'Partial' && !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length}</span>
              <div className="text-slate">Partial</div>
            </div>
            <div>
              <span className="text-cyan-600 font-bold text-lg">{COMP_REQUIREMENTS.filter(r => !r.status.startsWith('Met') && !completedIds.has(r.id) && !!evidenceInputs[r.id]?.trim() && !!corrActionInputs[r.id]?.trim()).length}</span>
              <div className="text-slate">Evid. + Plan</div>
            </div>
          </div>
        </div>

        {/* Per-standard rings — clicking filters the list */}
        <div className="grid grid-cols-6 gap-2">
          {(['CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'] as const).map(std => (
            <StandardRing
              key={std} std={std}
              completedIds={completedIds}
              evidenceInputs={evidenceInputs}
              corrActionInputs={corrActionInputs}
              isActive={stdFilter === std}
              onClick={() => setStdFilter(stdFilter === std ? 'All' : std)}
            />
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-slate">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 align-middle" />Met / manually marked&ensp;
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1 align-middle" />Evidence + corrective-action plan filed (counts toward score)&ensp;
            <span className="inline-block w-2 h-2 rounded-full bg-gray-200 mr-1 align-middle" />Still open
          </p>
          {stdFilter !== 'All' && (
            <button onClick={() => setStdFilter('All')} className="text-[10px] text-orange font-semibold hover:underline shrink-0 ml-4">
              Clear filter ×
            </button>
          )}
        </div>

        {/* Per-standard quick-print buttons */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-slate uppercase tracking-wide mb-2">Quick-print by standard</p>
          <div className="flex flex-wrap gap-2">
            {(['CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'] as const).map(std => {
              const openCount = COMP_REQUIREMENTS.filter(r => r.standard === std && !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
              return (
                <button
                  key={std}
                  onClick={() => printGapList(std)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-medium text-slate hover:bg-gray-50 hover:border-navy/40 transition-colors"
                >
                  <Printer className="w-3 h-3 shrink-0" />
                  Print {STD_SHORT[std]}
                  {openCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* #566 — count badges on standard filter pills */}
      <div className="flex gap-2 flex-wrap">
        {standards.map(s => {
          const count = s === 'All' ? COMP_REQUIREMENTS.length : COMP_REQUIREMENTS.filter(r => r.standard === s).length;
          const open  = s === 'All'
            ? COMP_REQUIREMENTS.filter(r => !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length
            : COMP_REQUIREMENTS.filter(r => r.standard === s && !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
          return (
            <button key={s} onClick={() => setStdFilter(s)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 ${stdFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-navy/40'}`}>
              {s}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stdFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate'}`}>
                {count}
              </span>
              {open > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stdFilter === s ? 'bg-red-400/80 text-white' : 'bg-red-100 text-red-600'}`}>
                  {open} open
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate uppercase tracking-wide shrink-0">Show:</span>
        {gapFilterOptions.map(opt => (
          <button key={opt} onClick={() => setGapFilter(opt)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              gapFilter === opt
                ? opt === 'All' ? 'bg-navy text-white border-navy'
                  : opt === 'Both Missing' ? 'bg-red-600 text-white border-red-600'
                  : 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate border-border hover:border-navy/40'
            }`}>
            {opt}
          </button>
        ))}
        {gapFilter !== 'All' && (
          <span className="text-[11px] text-slate ml-1">
            — {filtered.length} requirement{filtered.length !== 1 ? 's' : ''} shown
          </span>
        )}
      </div>

      <div className="space-y-2">
        {(() => {
          // Identify the first requirement that is not effectively met — the
          // tour spotlight (id="tour-first-gap-row") is placed on this row when
          // the demo tour is active, so the callout ring wraps exactly that row.
          const firstGapReqId = isTourActive
            ? (filtered.find(r => !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs))?.id ?? null)
            : null;

          return filtered.map(req => {
          const isCompleted = completedIds.has(req.id);
          const hasEvidenceAndPlan = !!evidenceInputs[req.id]?.trim() && !!corrActionInputs[req.id]?.trim();
          const effectiveStatus = isCompleted ? 'Met' : req.status;
          const isSelected = selectedReq === req.id;
          const isTourFirstGap = isTourActive && req.id === firstGapReqId;
          return (
            <div key={req.id} id={isTourFirstGap ? 'tour-first-gap-row' : `comp-req-${req.id}`} className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-orange shadow-sm' : requestedReqId === req.id ? 'border-blue-400 shadow-sm ring-2 ring-blue-200' : 'border-border'}`}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  if (selectedReq && selectedReq !== req.id) checkUnsavedBeforeClose(selectedReq);
                  else if (isSelected) checkUnsavedBeforeClose(req.id);
                  setSelectedReq(isSelected ? null : req.id);
                }}
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_CHIP[effectiveStatus]}`}>{effectiveStatus}</span>
                {hasEvidenceAndPlan && !isCompleted && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-green-50 text-green-700 border border-green-200" title="Evidence linked and corrective action plan saved — counted toward audit score">✓ Evidence + Plan</span>
                )}
                <span className="text-[10px] font-semibold text-slate uppercase tracking-wider shrink-0 w-28">{req.standard}</span>
                <span className="text-xs font-medium text-navy flex-1">{req.requirement}</span>
                <span className="text-[10px] text-slate shrink-0">{req.category}</span>
                {req.dueDate && !isCompleted && <span className="text-[10px] text-slate shrink-0">Due: {req.dueDate}</span>}
                {ownerInputs[req.id]?.trim() ? (
                  <span
                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0 font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Owner — click to edit"
                    onClick={e => { e.stopPropagation(); setSelectedReq(req.id); }}
                  >
                    👤 {ownerInputs[req.id]}
                  </span>
                ) : (
                  <span
                    className="text-[10px] text-slate/50 border border-dashed border-slate/20 px-1.5 py-0.5 rounded-full shrink-0 hover:border-slate/40 hover:text-slate/70 transition-colors cursor-pointer whitespace-nowrap"
                    title="No owner assigned — click to assign"
                    onClick={e => { e.stopPropagation(); setSelectedReq(req.id); }}
                  >
                    — Unassigned
                  </span>
                )}
                <span className="text-slate shrink-0">{isSelected ? '▲' : '▼'}</span>
              </div>
              {isSelected && (
                <div className="px-4 pb-4 bg-gray-50/60 border-t border-border space-y-3">
                  <div className="text-xs text-slate font-semibold mt-3 mb-1">Frequency: {req.frequency}</div>
                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase mb-1">Evidence File / Document Name</label>
                    <div className="flex gap-2">
                      <input
                        value={evidenceInputs[req.id] ?? ''}
                        onChange={e => {
                          const nextEv = { ...evidenceInputs, [req.id]: e.target.value };
                          setEvidenceInputs(nextEv);
                          setEvidenceConfirmed(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                          // Track when a confirmed evidence field is cleared so the per-row
                          // indicator can fire even though the input is now empty.
                          if (!e.target.value.trim()) {
                            if (evidenceConfirmed.has(req.id)) {
                              setEvidenceCleared(prev => new Set([...prev, req.id]));
                            }
                          } else {
                            setEvidenceCleared(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                          }
                          // When the last piece of work is erased, restore the "Load Sample Audit" CTA
                          if (!e.target.value.trim() && completedIds.size === 0) {
                            const allEvidEmpty = Object.values(nextEv).every(v => !v?.trim());
                            const allCorrEmpty = Object.values(corrActionInputs).every(v => !v?.trim());
                            const newEvConf = new Set(evidenceConfirmed); newEvConf.delete(req.id);
                            if (allEvidEmpty && allCorrEmpty && newEvConf.size === 0 && corrConfirmed.size === 0) {
                              rollbackScoreHistory?.();
                              onAuditCycleReset?.();
                            }
                          }
                        }}
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
                        placeholder="e.g. Policy-HIPAA-NPP-v4.pdf, 2026 CARF Self-Study Section 3.docx"
                      />
                      <LockedButton locked={readOnly || !evidenceInputs[req.id]?.trim()} onClick={() => {
                          // Fire on the first evidence save so the CTA hides even if nothing is
                          // marked Met yet — mirrors the same guard on the Mark-as-Met button.
                          if (completedIds.size === 0 && evidenceConfirmed.size === 0 && corrConfirmed.size === 0) onAuditCycleStarted?.();
                          saveCompAction(`Evidence linked for ${req.id}`);
                          setEvidenceSavedId(req.id);
                          setTimeout(() => setEvidenceSavedId(null), 2000);
                          // Clear the "re-link" indicator now that the field is re-saved.
                          setEvidenceCleared(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                          setEvidenceConfirmed(prev => new Set([...prev, req.id]));
                          // detail: snapshot of input value at click time — a new string primitive,
                          // not a reference; editing the field afterward cannot mutate this entry.
                          addAuditEntry({ actionType: 'Evidence Linked', reqId: req.id, reqName: req.requirement, officer: currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Compliance Officer', detail: evidenceInputs[req.id]?.trim() });
                          appendScoreHistory(completedIds, evidenceInputs, corrActionInputs);
                        }}
                        className={`border text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors ${evidenceSavedId === req.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-slate hover:bg-white'}`}>
                        {evidenceSavedId === req.id ? '✓ Saved' : 'Link Evidence'}
                      </LockedButton>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase mb-1">Corrective Action Plan</label>
                    <textarea
                      value={corrActionInputs[req.id] ?? ''}
                      onChange={e => {
                        const nextCorr = { ...corrActionInputs, [req.id]: e.target.value };
                        setCorrActionInputs(nextCorr);
                        setCorrConfirmed(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                        // Track when a confirmed corrective-action field is cleared so the
                        // per-row indicator fires even though the textarea is now empty.
                        if (!e.target.value.trim()) {
                          if (corrConfirmed.has(req.id)) {
                            setCorrCleared(prev => new Set([...prev, req.id]));
                          }
                        } else {
                          setCorrCleared(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                        }
                        // When the last piece of work is erased, restore the "Load Sample Audit" CTA
                        if (!e.target.value.trim() && completedIds.size === 0) {
                          const allEvidEmpty = Object.values(evidenceInputs).every(v => !v?.trim());
                          const allCorrEmpty = Object.values(nextCorr).every(v => !v?.trim());
                          const newCorrConf = new Set(corrConfirmed); newCorrConf.delete(req.id);
                          if (allEvidEmpty && allCorrEmpty && evidenceConfirmed.size === 0 && newCorrConf.size === 0) {
                            rollbackScoreHistory?.();
                            onAuditCycleReset?.();
                          }
                        }
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
                      placeholder="Describe corrective actions planned or in progress, responsible person, and target completion date..."
                    />
                  </div>
                  {(() => {
                    const evidenceUnsaved = !!evidenceInputs[req.id]?.trim() && !evidenceConfirmed.has(req.id);
                    const corrUnsaved = !!corrActionInputs[req.id]?.trim() && !corrConfirmed.has(req.id);
                    const evidenceWasCleared = evidenceCleared.has(req.id);
                    const corrWasCleared = corrCleared.has(req.id);
                    /* #573 — pulse animation on unsaved dot */
                    /* #713 — also fire when a confirmed field was cleared (input is now empty
                               but the prior confirmation is gone — officer must re-link) */
                    if (evidenceWasCleared || corrWasCleared) {
                      const what = [evidenceWasCleared && 'evidence', corrWasCleared && 'action plan'].filter(Boolean).join(' and ');
                      return (
                        <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0 animate-pulse" />
                          {`${what.charAt(0).toUpperCase()}${what.slice(1)} removed — re-link to restore`}
                        </div>
                      );
                    }
                    return (evidenceUnsaved || corrUnsaved) ? (
                      <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0 animate-pulse" />
                        Unsaved changes — click "Link Evidence" or "Save Action Plan" to keep
                      </div>
                    ) : null;
                  })()}
                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase mb-1">Assign Owner</label>
                    <div className="flex gap-2">
                      <select
                        value={isOtherMode(req.id) ? '__OTHER__' : (ownerInputs[req.id] ?? '')}
                        onChange={e => {
                          if (e.target.value === '__OTHER__') {
                            setOtherOwnerMode(prev => new Set([...prev, req.id]));
                            setOwnerInputs({ ...ownerInputs, [req.id]: '' });
                          } else {
                            setOtherOwnerMode(prev => { const s = new Set(prev); s.delete(req.id); return s; });
                            setOwnerInputs({ ...ownerInputs, [req.id]: e.target.value });
                          }
                        }}
                        disabled={readOnly}
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:border-orange"
                      >
                        <option value="">— Unassigned —</option>
                        {EMPLOYEES.filter(e => e.status !== 'Separated').map(e => (
                          <option key={e.id} value={e.name}>{e.name} — {e.title}</option>
                        ))}
                        <option value="__OTHER__">Other (type a name)…</option>
                      </select>
                      {(ownerInputs[req.id]?.trim() || isOtherMode(req.id)) && (
                        <button
                          onClick={() => {
                            setOtherOwnerMode(prev => { const s = new Set(prev); s.delete(req.id); return s; });
                            setOwnerInputs({ ...ownerInputs, [req.id]: '' });
                          }}
                          disabled={readOnly}
                          className="text-xs text-slate border border-border px-2.5 py-1.5 rounded-lg hover:bg-white shrink-0 disabled:opacity-50"
                          title="Clear owner"
                        >✕</button>
                      )}
                    </div>
                    {isOtherMode(req.id) && (
                      <input
                        type="text"
                        placeholder="Enter name (e.g. external auditor, consultant…)"
                        value={ownerInputs[req.id] ?? ''}
                        onChange={e => setOwnerInputs({ ...ownerInputs, [req.id]: e.target.value })}
                        disabled={readOnly}
                        autoFocus
                        className="mt-2 w-full border border-orange rounded-lg px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <LockedButton locked={readOnly || !corrActionInputs[req.id]?.trim()} onClick={() => {
                        // Fire on the first action-plan save so the CTA hides even if nothing is
                        // marked Met yet — mirrors the same guard on the Mark-as-Met button.
                        if (completedIds.size === 0 && evidenceConfirmed.size === 0 && corrConfirmed.size === 0) onAuditCycleStarted?.();
                        saveCompAction(`Corrective action saved for ${req.id}`);
                        setCorrSavedId(req.id);
                        setTimeout(() => setCorrSavedId(null), 2000);
                        // Clear the "re-link" indicator now that the field is re-saved.
                        setCorrCleared(prev => { const n = new Set(prev); n.delete(req.id); return n; });
                        setCorrConfirmed(prev => new Set([...prev, req.id]));
                        // detail: snapshot of input value at click time — a new string primitive,
                        // not a reference; editing the field afterward cannot mutate this entry.
                        addAuditEntry({ actionType: 'Action Plan Saved', reqId: req.id, reqName: req.requirement, officer: currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Compliance Officer', detail: corrActionInputs[req.id]?.trim() });
                        appendScoreHistory(completedIds, evidenceInputs, corrActionInputs);
                      }}
                      className={`border text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors ${corrSavedId === req.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-slate hover:bg-white'}`}>
                      {corrSavedId === req.id ? '✓ Saved' : 'Save Action Plan'}
                    </LockedButton>
                    {!isCompleted && (
                      <LockedButton locked={readOnly} onClick={() => {
                        const newIds = new Set([...completedIds, req.id]);
                        setCompletedIds(newIds);
                        // #690 — fire onAuditCycleStarted on the first manual mark-met so the
                        // "Load Sample Audit" CTA is hidden even when sample data was never used.
                        if (completedIds.size === 0) onAuditCycleStarted?.();
                        saveCompAction(`${req.id} marked as Met`);
                        addAuditEntry({ actionType: 'Marked Met', reqId: req.id, reqName: req.requirement, officer: currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Compliance Officer' });
                        appendScoreHistory(newIds, evidenceInputs, corrActionInputs);
                      }} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">
                        Mark as Met ✓
                      </LockedButton>
                    )}
                    {isCompleted && (
                      <button onClick={() => {
                        const newIds = new Set(completedIds);
                        newIds.delete(req.id);
                        setCompletedIds(newIds);
                        appendScoreHistory(newIds, evidenceInputs, corrActionInputs);
                        // If this undo removed the last Met mark, restore the "Load Sample Audit" CTA
                        if (newIds.size === 0) onAuditCycleReset?.();
                      }}
                        className="text-xs text-slate border border-border px-3 py-1.5 rounded-lg hover:bg-white">
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
          });
        })()}
      </div>

      {/* ── Audit Trail ──────────────────────────────────────────────────── */}
      {(() => {
        const actionChip: Record<AuditActionType, string> = {
          'Marked Met':        'bg-green-100 text-green-700',
          'Evidence Linked':   'bg-blue-100 text-blue-700',
          'Action Plan Saved': 'bg-amber-100 text-amber-700',
        };
        const sorted = [...auditLog].reverse();
        const dateFrom = auditDateFrom ? new Date(auditDateFrom + 'T00:00:00') : null;
        const dateTo   = auditDateTo   ? new Date(auditDateTo   + 'T23:59:59.999') : null;
        const filtered = (auditFilter === 'All' ? sorted : sorted.filter(e => e.actionType === auditFilter))
          .filter(e => {
            const ts = new Date(e.timestamp);
            if (dateFrom && ts < dateFrom) return false;
            if (dateTo   && ts > dateTo)   return false;
            return true;
          });
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const nearingCap = auditLog.length >= 450;
        const expiryWarningCutoff = Date.now() - (AUDIT_LOG_MAX_AGE_MS - SEVEN_DAYS_MS);
        const expiringCount = auditLog.filter(e => new Date(e.timestamp).getTime() < expiryWarningCutoff).length;
        const showLogWarning = nearingCap || expiringCount > 0;
        const dateRangeSuffix = (auditDateFrom || auditDateTo)
          ? `-${auditDateFrom || 'start'}-to-${auditDateTo || 'end'}`
          : '';
        const dateRangeLabel = (auditDateFrom && auditDateTo)
          ? `${auditDateFrom} – ${auditDateTo}`
          : auditDateFrom
            ? `From ${auditDateFrom}`
            : auditDateTo
              ? `To ${auditDateTo}`
              : 'All Dates';

        const handleExportCSV = () => {
          if (csvExporting) return;
          setCsvExporting(true);
          // Yield to the browser so the loading state renders before Blob assembly blocks the thread
          setTimeout(() => {
            try {
              const headers = ['Timestamp', 'Action Type', 'Requirement ID', 'Requirement Name', 'Officer', 'Detail', 'Previous Detail'];
              const rows = filtered.map(entry => [
                new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                entry.actionType,
                entry.reqId,
                `"${entry.reqName.replace(/"/g, '""')}"`,
                entry.officer,
                `"${(entry.detail ?? '').replace(/"/g, '""')}"`,
                `"${(entry.previousDetail ?? '').replace(/"/g, '""')}"`,
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const suffix = auditFilter === 'All' ? '' : `-${auditFilter.toLowerCase().replace(/\s+/g, '-')}`;
              a.download = `audit-trail${suffix}${dateRangeSuffix}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              setCsvExportError(true);
              setTimeout(() => setCsvExportError(false), 3500);
            } finally {
              setCsvExporting(false);
            }
          }, 50);
        };

        const handleExportPDF = () => {
          if (pdfGenerating) return;
          setPdfGenerating(true);
          // Yield to the browser so the loading state renders before jsPDF blocks the thread
          setTimeout(() => {
          try {
          const filterLabel = auditFilter === 'All' ? 'All Actions' : auditFilter;
          const pdfDateRangeLabel = dateRangeLabel;
          const generatedDate = new Date().toLocaleString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
          });

          const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          const marginL = 36;
          const marginR = 36;
          const contentW = pageW - marginL - marginR;

          // ── Header bar ──────────────────────────────────────────────────────
          // Logo mark (orange square with "S")
          doc.setFillColor(249, 115, 22);
          doc.roundedRect(marginL, 28, 28, 28, 4, 4, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('S', marginL + 14, 28 + 18, { align: 'center' });

          // Facility name & subtitle
          doc.setTextColor(30, 58, 95);
          doc.setFontSize(15);
          doc.text('Sunrise Recovery Center', marginL + 36, 40);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text('SunriseOS Compliance Module — Audit Trail Export', marginL + 36, 52);

          // Divider
          doc.setDrawColor(30, 58, 95);
          doc.setLineWidth(1.5);
          doc.line(marginL, 65, pageW - marginR, 65);

          // ── Meta cells ──────────────────────────────────────────────────────
          const cellW = contentW / 4 - 7;
          const metaY = 72;
          const metaCellH = 36;
          const metaLabels = ['GENERATED', 'FILTER APPLIED', 'DATE RANGE', 'TOTAL ENTRIES'];
          const metaValues = [generatedDate, filterLabel, pdfDateRangeLabel, String(filtered.length)];
          [0, 1, 2, 3].forEach(i => {
            const x = marginL + i * (cellW + 9);
            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.roundedRect(x, metaY, cellW, metaCellH, 4, 4, 'FD');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text(metaLabels[i], x + 8, metaY + 11);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 58, 95);
            doc.text(metaValues[i], x + 8, metaY + 26, { maxWidth: cellW - 16 });
          });

          // ── Table ────────────────────────────────────────────────────────────
          const tableTop = metaY + metaCellH + 12;
          const colWidths = [90, 100, 60, contentW - 90 - 100 - 60 - 110, 110];
          const colHeaders = ['DATE / TIME', 'ACTION TYPE', 'REQ. ID', 'REQUIREMENT', 'OFFICER'];
          const rowHeightBase = 22;
          const headerH = 20;

          // Header row
          doc.setFillColor(30, 58, 95);
          doc.rect(marginL, tableTop, contentW, headerH, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          let cx = marginL;
          colHeaders.forEach((h, i) => {
            doc.text(h, cx + 6, tableTop + 13);
            cx += colWidths[i];
          });

          if (filtered.length === 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text('No audit entries match the selected filter.', pageW / 2, tableTop + headerH + 30, { align: 'center' });
          } else {
            const actionBgRGB: Record<AuditActionType, [number, number, number]> = {
              'Marked Met':        [220, 252, 231],
              'Evidence Linked':   [219, 234, 254],
              'Action Plan Saved': [254, 243, 199],
            };
            const actionTextRGB: Record<AuditActionType, [number, number, number]> = {
              'Marked Met':        [21, 128, 61],
              'Evidence Linked':   [29, 78, 216],
              'Action Plan Saved': [180, 83, 9],
            };

            let rowY = tableTop + headerH;
            let page = 1;
            const footerY = pageH - 30;
            // rowOnPage resets to 0 after each page break so alternating
            // stripes always start white on page 2+, matching page 1.
            let rowOnPage = 0;

            filtered.forEach((entry) => {
              const dt = new Date(entry.timestamp);
              const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

              // Guard Date/Time strings: split to size and cap at 1 line each so
              // they can never overflow colWidths[0] horizontally regardless of
              // locale or month-name length.
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              const dtColInner = colWidths[0] - 12;
              const safeDateStr = (doc.splitTextToSize(dateStr, dtColInner) as string[])[0] ?? dateStr;
              doc.setFontSize(7.5);
              const safeTimeStr = (doc.splitTextToSize(timeStr, dtColInner) as string[])[0] ?? timeStr;

              // Pre-calculate name/detail lines to determine dynamic row height.
              // Caps prevent any single row from overrunning the page footer.
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              const MAX_NAME_LINES = 3;
              const rawNameLines: string[] = doc.splitTextToSize(entry.reqName, colWidths[3] - 12);
              const nameLines: string[] = rawNameLines.length > MAX_NAME_LINES
                ? [...rawNameLines.slice(0, MAX_NAME_LINES - 1), rawNameLines[MAX_NAME_LINES - 1].replace(/\.{0,3}$/, '…')]
                : rawNameLines;
              const MAX_DETAIL_LINES = 2;
              const rawDetailLines: string[] = entry.detail
                ? doc.splitTextToSize(entry.detail, colWidths[3] - 12)
                : [];
              const detailLines: string[] = rawDetailLines.length > MAX_DETAIL_LINES
                ? [...rawDetailLines.slice(0, MAX_DETAIL_LINES - 1), rawDetailLines[MAX_DETAIL_LINES - 1].replace(/\.{0,3}$/, '…')]
                : rawDetailLines;
              const MAX_PREV_LINES = 2;
              const rawPrevLines: string[] = entry.previousDetail
                ? doc.splitTextToSize(`was: ${entry.previousDetail}`, colWidths[3] - 12)
                : [];
              const prevLines: string[] = rawPrevLines.length > MAX_PREV_LINES
                ? [...rawPrevLines.slice(0, MAX_PREV_LINES - 1), rawPrevLines[MAX_PREV_LINES - 1].replace(/\.{0,3}$/, '…')]
                : rawPrevLines;
              const MAX_OFFICER_LINES = 4;
              const rawOfficerLines: string[] = doc.splitTextToSize(entry.officer, colWidths[4] - 12);
              const officerLines: string[] = rawOfficerLines.length > MAX_OFFICER_LINES
                ? [...rawOfficerLines.slice(0, MAX_OFFICER_LINES - 1), rawOfficerLines[MAX_OFFICER_LINES - 1].replace(/\.{0,3}$/, '…')]
                : rawOfficerLines;
              const nameLineH = 11; // ~11 pt per line at fontSize 9
              const detailLineH = 10; // slightly tighter for sub-lines
              // Date/Time column always occupies 2 stacked items — represent as
              // 2 virtual lines so rowHeight is always tall enough.
              const DT_VIRTUAL_LINES = 2;
              const reqColLines = nameLines.length
                + (detailLines.length > 0 ? detailLines.length + 0.3 : 0)
                + (prevLines.length   > 0 ? prevLines.length   + 0.3 : 0);
              const rowHeight = Math.max(rowHeightBase, 8 + Math.max(reqColLines * nameLineH, officerLines.length * nameLineH, DT_VIRTUAL_LINES * nameLineH));

              // Page break if needed
              if (rowY + rowHeight > footerY) {
                doc.addPage();
                page++;
                rowY = 36;
                rowOnPage = 0;
                // Repeat column header on new page
                doc.setFillColor(30, 58, 95);
                doc.rect(marginL, rowY, contentW, headerH, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                let hcx = marginL;
                colHeaders.forEach((h, i) => {
                  doc.text(h, hcx + 6, rowY + 13);
                  hcx += colWidths[i];
                });
                rowY += headerH;
              }

              // Row background (alternating, resets at each page boundary)
              if (rowOnPage % 2 === 1) {
                doc.setFillColor(249, 250, 251);
                doc.rect(marginL, rowY, contentW, rowHeight, 'F');
              }
              rowOnPage++;

              // Row border
              doc.setDrawColor(229, 231, 235);
              doc.setLineWidth(0.4);
              doc.line(marginL, rowY + rowHeight, marginL + contentW, rowY + rowHeight);

              let rx = marginL;

              // Date / Time — vertically centre the date+time pair within the
              // dynamic row height so they don't look top-pinned in tall rows.
              // The block spans ~16 pt (date baseline 4 pt above midpoint, time
              // baseline 4 pt below). Both strings are pre-split to one line so
              // they never overflow colWidths[0] horizontally.
              const dtMidY = rowY + rowHeight / 2;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(55, 65, 81);
              doc.text(safeDateStr, rx + 6, dtMidY - 4, { maxWidth: dtColInner });
              doc.setFontSize(7.5);
              doc.setTextColor(107, 114, 128);
              doc.text(safeTimeStr, rx + 6, dtMidY + 4, { maxWidth: dtColInner });
              rx += colWidths[0];

              // Action type badge
              const [br, bg, bb] = actionBgRGB[entry.actionType];
              const [tr2, tg, tb] = actionTextRGB[entry.actionType];
              const badgeW = colWidths[1] - 12;
              const badgeH = 13;
              const badgeX = rx + 6;
              const badgeY = rowY + 4;
              doc.setFillColor(br, bg, bb);
              doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');
              doc.setFontSize(7.5);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(tr2, tg, tb);
              doc.text(entry.actionType, badgeX + badgeW / 2, badgeY + 8.5, { align: 'center', maxWidth: badgeW - 8 });
              rx += colWidths[1];

              // Req ID — vertically centre the single-line ID within the row.
              // Adding ~3 pt to the midpoint compensates for cap-height so the
              // glyph appears optically centred rather than sitting above centre.
              // splitTextToSize + maxWidth guard prevent a long ID from bleeding
              // into the Requirement column to its right.
              doc.setFontSize(8.5);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(107, 114, 128);
              const reqIdLines = doc.splitTextToSize(entry.reqId, colWidths[2] - 12);
              doc.text(reqIdLines[0], rx + 6, rowY + rowHeight / 2 + 3, { maxWidth: colWidths[2] - 12 });
              rx += colWidths[2];

              // Requirement name — render all wrapped lines
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(17, 24, 39);
              nameLines.forEach((line: string, idx: number) => {
                doc.text(line, rx + 6, rowY + 10 + idx * nameLineH);
              });
              // Detail (current value) — rendered below requirement name
              if (detailLines.length > 0) {
                const detailStartY = rowY + 10 + nameLines.length * nameLineH + 1;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(55, 65, 81);
                detailLines.forEach((line: string, idx: number) => {
                  doc.text(line, rx + 6, detailStartY + idx * detailLineH);
                });
              }
              // Previous detail — rendered below current detail in italic gray
              if (prevLines.length > 0) {
                const prevStartY = rowY + 10
                  + nameLines.length * nameLineH + 1
                  + (detailLines.length > 0 ? detailLines.length * detailLineH + 1 : 0);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(156, 163, 175);
                prevLines.forEach((line: string, idx: number) => {
                  doc.text(line, rx + 6, prevStartY + idx * detailLineH);
                });
              }
              rx += colWidths[3];

              // Officer — render all wrapped lines
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(55, 65, 81);
              officerLines.forEach((line: string, idx: number) => {
                doc.text(line, rx + 6, rowY + 10 + idx * nameLineH);
              });

              rowY += rowHeight;
            });
          }

          // ── Footer ───────────────────────────────────────────────────────────
          const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            const fY = pageH - 18;
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(marginL, fY - 4, pageW - marginR, fY - 4);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(156, 163, 175);
            doc.text(
              'Auto-generated by SunriseOS Compliance Module — for internal QI purposes only · Sunrise Recovery Center, Rockville, MD',
              marginL, fY,
            );
            doc.text(`Page ${p} of ${totalPages}`, pageW - marginR, fY, { align: 'right' });
          }

          // ── Save ─────────────────────────────────────────────────────────────
          const suffix = auditFilter === 'All' ? '' : `-${auditFilter.toLowerCase().replace(/\s+/g, '-')}`;
          const exportDateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          doc.save(`compliance-audit-${exportDateStr}${suffix}${dateRangeSuffix}.pdf`);
          } finally {
            setPdfGenerating(false);
          }
          }, 0);
        };

        const filterChips: Array<{ label: string; value: AuditActionType | 'All'; activeClass: string }> = [
          { label: 'All', value: 'All', activeClass: 'bg-navy text-white border-navy' },
          { label: 'Marked Met', value: 'Marked Met', activeClass: 'bg-green-600 text-white border-green-600' },
          { label: 'Evidence Linked', value: 'Evidence Linked', activeClass: 'bg-blue-600 text-white border-blue-600' },
          { label: 'Action Plan Saved', value: 'Action Plan Saved', activeClass: 'bg-amber-500 text-white border-amber-500' },
        ];

        return (
          <div ref={auditTrailRef} className={`border rounded-xl overflow-hidden transition-shadow ${storageQuotaFull ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.35)]' : 'border-border'}`}>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <button
                className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
                onClick={() => setShowAuditTrail(o => !o)}
              >
                <FileText className="w-4 h-4 text-slate" />
                <span className="text-sm font-semibold text-navy">Audit Trail</span>
                {auditLog.length > 0 ? (
                  <span className="text-[10px] bg-navy text-white rounded-full px-2 py-0.5 font-semibold">
                    {filtered.length}
                    {(auditFilter !== 'All' || auditDateFrom || auditDateTo) && (
                      <span className="opacity-70"> / {auditLog.length}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate italic">Start marking requirements to build the trail</span>
                )}
              </button>
              <div className="flex items-center gap-2">
                {auditLog.length > 0 && (
                  <>
                    <button
                      onClick={() => { onQuotaFlagCleared?.(); handleExportPDF(); }}
                      disabled={pdfGenerating}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold text-navy bg-white border rounded-lg px-2.5 py-1 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${storageQuotaFull ? 'border-amber-400 ring-2 ring-amber-300' : 'border-border'}`}
                    >
                      {pdfGenerating ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating…
                        </>
                      ) : (
                        <>
                          <Printer className="w-3.5 h-3.5" />
                          Export as PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { onQuotaFlagCleared?.(); handleExportCSV(); }}
                      disabled={csvExporting}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold text-navy bg-white border rounded-lg px-2.5 py-1 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${storageQuotaFull ? 'border-amber-400 ring-2 ring-amber-300' : 'border-border'}`}
                    >
                      {csvExporting ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                          </svg>
                          Exporting…
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Export {auditFilter !== 'All' ? 'Filtered' : 'Trail'}
                        </>
                      )}
                    </button>
                  </>
                )}
                <button onClick={() => setShowAuditTrail(o => !o)} className="hover:opacity-80 transition-opacity">
                  {showAuditTrail ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                </button>
              </div>
            </div>
            {showLogWarning && (
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-800">
                    {nearingCap && expiringCount > 0
                      ? `Audit log is approaching the 500-entry cap (${auditLog.length} entries) and ${expiringCount} ${expiringCount === 1 ? 'entry is' : 'entries are'} expiring within 7 days.`
                      : nearingCap
                        ? `Audit log is approaching the 500-entry cap (${auditLog.length} / 500 entries). Oldest entries will be dropped when the cap is reached.`
                        : `${expiringCount} audit ${expiringCount === 1 ? 'entry' : 'entries'} will be permanently removed within 7 days (90-day retention limit).`}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Export the audit trail now to preserve the full record before entries are trimmed.</p>
                </div>
              </div>
            )}
            {showAuditTrail && (
              <>
                {/* Filter chips — hidden when log is empty */}
                {auditLog.length > 0 && <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50/70 border-b border-border flex-wrap">
                  {filterChips.map(chip => (
                    <button
                      key={chip.value}
                      onClick={() => setAuditFilter(chip.value)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        auditFilter === chip.value
                          ? chip.activeClass
                          : 'bg-white text-slate border-border hover:border-gray-400 hover:text-navy'
                      }`}
                    >
                      {chip.label}
                      {chip.value !== 'All' && (
                        <span className={`ml-1 opacity-75`}>
                          ({sorted.filter(e => e.actionType === chip.value).length})
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-slate font-medium shrink-0">Date range:</span>
                    <input
                      type="date"
                      value={auditDateFrom}
                      onChange={e => setAuditDateFrom(e.target.value)}
                      max={auditDateTo || undefined}
                      className="text-[11px] text-navy border border-border rounded-lg px-2 py-0.5 bg-white focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
                    />
                    <span className="text-[11px] text-slate">–</span>
                    <input
                      type="date"
                      value={auditDateTo}
                      onChange={e => setAuditDateTo(e.target.value)}
                      min={auditDateFrom || undefined}
                      className="text-[11px] text-navy border border-border rounded-lg px-2 py-0.5 bg-white focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/30"
                    />
                    {(auditDateFrom || auditDateTo) && (
                      <button
                        onClick={() => { setAuditDateFrom(''); setAuditDateTo(''); }}
                        className="text-[11px] text-slate hover:text-navy ml-0.5"
                        title="Clear date range"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>}
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate">
                      {sorted.length === 0
                        ? 'No audit events yet. Mark a requirement as Met, link evidence, or save a corrective action to begin the log.'
                        : (auditDateFrom || auditDateTo)
                          ? `No entries match the selected filters${auditFilter !== 'All' ? ` and action type "${auditFilter}"` : ''} in this date range.`
                          : `No "${auditFilter}" entries in the audit trail.`}
                    </div>
                  ) : filtered.map(entry => {
                    const dt = new Date(entry.timestamp);
                    const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return (
                      <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60">
                        <div className="shrink-0 mt-0.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${actionChip[entry.actionType]}`}>
                            {entry.actionType}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-navy truncate" title={entry.reqName}>
                            <span className="text-slate font-semibold">{entry.reqId}</span> — {entry.reqName}
                          </div>
                          <div className="text-[11px] text-slate mt-0.5">by {entry.officer}</div>
                          {entry.detail && (
                            <div className="text-[11px] text-navy/80 mt-1 truncate" title={entry.detail}>
                              {entry.detail}
                            </div>
                          )}
                          {entry.previousDetail && (
                            <div className="text-[10px] text-slate/60 italic mt-0.5 truncate" title={`was: ${entry.previousDetail}`}>
                              was: {entry.previousDetail}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[11px] text-slate font-medium">{dateStr}</div>
                          <div className="text-[10px] text-slate">{timeStr}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {warnUnsaved && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50 max-w-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {warnUnsaved}
        </div>
      )}
      {!warnUnsaved && exportToast !== false && (
        <div className="fixed bottom-6 right-6 bg-navy text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <Download className="w-4 h-4" /> {exportToast} gap{exportToast !== 1 ? 's' : ''} exported
        </div>
      )}
      {!warnUnsaved && exportToast === false && csvExportError && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <XCircle className="w-4 h-4" /> CSV export failed — please try again
        </div>
      )}
      {!warnUnsaved && !exportToast && compSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {compSaved}
        </div>
      )}

      {/* Readiness Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">Compliance Readiness Report</h2>
              <button onClick={() => setShowReport(false)} className="text-slate hover:text-navy"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] rotate-[-30deg] text-6xl font-black text-gray-900 tracking-widest z-0">
                SAMPLE DEMO
              </div>
              <div className="relative z-10 space-y-5">
                <div className="text-center border-b pb-4">
                  <div className="text-xl font-bold text-navy">Sunrise Recovery Center — Rockville, MD</div>
                  <div className="text-sm text-slate mt-0.5">Compliance Readiness Summary Report · Generated {new Date().toLocaleDateString()}</div>
                  <div className="text-xs text-slate mt-0.5">CONFIDENTIAL — For Internal Use Only · Not for Distribution</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Overall Score', value: `${score}%`, color: score >= 90 ? 'text-green-600' : 'text-amber-600' },
                    { label: 'Requirements Met', value: `${met} / ${total}`, color: 'text-navy' },
                    { label: 'Open Gaps', value: COMP_REQUIREMENTS.filter(r => r.status === 'Gap' && !completedIds.has(r.id)).length, color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-slate mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {(['CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'] as const).map(std => {
                  const stdReqs = COMP_REQUIREMENTS.filter(r => r.standard === std);
                  const stdMet = stdReqs.filter(r => reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
                  const stdPct = Math.round((stdMet / stdReqs.length) * 100);
                  return (
                    <div key={std}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-navy">{std}</div>
                        <div className="text-xs text-slate">{stdMet}/{stdReqs.length} · {stdPct}%</div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${stdPct >= 90 ? 'bg-green-500' : stdPct >= 75 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${stdPct}%` }} />
                      </div>
                      {stdReqs.filter(r => r.status !== 'Met' && !completedIds.has(r.id)).map(gap => (
                        <div key={gap.id} className="mt-1 text-xs text-red-700 pl-3 border-l-2 border-red-300">
                          <span className={`font-bold ${gap.status === 'Gap' ? 'text-red-600' : 'text-amber-600'}`}>{gap.status}: </span>
                          {gap.requirement}{gap.dueDate ? ` (due ${gap.dueDate})` : ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <strong>Disclaimer:</strong> This report is auto-generated from the SunriseOS compliance module for internal quality improvement purposes. It does not constitute a formal audit opinion. All findings should be verified against source documentation before any regulatory submission.
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowReport(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Close</button>
              <button onClick={() => { setShowReport(false); saveCompAction('Report exported — PDF queued (demo)'); }} className="flex-1 btn-primary text-sm py-2.5">Export PDF (Demo)</button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Work / Cleared Evidence — Export Warning Dialog */}
      {showUnsavedExportWarn !== false && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4" onClick={() => setShowUnsavedExportWarn(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 px-6 pt-6 pb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-navy">
                  {showUnsavedExportWarn.cleared > 0 ? 'Export Blocked — Evidence Removed' : 'Unsaved Work Detected'}
                </h2>
                <div className="text-sm text-slate mt-1 leading-relaxed space-y-2">
                  {showUnsavedExportWarn.cleared > 0 && (
                    <p>
                      <strong>{showUnsavedExportWarn.cleared} requirement{showUnsavedExportWarn.cleared !== 1 ? 's have' : ' has'} evidence or a corrective action that was previously saved but has since been cleared without being re-linked.</strong> The exported file would misrepresent {showUnsavedExportWarn.cleared !== 1 ? 'those rows' : 'that row'} as never having had evidence on file.
                    </p>
                  )}
                  {showUnsavedExportWarn.unsaved > 0 && (
                    <p>
                      <strong>{showUnsavedExportWarn.unsaved} requirement{showUnsavedExportWarn.unsaved !== 1 ? 's have' : ' has'} typed evidence or corrective action text that {showUnsavedExportWarn.unsaved !== 1 ? "hasn't" : "haven't"} been confirmed yet.</strong> The export will show {showUnsavedExportWarn.unsaved !== 1 ? 'these items' : 'this item'} as open gaps because the text was never saved.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Requirement ID list — cleared */}
            {showUnsavedExportWarn.clearedIds.length > 0 && (() => {
              const shown = showUnsavedExportWarn.clearedIds.slice(0, 5);
              const extra = showUnsavedExportWarn.clearedIds.length - shown.length;
              return (
                <div className="px-6 pb-2">
                  <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-1.5">Needs re-linking ({showUnsavedExportWarn.clearedIds.length})</p>
                  <div className="space-y-1">
                    {shown.map(({ id, title }) => (
                      <button
                        key={id}
                        className="w-full flex items-start gap-2 text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-2 transition-colors group"
                        onClick={() => {
                          const req = COMP_REQUIREMENTS.find(r => r.id === id);
                          setShowUnsavedExportWarn(false);
                          if (req) {
                            setStdFilter(req.standard as CompStandard);
                            setGapFilter('All');
                            setSelectedReq(id);
                          }
                          setTimeout(() => {
                            document.getElementById(`comp-req-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 150);
                        }}
                      >
                        <span className="shrink-0 mt-0.5 font-mono text-[11px] font-bold text-red-700 bg-red-100 group-hover:bg-red-200 rounded px-1.5 py-0.5">{id}</span>
                        <span className="text-[11px] text-slate leading-tight line-clamp-2">{title}</span>
                      </button>
                    ))}
                    {extra > 0 && (
                      <p className="text-[11px] text-slate/70 pl-1">+{extra} more — go back to see all flagged rows</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Requirement ID list — unsaved */}
            {showUnsavedExportWarn.unsavedIds.length > 0 && (() => {
              const shown = showUnsavedExportWarn.unsavedIds.slice(0, 5);
              const extra = showUnsavedExportWarn.unsavedIds.length - shown.length;
              return (
                <div className="px-6 pb-2">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Unsaved text ({showUnsavedExportWarn.unsavedIds.length})</p>
                  <div className="space-y-1">
                    {shown.map(({ id, title }) => (
                      <button
                        key={id}
                        className="w-full flex items-start gap-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 transition-colors group"
                        onClick={() => {
                          const req = COMP_REQUIREMENTS.find(r => r.id === id);
                          setShowUnsavedExportWarn(false);
                          if (req) {
                            setStdFilter(req.standard as CompStandard);
                            setGapFilter('All');
                            setSelectedReq(id);
                          }
                          setTimeout(() => {
                            document.getElementById(`comp-req-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 150);
                        }}
                      >
                        <span className="shrink-0 mt-0.5 font-mono text-[11px] font-bold text-amber-700 bg-amber-100 group-hover:bg-amber-200 rounded px-1.5 py-0.5">{id}</span>
                        <span className="text-[11px] text-slate leading-tight line-clamp-2">{title}</span>
                      </button>
                    ))}
                    {extra > 0 && (
                      <p className="text-[11px] text-slate/70 pl-1">+{extra} more — go back to see all flagged rows</p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="px-6 pb-3 pt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium space-y-1">
                {showUnsavedExportWarn.cleared > 0 && (
                  <p>To resolve: tap a requirement ID above to jump straight to that row, then click <strong>"Link Evidence"</strong> or <strong>"Save Action Plan"</strong> to re-attach the documentation.</p>
                )}
                {showUnsavedExportWarn.unsaved > 0 && (
                  <p>To save typed text: tap a requirement ID above to jump to that row, then click <strong>"Link Evidence"</strong> or <strong>"Save Action Plan"</strong>.</p>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 pt-1 flex gap-3">
              <button
                onClick={() => setShowUnsavedExportWarn(false)}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50 transition-colors"
              >
                {showUnsavedExportWarn.cleared > 0 ? 'Go back and re-link' : 'Cancel and save first'}
              </button>
              {/* Hard-block when cleared evidence exists — bypass not permitted.
                  Only allow bypass when there is unsaved typed text with no cleared evidence. */}
              {showUnsavedExportWarn.cleared === 0 && (
                <button
                  onClick={() => { const fn = showUnsavedExportWarn.onContinue; setShowUnsavedExportWarn(false); fn(); }}
                  className="flex-1 bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
                >
                  {showUnsavedExportWarn.action === 'print' ? 'Print anyway' : 'Export anyway'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Audit Cycle Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 px-6 pt-6 pb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Reset Entire Audit Cycle?</h2>
                <p className="text-sm text-slate mt-1 leading-relaxed">
                  This will permanently delete <strong>all manually-marked requirements, evidence notes, corrective action plans, and owner assignments</strong> for the current audit cycle. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-2">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-800 font-medium">
                ⚠ Permanent &amp; irreversible — days of evidence-gathering work will be lost.
              </div>
            </div>
            <div className="px-6 pb-5 pt-3 space-y-3">
              <label className="block text-xs font-semibold text-slate uppercase tracking-wide">
                Type <span className="font-bold text-red-600">RESET</span> to confirm
              </label>
              <input
                autoFocus
                value={resetPhrase}
                onChange={e => setResetPhrase(e.target.value)}
                placeholder="RESET"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300"
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={resetPhrase.trim() !== 'RESET'}
                  onClick={() => {
                    setCompletedIds(new Set());
                    setEvidenceInputs({});
                    setCorrActionInputs({});
                    setOwnerInputs({});
                    setEvidenceConfirmed(() => {
                      try { localStorage.removeItem(COMPLIANCE_EVIDENCE_CONFIRMED_KEY); } catch { /* unavailable */ }
                      return new Set<string>();
                    });
                    setCorrConfirmed(() => {
                      try { localStorage.removeItem(COMPLIANCE_CORR_CONFIRMED_KEY); } catch { /* unavailable */ }
                      return new Set<string>();
                    });
                    // #713 — also clear the "field was cleared after confirm" tracking sets
                    setEvidenceCleared(new Set());
                    setCorrCleared(new Set());
                    // Clear the audit trail so a reload shows an empty log
                    // instead of re-seeding from SEED_AUDIT_LOG.
                    clearAuditLog();
                    try { localStorage.removeItem(COMPLIANCE_AUDIT_LOG_KEY); } catch { /* unavailable */ }
                    // Mark as seeded so the useState initializer knows this
                    // is "reset to empty" rather than a truly fresh session.
                    safeSet(COMPLIANCE_AUDIT_SEEDED_KEY, '1');
                    // Hide the "Load Sample Audit" CTA permanently — the
                    // officer chose to reset, so the blank-state prompt must
                    // not reappear even though completedIds is now size 0.
                    safeSet(COMPLIANCE_AUDIT_CYCLE_STARTED_KEY, '1');
                    onAuditCycleStarted?.();
                    // #597 — record who triggered the reset and when
                    const resetTimestamp = new Date().toISOString();
                    const entry: ResetLogEntry = {
                      userName: currentStaff
                        ? `${currentStaff.firstName} ${currentStaff.lastName}`
                        : 'Unknown user',
                      timestamp: resetTimestamp,
                      action: 'AUDIT_RESET',
                    };
                    safeSet(COMPLIANCE_AUDIT_RESET_LOG_KEY, JSON.stringify(entry));
                    // Persist the reset timestamp so the next mount can tell
                    // whether the server's auditResetAt has already been applied.
                    safeSet(COMPLIANCE_AUDIT_RESET_AT_KEY, resetTimestamp);
                    // Wipe the server-side audit log so a GET on reload returns
                    // empty state instead of the pre-reset snapshot (#643).
                    fetch('/api/compliance/audit-log?orgId=default', { method: 'DELETE' })
                      .catch(() => { /* network unavailable — server copy will be
                                       cleared on the next successful request */ });
                    setLastResetEntry(entry);
                    setAuditFilter('All');
                    setAuditDateFrom('');
                    setAuditDateTo('');
                    setShowResetConfirm(false);
                    setResetPhrase('');
                    // Record the post-reset score (empty state → base Met items only)
                    appendScoreHistory(new Set(), {}, {});
                    onDemoDataCleared?.();
                  }}
                  className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Reset Audit Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────────

type WFTab = 'Dashboard' | 'Employee Profiles' | 'Exclusion & Screening' | 'Onboarding' | 'Performance Reviews' | 'Offboarding' | 'Compliance Standards';

const COMPLIANCE_STORAGE_KEY = 'sunrise-os:compliance-completed-ids';
const COMPLIANCE_EVIDENCE_KEY = 'sunrise-os:compliance-evidence-inputs';
const COMPLIANCE_CORR_KEY = 'sunrise-os:compliance-corr-action-inputs';

const COMPLIANCE_OWNER_KEY = 'sunrise-os:compliance-owner-inputs';
const COMPLIANCE_EVIDENCE_CONFIRMED_KEY = 'sunrise-os:compliance-evidence-confirmed';

const COMPLIANCE_DEMO_DATA_KEY = 'sunrise-os:compliance-demo-data';
const COMPLIANCE_STD_FILTER_KEY = 'sunrise-os:compliance-std-filter';
const COMPLIANCE_GAP_FILTER_KEY = 'sunrise-os:compliance-gap-filter';

const COMPLIANCE_AUDIT_RESET_LOG_KEY = 'sunrise-os:compliance-audit-reset-log';

const COMPLIANCE_AUDIT_LOG_KEY = 'sunrise-os:compliance-audit-log';
// Distinguishes "never visited" (no flag → show seeds) from "reset to empty"
// (flag present → keep empty so seeds don't re-appear after a reset + reload).
const COMPLIANCE_AUDIT_SEEDED_KEY = 'sunrise-os:compliance-audit-seeded';

const COMPLIANCE_AUDIT_CYCLE_STARTED_KEY = 'sunrise-os:compliance-audit-cycle-started';
const AUDIT_LOG_MAX_ENTRIES = 500;

const COMPLIANCE_AUDIT_RESET_AT_KEY = 'sunrise-os:compliance-audit-reset-at';

const COMPLIANCE_SCORE_HISTORY_KEY = 'sunrise-os:compliance-score-history';
const SEED_AUDIT_LOG: Array<{ id: string; timestamp: string; actionType: AuditActionType; reqId: string; reqName: string; officer: string; detail?: string }> = [
  { id: 'seed-01', timestamp: '2026-07-01T08:14:00.000Z', actionType: 'Marked Met',        reqId: 'CR-001', reqName: 'Written access to services policy with eligibility criteria and referral processes',        officer: 'Renée M. Caldwell' },
  { id: 'seed-02', timestamp: '2026-07-01T09:02:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-002', reqName: 'Individual service plan present for all clients within 30 days of admission',              officer: 'James S. Collins III', detail: 'ISP-template-v4.pdf' },
  { id: 'seed-03', timestamp: '2026-07-02T10:30:00.000Z', actionType: 'Marked Met',        reqId: 'CR-003', reqName: 'Written job descriptions for all positions with required qualifications',                  officer: 'Renée M. Caldwell' },
  { id: 'seed-04', timestamp: '2026-07-02T11:45:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-004', reqName: 'Annual performance measurement plan with documented QAPI projects',                        officer: 'Renée M. Caldwell', detail: 'Engage QAPI consultant by Aug 1; complete draft plan by Sep 15; submit for board approval by Oct 1.' },
  { id: 'seed-05', timestamp: '2026-07-03T08:55:00.000Z', actionType: 'Marked Met',        reqId: 'CR-005', reqName: 'Client rights and responsibilities document provided at admission and signed',             officer: 'James S. Collins III' },
  { id: 'seed-06', timestamp: '2026-07-03T13:10:00.000Z', actionType: 'Marked Met',        reqId: 'CR-006', reqName: 'Notice of Privacy Practices (NPP) provided to every patient at intake',                  officer: 'Renée M. Caldwell' },
  { id: 'seed-07', timestamp: '2026-07-07T09:00:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-007', reqName: 'Annual HIPAA security risk assessment completed and documented',                          officer: 'Renée M. Caldwell', detail: 'HIPAA-SRA-2026-draft.pdf' },
  { id: 'seed-08', timestamp: '2026-07-07T10:15:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-007', reqName: 'Annual HIPAA security risk assessment completed and documented',                          officer: 'Renée M. Caldwell', detail: 'Finalize SRA with IT vendor by Aug 15; remediate critical findings by Sep 1; document closure.' },
  { id: 'seed-09', timestamp: '2026-07-08T08:30:00.000Z', actionType: 'Marked Met',        reqId: 'CR-008', reqName: 'All staff complete HIPAA training within 30 days of hire and annually',                  officer: 'Renée M. Caldwell' },
  { id: 'seed-10', timestamp: '2026-07-08T09:45:00.000Z', actionType: 'Marked Met',        reqId: 'CR-009', reqName: 'Breach notification policy and designated HIPAA Privacy Officer in place',                officer: 'Renée M. Caldwell' },
  { id: 'seed-11', timestamp: '2026-07-09T11:00:00.000Z', actionType: 'Marked Met',        reqId: 'CR-010', reqName: 'Written consent for disclosure of SUD records separate from HIPAA consent',              officer: 'James S. Collins III' },
  { id: 'seed-12', timestamp: '2026-07-09T14:20:00.000Z', actionType: 'Marked Met',        reqId: 'CR-011', reqName: 'SUD treatment records stored separately with additional access controls',                 officer: 'Renée M. Caldwell' },
  { id: 'seed-13', timestamp: '2026-07-10T08:10:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-012', reqName: 'All clinical staff trained on 42 CFR Part 2 vs. HIPAA distinctions',                    officer: 'James S. Collins III', detail: '42CFR-training-completion-Jul2026.pdf' },
  { id: 'seed-14', timestamp: '2026-07-10T09:30:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-012', reqName: 'All clinical staff trained on 42 CFR Part 2 vs. HIPAA distinctions',                    officer: 'James S. Collins III', detail: 'Schedule make-up training for Kevin Wright and Marcus Thomas by Aug 15.' },
  { id: 'seed-15', timestamp: '2026-07-14T09:00:00.000Z', actionType: 'Marked Met',        reqId: 'CR-013', reqName: 'Residential and PHP/IOP programs licensed annually by MD BHBIS / OHCQ',                 officer: 'Renée M. Caldwell' },
  { id: 'seed-16', timestamp: '2026-07-14T10:30:00.000Z', actionType: 'Marked Met',        reqId: 'CR-014', reqName: 'Critical incidents reported to OHCQ within 24 hours of occurrence',                     officer: 'James S. Collins III' },
  { id: 'seed-17', timestamp: '2026-07-15T08:45:00.000Z', actionType: 'Marked Met',        reqId: 'CR-015', reqName: 'Minimum staffing ratios maintained per MD OHCQ COMAR 10.47 requirements',               officer: 'Jessica Torres' },
  { id: 'seed-18', timestamp: '2026-07-15T11:00:00.000Z', actionType: 'Marked Met',        reqId: 'CR-016', reqName: 'All billing providers enrolled in Maryland Medicaid with current NPIs',                  officer: 'Linda Vance' },
  { id: 'seed-19', timestamp: '2026-07-16T09:15:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-017', reqName: 'Prior authorization obtained before rendering billable Level of Care services',           officer: 'Linda Vance', detail: 'PA-process-SOP-v2.pdf' },
  { id: 'seed-20', timestamp: '2026-07-16T10:45:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-017', reqName: 'Prior authorization obtained before rendering billable Level of Care services',           officer: 'Linda Vance', detail: 'Update UR coordinator workflow to require PA confirmation before Level of Care change; deadline Aug 1.' },
  { id: 'seed-21', timestamp: '2026-07-17T08:30:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-018', reqName: 'All Medicaid-billable services documented within 24 hours per billing standards',        officer: 'James S. Collins III', detail: 'doc-timeliness-audit-Q2-2026.pdf' },
  { id: 'seed-22', timestamp: '2026-07-17T09:50:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-018', reqName: 'All Medicaid-billable services documented within 24 hours per billing standards',        officer: 'James S. Collins III', detail: 'Weekly timeliness report added to supervisor dashboard; counselors below 80% to receive coaching by Aug 1.' },
  { id: 'seed-23', timestamp: '2026-07-21T09:00:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-019', reqName: 'Annual performance reviews completed for all staff on anniversary dates',                officer: 'Renée M. Caldwell', detail: 'PR-schedule-2026-Q3.pdf' },
  { id: 'seed-24', timestamp: '2026-07-21T10:20:00.000Z', actionType: 'Action Plan Saved', reqId: 'CR-019', reqName: 'Annual performance reviews completed for all staff on anniversary dates',                officer: 'Renée M. Caldwell', detail: 'Kevin Wright review rescheduled to Aug 5 with James Collins. Tracking dashboard deployed for supervisors.' },
  { id: 'seed-25', timestamp: '2026-07-22T08:15:00.000Z', actionType: 'Marked Met',        reqId: 'CR-020', reqName: 'Group therapy sessions documented with attendance and participation notes',               officer: 'James S. Collins III' },
  { id: 'seed-26', timestamp: '2026-07-24T09:30:00.000Z', actionType: 'Evidence Linked',   reqId: 'CR-004', reqName: 'Annual performance measurement plan with documented QAPI projects',                       officer: 'Renée M. Caldwell', detail: 'QAPI-charter-draft-Jul2026.pdf' },
  { id: 'seed-27', timestamp: '2026-07-25T11:00:00.000Z', actionType: 'Marked Met',        reqId: 'CR-012', reqName: 'All clinical staff trained on 42 CFR Part 2 vs. HIPAA distinctions',                    officer: 'James S. Collins III' },
  { id: 'seed-28', timestamp: '2026-07-28T09:45:00.000Z', actionType: 'Marked Met',        reqId: 'CR-019', reqName: 'Annual performance reviews completed for all staff on anniversary dates',                officer: 'Renée M. Caldwell' },
];

const SAMPLE_COMPLETED_IDS = ['CR-007', 'CR-012'];

let _storageFullToastAt = 0;
// Set to true by any useState initializer that hits QuotaExceededError; consumed
// by a one-time useEffect so the toast fires safely after the first render.
let _initStorageFull = false;
export function WorkforceCompliance({ navigate, readOnly, requestedReqId }: Props) {
  // #591 — if launched via deep-link with a specific req, jump straight to Compliance Standards tab
  const [tab, setTab] = useState<WFTab>(() => requestedReqId ? 'Compliance Standards' : 'Dashboard');
  // Requested filter from Dashboard ring click — applied once when Standards tab mounts
  const [requestedStdFilter, setRequestedStdFilter] = useState<Exclude<CompStandard, 'All'> | null>(null);

  // ── Demo data state ─────────────────────────────────────────────────────────
  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    try { return localStorage.getItem(COMPLIANCE_DEMO_DATA_KEY) === '1'; } catch { return false; }
  });
  // True once an officer has ever loaded sample data OR confirmed a reset.
  // Keeps the "Load Sample Audit" CTA hidden after a reset even though
  // completedIds returns to size 0.
  const [auditCycleStarted, setAuditCycleStarted] = useState<boolean>(() => {
    try {
      if (localStorage.getItem(COMPLIANCE_AUDIT_CYCLE_STARTED_KEY) === '1') return true;
      // If evidence or corrective-action inputs were saved (e.g. the user saved
      // data but reloaded before a Met mark wrote the flag), treat the cycle as
      // already started so the "Load Sample Audit" CTA stays hidden.
      const ev = JSON.parse(localStorage.getItem(COMPLIANCE_EVIDENCE_KEY) ?? '{}');
      if (Object.values(ev).some((v) => typeof v === 'string' && v.trim() !== '')) return true;
      const ca = JSON.parse(localStorage.getItem(COMPLIANCE_CORR_KEY) ?? '{}');
      if (Object.values(ca).some((v) => typeof v === 'string' && v.trim() !== '')) return true;
      // If completed IDs exist (e.g. the cycle-started flag was evicted/cleared via
      // a partial reset but the officer already marked requirements Met), treat the
      // cycle as started so the "Load Sample Audit" CTA stays hidden.
      const ids = JSON.parse(localStorage.getItem(COMPLIANCE_STORAGE_KEY) ?? '[]');
      if (Array.isArray(ids) && ids.length > 0) return true;
      // If the audit log already has entries (e.g. a "Marked Met" write succeeded
      // but the cycle-started flag was never flushed due to a quota error), treat
      // the cycle as started so the "Load Sample Audit" CTA stays hidden.
      const log = JSON.parse(localStorage.getItem(COMPLIANCE_AUDIT_LOG_KEY) ?? '[]');
      if (Array.isArray(log) && log.length > 0) return true;
      return false;
    } catch { return false; }
  });
  // Bumping this key remounts ComplianceStandardsTab so it re-reads localStorage
  // (needed to pick up evidenceConfirmed / corrConfirmed written during seeding).
  const [compStandardsKey, setCompStandardsKey] = useState(0);
  // #685 — tracks whether the last localStorage write for the audit log hit a quota error
  const [storageQuotaFull, setStorageQuotaFull] = useState(false);

  // ── Compliance audit state lifted here so resets are atomic and the
  //    Dashboard KPI always reads the same source of truth as the Standards tab.
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_STORAGE_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [evidenceInputs, setEvidenceInputsRaw] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_EVIDENCE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [corrActionInputs, setCorrActionInputsRaw] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_CORR_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [ownerInputs, setOwnerInputsRaw] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_OWNER_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [auditLog, setAuditLogRaw] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_AUDIT_LOG_KEY);
      if (stored) {
        // Prune age + cap on every cold load so stale entries are cleaned up.
        const pruned = pruneAuditLog(JSON.parse(stored));
        try { localStorage.setItem(COMPLIANCE_AUDIT_LOG_KEY, JSON.stringify(pruned)); }
        catch (e) { if (e instanceof DOMException && e.name === 'QuotaExceededError') _initStorageFull = true; }
        return pruned;
      }
      // No stored log — check whether we've ever seeded before.
      // If the seeded flag exists the officer has visited (or reset) previously;
      // keep the trail empty so a reset + reload doesn't re-inject seed rows.
      const alreadySeeded = localStorage.getItem(COMPLIANCE_AUDIT_SEEDED_KEY);
      if (alreadySeeded) return [];
      // Truly fresh session: show seed data and mark as seeded so we never
      // re-inject it automatically again.
      try { localStorage.setItem(COMPLIANCE_AUDIT_SEEDED_KEY, '1'); }
      catch (e) { if (e instanceof DOMException && e.name === 'QuotaExceededError') _initStorageFull = true; }
      return SEED_AUDIT_LOG;
    } catch {
      return SEED_AUDIT_LOG;
    }
  });
  // ── Score history — rolling window used by the Dashboard sparkline ──────────
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>(() => {
    try {
      const storedRaw = localStorage.getItem(COMPLIANCE_SCORE_HISTORY_KEY);
      let history: ScoreHistoryEntry[] = storedRaw ? (JSON.parse(storedRaw) as ScoreHistoryEntry[]) : [];

      // On a truly fresh session, seed a realistic improvement trajectory.
      if (history.length === 0) {
        history = SEED_SCORE_HISTORY;
        try { localStorage.setItem(COMPLIANCE_SCORE_HISTORY_KEY, JSON.stringify(history)); }
        catch (e) { if (e instanceof DOMException && e.name === 'QuotaExceededError') _initStorageFull = true; }
      }

      // Reconcile: compute the current score from the same localStorage keys
      // used to initialise completedIds / evidenceInputs / corrActionInputs above.
      // If the last history point differs from the live score, append a corrective
      // entry so the sparkline endpoint always matches the KPI number.
      try {
        const ids = new Set<string>(JSON.parse(localStorage.getItem(COMPLIANCE_STORAGE_KEY) ?? '[]'));
        const ev: Record<string, string>  = JSON.parse(localStorage.getItem(COMPLIANCE_EVIDENCE_KEY) ?? '{}');
        const ca: Record<string, string>  = JSON.parse(localStorage.getItem(COMPLIANCE_CORR_KEY)     ?? '{}');
        const met = COMP_REQUIREMENTS.filter(r => reqIsEffectivelyMet(r, ids, ev, ca)).length;
        const currentScore = Math.round((met / COMP_REQUIREMENTS.length) * 100);
        const lastEntry = history[history.length - 1];
        if (!lastEntry || lastEntry.score !== currentScore) {
          const reconciled = [...history, { timestamp: new Date().toISOString(), score: currentScore }]
            .slice(-SCORE_HISTORY_MAX_ENTRIES);
          try { localStorage.setItem(COMPLIANCE_SCORE_HISTORY_KEY, JSON.stringify(reconciled)); }
          catch (e) { if (e instanceof DOMException && e.name === 'QuotaExceededError') _initStorageFull = true; }
          return reconciled;
        }
      } catch { /* reconciliation is best-effort — fall through to stored history */ }

      return history;
    } catch {
      return SEED_SCORE_HISTORY;
    }
  });

  const appendScoreHistory = (
    ids: Set<string>,
    evidence: Record<string, string>,
    corrAction: Record<string, string>,
  ) => {
    const met = COMP_REQUIREMENTS.filter(r => reqIsEffectivelyMet(r, ids, evidence, corrAction)).length;
    const score = Math.round((met / COMP_REQUIREMENTS.length) * 100);
    const entry: ScoreHistoryEntry = { timestamp: new Date().toISOString(), score };
    setScoreHistory(prev => {
      // Skip if score is unchanged — avoids duplicate points on repeat saves.
      const last = prev[prev.length - 1];
      if (last && last.score === score) return prev;
      const next = [...prev, entry].slice(-SCORE_HISTORY_MAX_ENTRIES);
      safeSet(COMPLIANCE_SCORE_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Cycle-start timestamp — used to roll back phantom sparkline entries ───
  // Stores the ISO timestamp of the moment the current audit cycle began.
  // When the cycle is fully reset (all evidence cleared), any score-history
  // entries added after this timestamp are removed so the sparkline does not
  // show phantom upticks from work that was undone.
  const [cycleStartedAt, setCycleStartedAt] = useState<string | null>(null);

  const rollbackScoreHistory = () => {
    if (!cycleStartedAt) return;
    setScoreHistory(prev => {
      // Remove all entries that were appended on or after the cycle started.
      const next = prev.filter(e => e.timestamp < cycleStartedAt);
      // If the rollback empties the history fall back to the seed so the
      // sparkline doesn't disappear entirely.
      const final = next.length >= 2 ? next : prev;
      safeSet(COMPLIANCE_SCORE_HISTORY_KEY, JSON.stringify(final));
      return final;
    });
    setCycleStartedAt(null);
  };

  // Callers must pass `detail` as a plain string value (a snapshot of the
  // input at click time), never as a reference to a state variable that can
  // change later.  Because JS strings are primitives, spreading `entry` into
  // the new object copies the value — subsequent mutations to the source input
  // cannot retroactively change what was recorded here.
  const addAuditEntry = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    setAuditLogRaw(prev => {
      // Find the most recent prior entry for this reqId + actionType combination.
      // If one exists and carried a detail value, capture it as previousDetail so
      // reviewers can see the before/after without cross-referencing timestamps.
      const priorEntry = [...prev].reverse().find(
        e => e.reqId === entry.reqId && e.actionType === entry.actionType
      );
      const newEntry: AuditLogEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...(priorEntry?.detail !== undefined ? { previousDetail: priorEntry.detail } : {}),
      };
      const appended: AuditLogEntry[] = [...prev, newEntry];
      // Cap the log: trim oldest entries beyond the max size.
      const next = appended.length > AUDIT_LOG_MAX_ENTRIES
        ? appended.slice(appended.length - AUDIT_LOG_MAX_ENTRIES)
        : appended;
      try {
        localStorage.setItem(COMPLIANCE_AUDIT_LOG_KEY, JSON.stringify(next));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          // #685 — flag triggers auto-scroll + highlight of export buttons in ComplianceStandardsTab
          setStorageQuotaFull(true);
          toast({
            title: 'Storage full — audit log not saved locally',
            description: 'Export a copy now to preserve the full trail.',
            variant: 'destructive',
            action: (
              <ToastAction
                altText="Export now"
                onClick={() => {
                  setTab('Compliance Standards');
                  setStorageQuotaFull(true);
                }}
              >
                Export now
              </ToastAction>
            ),
          });
        }
        // In-memory state (next) is still returned so the current session is unaffected.
      }
      return next;
    });
  };

  // ── Deferred init-storage-full toast ────────────────────────────────────────
  // useState initializers cannot call toast() during render. If any of them
  // detected a QuotaExceededError they set the module-level flag; we fire the
  // toast here, safely after the first render, and reset the flag.
  useEffect(() => {
    if (_initStorageFull) {
      _initStorageFull = false;
      toast({ title: 'Changes could not be saved locally — storage is full', variant: 'destructive' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── API sync ────────────────────────────────────────────────────────────────
  // hydrated tracks whether the initial GET has settled (success OR failure).
  // The debounced PUT must not fire until then — otherwise a slow GET response
  // could arrive after an already-sent PUT that carried empty/stale state and
  // silently wiped the server copy.
  const hydrated = useRef(false);

  // On mount, fetch from the API server. If it has a saved state, use it and
  // also refresh the localStorage mirror so the next cold-load is still instant.
  // hydrated.current is set to true in every exit path so the PUT gate lifts
  // exactly once, regardless of network outcome.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/compliance/audit-state?orgId=default')
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (!data) { hydrated.current = true; return; }

        // ── Audit-reset check (#643) ──────────────────────────────────────────
        // If the server has a newer auditResetAt than the one we last processed
        // locally, the reset was committed server-side (possibly from another
        // device or tab).  Clear the local audit log and advance our local
        // reset-at timestamp so this branch only fires once per reset.
        if (data.auditResetAt) {
          const serverResetTime = new Date(data.auditResetAt).getTime();
          const localResetIso   = localStorage.getItem(COMPLIANCE_AUDIT_RESET_AT_KEY);
          const localResetTime  = localResetIso ? new Date(localResetIso).getTime() : 0;
          if (serverResetTime > localResetTime) {
            // Erase local audit log so the trail starts empty after reload.
            setAuditLogRaw([]);
            try { localStorage.removeItem(COMPLIANCE_AUDIT_LOG_KEY); } catch { /* unavailable */ }
            // Mark as seeded so the useState initializer never re-injects seed rows.
            safeSet(COMPLIANCE_AUDIT_SEEDED_KEY, '1');
            // Record the server's reset timestamp so subsequent mounts skip this.
            safeSet(COMPLIANCE_AUDIT_RESET_AT_KEY, data.auditResetAt);
          }
        }

        const hasApiData =
          (data.completedIds?.length > 0) ||
          Object.keys(data.evidenceInputs ?? {}).length > 0 ||
          Object.keys(data.corrActionInputs ?? {}).length > 0 ||
          Object.keys(data.ownerInputs ?? {}).length > 0;
        if (!hasApiData) {
          // Server returned the empty default — localStorage copy is authoritative.
          hydrated.current = true;
          return;
        }
        const ids = new Set<string>(data.completedIds ?? []);
        const ev: Record<string, string> = data.evidenceInputs ?? {};
        const ca: Record<string, string> = data.corrActionInputs ?? {};
        const own: Record<string, string> = data.ownerInputs ?? {};
        setCompletedIds(ids);
        setEvidenceInputsRaw(ev);
        setCorrActionInputsRaw(ca);
        setOwnerInputsRaw(own);
        // Refresh localStorage mirror from the authoritative API copy.
        safeSet(COMPLIANCE_STORAGE_KEY, JSON.stringify([...ids]));
        safeSet(COMPLIANCE_EVIDENCE_KEY, JSON.stringify(ev));
        safeSet(COMPLIANCE_CORR_KEY, JSON.stringify(ca));
        safeSet(COMPLIANCE_OWNER_KEY, JSON.stringify(own));
        // Lift the PUT gate only after state setters have been called so the
        // subsequent PUT effect sees the hydrated values, not the boot defaults.
        hydrated.current = true;
      })
      .catch(() => {
        // Network unavailable — localStorage copy is the fallback.
        // Still lift the gate so the officer's subsequent edits sync when
        // connectivity is restored.
        hydrated.current = true;
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce-sync all four keys to the API whenever any one changes.
  // 800 ms debounce prevents flooding on rapid keystrokes while still
  // ensuring every change is durable within a second.
  // The hydrated guard prevents an early PUT from overwriting a valid server
  // copy before the initial GET has returned.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hydrated.current) return; // GET not yet settled — do not overwrite server
      fetch('/api/compliance/audit-state?orgId=default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedIds: [...completedIds],
          evidenceInputs,
          corrActionInputs,
          ownerInputs,
        }),
      }).catch(() => { /* network unavailable — localStorage copy is the fallback */ });
    }, 800);
    return () => clearTimeout(timer);
  }, [completedIds, evidenceInputs, corrActionInputs, ownerInputs]);

  // Cross-tab / cross-device sync — if another tab resets the audit log by
  // removing COMPLIANCE_AUDIT_LOG_KEY, mirror that change into this tab's
  // in-memory state and ensure the seeded flag is set so a subsequent reload
  // won't re-inject seed rows.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLIANCE_AUDIT_LOG_KEY && e.newValue === null) {
        // Another tab cleared the audit log — clear this tab's in-memory copy.
        setAuditLogRaw([]);
        // Make sure the seeded flag is present so we don't re-seed on next load.
        safeSet(COMPLIANCE_AUDIT_SEEDED_KEY, '1');
      }
      if (e.key === COMPLIANCE_AUDIT_SEEDED_KEY && e.newValue === '1') {
        // Another tab set the seeded flag (e.g. after writing fresh seeds on
        // first visit). Nothing to do in-memory, but the flag is now present
        // for the next cold-load in this tab, so no extra action is needed.
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Synchronous localStorage writers — called directly on every change so no
  // keystroke can be silently dropped when the user navigates away before
  // React's effect flush fires.
  const setEvidenceInputs = (next: Record<string, string>) => {
    setEvidenceInputsRaw(next);
    safeSet(COMPLIANCE_EVIDENCE_KEY, JSON.stringify(next));
  };

  const setCorrActionInputs = (next: Record<string, string>) => {
    setCorrActionInputsRaw(next);
    safeSet(COMPLIANCE_CORR_KEY, JSON.stringify(next));
  };

  // ── Load Sample Audit ───────────────────────────────────────────────────────
  const loadSampleAudit = () => {
    const ids = new Set<string>(SAMPLE_COMPLETED_IDS);
    setCompletedIds(ids);
    setEvidenceInputsRaw(SAMPLE_EVIDENCE_INPUTS);
    setCorrActionInputsRaw(SAMPLE_CORR_ACTION_INPUTS);
    setOwnerInputsRaw(SAMPLE_OWNER_INPUTS);
    // Persist to localStorage so everything survives a reload
    safeSet(COMPLIANCE_STORAGE_KEY, JSON.stringify([...ids]));
    safeSet(COMPLIANCE_EVIDENCE_KEY, JSON.stringify(SAMPLE_EVIDENCE_INPUTS));
    safeSet(COMPLIANCE_CORR_KEY, JSON.stringify(SAMPLE_CORR_ACTION_INPUTS));
    safeSet(COMPLIANCE_OWNER_KEY, JSON.stringify(SAMPLE_OWNER_INPUTS));
    // Write evidenceConfirmed / corrConfirmed directly to localStorage; the
    // ComplianceStandardsTab remount (key bump below) will pick them up via
    // its useState initializer.
    safeSet(COMPLIANCE_EVIDENCE_CONFIRMED_KEY, JSON.stringify(SAMPLE_EVIDENCE_CONFIRMED));
    safeSet(COMPLIANCE_CORR_CONFIRMED_KEY, JSON.stringify(SAMPLE_CORR_CONFIRMED));
    // Mark demo data active
    safeSet(COMPLIANCE_DEMO_DATA_KEY, '1');
    setIsDemoData(true);
    // Hide the "Load Sample Audit" CTA permanently — the officer has now
    // interacted with the audit, so the blank-state prompt should never return.
    safeSet(COMPLIANCE_AUDIT_CYCLE_STARTED_KEY, '1');
    setAuditCycleStarted(true);
    // Remount ComplianceStandardsTab so it re-reads confirmed sets from localStorage
    setCompStandardsKey(k => k + 1);
  };

  const setOwnerInputs = (next: Record<string, string>) => {
    setOwnerInputsRaw(next);
    safeSet(COMPLIANCE_OWNER_KEY, JSON.stringify(next));
  };

  // completedIds is toggled on button clicks (not keystrokes), so a single
  // post-render effect is sufficient here.
  useEffect(() => {
    safeSet(COMPLIANCE_STORAGE_KEY, JSON.stringify([...completedIds]));
  }, [completedIds]);

  // ── Demo tour state ─────────────────────────────────────────────────────────
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [visitedTourSteps, setVisitedTourSteps] = useState<Set<number>>(new Set());

  // #671 — auto-start tour when ?tour=1 is present in the URL on mount.
  // Remove the param immediately so a hard-reload doesn't re-trigger it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') === '1') {
      params.delete('tour');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
      window.history.replaceState(null, '', newUrl);
      handleTourStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTourStart = () => {
    setTourStep(0);
    setVisitedTourSteps(new Set([0]));
    setTab(TOUR_STEPS[0].tab as WFTab);
    setIsTourActive(true);
  };
  const handleTourNext = () => {
    const next = tourStep + 1;
    if (next < TOUR_STEPS.length) {
      setTourStep(next);
      setVisitedTourSteps(prev => new Set(prev).add(next));
      setTab(TOUR_STEPS[next].tab as WFTab);
    }
  };
  const handleTourPrev = () => {
    const prev = tourStep - 1;
    if (prev >= 0) {
      setTourStep(prev);
      setVisitedTourSteps(p => new Set(p).add(prev));
      setTab(TOUR_STEPS[prev].tab as WFTab);
    }
  };
  const handleTourEnd = () => {
    setIsTourActive(false);
    setTourStep(0);
    setVisitedTourSteps(new Set());
  };
  const handleTourGoTo = (index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setTourStep(index);
      setVisitedTourSteps(prev => new Set(prev).add(index));
      setTab(TOUR_STEPS[index].tab as WFTab);
    }
  };

  const tabs: WFTab[] = ['Dashboard', 'Employee Profiles', 'Exclusion & Screening', 'Onboarding', 'Performance Reviews', 'Offboarding', 'Compliance Standards'];

  const alerts: Partial<Record<WFTab, number>> = {
    'Employee Profiles': EMPLOYEES.filter(e => e.credentialAlerts > 0 || e.supervisionStatus === 'Overdue' || e.trainingCompliance < 80).length,
    'Exclusion & Screening': EXCLUSION_RECORDS.filter(r => ['oig','sam','stateMedicaid','criminalBG','drugScreen','tbHealth'].some(k => (r as any)[k].result !== 'Clear')).length,
    'Onboarding': ONBOARDING_CASES.filter(o => o.status === 'Overdue').length,
    'Performance Reviews': PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue').length,
    'Offboarding': OFFBOARDING_CASES.length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Workforce Compliance & Development</h1>
          <p className="text-slate text-sm mt-0.5">Credentialing · Background screening · Onboarding · Performance · Offboarding · Behavioral-health specific</p>
        </div>
        <div className="flex items-center gap-2">
          {!isTourActive && (
            <button
              onClick={handleTourStart}
              className="border border-orange/40 text-orange text-sm px-3 py-2 rounded-xl hover:bg-orange/5 transition-colors flex items-center gap-1.5 font-medium"
            >
              ▶ Demo Tour
            </button>
          )}
          <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" />Add Employee
          </LockedButton>
        </div>
      </div>

      <div id="wc-tour-kpis" className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Staff', value: EMPLOYEES.filter(e => e.status === 'Active').length, sub: `${EMPLOYEES.length} total headcount`, color: 'text-navy' },
          { label: 'Credential Alerts', value: EMPLOYEES.reduce((n, e) => n + e.credentialAlerts, 0), sub: 'Expiring within 120 days', color: 'text-amber-600' },
          { label: 'Overdue Reviews', value: PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue').length, sub: 'Performance evaluations', color: PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue').length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Avg Training Compliance', value: `${Math.round(EMPLOYEES.reduce((s, e) => s + e.trainingCompliance, 0) / EMPLOYEES.length)}%`, sub: 'Organization-wide', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Load Sample Audit CTA — visible only on a completely blank session ── */}
      {/* auditCycleStarted gates the CTA independently of completedIds.size so  */}
      {/* that a reset (which clears completedIds back to 0) does not re-surface  */}
      {/* the prompt — the officer already chose to start fresh, not reload demo  */}
      {/* data.                                                                   */}
      {completedIds.size === 0 && !auditCycleStarted && !readOnly && (
        <div id="wc-tour-load-sample" className="flex items-center justify-between bg-gradient-to-r from-navy/5 to-orange/5 border border-orange/20 rounded-xl px-5 py-4">
          <div>
            <div className="text-sm font-bold text-navy">No audit data yet</div>
            <div className="text-xs text-slate mt-0.5">Load a realistic sample audit to see the compliance tracker in action — 85 % score, open gaps across 3 frameworks, owner assignments, and evidence filed.</div>
          </div>
          <button
            onClick={loadSampleAudit}
            className="shrink-0 ml-6 btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Load Sample Audit
          </button>
        </div>
      )}

      {/* ── Demo data banner — shown whenever sample data is active ── */}
      {isDemoData && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="font-semibold">Demo data — not real audit records.</span>
          <span className="text-amber-700">This session is pre-loaded with sample compliance data for demonstration purposes only. Use "Reset Audit Cycle" in the Compliance Standards tab to start a clean audit.</span>
        </div>
      )}

      <div id="wc-tour-tab-bar" className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {(alerts[t] ?? 0) > 0 && (
              <span className="text-[9px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                {alerts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id="wc-tour-standards-header">
        {tab === 'Dashboard'             && <DashboardTab navigate={navigate} onOpenComplianceStandards={(filter) => { if (filter) setRequestedStdFilter(filter); setTab('Compliance Standards'); }} completedIds={completedIds} evidenceInputs={evidenceInputs} corrActionInputs={corrActionInputs} scoreHistory={scoreHistory} />}
        {tab === 'Employee Profiles'     && <EmployeeProfilesTab />}
        {tab === 'Exclusion & Screening' && <ExclusionTab readOnly={readOnly} />}
        {tab === 'Onboarding'            && <OnboardingTab readOnly={readOnly} />}
        {tab === 'Performance Reviews'   && <PerformanceTab readOnly={readOnly} />}
        {tab === 'Offboarding'           && <OffboardingTab readOnly={readOnly} />}
        {tab === 'Compliance Standards'  && <ComplianceStandardsTab key={compStandardsKey} readOnly={readOnly} completedIds={completedIds} setCompletedIds={setCompletedIds} evidenceInputs={evidenceInputs} setEvidenceInputs={setEvidenceInputs} corrActionInputs={corrActionInputs} setCorrActionInputs={setCorrActionInputs} ownerInputs={ownerInputs} setOwnerInputs={setOwnerInputs} requestedStdFilter={requestedStdFilter} onRequestedFilterApplied={() => setRequestedStdFilter(null)} auditLog={auditLog} addAuditEntry={addAuditEntry} clearAuditLog={() => setAuditLogRaw([])} requestedReqId={requestedReqId} onDemoDataCleared={() => { setIsDemoData(false); try { localStorage.removeItem(COMPLIANCE_DEMO_DATA_KEY); } catch { /* unavailable */ } }} onAuditCycleStarted={() => { safeSet(COMPLIANCE_AUDIT_CYCLE_STARTED_KEY, '1'); setAuditCycleStarted(true); setCycleStartedAt(new Date().toISOString()); }} onAuditCycleReset={() => { try { localStorage.removeItem(COMPLIANCE_AUDIT_CYCLE_STARTED_KEY); } catch { /* unavailable */ } setAuditCycleStarted(false); }} appendScoreHistory={appendScoreHistory} rollbackScoreHistory={rollbackScoreHistory} isTourActive={isTourActive} storageQuotaFull={storageQuotaFull} onQuotaFlagCleared={() => setStorageQuotaFull(false)} />}
      </div>

      {/* ── Demo tour overlay ─────────────────────────────────────────────── */}
      {isTourActive && (
        <ComplianceDemoTour
          steps={TOUR_STEPS}
          step={tourStep}
          visitedSteps={visitedTourSteps}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onEnd={handleTourEnd}
          onGoTo={handleTourGoTo}
        />
      )}
    </div>
  );
}


function StandardRing({
  std, completedIds, evidenceInputs, corrActionInputs, isActive, onClick,
}: {
  std: Exclude<CompStandard, 'All'>;
  completedIds: Set<string>;
  evidenceInputs: Record<string, string>;
  corrActionInputs: Record<string, string>;
  isActive: boolean;
  onClick: () => void;
}) {
  const reqs = COMP_REQUIREMENTS.filter(r => r.standard === std);
  const total = reqs.length;

  // Requirements that are "base met" — original status Met or manually checked
  const baseMetCount = reqs.filter(
    r => r.status === 'Met' || completedIds.has(r.id),
  ).length;

  // Requirements that reach "effectively met" only via evidence + corrective-action
  // (not already base-met) — shown as a distinct cyan arc
  const evidOnlyCount = reqs.filter(
    r =>
      r.status !== 'Met' &&
      !completedIds.has(r.id) &&
      !!evidenceInputs[r.id]?.trim() &&
      !!corrActionInputs[r.id]?.trim(),
  ).length;

  const effectiveMet = baseMetCount + evidOnlyCount;
  const pct = total > 0 ? Math.round((effectiveMet / total) * 100) : 100;

  const RADIUS = 26;
  const CX = 32;
  const CY = 32;
  const circ = 2 * Math.PI * RADIUS;

  const baseArc = total > 0 ? (baseMetCount / total) * circ : circ;
  const evidArc = total > 0 ? (evidOnlyCount / total) * circ : 0;
  // rotation offsets so arcs don't overlap
  const baseDeg = -90; // starts at 12 o'clock
  const evidDeg = baseDeg + (baseMetCount / (total || 1)) * 360;

  const ringColor =
    pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
  const textColor =
    pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <button
      onClick={onClick}
      title={`${std}: ${effectiveMet}/${total} requirements met or remediated${evidOnlyCount > 0 ? ` (${evidOnlyCount} via evidence + plan)` : ''}`}
      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all ${
        isActive
          ? 'border-orange bg-orange/5 shadow-sm'
          : 'border-border hover:border-navy/30 hover:bg-gray-50'
      }`}
    >
      {/* SVG donut ring */}
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
        {/* track */}
        <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        {/* base-met arc */}
        <circle
          cx={CX} cy={CY} r={RADIUS} fill="none"
          stroke={ringColor} strokeWidth="6"
          strokeDasharray={`${baseMetCount > 0 ? baseArc : 0} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(${baseDeg} ${CX} ${CY})`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.4s ease' }}
        />
        {/* evidence-only arc (cyan) */}
        <circle
          cx={CX} cy={CY} r={RADIUS} fill="none"
          stroke="#06b6d4" strokeWidth="6"
          strokeDasharray={`${evidOnlyCount > 0 ? evidArc : 0} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(${evidDeg} ${CX} ${CY})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* centre label */}
        <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fontWeight="bold" fill={ringColor}>
          {effectiveMet}/{total}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="#64748b">
          {pct}%
        </text>
      </svg>

      {/* Standard name */}
      <div className={`text-[11px] font-semibold text-center leading-tight ${isActive ? 'text-orange' : 'text-navy'}`}>
        {STD_SHORT[std]}
      </div>

      {/* #575 — show open gaps count + evidence badge */}
      {(() => {
        const openGaps = reqs.filter(r => !reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs)).length;
        return (
          <div className="flex flex-col items-center gap-0.5">
            {openGaps > 0 ? (
              <div className="text-[9px] text-red-600 font-semibold bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 leading-none">
                {openGaps} gap{openGaps !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="text-[9px] text-green-600 font-semibold bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 leading-none">
                ✓ all met
              </div>
            )}
            {evidOnlyCount > 0 && (
              <div className="text-[9px] text-cyan-600 font-semibold bg-cyan-50 border border-cyan-200 rounded-full px-1.5 py-0.5 leading-none">
                +{evidOnlyCount} evid.
              </div>
            )}
          </div>
        );
      })()}
    </button>
  );
}

const COMPLIANCE_CORR_CONFIRMED_KEY = 'sunrise-os:compliance-corr-confirmed';

function MiniStandardRing({
  std,
  completedIds,
  evidenceInputs,
  corrActionInputs,
}: {
  std: Exclude<CompStandard, 'All'>;
  completedIds: Set<string>;
  evidenceInputs: Record<string, string>;
  corrActionInputs: Record<string, string>;
}) {
  const reqs = COMP_REQUIREMENTS.filter(r => r.standard === std);
  const total = reqs.length;
  const effectiveMet = reqs.filter(r =>
    reqIsEffectivelyMet(r, completedIds, evidenceInputs, corrActionInputs),
  ).length;
  const pct = total > 0 ? Math.round((effectiveMet / total) * 100) : 100;

  const RADIUS = 12;
  const CX = 16;
  const CY = 16;
  const circ = 2 * Math.PI * RADIUS;
  const arc = total > 0 ? (effectiveMet / total) * circ : circ;

  const ringColor = pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
  const textColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0">
        {/* track */}
        <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        {/* progress arc */}
        {effectiveMet > 0 && (
          <circle
            cx={CX} cy={CY} r={RADIUS} fill="none"
            stroke={ringColor} strokeWidth="3"
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="butt"
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        )}
        {/* centre pct label */}
        <text
          x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fontSize="6.5" fontWeight="bold" fill={ringColor}>
          {pct}%
        </text>
      </svg>
      <div className={`text-[8.5px] font-semibold text-center leading-tight ${textColor}`} style={{ maxWidth: 36 }}>
        {STD_SHORT[std]}
      </div>
    </div>
  );
}

interface AuditLogEntry {
  id: string;           // unique entry id (timestamp + random suffix)
  timestamp: string;    // ISO string
  actionType: AuditActionType;
  reqId: string;
  reqName: string;
  officer: string;
  // SNAPSHOT — this is the string value captured at the moment the officer
  // clicked Save, not a reference to the live input state.  Subsequent edits
  // to the evidence or corrective-action field do NOT mutate this field; each
  // new save appends a fresh AuditLogEntry instead.
  detail?: string;
  // When a reqId + actionType pair is saved more than once, previousDetail
  // captures the detail value from the immediately preceding entry so
  // reviewers can see exactly what changed without cross-referencing rows.
  previousDetail?: string;
}

function pruneAuditLog(entries: AuditLogEntry[]): AuditLogEntry[] {
  const cutoff = Date.now() - AUDIT_LOG_MAX_AGE_MS;
  const recent = entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  // If still over the hard cap, keep the newest AUDIT_LOG_MAX_ENTRIES.
  return recent.length > AUDIT_LOG_MAX_ENTRIES
    ? recent.slice(recent.length - AUDIT_LOG_MAX_ENTRIES)
    : recent;
}

const AUDIT_LOG_MAX_AGE_MS  = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

interface ScoreHistoryEntry { timestamp: string; score: number }

const SAMPLE_OWNER_INPUTS: Record<string, string> = {
  'CR-004': 'Renée M. Caldwell',
  'CR-007': 'Renée M. Caldwell',
  'CR-012': 'James S. Collins III',
  'CR-017': 'Linda Vance',
  'CR-018': 'James S. Collins III',
  'CR-019': 'Renée M. Caldwell',
};

const SAMPLE_EVIDENCE_INPUTS: Record<string, string> = {
  'CR-004': 'QAPI-charter-draft-Jul2026.pdf',
  'CR-017': 'PA-process-SOP-v2.pdf',
  'CR-018': 'doc-timeliness-audit-Q2-2026.pdf',
};

const SAMPLE_EVIDENCE_CONFIRMED = ['CR-004', 'CR-007', 'CR-012', 'CR-017', 'CR-018'];

const SAMPLE_CORR_CONFIRMED     = ['CR-007', 'CR-012', 'CR-017', 'CR-019'];

const SAMPLE_CORR_ACTION_INPUTS: Record<string, string> = {
  'CR-017': 'Update UR coordinator workflow to require PA confirmation before Level of Care change; deadline Aug 1.',
  'CR-019': 'Kevin Wright review rescheduled to Aug 5 with James Collins. Tracking dashboard deployed for supervisors.',
};

const SEED_SCORE_HISTORY: ScoreHistoryEntry[] = [
  { timestamp: '2026-04-01T09:00:00.000Z', score: 62 },
  { timestamp: '2026-04-22T09:00:00.000Z', score: 65 },
  { timestamp: '2026-05-06T09:00:00.000Z', score: 70 },
  { timestamp: '2026-05-20T09:00:00.000Z', score: 74 },
  { timestamp: '2026-06-03T09:00:00.000Z', score: 79 },
  { timestamp: '2026-06-17T09:00:00.000Z', score: 84 },
  { timestamp: '2026-07-08T09:00:00.000Z', score: 88 },
  { timestamp: '2026-07-22T09:00:00.000Z', score: 90 },
];

const SCORE_HISTORY_MAX_ENTRIES = 30;

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      const now = Date.now();
      if (now - _storageFullToastAt > 2000) {
        _storageFullToastAt = now;
        toast({
          title: 'Changes could not be saved locally — storage is full',
          variant: 'destructive',
        });
      }
    }
  }
}
