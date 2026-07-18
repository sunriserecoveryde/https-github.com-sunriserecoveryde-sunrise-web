import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

interface AuthRecord {
  patientId: string;
  patientName: string;
  mrn: string;
  program: string;
  insurance: string;
  authNumber: string;
  authorizedDays: number;
  usedDays: number;
  authStart: string;
  authEnd: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Pending' | 'Denied';
  dailyRate: number;
  urContact: string;
}

interface Claim {
  id: string;
  patientName: string;
  mrn: string;
  insurance: string;
  serviceDate: string;
  submittedDate: string;
  amount: number;
  status: 'Submitted' | 'In Review' | 'Paid' | 'Denied' | 'Appealing';
  denialReason?: string;
}

const AUTHS: AuthRecord[] = [
  { patientId: 'p1', patientName: 'Marcus Webb', mrn: 'MRN-83921', program: 'Residential', insurance: 'BlueCross', authNumber: 'BCB-2026-44821', authorizedDays: 30, usedDays: 22, authStart: '2026-06-26', authEnd: '2026-07-25', status: 'Active', dailyRate: 850, urContact: 'Linda Vance' },
  { patientId: 'p2', patientName: 'Samantha Choi', mrn: 'MRN-74563', program: 'Residential', insurance: 'Aetna', authNumber: 'AET-2026-19034', authorizedDays: 14, usedDays: 13, authStart: '2026-07-05', authEnd: '2026-07-19', status: 'Expiring Soon', dailyRate: 920, urContact: 'Linda Vance' },
  { patientId: 'p3', patientName: 'James Thornton', mrn: 'MRN-62841', program: 'Residential', insurance: 'United', authNumber: 'UHC-2026-88201', authorizedDays: 28, usedDays: 28, authStart: '2026-06-20', authEnd: '2026-07-17', status: 'Expired', dailyRate: 780, urContact: 'Linda Vance' },
  { patientId: 'p4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', program: 'Residential', insurance: 'Humana', authNumber: 'HUM-2026-33012', authorizedDays: 35, usedDays: 35, authStart: '2026-06-13', authEnd: '2026-07-17', status: 'Expired', dailyRate: 810, urContact: 'Linda Vance' },
  { patientId: 'p5', patientName: 'Robert Navarro', mrn: 'MRN-44782', program: 'Residential', insurance: 'TennCare', authNumber: 'TCR-2026-55810', authorizedDays: 45, usedDays: 42, authStart: '2026-06-06', authEnd: '2026-07-20', status: 'Expiring Soon', dailyRate: 620, urContact: 'Linda Vance' },
  { patientId: 'p6', patientName: 'Destiny Williams', mrn: 'MRN-55129', program: 'PHP', insurance: 'Cigna', authNumber: 'CGN-2026-77441', authorizedDays: 20, usedDays: 11, authStart: '2026-07-07', authEnd: '2026-07-26', status: 'Active', dailyRate: 480, urContact: 'Linda Vance' },
  { patientId: 'p7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', program: 'PHP', insurance: 'BlueCross', authNumber: 'BCB-2026-50291', authorizedDays: 21, usedDays: 21, authStart: '2026-06-27', authEnd: '2026-07-17', status: 'Expired', dailyRate: 490, urContact: 'Linda Vance' },
  { patientId: 'p8', patientName: 'Linda Farris', mrn: 'MRN-39018', program: 'IOP', insurance: 'Aetna', authNumber: 'Pending Review', authorizedDays: 0, usedDays: 14, authStart: '2026-07-04', authEnd: '—', status: 'Pending', dailyRate: 310, urContact: 'Linda Vance' },
];

