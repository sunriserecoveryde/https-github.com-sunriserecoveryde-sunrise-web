import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, AlertTriangle, XCircle, Clock, Plus, FileText, TrendingUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type AuthStatus = 'Approved' | 'Pending' | 'Denied' | 'Expired' | 'Appealing';
type LevelOfCare = 'Residential' | 'PHP' | 'IOP' | 'OP';

interface Authorization {
  id: string;
  patientId: string;
  payor: string;
  memberId: string;
  authNumber: string;
  levelOfCare: LevelOfCare;
  approvedUnits: number;
  usedUnits: number;
  unitType: 'days' | 'hours';
  startDate: string;
  endDate: string;
  status: AuthStatus;
  caseManager: string;
  caseManagerPhone: string;
  nextReviewDate?: string;
  denialReason?: string;
  clinicalJustification: string;
  asamJustification: string;
}

const AUTHS: Authorization[] = [
  {
    id: 'AUTH-001', patientId: 'p1', payor: 'CareFirst BlueCross BlueShield', memberId: 'CFB-883921',
    authNumber: 'RC2026-0741', levelOfCare: 'Residential', approvedUnits: 28, usedUnits: 12,
    unitType: 'days', startDate: '2026-07-07', endDate: '2026-08-04', status: 'Approved',
    caseManager: 'Lisa Hendrix', caseManagerPhone: '(800) 555-2100 x4412',
    nextReviewDate: '2026-07-28',
    clinicalJustification: 'Patient with Severe OUD and comorbid PTSD/MDD presenting with active withdrawal symptoms at admission. Requires 24-hour monitoring for COWS scoring and buprenorphine induction. AMA risk HIGH — community environment unsafe (drug-using household). Daily psychiatric nursing and individual/group therapy required.',
    asamJustification: 'ASAM D1:2 (moderate withdrawal), D3:3 (significant psychiatric instability), D5:4 (high relapse risk), D6:3 (unsupported recovery environment) — supports Residential level of care per ASAM 3rd Edition criteria.',
  },
  {
    id: 'AUTH-002', patientId: 'p2', payor: 'Aetna', memberId: 'AET-74563',
    authNumber: 'PHP2026-0412', levelOfCare: 'PHP', approvedUnits: 30, usedUnits: 20,
    unitType: 'days', startDate: '2026-06-15', endDate: '2026-07-22', status: 'Approved',
    caseManager: 'Marcus Webb', caseManagerPhone: '(800) 555-3300',
    nextReviewDate: '2026-07-24',
    clinicalJustification: 'Patient with Severe AUD and co-occurring BED requiring structured daily programming with psychiatric oversight. Naltrexone injection initiated. Motivational enhancement therapy ongoing. Family systems work indicated — stepwise reintegration needed.',
    asamJustification: 'ASAM D3:3, D5:2 — PHP level. Partial hospitalization provides psychiatric access, medical monitoring, and daily therapeutic community without 24-hour confinement that is clinically unnecessary.',
  },
  {
    id: 'AUTH-003', patientId: 'p3', payor: 'United Healthcare', memberId: 'UHC-62841',
    authNumber: 'RC2026-0688', levelOfCare: 'Residential', approvedUnits: 21, usedUnits: 8,
    unitType: 'days', startDate: '2026-07-11', endDate: '2026-08-01', status: 'Approved',
    caseManager: 'Diane Powell', caseManagerPhone: '(888) 555-4100',
    nextReviewDate: '2026-07-22',
    clinicalJustification: 'Active withdrawal management required. COWS 9 at admission, now 7 at day 8. Buprenorphine titration ongoing. Prior treatment x3 with relapse after early AMA. IVDU history with Hepatitis C — requires medical co-management. HIGH relapse risk if discharged to community prematurely.',
    asamJustification: 'ASAM D1:3 (withdrawal with COWS), D2:2 (Hep C pending evaluation), D5:4 — Residential warranted throughout active medication titration.',
  },
  {
    id: 'AUTH-004', patientId: 'p5', payor: 'Cigna', memberId: 'CIG-44782',
    authNumber: 'IOP2026-0299', levelOfCare: 'IOP', approvedUnits: 90, usedUnits: 38,
    unitType: 'hours', startDate: '2026-07-04', endDate: '2026-08-08', status: 'Approved',
    caseManager: 'Tanya Ruiz', caseManagerPhone: '(877) 555-5200',
    nextReviewDate: '2026-07-25',
    clinicalJustification: 'Patient demonstrating good engagement in IOP. Court-mandated DUI — must complete 36 IOP hours. Employed, family support present. Stabilized without medication. No acute withdrawal or psychiatric crisis.',
    asamJustification: 'ASAM D4:3 (motivational enhancement ongoing), D5:2 — IOP appropriate. Community support and employment argue against higher level of care.',
  },
  {
    id: 'AUTH-005', patientId: 'p7', payor: 'Kaiser Permanente Mid-Atlantic', memberId: 'KP-71209',
    authNumber: 'PHP2026-0501', levelOfCare: 'PHP', approvedUnits: 10, usedUnits: 6,
    unitType: 'days', startDate: '2026-07-13', endDate: '2026-07-23', status: 'Approved',
    caseManager: 'Steve Abrams', caseManagerPhone: '(800) 777-7902',
    nextReviewDate: '2026-07-23',
    clinicalJustification: 'Step-up from IOP after relapse event on 7/10. Disulfiram initiated. Daily medical oversight required for medication compliance monitoring. Motivational interviewing intensive needed.',
    asamJustification: 'ASAM D5:3 (continued relapse risk), D4:2 (motivational fluctuation) — PHP warranted as step-up level following relapse.',
  },
  {
    id: 'AUTH-006', patientId: 'p9', payor: 'Maryland Medicaid / Carelon BH', memberId: 'MMA-83914',
    authNumber: 'RC2026-0712', levelOfCare: 'Residential', approvedUnits: 14, usedUnits: 8,
    unitType: 'days', startDate: '2026-07-11', endDate: '2026-07-25', status: 'Approved',
    caseManager: 'Greg Simmons', caseManagerPhone: '(800) 888-1970',
    nextReviewDate: '2026-07-23',
    clinicalJustification: 'Substance-induced psychosis requiring 30-minute safety checks. Active psychiatric monitoring by Dr. Hughes. Daily functioning severely impaired. Community supports absent — recent homelessness.',
    asamJustification: 'ASAM D3:4 (severe psychiatric instability), D6:4 (homeless, no recovery environment) — Residential medically necessary.',
  },
  {
    id: 'AUTH-007', patientId: 'p11', payor: 'CareFirst BlueCross BlueShield', memberId: 'CFB-65890',
    authNumber: 'RC2026-0699', levelOfCare: 'Residential', approvedUnits: 21, usedUnits: 11,
    unitType: 'days', startDate: '2026-07-08', endDate: '2026-07-29', status: 'Approved',
    caseManager: 'Lisa Hendrix', caseManagerPhone: '(800) 555-2100 x4412',
    nextReviewDate: '2026-07-22',
    clinicalJustification: 'Active Hep C with pending treatment eligibility evaluation. Buprenorphine stabilization in progress. Prior residential x2 — longest sobriety 4 months. Medical and psychiatric co-management required.',
    asamJustification: 'ASAM D2:2 (Hep C, pending treatment), D5:3 — Residential supported.',
  },
  {
    id: 'AUTH-008', patientId: 'p14', payor: 'Self-Pay / Sliding Scale', memberId: 'SP-44821',
    authNumber: 'IOP2026-0340', levelOfCare: 'IOP', approvedUnits: 60, usedUnits: 26,
    unitType: 'hours', startDate: '2026-07-06', endDate: '2026-08-03', status: 'Approved',
    caseManager: 'Internal (No Carrier)', caseManagerPhone: 'N/A — self-pay',
    clinicalJustification: 'Court-ordered treatment. Engaged, motivated. Bipolar I in remission on Lithium. IOP provides structure while patient maintains housing and part-time employment.',
    asamJustification: 'ASAM D3:2 (stable psychiatric), D5:3 (court motivation high relapse risk without structure) — IOP appropriate.',
  },
  {
    id: 'AUTH-009', patientId: 'p18', payor: 'Medicare (Novitas J-L MAC)', memberId: 'MCA-39018',
    authNumber: 'RC2026-0680', levelOfCare: 'Residential', approvedUnits: 30, usedUnits: 19,
    unitType: 'days', startDate: '2026-06-30', endDate: '2026-07-30', status: 'Pending',
    caseManager: 'Theresa Holt', caseManagerPhone: '(855) 252-8782',
    nextReviewDate: '2026-07-24',
    denialReason: 'Concurrent review request submitted 7/21. Awaiting Medicare response. Extension needed — patient has COPD and fall risk requiring continued medical monitoring.',
    clinicalJustification: 'Continued medical monitoring required for COPD, fall risk, and polypharmacy management. Geriatric patient with complex medical/substance use presentation. PT initiated post-fall. Family not available for immediate discharge support.',
    asamJustification: 'ASAM D2:3 (COPD, fall risk, complex medical), D6:2 (limited family support for discharge) — continued Residential warranted.',
  },
  {
    id: 'AUTH-010', patientId: 'p20', payor: 'Cigna', memberId: 'CIG-81234',
    authNumber: 'IOP2026-0355', levelOfCare: 'IOP', approvedUnits: 60, usedUnits: 12,
    unitType: 'hours', startDate: '2026-07-14', endDate: '2026-08-11', status: 'Approved',
    caseManager: 'Tanya Ruiz', caseManagerPhone: '(877) 555-5200',
    nextReviewDate: '2026-08-01',
    clinicalJustification: 'DV survivor, court-mandated. Stable psychiatric condition. IOP provides trauma-informed group therapy. Protective order in place — safety planning essential component of treatment.',
    asamJustification: 'ASAM D3:2, D5:2 — IOP level appropriate.',
  },
  {
    id: 'AUTH-011', patientId: 'p17', payor: 'Maryland Medicaid / Carelon BH', memberId: 'MMA-71204',
    authNumber: 'RC2026-0718', levelOfCare: 'Residential', approvedUnits: 14, usedUnits: 7,
    unitType: 'days', startDate: '2026-07-12', endDate: '2026-07-26', status: 'Approved',
    caseManager: 'Greg Simmons', caseManagerPhone: '(800) 888-1970',
    nextReviewDate: '2026-07-22',
    clinicalJustification: 'Combat veteran, active PTSD, day 7 Suboxone induction. AMA risk HIGH. Trauma-informed residential milieu essential for engagement. VA referral coordination underway.',
    asamJustification: 'ASAM D3:4 (severe PTSD), D4:2 (ambivalent, AMA ideation), D5:3 — Residential warranted.',
  },
];

