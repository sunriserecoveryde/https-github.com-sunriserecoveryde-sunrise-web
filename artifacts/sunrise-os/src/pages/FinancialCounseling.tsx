import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { DollarSign, CheckCircle, AlertTriangle, Clock, Plus, TrendingDown, ChevronDown, ChevronUp, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type FundingSource = 'Commercial Insurance' | 'Medicare' | 'Medicaid (Maryland Medicaid)' | 'Self-Pay' | 'Sliding Fee Scale' | 'Charity Care' | 'State Grant (BHSF)' | 'COBRA';
type PaymentPlanStatus = 'Active' | 'Completed' | 'Delinquent' | 'Pending';
type FinancialScreeningStatus = 'Screened' | 'Pending' | 'Ineligible';

interface PatientFinancial {
  patientId: string;
  fundingSource: FundingSource;
  weeklyRate: number;
  totalBalance: number;
  insuranceCoverage: number; // %
  patientResponsibility: number; // $
  deductibleMet: boolean;
  deductibleRemaining: number;
  slidingFeeApplied: boolean;
  slidingFeePercent?: number;
  charityCarePending: boolean;
  paymentPlan?: {
    monthlyAmount: number;
    startDate: string;
    endDate: string;
    status: PaymentPlanStatus;
    paidToDate: number;
  };
  financialScreening: FinancialScreeningStatus;
  counselorNotes?: string;
}

const FINANCIAL_DATA: PatientFinancial[] = [
  {
    patientId: 'p1', fundingSource: 'Commercial Insurance', weeklyRate: 1400,
    totalBalance: 3200, insuranceCoverage: 80, patientResponsibility: 640,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    paymentPlan: { monthlyAmount: 213, startDate: '2026-08-01', endDate: '2026-11-01', status: 'Pending', paidToDate: 0 },
    counselorNotes: 'Wife Emily handles insurance — confirm EOB when received. Patient on Suboxone — verify OTP benefit separate from residential.',
  },
  {
    patientId: 'p4', fundingSource: 'Commercial Insurance', weeklyRate: 1400,
    totalBalance: 0, insuranceCoverage: 100, patientResponsibility: 0,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    counselorNotes: 'Legal expense insurance covers full SUD treatment per attorney benefits. Re-verify next auth period.',
  },
  {
    patientId: 'p9', fundingSource: 'Medicaid (Maryland Medicaid)', weeklyRate: 900,
    totalBalance: 150, insuranceCoverage: 97, patientResponsibility: 150,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    counselorNotes: 'Maryland Medicaid MCO: CareFirst BlueChoice. Prior auth approved through 7/31. Re-auth scheduled.',
  },
  {
    patientId: 'p5', fundingSource: 'Self-Pay', weeklyRate: 1200,
    totalBalance: 7800, insuranceCoverage: 0, patientResponsibility: 7800,
    deductibleMet: false, deductibleRemaining: 0, slidingFeeApplied: true, slidingFeePercent: 40,
    charityCarePending: false, financialScreening: 'Screened',
    paymentPlan: { monthlyAmount: 520, startDate: '2026-07-15', endDate: '2027-02-15', status: 'Active', paidToDate: 520 },
    counselorNotes: 'Sliding fee at 40% — income verified at $38K/year. Payment plan established. First payment received 7/15. DUI legal costs affecting ability to pay — monitor.',
  },
  {
    patientId: 'p3', fundingSource: 'State Grant (BHSF)', weeklyRate: 1050,
    totalBalance: 0, insuranceCoverage: 100, patientResponsibility: 0,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    counselorNotes: 'BHSF Block Grant funding — verify quarterly enrollment requirements. Housing instability qualifies for enhanced funding tier.',
  },
  {
    patientId: 'p12', fundingSource: 'Medicare', weeklyRate: 1100,
    totalBalance: 890, insuranceCoverage: 80, patientResponsibility: 890,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: true, slidingFeePercent: 25,
    charityCarePending: false, financialScreening: 'Screened',
    paymentPlan: { monthlyAmount: 150, startDate: '2026-07-01', endDate: '2026-12-31', status: 'Active', paidToDate: 150 },
    counselorNotes: 'Medicare Part A covers inpatient. Medigap Plan F applied — significantly reduces OOP. Patient on fixed income — reduced sliding fee approved by CFO.',
  },
  {
    patientId: 'p18', fundingSource: 'Charity Care', weeklyRate: 1050,
    totalBalance: 0, insuranceCoverage: 0, patientResponsibility: 0,
    deductibleMet: false, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    counselorNotes: 'Full charity care approved — homeless, no income. Nonprofit community benefit obligation fulfilled. Grant report required quarterly.',
  },
  {
    patientId: 'p16', fundingSource: 'Self-Pay', weeklyRate: 1200,
    totalBalance: 4500, insuranceCoverage: 0, patientResponsibility: 4500,
    deductibleMet: false, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: true, financialScreening: 'Pending',
    counselorNotes: 'Charity care application in process — income documentation requested. On hold pending verification. Do not discharge for financial reasons per policy.',
  },
];

const FUNDING_PIE = [
  { name: 'Commercial', value: 35, color: '#1B2F5E' },
  { name: 'Medicaid', value: 28, color: '#2ECC71' },
  { name: 'Self-Pay', value: 18, color: '#FF6A00' },
  { name: 'Medicare', value: 10, color: '#3498DB' },
  { name: 'Grant / Charity', value: 9, color: '#9B59B6' },
];

const COLLECTION_DATA = [
  { month: 'Feb', collected: 142000, billed: 175000 },
  { month: 'Mar', collected: 158000, billed: 182000 },
  { month: 'Apr', collected: 163000, billed: 189000 },
  { month: 'May', collected: 171000, billed: 195000 },
  { month: 'Jun', collected: 168000, billed: 192000 },
  { month: 'Jul', collected: 79000, billed: 98000 },
];

const STATUS_STYLE: Record<PaymentPlanStatus, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Completed': 'bg-blue-100 text-blue-700',
  'Delinquent': 'bg-red-100 text-red-700',
  'Pending': 'bg-amber-100 text-amber-700',
};

