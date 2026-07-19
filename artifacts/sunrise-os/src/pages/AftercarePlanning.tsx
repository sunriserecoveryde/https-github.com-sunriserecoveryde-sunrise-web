import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, Circle, Phone, MapPin, AlertTriangle, Plus, Calendar, Star } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  completed: boolean;
  dueBy?: string;
  assignedTo?: string;
  notes?: string;
}

interface FollowUpCall {
  type: '30-Day' | '60-Day' | '90-Day' | '6-Month';
  scheduledDate?: string;
  completedDate?: string;
  outcome?: 'Sober' | 'Relapse' | 'No Answer' | 'Hospitalized' | 'In Treatment';
  notes?: string;
}

interface AftercareRecord {
  patientId: string;
  targetDischargeDate: string;
  dischargeDestination?: string;
  dischargeType?: 'Completed' | 'AMA' | 'Step-Down' | 'Transfer';
  safetyPlan: boolean;
  naloxoneKitGiven: boolean;
  checklist: ChecklistItem[];
  followUpCalls: FollowUpCall[];
  recoveryHousing?: { name: string; address: string; phone: string; type: string; beds: number; waitlist: boolean };
  aaNaveen?: string;
  alumniEnrolled: boolean;
}

const AFTERCARE_DATA: AftercareRecord[] = [
  {
    patientId: 'p3',
    targetDischargeDate: '2026-08-01',
    safetyPlan: true, naloxoneKitGiven: true, alumniEnrolled: false,
    aaNaveen: 'Nashville AA — Monday 7PM, Brentwood NA — Thursday 8PM',
    checklist: [
      { id: 'c1', category: 'Housing', task: 'Confirm safe housing on discharge', completed: false, dueBy: '2026-07-26', assignedTo: 'Sarah Jenkins' },
      { id: 'c2', category: 'MAT', task: 'Suboxone prescription to discharge pharmacy', completed: false, dueBy: '2026-07-30', assignedTo: 'Dr. Robert Chen' },
      { id: 'c3', category: 'MAT', task: 'MOUD bridge appointment scheduled', completed: false, dueBy: '2026-07-28', assignedTo: 'Sarah Jenkins' },
      { id: 'c4', category: 'Medical', task: 'Hep C treatment referral to GI', completed: false, dueBy: '2026-07-25', assignedTo: 'Jessica Torres, RN' },
      { id: 'c5', category: 'Safety', task: 'Safety plan reviewed and signed', completed: true },
      { id: 'c6', category: 'Support', task: 'NA sponsor identified', completed: false, dueBy: '2026-07-28', assignedTo: 'Sarah Jenkins' },
      { id: 'c7', category: 'Naloxone', task: 'Narcan kit given + training completed', completed: true, notes: 'Patient trained 7/15. Family member also trained.' },
      { id: 'c8', category: 'Documentation', task: 'Discharge summary completed', completed: false, dueBy: '2026-08-01', assignedTo: 'Sarah Jenkins' },
    ],
    followUpCalls: [
      { type: '30-Day', scheduledDate: '2026-09-01' },
      { type: '60-Day', scheduledDate: '2026-10-01' },
      { type: '90-Day', scheduledDate: '2026-11-01' },
      { type: '6-Month', scheduledDate: '2027-02-01' },
    ],
    recoveryHousing: { name: 'Serenity House Nashville', address: '4201 Nolensville Pike, Nashville, TN', phone: '(615) 555-0211', type: 'Sober Living (Men)', beds: 12, waitlist: false },
  },
  {
    patientId: 'p1',
    targetDischargeDate: '2026-08-04',
    safetyPlan: true, naloxoneKitGiven: false, alumniEnrolled: false,
    aaNaveen: 'Green Hills NA — Tuesday 7PM, Franklin AA — Saturday 9AM',
    checklist: [
      { id: 'd1', category: 'Housing', task: 'Confirm return to family home (wife)', completed: true, notes: 'Wife confirmed 7/14 — safe to return.' },
      { id: 'd2', category: 'MAT', task: 'Suboxone prescription at community pharmacy', completed: false, dueBy: '2026-08-01', assignedTo: 'Dr. Robert Chen' },
      { id: 'd3', category: 'Safety', task: 'Firearm safety counseling', completed: true, notes: 'Patient agreed to secure firearms with family member during early recovery.' },
      { id: 'd4', category: 'Naloxone', task: 'Narcan kit given + family trained', completed: false, dueBy: '2026-07-25', assignedTo: 'Jessica Torres, RN', notes: 'Wife needs to be present for training.' },
      { id: 'd5', category: 'Support', task: 'AA homegroup identified', completed: false, dueBy: '2026-07-30', assignedTo: 'Sarah Jenkins' },
      { id: 'd6', category: 'Support', task: 'Sponsor contact obtained', completed: false },
      { id: 'd7', category: 'Employment', task: 'EAP referral provided', completed: true, notes: 'Referred to BlueCross EAP — counseling sessions authorized.' },
      { id: 'd8', category: 'Documentation', task: 'Discharge summary and med list', completed: false, dueBy: '2026-08-04' },
    ],
    followUpCalls: [
      { type: '30-Day', scheduledDate: '2026-09-04' },
      { type: '60-Day' },
      { type: '90-Day' },
      { type: '6-Month' },
    ],
    recoveryHousing: undefined,
  },
  {
    patientId: 'p4',
    targetDischargeDate: '2026-07-24',
    dischargeType: 'Completed', safetyPlan: false, naloxoneKitGiven: false, alumniEnrolled: true,
    aaNaveen: 'Brentwood AA — Sunday 10AM (home group)',
    checklist: [
      { id: 'e1', category: 'Housing', task: 'Confirm independent apartment (attorney arranged)', completed: true },
      { id: 'e2', category: 'MAT', task: 'Naltrexone oral continued — prescription at pharmacy', completed: true },
      { id: 'e3', category: 'Safety', task: 'Safety plan: NA sponsor is primary contact', completed: true },
      { id: 'e4', category: 'Legal', task: 'Provide court certificate of completion', completed: false, dueBy: '2026-07-24', assignedTo: 'Maria Gonzales' },
      { id: 'e5', category: 'Support', task: 'AA sponsor confirmed (David H.)', completed: true },
      { id: 'e6', category: 'Alumni', task: 'Enrolled in Sunrise Alumni Program', completed: true, notes: 'Enrolled 7/18. First alumni meeting 8/1.' },
      { id: 'e7', category: 'Documentation', task: 'Discharge summary — ALL signatures', completed: false, dueBy: '2026-07-24' },
    ],
    followUpCalls: [
      { type: '30-Day', scheduledDate: '2026-08-24', completedDate: undefined, outcome: undefined },
      { type: '60-Day' },
      { type: '90-Day' },
      { type: '6-Month' },
    ],
  },
];

