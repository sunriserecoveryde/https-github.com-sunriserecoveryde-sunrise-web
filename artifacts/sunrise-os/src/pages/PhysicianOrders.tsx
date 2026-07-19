import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, Plus, X, ChevronDown } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';
import { getRolesWithEditAccess } from '../data/mockRoles';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type OrderType = 'Medication' | 'Lab' | 'Consult' | 'Vital Signs' | 'MAT' | 'Radiology' | 'Nursing';
type OrderStatus = 'Pending Signature' | 'Active' | 'Completed' | 'Discontinued' | 'On Hold';
type OrderPriority = 'STAT' | 'Urgent' | 'Routine';

interface Order {
  id: string;
  patientId: string;
  type: OrderType;
  order: string;
  details: string;
  priority: OrderPriority;
  status: OrderStatus;
  orderedBy: string;
  orderedDate: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  lastUpdated: string;
  notes?: string;
}

const ORDERS: Order[] = [
  { id: 'ORD-001', patientId: 'p1', type: 'MAT', order: 'Suboxone 16mg PO QD', details: 'Buprenorphine/Naloxone 16mg sublingual daily. Observe administration.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-01', frequency: 'QD (Daily)', lastUpdated: '2026-07-01', notes: 'Stable on dose. Review at next clinical rounds.' },
  { id: 'ORD-002', patientId: 'p1', type: 'Lab', order: 'Buprenorphine Level', details: 'Serum buprenorphine trough level. Draw 1 hour before morning dose.', priority: 'Routine', status: 'Completed', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-12', startDate: '2026-07-12', lastUpdated: '2026-07-13', notes: 'Result: 3.2 ng/mL — therapeutic range.' },
  { id: 'ORD-003', patientId: 'p3', type: 'Vital Signs', order: 'COWS Q4H', details: 'Clinical Opiate Withdrawal Scale every 4 hours. Notify physician if score ≥13.', priority: 'Urgent', status: 'Active', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-18', frequency: 'Q4H', lastUpdated: '2026-07-19', notes: 'Last score 9 at 6:00 AM.' },
  { id: 'ORD-004', patientId: 'p3', type: 'MAT', order: 'Suboxone 24mg PO QD', details: 'Buprenorphine/Naloxone 24mg sublingual daily. Up-titrated from 16mg.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-15', frequency: 'QD', lastUpdated: '2026-07-15' },
  { id: 'ORD-005', patientId: 'p9', type: 'Consult', order: 'Psychiatry Consult — Daily Check-In', details: 'Daily psychiatric evaluation for substance-induced psychosis monitoring. Dr. Allen Hughes.', priority: 'Urgent', status: 'Active', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-10', frequency: 'Daily', lastUpdated: '2026-07-18' },
  { id: 'ORD-006', patientId: 'p9', type: 'Medication', order: 'Risperdal 0.5mg PO PRN', details: 'Risperidone 0.5mg PRN agitation. Hold if BP <90/60. Max 2mg/24 hours.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Allen Hughes', orderedDate: '2026-07-16', frequency: 'PRN', lastUpdated: '2026-07-16' },
  { id: 'ORD-007', patientId: 'p11', type: 'Consult', order: 'GI Consult — Hepatitis C Evaluation', details: 'Hepatitis C genotyping and Harvoni eligibility evaluation. Patient initiated consent.', priority: 'Routine', status: 'Pending Signature', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-18', lastUpdated: '2026-07-18', notes: 'Awaiting Dr. Chen final signature before submission.' },
  { id: 'ORD-008', patientId: 'p13', type: 'Lab', order: 'CMP + CBC + LFTs', details: 'Comprehensive metabolic panel, CBC with differential, liver function tests. Monitor for hepatotoxicity on Acamprosate.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Emily Stone', orderedDate: '2026-07-07', frequency: 'Weekly x4', lastUpdated: '2026-07-14' },
  { id: 'ORD-009', patientId: 'p13', type: 'Vital Signs', order: 'BP/HR Q shift', details: 'Blood pressure and heart rate every shift. Hypertension management — hold evening Librium if SBP >180.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Emily Stone', orderedDate: '2026-07-01', frequency: 'Q8H', lastUpdated: '2026-07-01' },
  { id: 'ORD-010', patientId: 'p14', type: 'Lab', order: 'Lithium Level', details: 'Serum lithium level. Target therapeutic range 0.6–1.2 mEq/L. Draw AM pre-dose.', priority: 'Routine', status: 'Completed', orderedBy: 'Dr. Allen Hughes', orderedDate: '2026-07-14', lastUpdated: '2026-07-15', notes: 'Result: 0.7 mEq/L — therapeutic.' },
  { id: 'ORD-011', patientId: 'p17', type: 'MAT', order: 'Suboxone 8mg PO QD', details: 'Buprenorphine/Naloxone 8mg daily. Day 7 induction. Titrate up per COWS response.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-12', frequency: 'QD', lastUpdated: '2026-07-12' },
  { id: 'ORD-012', patientId: 'p18', type: 'Consult', order: 'PT Evaluation — Fall Risk', details: 'Physical therapy gait assessment post-fall. Determine need for assist device and strengthening program.', priority: 'Urgent', status: 'Completed', orderedBy: 'Dr. Emily Stone', orderedDate: '2026-07-14', lastUpdated: '2026-07-15', notes: 'PT completed. Gait training initiated. No device needed.' },
  { id: 'ORD-013', patientId: 'p18', type: 'Vital Signs', order: 'O2 Sat Monitoring QD', details: 'Daily oxygen saturation monitoring given COPD history. Notify if O2 sat <92%.', priority: 'Routine', status: 'Active', orderedBy: 'Dr. Emily Stone', orderedDate: '2026-07-10', frequency: 'QD', lastUpdated: '2026-07-10' },
  { id: 'ORD-014', patientId: 'p9', type: 'Nursing', order: '30-Minute Safety Checks', details: 'Document q30min behavioral observation for paranoid ideation monitoring. Use standardized behavioral checklist.', priority: 'Urgent', status: 'Active', orderedBy: 'Dr. Allen Hughes', orderedDate: '2026-07-16', frequency: 'Q30min', lastUpdated: '2026-07-16' },
  { id: 'ORD-015', patientId: 'p3', type: 'Lab', order: 'Hepatitis Panel + HIV Screen', details: 'Hepatitis A, B, C antibodies and HIV 4th gen combo assay. Standard admission screening for IVDU history.', priority: 'Routine', status: 'Pending Signature', orderedBy: 'Dr. Robert Chen', orderedDate: '2026-07-19', lastUpdated: '2026-07-19', notes: 'Awaiting physician signature.' },
];

const TYPE_STYLE: Record<OrderType, string> = {
  Medication:    'bg-blue-100 text-blue-700',
  Lab:           'bg-purple-100 text-purple-700',
  Consult:       'bg-teal-100 text-teal-700',
  'Vital Signs': 'bg-green-100 text-green-700',
  MAT:           'bg-orange-100 text-orange-700',
  Radiology:     'bg-gray-100 text-gray-600',
  Nursing:       'bg-pink-100 text-pink-700',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  'Pending Signature': 'bg-amber-100 text-amber-700',
  'Active':            'bg-green-100 text-green-700',
  'Completed':         'bg-gray-100 text-gray-500',
  'Discontinued':      'bg-red-100 text-red-700',
  'On Hold':           'bg-blue-100 text-blue-700',
};

const PRIORITY_STYLE: Record<OrderPriority, string> = {
  STAT:    'text-red-700 bg-red-100',
  Urgent:  'text-amber-700 bg-amber-100',
  Routine: 'text-gray-600 bg-gray-100',
};

export function PhysicianOrders({ navigate, readOnly }: Props) {
  const editRoles = getRolesWithEditAccess('PhysicianOrders');
  const [tab, setTab] = useState<'Active' | 'Pending' | 'History' | 'New Order' | 'Standing Orders' | 'Order Analytics' | 'Lab Reference'>('Active');
  const [filterType, setFilterType] = useState<OrderType | 'All'>('All');
  const [filterPatient, setFilterPatient] = useState('all');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const pending = ORDERS.filter(o => o.status === 'Pending Signature');
  const active = ORDERS.filter(o => o.status === 'Active');
  const history = ORDERS.filter(o => o.status === 'Completed' || o.status === 'Discontinued');

  const currentTab = tab === 'Active' ? active : tab === 'Pending' ? pending : history;

  const filtered = currentTab.filter(o =>
    (filterType === 'All' || o.type === filterType) &&
    (filterPatient === 'all' || o.patientId === filterPatient)
  );

  const orderTypes: OrderType[] = ['Medication', 'Lab', 'Consult', 'Vital Signs', 'MAT', 'Radiology', 'Nursing'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Physician Orders</h1>
          <p className="text-slate text-sm mt-0.5">Active orders, pending signatures, medication and lab management</p>
        </div>
        <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => setTab('New Order')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Order
        </LockedButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Orders', value: active.length, sub: 'Currently in effect', color: 'text-navy' },
          { label: 'Pending Signature', value: pending.length, sub: 'Require physician sign', color: pending.length > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: 'STAT / Urgent', value: ORDERS.filter(o => o.priority !== 'Routine' && o.status === 'Active').length, sub: 'Priority orders active', color: 'text-red-600' },
          { label: 'Patients with Orders', value: new Set(active.map(o => o.patientId)).size, sub: 'Active order coverage', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800"><strong>{pending.length} order{pending.length !== 1 ? 's' : ''} require physician signature.</strong> Review and sign to activate. Unsigned orders cannot be executed by nursing.</span>
          <button onClick={() => setTab('Pending')} className="ml-auto text-sm text-amber-700 font-semibold hover:underline shrink-0">Review Now</button>
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(['Active', 'Pending', 'History', 'New Order', 'Standing Orders', 'Order Analytics', 'Lab Reference'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>
            {t}
            {t === 'Pending' && pending.length > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5">{pending.length}</span>}
          </button>
        ))}
      </div>

      {(tab === 'Active' || tab === 'Pending' || tab === 'History') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value as OrderType | 'All')} className="border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="All">All Types</option>
              {orderTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Patients</option>
              {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <span className="text-xs text-slate ml-auto">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2">
            {filtered.map(order => {
              const p = MOCK_PATIENTS.find(pt => pt.id === order.patientId);
              return (
                <div key={order.id} className={`card p-4 ${order.status === 'Pending Signature' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {order.status === 'Active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {order.status === 'Pending Signature' && <Clock className="w-4 h-4 text-amber-500" />}
                        {order.status === 'Completed' && <CheckCircle className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-slate">{order.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[order.type]}`}>{order.type}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[order.priority]}`}>{order.priority}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                        </div>
                        <div className="font-semibold text-navy text-sm mt-1">{order.order}</div>
                        <div className="text-xs text-slate mt-0.5">{order.details}</div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate">
                          <span>Patient: <button className="text-orange hover:underline font-medium" onClick={() => navigate('PatientDetail', order.patientId)}>{p?.firstName} {p?.lastName} ({p?.program})</button></span>
                          <span>Ordered by: <span className="text-navy font-medium">{order.orderedBy}</span></span>
                          <span>Date: {order.orderedDate}</span>
                          {order.frequency && <span>Frequency: <span className="text-navy font-medium">{order.frequency}</span></span>}
                        </div>
                        {order.notes && <div className="text-xs text-slate italic mt-1">{order.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'Pending Signature' && (
                        <>
                          <LockedButton locked={readOnly} editRoles={editRoles} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-600">Sign Order</LockedButton>
                          <LockedButton locked={readOnly} editRoles={editRoles} className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">Reject</LockedButton>
                        </>
                      )}
                      {order.status === 'Active' && (
                        <>
                          <LockedButton locked={readOnly} editRoles={editRoles} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Modify</LockedButton>
                          <LockedButton locked={readOnly} editRoles={editRoles} className="text-xs border border-red-200 text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50"><X className="w-3.5 h-3.5" /></LockedButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate text-sm">No orders in this category.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'New Order' && !orderSubmitted && (
        <div className="max-w-2xl">
          <div className="card space-y-5">
            <div>
              <h2 className="font-bold text-navy">Place New Order</h2>
              <p className="text-sm text-slate mt-0.5">Medication, lab, consult, or nursing order.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id}>{p.firstName} {p.lastName} — {p.program}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Order Type *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {orderTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Order Name / Medication *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Suboxone 8mg PO QD — or — CBC with Differential" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Detailed Instructions *</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Route, dose, frequency, special instructions, hold parameters, monitoring requirements..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Priority</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Routine</option><option>Urgent</option><option>STAT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Ordering Physician</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Dr. Robert Chen</option><option>Dr. Emily Stone</option><option>Dr. Allen Hughes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Frequency</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['QD (Daily)', 'BID (Twice Daily)', 'TID (Three Times Daily)', 'QID (Four Times Daily)', 'Q4H', 'Q6H', 'Q8H', 'Q12H', 'Q30min', 'PRN (As Needed)', 'Weekly', 'Monthly', 'One-Time', 'Continuous'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">End Date / Duration</label>
                <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Clinical Notes / Rationale</label>
              <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Clinical indication, monitoring parameters, special considerations..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab('Active')} className="border border-border rounded-lg px-5 py-2 text-sm text-slate">Cancel</button>
              <LockedButton locked={readOnly} editRoles={editRoles} onClick={() => setOrderSubmitted(true)} className="btn-primary text-sm px-5 py-2">Place Order</LockedButton>
            </div>
          </div>
        </div>
      )}
      {tab === 'New Order' && orderSubmitted && (
        <div className="max-w-md">
          <div className="card text-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-navy">Order Placed</h2>
            <p className="text-slate text-sm mt-2">The order has been entered and is pending physician signature where required.</p>
            <button onClick={() => { setOrderSubmitted(false); setTab('Active'); }} className="btn-primary text-sm px-6 py-2 mt-5">Back to Orders</button>
          </div>
        </div>
      )}

      {tab === 'Standing Orders' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Pre-approved standing orders active for the current census. Standing orders reduce call volume and allow nursing to respond promptly to predictable clinical needs without individual physician contact.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Standing Orders', value: 8, sub: 'Facility-wide protocols', color: 'text-navy' },
              { label: 'Uses This Month', value: 47, sub: 'Nurse-initiated without call', color: 'text-blue-600' },
              { label: 'Physician Calls Avoided', value: 47, sub: 'Est. 2.3h call time saved', color: 'text-green-600' },
              { label: 'Adverse Events', value: 0, sub: 'Related to standing orders', color: 'text-green-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[
              {
                name: 'CIWA-Ar Alcohol Withdrawal — Symptom-Triggered Protocol',
                authorized: 'Dr. Robert Chen, MD',
                effectiveDate: '2026-01-01',
                reviewDate: '2026-12-31',
                eligibility: 'Patients admitted with AUD diagnosis and CIWA-Ar monitoring ordered',
                orders: [
                  'CIWA-Ar assessment q4h while awake; q8h if score < 8 × 24h',
                  'Chlordiazepoxide (Librium) 50mg PO if CIWA ≥ 8–14; repeat q1h PRN; max 300mg/24h',
                  'Chlordiazepoxide 100mg PO if CIWA ≥ 15–20; notify physician',
                  'CIWA ≥ 21: IMMEDIATE physician notification; initiate IV access',
                  'Thiamine 100mg PO/IM daily × 3 days (on admission)',
                  'Folic acid 1mg PO daily',
                  'MVI daily',
                  'Vital signs q4h during active withdrawal; O2 saturation PRN',
                ],
                color: 'border-blue-200',
              },
              {
                name: 'COWS Opioid Withdrawal — Comfort Measures Protocol',
                authorized: 'Dr. Robert Chen, MD',
                effectiveDate: '2026-01-01',
                reviewDate: '2026-12-31',
                eligibility: 'Patients on COWS monitoring for OWS not yet on buprenorphine induction',
                orders: [
                  'COWS assessment q4h; q8h if score < 5 × 24h',
                  'Clonidine 0.1mg PO q6h PRN for COWS ≥ 5 (hold if SBP < 90)',
                  'Loperamide 4mg PO × 1 dose PRN diarrhea; max 16mg/24h',
                  'Ondansetron 4mg ODT q6h PRN for nausea/vomiting',
                  'Ibuprofen 400mg PO q6h PRN for myalgias (if no contraindication)',
                  'Hydroxyzine 25–50mg PO q6h PRN for anxiety/insomnia',
                  'Vital signs q4h; COWS ≥ 25: notify physician immediately',
                ],
                color: 'border-purple-200',
              },
              {
                name: 'General Detox Comfort — Symptomatic Relief Protocol',
                authorized: 'Dr. Emily Stone, MD',
                effectiveDate: '2026-03-01',
                reviewDate: '2026-12-31',
                eligibility: 'All residential detox patients unless contraindicated in admission orders',
                orders: [
                  'Acetaminophen 650mg PO q4h PRN for pain / fever (max 3g/24h)',
                  'Maalox 30mL PO PRN for GI upset (not to exceed q4h)',
                  'Melatonin 3–5mg PO QHS PRN insomnia (non-benzo)',
                  'Ice pack / heating pad PRN for musculoskeletal comfort',
                  'Oral hydration encouraged; IV fluids if PO intake < 500mL/shift',
                  'Vital signs BID at minimum; CIWA/COWS per separate protocol',
                ],
                color: 'border-green-200',
              },
              {
                name: 'Influenza-Like Illness (ILI) — Isolation & Symptomatic Protocol',
                authorized: 'Dr. Robert Chen, MD',
                effectiveDate: '2026-01-01',
                reviewDate: '2026-12-31',
                eligibility: 'Patient presenting with fever ≥ 100.4°F + cough or sore throat; no recent hospitalization in past 7 days',
                orders: [
                  'Contact + droplet precautions; isolate in single room',
                  'Mask patient when leaving room for any reason',
                  'Rapid influenza antigen test (RIFA) × 1',
                  'Acetaminophen 650mg PO q4h PRN fever (max 3g/24h)',
                  'Encourage PO fluids ≥ 2L/day',
                  'Notify physician if temp > 103°F, O2 sat < 94%, or respiratory distress',
                  'Roommate(s) if applicable: monitor for symptoms × 5 days',
                ],
                color: 'border-amber-200',
              },
            ].map(so => (
              <div key={so.name} className={`card border ${so.color}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-navy text-sm">{so.name}</h3>
                    <div className="text-xs text-slate mt-0.5">Authorized by {so.authorized} · Effective {so.effectiveDate} · Review by {so.reviewDate}</div>
                    <div className="text-xs text-slate mt-0.5">Eligibility: {so.eligibility}</div>
                  </div>
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">Active</span>
                </div>
                <div className="text-xs space-y-1">
                  {so.orders.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold text-orange shrink-0">{i + 1}.</span>
                      <span className="text-slate">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'Order Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Order volume, provider patterns, and compliance metrics for the trailing 30 days.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Orders (30d)', value: 284, color: 'text-navy', sub: '↑ 8% vs prior month' },
              { label: 'Lab Orders', value: 91, color: 'text-blue-600', sub: '32% of total' },
              { label: 'Medication Orders', value: 138, color: 'text-teal-600', sub: '49% of total' },
              { label: 'Unsigned > 24h', value: 3, color: 'text-red-600', sub: 'Requires attention' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Order Volume by Category</h3>
              <div className="space-y-2 text-xs">
                {[
                  { cat: 'Medications / MAT', count: 138, pct: 49, color: 'bg-teal-500' },
                  { cat: 'Laboratory', count: 91, pct: 32, color: 'bg-blue-500' },
                  { cat: 'Consult / Referral', count: 24, pct: 8, color: 'bg-purple-500' },
                  { cat: 'Nursing / Activity', count: 18, pct: 6, color: 'bg-orange-400' },
                  { cat: 'Diagnostic Imaging', count: 9, pct: 3, color: 'bg-gray-400' },
                  { cat: 'Dietary / Nutrition', count: 4, pct: 1, color: 'bg-green-400' },
                ].map(c => (
                  <div key={c.cat}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{c.cat}</span>
                      <span className="font-semibold text-navy">{c.count} ({c.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct * 1.5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Orders by Prescriber (30 Days)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Prescriber</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Orders</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Avg Sign Time</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Unsigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Dr. A. Okafor, MD', orders: 112, sign: '1.2h', unsigned: 1, ok: true },
                    { name: 'Dr. L. Hernandez, DO', orders: 89, sign: '2.8h', unsigned: 2, ok: false },
                    { name: 'Dr. S. Park, MD', orders: 54, sign: '0.9h', unsigned: 0, ok: true },
                    { name: 'NP J. Williams', orders: 29, sign: '1.5h', unsigned: 0, ok: true },
                  ].map(p => (
                    <tr key={p.name} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{p.name}</td>
                      <td className="py-2 text-center text-slate">{p.orders}</td>
                      <td className="py-2 text-center text-slate">{p.sign}</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${p.unsigned > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.unsigned}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Lab Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Commonly ordered laboratory tests in SUD treatment — reference ranges, turnaround times, and clinical interpretation guidance.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Standard Lab Panel Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Test', 'Normal Range', 'TAT', 'Why Ordered', 'Critical Value Action'].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { test: 'CMP (Comprehensive Metabolic Panel)', range: 'See individual values', tat: '4–6h', why: 'Baseline organ function, electrolytes, glucose, kidney/liver assessment', crit: 'K <3.0 or >6.0 mEq/L → physician stat; Na <125 or >155 → physician stat' },
                  { test: 'CBC with differential', range: 'WBC 4.5–11.0; HgB 12–17; PLT 150–400', tat: '4–6h', why: 'Infection screen, anemia, thrombocytopenia (alcohol-related)', crit: 'WBC >30 or <2 → physician stat; HgB <7 → physician stat' },
                  { test: 'Liver Function Tests (LFTs)', range: 'AST/ALT <40 U/L; T.bili <1.2 mg/dL', tat: '4–6h', why: 'Alcohol/hepatotoxic drug-related liver damage assessment, Suboxone baseline', crit: 'AST/ALT >3x ULN → physician review; >10x ULN → physician stat' },
                  { test: 'Lipase', range: '13–60 U/L', tat: '4–6h', why: 'Alcohol-related pancreatitis screen', crit: '>3x ULN with abdominal pain → physician stat' },
                  { test: 'Prothrombin Time / INR', range: 'PT 11–13s; INR <1.1', tat: '4–6h', why: 'Hepatic synthetic function, alcohol-related coagulopathy', crit: 'INR >3.0 not therapeutic → physician review' },
                  { test: 'Urine Drug Screen (GC-MS confirmation)', range: 'Negative', tat: '24–48h (confirm)', why: 'Treatment progress monitoring, PDMP correlation, MAT initiation baseline', crit: 'Unexpected fentanyl or adulterants → clinical team notification' },
                  { test: 'Hepatitis C Antibody (HCV Ab)', range: 'Non-reactive', tat: '4–6h', why: 'IVDU screening — offered to all opioid/stimulant use patients per CDC guidelines', crit: 'Reactive → GI/hepatology referral; confirm with reflex RNA' },
                  { test: 'HIV 1/2 Antigen/Antibody (4th Gen)', range: 'Non-reactive', tat: '4–6h', why: 'HIV screening offered to all patients per CDC universal testing guidelines', crit: 'Reactive → infectious disease referral, PDAP enrollment assistance' },
                  { test: 'TSH (Thyroid-Stimulating Hormone)', range: '0.5–5.0 mIU/L', tat: '4–6h', why: 'Mood disorder differential; hypothyroidism often mimics MDD in SUD population', crit: 'TSH >10 or <0.1 → physician review' },
                  { test: 'Serum Buprenorphine Level (LCMS)', range: 'Therapeutic: 1–10 ng/mL', tat: '24–72h (send-out)', why: 'Diversion concern, non-response at therapeutic doses, rapid metabolism', crit: 'Undetectable on therapeutic dose → diversion protocol' },
                ].map(r => (
                  <tr key={r.test} className="hover:bg-gray-50">
                    <td className="px-2 py-2 font-semibold text-navy text-[10px]">{r.test}</td>
                    <td className="px-2 py-2 text-slate text-[10px]">{r.range}</td>
                    <td className="px-2 py-2 text-center text-navy text-[10px]">{r.tat}</td>
                    <td className="px-2 py-2 text-slate text-[10px]">{r.why}</td>
                    <td className="px-2 py-2 text-red-700 font-medium text-[10px]">{r.crit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