const SLIDING_FEE_SCHEDULE = [
  { fpl: '0–100%', discount: '100% (Charity Care)', weeklyRate: '$0' },
  { fpl: '101–150%', discount: '75% reduction', weeklyRate: '~$250–350' },
  { fpl: '151–200%', discount: '50% reduction', weeklyRate: '~$500–600' },
  { fpl: '201–250%', discount: '30% reduction', weeklyRate: '~$740–850' },
  { fpl: '251–300%', discount: '15% reduction', weeklyRate: '~$895–1,020' },
  { fpl: '301%+', discount: 'Full rate', weeklyRate: 'Varies by program' },
];

export function FinancialCounseling({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Patients' | 'Analytics' | 'Sliding Fee' | 'Payment Plans' | 'Insurance Resources' | 'Grant Funding'>('Patients');
  const [expandedPatient, setExpandedPatient] = useState<string | null>('p5');
  const [screenOpen, setScreenOpen] = useState(false);
  const [screenSaved, setScreenSaved] = useState(false);

  const totalAR = FINANCIAL_DATA.reduce((a, f) => a + f.totalBalance, 0);
  const charityPending = FINANCIAL_DATA.filter(f => f.charityCarePending).length;
  const activePlans = FINANCIAL_DATA.filter(f => f.paymentPlan?.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Financial Counseling</h1>
          <p className="text-slate text-sm mt-0.5">Sliding fee scale · Payment plans · Charity care · Insurance gaps · Revenue summary</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setScreenOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />New Financial Screen</LockedButton>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Patient AR', value: `$${totalAR.toLocaleString()}`, sub: 'Accounts receivable', color: totalAR > 10000 ? 'text-red-600' : 'text-navy' },
          { label: 'Active Payment Plans', value: activePlans, sub: 'Patients on plan', color: 'text-navy' },
          { label: 'Charity Care Pending', value: charityPending, sub: 'Application in review', color: charityPending > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: 'Sliding Fee Applied', value: FINANCIAL_DATA.filter(f => f.slidingFeeApplied).length, sub: 'Income-adjusted rate', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Patients', 'Analytics', 'Sliding Fee', 'Payment Plans', 'Insurance Resources', 'Grant Funding'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Patients' && (
        <div className="space-y-3">
          {FINANCIAL_DATA.map(fin => {
            const p = MOCK_PATIENTS.find(pt => pt.id === fin.patientId);
            if (!p) return null;
            const isExpanded = expandedPatient === fin.patientId;
            const hasIssue = fin.charityCarePending || fin.financialScreening === 'Pending' || fin.totalBalance > 5000 || fin.paymentPlan?.status === 'Delinquent';
            return (
              <div key={fin.patientId} className={`border rounded-xl overflow-hidden ${hasIssue ? 'border-amber-300' : 'border-border'}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPatient(isExpanded ? null : fin.patientId)}>
                  <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{p.firstName[0]}{p.lastName[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); navigate('PatientDetail', p.id); }}>{p.firstName} {p.lastName}</button>
                      <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{fin.fundingSource}</span>
                      {fin.slidingFeeApplied && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Sliding Fee {fin.slidingFeePercent}%</span>}
                      {fin.charityCarePending && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Charity Pending</span>}
                      {fin.paymentPlan && <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[fin.paymentPlan.status]}`}>Plan: {fin.paymentPlan.status}</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">Balance: ${fin.totalBalance.toLocaleString()} · Insurance covers {fin.insuranceCoverage}% · Patient resp: ${fin.patientResponsibility.toLocaleString()}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-white grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Billing Summary</div>
                      {[
                        ['Weekly Rate', `$${fin.weeklyRate.toLocaleString()}`],
                        ['Insurance Coverage', `${fin.insuranceCoverage}%`],
                        ['Deductible Met', fin.deductibleMet ? 'Yes' : `No — $${fin.deductibleRemaining} remaining`],
                        ['Patient Balance', `$${fin.totalBalance.toLocaleString()}`],
                        ['Patient Responsibility', `$${fin.patientResponsibility.toLocaleString()}`],
                      ].map(([k,v]) => (
                        <div key={k} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span className="text-slate">{k}</span><span className="font-semibold text-navy">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Payment Plan</div>
                      {fin.paymentPlan ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-slate">Monthly Payment</span><span className="font-semibold text-navy">${fin.paymentPlan.monthlyAmount}</span></div>
                          <div className="flex justify-between"><span className="text-slate">Start → End</span><span className="font-semibold text-navy">{fin.paymentPlan.startDate} → {fin.paymentPlan.endDate}</span></div>
                          <div className="flex justify-between"><span className="text-slate">Paid to Date</span><span className="font-semibold text-green-600">${fin.paymentPlan.paidToDate}</span></div>
                          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[fin.paymentPlan.status]}`}>{fin.paymentPlan.status}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate italic"><span>💳</span> No payment plan established — self-pay balance due at discharge</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Counselor Notes</div>
                      <p className="text-xs text-navy leading-relaxed">{fin.counselorNotes || 'No notes recorded.'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Payer Mix (Census)</h3>
            <p className="text-xs text-slate mb-2">Distribution of funding sources</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={FUNDING_PIE} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {FUNDING_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Monthly Collections vs. Billed</h3>
            <p className="text-xs text-slate mb-2">Target collection rate: ≥88%</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COLLECTION_DATA} margin={{ left: -15, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="billed" name="Billed" fill="#E8EBF0" radius={[3,3,0,0]} />
                <Bar dataKey="collected" name="Collected" fill="#1B2F5E" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Sliding Fee' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-navy mb-1">Sunrise Recovery — Sliding Fee Policy</h3>
            <p className="text-sm text-slate leading-relaxed">Our sliding fee scale is based on Federal Poverty Level (FPL) and household size. No patient will be denied treatment due to inability to pay. Income verification required annually. Adjustments available quarterly.</p>
          </div>
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-navy text-white text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Income (% FPL)</th>
                  <th className="text-left px-4 py-3">Fee Reduction</th>
                  <th className="text-left px-4 py-3">Approx. Weekly Rate</th>
                </tr>
              </thead>
              <tbody>
                {SLIDING_FEE_SCHEDULE.map((row, i) => (
                  <tr key={i} className={`text-sm border-b border-border ${i === 0 ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2.5 font-semibold text-navy">{row.fpl}</td>
                    <td className="px-4 py-2.5 text-slate">{row.discount}</td>
                    <td className="px-4 py-2.5 font-medium text-navy">{row.weeklyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card space-y-2">
            <h4 className="font-semibold text-navy">Required Documentation for Sliding Fee</h4>
            {['Last 2 pay stubs OR most recent tax return (1040)', 'Proof of household size (birth certificates, lease agreement)', 'Photo ID', 'Annual review — must recertify every 12 months', 'Self-attestation form (Form FC-003) if documents unavailable'].map((d, i) => (
              <div key={i} className="text-sm text-navy flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{d}</div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Payment Plans' && (
        <div className="space-y-4">
          {FINANCIAL_DATA.filter(f => f.paymentPlan).map(fin => {
            const p = MOCK_PATIENTS.find(pt => pt.id === fin.patientId);
            const plan = fin.paymentPlan!;
            const progress = Math.round(plan.paidToDate / fin.patientResponsibility * 100) || 0;
            return (
              <div key={fin.patientId} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button className="font-bold text-navy hover:text-orange" onClick={() => navigate('PatientDetail', fin.patientId)}>{p?.firstName} {p?.lastName}</button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
                  </div>
                  <div className="text-sm font-bold text-navy">${plan.monthlyAmount}/mo</div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs text-center mb-3">
                  <div><div className="text-slate">Total Balance</div><div className="font-bold text-navy">${fin.patientResponsibility.toLocaleString()}</div></div>
                  <div><div className="text-slate">Paid to Date</div><div className="font-bold text-green-600">${plan.paidToDate.toLocaleString()}</div></div>
                  <div><div className="text-slate">Remaining</div><div className="font-bold text-navy">${(fin.patientResponsibility - plan.paidToDate).toLocaleString()}</div></div>
                  <div><div className="text-slate">End Date</div><div className="font-bold text-navy">{plan.endDate}</div></div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="text-xs text-slate mt-1">{progress}% paid</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Insurance Resources' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Counselor reference guide — insurance verification workflow, appeal scripts, payer-specific authorization requirements, and patient rights.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Insurance Verification Workflow</h3>
              <div className="space-y-2">
                {[
                  { step: 1, title: 'Collect Insurance Cards', detail: 'Scan front/back of all insurance cards at intake. Verify patient name matches ID exactly. Note group number, member ID, and payer phone.' },
                  { step: 2, title: 'Verify Active Coverage', detail: 'Call payer\'s provider line or use online portal. Confirm: effective dates, active status, deductible ($__), out-of-pocket maximum ($__), and whether SUD benefits are carved out to a behavioral health payer.' },
                  { step: 3, title: 'Check SUD/Behavioral Benefits', detail: 'Confirm: residential detox covered (Y/N), residential rehab covered (Y/N), PHP/IOP covered (Y/N). Ask about parity compliance under MHPAEA — document response.' },
                  { step: 4, title: 'Pre-Authorization', detail: 'Submit prior auth with: diagnosis (DSM-5 SUD code), ASAM level requested, clinical justification. Request auth number and note auth period. Typical turnaround: 24–72h urgent, 3–5 days routine.' },
                  { step: 5, title: 'Document & Communicate', detail: 'Enter auth number and verified benefits in EHR. Provide patient with Explanation of Benefits summary. Review cost-sharing at intake — get signed financial agreement.' },
                  { step: 6, title: 'Concurrent Review', detail: 'Submit concurrent review per payer schedule (typically every 3–7 days). Use clinical notes as supporting documentation. Track denial dates — appeal windows are typically 60–180 days.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3 p-2.5 border border-border rounded-lg text-xs">
                    <div className="w-6 h-6 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{s.step}</div>
                    <div>
                      <div className="font-semibold text-navy mb-0.5">{s.title}</div>
                      <div className="text-slate leading-relaxed">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Payer-Specific Authorization Requirements</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-slate">
                        <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-wider">Payer</th>
                        <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider">Auth Required</th>
                        <th className="text-left py-2 pl-2 text-[10px] font-bold uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { payer: 'BlueCross BlueShield', req: 'Yes — all levels', notes: 'BH carved out to Magellan; call 888-327-0671' },
                        { payer: 'UnitedHealthcare', req: 'Yes — Detox + Res.', notes: 'PHP/IOP: notify-only within 48h; use Optum portal' },
                        { payer: 'Cigna', req: 'Yes — all levels', notes: 'Evernorth/Cigna BH; fax auth to 800-735-1032' },
                        { payer: 'Aetna', req: 'Yes — Detox + Res.', notes: 'PHP: retro auth within 24h acceptable; IOP notify-only' },
                        { payer: 'Maryland Medicaid (Medicaid)', req: 'Yes — Detox only', notes: 'Residential: CoC authorization via DHS; IOP/PHP: no auth' },
                        { payer: 'Medicare', req: 'No (medically necessary)', notes: 'Document medical necessity; Res. covered only if SNF-level need' },
                        { payer: 'Humana', req: 'Yes — all levels', notes: 'Use AvMed portal; auth turnaround 2 business days' },
                      ].map(r => (
                        <tr key={r.payer} className="hover:bg-gray-50">
                          <td className="py-2 pr-3 font-medium text-navy">{r.payer}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.req.startsWith('Yes') ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{r.req}</span>
                          </td>
                          <td className="py-2 pl-2 text-slate">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Denial Appeal Quick Reference</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { reason: 'Not Medically Necessary', response: 'Submit ASAM assessment, CIWA/COWS scores, prior treatment history, and letter of medical necessity from MD. Cite MHPAEA parity if outpatient criteria would not trigger denial for comparable medical condition.' },
                    { reason: 'Experimental / Investigational', response: 'MAT (buprenorphine/methadone/naltrexone) denials on this basis are MHPAEA violations. Cite SAMHSA/ASAM evidence base and file parity complaint with MD Insurance Administration if not resolved.' },
                    { reason: 'Concurrent Review Denied', response: 'Request peer-to-peer review with payer MD within 72h. Have prescriber document continued medical necessity. If denied after P2P, file expedited appeal — typically 72h turnaround.' },
                    { reason: 'Out-of-Network', response: 'Confirm if facility is in-network first. If out-of-network, request in-network exception based on geographic access or continuity of care. Document No Surprises Act compliance.' },
                  ].map(d => (
                    <div key={d.reason} className="p-2.5 border border-border rounded-lg">
                      <div className="font-semibold text-red-700 mb-1">Denial: {d.reason}</div>
                      <div className="text-slate leading-relaxed">{d.response}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Patient Rights Reminder:</strong> Under 42 CFR Part 2, substance use disorder records have heightened confidentiality protections. Never release records without explicit written consent, even to payers, without a compliant consent form. MHPAEA parity protections apply to all plans — document every parity-related denial for potential regulatory complaint.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Grant Funding' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Federal, state, and foundation grant funding supporting patient financial assistance, program operations, and capacity expansion.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Grants', value: 4, color: 'text-navy', sub: 'Current funding period' },
              { label: 'Total Grant Revenue (FY26)', value: '$412K', color: 'text-green-600', sub: 'Across all funding sources' },
              { label: 'Patients Served via Grant', value: 31, color: 'text-blue-600', sub: 'Receiving grant-funded services' },
              { label: 'Upcoming Renewals', value: 2, color: 'text-amber-600', sub: 'Applications due in 90 days' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Active Grant Portfolio</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  name: 'SAMHSA SAPT Block Grant — MD Allocation', funder: 'SAMHSA / MD BHA', amount: '$187,000', period: 'FY2026 (Oct 2025 – Sep 2026)',
                  purpose: 'Sliding-scale services for uninsured and underinsured individuals. Covers residential, PHP, and IOP LOCs.',
                  patientsServed: 18, renewal: '2026-08-01', status: 'Active', sColor: 'bg-green-100 text-green-700'
                },
                {
                  name: 'HRSA Rural Health SUD Access Grant', funder: 'HRSA', amount: '$125,000', period: 'Jul 2025 – Jun 2027',
                  purpose: 'Telehealth expansion and outreach to rural Davidson/Cheatham County residents. Covers telemedicine equipment and care coordination.',
                  patientsServed: 7, renewal: '2027-04-01', status: 'Active', sColor: 'bg-green-100 text-green-700'
                },
                {
                  name: 'Maryland REDLINE Opioid Response Funding', funder: 'MD Dept. of Health', amount: '$68,000', period: 'FY2026',
                  purpose: 'OUD rapid access slots — buprenorphine induction, MAT linkage, and peer recovery support for OUD-priority admissions.',
                  patientsServed: 6, renewal: '2026-09-01', status: 'Renewal Due', sColor: 'bg-amber-100 text-amber-700'
                },
                {
                  name: 'United Way of the National Capital Area — Recovery Fund', funder: 'United Way', amount: '$32,000', period: 'Jan 2026 – Dec 2026',
                  purpose: 'Emergency financial assistance for patients — transportation, housing deposits, and essential needs post-discharge.',
                  patientsServed: 0, renewal: '2026-10-15', status: 'Renewal Due', sColor: 'bg-amber-100 text-amber-700'
                },
              ].map(g => (
                <div key={g.name} className="border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="font-semibold text-navy">{g.name}</span>
                      <span className="text-slate ml-2">— {g.funder}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="font-bold text-green-700 text-sm">{g.amount}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${g.sColor}`}>{g.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span className="font-semibold text-slate">Period:</span> <span className="text-navy">{g.period}</span></div>
                    <div><span className="font-semibold text-slate">Purpose:</span> <span className="text-navy">{g.purpose}</span></div>
                    <div><span className="font-semibold text-slate">Renewal Due:</span> <span className="text-navy">{g.renewal}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screenOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setScreenOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">New Financial Screening</h2>
              <button onClick={() => setScreenOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Devon Price — Residential</option><option>Sarah M. — IOP</option><option>Marcus R. — PHP</option><option>Aiden K. — Residential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Household Size</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    {[1,2,3,4,5,6,7,'8+'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Monthly Income ($)</label>
                  <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 2400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Primary Payer</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Medicaid</option><option>Medicare</option><option>Commercial Insurance</option><option>Self-Pay</option><option>Sliding Fee</option><option>Grant / Scholarship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">FPL Band</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Below 100% FPL</option><option>100–138% FPL</option><option>139–200% FPL</option><option>201–300% FPL</option><option>Above 300% FPL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[55px] resize-none" placeholder="Employment status, assets, extenuating circumstances..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setScreenOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setScreenOpen(false); setScreenSaved(true); setTimeout(() => setScreenSaved(false), 2500); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Save Screening</button>
            </div>
          </div>
        </div>
      )}

      {screenSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Financial screening saved
        </div>
      )}
    </div>
  );
}
