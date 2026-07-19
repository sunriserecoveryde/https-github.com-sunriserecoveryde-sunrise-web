import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { DollarSign, CheckCircle, AlertTriangle, Clock, Plus, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type FundingSource = 'Commercial Insurance' | 'Medicare' | 'Medicaid (TennCare)' | 'Self-Pay' | 'Sliding Fee Scale' | 'Charity Care' | 'State Grant (BHSF)' | 'COBRA';
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
    patientId: 'p9', fundingSource: 'Medicaid (TennCare)', weeklyRate: 900,
    totalBalance: 150, insuranceCoverage: 97, patientResponsibility: 150,
    deductibleMet: true, deductibleRemaining: 0, slidingFeeApplied: false,
    charityCarePending: false, financialScreening: 'Screened',
    counselorNotes: 'TennCare MCO: BlueCare Tennessee. Prior auth approved through 7/31. Re-auth scheduled.',
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

export function FinancialCounseling({ navigate }: Props) {
  const [tab, setTab] = useState<'Patients' | 'Analytics' | 'Sliding Fee' | 'Payment Plans'>('Patients');
  const [expandedPatient, setExpandedPatient] = useState<string | null>('p5');

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
        <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />New Financial Screen</button>
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
        {(['Patients', 'Analytics', 'Sliding Fee', 'Payment Plans'] as const).map(t => (
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
                        <div className="text-xs text-slate italic">No payment plan established</div>
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
    </div>
  );
}