const DENIAL_TREND = [
  { month: 'Feb', approvals: 18, denials: 3, appeals: 2 },
  { month: 'Mar', approvals: 21, denials: 2, appeals: 2 },
  { month: 'Apr', approvals: 19, denials: 4, appeals: 3 },
  { month: 'May', approvals: 22, denials: 2, appeals: 1 },
  { month: 'Jun', approvals: 24, denials: 3, appeals: 2 },
  { month: 'Jul', approvals: 11, denials: 1, appeals: 1 },
];

const STATUS_STYLE: Record<AuthStatus, string> = {
  'Approved':  'bg-green-100 text-green-700',
  'Pending':   'bg-amber-100 text-amber-700',
  'Denied':    'bg-red-100 text-red-700',
  'Expired':   'bg-gray-100 text-gray-500',
  'Appealing': 'bg-purple-100 text-purple-700',
};

const STATUS_ICON = {
  'Approved':  <CheckCircle className="w-3.5 h-3.5" />,
  'Pending':   <Clock className="w-3.5 h-3.5" />,
  'Denied':    <XCircle className="w-3.5 h-3.5" />,
  'Expired':   <Clock className="w-3.5 h-3.5" />,
  'Appealing': <AlertTriangle className="w-3.5 h-3.5" />,
};

