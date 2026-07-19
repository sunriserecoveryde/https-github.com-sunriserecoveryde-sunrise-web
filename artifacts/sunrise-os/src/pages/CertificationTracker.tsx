import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, AlertTriangle, Clock, XCircle, Plus, Award, Calendar, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type CertStatus = 'Current' | 'Expiring Soon' | 'Expired' | 'Pending Renewal' | 'In Progress';
type CertType = 'License' | 'Certification' | 'CEU' | 'Training';

interface StaffCredential {
  id: string;
  staffName: string;
  role: string;
  credentials: Credential[];
  ceuRequired: number;     // hours per cycle
  ceuCompleted: number;
  ceuCycleEnd: string;
}

interface Credential {
  id: string;
  name: string;
  type: CertType;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  licenseNumber?: string;
  renewalUrl?: string;
  notes?: string;
}

const STAFF_CREDENTIALS: StaffCredential[] = [
  {
    id: 'SC-001', staffName: 'Dr. James Carter', role: 'Clinical Director',
    ceuRequired: 40, ceuCompleted: 38, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-001', name: 'Licensed Professional Counselor — Mental Health Specialist', type: 'License', issuingBody: 'TN Board of Professional Counselors', issueDate: '2010-06-01', expiryDate: '2027-06-30', status: 'Current', licenseNumber: 'LPC-MHSP 3421', renewalUrl: 'https://tn.gov/health/health-program-areas/health-professional-boards/counselors-mft-cpjatsc-board.html' },
      { id: 'C-002', name: 'Certified Alcohol and Drug Counselor III', type: 'Certification', issuingBody: 'NAADAC / Tennessee Certification Board', issueDate: '2015-03-15', expiryDate: '2027-03-15', status: 'Current', licenseNumber: 'CADC-III 14871' },
      { id: 'C-003', name: 'Certified Clinical Supervisor', type: 'Certification', issuingBody: 'IC&RC', issueDate: '2018-07-01', expiryDate: '2026-07-01', status: 'Expiring Soon', licenseNumber: 'CCS 8823' },
      { id: 'C-004', name: 'CARF Survey Preparation Training', type: 'Training', issuingBody: 'CARF International', issueDate: '2024-09-01', expiryDate: '2026-09-01', status: 'Current' },
    ],
  },
  {
    id: 'SC-002', staffName: 'Dr. Robert Chen', role: 'Medical Director',
    ceuRequired: 60, ceuCompleted: 60, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-005', name: 'Tennessee Medical License', type: 'License', issuingBody: 'TN Board of Medical Examiners', issueDate: '2008-05-01', expiryDate: '2027-05-31', status: 'Current', licenseNumber: 'TN-MD 48821' },
      { id: 'C-006', name: 'DEA Registration (Controlled Substances)', type: 'License', issuingBody: 'US Drug Enforcement Administration', issueDate: '2024-01-01', expiryDate: '2027-01-01', status: 'Current', licenseNumber: 'DEA BC1234567' },
      { id: 'C-007', name: 'X-Waiver (Buprenorphine Prescribing)', type: 'Certification', issuingBody: 'SAMHSA / DEA', issueDate: '2019-04-15', expiryDate: '2099-12-31', status: 'Current', licenseNumber: 'X-Waiver BC1234567', notes: 'X-Waiver eliminated by MATE Act (Dec 2022) — waiver number maintained for historical records. No expiry.' },
      { id: 'C-008', name: 'Board Certified in Addiction Medicine', type: 'Certification', issuingBody: 'ABAM / ABPM', issueDate: '2020-10-01', expiryDate: '2030-10-01', status: 'Current', licenseNumber: 'ABAM 9981' },
    ],
  },
  {
    id: 'SC-003', staffName: 'Dr. Emma Hughes', role: 'Staff Psychiatrist',
    ceuRequired: 50, ceuCompleted: 44, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-009', name: 'Tennessee Medical License', type: 'License', issuingBody: 'TN Board of Medical Examiners', issueDate: '2012-07-01', expiryDate: '2027-07-31', status: 'Current', licenseNumber: 'TN-MD 52203' },
      { id: 'C-010', name: 'DEA Registration', type: 'License', issuingBody: 'US Drug Enforcement Administration', issueDate: '2024-06-01', expiryDate: '2027-06-01', status: 'Current', licenseNumber: 'DEA BH7654321' },
      { id: 'C-011', name: 'Board Certified in Psychiatry', type: 'Certification', issuingBody: 'American Board of Psychiatry & Neurology', issueDate: '2018-05-01', expiryDate: '2028-05-01', status: 'Current', licenseNumber: 'ABPN 44510' },
      { id: 'C-012', name: 'ASAM Certification in Addiction Medicine', type: 'Certification', issuingBody: 'ASAM', issueDate: '2022-01-15', expiryDate: '2026-01-15', status: 'Expired', licenseNumber: 'ASAM 3312', notes: 'Renewal application submitted 3/15/2026 — awaiting ASAM processing.' },
    ],
  },
  {
    id: 'SC-004', staffName: 'Sarah Jenkins', role: 'Primary Counselor',
    ceuRequired: 30, ceuCompleted: 27, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-013', name: 'Licensed Professional Counselor Associate', type: 'License', issuingBody: 'TN Board of Professional Counselors', issueDate: '2024-01-15', expiryDate: '2026-12-31', status: 'Expiring Soon', licenseNumber: 'LPC-A 8871', notes: 'Under supervision of Dr. Carter. Must accrue 2000 supervised hours for LPC-MHSP upgrade. Current: 1,420 hours.' },
      { id: 'C-014', name: 'National Certified Counselor', type: 'Certification', issuingBody: 'NBCC', issueDate: '2024-01-20', expiryDate: '2029-01-20', status: 'Current', licenseNumber: 'NCC 201441' },
      { id: 'C-015', name: 'CPR / AED Certification', type: 'Certification', issuingBody: 'American Heart Association', issueDate: '2025-03-01', expiryDate: '2027-03-01', status: 'Current' },
      { id: 'C-016', name: 'ASAM Foundations of Addiction Medicine', type: 'Training', issuingBody: 'ASAM', issueDate: '2025-06-15', expiryDate: '2028-06-15', status: 'Current' },
    ],
  },
  {
    id: 'SC-005', staffName: 'Maria Gonzalez', role: 'Licensed Social Worker',
    ceuRequired: 30, ceuCompleted: 30, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-017', name: 'Licensed Clinical Social Worker', type: 'License', issuingBody: 'TN Board of Social Work Examiners', issueDate: '2016-09-01', expiryDate: '2027-09-30', status: 'Current', licenseNumber: 'LCSW 4432' },
      { id: 'C-018', name: 'Certified Advanced Alcohol and Drug Counselor', type: 'Certification', issuingBody: 'Tennessee Certification Board', issueDate: '2018-04-01', expiryDate: '2026-10-01', status: 'Expiring Soon', licenseNumber: 'CAADC 2190' },
      { id: 'C-019', name: 'CPR / AED Certification', type: 'Certification', issuingBody: 'American Heart Association', issueDate: '2024-09-15', expiryDate: '2026-09-15', status: 'Expiring Soon' },
    ],
  },
  {
    id: 'SC-006', staffName: 'Jessica Torres', role: 'Director of Nursing',
    ceuRequired: 30, ceuCompleted: 30, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-020', name: 'Registered Nurse License', type: 'License', issuingBody: 'TN Board of Nursing', issueDate: '2009-05-01', expiryDate: '2027-09-30', status: 'Current', licenseNumber: 'RN 342198' },
      { id: 'C-021', name: 'Certified Addictions Registered Nurse', type: 'Certification', issuingBody: 'IntNSA / NNBA', issueDate: '2021-06-01', expiryDate: '2027-06-01', status: 'Current', licenseNumber: 'CARN 8821' },
      { id: 'C-022', name: 'CPR / AED / BLS Instructor', type: 'Certification', issuingBody: 'American Heart Association', issueDate: '2025-01-10', expiryDate: '2027-01-10', status: 'Current' },
      { id: 'C-023', name: 'ASAM PCSS MAT Training', type: 'Training', issuingBody: 'ASAM PCSS', issueDate: '2025-07-01', expiryDate: '2028-07-01', status: 'Current' },
    ],
  },
  {
    id: 'SC-007', staffName: 'Kevin Wright', role: 'Behavioral Health Technician',
    ceuRequired: 12, ceuCompleted: 6, ceuCycleEnd: '2026-12-31',
    credentials: [
      { id: 'C-024', name: 'Certified Alcohol and Drug Counselor I', type: 'Certification', issuingBody: 'Tennessee Certification Board', issueDate: '2024-11-01', expiryDate: '2026-11-01', status: 'Current', licenseNumber: 'CADC-I 9920' },
      { id: 'C-025', name: 'CPR / AED Certification', type: 'Certification', issuingBody: 'American Heart Association', issueDate: '2025-06-01', expiryDate: '2027-06-01', status: 'Current' },
      { id: 'C-026', name: 'Mental Health First Aid', type: 'Training', issuingBody: 'MHFA USA', issueDate: '2025-02-15', expiryDate: '2028-02-15', status: 'Current' },
      { id: 'C-027', name: 'Crisis Prevention Institute (CPI) Nonviolent Crisis Intervention', type: 'Training', issuingBody: 'CPI', issueDate: '2025-08-01', expiryDate: '2026-08-01', status: 'Expiring Soon' },
    ],
  },
];