const RECOVERY_HOUSING_DIRECTORY = [
  { name: 'Serenity House Nashville', address: '4201 Nolensville Pike', phone: '(615) 555-0211', type: 'Men\'s Sober Living', beds: 12, waitlist: false, rating: 4.5, cost: '$600/mo', affiliation: 'Oxford House affiliated' },
  { name: 'New Hope Women\'s Recovery', address: '714 W. Trinity Lane', phone: '(615) 555-0334', type: 'Women\'s Sober Living', beds: 8, waitlist: true, rating: 4.8, cost: '$550/mo', affiliation: 'NARR Level 3' },
  { name: 'Three Rivers Sober Living (Men)', address: '2200 Lebanon Pike, Donelson', phone: '(615) 555-0412', type: 'Men\'s Sober Living', beds: 16, waitlist: false, rating: 4.2, cost: '$700/mo', affiliation: 'Oxford House' },
  { name: 'Harmony House (Co-ed)', address: '910 Fern Ave, Franklin', phone: '(615) 555-0561', type: 'Co-ed Transitional Housing', beds: 20, waitlist: false, rating: 4.0, cost: '$500/mo', affiliation: 'State-certified' },
  { name: 'Cornerstone Recovery Homes', address: '1520 Charlotte Pike', phone: '(615) 555-0678', type: 'Men\'s Sober Living', beds: 10, waitlist: true, rating: 4.6, cost: '$650/mo', affiliation: 'CARF accredited' },
  { name: 'New Dawn Women\'s Housing', address: '405 Woodmont Blvd', phone: '(615) 555-0782', type: 'Women\'s Sober Living + MAT friendly', beds: 14, waitlist: false, rating: 4.7, cost: '$580/mo', affiliation: 'SAMHSA-certified' },
];

