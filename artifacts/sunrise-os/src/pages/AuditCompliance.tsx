import React, { useState } from 'react';
import { Screen } from '../App';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, FileText, Download, RefreshCw, ChevronDown, ChevronRight, X } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type FindingLevel = 'Critical' | 'Major' | 'Minor' | 'Observation';
type FindingStatus = 'Open' | 'In Progress' | 'Resolved' | 'Accepted Risk';

interface Finding {
  id: string;
  standard: string;
  description: string;
  level: FindingLevel;
  status: FindingStatus;
  owner: string;
  due: string;
  notes: string;
}

const CARF_STANDARDS = [
  { section: '1. Governance / Leadership',        total: 18, met: 17, score: 94 },
  { section: '2. Human Resources',               total: 22, met: 21, score: 95 },
  { section: '3. Rights & Responsibilities',     total: 14, met: 14, score: 100 },
  { section: '4. Accessibility & Inclusion',     total: 12, met: 11, score: 92 },
  { section: '5. Performance Improvement',       total: 16, met: 14, score: 88 },
  { section: '6. Program/Service Structure',     total: 28, met: 25, score: 89 },
  { section: '7. Clinical Records',              total: 20, met: 17, score: 85 },
  { section: '8. Treatment Planning',            total: 18, met: 16, score: 89 },
  { section: '9. Medications',                   total: 10, met: 10, score: 100 },
  { section: '10. Emergency Procedures',         total: 8,  met: 8,  score: 100 },
];

const FINDINGS: Finding[] = [
  {
    id: 'F-001',
    standard: '7.B.1 — Clinical Record Completeness',
    description: '3 of 18 audited charts are missing a signed Biopsychosocial Assessment within 72 hours of admission.',
    level: 'Major',
    status: 'In Progress',
    owner: 'Sarah Jenkins, LCPC',
    due: '2026-07-25',
    notes: 'BPS templates updated. Counselors notified. Supervisor review scheduled 7/22.',
  },
  {
    id: 'F-002',
    standard: '5.C.2 — Performance Improvement Data',
    description: 'QI committee meeting minutes for Q1 2026 not documented in compliance portal.',
    level: 'Minor',
    status: 'Resolved',
    owner: 'Amanda Lewis',
    due: '2026-07-10',
    notes: 'Q1 minutes uploaded 7/9. Template standardized for Q2 and forward.',
  },
  {
    id: 'F-003',
    standard: '6.A.4 — Individualized Treatment Plans',
    description: 'Treatment plans for 4 patients lack co-signature from supervising clinician within required 5-business-day window.',
    level: 'Major',
    status: 'In Progress',
    owner: 'Dr. Allen Hughes',
    due: '2026-07-22',
    notes: 'Cosign queue reminder workflow implemented. Pending sign-off from 2 clinicians.',
  },
  {
    id: 'F-004',
    standard: '2.H.3 — Staff Credential Verification',
    description: 'Annual CEU documentation missing for 1 BHT staff member (Kevin Wright).',
    level: 'Minor',
    status: 'Open',
    owner: 'HR Department',
    due: '2026-07-31',
    notes: 'Staff notified 7/14. Awaiting upload of CEU certificate.',
  },
  {
    id: 'F-005',
    standard: '8.B.1 — Discharge Planning',
    description: 'Aftercare plans completed but not reviewed with client and documented as acknowledged in chart for 2 cases.',
    level: 'Minor',
    status: 'Resolved',
    owner: 'Maria Gonzales, LCADC',
    due: '2026-07-05',
    notes: 'Client acknowledgment form added to discharge checklist. Completed 7/4.',
  },
  {
    id: 'F-006',
    standard: '3.A.2 — Grievance Procedure',
    description: 'Posted client rights notice in Rooms 2B and 3A is outdated (2024 version). Current 2026 version must be posted.',
    level: 'Observation',
    status: 'Resolved',
    owner: 'Kevin Wright',
    due: '2026-07-02',
    notes: 'Updated notices posted 7/1. All 14 rooms confirmed compliant.',
  },
];