const TODAY = '2026-07-22';

function daysUntil(dateStr: string) {
  const d = new Date(dateStr).getTime() - new Date(TODAY).getTime();
  return Math.ceil(d / (1000 * 60 * 60 * 24));
}

export function InsuranceAuthorization({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Active' | 'Expiring' | 'Analytics' | 'New' | 'Appeal Tracker' | 'Payer Contacts'>('Active');
  const [expandedAuth, setExpandedAuth] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AuthStatus | 'All'>('All');
  const [letterModal, setLetterModal] = useState<Authorization | null>(null);
  const [authActionSaved, setAuthActionSaved] = useState<string | null>(null);
  const saveAuthAction = (msg: string) => { setAuthActionSaved(msg); setTimeout(() => setAuthActionSaved(null), 2500); };

  const expiring = AUTHS.filter(a => a.status === 'Approved' && a.nextReviewDate && daysUntil(a.nextReviewDate) <= 7);
  const filtered = filterStatus === 'All' ? AUTHS : AUTHS.filter(a => a.status === filterStatus);

  const totalApproved = AUTHS.filter(a => a.status === 'Approved').length;
  const totalPending = AUTHS.filter(a => a.status === 'Pending').length;
  const totalDenied = AUTHS.filter(a => a.status === 'Denied').length;

  const utilizationWarnings = AUTHS.filter(a => {
    const pct = a.usedUnits / a.approvedUnits;
    return pct >= 0.75 && a.status === 'Approved';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Insurance Authorization / UR</h1>
          <p className="text-slate text-sm mt-0.5">Prior authorization tracking, concurrent review, and utilization management</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => !readOnly && setTab('New')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Submit Auth Request
        </LockedButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Auths', value: totalApproved, sub: 'Currently approved', color: 'text-green-600' },
          { label: 'Pending Review', value: totalPending, sub: 'Awaiting payor decision', color: totalPending > 0 ? 'text-amber-600' : 'text-slate' },
          { label: 'Expiring ≤7 Days', value: expiring.length, sub: 'Concurrent review needed', color: expiring.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Utilization ≥75%', value: utilizationWarnings.length, sub: 'Request extension soon', color: utilizationWarnings.length > 0 ? 'text-amber-600' : 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {expiring.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-semibold text-red-800">Expiring Soon: </span>
            <span className="text-sm text-red-800">
              {expiring.map(a => {
                const p = MOCK_PATIENTS.find(pt => pt.id === a.patientId);
                return `${p?.firstName} ${p?.lastName} (review ${a.nextReviewDate})`;
              }).join(' · ')}
            </span>
          </div>
          <button onClick={() => setTab('Expiring')} className="ml-auto text-sm text-red-700 font-semibold hover:underline shrink-0">Review Now</button>
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(['Active', 'Expiring', 'Analytics', 'New', 'Appeal Tracker', 'Payer Contacts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {t === 'Expiring' && expiring.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{expiring.length}</span>}
          </button>
        ))}
      </div>

      {(tab === 'Active' || tab === 'Expiring') && (
        <div className="space-y-3">
          {tab === 'Active' && (
            <div className="flex gap-2">
              {(['All', 'Approved', 'Pending', 'Denied', 'Appealing'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:bg-gray-50'}`}>{s}</button>
              ))}
              <span className="text-xs text-slate ml-auto self-center">{filtered.length} authorization{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {(tab === 'Active' ? filtered : expiring).map(auth => {
            const p = MOCK_PATIENTS.find(pt => pt.id === auth.patientId);
            if (!p) return null;
            const utilizationPct = Math.round(auth.usedUnits / auth.approvedUnits * 100);
            const daysToReview = auth.nextReviewDate ? daysUntil(auth.nextReviewDate) : null;
            const isExpanded = expandedAuth === auth.id;

            return (
              <div key={auth.id} className={`card p-0 overflow-hidden border ${auth.status === 'Denied' ? 'border-red-300' : auth.status === 'Pending' ? 'border-amber-300' : daysToReview !== null && daysToReview <= 3 ? 'border-red-300' : 'border-border'}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedAuth(isExpanded ? null : auth.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', auth.patientId); }}>
                        {p.firstName} {p.lastName}
                      </button>
                      <span className="font-mono text-[10px] text-slate">{auth.authNumber}</span>
                      <span className="text-xs text-slate">{auth.payor}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{auth.levelOfCare}</span>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[auth.status]}`}>
                        {STATUS_ICON[auth.status]} {auth.status}
                      </span>
                      {daysToReview !== null && daysToReview <= 7 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${daysToReview <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          Review in {daysToReview}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${utilizationPct >= 90 ? 'bg-red-500' : utilizationPct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${utilizationPct}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${utilizationPct >= 90 ? 'text-red-600' : utilizationPct >= 75 ? 'text-amber-600' : 'text-slate'}`}>
                          {auth.usedUnits}/{auth.approvedUnits} {auth.unitType} ({utilizationPct}%)
                        </span>
                      </div>
                      <span className="text-xs text-slate">{auth.startDate} → {auth.endDate}</span>
                      <span className="text-xs text-slate">UM: {auth.caseManager}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setLetterModal(auth); }}
                      className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3" /> CR Letter
                    </button>
                    {isExpanded ? <span className="text-slate text-xs self-center">▲</span> : <span className="text-slate text-xs self-center">▼</span>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1.5">Clinical Justification</div>
                        <p className="text-xs text-navy leading-relaxed">{auth.clinicalJustification}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1.5">ASAM Justification</div>
                        <p className="text-xs text-navy leading-relaxed">{auth.asamJustification}</p>
                      </div>
                    </div>
                    {auth.denialReason && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-1">Denial / Pending Note</div>
                        <p className="text-xs text-amber-800">{auth.denialReason}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate">
                      <span>UM Phone: <span className="font-medium text-navy">{auth.caseManagerPhone}</span></span>
                      <span>Member ID: <span className="font-medium text-navy font-mono">{auth.memberId}</span></span>
                      {auth.nextReviewDate && <span>Next Review: <span className="font-medium text-orange">{auth.nextReviewDate}</span></span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setLetterModal(auth)} className="text-xs border border-orange text-orange px-3 py-1.5 rounded-lg hover:bg-orange/5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Generate CR Letter</button>
                      <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Request Extension</button>
                      <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50" onClick={() => navigate('PatientDetail', auth.patientId)}>View Chart</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Monthly Authorization Activity</h3>
            <p className="text-xs text-slate mb-3">Approvals, denials, and appeal volume</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DENIAL_TREND} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="approvals" fill="#2ECC71" radius={[3,3,0,0]} name="Approved" stackId="a" />
                <Bar dataKey="denials" fill="#E74C3C" radius={[3,3,0,0]} name="Denied" stackId="a" />
                <Bar dataKey="appeals" fill="#F39C12" radius={[3,3,0,0]} name="Appeals" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-2">Payor Mix — Authorized Patients</h3>
            <div className="space-y-2.5">
              {[
                { payor: 'CareFirst BCBS', count: 3, color: '#3B9ED4' },
                { payor: 'Maryland Medicaid / Carelon BH', count: 2, color: '#E8761A' },
                { payor: 'Cigna', count: 2, color: '#2ECC71' },
                { payor: 'Aetna Better Health MD', count: 1, color: '#9B59B6' },
                { payor: 'UHC Community Plan MD', count: 1, color: '#F39C12' },
                { payor: 'Kaiser Permanente Mid-Atlantic', count: 1, color: '#1ABC9C' },
                { payor: 'Medicare (Novitas J-L)', count: 1, color: '#95a5a6' },
                { payor: 'Self-Pay', count: 1, color: '#E74C3C' },
              ].map(p => (
                <div key={p.payor}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate">{p.payor}</span>
                    <span className="font-semibold text-navy">{p.count} pts</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${p.count/12*100}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-2">
            <h3 className="font-semibold text-navy text-sm mb-3">Utilization Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    {['Patient', 'Payor', 'LOC', 'Auth #', 'Approved', 'Used', 'Remaining', 'Utilization', 'Expires'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUTHS.filter(a => a.status === 'Approved').map(auth => {
                    const p = MOCK_PATIENTS.find(pt => pt.id === auth.patientId);
                    const pct = Math.round(auth.usedUnits / auth.approvedUnits * 100);
                    return (
                      <tr key={auth.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-navy text-xs cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', auth.patientId)}>{p?.firstName} {p?.lastName}</td>
                        <td className="px-3 py-2.5 text-xs text-slate">{auth.payor.split(' ')[0]}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{auth.levelOfCare}</span></td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate">{auth.authNumber}</td>
                        <td className="px-3 py-2.5 text-xs text-slate font-mono">{auth.approvedUnits} {auth.unitType}</td>
                        <td className="px-3 py-2.5 text-xs text-navy font-mono font-semibold">{auth.usedUnits}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate">{auth.approvedUnits - auth.usedUnits}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : 'text-green-600'}`}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate">{auth.endDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'New' && (
        <div className="max-w-2xl">
          <div className="card space-y-4">
            <div>
              <h2 className="font-bold text-navy">Submit Prior Authorization Request</h2>
              <p className="text-sm text-slate mt-0.5">Complete all fields. Clinical justification is required for all levels of care.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName} — {p.insurance}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Level of Care *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Residential (ASAM 3.7)</option><option>PHP (ASAM 2.5)</option>
                  <option>IOP (ASAM 2.1)</option><option>OP (ASAM 1.0)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Payor</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Insurance company name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Member ID</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Member / Policy ID" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Requested Units</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 14 days" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Requested Start Date</label>
                <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" defaultValue="2026-07-19" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinical Justification *</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Why is this level of care medically necessary? Include symptom severity, functional impairment, and risk factors..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">ASAM Criteria Justification *</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Reference specific ASAM dimension scores. E.g. D1:3 withdrawal severity, D3:3 psychiatric instability, D5:4 relapse risk..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab('Active')} className="border border-border rounded-lg px-5 py-2 text-sm text-slate">Cancel</button>
              <button onClick={() => { saveAuthAction('Auth request submitted'); setTab('Active'); }} className="btn-primary text-sm px-5 py-2">Submit Auth Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Concurrent Review Letter Modal */}
      {letterModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLetterModal(null)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl w-[680px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Concurrent Review Letter</h3>
              <button onClick={() => setLetterModal(null)} className="text-slate hover:text-navy text-xl">×</button>
            </div>
            <div className="border border-border rounded-lg p-5 bg-gray-50 font-mono text-xs space-y-3 text-navy leading-relaxed">
              <div>Date: {TODAY}</div>
              <div>To: Utilization Management Department — {letterModal.payor}</div>
              <div>Re: Concurrent Review Request — Auth #{letterModal.authNumber}</div>
              <div>Patient: {MOCK_PATIENTS.find(p => p.id === letterModal.patientId)?.firstName} {MOCK_PATIENTS.find(p => p.id === letterModal.patientId)?.lastName} | Member ID: {letterModal.memberId}</div>
              <div>Level of Care: {letterModal.levelOfCare}</div>
              <br />
              <div>Dear Utilization Management,</div>
              <br />
              <div>This letter is submitted in support of continued authorization for {letterModal.levelOfCare} treatment for the above-named member. Clinical review of the patient's current status supports medical necessity for continued treatment at this level of care.</div>
              <br />
              <div>CLINICAL SUMMARY:</div>
              <div>{letterModal.clinicalJustification}</div>
              <br />
              <div>ASAM CRITERIA JUSTIFICATION:</div>
              <div>{letterModal.asamJustification}</div>
              <br />
              <div>We request continued authorization of {letterModal.approvedUnits - letterModal.usedUnits} additional {letterModal.unitType} of {letterModal.levelOfCare} treatment. Early termination of services at this time would place this patient at significant risk for relapse, medical deterioration, and potential hospitalization.</div>
              <br />
              <div>Please contact our Utilization Review Coordinator at (301) 555-0100 x201 with any questions or to discuss this case.</div>
              <br />
              <div>Respectfully,</div>
              <div>Dr. Robert Chen, MD — Medical Director</div>
              <div>Sunrise Recovery Center</div>
              <div>NPI: 1234567890</div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setLetterModal(null)} className="flex-1 border border-border rounded-lg py-2 text-sm text-slate">Close</button>
              <button onClick={() => saveAuthAction('Letter copied to clipboard')} className="flex-1 btn-primary text-sm py-2">Copy to Clipboard</button>
              <button onClick={() => saveAuthAction('PDF downloaded')} className="flex-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg py-2 text-sm font-medium hover:bg-blue-100">Download PDF</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'Appeal Tracker' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Denial appeal management — active appeals, win rate by payer, and documentation support for concurrent review disputes.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Appeals', value: 4, color: 'text-amber-600', sub: '2 first-level, 2 second-level' },
              { label: 'Win Rate (90d)', value: '68%', color: 'text-green-600', sub: '13 of 19 appeals won' },
              { label: 'Avg Days to Resolution', value: '11d', color: 'text-blue-600', sub: 'Target: ≤14 days' },
              { label: 'Revenue Recovered (90d)', value: '$41,200', color: 'text-teal-600', sub: 'Won appeals, all LOCs' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Active Appeals</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  patient: 'Marcus Webb', payer: 'Cigna Behavioral Health', denied: 'Residential day 15+', level: '2nd Level',
                  reason: 'Medical necessity for continued residential — peer reviewer disagreed on ASAM D3 severity.',
                  action: 'Physician peer-to-peer call scheduled 07/21. Clinical notes and Columbia Suicide Severity forwarded.',
                  filed: '07/12', due: '07/26', status: 'In Review', sColor: 'border-blue-200 bg-blue-50'
                },
                {
                  patient: 'Samantha Choi', payer: 'UHC Community Plan MD', denied: 'PHP x5 days', level: '1st Level',
                  reason: 'Step-down from residential deemed premature; payer requested additional stabilization justification.',
                  action: 'Discharge summary and treatment plan submitted 07/16. Awaiting UM review.',
                  filed: '07/15', due: '07/29', status: 'Awaiting Response', sColor: 'border-amber-200 bg-amber-50'
                },
                {
                  patient: 'James Thornton', payer: 'Aetna Behavioral', denied: 'IOP week 3', level: '1st Level',
                  reason: 'Routine denial — UM cited "insufficient progress documentation".',
                  action: 'Progress notes with objective PHQ-9 improvement submitted. Appeal has strong clinical basis.',
                  filed: '07/17', due: '07/31', status: 'Strong Position', sColor: 'border-green-200 bg-green-50'
                },
                {
                  patient: 'Patricia Holloway', payer: 'CareFirst BlueCross BlueShield', denied: 'Residential day 20+', level: '2nd Level',
                  reason: 'Payer position: patient no longer meets ASAM Residential criteria. Clinical team disagrees.',
                  action: 'External IRO review requested 07/18. IRO decision binding under Maryland Insurance Administration law (Md. Code, Ins. § 15-10B).',
                  filed: '07/10', due: '07/24', status: 'IRO Requested', sColor: 'border-purple-200 bg-purple-50'
                },
              ].map(a => (
                <div key={a.patient} className={`border rounded-xl p-3 ${a.sColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-navy">{a.patient}</span>
                      <span className="text-slate ml-2">— {a.payer}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[9px] bg-gray-100 text-slate px-1.5 py-0.5 rounded-full font-bold">{a.level}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === 'Strong Position' ? 'bg-green-100 text-green-700' : a.status === 'IRO Requested' ? 'bg-purple-100 text-purple-700' : a.status === 'In Review' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span className="font-semibold text-slate">Denied:</span> <span className="text-navy">{a.denied}</span></div>
                    <div><span className="font-semibold text-slate">Reason:</span> <span className="text-navy">{a.reason}</span></div>
                    <div><span className="font-semibold text-slate">Action:</span> <span className="text-navy">{a.action}</span></div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate">Filed: {a.filed} · Due: {a.due}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Payer Contacts' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Payer contact directory — UM/authorizations lines, appeals contacts, and key policy reference numbers for top payers by volume.</div>
          <div className="card">
            <div className="mb-3">
              <h3 className="font-semibold text-navy text-sm">Payer Contact Directory — Active Contracts</h3>
              <p className="text-xs text-slate mt-0.5">Maryland HealthChoice MCOs are carved out for behavioral health. All Maryland Medicaid BH authorizations route through <span className="font-semibold text-navy">Carelon Behavioral Health</span> (ASO), regardless of which MCO the member is enrolled in. Submit all BH prior auths and UR to Carelon via ProviderConnect.</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Payer', 'Auth / UM Line', 'Appeals', 'Fax (Auth)', 'Provider Portal', 'Notes'].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { payer: '⭐ Carelon Behavioral Health (MD Medicaid ASO)', auth: '800-888-1965', appeals: '800-888-1966', fax: '855-555-0100', portal: 'providerconnect.carelon.com', notes: 'ASO for all MD Medicaid BH. All HealthChoice BH prior auths and UR submitted here regardless of MCO. Use ProviderConnect portal. Residential UR every 7 days per COMAR 10.09.80.' },
                  { payer: 'CareFirst BlueCross BlueShield (Commercial)', auth: '800-555-0111', appeals: '800-555-0112', fax: '800-555-0113', portal: 'carefirst.com/provider', notes: 'Commercial only. Auth required for residential/PHP; IOP: initial auth + UR every 7d. Peer-to-peer M–F 9–5 ET.' },
                  { payer: 'Aetna Better Health of MD (HealthChoice MCO)', auth: '800-454-3730', appeals: '800-555-0222', fax: '800-555-0223', portal: 'aetnabetterhealth.com/maryland', notes: 'HealthChoice MCO — BH auth still routes to Carelon ASO. Medical auth through Aetna. NPI credentialing required.' },
                  { payer: 'UHC Community Plan MD (HealthChoice MCO)', auth: '800-318-8804', appeals: '800-555-0442', fax: '800-555-0443', portal: 'uhccommunityplan.com/md', notes: 'HealthChoice MCO — all BH prior auths go to Carelon. Physical health auth via UHC Community Plan portal.' },
                  { payer: 'Kaiser Permanente Mid-Atlantic', auth: '800-777-7902', appeals: '800-555-0552', fax: '800-555-0553', portal: 'kaiserpermanente.org/providers', notes: 'Auth required all LOCs. Residential UR every 5 days. Strong ASAM criteria documentation required. Peer-to-peer available M–F 9–5 ET.' },
                  { payer: 'Amerigroup Maryland (Elevance / HealthChoice)', auth: '800-454-3730', appeals: '800-555-0662', fax: '800-555-0663', portal: 'maryland.amerigroupgov.com', notes: 'HealthChoice MCO — BH auth via Carelon ASO. Member services M–F 8–8 ET.' },
                  { payer: 'CareFirst BlueChoice (HealthChoice MCO)', auth: '800-628-8543', appeals: '800-555-0772', fax: '800-555-0773', portal: 'carefirst.com/provider', notes: 'HealthChoice MCO — BH carved out to Carelon. Same clinical criteria as CareFirst commercial.' },
                  { payer: 'Medicare (Novitas Solutions — J-L MAC)', auth: '855-252-8782', appeals: '855-252-8783', fax: '877-555-0883', portal: 'novitas-solutions.com', notes: 'Novitas Solutions is the Medicare Administrative Contractor (MAC) for MD/DE/PA. No prior auth for detox; PHP/IOP: CERT documentation standards apply. ET hours.' },
                ].map(r => (
                  <tr key={r.payer} className="hover:bg-gray-50">
                    <td className="px-2 py-2 font-semibold text-navy">{r.payer}</td>
                    <td className="px-2 py-2 font-mono text-[10px] text-blue-700">{r.auth}</td>
                    <td className="px-2 py-2 font-mono text-[10px] text-purple-700">{r.appeals}</td>
                    <td className="px-2 py-2 font-mono text-[10px] text-slate">{r.fax}</td>
                    <td className="px-2 py-2 text-[10px] text-teal-700 underline">{r.portal}</td>
                    <td className="px-2 py-2 text-[10px] text-slate italic">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {authActionSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <span>✓</span> {authActionSaved}
        </div>
      )}
    </div>
  );
}
