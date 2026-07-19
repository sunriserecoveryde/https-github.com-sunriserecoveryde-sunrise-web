import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Clock, AlertTriangle, Plus, X, ChevronDown } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

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
  const [tab, setTab] = useState<'Active' | 'Pending' | 'History' | 'New Order'>('Active');
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
        <LockedButton locked={readOnly} onClick={() => setTab('New Order')} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
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
        {(['Active', 'Pending', 'History', 'New Order'] as const).map(t => (
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
                          <LockedButton locked={readOnly} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-600">Sign Order</LockedButton>
                          <LockedButton locked={readOnly} className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">Reject</LockedButton>
                        </>
                      )}
                      {order.status === 'Active' && (
                        <>
                          <LockedButton locked={readOnly} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Modify</LockedButton>
                          <LockedButton locked={readOnly} className="text-xs border border-red-200 text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50"><X className="w-3.5 h-3.5" /></LockedButton>
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
              <LockedButton locked={readOnly} onClick={() => setOrderSubmitted(true)} className="btn-primary text-sm px-5 py-2">Place Order</LockedButton>
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
    </div>
  );
}