const CATEGORY_STYLE: Record<string, string> = {
  Housing:       'bg-blue-100 text-blue-700',
  MAT:           'bg-orange-100 text-orange-700',
  Medical:       'bg-red-100 text-red-700',
  Safety:        'bg-amber-100 text-amber-700',
  Naloxone:      'bg-purple-100 text-purple-700',
  Support:       'bg-green-100 text-green-700',
  Legal:         'bg-gray-100 text-gray-600',
  Documentation: 'bg-slate-100 text-slate-600',
  Employment:    'bg-teal-100 text-teal-700',
  Alumni:        'bg-pink-100 text-pink-700',
};

const FOLLOWUP_STYLE: Record<string, string> = {
  'Sober':        'bg-green-100 text-green-700',
  'Relapse':      'bg-red-100 text-red-700',
  'No Answer':    'bg-gray-100 text-gray-600',
  'Hospitalized': 'bg-red-200 text-red-800',
  'In Treatment': 'bg-blue-100 text-blue-700',
};

export function AftercarePlanning({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Discharge Plans' | 'Housing Directory' | 'Follow-up Tracker' | 'Community Resources' | 'Alumni Program' | 'Outcomes' | 'Peer Support Network'>('Discharge Plans');
  const [selectedPatient, setSelectedPatient] = useState<string>('p3');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set(['c5', 'c7', 'd1', 'd3', 'd7', 'e1', 'e2', 'e3', 'e5', 'e6']));

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const currentRecord = AFTERCARE_DATA.find(r => r.patientId === selectedPatient);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Aftercare Planning</h1>
          <p className="text-slate text-sm mt-0.5">Discharge checklists, recovery housing, follow-up calls, and alumni program</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => {}} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> New Discharge Plan</LockedButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Discharge Plans Active', value: AFTERCARE_DATA.length, sub: 'Patients with plans', color: 'text-navy' },
          { label: 'Discharges This Week', value: 2, sub: 'Planned: p4 (7/24), p3 (8/1)', color: 'text-navy' },
          { label: 'Follow-ups Pending', value: 8, sub: '30/60/90 day calls', color: 'text-amber-600' },
          { label: 'Alumni Enrolled', value: AFTERCARE_DATA.filter(r => r.alumniEnrolled).length, sub: 'Post-discharge program', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Discharge Plans', 'Housing Directory', 'Follow-up Tracker', 'Community Resources', 'Alumni Program', 'Outcomes', 'Peer Support Network'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Discharge Plans' && (
        <div className="flex gap-6">
          {/* Patient selector */}
          <div className="w-56 shrink-0 space-y-2">
            <div className="text-xs font-semibold text-slate uppercase mb-2">Patients with Plans</div>
            {AFTERCARE_DATA.map(r => {
              const p = MOCK_PATIENTS.find(pt => pt.id === r.patientId);
              if (!p) return null;
              const items = r.checklist;
              const done = items.filter(i => checkedItems.has(i.id)).length;
              return (
                <div
                  key={r.patientId}
                  onClick={() => setSelectedPatient(r.patientId)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedPatient === r.patientId ? 'bg-navy text-white border-navy' : 'bg-white border-border hover:border-orange'}`}
                >
                  <div className={`font-semibold text-sm ${selectedPatient === r.patientId ? 'text-white' : 'text-navy'}`}>{p.firstName} {p.lastName}</div>
                  <div className={`text-xs mt-0.5 ${selectedPatient === r.patientId ? 'text-white/70' : 'text-slate'}`}>{p.program}</div>
                  <div className={`text-xs mt-1.5 ${selectedPatient === r.patientId ? 'text-white/70' : 'text-slate'}`}>
                    Target: {r.targetDischargeDate}
                  </div>
                  <div className="mt-2">
                    <div className={`flex justify-between text-[10px] mb-0.5 ${selectedPatient === r.patientId ? 'text-white/70' : 'text-slate'}`}>
                      <span>Checklist</span>
                      <span>{done}/{items.length}</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 ${selectedPatient === r.patientId ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <div className={`h-1.5 rounded-full ${selectedPatient === r.patientId ? 'bg-white' : 'bg-green-500'}`} style={{ width: `${done/items.length*100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discharge plan detail */}
          {currentRecord && (() => {
            const p = MOCK_PATIENTS.find(pt => pt.id === currentRecord.patientId);
            if (!p) return null;
            const doneCount = currentRecord.checklist.filter(i => checkedItems.has(i.id)).length;
            const grouped = currentRecord.checklist.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {} as Record<string, typeof currentRecord.checklist>);

            return (
              <div className="flex-1 space-y-5">
                <div className="card bg-navy text-white py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <button className="text-lg font-bold hover:text-sunrise-amber" onClick={() => navigate('PatientDetail', p.id)}>
                          {p.firstName} {p.lastName}
                        </button>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{p.program}</span>
                        {currentRecord.alumniEnrolled && <span className="text-xs bg-sunrise-amber/20 text-sunrise-amber px-2 py-0.5 rounded-full border border-sunrise-amber/30">Alumni Enrolled</span>}
                      </div>
                      <div className="flex items-center gap-5 mt-1.5 text-sm">
                        <span className="text-white/70">Target Discharge: <span className="text-white font-semibold">{currentRecord.targetDischargeDate}</span></span>
                        {currentRecord.safetyPlan && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Safety Plan</span>}
                        {currentRecord.naloxoneKitGiven && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Narcan Kit Given</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-sunrise-amber">{doneCount}/{currentRecord.checklist.length}</div>
                      <div className="text-xs text-white/70">tasks complete</div>
                    </div>
                  </div>
                  {currentRecord.aaNaveen && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/70">
                      <span className="font-semibold">Support Meetings:</span> {currentRecord.aaNaveen}
                    </div>
                  )}
                </div>

                {/* Recovery Housing */}
                {currentRecord.recoveryHousing ? (
                  <div className="card border-green-200 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Recovery Housing — Confirmed</div>
                        <div className="font-bold text-navy">{currentRecord.recoveryHousing.name}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{currentRecord.recoveryHousing.address}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{currentRecord.recoveryHousing.phone}</span>
                        </div>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">{currentRecord.recoveryHousing.type}</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    </div>
                  </div>
                ) : (
                  <div className="card border-amber-200 bg-amber-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Recovery Housing — Not Yet Confirmed</div>
                        <div className="text-xs text-amber-700 mt-0.5">Identify sober living or family housing before discharge.</div>
                      </div>
                      <button onClick={() => setTab('Housing Directory')} className="text-xs border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium">Find Housing</button>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="card space-y-4">
                  <div className="font-semibold text-navy">Discharge Checklist</div>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-2 ${CATEGORY_STYLE[cat] ?? 'bg-gray-100 text-gray-600'}`}>{cat}</div>
                      <div className="space-y-2">
                        {items.map(item => {
                          const isDone = checkedItems.has(item.id) || item.completed;
                          return (
                            <div key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-border hover:border-orange/50'}`}>
                              <button onClick={() => !readOnly && toggleItem(item.id)} className="mt-0.5 shrink-0" disabled={readOnly}>
                                {isDone ? <CheckCircle className="w-4.5 h-4.5 text-green-500 w-5 h-5" /> : <Circle className="w-5 h-5 text-gray-300" />}
                              </button>
                              <div className="flex-1">
                                <div className={`text-sm ${isDone ? 'line-through text-slate' : 'text-navy font-medium'}`}>{item.task}</div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate">
                                  {item.dueBy && <span className={isDone ? '' : new Date(item.dueBy) < new Date() ? 'text-red-500 font-medium' : 'text-amber-600'}>Due: {item.dueBy}</span>}
                                  {item.assignedTo && <span>Assigned: {item.assignedTo}</span>}
                                </div>
                                {item.notes && <div className="text-xs text-slate italic mt-0.5">{item.notes}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Follow-up calls */}
                <div className="card">
                  <div className="font-semibold text-navy mb-3">Post-Discharge Follow-up Schedule</div>
                  <div className="grid grid-cols-4 gap-3">
                    {currentRecord.followUpCalls.map(call => (
                      <div key={call.type} className={`p-3 rounded-lg border ${call.completedDate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-border'}`}>
                        <div className="font-semibold text-navy text-sm">{call.type}</div>
                        {call.scheduledDate && <div className="text-xs text-slate mt-1"><Calendar className="w-3 h-3 inline mr-1" />{call.scheduledDate}</div>}
                        {call.completedDate && <div className="text-xs text-green-600 mt-0.5"><CheckCircle className="w-3 h-3 inline mr-1" />Completed {call.completedDate}</div>}
                        {call.outcome && <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-medium ${FOLLOWUP_STYLE[call.outcome]}`}>{call.outcome}</div>}
                        {!call.completedDate && !call.scheduledDate && <div className="text-xs text-slate mt-1 italic">Not scheduled</div>}
                        {!call.completedDate && call.scheduledDate && (
                          <button className="text-[10px] text-orange hover:underline mt-1 block">Log Call</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'Housing Directory' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Nashville / Middle Tennessee recovery housing directory — {RECOVERY_HOUSING_DIRECTORY.length} facilities</div>
          <div className="grid grid-cols-2 gap-4">
            {RECOVERY_HOUSING_DIRECTORY.map(h => (
              <div key={h.name} className={`card ${h.waitlist ? 'border-amber-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-navy">{h.name}</div>
                      {h.waitlist && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Waitlist</span>}
                      {!h.waitlist && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Available</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">{h.type}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{h.phone}</span>
                      <span>{h.beds} beds · {h.cost}</span>
                    </div>
                    <div className="text-[10px] text-slate mt-1 italic">{h.affiliation}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(h.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-slate ml-1">{h.rating}</span>
                    </div>
                    <button className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy/90">Refer Patient</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Follow-up Tracker' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>SAMHSA NOMs Requirement:</strong> 30-day post-discharge follow-up contact is a required National Outcome Measure for CARF accreditation. Target ≥75% contact rate.
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  {['Patient', 'Discharge Date', 'Destination', '30-Day', '60-Day', '90-Day', '6-Month', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AFTERCARE_DATA.map(r => {
                  const p = MOCK_PATIENTS.find(pt => pt.id === r.patientId);
                  if (!p) return null;
                  return (
                    <tr key={r.patientId} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy text-xs cursor-pointer hover:text-orange" onClick={() => navigate('PatientDetail', r.patientId)}>{p.firstName} {p.lastName}</td>
                      <td className="px-4 py-3 text-xs text-slate">{r.targetDischargeDate}</td>
                      <td className="px-4 py-3 text-xs text-slate">{r.recoveryHousing?.name ?? 'Family home'}</td>
                      {r.followUpCalls.map(call => (
                        <td key={call.type} className="px-4 py-3">
                          {call.completedDate && call.outcome ? (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${FOLLOWUP_STYLE[call.outcome]}`}>{call.outcome}</span>
                          ) : call.scheduledDate ? (
                            <span className="text-[10px] text-amber-600 font-medium">{call.scheduledDate}</span>
                          ) : (
                            <span className="text-[10px] text-slate">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button className="text-xs text-orange hover:underline">Log Call</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Community Resources' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Resources Listed', value: 24, sub: 'In our network', color: 'text-navy' },
              { label: 'Sober Living', value: 8, sub: 'Available beds (est.)', color: 'text-green-600' },
              { label: 'Peer Support Lines', value: 4, sub: '24/7 crisis access', color: 'text-blue-600' },
              { label: 'Employment Services', value: 5, sub: 'Partnered agencies', color: 'text-orange' },
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
              category: '🏠 Sober Living / Recovery Housing',
              resources: [
                { name: 'Sunrise Sober Living — East', address: '842 Maple Ave, Nashville TN 37206', phone: '(615) 555-0221', notes: 'Men only · MAT-friendly · 12 beds · $750/mo', partner: true },
                { name: 'New Paths Women\'s Residence', address: '1015 Oak St, Nashville TN 37208', phone: '(615) 555-0234', notes: 'Women only · Children welcome (under 5) · 8 beds · $825/mo', partner: true },
                { name: 'Oxford House — Hillsboro', address: '337 Hillsboro Rd, Nashville TN 37215', phone: '(615) 555-0189', notes: 'Democratically run · Any gender · 10 beds · $500/mo', partner: false },
                { name: 'Alano House', address: '204 Church St, Nashville TN 37201', phone: '(615) 555-0144', notes: 'Men only · No MAT policy · 14 beds · $600/mo', partner: false },
              ]
            },
            {
              category: '📞 Crisis & Peer Support Lines',
              resources: [
                { name: 'SAMHSA National Helpline', address: 'National — 24/7', phone: '1-800-662-4357', notes: 'Free, confidential · English & Spanish · Treatment referrals', partner: true },
                { name: 'Tennessee REDLINE', address: 'TN Statewide — 24/7', phone: '1-800-889-9789', notes: 'State addiction crisis line · Referral coordination', partner: true },
                { name: 'Crisis Text Line', address: 'National — 24/7', phone: 'Text HOME to 741741', notes: 'Text-based crisis support · Free', partner: false },
                { name: 'Nashville AA Central Office', address: '855 5th Ave N, Nashville TN 37219', phone: '(615) 831-1050', notes: 'Meeting finder · Intergroup support · Speaker requests', partner: false },
              ]
            },
            {
              category: '💼 Employment & Vocational Services',
              resources: [
                { name: 'Nashville Career Advancement Center', address: '301 Plus Park Blvd, Nashville TN 37217', phone: '(615) 862-8890', notes: 'Free job training · Resume help · Justice-involved friendly', partner: true },
                { name: 'Goodwill Industries of Middle TN', address: '937 Herman St, Nashville TN 37208', phone: '(615) 742-7151', notes: 'On-the-job training · Recovery-friendly employer', partner: true },
                { name: 'TN Vocational Rehabilitation', address: '220 French Landing Dr, Nashville TN 37243', phone: '(615) 313-4891', notes: 'State-funded voc rehab · SUD-recovery applicants accepted', partner: false },
              ]
            },
            {
              category: '🏥 Ongoing Treatment & Medication Access',
              resources: [
                { name: 'Centerstone — Nashville Outpatient', address: '1921 Ransom Place, Nashville TN 37228', phone: '(615) 460-4500', notes: 'OP / IOP · MAT program · Medicaid accepted', partner: true },
                { name: 'Matthew Walker Comprehensive Health', address: '1035 14th Ave N, Nashville TN 37208', phone: '(615) 341-4600', notes: 'FQHC · MOUD / buprenorphine · Sliding scale', partner: true },
                { name: 'CVS MinuteClinic — MAT Program', address: 'Multiple TN locations', phone: '1-800-746-7287', notes: 'Buprenorphine · No prior auth for first 30 days', partner: false },
              ]
            },
          ].map(section => (
            <div key={section.category} className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-border font-semibold text-navy text-sm">{section.category}</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {section.resources.map(r => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                        {r.name}
                        {r.partner && <span className="ml-2 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">PARTNER</span>}
                      </td>
                      <td className="px-4 py-3 text-slate">{r.address}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium whitespace-nowrap">{r.phone}</td>
                      <td className="px-4 py-3 text-slate max-w-xs">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'Alumni Program' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Sunrise Recovery alumni engagement — post-discharge check-ins, milestone tracking, and community re-integration support.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Alumni', value: 48, sub: 'Enrolled in program', color: 'text-navy' },
              { label: 'Sober 90+ Days', value: 31, sub: '65% of active alumni', color: 'text-green-600' },
              { label: 'Upcoming 1-Year Anniversaries', value: 3, sub: 'Next 30 days', color: 'text-amber-600' },
              { label: 'Alumni Meetings/Month', value: 4, sub: 'Tuesday evenings', color: 'text-blue-600' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Recent Alumni Milestones</h3>
              <div className="space-y-3">
                {[
                  { name: 'Kevin Ashford', milestone: '6 Months Sober', date: '2026-07-18', program: 'Residential alum', note: 'Employed at Vanderbilt. Attending AA 4x/week.' },
                  { name: 'Monica Delgado', milestone: '90 Days Sober', date: '2026-07-15', program: 'PHP alum', note: 'Living with family. Outpatient therapy continuing.' },
                  { name: 'Stuart Fink', milestone: '1 Year Sober', date: '2026-07-10', program: 'IOP alum', note: 'Peer support volunteer at Sunrise. Leading alumni group.' },
                  { name: 'Jasmine Hayward', milestone: '30 Days (Re-entry)', date: '2026-07-05', program: 'Residential — readmit alum', note: 'Returned after relapse. Now 30 days clean in current admission.' },
                  { name: 'David Okafor', milestone: '2 Years Sober', date: '2026-06-28', program: 'Residential alum', note: 'Pursuing CPRS certification. Mentors 2 current patients.' },
                ].map(a => (
                  <div key={a.name} className="flex items-start gap-3 p-2.5 border border-border rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{a.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy text-sm">{a.name}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">{a.milestone}</span>
                      </div>
                      <div className="text-[10px] text-slate mt-0.5">{a.program} · {a.date}</div>
                      <div className="text-xs text-slate mt-0.5">{a.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Alumni Check-in Schedule</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { interval: 'Day 7 Call', coverage: '94%', next: '3 calls due this week', color: 'text-green-600' },
                    { interval: '30-Day Call', coverage: '85%', next: '4 calls due this week', color: 'text-green-600' },
                    { interval: '60-Day Call', coverage: '71%', next: '2 calls due this week', color: 'text-amber-600' },
                    { interval: '90-Day Call', coverage: '63%', next: '1 call due this week', color: 'text-amber-600' },
                    { interval: '6-Month Check-in', coverage: '52%', next: 'Kevin Ashford — today', color: 'text-amber-600' },
                    { interval: '1-Year Anniversary', coverage: '44%', next: '3 upcoming in next 30 days', color: 'text-orange' },
                  ].map(r => (
                    <div key={r.interval} className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-navy w-36 shrink-0">{r.interval}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 bg-navy rounded-full" style={{ width: r.coverage }} />
                      </div>
                      <span className={`font-bold w-10 text-right shrink-0 ${r.color}`}>{r.coverage}</span>
                      <span className="text-[10px] text-slate w-40 shrink-0">{r.next}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Alumni Meeting Schedule</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { day: 'Every Tuesday', time: '6:00 PM – 7:30 PM', name: 'Sunrise Alumni Group', location: 'Main Conference Room, Building A', facilitator: 'Marcus Thompson, CPRS (PSS)' },
                    { day: 'First Sunday/month', time: '2:00 PM – 4:00 PM', name: 'Family & Alumni Reunion Meeting', location: 'Outdoor Pavilion / Rain: Main Hall', facilitator: 'Sarah Jenkins, LPC' },
                    { day: 'Third Friday/month', time: '5:30 PM – 6:30 PM', name: 'Milestone Celebration (chips & share)', location: 'Sunrise Café', facilitator: 'David Okafor (2-year alum volunteer)' },
                  ].map(m => (
                    <div key={m.name} className="p-2.5 border border-border rounded-lg">
                      <div className="font-semibold text-navy">{m.name}</div>
                      <div className="text-slate mt-0.5">{m.day} · {m.time}</div>
                      <div className="text-slate mt-0.5">{m.location}</div>
                      <div className="text-slate mt-0.5"><strong>Facilitator:</strong> {m.facilitator}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Outcomes' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Post-discharge outcomes for patients with completed aftercare plans — housing stability, sobriety milestones, and alumni re-engagement tracking.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Discharged (90d)', value: 22, color: 'text-navy', sub: 'With documented aftercare plan' },
              { label: 'Housing Stable at 90d', value: '77%', color: 'text-green-600', sub: '17 of 22 confirmed stable' },
              { label: '30-Day Sobriety (Self-Report)', value: '73%', color: 'text-teal-600', sub: 'via alumni check-in call' },
              { label: 'Alumni Enrolled', value: '64%', color: 'text-blue-600', sub: '14 of 22 in alumni program' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">90-Day Outcomes by LOC</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Discharge LOC</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">N</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Housing Stable</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">30d Sobriety</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Alumni Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { loc: 'Residential (3.5)', n: 9, housing: '89%', sob30: '83%', alum: '78%' },
                    { loc: 'PHP (2.5)', n: 7, housing: '71%', sob30: '71%', alum: '57%' },
                    { loc: 'IOP (2.1)', n: 4, housing: '75%', sob30: '50%', alum: '50%' },
                    { loc: 'Detox only', n: 2, housing: '50%', sob30: '50%', alum: '0%' },
                  ].map(r => (
                    <tr key={r.loc} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-navy">{r.loc}</td>
                      <td className="py-2 text-center text-slate">{r.n}</td>
                      <td className="py-2 text-center font-semibold text-green-600">{r.housing}</td>
                      <td className="py-2 text-center font-semibold text-teal-600">{r.sob30}</td>
                      <td className="py-2 text-center font-semibold text-blue-600">{r.alum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Aftercare Plan Component Impact</h3>
              <div className="space-y-3 text-xs">
                {[
                  { component: 'Sober Living Placement', n: 11, sob30: 89, housing: 100 },
                  { component: 'IOP Step-down Enrolled', n: 9, sob30: 78, housing: 89 },
                  { component: 'MAT Continuation Plan', n: 7, sob30: 86, housing: 86 },
                  { component: 'Peer Recovery Coach', n: 6, sob30: 83, housing: 83 },
                  { component: 'Employment / Voc Rehab', n: 5, sob30: 80, housing: 80 },
                  { component: 'Family Ongoing Contact', n: 14, sob30: 79, housing: 86 },
                ].map(c => (
                  <div key={c.component}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{c.component} (n={c.n})</span>
                      <div className="flex gap-3 text-[10px]">
                        <span className="font-bold text-teal-600">{c.sob30}% sober</span>
                        <span className="text-green-600">{c.housing}% housed</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${c.sob30}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Peer Support Network' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Certified Peer Recovery Specialists (CPRS) and mutual aid network connections — available to support patients during treatment and post-discharge.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'CPRS on Staff', value: 3, color: 'text-navy', sub: 'Employed at Sunrise' },
              { label: 'Active Peer Mentors', value: 14, color: 'text-blue-600', sub: 'Alumni volunteers engaged' },
              { label: 'Patients with Peer Match', value: 24, color: 'text-green-600', sub: 'Of 36 current patients' },
              { label: 'Peer Touchpoints (30d)', value: 87, color: 'text-teal-600', sub: 'Calls, visits, texts combined' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">CPRS Team — Sunrise Staff</h3>
              <div className="space-y-3 text-xs">
                {[
                  { name: 'Derrick Hampton, CPRS', spec: 'OUD/MAT, Criminal Justice', exp: '6 yr recovery, 3 yr CPRS', cases: 9, avail: 'Mon–Fri 9a–5p', type: 'OUD' },
                  { name: 'Tamika Powell, CPRS', spec: 'Women\'s issues, Co-occurring', exp: '8 yr recovery, 4 yr CPRS', cases: 8, avail: 'Mon–Thu 10a–6p', type: 'Women' },
                  { name: 'Carlos Ramos, CPRS', spec: 'Family recovery, Stimulant use', exp: '5 yr recovery, 2 yr CPRS', cases: 7, avail: 'Tue–Sat 8a–4p', type: 'Stimulant' },
                ].map(p => (
                  <div key={p.name} className="border border-border rounded-xl p-3">
                    <div className="font-semibold text-navy mb-0.5">{p.name}</div>
                    <div className="text-slate mb-1">{p.spec} · {p.exp}</div>
                    <div className="flex gap-4 text-[10px]">
                      <span><span className="font-semibold text-slate">Current:</span> <span className="text-navy">{p.cases} patients</span></span>
                      <span><span className="font-semibold text-slate">Avail:</span> <span className="text-navy">{p.avail}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Community Mutual Aid — AA/NA/SMART Recovery Meetings</h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Nashville Central AA (Downtown)', days: 'Daily 7pm', format: 'In-person', focus: 'Open AA', contact: '615-555-0100' },
                  { name: 'Narcotics Anonymous (Bellevue)', days: 'Mon/Wed/Fri 6:30pm', format: 'In-person', focus: 'Open NA', contact: '615-555-0210' },
                  { name: 'SMART Recovery Nashville', days: 'Tue/Thu 5:30pm', format: 'Hybrid', focus: 'CBT-based, secular', contact: '615-555-0322' },
                  { name: 'Women for Sobriety (Franklin)', days: 'Sat 10am', format: 'In-person', focus: 'Women-specific', contact: '615-555-0418' },
                  { name: 'Online AA (Zoom)', days: 'Daily multiple times', format: 'Virtual', focus: 'Open AA — any device', contact: 'aa-intergroup.org' },
                  { name: 'Refuge Recovery (East Nashville)', days: 'Mon/Thu 7pm', format: 'In-person', focus: 'Mindfulness-based', contact: '615-555-0511' },
                ].map(m => (
                  <div key={m.name} className="flex items-center justify-between border border-border rounded p-2">
                    <div>
                      <div className="font-medium text-navy">{m.name}</div>
                      <div className="text-[10px] text-slate">{m.days} · {m.format} · {m.focus}</div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-700 shrink-0 ml-2">{m.contact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TODAY = '2026-07-19';
