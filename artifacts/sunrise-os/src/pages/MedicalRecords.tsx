import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Plus, Eye, Download, Lock, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type ROIStatus = 'Pending' | 'Active' | 'Expired' | 'Revoked' | 'Fulfilled' | 'Denied';
type ROIType = 'Outgoing' | 'Incoming';
type RecordType = 'Medical Records' | 'Progress Notes' | 'Discharge Summary' | 'Lab Results' | 'Treatment Plan' | 'Psychiatric Records' | 'Substance Abuse Records (42 CFR)';

interface ROIRequest {
  id: string;
  patientId: string;
  type: ROIType;
  recipientOrSender: string;
  recipientType: 'Primary Care Physician' | 'Psychiatrist' | 'Insurance/Payer' | 'Attorney' | 'Court/Legal' | 'Family Member' | 'Other Treatment Facility' | 'Patient Self';
  recordTypes: RecordType[];
  purposeOfDisclosure: string;
  requestDate: string;
  expiryDate: string;
  status: ROIStatus;
  requires42CFR: boolean;
  sentDate?: string;
  receivedDate?: string;
  fulfilledBy?: string;
  denialReason?: string;
  auditLog: { date: string; action: string; user: string }[];
}

const ROI_REQUESTS: ROIRequest[] = [
  {
    id: 'ROI-001', patientId: 'p1', type: 'Outgoing',
    recipientOrSender: 'Dr. Michael Torres, MD — Veterans Affairs Medical Center Rockville',
    recipientType: 'Primary Care Physician',
    recordTypes: ['Progress Notes', 'Treatment Plan', 'Substance Abuse Records (42 CFR)'],
    purposeOfDisclosure: 'Coordination of care — VA primary care and mental health services',
    requestDate: '2026-07-01', expiryDate: '2027-01-01', status: 'Active',
    requires42CFR: true,
    auditLog: [
      { date: '2026-07-01', action: 'ROI signed by patient in office', user: 'Sarah Jenkins, LPC' },
      { date: '2026-07-02', action: 'Records prepared — 42 CFR Notice to Accompany included', user: 'Medical Records (Admin)' },
      { date: '2026-07-02', action: 'Records transmitted via secure fax to VA (301-687-XXXX)', user: 'Medical Records (Admin)' },
    ],
  },
  {
    id: 'ROI-002', patientId: 'p4', type: 'Outgoing',
    recipientOrSender: 'Maryland Bar Association Lawyers Assistance Program (LAP)',
    recipientType: 'Court/Legal',
    recordTypes: ['Progress Notes', 'Discharge Summary', 'Treatment Plan'],
    purposeOfDisclosure: 'Legal reinstatement — Bar Association monitoring program',
    requestDate: '2026-07-10', expiryDate: '2027-01-10', status: 'Active',
    requires42CFR: true, sentDate: '2026-07-11',
    auditLog: [
      { date: '2026-07-10', action: 'ROI signed by patient — specific to LAP report format', user: 'David Odom, LMFT' },
      { date: '2026-07-11', action: 'LAP compliance report generated; records attached', user: 'Medical Records (Admin)' },
      { date: '2026-07-11', action: 'Sent via certified mail + secure fax to LAP (301-XXX-XXXX)', user: 'Medical Records (Admin)' },
    ],
  },
  {
    id: 'ROI-003', patientId: 'p9', type: 'Incoming',
    recipientOrSender: 'Vanderbilt Psychiatric Hospital — Records Department',
    recipientType: 'Other Treatment Facility',
    recordTypes: ['Psychiatric Records', 'Medical Records'],
    purposeOfDisclosure: 'Continuity of care — prior psychiatric hospitalization records needed for current treatment',
    requestDate: '2026-07-15', expiryDate: '2027-01-15', status: 'Pending',
    requires42CFR: false,
    auditLog: [
      { date: '2026-07-15', action: 'ROI signed; faxed to Vanderbilt Records (301-322-XXXX)', user: 'Jessica Torres, RN' },
      { date: '2026-07-16', action: 'Fax delivery confirmed; records anticipated within 5 business days', user: 'Medical Records (Admin)' },
    ],
  },
  {
    id: 'ROI-004', patientId: 'p5', type: 'Outgoing',
    recipientOrSender: 'State Farm Insurance — Claim #MD-2021-88341',
    recipientType: 'Insurance/Payer',
    recordTypes: ['Medical Records', 'Lab Results'],
    purposeOfDisclosure: 'Insurance claim processing — automobile accident physical injury (NOT substance use records)',
    requestDate: '2026-07-12', expiryDate: '2027-01-12', status: 'Denied',
    requires42CFR: true,
    denialReason: 'Request included mention of addiction treatment. 42 CFR Part 2 prohibits disclosure of substance abuse records to insurance companies for purposes unrelated to direct treatment. Patient counseled — records redacted to physical injury only (not SUD records). Patient offered opportunity to resubmit with redacted request.',
    auditLog: [
      { date: '2026-07-12', action: 'ROI received — reviewed by compliance officer', user: 'James S. Collins III' },
      { date: '2026-07-13', action: 'DENIED: 42 CFR Part 2 — insurer cannot receive SUD records for non-treatment purposes', user: 'James S. Collins III' },
      { date: '2026-07-13', action: 'Patient notified; 42 CFR rights explained; redacted version offered', user: 'David Odom, LMFT' },
    ],
  },
  {
    id: 'ROI-005', patientId: 'p3', type: 'Incoming',
    recipientOrSender: 'Dr. Sarah Kim, MD — Cool Springs Family Medicine',
    recipientType: 'Primary Care Physician',
    recordTypes: ['Medical Records', 'Lab Results'],
    purposeOfDisclosure: 'Prior medical records — recent hospitalization for cellulitis (IV drug use related)',
    requestDate: '2026-07-14', expiryDate: '2027-01-14', status: 'Fulfilled',
    requires42CFR: false, receivedDate: '2026-07-16',
    auditLog: [
      { date: '2026-07-14', action: 'Consent signed; faxed to Dr. Kim office (301-XXX-XXXX)', user: 'Jessica Torres, RN' },
      { date: '2026-07-16', action: 'Records received — 8 pages; uploaded to patient chart', user: 'Medical Records (Admin)' },
    ],
  },
  {
    id: 'ROI-006', patientId: 'p7', type: 'Outgoing',
    recipientOrSender: 'Linda Patel (wife / authorized family member)',
    recipientType: 'Family Member',
    recordTypes: ['Progress Notes', 'Treatment Plan'],
    purposeOfDisclosure: 'Family education and support — patient consented family involvement in treatment',
    requestDate: '2026-07-17', expiryDate: '2026-10-17', status: 'Active',
    requires42CFR: true,
    auditLog: [
      { date: '2026-07-17', action: 'Limited ROI signed — specific to treatment summary only, NOT raw notes', user: 'Sarah Jenkins, LPC' },
      { date: '2026-07-18', action: 'Treatment summary letter generated and mailed per patient preference', user: 'Medical Records (Admin)' },
    ],
  },
];

