import React, { useState } from 'react';
import { Screen } from '../App';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, FileText, Users, BookOpen, ClipboardList } from 'lucide-react';
import { MOCK_STAFF } from '../data/mockStaff';

interface ComplianceItem {
  id: string;
  category: string;
  standard: string;
  description: string;
  status: 'Met' | 'Partial' | 'Not Met' | 'N/A';
  evidence?: string;
  dueDate?: string;
  assignedTo?: string;
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  // Clinical Records
  { id: 'c1', category: 'Clinical Records', standard: 'CARF 2.A.1', description: 'Treatment plan completed within 72 hours of admission', status: 'Met', evidence: '18/18 active charts compliant' },
  { id: 'c2', category: 'Clinical Records', standard: 'CARF 2.A.2', description: 'Progress notes completed within 24 hours of session', status: 'Partial', evidence: '3 notes pending co-sign (>24h)', dueDate: '2023-10-27', assignedTo: 'Sarah Jenkins, LPC' },
  { id: 'c3', category: 'Clinical Records', standard: 'CARF 2.A.3', description: 'ASAM multidimensional assessment on file for all clients', status: 'Met', evidence: 'All 18 active charts have current ASAM assessment' },
  { id: 'c4', category: 'Clinical Records', standard: 'CARF 2.A.4', description: 'Discharge summary completed within 30 days', status: 'Partial', evidence: '1 discharge summary 28 days overdue', dueDate: '2023-10-28', assignedTo: 'David Odom, LMFT' },
  // Staffing
  { id: 's1', category: 'Staffing & Credentials', standard: 'CARF 3.B.1', description: 'All clinical staff hold current licensure', status: 'Met', evidence: 'Credentials verified 2023-09-01' },
  { id: 's2', category: 'Staffing & Credentials', standard: 'CARF 3.B.2', description: 'Staff-to-client ratio meets LOC requirements (Residential 1:6)', status: 'Met', evidence: 'Current ratio: 1:4.5 residential, 1:6 PHP' },
  { id: 's3', category: 'Staffing & Credentials', standard: 'CARF 3.B.3', description: 'Annual performance evaluations completed', status: 'Not Met', evidence: '2 staff evaluations overdue', dueDate: '2023-11-01', assignedTo: 'James Carter' },
  { id: 's4', category: 'Staffing & Credentials', standard: 'CARF 3.C.1', description: 'CPR/First Aid certification current for all direct care staff', status: 'Partial', evidence: '2 BHTs expiring within 30 days', dueDate: '2023-11-15' },
  // Safety
  { id: 'sf1', category: 'Safety & Environment', standard: 'JC EC.02.01.01', description: 'Fire safety inspection completed (annual)', status: 'Met', evidence: 'Inspection completed 2023-06-15 — no deficiencies' },
  { id: 'sf2', category: 'Safety & Environment', standard: 'JC EC.02.05.01', description: 'Emergency equipment (AED) inspected monthly', status: 'Met', evidence: 'Inspected 2023-10-01' },
  { id: 'sf3', category: 'Safety & Environment', standard: 'JC EC.02.06.01', description: 'Hazardous materials properly stored and labeled', status: 'Not Met', evidence: 'Storage room audit found unlabeled cleaning agent', dueDate: '2023-10-30', assignedTo: 'Kevin Wright' },
  { id: 'sf4', category: 'Safety & Environment', standard: 'CARF 2.F.5', description: 'Medication storage meets DEA and state pharmacy board standards', status: 'Met', evidence: 'Pharmacy inspection passed 2023-08-22' },
  // Quality Improvement
  { id: 'q1', category: 'Quality Improvement', standard: 'CARF 1.A.1', description: 'Performance improvement plan (PIP) documented and active', status: 'Met', evidence: 'Q4 2023 PIP reviewed by leadership 2023-10-15' },
  { id: 'q2', category: 'Quality Improvement', standard: 'CARF 1.A.2', description: 'Client satisfaction surveys collected and analyzed quarterly', status: 'Met', evidence: 'Q3 2023: 87% satisfaction rate (n=42)' },
  { id: 'q3', category: 'Quality Improvement', standard: 'CARF 1.A.3', description: 'Outcome data reported to funders/state (TEDS/SAAS)', status: 'Partial', evidence: 'Q3 report submitted; 5 records missing DOD data', dueDate: '2023-11-01', assignedTo: 'Linda Vance' },
  // Rights & Ethics
  { id: 'r1', category: 'Client Rights & Ethics', standard: 'CARF 2.B.1', description: "Client rights document signed and in chart at admission", status: 'Met', evidence: 'All 18 active charts compliant' },
  { id: 'r2', category: 'Client Rights & Ethics', standard: '42 CFR Part 2', description: 'Consent for disclosure of substance use records on file', status: 'Met', evidence: 'All signed; verified by UR 2023-10-20' },
  { id: 'r3', category: 'Client Rights & Ethics', standard: 'HIPAA §164.530', description: 'Annual HIPAA workforce training completed', status: 'Partial', evidence: '2 staff members have not completed 2023 module', dueDate: '2023-10-31', assignedTo: 'James Carter' },
];