const CLAIMS: Claim[] = [
  { id: 'cl1', patientName: 'Marcus Webb', mrn: 'MRN-83921', insurance: 'BlueCross', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 18700, status: 'Paid' },
  { id: 'cl2', patientName: 'Samantha Choi', mrn: 'MRN-74563', insurance: 'Aetna', serviceDate: '2026-07-05', submittedDate: '2026-07-07', amount: 12880, status: 'Paid' },
  { id: 'cl3', patientName: 'James Thornton', mrn: 'MRN-62841', insurance: 'United', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 15600, status: 'In Review' },
  { id: 'cl4', patientName: 'Patricia Holloway', mrn: 'MRN-48320', insurance: 'Humana', serviceDate: '2026-06-20', submittedDate: '2026-06-22', amount: 22680, status: 'Denied', denialReason: 'Level of care not medically necessary per Humana clinical criteria. Residential denied — PHP approved.' },
  { id: 'cl5', patientName: 'Robert Navarro', mrn: 'MRN-44782', insurance: 'TennCare', serviceDate: '2026-07-01', submittedDate: '2026-07-03', amount: 8680, status: 'Paid' },
  { id: 'cl6', patientName: 'Destiny Williams', mrn: 'MRN-55129', insurance: 'Cigna', serviceDate: '2026-07-07', submittedDate: '2026-07-09', amount: 5280, status: 'Submitted' },
  { id: 'cl7', patientName: 'Brian Kowalski', mrn: 'MRN-27641', insurance: 'BlueCross', serviceDate: '2026-06-27', submittedDate: '2026-06-29', amount: 10290, status: 'Appealing', denialReason: 'Missing clinical documentation — ASAM assessment not included.' },
  { id: 'cl8', patientName: 'Linda Farris', mrn: 'MRN-39018', insurance: 'Aetna', serviceDate: '2026-07-04', submittedDate: '—', amount: 4340, status: 'Submitted' },
];

const AUTH_COLORS: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Expiring Soon': 'bg-amber-100 text-amber-700',
  'Expired': 'bg-red-100 text-red-700',
  'Pending': 'bg-blue-100 text-blue-700',
  'Denied': 'bg-red-200 text-red-800',
};

const CLAIM_COLORS: Record<string, string> = {
  'Paid': 'bg-green-100 text-green-700',
  'Submitted': 'bg-blue-100 text-blue-700',
  'In Review': 'bg-amber-100 text-amber-700',
  'Denied': 'bg-red-100 text-red-700',
  'Appealing': 'bg-purple-100 text-purple-700',
};

const fmt = (n: number) => `$${n.toLocaleString()}`;