const MOCK_SURVEYS = [
  { survey: 'Client Satisfaction (Q2 2026)',    n: 84,  score: 4.4, benchmark: 4.2, delta: '+0.2' },
  { survey: 'Staff Climate Survey (Q2 2026)',   n: 22,  score: 4.1, benchmark: 3.9, delta: '+0.2' },
  { survey: 'Stakeholder Feedback (2025)',      n: 11,  score: 4.6, benchmark: 4.3, delta: '+0.3' },
  { survey: 'Discharge Satisfaction (Q2 2026)', n: 61,  score: 4.3, benchmark: 4.0, delta: '+0.3' },
];

const UPCOMING_AUDITS = [
  { event: 'CARF 3-Year Re-Accreditation',       date: '2026-09-15', days: 55, status: 'On Track' },
  { event: 'Maryland BHA Provider Audit',             date: '2026-08-05', days: 14, status: 'Preparation' },
  { event: 'DEA Medication Inspection',           date: '2026-10-01', days: 71, status: 'Scheduled' },
  { event: 'Joint Commission Mock Survey',        date: '2026-08-20', days: 29, status: 'On Track' },
  { event: 'Fire Marshal Inspection',             date: '2026-09-30', days: 70, status: 'Scheduled' },
];

const LEVEL_COLORS: Record<FindingLevel, string> = {
  Critical:    'bg-red-100 text-red-800',
  Major:       'bg-amber-100 text-amber-800',
  Minor:       'bg-blue-100 text-blue-700',
  Observation: 'bg-gray-100 text-slate',
};
const STATUS_COLORS: Record<FindingStatus, string> = {
  Open:           'bg-red-50 text-red-700 border border-red-200',
  'In Progress':  'bg-amber-50 text-amber-700 border border-amber-200',
  Resolved:       'bg-green-50 text-green-700 border border-green-200',
  'Accepted Risk': 'bg-gray-100 text-slate border border-border',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 95 ? 'bg-success' : score >= 85 ? 'bg-sunrise-amber' : 'bg-critical';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 95 ? 'text-success' : score >= 85 ? 'text-sunrise-amber' : 'text-critical'}`}>{score}%</span>
    </div>
  );
}

export function AuditCompliance({ navigate: _navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Dashboard' | 'Findings' | 'Surveys' | 'Standards' | 'Mock Surveys' | 'Training Records' | 'Regulatory Calendar'>('Dashboard');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [updateStatusFor, setUpdateStatusFor] = useState<string | null>(null);
  const [attachEvidenceFor, setAttachEvidenceFor] = useState<string | null>(null);
  const [assignOwnerFor, setAssignOwnerFor] = useState<string | null>(null);
  const [auditActionSaved, setAuditActionSaved] = useState<string | null>(null);
  const [auditHeaderSaved, setAuditHeaderSaved] = useState<string | null>(null);
  const saveAuditHeader = (msg: string) => { setAuditHeaderSaved(msg); setTimeout(() => setAuditHeaderSaved(null), 2500); };

  const totalStandards = CARF_STANDARDS.reduce((s, r) => s + r.total, 0);
  const metStandards   = CARF_STANDARDS.reduce((s, r) => s + r.met, 0);
  const overallScore   = Math.round((metStandards / totalStandards) * 100);

  const openFindings     = FINDINGS.filter(f => f.status === 'Open').length;
  const inProgressFindings = FINDINGS.filter(f => f.status === 'In Progress').length;
  const resolvedFindings = FINDINGS.filter(f => f.status === 'Resolved').length;

  const TABS = ['Dashboard', 'Findings', 'Surveys', 'Standards', 'Mock Surveys', 'Training Records', 'Regulatory Calendar'] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sunrise-blue" /> Audit Readiness
          </h1>
          <p className="text-slate text-sm mt-0.5">CARF accreditation · Joint Commission · Maryland Medicaid compliance · Active findings tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => saveAuditHeader('Report exported')} className="btn-outline text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export Report</button>
          <button onClick={() => saveAuditHeader('Compliance data synced')} className="btn-outline text-xs flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Sync</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'CARF Score',         value: `${overallScore}%`, color: overallScore >= 92 ? 'text-success' : 'text-sunrise-amber', sub: `${metStandards}/${totalStandards} standards`, icon: ShieldCheck },
          { label: 'Open Findings',      value: openFindings,     color: openFindings  > 0 ? 'text-critical' : 'text-success', sub: 'Require action', icon: AlertTriangle },
          { label: 'In Progress',        value: inProgressFindings, color: 'text-sunrise-amber', sub: 'Remediation underway', icon: Clock },
          { label: 'Resolved',           value: resolvedFindings, color: 'text-success', sub: 'This cycle', icon: CheckCircle },
          { label: 'Days to CARF Survey',value: '58',             color: 'text-navy',    sub: 'Sep 15, 2026', icon: FileText },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-border rounded-xl shadow-sm p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <div className="text-[10px] font-bold text-slate uppercase tracking-wider">{k.label}</div>
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-slate mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-sunrise-orange text-navy' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'Dashboard' && (
        <div className="grid grid-cols-2 gap-5">
          {/* CARF Section Scores Chart */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-1">CARF Standard Section Scores</div>
            <div className="text-xs text-slate mb-3">Minimum passing = 85% per section</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={CARF_STANDARDS.map(s => ({ name: s.section.split('. ')[1]?.split(' ').slice(0, 2).join(' ') || s.section, score: s.score }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {CARF_STANDARDS.map((s, i) => (
                    <Cell key={i} fill={s.score >= 95 ? '#22c55e' : s.score >= 85 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming Audits */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4">
            <div className="font-semibold text-navy mb-3">Upcoming Audits & Inspections</div>
            <div className="space-y-2">
              {UPCOMING_AUDITS.map(a => (
                <div key={a.event} className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-navy text-sm">{a.event}</div>
                    <div className="text-xs text-slate mt-0.5">{a.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${a.days <= 20 ? 'text-critical' : a.days <= 40 ? 'text-sunrise-amber' : 'text-navy'}`}>{a.days}</div>
                      <div className="text-[10px] text-slate">days</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      a.status === 'On Track'    ? 'bg-green-100 text-green-700' :
                      a.status === 'Preparation' ? 'bg-amber-100 text-amber-700' :
                                                   'bg-gray-100 text-slate'
                    }`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finding Summary */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-4 col-span-2">
            <div className="font-semibold text-navy mb-3">Active Findings Summary</div>
            <div className="grid grid-cols-4 gap-3">
              {(['Open', 'In Progress', 'Resolved', 'Accepted Risk'] as FindingStatus[]).map(s => {
                const count = FINDINGS.filter(f => f.status === s).length;
                return (
                  <div key={s} className={`p-3 rounded-lg border text-center ${STATUS_COLORS[s]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium mt-0.5">{s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Findings Tab */}
      {tab === 'Findings' && (
        <div className="space-y-2">
          {FINDINGS.map(f => (
            <div key={f.id} className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {expandedFinding === f.id
                      ? <ChevronDown className="w-4 h-4 text-slate mt-0.5 flex-none" />
                      : <ChevronRight className="w-4 h-4 text-slate mt-0.5 flex-none" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate">{f.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${LEVEL_COLORS[f.level]}`}>{f.level}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[f.status]}`}>{f.status}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate mt-0.5">{f.standard}</div>
                      <div className="text-sm text-navy mt-0.5">{f.description}</div>
                    </div>
                  </div>
                  <div className="text-right flex-none">
                    <div className="text-xs text-slate">Due</div>
                    <div className="text-xs font-semibold text-navy">{f.due}</div>
                    <div className="text-[10px] text-slate mt-1">{f.owner.split(',')[0]}</div>
                  </div>
                </div>
              </button>
              {expandedFinding === f.id && (
                <div className="px-11 pb-4 pt-1 border-t border-border bg-slate-50">
                  <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Remediation Notes</div>
                  <p className="text-sm text-navy">{f.notes}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <LockedButton locked={readOnly} onClick={() => { setUpdateStatusFor(f.id); setAttachEvidenceFor(null); setAssignOwnerFor(null); }} className="btn-primary text-xs px-3 py-1.5">Update Status</LockedButton>
                    <LockedButton locked={readOnly} onClick={() => { setAttachEvidenceFor(f.id); setUpdateStatusFor(null); setAssignOwnerFor(null); }} className="btn-outline text-xs px-3 py-1.5">Attach Evidence</LockedButton>
                    <LockedButton locked={readOnly} onClick={() => { setAssignOwnerFor(f.id); setUpdateStatusFor(null); setAttachEvidenceFor(null); }} className="btn-outline text-xs px-3 py-1.5">Assign Owner</LockedButton>
                  </div>
                  {updateStatusFor === f.id && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs font-semibold text-slate mb-2">Move to status:</div>
                      <div className="flex gap-2 flex-wrap">
                        {['Open', 'In Progress', 'Resolved', 'Closed', 'Waived'].map(s => (
                          <button key={s} onClick={() => { setUpdateStatusFor(null); setAuditActionSaved(f.id); setTimeout(() => setAuditActionSaved(null), 2500); }} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-border text-navy hover:bg-gray-50 font-medium">{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {attachEvidenceFor === f.id && (
                    <div className="mt-3 p-3 bg-gray-50 border border-border rounded-lg space-y-2">
                      <div className="text-xs font-semibold text-slate">Upload supporting documentation</div>
                      <input type="file" className="text-xs text-slate w-full" />
                      <div className="flex gap-2">
                        <button onClick={() => { setAttachEvidenceFor(null); setAuditActionSaved(f.id); setTimeout(() => setAuditActionSaved(null), 2500); }} className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg">Attach</button>
                        <button onClick={() => setAttachEvidenceFor(null)} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                  {assignOwnerFor === f.id && (
                    <div className="mt-3 p-3 bg-gray-50 border border-border rounded-lg space-y-2">
                      <div className="text-xs font-semibold text-slate mb-1">Assign remediation owner</div>
                      <select className="w-full border border-border rounded-lg px-3 py-2 text-xs">
                        <option>James S. Collins III, CD</option><option>Dr. Allen Hughes</option><option>Sarah Jenkins, LCPC</option><option>Jessica Torres, RN</option><option>Kevin Wright, BHT</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => { setAssignOwnerFor(null); setAuditActionSaved(f.id); setTimeout(() => setAuditActionSaved(null), 2500); }} className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg">Assign</button>
                        <button onClick={() => setAssignOwnerFor(null)} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                  {auditActionSaved === f.id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-700 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Surveys Tab */}
      {tab === 'Surveys' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {MOCK_SURVEYS.map(s => (
              <div key={s.survey} className="bg-white border border-border rounded-xl shadow-sm p-4">
                <div className="font-semibold text-navy mb-0.5">{s.survey}</div>
                <div className="text-xs text-slate mb-3">N = {s.n} respondents</div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-3xl font-bold text-navy">{s.score.toFixed(1)}</div>
                    <div className="text-xs text-slate">/ 5.0 mean score</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-slate flex justify-between">
                      <span>Score</span><span>{s.score.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div className="h-2 bg-success rounded-full" style={{ width: `${(s.score / 5) * 100}%` }} />
                    </div>
                    <div className="text-xs text-slate flex justify-between">
                      <span>Benchmark</span><span>{s.benchmark.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div className="h-2 bg-slate-300 rounded-full" style={{ width: `${(s.benchmark / 5) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs font-semibold text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {s.delta} vs benchmark
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards Tab */}
      {tab === 'Standards' && (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-navy">CARF Standards Compliance Detail</div>
            <div className="text-xs text-slate mt-0.5">Overall: {metStandards}/{totalStandards} standards met · {overallScore}%</div>
          </div>
          <div className="divide-y divide-border">
            {CARF_STANDARDS.map(s => (
              <div key={s.section} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-medium text-navy text-sm">{s.section}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate">{s.met}/{s.total}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.score >= 95 ? 'bg-green-100 text-green-700' : s.score >= 85 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {s.score}%
                    </span>
                  </div>
                </div>
                <ScoreBar score={s.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Mock Surveys' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Mock Surveys This Year', value: 3, sub: 'CARF + Joint Commission + State', color: 'text-navy' },
              { label: 'Avg Score', value: '91%', sub: 'Across all mock surveys', color: 'text-green-600' },
              { label: 'Deficiencies Found', value: 14, sub: 'Pre-survey identification', color: 'text-amber-600' },
              { label: 'Items Remediated', value: 12, sub: '86% close-out rate', color: 'text-green-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {[
            {
              id: 'MS-2026-03',
              title: 'CARF Mock Survey — Behavioral Health',
              date: '2026-06-10',
              conducted: 'Quality Improvement Team + External Consultant',
              accreditor: 'CARF International',
              nextActual: '2027-Q1 (estimated)',
              score: 93,
              findings: [
                { domain: 'Person-Centered Planning', severity: 'Conformance', count: 22, note: 'All 22 standards met' },
                { domain: 'Treatment Documentation', severity: 'Minor', count: 3, note: '2 treatment plans missing 90-day review signature; 1 discharge summary incomplete' },
                { domain: 'Rights & Informed Consent', severity: 'Conformance', count: 8, note: 'All standards met' },
                { domain: 'Medication Management', severity: 'Significant', count: 1, note: 'MAR reconciliation gap identified: 2 entries without witness signature' },
                { domain: 'Quality Improvement', severity: 'Minor', count: 1, note: 'QI committee minutes not posted within 30-day requirement twice this year' },
                { domain: 'Financial Disclosure', severity: 'Conformance', count: 5, note: 'All 5 elements present in consent packet' },
              ],
              remediation: 'Mandatory dual-sign MAR policy implemented 2026-06-20. Treatment plan review tracking added to weekly supervision agenda.',
            },
            {
              id: 'MS-2026-01',
              title: 'State Licensure Mock Survey — DHCS',
              date: '2026-02-15',
              conducted: 'Compliance Officer + Clinical Director',
              accreditor: 'CA Dept. of Health Care Services',
              nextActual: '2026-Q4 (annual renewal)',
              score: 88,
              findings: [
                { domain: 'Physical Plant & Safety', severity: 'Deficiency', count: 2, note: 'Emergency exit signage missing in Hallway C; fire extinguisher inspection overdue 2 months' },
                { domain: 'Clinical Staff Credentials', severity: 'Conformance', count: 14, note: 'All staff licenses current and verified' },
                { domain: 'Client Records', severity: 'Minor', count: 4, note: '4 charts missing signed consent for photography/video policy' },
                { domain: 'Incident Reporting', severity: 'Conformance', count: 7, note: 'All reports submitted within 24-hour window' },
                { domain: 'Medication Storage', severity: 'Deficiency', count: 1, note: 'Controlled substance cabinet not bolted to wall per Title 9 requirement' },
              ],
              remediation: 'Exit signage and extinguisher remediated 2026-02-20. Cabinet anchored to wall 2026-02-22. All consent forms obtained by 2026-03-01.',
            },
          ].map(survey => (
            <div key={survey.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-slate">{survey.id}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{survey.accreditor}</span>
                  </div>
                  <h3 className="font-bold text-navy text-base">{survey.title}</h3>
                  <div className="text-xs text-slate mt-0.5">{survey.date} · Conducted by: {survey.conducted}</div>
                  <div className="text-xs text-slate mt-0.5">Next actual survey: {survey.nextActual}</div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${survey.score >= 90 ? 'text-green-600' : survey.score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{survey.score}%</div>
                  <div className="text-xs text-slate">Overall score</div>
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-slate">
                      <th className="text-left py-2 pr-3">Domain</th>
                      <th className="text-center py-2 px-2">Severity</th>
                      <th className="text-center py-2 px-2">Standards</th>
                      <th className="text-left py-2 pl-2">Finding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {survey.findings.map(f => (
                      <tr key={f.domain}>
                        <td className="py-2 pr-3 font-medium text-navy">{f.domain}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.severity === 'Conformance' ? 'bg-green-100 text-green-700' : f.severity === 'Minor' ? 'bg-amber-100 text-amber-700' : f.severity === 'Significant' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{f.severity}</span>
                        </td>
                        <td className="py-2 px-2 text-center text-slate font-medium">{f.count}</td>
                        <td className="py-2 pl-2 text-slate">{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-green-50 rounded-lg p-3 text-xs">
                <span className="font-bold text-green-700">Remediation Summary: </span>
                <span className="text-green-800">{survey.remediation}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Training Records' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Annual required training completion tracker — all clinical and administrative staff. CARF standard requires 100% completion per licensure period.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Fully Compliant', value: 8, color: 'text-green-600' },
              { label: 'Training Due (30d)', value: 4, color: 'text-amber-600' },
              { label: 'Overdue', value: 1, color: 'text-red-600' },
              { label: 'Avg Completion Rate', value: '84%', color: 'text-navy' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Staff Training Compliance Matrix</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg text-slate">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Staff Member</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Role</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">HIPAA</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">CPR/First Aid</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Suicide Prevention</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Trauma-Informed</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Ethics</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">MAT Awareness</th>
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Dr. Robert Chen', role: 'Medical Director', hipaa: true, cpr: true, suicide: true, trauma: true, ethics: true, mat: true },
                    { name: 'Sarah Jenkins, LCPC', role: 'Counselor', hipaa: true, cpr: true, suicide: true, trauma: true, ethics: true, mat: true },
                    { name: 'Maria Gonzales, LCADC', role: 'Counselor', hipaa: true, cpr: true, suicide: true, trauma: true, ethics: false, mat: true },
                    { name: 'Dr. Emma Hughes', role: 'Psychiatrist', hipaa: true, cpr: false, suicide: true, trauma: true, ethics: true, mat: true },
                    { name: 'Jessica Park, RN', role: 'Charge Nurse', hipaa: true, cpr: true, suicide: true, trauma: false, ethics: true, mat: true },
                    { name: 'Marcus Thompson', role: 'Peer Support Spec.', hipaa: true, cpr: true, suicide: true, trauma: true, ethics: true, mat: false },
                    { name: 'David Odom, LCADC', role: 'Family Therapist', hipaa: true, cpr: false, suicide: false, trauma: true, ethics: true, mat: false },
                    { name: 'Linda Vance', role: 'Utilization Review', hipaa: true, cpr: false, suicide: false, trauma: false, ethics: true, mat: false },
                    { name: 'Kevin Rivera, BHT', role: 'Behavioral Health Tech', hipaa: false, cpr: true, suicide: true, trauma: false, ethics: false, mat: false },
                    { name: 'Amanda Foster', role: 'Case Manager', hipaa: true, cpr: false, suicide: true, trauma: true, ethics: true, mat: true },
                    { name: 'Sandra Kim, RD', role: 'Dietitian (Contract)', hipaa: true, cpr: false, suicide: false, trauma: false, ethics: true, mat: false },
                    { name: 'James S. Collins III, PhD', role: 'Clinical Supervisor', hipaa: true, cpr: true, suicide: true, trauma: true, ethics: true, mat: true },
                  ].map(r => {
                    const fields = [r.hipaa, r.cpr, r.suicide, r.trauma, r.ethics, r.mat];
                    const completed = fields.filter(Boolean).length;
                    const allDone = completed === fields.length;
                    return (
                      <tr key={r.name} className={`hover:bg-gray-50 ${!allDone ? '' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-navy">{r.name}</td>
                        <td className="px-3 py-2.5 text-center text-slate">{r.role}</td>
                        {[r.hipaa, r.cpr, r.suicide, r.trauma, r.ethics, r.mat].map((done, i) => (
                          <td key={i} className="px-2 py-2.5 text-center">
                            {done
                              ? <span className="text-green-600 font-bold">✓</span>
                              : <span className="text-red-500 font-bold">✗</span>}
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : completed >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {completed}/{fields.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Required Training Calendar — 2026</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {[
                { training: 'HIPAA Privacy & Security Annual Refresher', deadline: '2026-08-01', status: 'On Track', frequency: 'Annual', provider: 'HealthStream' },
                { training: 'CPR / AED / First Aid Certification', deadline: '2026-09-15', status: 'On Track', frequency: 'Every 2 Years', provider: 'Red Cross — in-facility' },
                { training: 'Zero Suicide / QPR Training', deadline: '2026-10-01', status: 'On Track', frequency: 'Annual', provider: 'Zero Suicide Institute' },
                { training: 'Trauma-Informed Care (TIC)', deadline: '2026-08-31', status: 'Due Soon', frequency: 'Annual', provider: 'SAMHSA e-Learning' },
                { training: 'Ethics in Behavioral Health', deadline: '2026-07-31', status: 'Overdue', frequency: 'Annual', provider: 'NAADAC Online' },
                { training: 'MAT / Medication-Assisted Treatment Awareness', deadline: '2026-11-01', status: 'On Track', frequency: 'Annual', provider: 'PCSS e-Training' },
              ].map(t => (
                <div key={t.training} className={`p-3 border rounded-lg ${t.status === 'Overdue' ? 'border-red-300 bg-red-50/40' : t.status === 'Due Soon' ? 'border-amber-300 bg-amber-50/30' : 'border-border'}`}>
                  <div className="font-semibold text-navy">{t.training}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'Overdue' ? 'bg-red-100 text-red-700' : t.status === 'Due Soon' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{t.status}</span>
                    <span className="text-slate">Due {t.deadline}</span>
                  </div>
                  <div className="text-slate mt-1">{t.frequency} · {t.provider}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Regulatory Calendar' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Annual regulatory submission deadlines, inspection windows, license renewals, and accreditation milestones for Sunrise Recovery Center.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Items Due (Next 90 Days)', value: 6, color: 'text-amber-600', sub: 'Renewals, filings & reports' },
              { label: 'Items Overdue', value: 0, color: 'text-green-600', sub: 'No overdue items' },
              { label: 'Licenses Expiring (12 mo)', value: 3, color: 'text-navy', sub: 'Facility + DEA + state SUD license' },
              { label: 'Next MD BHA Site Visit', value: 'Oct 2026', color: 'text-blue-600', sub: 'Annual monitoring visit' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Regulatory Calendar — FY2026–2027</h3>
            <div className="space-y-2 text-xs">
              {[
                { due: '2026-07-31', item: 'MD BHA CBMS Q2 Data Submission', category: 'State Reporting', owner: 'QI Coordinator', status: 'Due Soon', color: 'bg-amber-100 text-amber-700' },
                { due: '2026-08-01', item: 'SAMHSA SAPT Block Grant Renewal Application', category: 'Federal Funding', owner: 'CEO / CFO', status: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                { due: '2026-08-15', item: 'DEA Registration Renewal (Schedule II–V)', category: 'DEA Compliance', owner: 'Medical Director', status: 'Not Started', color: 'bg-red-100 text-red-700' },
                { due: '2026-09-01', item: 'MD SUD Facility License Renewal', category: 'State Licensure', owner: 'COO', status: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                { due: '2026-09-30', item: 'HIPAA Security Risk Assessment (Annual)', category: 'HIPAA', owner: 'IT / Compliance', status: 'Scheduled', color: 'bg-purple-100 text-purple-700' },
                { due: '2026-10-15', item: 'MD BHA Annual Monitoring Visit — Prep Complete', category: 'State Survey', owner: 'QI / Clinical Director', status: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                { due: '2026-10-31', item: 'SAMHSA TEDS Annual Data Submission (FY2026)', category: 'Federal Reporting', owner: 'QI Coordinator', status: 'Not Started', color: 'bg-red-100 text-red-700' },
                { due: '2026-12-31', item: 'Medicare CoP Annual Self-Assessment', category: 'Medicare', owner: 'COO / Medical Director', status: 'Not Started', color: 'bg-gray-100 text-slate' },
                { due: '2027-01-15', item: 'CARF Annual Report Submission', category: 'Accreditation', owner: 'QI Coordinator', status: 'Not Started', color: 'bg-gray-100 text-slate' },
                { due: '2027-03-01', item: 'HIPAA Notice of Privacy Practices — Annual Review', category: 'HIPAA', owner: 'Compliance Officer', status: 'Not Started', color: 'bg-gray-100 text-slate' },
              ].map(r => (
                <div key={r.item} className="flex items-center justify-between border border-border rounded p-2.5 gap-3">
                  <div className="shrink-0 font-mono text-[10px] font-bold text-navy w-24">{r.due}</div>
                  <div className="flex-1">
                    <div className="font-medium text-navy">{r.item}</div>
                    <div className="text-[10px] text-slate mt-0.5">{r.category} · Owner: {r.owner}</div>
                  </div>
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.color}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {auditHeaderSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {auditHeaderSaved}
        </div>
      )}
    </div>
  );
}