const STATUS_STYLE: Record<ROIStatus, string> = {
  'Pending':   'bg-amber-100 text-amber-700',
  'Active':    'bg-green-100 text-green-700',
  'Expired':   'bg-gray-100 text-gray-500',
  'Revoked':   'bg-red-100 text-red-700',
  'Fulfilled': 'bg-blue-100 text-blue-700',
  'Denied':    'bg-red-200 text-red-800',
};

export function MedicalRecords({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'ROI Queue' | 'New Request' | 'Audit Log' | '42 CFR Guide' | 'Record Stats' | 'HIPAA Reference'>('ROI Queue');
  const [expandedROI, setExpandedROI] = useState<string | null>('ROI-001');
  const [filterStatus, setFilterStatus] = useState<ROIStatus | 'All'>('All');

  const active42CFR = ROI_REQUESTS.filter(r => r.requires42CFR && r.status === 'Active').length;
  const pendingRequests = ROI_REQUESTS.filter(r => r.status === 'Pending').length;

  const filteredROI = filterStatus === 'All' ? ROI_REQUESTS : ROI_REQUESTS.filter(r => r.status === filterStatus);

  const allAuditEvents = ROI_REQUESTS.flatMap(r => r.auditLog.map(e => ({
    ...e, roiId: r.id, patientId: r.patientId, roi: r,
  }))).sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Medical Records & ROI</h1>
          <p className="text-slate text-sm mt-0.5">Release of Information · 42 CFR Part 2 compliance · Audit trail</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => !readOnly && setTab('New Request')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New ROI Request
        </LockedButton>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <strong>42 CFR Part 2 Active:</strong> {active42CFR} open authorizations involving substance use disorder records.
          Any disclosure requires patient-signed consent specifying recipient, purpose, and expiry. Unlike HIPAA, SUD records cannot be redisclosed without a new consent. Treatment-related requests only — insurance, legal, and non-treatment entities require clinical director review.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total ROI Files', value: ROI_REQUESTS.length, sub: 'In 90-day window', color: 'text-navy' },
          { label: 'Pending Fulfillment', value: pendingRequests, sub: 'Awaiting records', color: pendingRequests > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: '42 CFR Active', value: active42CFR, sub: 'SUD records with consent', color: 'text-navy' },
          { label: 'Denied Requests', value: ROI_REQUESTS.filter(r=>r.status==='Denied').length, sub: '42 CFR violations prevented', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['ROI Queue', 'New Request', 'Audit Log', '42 CFR Guide', 'Record Stats', 'HIPAA Reference'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'ROI Queue' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Pending', 'Active', 'Fulfilled', 'Denied', 'Expired', 'Revoked'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-navy text-white border-navy' : 'border-border text-slate hover:border-navy'}`}>{s}</button>
            ))}
          </div>
          {filteredROI.map(roi => {
            const p = MOCK_PATIENTS.find(pt => pt.id === roi.patientId);
            const isExpanded = expandedROI === roi.id;
            return (
              <div key={roi.id} className={`border rounded-xl overflow-hidden ${roi.status === 'Denied' ? 'border-red-300' : roi.status === 'Pending' ? 'border-amber-300' : 'border-border'}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedROI(isExpanded ? null : roi.id)}>
                  <div className={`p-2 rounded-lg ${roi.status === 'Active' ? 'bg-green-100' : roi.status === 'Denied' ? 'bg-red-100' : roi.status === 'Pending' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    {roi.status === 'Denied' ? <XCircle className="w-4 h-4 text-red-600" /> : roi.status === 'Fulfilled' ? <CheckCircle className="w-4 h-4 text-blue-600" /> : <FileText className={`w-4 h-4 ${roi.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button className="font-semibold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); p && navigate('PatientDetail', p.id); }}>{p?.firstName} {p?.lastName}</button>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[roi.status]}`}>{roi.status}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${roi.type === 'Outgoing' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{roi.type}</span>
                      {roi.requires42CFR && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="w-2.5 h-2.5" />42 CFR</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">{roi.recipientOrSender} · {roi.purposeOfDisclosure}</div>
                  </div>
                  <div className="text-right text-xs text-slate">
                    <div>Requested: {roi.requestDate}</div>
                    <div>Expires: {roi.expiryDate}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate ml-1" /> : <ChevronDown className="w-4 h-4 text-slate ml-1" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-white grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Records Authorized</div>
                        <div className="flex flex-wrap gap-1">
                          {roi.recordTypes.map(rt => (
                            <span key={rt} className={`text-[10px] px-2 py-0.5 rounded-full border ${rt.includes('42 CFR') ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-slate border-gray-200'}`}>{rt}</span>
                          ))}
                        </div>
                      </div>
                      {roi.status === 'Denied' && roi.denialReason && (
                        <div>
                          <div className="text-xs font-semibold text-red-700 uppercase mb-1">Denial Reason</div>
                          <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg leading-relaxed">{roi.denialReason}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate uppercase mb-2">Audit Log</div>
                      <div className="space-y-2">
                        {roi.auditLog.map((entry, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="text-slate shrink-0">{entry.date}</span>
                            <div><div className="text-navy">{entry.action}</div><div className="text-slate">{entry.user}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'New Request' && (
        <div className="max-w-2xl space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">New Release of Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Direction *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Outgoing (We send records)</option>
                  <option>Incoming (We receive records)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Recipient Type *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Primary Care Physician','Psychiatrist','Insurance/Payer','Attorney','Court/Legal','Family Member','Other Treatment Facility','Patient Self'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate mb-1">Recipient Name / Organization *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Dr. Jane Smith, MD — Cool Springs Medical" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate mb-1">Purpose of Disclosure *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Coordination of care — primary care follow-up" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Request Date</label>
                <input type="date" defaultValue="2026-07-19" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Expiry Date</label>
                <input type="date" defaultValue="2027-01-19" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate mb-2">Record Types *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Medical Records','Progress Notes','Discharge Summary','Lab Results','Treatment Plan','Psychiatric Records','Substance Abuse Records (42 CFR)'] as RecordType[]).map(rt => (
                    <label key={rt} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="accent-orange" />
                      <span className={rt.includes('42 CFR') ? 'text-amber-700 font-semibold' : 'text-navy'}>{rt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>If "Substance Abuse Records (42 CFR)" is selected, a 42 CFR-compliant Notice to Accompany will be automatically generated with the records. Consent must specify this is an addiction treatment record per 42 CFR Part 2.</span>
            </div>
            <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-sm px-5 py-2">Create ROI Request</LockedButton>
          </div>
        </div>
      )}

      {tab === 'Audit Log' && (
        <div className="space-y-2">
          <div className="text-xs text-slate mb-1">All ROI activity — sorted by most recent</div>
          {allAuditEvents.map((entry, i) => {
            const p = MOCK_PATIENTS.find(pt => pt.id === entry.patientId);
            return (
              <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-gray-50">
                <Eye className="w-4 h-4 text-slate shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{entry.action}</span>
                    {entry.roi.requires42CFR && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">42 CFR</span>}
                  </div>
                  <div className="text-slate mt-0.5">{entry.date} · {entry.user} · Patient: {p?.firstName} {p?.lastName} · {entry.roiId}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === '42 CFR Guide' && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-amber-700" />
              <h3 className="font-bold text-amber-900">42 CFR Part 2 — Substance Abuse Confidentiality Regulations</h3>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Federal law (42 CFR Part 2) protects the confidentiality of substance use disorder (SUD) patient records held by programs that receive federal assistance. These protections are stronger than HIPAA — SUD records cannot be shared without explicit written consent specifying the recipient, purpose, and expiry. Violations are a federal crime.
            </p>
          </div>
          {[
            {
              title: 'What requires 42 CFR consent?',
              items: ['Any disclosure of patient identity, diagnosis, prognosis, or treatment for SUD', 'Progress notes that mention substance use or addiction treatment', 'MAT (Suboxone, Methadone, Naltrexone) prescription records', 'Drug test results ordered as part of SUD treatment', 'Treatment plans that reference SUD as a diagnosis'],
            },
            {
              title: 'What does NOT require 42 CFR consent?',
              items: ['Medical emergency (imminent danger to life — document)', 'Court order (still requires judicial procedure — not a subpoena alone)', 'Research under strict confidentiality protections (IRB oversight)', 'Audit or evaluation by oversight agencies', 'Communications within the program (internal staff, same program)', 'De-identified data (no patient identifiers)'],
            },
            {
              title: 'Required elements of a valid 42 CFR consent:',
              items: ['Name and specific address of the program making the disclosure', 'Name of the individual or organization to receive the disclosure', 'Name of the patient', 'The specific purpose of or need for the disclosure', 'How much and what kind of information is to be disclosed', 'Signed by the patient (and a guardian if applicable)', 'Date the consent is signed', 'Statement that the consent may be revoked at any time', 'Date, event, or condition upon which consent expires'],
            },
            {
              title: 'Notice to Accompany (required with each disclosure):',
              items: ['"This information has been disclosed to you from records protected by Federal law (42 C.F.R. Part 2). Federal rules prohibit you from making any further disclosure of information in this record that identifies a patient as having or having had a substance use disorder either directly, by reference to publicly available information, or through verification of such identification by another person unless further disclosure is expressly permitted by the written consent of the individual whose information is being disclosed or as otherwise permitted by 42 C.F.R. Part 2. A general authorization for the release of medical or other information is NOT sufficient for this purpose. The Federal rules restrict any use of the information to criminally investigate or prosecute any alcohol or drug abuse patient."'],
            },
          ].map(section => (
            <div key={section.title} className="card">
              <h4 className="font-semibold text-navy mb-3">{section.title}</h4>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-navy flex items-start gap-2">
                    <span className="text-orange shrink-0 font-bold">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'Record Stats' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Medical records department metrics — ROI volume, processing time, compliance rates, and 42 CFR adherence indicators.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total ROIs (30d)', value: 48, color: 'text-navy', sub: '↑ 14% vs prior month' },
              { label: 'Avg Processing Time', value: '2.3d', color: 'text-blue-600', sub: 'Target: ≤5 business days' },
              { label: '42 CFR Compliance', value: '100%', color: 'text-green-600', sub: 'All disclosures tracked' },
              { label: 'Pending > 5 Days', value: 1, color: 'text-amber-600', sub: 'Flagged for follow-up' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">ROI Volume by Request Type</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { type: 'Continuing Care / Other Tx Provider', count: 18, pct: 38, color: 'bg-blue-500' },
                  { type: 'Patient Self-Request', count: 12, pct: 25, color: 'bg-teal-500' },
                  { type: 'Insurance / Prior Authorization', count: 9, pct: 19, color: 'bg-purple-500' },
                  { type: 'Legal / Court Order', count: 6, pct: 13, color: 'bg-amber-500' },
                  { type: 'Other (Research / Academic)', count: 3, pct: 6, color: 'bg-gray-400' },
                ].map(r => (
                  <div key={r.type}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{r.type}</span>
                      <span className="font-semibold text-navy">{r.count} ({r.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct * 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">42 CFR Part 2 Disclosure Log — This Month</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Category</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Disclosures</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Consent on File</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { cat: 'Authorized Tx Provider', count: 18, consent: '100%', ok: true },
                    { cat: 'Patient Self-Authorized', count: 12, consent: '100%', ok: true },
                    { cat: 'Insurance (w/ patient consent)', count: 9, consent: '100%', ok: true },
                    { cat: 'Court Order (judicial mandate)', count: 6, consent: 'Court order', ok: true },
                    { cat: 'Medical Emergency Exception', count: 1, consent: 'Documented', ok: true },
                    { cat: 'Research / Academic', count: 3, consent: '100%', ok: true },
                  ].map(r => (
                    <tr key={r.cat} className="hover:bg-gray-50">
                      <td className="py-2 text-navy font-medium">{r.cat}</td>
                      <td className="py-2 text-center text-slate">{r.count}</td>
                      <td className="py-2 text-center text-slate">{r.consent}</td>
                      <td className="py-2 text-center">
                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Compliant</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'HIPAA Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">HIPAA Privacy Rule and 42 CFR Part 2 quick reference — staff training aid covering permitted disclosures, patient rights, breach notification, and SUD-specific confidentiality rules.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">HIPAA — Permitted Disclosures Without Authorization</h3>
              <div className="space-y-2 text-xs">
                {[
                  { perm: 'Treatment, Payment, and Operations (TPO)', detail: 'Sharing PHI with providers involved in patient care, payers for billing, and internal operations (QI, training, audits).' },
                  { perm: 'Imminent Danger to Self or Others', detail: 'Disclosure to law enforcement or emergency services when a patient poses a credible, imminent threat. Document the basis.' },
                  { perm: 'Mandatory Reporting — Child Abuse/Neglect', detail: 'Maryland mandatory reporters (all clinical staff) must report suspected child abuse/neglect to DCS regardless of confidentiality.' },
                  { perm: 'Public Health Activities', detail: 'Disclosures to public health agencies for disease surveillance, vital statistics (birth/death), and reportable communicable diseases.' },
                  { perm: 'Coroner / Medical Examiner', detail: 'PHI may be disclosed to coroners for death investigation without patient authorization.' },
                  { perm: 'Law Enforcement (limited)', detail: 'Limited info to locate missing persons, identify suspects (by description), or respond to court order. Note: 42 CFR Part 2 restrictions apply to SUD records.' },
                ].map(d => (
                  <div key={d.perm} className="border border-border rounded-lg p-2.5">
                    <div className="font-semibold text-navy mb-0.5">{d.perm}</div>
                    <div className="text-slate">{d.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">42 CFR Part 2 — SUD Records (Stricter Than HIPAA)</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 font-medium">42 CFR Part 2 applies to all Sunrise patient records because we are a federally assisted SUD program.</div>
                  {[
                    { rule: 'General rule', detail: 'No disclosure without written patient consent (Form 2.31 or equivalent) — even to other treating providers unless consent covers them.' },
                    { rule: 'Court order exception', detail: 'Court subpoena alone is NOT sufficient — requires a separate court order specifically authorizing disclosure of SUD records.' },
                    { rule: 'Criminal proceedings', detail: 'SUD records CANNOT be used as evidence in any criminal proceeding against the patient without a 42 CFR–compliant court order.' },
                    { rule: 'Medical emergency', detail: 'Disclosure permitted to medical personnel to treat immediate medical emergency — document basis and notify patient.' },
                    { rule: '2020 CARES Act update', detail: 'Permitted 42 CFR records to be shared with other treating providers under a valid patient consent for integrated care, aligning more closely with HIPAA TPO.' },
                  ].map(r => (
                    <div key={r.rule} className="flex gap-2 text-xs">
                      <span className="font-bold text-amber-700 shrink-0 min-w-[120px]">{r.rule}:</span>
                      <span className="text-navy">{r.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Breach Notification Requirements</h3>
                <div className="space-y-1.5 text-xs text-navy">
                  <div><span className="font-bold text-slate">Individual notification:</span> Within 60 days of breach discovery</div>
                  <div><span className="font-bold text-slate">HHS notification:</span> Within 60 days (same 60-day rule)</div>
                  <div><span className="font-bold text-slate">Media notification:</span> Required if breach affects ≥500 residents of a state/jurisdiction</div>
                  <div><span className="font-bold text-slate">Sunrise Privacy Officer:</span> Notify immediately upon discovery — do not delay pending investigation</div>
                  <div><span className="font-bold text-slate">Document:</span> What happened, date of breach, what PHI was involved, who was affected, steps taken</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