export function RevenueCycle({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Authorizations' | 'Claims' | 'Denied & Appeals'>('Authorizations');

  const totalRevMonth = CLAIMS.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const pendingRevenue = CLAIMS.filter(c => c.status !== 'Paid' && c.status !== 'Denied').reduce((s, c) => s + c.amount, 0);
  const deniedAmount = CLAIMS.filter(c => c.status === 'Denied').reduce((s, c) => s + c.amount, 0);
  const denialRate = Math.round((CLAIMS.filter(c => c.status === 'Denied').length / CLAIMS.length) * 100);
  const expiringAuths = AUTHS.filter(a => a.status === 'Expiring Soon' || a.status === 'Expired').length;

  const denied = CLAIMS.filter(c => c.status === 'Denied' || c.status === 'Appealing');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Revenue Cycle</h1>
          <p className="text-slate text-sm mt-0.5">Insurance authorizations, claims, and billing</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2">+ Submit Claim</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{fmt(totalRevMonth)}</div>
          <div className="text-xs text-slate mt-1">Revenue Collected</div>
          <div className="text-xs text-slate">(This Month)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{fmt(pendingRevenue)}</div>
          <div className="text-xs text-slate mt-1">Pending Revenue</div>
          <div className="text-xs text-slate">In Review / Submitted</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{fmt(deniedAmount)}</div>
          <div className="text-xs text-slate mt-1">Denied</div>
          <div className="text-xs text-slate">Appeal in progress</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${denialRate > 15 ? 'text-red-600' : denialRate > 8 ? 'text-amber-600' : 'text-green-600'}`}>{denialRate}%</div>
          <div className="text-xs text-slate mt-1">Denial Rate</div>
          <div className="text-xs text-slate">Industry avg: 8–12%</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${expiringAuths > 0 ? 'text-amber-600' : 'text-green-600'}`}>{expiringAuths}</div>
          <div className="text-xs text-slate mt-1">Auth Alerts</div>
          <div className="text-xs text-slate">Expiring / Expired</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Authorizations', 'Claims', 'Denied & Appeals'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Authorizations' && (
        <div className="space-y-3">
          {(AUTHS.filter(a => a.status === 'Expiring Soon' || a.status === 'Expired' || a.status === 'Pending')).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>⚠ Action Required:</strong> {expiringAuths} authorization(s) expiring or expired — submit continued stay requests immediately.
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Insurance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Auth #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Days Auth'd / Used</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Expiration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Daily Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {AUTHS.map((a, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 hover:bg-gray-50 ${(a.status === 'Expiring Soon' || a.status === 'Expired') ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate('PatientDetail', a.patientId)} className="font-semibold text-navy hover:text-orange text-sm">{a.patientName}</button>
                      <div className="text-xs text-slate font-mono">{a.mrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate">{a.insurance}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate">{a.authNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-navy">{a.usedDays} / {a.authorizedDays || '—'}</div>
                      {a.authorizedDays > 0 && (
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full w-24">
                          <div className={`h-1.5 rounded-full ${a.usedDays >= a.authorizedDays ? 'bg-red-500' : a.usedDays >= a.authorizedDays * 0.85 ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${Math.min((a.usedDays / a.authorizedDays) * 100, 100)}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate text-sm">{a.authEnd}</td>
                    <td className="px-4 py-3 font-medium text-navy">{fmt(a.dailyRate)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AUTH_COLORS[a.status]}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      {(a.status === 'Expiring Soon' || a.status === 'Expired') && (
                        <button className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded font-medium hover:bg-amber-200 transition-colors">Request Extension</button>
                      )}
                      {a.status === 'Pending' && (
                        <button className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded font-medium hover:bg-blue-200 transition-colors">Follow Up</button>
                      )}
                      {a.status === 'Active' && (
                        <button className="text-xs text-slate hover:text-navy">View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Claims' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Insurance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Service Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {CLAIMS.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{c.patientName}</div>
                    <div className="text-xs text-slate font-mono">{c.mrn}</div>
                  </td>
                  <td className="px-4 py-3 text-slate">{c.insurance}</td>
                  <td className="px-4 py-3 text-slate">{c.serviceDate}</td>
                  <td className="px-4 py-3 text-slate">{c.submittedDate}</td>
                  <td className="px-4 py-3 font-bold text-navy">{fmt(c.amount)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLAIM_COLORS[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-border">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-navy">Total</td>
                <td className="px-4 py-3 font-bold text-navy">{fmt(CLAIMS.reduce((s, c) => s + c.amount, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === 'Denied & Appeals' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <strong>⚠ {denied.length} claim(s) require action.</strong> Total at risk: {fmt(denied.reduce((s, c) => s + c.amount, 0))}. Timely appeals (typically 30–60 days from denial) are critical.
          </div>
          {denied.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-navy">{c.patientName} <span className="text-xs text-slate font-mono ml-1">{c.mrn}</span></div>
                  <div className="text-sm text-slate">{c.insurance} · Service: {c.serviceDate} · <span className="font-bold text-navy">{fmt(c.amount)}</span></div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLAIM_COLORS[c.status]}`}>{c.status}</span>
              </div>
              {c.denialReason && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded p-2.5">
                  <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Denial Reason</div>
                  <p className="text-sm text-red-800">{c.denialReason}</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button className="btn-primary text-sm px-4 py-2">File Appeal</button>
                <button className="btn-outline text-sm px-4 py-2">Request Peer-to-Peer</button>
                <button className="btn-outline text-sm px-4 py-2">Write Off</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
