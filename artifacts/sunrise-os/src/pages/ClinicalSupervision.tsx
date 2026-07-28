import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, Clock, AlertTriangle, Plus, ChevronDown, ChevronUp, Star, TrendingUp, Award, X } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type SuperviseeRole = 'LCPC-A (MD)' | 'CSC-AD (MD)' | 'ADT (MD BHA)' | 'BHT';
type NoteStatus = 'Draft' | 'Signed' | 'Co-signed' | 'Pending Review';

interface SuperviseeRecord {
  id: string;
  name: string;
  role: SuperviseeRole;
  supervisor: string;
  hoursRequiredMonthly: number;
  hoursCompletedThisMonth: number;
  licenseExpiry: string;
  supervisionType: 'Individual' | 'Group' | 'Both';
  nextSession: string;
  caseload: number;
  pendingCosigns: number;
  competencyScores: {
    assessment: number;
    treatmentPlanning: number;
    documentation: number;
    therapeuticAlliance: number;
    ethicsCompliance: number;
    culturalHumility: number;
  };
  notes: SupervisionNote[];
}

interface SupervisionNote {
  id: string;
  date: string;
  type: 'Individual' | 'Group';
  duration: number;
  status: NoteStatus;
  topics: string[];
  strengths: string;
  growthAreas: string;
  goals: string;
  supervisorSignature?: string;
  superviseeSignature?: string;
}

const SUPERVISEES: SuperviseeRecord[] = [
  {
    id: 'SV-001', name: 'Sarah Jenkins', role: 'LCPC-A (MD)', supervisor: 'James S. Collins III, CAC-AD, BAS',
    hoursRequiredMonthly: 2, hoursCompletedThisMonth: 2, licenseExpiry: '2028-06-30',
    supervisionType: 'Both', nextSession: '2026-08-05', caseload: 8, pendingCosigns: 2,
    competencyScores: { assessment: 4.2, treatmentPlanning: 4.5, documentation: 3.8, therapeuticAlliance: 4.7, ethicsCompliance: 5.0, culturalHumility: 4.1 },
    notes: [
      {
        id: 'SN-001', date: '2026-07-01', type: 'Individual', duration: 60, status: 'Signed',
        topics: ['Countertransference — trauma patient', 'BIRP note quality', 'AMA risk management'],
        strengths: 'Excellent rapport with high-acuity patients. PHQ-9 screening consistently done and documented. Strong family engagement skills noted by Collins in chart review.',
        growthAreas: 'BIRP notes occasionally lack objective data in the B (behavior) field. Review: behavioral observations are NOT interpretations. Practice: write the B before the I.',
        goals: 'By 7/22: submit two BIRP notes for supervisor review with complete behavioral observations. Continue weekly 1:1 with p1 Marcus Webb given AMA risk.',
        supervisorSignature: 'James S. Collins III, CAC-AD, BAS, 7/1/2026', superviseeSignature: 'Sarah Jenkins, LCPC, CAC-AD, 7/1/2026',
      },
      {
        id: 'SN-002', date: '2026-07-15', type: 'Individual', duration: 60, status: 'Signed',
        topics: ['Marcus Webb AMA risk escalation', 'Passive SI documentation', 'Mandatory reporting review'],
        strengths: 'Excellent clinical instincts — identified passive SI in Marcus Webb and escalated appropriately. C-SSRS documentation was complete and timely. Safety plan well-written.',
        growthAreas: 'After crisis situations: practice self-care protocols. Vicarious trauma is real. Reviewed organizational EAP resources.',
        goals: 'By 7/22: attend peer consultation group. Read assigned article on clinician vicarious trauma.',
        supervisorSignature: 'James S. Collins III, CAC-AD, BAS, 7/15/2026', superviseeSignature: 'Sarah Jenkins, LCPC, CAC-AD, 7/15/2026',
      },
    ],
  },
  {
    id: 'SV-002', name: 'Michael Boyd', role: 'ADT (MD BHA)', supervisor: 'Kevin Wright, CAC-AD, PRS (MD BHA BAS)',
    hoursRequiredMonthly: 1, hoursCompletedThisMonth: 0, licenseExpiry: '2027-03-15',
    supervisionType: 'Individual', nextSession: '2026-08-06', caseload: 6, pendingCosigns: 5,
    competencyScores: { assessment: 3.5, treatmentPlanning: 3.2, documentation: 3.0, therapeuticAlliance: 4.0, ethicsCompliance: 4.5, culturalHumility: 3.8 },
    notes: [
      {
        id: 'SN-003', date: '2026-07-08', type: 'Individual', duration: 45, status: 'Signed',
        topics: ['Documentation timeliness', 'Group facilitation skills', 'Motivational interviewing'],
        strengths: 'Great group energy — patients respond well to Kevin\'s peer-informed perspective. Authentic and genuine. Strong in early engagement.',
        growthAreas: 'Documentation: 3 notes submitted after 24-hour deadline this week. Reviewed CMS documentation requirements. Also: avoid advice-giving in MI — practice reflective listening.',
        goals: 'By 7/23: all progress notes submitted within 24 hours. Complete online MI module (Level 2). Practice open-ended questions in group.',
        supervisorSignature: 'Kevin Wright, CAC-AD, MD BHA BAS, 7/8/2026', superviseeSignature: 'Michael Boyd, ADT (MD BHA), 7/8/2026',
      },
    ],
  },
  {
    id: 'SV-003', name: 'Aisha Thompson', role: 'CSC-AD (MD)', supervisor: 'James S. Collins III, CAC-AD, BAS',
    hoursRequiredMonthly: 2, hoursCompletedThisMonth: 1, licenseExpiry: '2029-09-01',
    supervisionType: 'Both', nextSession: '2026-08-10', caseload: 9, pendingCosigns: 1,
    competencyScores: { assessment: 4.6, treatmentPlanning: 4.3, documentation: 4.8, therapeuticAlliance: 4.2, ethicsCompliance: 5.0, culturalHumility: 4.9 },
    notes: [
      {
        id: 'SN-004', date: '2026-07-10', type: 'Individual', duration: 60, status: 'Signed',
        topics: ['Biopsychosocial assessment quality', 'Complex trauma patients', 'Cultural considerations — BIPOC patients'],
        strengths: 'Outstanding biopsychosocial assessments — among the most thorough on the team. Cultural humility practice is exemplary. Patients from underserved communities report high satisfaction.',
        growthAreas: 'Build comfort with confrontational interventions. Natural style is supportive — some patients need therapeutic challenge. Practice motivational confrontation technique.',
        goals: 'By 7/20: role-play confrontational intervention with supervisor. Identify 1 patient case for therapeutic challenge intervention.',
        supervisorSignature: 'James S. Collins III, 7/10/2026', superviseeSignature: 'Aisha Thompson, LCADC, 7/10/2026',
      },
    ],
  },
];

