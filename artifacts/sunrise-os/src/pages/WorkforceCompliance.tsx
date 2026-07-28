import React, { useState, useEffect } from 'react';
import { Screen } from '../App';
import {
  Users, ShieldCheck, AlertTriangle, CheckCircle, Clock, XCircle,
  Plus, ChevronDown, ChevronUp, Award, GraduationCap, UserCheck,
  UserCog, FileText, TrendingUp, BarChart2, Briefcase, Calendar,
  LogOut, Search, Building2, MapPin, Star, ClipboardList
} from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

// ─── Types ─────────────────────────────────────────────────────────────────────

type EmploymentType = 'Full-Time' | 'Part-Time' | 'PRN' | 'Contractor' | 'Intern' | 'Volunteer';
type EmploymentStatus = 'Active' | 'Onboarding' | 'Leave' | 'Separated';
type ScreeningResult = 'Clear' | 'Flag' | 'Pending' | 'Overdue';
type ReviewStatus = 'Scheduled' | 'Completed' | 'Overdue' | 'Pending Signature';
type ReviewType = '30-Day' | '60-Day' | '90-Day' | 'Annual' | 'Probationary' | 'PIP';
type OnboardStatus = 'In Progress' | 'Pending Approval' | 'Complete' | 'Overdue';

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

// ─── Dashboard KPIs ────────────────────────────────────────────────────────────