const TRAINING_RECORDS = MOCK_STAFF.slice(0, 8).map((s, i) => ({
  ...s,
  hipaa: i < 6,
  cprExpiry: i % 3 === 2 ? '2023-11-10' : '2024-06-01',
  mandatedReporter: i < 7,
  annualEval: i < 6,
  lastTrainingDate: i % 2 === 0 ? '2023-09-15' : '2023-08-20',
}));

const categoryColors: Record<string, string> = {
  'Clinical Records': 'bg-sunrise-blue/10 text-sunrise-blue border-sunrise-blue/20',
  'Staffing & Credentials': 'bg-purple-50 text-purple-700 border-purple-200',
  'Safety & Environment': 'bg-sunrise-amber/10 text-sunrise-amber border-sunrise-amber/20',
  'Quality Improvement': 'bg-success/10 text-success border-success/20',
  'Client Rights & Ethics': 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AuditCompliance({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'training' | 'deficiencies'>('checklist');

  const met = COMPLIANCE_ITEMS.filter(c => c.status === 'Met').length;
  const partial = COMPLIANCE_ITEMS.filter(c => c.status === 'Partial').length;
  const notMet = COMPLIANCE_ITEMS.filter(c => c.status === 'Not Met').length;
  const total = COMPLIANCE_ITEMS.length;
  const score = Math.round((met / total) * 100);

  const deficiencies = COMPLIANCE_ITEMS.filter(c => c.status !== 'Met' && c.status !== 'N/A');
  const categories = [...new Set(COMPLIANCE_ITEMS.map(c => c.category))];

  const StatusIcon = ({ status }: { status: ComplianceItem['status'] }) => {
    if (status === 'Met') return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />;
    if (status === 'Partial') return <Clock className="w-4 h-4 text-sunrise-amber flex-shrink-0" />;
    if (status === 'Not Met') return <XCircle className="w-4 h-4 text-critical flex-shrink-0" />;
    return <span className="text-slate text-xs font-medium">N/A</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sunrise-blue" /> Audit Readiness
          </h1>
          <p className="text-slate text-sm mt-1">CARF & Joint Commission compliance tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Export Report</button>
          <button className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">Request Mock Audit</button>
        </div>
      </div>

      {/* Readiness gauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-gradient-to-br from-navy to-navy-mid rounded-lg p-6 text-white flex flex-col items-center justify-center shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2">Overall Readiness</div>
          <div className={`text-6xl font-bold mb-1 ${score >= 90 ? 'text-success' : score >= 75 ? 'text-sunrise-amber' : 'text-critical'}`}>{score}%</div>
          <div className="text-slate-300 text-sm">Next survey: Q1 2024</div>
        </div>
        <div className="bg-white border-l-4 border-success rounded-lg shadow-sm p-4 flex flex-col justify-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">Standards Met</div>
          <div className="text-4xl font-bold text-success">{met}</div>
          <div className="text-sm text-slate">of {total} standards</div>
        </div>
        <div className="bg-white border-l-4 border-sunrise-amber rounded-lg shadow-sm p-4 flex flex-col justify-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">Partial / Action Needed</div>
          <div className="text-4xl font-bold text-sunrise-amber">{partial}</div>
          <div className="text-sm text-slate">require remediation</div>
        </div>
        <div className="bg-white border-l-4 border-critical rounded-lg shadow-sm p-4 flex flex-col justify-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">Not Met</div>
          <div className="text-4xl font-bold text-critical">{notMet}</div>
          <div className="text-sm text-slate">active deficiencies</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="flex border-b border-border">
          {[
            { id: 'checklist' as const, label: 'Standards Checklist', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'deficiencies' as const, label: `Deficiencies (${deficiencies.length})`, icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'training' as const, label: 'Staff Training', icon: <Users className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5' : 'border-transparent text-slate hover:text-navy'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {categories.map(cat => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${categoryColors[cat] ?? 'bg-slate-100 text-slate border-slate-200'}`}>{cat}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-2">
                    {COMPLIANCE_ITEMS.filter(c => c.category === cat).map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg transition-colors border border-transparent hover:border-border">
                        <StatusIcon status={item.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-slate bg-slate-100 px-1.5 py-0.5 rounded">{item.standard}</span>
                            <span className="text-sm font-semibold text-navy">{item.description}</span>
                          </div>
                          {item.evidence && <div className="text-xs text-slate">{item.evidence}</div>}
                        </div>
                        {item.dueDate && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-critical font-medium">Due {item.dueDate}</div>
                            {item.assignedTo && <div className="text-xs text-slate">{item.assignedTo.split(',')[0]}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deficiencies' && (
            <div className="space-y-4">
              {deficiencies.length === 0 ? (
                <div className="text-center py-12 text-slate">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                  <div className="font-semibold">No active deficiencies</div>
                </div>
              ) : deficiencies.map(item => (
                <div key={item.id} className={`border rounded-lg p-4 ${item.status === 'Not Met' ? 'border-critical/40 bg-critical/5' : 'border-sunrise-amber/40 bg-sunrise-amber/5'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {item.status === 'Not Met' 
                        ? <XCircle className="w-5 h-5 text-critical flex-shrink-0 mt-0.5" /> 
                        : <Clock className="w-5 h-5 text-sunrise-amber flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.status === 'Not Met' ? 'bg-critical text-white' : 'bg-sunrise-amber text-navy'}`}>{item.status}</span>
                          <span className="text-xs font-mono text-slate">{item.standard}</span>
                          <span className="text-xs text-slate">{item.category}</span>
                        </div>
                        <div className="font-semibold text-navy text-sm">{item.description}</div>
                        {item.evidence && <div className="text-xs text-slate mt-1">{item.evidence}</div>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.dueDate && <div className="text-xs text-critical font-bold">Due: {item.dueDate}</div>}
                      {item.assignedTo && <div className="text-xs text-slate mt-0.5">→ {item.assignedTo.split(',')[0]}</div>}
                      <button className="mt-2 text-xs px-2 py-1 bg-white border border-border rounded font-medium text-slate hover:bg-slate-50">Resolve</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'training' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-navy">Staff Training Compliance</h3>
                <button className="text-sm px-3 py-1.5 bg-sunrise-blue text-white rounded font-medium hover:bg-sunrise-blue-light">Assign Training</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Staff Member</th>
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Role</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">HIPAA 2023</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">CPR/FA</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Mandated Reporter</th>
                    <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Annual Eval</th>
                    <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate">Last Training</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TRAINING_RECORDS.map(s => (
                    <tr key={s.id} className="hover:bg-bg">
                      <td className="py-3 px-3 font-semibold text-navy">{s.name}</td>
                      <td className="py-3 px-3 text-slate text-xs">{s.role}</td>
                      <td className="py-3 px-3 text-center">
                        {s.hipaa ? <CheckCircle2 className="w-4 h-4 text-success mx-auto" /> : <XCircle className="w-4 h-4 text-critical mx-auto" />}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className={`text-xs font-medium ${new Date(s.cprExpiry) < new Date('2023-12-01') ? 'text-sunrise-amber' : 'text-success'}`}>
                          Exp: {s.cprExpiry}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {s.mandatedReporter ? <CheckCircle2 className="w-4 h-4 text-success mx-auto" /> : <span className="text-slate text-xs">N/A</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {s.annualEval ? <CheckCircle2 className="w-4 h-4 text-success mx-auto" /> : <XCircle className="w-4 h-4 text-critical mx-auto" />}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate">{s.lastTrainingDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