const GROUP_SUPERVISION = [
  { date: '2026-08-05', time: '2:00 PM', topic: 'Complex Trauma & Addiction — Case Consultation', supervisor: 'James S. Collins III', attendees: ['Sarah Jenkins', 'Kevin Wright', 'Aisha Thompson'], status: 'Upcoming' },
  { date: '2026-07-08', time: '2:00 PM', topic: 'Mandatory Reporting in Addiction Treatment (42 CFR Part 2 vs. Tarasoff)', supervisor: 'James S. Collins III', attendees: ['Sarah Jenkins', 'Kevin Wright', 'Aisha Thompson'], status: 'Completed' },
  { date: '2026-06-24', time: '2:00 PM', topic: 'Motivational Interviewing Fidelity Review', supervisor: 'James S. Collins III', attendees: ['Kevin Wright', 'Aisha Thompson'], status: 'Completed' },
];

const PRODUCTIVITY_DATA = [
  { name: 'Sarah J.', notes: 14, cosigns: 11, groups: 8, missed: 0 },
  { name: 'Kevin W.', notes: 9, cosigns: 6, groups: 12, missed: 3 },
  { name: 'Aisha T.', notes: 16, cosigns: 15, groups: 7, missed: 0 },
];

export function ClinicalSupervision({ navigate: _navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Overview' | 'Individual' | 'Group' | 'Productivity' | 'Supervisor Notes' | 'Competency Eval'>('Overview');
  const [selectedSupervisee, setSelectedSupervisee] = useState<string>('SV-001');
  const [expandedNote, setExpandedNote] = useState<string | null>('SN-001');
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState<string | null>(null);
  const saveSuperAction = (msg: string) => { setNoteSaved(msg); setTimeout(() => setNoteSaved(null), 2500); };

  const supervisee = SUPERVISEES.find(s => s.id === selectedSupervisee)!;
  const overdueSupervision = SUPERVISEES.filter(s => s.hoursCompletedThisMonth < s.hoursRequiredMonthly);

  const radarData = supervisee ? Object.entries(supervisee.competencyScores).map(([key, val]) => ({
    subject: key.replace(/([A-Z])/g, ' $1').trim(),
    score: val,
    fullMark: 5,
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Clinical Supervision</h1>
          <p className="text-slate text-sm mt-0.5">Supervision notes · Competency tracking · CARF supervision compliance</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setNewNoteOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Supervision Note
        </LockedButton>
      </div>

      {overdueSupervision.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800">Supervision Hours Behind</div>
            <div className="text-sm text-amber-700">
              {overdueSupervision.map(s => `${s.name} (${s.hoursCompletedThisMonth}/${s.hoursRequiredMonthly} hrs this month)`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Supervisees', value: SUPERVISEES.length, sub: 'Under clinical oversight', color: 'text-navy' },
          { label: 'Hours This Month', value: `${SUPERVISEES.reduce((a,s)=>a+s.hoursCompletedThisMonth,0)}/${SUPERVISEES.reduce((a,s)=>a+s.hoursRequiredMonthly,0)}`, sub: 'Required vs. completed', color: 'text-navy' },
          { label: 'Pending Co-signs', value: SUPERVISEES.reduce((a,s)=>a+s.pendingCosigns,0), sub: 'Require supervisor signature', color: 'text-orange' },
          { label: 'Next Group Supervision', value: 'Aug 5', sub: 'Complex Trauma & Addiction', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Overview', 'Individual', 'Group', 'Productivity', 'Supervisor Notes', 'Competency Eval'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          {SUPERVISEES.map(sv => (
            <div key={sv.id} className="card space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center">{sv.name.split(' ').map(n=>n[0]).join('')}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-navy">{sv.name}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{sv.role}</span>
                    {sv.hoursCompletedThisMonth < sv.hoursRequiredMonthly && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Hours Behind</span>
                    )}
                    {sv.pendingCosigns > 0 && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{sv.pendingCosigns} Co-signs Due</span>
                    )}
                  </div>
                  <div className="text-xs text-slate mt-0.5">Supervisor: {sv.supervisor} · Caseload: {sv.caseload} patients · Next session: {sv.nextSession}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate">Supervision hours (month)</div>
                  <div className="font-bold text-navy">{sv.hoursCompletedThisMonth}/{sv.hoursRequiredMonthly} hrs</div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(sv.competencyScores).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-slate mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className={`text-lg font-bold ${val >= 4.5 ? 'text-green-600' : val >= 3.5 ? 'text-amber-600' : 'text-red-600'}`}>{val.toFixed(1)}</div>
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {Array.from({length:5}).map((_,i) => <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(val) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Individual' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate uppercase">Select Supervisee</div>
            {SUPERVISEES.map(sv => (
              <button key={sv.id} onClick={() => setSelectedSupervisee(sv.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSupervisee === sv.id ? 'border-orange bg-orange/5' : 'border-border hover:border-orange/40'}`}>
                <div className="font-semibold text-navy text-sm">{sv.name}</div>
                <div className="text-xs text-slate">{sv.role} · {sv.caseload} patients</div>
                {sv.pendingCosigns > 0 && <div className="text-[10px] text-orange mt-1">{sv.pendingCosigns} co-signs pending</div>}
              </button>
            ))}
          </div>
          <div className="col-span-2 space-y-4">
            {supervisee && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <div className="text-xs text-slate uppercase font-semibold mb-3">Competency Radar</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                        <Radar dataKey="score" stroke="#FF6A00" fill="#FF6A00" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card space-y-2">
                    <div className="text-xs text-slate uppercase font-semibold mb-1">Supervision Status</div>
                    {[
                      ['Supervisor', supervisee.supervisor.split(',')[0]],
                      ['Role', supervisee.role],
                      ['License Expires', supervisee.licenseExpiry],
                      ['Hours This Month', `${supervisee.hoursCompletedThisMonth}/${supervisee.hoursRequiredMonthly}`],
                      ['Next Session', supervisee.nextSession],
                      ['Pending Co-signs', supervisee.pendingCosigns.toString()],
                    ].map(([k,v]) => (
                      <div key={k} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                        <span className="text-slate">{k}</span><span className="font-semibold text-navy">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {supervisee.notes.map(note => {
                    const isExpanded = expandedNote === note.id;
                    return (
                      <div key={note.id} className="border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedNote(isExpanded ? null : note.id)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-navy text-sm">{note.date}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${note.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{note.status}</span>
                              <span className="text-xs text-slate">{note.type} · {note.duration} min</span>
                            </div>
                            <div className="text-xs text-slate mt-0.5">{note.topics.join(' · ')}</div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                        </div>
                        {isExpanded && (
                          <div className="border-t border-border px-5 py-4 bg-white space-y-3">
                            {[['Strengths Observed', note.strengths, 'text-green-700'], ['Growth Areas', note.growthAreas, 'text-amber-700'], ['Goals & Action Items', note.goals, 'text-navy']].map(([label, text, color]) => (
                              <div key={label}>
                                <div className="text-xs font-semibold text-slate uppercase mb-1">{label}</div>
                                <p className={`text-sm leading-relaxed ${color}`}>{text}</p>
                              </div>
                            ))}
                            <div className="flex gap-4 text-xs text-slate border-t border-border pt-3">
                              {note.supervisorSignature && <span>Supervisor: <strong>{note.supervisorSignature}</strong></span>}
                              {note.superviseeSignature && <span>Supervisee: <strong>{note.superviseeSignature}</strong></span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={() => setNewNoteOpen(true)} className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-slate hover:border-orange hover:text-orange transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Supervision Note
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'Group' && (
        <div className="space-y-4">
          {GROUP_SUPERVISION.map((gs, i) => (
            <div key={i} className={`card ${gs.status === 'Upcoming' ? 'border-orange border' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-navy">{gs.topic}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${gs.status === 'Upcoming' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{gs.status}</span>
                  </div>
                  <div className="text-xs text-slate mt-1">{gs.date} · {gs.time} · Supervisor: {gs.supervisor}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {gs.attendees.map(a => <span key={a} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{a}</span>)}
                  </div>
                </div>
                {gs.status === 'Upcoming' && <LockedButton locked={readOnly} onClick={() => saveSuperAction('Session added to calendar')} className="btn-primary text-xs px-3 py-1.5">Add to Calendar</LockedButton>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Productivity' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Weekly Documentation Productivity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={PRODUCTIVITY_DATA} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="notes" name="Progress Notes" fill="#1B2F5E" radius={[3,3,0,0]} />
                <Bar dataKey="cosigns" name="Co-signs Completed" fill="#FF6A00" radius={[3,3,0,0]} />
                <Bar dataKey="groups" name="Group Sessions" fill="#2ECC71" radius={[3,3,0,0]} />
                <Bar dataKey="missed" name="Late/Missing Notes" fill="#E74C3C" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4" />Competency Summary Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-slate font-semibold">Clinician</th>
                    {['Assessment', 'Tx Planning', 'Documentation', 'Alliance', 'Ethics', 'Cultural'].map(h => (
                      <th key={h} className="text-center py-2 px-2 text-slate font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUPERVISEES.map(sv => (
                    <tr key={sv.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-semibold text-navy">{sv.name}</td>
                      {Object.values(sv.competencyScores).map((val, i) => (
                        <td key={i} className={`text-center py-2 px-2 font-bold ${val >= 4.5 ? 'text-green-600' : val >= 3.5 ? 'text-amber-600' : 'text-red-600'}`}>{val.toFixed(1)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'Supervisor Notes' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Confidential supervision notes maintained by the Clinical Supervisor. Accessible only to supervisors and the supervisee per licensure board standards.</div>

          {[
            {
              supervisee: 'Sarah Jenkins, LCPC',
              credential: 'LCPC · CAC-AD · 6 yrs exp',
              supervisor: 'James S. Collins III, CAC-AD, BAS',
              date: '2026-07-14',
              type: 'Individual Supervision',
              rating: 5,
              focus: ['Documentation quality', 'Transference in group settings'],
              strengths: 'Exceptional therapeutic alliance with high-acuity patients. Documentation is consistently thorough and timely. Demonstrates strong insight in processing countertransference during supervision.',
              growth: 'Continue developing advanced group facilitation skills for higher-acuity populations. Explore supervision of interns as a professional development goal for Q4.',
              plan: 'Assign as lead facilitator for new DBT-ST group launching Aug 1. Pair with Devon Ramos for peer observation.',
              hours: { individual: 1, group: 0.5, total: 1.5 },
            },
            {
              supervisee: 'David Odom, LCADC',
              credential: 'LCADC · CAC-AD · 4 yrs exp',
              supervisor: 'James S. Collins III, CAC-AD, BAS',
              date: '2026-07-10',
              type: 'Individual Supervision',
              rating: 4,
              focus: ['Family systems interventions', 'HIPAA/42 CFR documentation'],
              strengths: 'Strong family therapy skills. Excellent engagement with family members during visitation sessions. Innovative with group curriculum topics.',
              growth: '42 CFR Part 2 consent documentation needs to be more explicit in the chart. Reviewed the consent form structure. One note lacked proper disclosure language — corrected.',
              plan: 'Complete 42 CFR refresher module by July 31. Attend compliance training July 25.',
              hours: { individual: 1, group: 0, total: 1 },
            },
            {
              supervisee: 'Devon Ramos, LMSW',
              credential: 'LMSW (toward LCADC) · 2 yrs exp',
              supervisor: 'David Odom, LCADC',
              date: '2026-07-12',
              type: 'Individual Supervision',
              rating: 4,
              focus: ['Suicide risk assessment', 'Use of self in session'],
              strengths: 'Rapid professional growth since January. Demonstrates solid clinical reasoning. Patients frequently report feeling genuinely heard. Accurate CIWA/COWS scoring.',
              growth: 'Safety planning documentation needs to be more specific — collaboratively constructed rather than checklist-style. Reviewed Columbia Suicide Severity Rating Scale.',
              plan: 'Shadow Dr. Stone for one psychiatric evaluation before Aug 1. Present a case in August group supervision.',
              hours: { individual: 1, group: 0.5, total: 1.5 },
            },
          ].map(note => (
            <div key={note.supervisee} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy">{note.supervisee}</h3>
                    <span className="text-xs text-slate">{note.credential}</span>
                  </div>
                  <div className="text-xs text-slate mt-0.5">{note.type} · {note.date} · Supervisor: {note.supervisor}</div>
                </div>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`text-base ${i < note.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>)}</div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {note.focus.map(f => <span key={f} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full font-medium">{f}</span>)}
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="font-bold text-green-700 mb-1">✓ Strengths Observed</div>
                  <p className="text-green-800 leading-relaxed">{note.strengths}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="font-bold text-amber-700 mb-1">↗ Growth Areas</div>
                  <p className="text-amber-800 leading-relaxed">{note.growth}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="font-bold text-blue-700 mb-1">📋 Development Plan</div>
                  <p className="text-blue-800 leading-relaxed">{note.plan}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                <div className="flex gap-4 text-slate">
                  <span>Individual hrs: <span className="font-bold text-navy">{note.hours.individual}</span></span>
                  <span>Group hrs: <span className="font-bold text-navy">{note.hours.group}</span></span>
                  <span>Total hrs this session: <span className="font-bold text-navy">{note.hours.total}</span></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExpandedNote(expandedNote === note.supervisee ? null : note.supervisee)} className="text-xs border border-border text-slate px-3 py-1 rounded hover:bg-gray-50">View History</button>
                  <LockedButton locked={readOnly} onClick={() => setNewNoteOpen(true)} className="text-xs btn-primary px-3 py-1">Add Note</LockedButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Competency Eval' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Annual and probationary clinical competency evaluations — domain scores, supervisor ratings, and professional development plans.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Evals Completed (YTD)', value: 11, color: 'text-navy', sub: 'Of 13 scheduled' },
              { label: 'Avg Overall Score', value: '87/100', color: 'text-green-600', sub: 'Meets/Exceeds standard' },
              { label: 'Staff Requiring PIP', value: 1, color: 'text-amber-600', sub: 'Performance Improvement Plan' },
              { label: 'Evals Overdue', value: 2, color: 'text-red-600', sub: 'Scheduled — not completed' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Competency Domain Scores — Staff Average</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { domain: 'Clinical Documentation & Timeliness', score: 84, max: 100, color: 'bg-blue-500' },
                { domain: 'Therapeutic Relationship & Engagement', score: 91, max: 100, color: 'bg-teal-500' },
                { domain: 'Treatment Planning & Goal Setting', score: 88, max: 100, color: 'bg-purple-500' },
                { domain: 'Group Facilitation Skills', score: 85, max: 100, color: 'bg-green-500' },
                { domain: 'Crisis Assessment & De-escalation', score: 89, max: 100, color: 'bg-orange-400' },
                { domain: 'Cultural Competency & Trauma-Informed Care', score: 93, max: 100, color: 'bg-pink-400' },
                { domain: 'MAT/Harm Reduction Knowledge', score: 82, max: 100, color: 'bg-amber-500' },
                { domain: 'Ethics & Scope of Practice Compliance', score: 96, max: 100, color: 'bg-navy' },
              ].map(d => (
                <div key={d.domain}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate">{d.domain}</span>
                    <span className="font-semibold text-navy">{d.score}/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Individual Evaluation Summary</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-slate">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Clinician</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Overall Score</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Lowest Domain</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Next Eval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'A. Brooks, LCPC', score: 94, low: 'Documentation', status: 'Exceeds', next: '2027-06', ok: true },
                  { name: 'T. Jackson, CAC-AD', score: 88, low: 'MAT Knowledge', status: 'Meets', next: '2027-06', ok: true },
                  { name: 'M. Rivera, MS', score: 71, low: 'Documentation', status: 'PIP', next: '2026-10', ok: false },
                  { name: 'R. Torres, LCPC', score: 96, low: 'None', status: 'Exceeds', next: '2027-06', ok: true },
                  { name: 'K. Nguyen, CAC-AD', score: 79, low: 'Group Facilitation', status: 'Probationary', next: '2026-10', ok: false },
                ].map(s => (
                  <tr key={s.name} className={`hover:bg-gray-50 ${!s.ok ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-2 font-medium text-navy">{s.name}</td>
                    <td className="py-2 text-center"><span className={`font-bold ${s.score >= 90 ? 'text-green-600' : s.score >= 80 ? 'text-blue-600' : 'text-red-600'}`}>{s.score}/100</span></td>
                    <td className="py-2 text-center text-slate">{s.low}</td>
                    <td className="py-2 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.status === 'Exceeds' ? 'bg-green-100 text-green-700' : s.status === 'Meets' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                    </td>
                    <td className="py-2 text-center text-slate">{s.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {newNoteOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewNoteOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[540px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy">New Supervision Note</h2>
              <button onClick={() => setNewNoteOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Supervisee *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Sarah Jenkins, LCPC</option><option>Michael Boyd, ADT</option><option>Aisha Thompson, CSC-AD</option><option>Kevin Wright, CAC-AD</option><option>Devon Ramos, LMSW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Session Date</label>
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Session Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Individual Supervision</option><option>Group Supervision</option><option>Crisis Consultation</option><option>Chart Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Duration (hours)</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>0.5</option><option>1</option><option>1.5</option><option>2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Cases Reviewed / Focus Areas</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Caseload review, clinical challenges, skill-building focus, ethics discussion..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Supervisor Observations & Plan</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none" placeholder="Strengths noted, areas for growth, action items, follow-up plan..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setNewNoteOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setNewNoteOpen(false); saveSuperAction('Supervision note saved'); }} className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {noteSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {noteSaved}
        </div>
      )}
    </div>
  );
}