function DashboardTab({ navigate, onOpenComplianceStandards, completedIds }: {
  navigate: (s: Screen) => void;
  onOpenComplianceStandards: () => void;
  completedIds: Set<string>;
}) {
  const activeCount = EMPLOYEES.filter(e => e.status === 'Active').length;
  const onboardingCount = EMPLOYEES.filter(e => e.status === 'Onboarding').length;
  const credAlerts = EMPLOYEES.reduce((n, e) => n + e.credentialAlerts, 0);
  const trainingGaps = EMPLOYEES.filter(e => e.trainingCompliance < 80).length;
  const supervisionOverdue = EMPLOYEES.filter(e => e.supervisionStatus === 'Overdue').length;
  const reviewsOverdue = PERFORMANCE_REVIEWS.filter(r => r.status === 'Overdue').length;

  const compMet = COMP_REQUIREMENTS.filter(r => r.status === 'Met' || completedIds.has(r.id)).length;
  const compTotal = COMP_REQUIREMENTS.length;
  const compScore = Math.round((compMet / compTotal) * 100);
  const compDot = compScore >= 90 ? 'green' : compScore >= 75 ? 'amber' : 'red';
  const compColor = compScore >= 90 ? 'text-green-600' : compScore >= 75 ? 'text-amber-600' : 'text-red-600';

  const kpis: Array<{ label: string; value: string | number; sub: string; color: string; dot: string; detail: string; onClick?: () => void }> = [
    {
      label: 'Compliance Audit Score', value: `${compScore}%`,
      sub: `${compMet} of ${compTotal} requirements met`,
      color: compColor, dot: compDot,
      detail: 'CARF · HIPAA · 42 CFR Part 2 · MD OHCQ · Medicaid · Internal Policy — tap to open Compliance Standards',
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
        <div className="grid grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            kpi.onClick ? (
              <button key={i} onClick={kpi.onClick}
                className="card hover:border-orange/40 hover:bg-orange/5 transition-colors text-left group">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide leading-tight pr-2 group-hover:text-orange transition-colors">{kpi.label}</div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${dotColor[kpi.dot]}`} />
                </div>
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate mt-0.5 mb-2">{kpi.sub}</div>
                <div className="text-[10px] text-slate border-t border-border pt-2 leading-relaxed">{kpi.detail}</div>
              </button>
            ) : (
              <div key={i} className="card hover:border-orange/30 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-xs font-semibold text-slate uppercase tracking-wide leading-tight pr-2">{kpi.label}</div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${dotColor[kpi.dot]}`} />
                </div>
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate mt-0.5 mb-2">{kpi.sub}</div>
                <div className="text-[10px] text-slate border-t border-border pt-2 leading-relaxed">{kpi.detail}</div>
              </div>
            )
          ))}
        </div>
      </div>

      <div>
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

function ComplianceStandardsTab({ readOnly, completedIds, setCompletedIds }: {
  readOnly?: boolean;
  completedIds: Set<string>;
  setCompletedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [stdFilter, setStdFilter] = useState<CompStandard>('All');
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_EVIDENCE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [corrActionInputs, setCorrActionInputs] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_CORR_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [showReport, setShowReport] = useState(false);
  const [compSaved, setCompSaved] = useState<string | null>(null);
  const saveCompAction = (msg: string) => { setCompSaved(msg); setTimeout(() => setCompSaved(null), 2500); };
  const [evidenceSavedId, setEvidenceSavedId] = useState<string | null>(null);
  const [corrSavedId, setCorrSavedId] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(COMPLIANCE_EVIDENCE_KEY, JSON.stringify(evidenceInputs)); } catch { /* unavailable */ }
  }, [evidenceInputs]);

  useEffect(() => {
    try { localStorage.setItem(COMPLIANCE_CORR_KEY, JSON.stringify(corrActionInputs)); } catch { /* unavailable */ }
  }, [corrActionInputs]);

  const standards: CompStandard[] = ['All', 'CARF', 'HIPAA', '42 CFR Part 2', 'State (MD OHCQ)', 'Medicaid', 'Internal Policy'];
  const filtered = COMP_REQUIREMENTS.filter(r => stdFilter === 'All' || r.standard === stdFilter);

  const met = COMP_REQUIREMENTS.filter(r => r.status === 'Met' || completedIds.has(r.id)).length;
  const total = COMP_REQUIREMENTS.length;
  const score = Math.round((met / total) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate">Track evidence of compliance, assign corrective actions, and assess audit readiness across all regulatory standards.</div>
        <div className="flex items-center gap-2">
          {(completedIds.size > 0 || Object.values(evidenceInputs).some(v => v.trim()) || Object.values(corrActionInputs).some(v => v.trim())) && (
            <button
              onClick={() => {
                if (confirm('Reset all manually-marked requirements? This clears your current audit cycle progress, including evidence notes and corrective action entries.')) {
                  setCompletedIds(new Set());
                  setEvidenceInputs({});
                  setCorrActionInputs({});
                }
              }}
              className="border border-border text-sm px-4 py-2 rounded-xl text-slate hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              Reset Audit Cycle
            </button>
          )}
          <button onClick={() => setShowReport(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Generate Readiness Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Overall Score', value: `${score}%`, color: score >= 90 ? 'text-green-600' : score >= 75 ? 'text-amber-600' : 'text-red-600', sub: `${met} of ${total} requirements met` },
          { label: 'CARF Requirements', value: `${COMP_REQUIREMENTS.filter(r => r.standard === 'CARF' && (r.status === 'Met' || completedIds.has(r.id))).length}/${COMP_REQUIREMENTS.filter(r => r.standard === 'CARF').length}`, color: 'text-navy', sub: 'Standards satisfied' },
          { label: 'Open Gaps', value: COMP_REQUIREMENTS.filter(r => r.status === 'Gap' && !completedIds.has(r.id)).length, color: 'text-red-600', sub: 'Require corrective action' },
          { label: 'Partial / Incomplete', value: COMP_REQUIREMENTS.filter(r => r.status === 'Partial' && !completedIds.has(r.id)).length, color: 'text-amber-600', sub: 'Evidence or remediation needed' },
        ].map(k => (
          <div key={k.label} className="card">
            <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
            <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {standards.map(s => (
          <button key={s} onClick={() => setStdFilter(s)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${stdFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border hover:border-navy/40'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(req => {
          const isCompleted = completedIds.has(req.id);
          const effectiveStatus = isCompleted ? 'Met' : req.status;
          const isSelected = selectedReq === req.id;
          return (
            <div key={req.id} className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-orange shadow-sm' : 'border-border'}`}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedReq(isSelected ? null : req.id)}
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_CHIP[effectiveStatus]}`}>{effectiveStatus}</span>
                <span className="text-[10px] font-semibold text-slate uppercase tracking-wider shrink-0 w-28">{req.standard}</span>
                <span className="text-xs font-medium text-navy flex-1">{req.requirement}</span>
                <span className="text-[10px] text-slate shrink-0">{req.category}</span>
                {req.dueDate && !isCompleted && <span className="text-[10px] text-slate shrink-0">Due: {req.dueDate}</span>}
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
                        onChange={e => setEvidenceInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
                        placeholder="e.g. Policy-HIPAA-NPP-v4.pdf, 2026 CARF Self-Study Section 3.docx"
                      />
                      <LockedButton locked={readOnly || !evidenceInputs[req.id]?.trim()} onClick={() => {
                          saveCompAction(`Evidence linked for ${req.id}`);
                          setEvidenceSavedId(req.id);
                          setTimeout(() => setEvidenceSavedId(null), 2000);
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
                      onChange={e => setCorrActionInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
                      placeholder="Describe corrective actions planned or in progress, responsible person, and target completion date..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <LockedButton locked={readOnly || !corrActionInputs[req.id]?.trim()} onClick={() => {
                        saveCompAction(`Corrective action saved for ${req.id}`);
                        setCorrSavedId(req.id);
                        setTimeout(() => setCorrSavedId(null), 2000);
                      }}
                      className={`border text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors ${corrSavedId === req.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-slate hover:bg-white'}`}>
                      {corrSavedId === req.id ? '✓ Saved' : 'Save Action Plan'}
                    </LockedButton>
                    {!isCompleted && (
                      <LockedButton locked={readOnly} onClick={() => {
                        setCompletedIds(prev => new Set([...prev, req.id]));
                        saveCompAction(`${req.id} marked as Met`);
                      }} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">
                        Mark as Met ✓
                      </LockedButton>
                    )}
                    {isCompleted && (
                      <button onClick={() => setCompletedIds(prev => { const n = new Set(prev); n.delete(req.id); return n; })}
                        className="text-xs text-slate border border-border px-3 py-1.5 rounded-lg hover:bg-white">
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {compSaved && (
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
                  const stdMet = stdReqs.filter(r => r.status === 'Met' || completedIds.has(r.id)).length;
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
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type WFTab = 'Dashboard' | 'Employee Profiles' | 'Exclusion & Screening' | 'Onboarding' | 'Performance Reviews' | 'Offboarding' | 'Compliance Standards';

const COMPLIANCE_STORAGE_KEY = 'sunrise-os:compliance-completed-ids';
const COMPLIANCE_EVIDENCE_KEY = 'sunrise-os:compliance-evidence-inputs';

const COMPLIANCE_CORR_KEY = 'sunrise-os:compliance-corr-action-inputs';

export function WorkforceCompliance({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<WFTab>('Dashboard');
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COMPLIANCE_STORAGE_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPLIANCE_STORAGE_KEY, JSON.stringify([...completedIds]));
    } catch {
      // localStorage unavailable — silently continue
    }
  }, [completedIds]);

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
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Employee
        </LockedButton>
      </div>

      <div className="grid grid-cols-4 gap-4">
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

      <div className="flex gap-1 border-b border-border">
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

      <div>
        {tab === 'Dashboard'             && <DashboardTab navigate={navigate} onOpenComplianceStandards={() => setTab('Compliance Standards')} completedIds={completedIds} />}
        {tab === 'Employee Profiles'     && <EmployeeProfilesTab />}
        {tab === 'Exclusion & Screening' && <ExclusionTab readOnly={readOnly} />}
        {tab === 'Onboarding'            && <OnboardingTab readOnly={readOnly} />}
        {tab === 'Performance Reviews'   && <PerformanceTab readOnly={readOnly} />}
        {tab === 'Offboarding'           && <OffboardingTab readOnly={readOnly} />}
        {tab === 'Compliance Standards'  && <ComplianceStandardsTab readOnly={readOnly} completedIds={completedIds} setCompletedIds={setCompletedIds} />}
      </div>
    </div>
  );
}