const STATUS_STYLE: Record<CertStatus, string> = {
  'Current':         'bg-green-100 text-green-700',
  'Expiring Soon':   'bg-amber-100 text-amber-700',
  'Expired':         'bg-red-100 text-red-700',
  'Pending Renewal': 'bg-blue-100 text-blue-700',
  'In Progress':     'bg-purple-100 text-purple-700',
};

const STATUS_ICON = {
  'Current':         <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
  'Expiring Soon':   <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
  'Expired':         <XCircle className="w-3.5 h-3.5 text-red-600" />,
  'Pending Renewal': <Clock className="w-3.5 h-3.5 text-blue-600" />,
  'In Progress':     <Clock className="w-3.5 h-3.5 text-purple-600" />,
};

const daysUntilExpiry = (dateStr: string) => {
  return Math.floor((new Date(dateStr).getTime() - new Date('2026-07-19').getTime()) / (1000 * 60 * 60 * 24));
};

const getCredentialStatus = (c: Credential): CertStatus => {
  const days = daysUntilExpiry(c.expiryDate);
  if (days < 0) return 'Expired';
  if (days < 90) return 'Expiring Soon';
  return c.status;
};

export function CertificationTracker({ navigate: _navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Dashboard' | 'Staff' | 'Upcoming' | 'CEU Tracker' | 'Licensure Board' | 'Renewal Planner'>('Dashboard');
  const [selectedStaff, setSelectedStaff] = useState<string>('SC-001');

  const allCreds = STAFF_CREDENTIALS.flatMap(s => s.credentials.map(c => ({ ...c, staff: s })));
  const expiredCreds = allCreds.filter(c => getCredentialStatus(c) === 'Expired');
  const expiringSoon = allCreds.filter(c => getCredentialStatus(c) === 'Expiring Soon');
  const upcomingRenewals = [...expiredCreds, ...expiringSoon].sort((a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate));

  const currentStaff = STAFF_CREDENTIALS.find(s => s.id === selectedStaff)!;

  const complianceData = STAFF_CREDENTIALS.map(s => ({
    name: s.staffName.split(' ').slice(-1)[0],
    current: s.credentials.filter(c => getCredentialStatus(c) === 'Current').length,
    expiring: s.credentials.filter(c => getCredentialStatus(c) === 'Expiring Soon').length,
    expired: s.credentials.filter(c => getCredentialStatus(c) === 'Expired').length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Certification Tracker</h1>
          <p className="text-slate text-sm mt-0.5">Staff licenses · Certifications · CEU tracking · CARF credentialing compliance</p>
        </div>
        <LockedButton locked={readOnly} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />Add Credential</LockedButton>
      </div>

      {(expiredCreds.length > 0 || expiringSoon.length > 0) && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${expiredCreds.length > 0 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${expiredCreds.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <div>
            <div className={`font-semibold ${expiredCreds.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
              {expiredCreds.length > 0 ? `${expiredCreds.length} Expired Credential${expiredCreds.length > 1 ? 's' : ''} — Action Required` : `${expiringSoon.length} Credentials Expiring Within 90 Days`}
            </div>
            <div className={`text-sm mt-0.5 ${expiredCreds.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
              {upcomingRenewals.slice(0, 3).map(c => `${c.staff.staffName} — ${c.name} (${c.expiryDate})`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Credentials', value: allCreds.length, sub: 'On file', color: 'text-navy' },
          { label: 'Current', value: allCreds.filter(c => getCredentialStatus(c) === 'Current').length, sub: 'Up to date', color: 'text-green-600' },
          { label: 'Expiring ≤ 90 days', value: expiringSoon.length, sub: 'Renewal due', color: expiringSoon.length > 0 ? 'text-amber-600' : 'text-navy' },
          { label: 'Expired', value: expiredCreds.length, sub: 'Immediate action', color: expiredCreds.length > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Dashboard', 'Staff', 'Upcoming', 'CEU Tracker', 'Licensure Board', 'Renewal Planner'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Dashboard' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Compliance by Staff Member</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complianceData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="current" name="Current" fill="#2ECC71" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="expiring" name="Expiring Soon" fill="#F39C12" stackId="a" />
                <Bar dataKey="expired" name="Expired" fill="#E74C3C" stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-navy text-sm">Action Required</h3>
            {upcomingRenewals.map(c => {
              const days = daysUntilExpiry(c.expiryDate);
              const status = getCredentialStatus(c);
              return (
                <div key={c.id} className={`flex items-center gap-4 p-3 border rounded-xl ${status === 'Expired' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[status]}
                      <span className="font-semibold text-navy text-sm">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
                    </div>
                    <div className="text-xs text-slate mt-0.5">{c.staff.staffName} · {c.issuingBody} · {c.licenseNumber || 'No license #'}</div>
                    {c.notes && <div className="text-xs text-amber-700 mt-1">{c.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${days < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                      {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
                    </div>
                    <div className="text-xs text-slate">{c.expiryDate}</div>
                    {c.renewalUrl && (
                      <a href={c.renewalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange hover:underline flex items-center gap-0.5 justify-end mt-0.5">Renew <ExternalLink className="w-3 h-3" /></a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Staff' && (
        <div className="grid grid-cols-4 gap-5">
          <div className="space-y-2">
            {STAFF_CREDENTIALS.map(s => {
              const expired = s.credentials.filter(c => getCredentialStatus(c) === 'Expired').length;
              const expiring = s.credentials.filter(c => getCredentialStatus(c) === 'Expiring Soon').length;
              return (
                <button key={s.id} onClick={() => setSelectedStaff(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedStaff === s.id ? 'border-orange bg-orange/5' : 'border-border hover:border-orange/40'}`}>
                  <div className="font-semibold text-navy text-sm">{s.staffName}</div>
                  <div className="text-xs text-slate">{s.role}</div>
                  <div className="flex gap-2 mt-1.5">
                    {expired > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{expired} expired</span>}
                    {expiring > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{expiring} expiring</span>}
                    {expired === 0 && expiring === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">All current</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="col-span-3 space-y-3">
            {currentStaff && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy text-lg">{currentStaff.staffName}</div>
                    <div className="text-sm text-slate">{currentStaff.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate">CEU Progress</div>
                    <div className="font-bold text-navy">{currentStaff.ceuCompleted}/{currentStaff.ceuRequired} hrs</div>
                    <div className="text-xs text-slate">Due {currentStaff.ceuCycleEnd}</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange rounded-full" style={{ width: `${Math.min(currentStaff.ceuCompleted / currentStaff.ceuRequired * 100, 100)}%` }} />
                </div>
                {currentStaff.credentials.map(cred => {
                  const status = getCredentialStatus(cred);
                  const days = daysUntilExpiry(cred.expiryDate);
                  return (
                    <div key={cred.id} className={`card ${status === 'Expired' ? 'border-red-300' : status === 'Expiring Soon' ? 'border-amber-300' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {STATUS_ICON[status]}
                            <span className="font-semibold text-navy text-sm">{cred.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>{status}</span>
                            <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{cred.type}</span>
                          </div>
                          <div className="text-xs text-slate mt-1">{cred.issuingBody}{cred.licenseNumber ? ` · ${cred.licenseNumber}` : ''}</div>
                          {cred.notes && <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">{cred.notes}</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate">Issued: {cred.issueDate}</div>
                          <div className="text-xs font-semibold text-navy">Expires: {cred.expiryDate}</div>
                          {days >= 0 && days < 365 && <div className={`text-xs font-bold ${days < 90 ? (days < 0 ? 'text-red-600' : 'text-amber-600') : 'text-slate'}`}>{days} days remaining</div>}
                          {days < 0 && <div className="text-xs font-bold text-red-600">{Math.abs(days)} days overdue</div>}
                          {cred.renewalUrl && (
                            <a href={cred.renewalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange hover:underline flex items-center gap-0.5 justify-end mt-0.5">Renew <ExternalLink className="w-3 h-3" /></a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'Upcoming' && (
        <div className="space-y-2">
          <div className="text-xs text-slate">All credentials expiring within 180 days — sorted by urgency</div>
          {allCreds
            .map(c => ({ ...c, days: daysUntilExpiry(c.expiryDate), computedStatus: getCredentialStatus(c) }))
            .filter(c => c.days < 180)
            .sort((a, b) => a.days - b.days)
            .map(c => (
              <div key={c.id} className={`flex items-center gap-4 p-3 border rounded-xl ${c.computedStatus === 'Expired' ? 'border-red-300 bg-red-50' : c.days < 30 ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                <div className="w-16 text-center">
                  <div className={`text-xl font-bold ${c.days < 0 ? 'text-red-700' : c.days < 30 ? 'text-red-600' : 'text-amber-600'}`}>{Math.abs(c.days)}</div>
                  <div className="text-[10px] text-slate">{c.days < 0 ? 'days ago' : 'days left'}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy text-sm">{c.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[c.computedStatus]}`}>{c.computedStatus}</span>
                  </div>
                  <div className="text-xs text-slate">{c.staff.staffName} · {c.issuingBody}</div>
                </div>
                <div className="text-xs text-slate text-right">
                  <div>Expires {c.expiryDate}</div>
                  {c.renewalUrl && (
                    <a href={c.renewalUrl} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline flex items-center gap-0.5 justify-end">Renew <ExternalLink className="w-3 h-3" /></a>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'CEU Tracker' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Continuing education units required for license and certification renewal. Current cycle ends December 31, 2026.</div>
          {STAFF_CREDENTIALS.map(s => {
            const pct = Math.round(s.ceuCompleted / s.ceuRequired * 100);
            const remaining = s.ceuRequired - s.ceuCompleted;
            return (
              <div key={s.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-navy">{s.staffName}</div>
                    <div className="text-xs text-slate">{s.role} · Cycle ends {s.ceuCycleEnd}</div>
                  </div>
                  <div className={`text-right ${pct >= 100 ? 'text-green-600' : remaining > 10 ? 'text-amber-600' : 'text-navy'}`}>
                    <div className="font-bold text-lg">{s.ceuCompleted}/{s.ceuRequired}</div>
                    <div className="text-xs">hours completed</div>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-orange' : 'bg-amber-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate mt-1">
                  <span>{pct}% complete</span>
                  <span className={remaining > 0 ? 'text-amber-600' : 'text-green-600'}>{remaining > 0 ? `${remaining} hrs still needed` : 'Requirement met ✓'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Licensure Board' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Active state licensure board tracking — renewal deadlines, CE requirements, and disciplinary status for all credentialed clinical staff.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Licensed Staff', value: 12, sub: 'All programs', color: 'text-navy' },
              { label: 'Renewals This Quarter', value: 3, sub: 'Due Q3 2026', color: 'text-amber-600' },
              { label: 'Board Complaints (12m)', value: 0, sub: 'Facility-wide', color: 'text-green-600' },
              { label: 'Supervisions On File', value: 8, sub: 'Active supervisees', color: 'text-blue-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">Clinical Staff — Licensure Status</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Staff Member</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">License</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">License #</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">State</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Issued</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Expires</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">CE Required</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Sarah Jenkins', license: 'LPC', num: 'TN-LPC-4421', state: 'TN', issued: '2020-05-01', expires: '2026-11-30', ce: '40 hrs/2yr', status: 'Active' },
                  { name: 'David Odom', license: 'LMFT', num: 'TN-LMFT-1882', state: 'TN', issued: '2019-09-01', expires: '2026-09-01', ce: '24 hrs/2yr', status: 'Due Q3' },
                  { name: 'Maria Gonzales', license: 'LCSW', num: 'TN-LCSW-7714', state: 'TN', issued: '2021-01-01', expires: '2027-01-01', ce: '30 hrs/2yr', status: 'Active' },
                  { name: 'Dr. Robert Chen', license: 'MD', num: 'TN-MD-28841', state: 'TN', issued: '2015-06-01', expires: '2027-06-01', ce: 'CME 40 hrs/yr', status: 'Active' },
                  { name: 'Dr. Allen Hughes', license: 'MD', num: 'TN-MD-31209', state: 'TN', issued: '2018-03-01', expires: '2027-03-01', ce: 'CME 40 hrs/yr', status: 'Active' },
                  { name: 'Jessica Torres', license: 'RN', num: 'TN-RN-88421', state: 'TN', issued: '2020-08-01', expires: '2026-08-01', ce: '5 hrs/2yr', status: 'Due Q3' },
                  { name: 'Michael Boyd', license: 'RN', num: 'TN-RN-91104', state: 'TN', issued: '2022-01-01', expires: '2027-01-01', ce: '5 hrs/2yr', status: 'Active' },
                  { name: 'Dr. James Carter', license: 'PhD / CADC-III', num: 'TN-PHD-1043', state: 'TN', issued: '2017-12-01', expires: '2026-12-01', ce: '40 hrs/2yr', status: 'Active' },
                  { name: 'Marcus Thompson (PSS)', license: 'CPRS', num: 'TN-CPRS-5521', state: 'TN', issued: '2023-03-01', expires: '2025-03-01', ce: '20 hrs/2yr', status: 'Renewal Overdue' },
                ].map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.status === 'Renewal Overdue' ? 'bg-red-50/40' : r.status === 'Due Q3' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-navy">{r.name}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate">{r.license}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate text-[10px]">{r.num}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.state}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.issued}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.expires}</td>
                    <td className="px-3 py-2.5 text-center text-slate">{r.ce}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Active' ? 'bg-green-100 text-green-700' : r.status === 'Due Q3' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Clinical Supervision Agreements on File</h3>
            <div className="space-y-3">
              {[
                { supervisee: 'Sandra Kim, LPCA', supervisor: 'Sarah Jenkins, LPC', goal: 'Full LPC licensure', hours: 1240, required: 2000, started: '2024-09-01' },
                { supervisee: 'Devon Ramos, LMSW', supervisor: 'Maria Gonzales, LCSW', goal: 'Full LCSW licensure', hours: 890, required: 2000, started: '2025-01-15' },
                { supervisee: 'Priya Mehta, LAMFT', supervisor: 'David Odom, LMFT', goal: 'Full LMFT licensure', hours: 650, required: 3000, started: '2025-03-01' },
              ].map(s => (
                <div key={s.supervisee} className="border border-border rounded-lg p-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-navy text-sm">{s.supervisee} → supervised by {s.supervisor}</div>
                    <div className="text-xs text-slate mt-0.5">Goal: {s.goal} · Started {s.started}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-navy">{s.hours}/{s.required} hrs</div>
                    <div className="text-slate">{Math.round((s.hours/s.required)*100)}% complete</div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.round((s.hours/s.required)*100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Renewal Planner' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Structured renewal planning tool — generates individualized CEU completion roadmaps for staff with upcoming certification expirations.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Renewals Due (6 months)', value: 5, color: 'text-amber-600', sub: 'Across clinical + nursing staff' },
              { label: 'CEU Hours Still Needed', value: 82, color: 'text-red-600', sub: 'Total across all staff due' },
              { label: 'Approved CEU Sources', value: 14, color: 'text-navy', sub: 'On Sunrise approved vendor list' },
              { label: 'Budget Available (CEU)', value: '$4,800', color: 'text-green-600', sub: 'FY2026 remaining' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Individualized Renewal Roadmaps — Next 6 Months</h3>
            <div className="space-y-4 text-xs">
              {[
                {
                  name: 'A. Brooks, LPC', cert: 'TN LPC License', expiry: '2026-09-30', board: 'MHSAB', needed: 20, done: 12, remaining: 8,
                  plan: [
                    { source: 'AAMFT Online CE — Ethics (3 CEU)', date: 'Jul 2026', cost: '$49', approved: true },
                    { source: 'NAADAC Trauma-Informed Care Workshop (5 CEU)', date: 'Aug 2026', cost: '$89', approved: true },
                    { source: 'SAMHSA TIP-63 Online Training Series (2 CEU)', date: 'Sep 2026', cost: 'Free', approved: true },
                  ]
                },
                {
                  name: 'K. Santos, RN', cert: 'TN RN License', expiry: '2026-09-30', board: 'TN BON', needed: 30, done: 14, remaining: 16,
                  plan: [
                    { source: 'ANA MedSurg Nursing Review (6 CEU)', date: 'Jul 2026', cost: '$79', approved: true },
                    { source: 'CE4Nurses Psychiatric/Mental Health Module (5 CEU)', date: 'Aug 2026', cost: '$45', approved: true },
                    { source: 'NAPNES Pharmacology Update (5 CEU)', date: 'Aug 2026', cost: '$55', approved: true },
                  ]
                },
                {
                  name: 'T. Jackson, CADC', cert: 'CADC Certification', expiry: '2026-11-15', board: 'NAADAC', needed: 40, done: 27, remaining: 13,
                  plan: [
                    { source: 'NAADAC Annual Conference Sessions (8 CEU)', date: 'Oct 2026', cost: '$249', approved: true },
                    { source: 'ATTC Motivational Interviewing Training (5 CEU)', date: 'Sep 2026', cost: '$75', approved: true },
                  ]
                },
              ].map(s => (
                <div key={s.name} className="border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-border flex items-center justify-between">
                    <div className="font-semibold text-navy">{s.name} — <span className="text-slate font-normal">{s.cert}</span></div>
                    <div className="flex items-center gap-4 text-slate text-[10px]">
                      <span>Expires: <strong className="text-amber-700">{s.expiry}</strong></span>
                      <span>Board: {s.board}</span>
                      <span>Progress: <strong className="text-navy">{s.done}/{s.needed} CEU ({s.remaining} remaining)</strong></span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {s.plan.map(p => (
                      <div key={p.source} className="flex items-center justify-between border border-border rounded p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-navy">{p.source}</span>
                        </div>
                        <div className="flex gap-4 text-slate shrink-0 ml-3">
                          <span>{p.date}</span>
                          <span className="font-semibold text-navy">{p.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
