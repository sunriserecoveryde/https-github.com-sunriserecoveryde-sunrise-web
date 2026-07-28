import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { Video, VideoOff, CheckCircle, Clock, Calendar, ExternalLink, Wifi, Monitor, Mic, Camera, Plus, AlertTriangle, Phone } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type SessionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'No Show' | 'Tech Failure' | 'Cancelled';
type ModalityType = 'Individual Therapy' | 'Group Therapy' | 'Psychiatric Evaluation' | 'Medication Management' | 'Family Session' | 'Case Management';

interface TelehealthSession {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number; // minutes
  modality: ModalityType;
  provider: string;
  status: SessionStatus;
  platform: 'Zoom for Healthcare' | 'Doxy.me' | 'Microsoft Teams (HIPAA)';
  joinUrl?: string;
  techCheckDone: boolean;
  insuranceAuth: boolean;
  consentOnFile: boolean;
  sessionNotes?: string;
  billingCode?: string;
  location: string; // patient location on call
}

const SESSIONS: TelehealthSession[] = [
  {
    id: 'TH-001', patientId: 'p5', date: '2026-07-22', time: '9:00 AM', duration: 50,
    modality: 'Individual Therapy', provider: 'David Odom, LCADC',
    status: 'Completed', platform: 'Doxy.me',
    joinUrl: 'https://doxy.me/davidodom', techCheckDone: true, insuranceAuth: true, consentOnFile: true,
    sessionNotes: 'Patient connected on time. Discussed court date anxiety and relapse triggers. Reviewed safety plan. Assigned Step 3 worksheet.',
    billingCode: '90837-GT', location: 'Home (Rockville, MD)',
  },
  {
    id: 'TH-002', patientId: 'p12', date: '2026-07-22', time: '10:30 AM', duration: 50,
    modality: 'Medication Management', provider: 'Dr. Emma Hughes, MD',
    status: 'In Progress', platform: 'Zoom for Healthcare',
    joinUrl: 'https://zoom.us/j/sunrise-hughes', techCheckDone: true, insuranceAuth: true, consentOnFile: true,
    billingCode: '99213-GT', location: 'Home (Brentwood, MD)',
  },
  {
    id: 'TH-003', patientId: 'p7', date: '2026-07-22', time: '1:00 PM', duration: 50,
    modality: 'Individual Therapy', provider: 'Sarah Jenkins, LCPC',
    status: 'Scheduled', platform: 'Doxy.me',
    joinUrl: 'https://doxy.me/sarahjenkins', techCheckDone: true, insuranceAuth: true, consentOnFile: true,
    billingCode: '90837-GT', location: 'Home (Franklin, MD)',
  },
  {
    id: 'TH-004', patientId: 'p3', date: '2026-07-22', time: '2:30 PM', duration: 50,
    modality: 'Psychiatric Evaluation', provider: 'Dr. Emma Hughes, MD',
    status: 'Scheduled', platform: 'Zoom for Healthcare',
    joinUrl: 'https://zoom.us/j/sunrise-hughes', techCheckDone: false, insuranceAuth: true, consentOnFile: true,
    billingCode: '90792-GT', location: 'Home (Rockville, MD)',
  },
  {
    id: 'TH-005', patientId: 'p15', date: '2026-07-22', time: '4:00 PM', duration: 30,
    modality: 'Case Management', provider: 'Maria Gonzalez, LCADC',
    status: 'Scheduled', platform: 'Doxy.me',
    joinUrl: 'https://doxy.me/mariagonzalez', techCheckDone: true, insuranceAuth: false, consentOnFile: true,
    billingCode: 'T1017-GT', location: 'Sober Living (Rockville, MD)',
  },
  {
    id: 'TH-006', patientId: 'p20', date: '2026-07-18', time: '11:00 AM', duration: 50,
    modality: 'Individual Therapy', provider: 'David Odom, LCADC',
    status: 'No Show', platform: 'Doxy.me',
    techCheckDone: true, insuranceAuth: true, consentOnFile: true,
    sessionNotes: 'Patient did not connect. Called cell — no answer. Left voicemail. Will follow up per no-show protocol. Two consecutive no-shows — outreach to emergency contact warranted.',
    billingCode: '90837-GT', location: 'Unknown',
  },
  {
    id: 'TH-007', patientId: 'p8', date: '2026-07-18', time: '3:00 PM', duration: 50,
    modality: 'Family Session', provider: 'Sarah Jenkins, LCPC',
    status: 'Completed', platform: 'Zoom for Healthcare',
    joinUrl: 'https://zoom.us/j/sunrise-jenkins', techCheckDone: true, insuranceAuth: true, consentOnFile: true,
    sessionNotes: 'Patient and wife attended. Discussed communication patterns, enabling behaviors, and family recovery plan. Wife to attend Al-Anon. Next family session in 2 weeks.',
    billingCode: '90847-GT', location: 'Home (Rockville, MD)',
  },
  {
    id: 'TH-008', patientId: 'p16', date: '2026-07-17', time: '10:00 AM', duration: 50,
    modality: 'Individual Therapy', provider: 'Maria Gonzalez, LCADC',
    status: 'Tech Failure', platform: 'Doxy.me',
    techCheckDone: false, insuranceAuth: true, consentOnFile: true,
    sessionNotes: 'Patient connected but audio failed both sides. Session conducted by phone (modifier applied). Audio issue linked to patient\'s outdated device — tech support email sent.',
    billingCode: '90837-PH', location: 'Home (Clarksville, MD)',
  },
];

const STATUS_STYLE: Record<SessionStatus, string> = {
  'Scheduled':    'bg-blue-100 text-blue-700',
  'In Progress':  'bg-green-100 text-green-700 animate-pulse',
  'Completed':    'bg-gray-100 text-gray-600',
  'No Show':      'bg-red-100 text-red-700',
  'Tech Failure': 'bg-amber-100 text-amber-700',
  'Cancelled':    'bg-gray-100 text-gray-500',
};

const PLATFORM_STYLE: Record<string, string> = {
  'Doxy.me':                    'bg-teal-100 text-teal-700',
  'Zoom for Healthcare':        'bg-blue-100 text-blue-700',
  'Microsoft Teams (HIPAA)':    'bg-purple-100 text-purple-700',
};

const TECH_CHECK_ITEMS = ['Camera', 'Microphone', 'Internet speed ≥ 10 Mbps', 'Private location confirmed', 'HIPAA notice reviewed', 'Emergency address on file'];

export function TelehealthConsults({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Today' | 'Upcoming' | 'History' | 'TechCheck' | 'Settings' | 'Analytics' | 'Platform Guide'>('Today');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [techCheckSaved, setTechCheckSaved] = useState(false);

  const todaySessions = SESSIONS.filter(s => s.date === '2026-07-22');
  const historySessions = SESSIONS.filter(s => s.date < '2026-07-22');
  const inProgressSession = SESSIONS.find(s => s.status === 'In Progress');

  const completedToday = todaySessions.filter(s => s.status === 'Completed').length;
  const scheduledToday = todaySessions.filter(s => s.status === 'Scheduled').length;
  const noShows7d = SESSIONS.filter(s => s.status === 'No Show').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Telehealth Consults</h1>
          <p className="text-slate text-sm mt-0.5">HIPAA-compliant virtual sessions · Zoom for Healthcare · Doxy.me</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setNewSessionOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Session
        </LockedButton>
      </div>

      {inProgressSession && (() => {
        const p = MOCK_PATIENTS.find(pt => pt.id === inProgressSession.patientId);
        return (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="font-bold text-green-800 flex items-center gap-2"><Video className="w-4 h-4" /> Session In Progress</div>
              <div className="text-sm text-green-700">{p?.firstName} {p?.lastName} · {inProgressSession.modality} with {inProgressSession.provider} · Started {inProgressSession.time}</div>
            </div>
            <a href={inProgressSession.joinUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <ExternalLink className="w-4 h-4" /> Rejoin Session
            </a>
          </div>
        );
      })()}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Sessions', value: todaySessions.length, sub: `${completedToday} done · ${scheduledToday} upcoming`, color: 'text-navy' },
          { label: 'In Progress Now', value: inProgressSession ? 1 : 0, sub: inProgressSession ? `${inProgressSession.modality}` : 'None active', color: inProgressSession ? 'text-green-600' : 'text-slate' },
          { label: 'No Shows (7 Days)', value: noShows7d, sub: 'Outreach required', color: noShows7d > 2 ? 'text-red-600' : 'text-navy' },
          { label: 'Tech Issues (7 Days)', value: SESSIONS.filter(s => s.status === 'Tech Failure').length, sub: 'Protocol: switch to phone', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Today', 'Upcoming', 'History', 'TechCheck', 'Settings', 'Analytics', 'Platform Guide'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {(tab === 'Today' || tab === 'Upcoming') && (() => {
        const sessions = tab === 'Today' ? todaySessions : SESSIONS.filter(s => s.date >= '2026-07-22' && s.status === 'Scheduled');
        return (
          <div className="space-y-3">
            {sessions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-sm font-semibold text-navy">No telehealth sessions scheduled</div>
                <div className="text-xs text-slate mt-1">Use "Schedule Session" above to add a new appointment.</div>
              </div>
            )}
            {sessions.map(session => {
              const p = MOCK_PATIENTS.find(pt => pt.id === session.patientId);
              const isSelected = selectedSession === session.id;
              return (
                <div key={session.id} className={`border rounded-xl overflow-hidden ${session.status === 'In Progress' ? 'border-green-400' : session.status === 'No Show' ? 'border-red-300' : 'border-border'}`}>
                  <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedSession(isSelected ? null : session.id)}>
                    <div className={`p-2 rounded-lg ${session.status === 'Completed' || session.status === 'In Progress' ? 'bg-green-100' : session.status === 'No Show' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {session.status === 'No Show' ? <VideoOff className="w-5 h-5 text-red-600" /> : <Video className={`w-5 h-5 ${session.status === 'In Progress' ? 'text-green-600' : 'text-blue-600'}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button className="font-bold text-navy hover:text-orange text-sm" onClick={e => { e.stopPropagation(); if (p) navigate('PatientDetail', p.id); }}>
                          {p?.firstName} {p?.lastName}
                        </button>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[session.status]}`}>{session.status}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${PLATFORM_STYLE[session.platform]}`}>{session.platform}</span>
                        {!session.techCheckDone && session.status === 'Scheduled' && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Tech Check Needed</span>
                        )}
                        {!session.insuranceAuth && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Auth Needed</span>
                        )}
                      </div>
                      <div className="text-xs text-slate mt-0.5">
                        {session.date} · {session.time} · {session.duration} min · {session.modality} · {session.provider}
                      </div>
                    </div>
                    {session.status === 'Scheduled' && session.joinUrl && (
                      <a href={session.joinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy/90">
                        <Video className="w-3.5 h-3.5" /> Start Session
                      </a>
                    )}
                  </div>
                  {isSelected && (
                    <div className="border-t border-border px-5 py-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-slate uppercase font-semibold mb-2">Session Details</div>
                          <div className="space-y-1 text-xs">
                            <div><span className="text-slate">Billing Code:</span> <span className="font-semibold text-navy ml-1">{session.billingCode || 'Pending'}</span></div>
                            <div><span className="text-slate">Platform:</span> <span className="font-semibold text-navy ml-1">{session.platform}</span></div>
                            <div><span className="text-slate">Patient Location:</span> <span className="font-semibold text-navy ml-1">{session.location}</span></div>
                            <div><span className="text-slate">Consent on File:</span> <span className={`font-semibold ml-1 ${session.consentOnFile ? 'text-green-600' : 'text-red-600'}`}>{session.consentOnFile ? 'Yes' : 'No — Required'}</span></div>
                            <div><span className="text-slate">Insurance Auth:</span> <span className={`font-semibold ml-1 ${session.insuranceAuth ? 'text-green-600' : 'text-red-600'}`}>{session.insuranceAuth ? 'Authorized' : 'Not Authorized'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate uppercase font-semibold mb-2">Tech Check</div>
                          <div className="space-y-1">
                            {TECH_CHECK_ITEMS.map((item, i) => (
                              <div key={i} className={`flex items-center gap-2 text-xs ${session.techCheckDone ? 'text-green-700' : 'text-slate'}`}>
                                {session.techCheckDone ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate uppercase font-semibold mb-2">Session Notes</div>
                          {session.sessionNotes
                            ? <p className="text-xs text-navy leading-relaxed">{session.sessionNotes}</p>
                            : <textarea className="w-full border border-border rounded-lg px-2 py-1.5 text-xs resize-none" rows={5} placeholder="Session notes..." />
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {tab === 'History' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate">
            <span>Showing last 7 days of completed/attempted sessions</span>
            <span>Total: {historySessions.length} sessions</span>
          </div>
          {historySessions.map(session => {
            const p = MOCK_PATIENTS.find(pt => pt.id === session.patientId);
            return (
              <div key={session.id} className="card flex items-center gap-4">
                <div className={`p-2 rounded-lg ${session.status === 'Completed' ? 'bg-green-100' : session.status === 'No Show' ? 'bg-red-100' : 'bg-amber-100'}`}>
                  {session.status === 'No Show' ? <VideoOff className="w-4 h-4 text-red-600" /> : session.status === 'Tech Failure' ? <Wifi className="w-4 h-4 text-amber-600" /> : <Video className="w-4 h-4 text-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button className="font-semibold text-navy hover:text-orange text-sm" onClick={() => p && navigate('PatientDetail', p.id)}>{p?.firstName} {p?.lastName}</button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[session.status]}`}>{session.status}</span>
                  </div>
                  <div className="text-xs text-slate">{session.date} · {session.time} · {session.modality} · {session.provider} · {session.billingCode}</div>
                  {session.sessionNotes && <div className="text-xs text-navy mt-1 italic truncate max-w-lg">"{session.sessionNotes}"</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'TechCheck' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-navy mb-1">Pre-Session Technology Check</h3>
            <p className="text-sm text-slate">Complete before each telehealth session. Document in patient record. CMS requires clinician to verify patient location (state) and ensure patient has access to emergency services.</p>
          </div>
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">Select Patient for Tech Check</h3>
            <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <div className="space-y-3">
              {TECH_CHECK_ITEMS.map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-4 h-4 accent-orange" />
                  <span className="text-sm text-navy">{item}</span>
                </label>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Patient location today (required by CMS — must document state)</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Home — 123 Main St, Rockville, MD 20850" />
              </div>
            </div>
            {techCheckSaved ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Tech check saved — documented in patient record
              </div>
            ) : (
              <LockedButton locked={readOnly} onClick={() => { setTechCheckSaved(true); setTimeout(() => setTechCheckSaved(false), 3000); }} className="btn-primary text-sm px-5 py-2">Save Tech Check</LockedButton>
            )}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy mb-3">No-Show Protocol</h3>
            <div className="space-y-2 text-sm text-navy">
              {[
                '1. Wait 10 minutes past scheduled start time before documenting as No Show',
                '2. Attempt phone contact — document call attempt and outcome',
                '3. Leave voicemail if no answer — do not discuss clinical details',
                '4. Notify primary counselor and clinical director if second consecutive no-show',
                '5. Contact emergency contact if clinically indicated (safety concern)',
                '6. Document in chart: time, attempts made, disposition',
                '7. Bill: 90837-95 is not billable for no-show — use facility no-show policy',
              ].map((s, i) => <div key={i}>{s}</div>)}
            </div>
          </div>
        </div>
      )}

      {tab === 'Settings' && (
        <div className="max-w-2xl space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-navy">Platform Configuration</h3>
            {[
              { label: 'Primary Platform', value: 'Doxy.me (HIPAA Business Associate Agreement on file)' },
              { label: 'Secondary Platform', value: 'Zoom for Healthcare (HIPAA BAA on file)' },
              { label: 'BAA Status', value: 'Current — renews 2027-01-01' },
              { label: 'State Licensure Coverage', value: 'Maryland, Kentucky, Alabama, Georgia' },
              { label: 'Medicare Telehealth Authorization', value: 'Active — Rural Health Waiver (PL 117-328)' },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-slate">{s.label}</span>
                <span className="text-sm font-semibold text-navy">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-navy">Billing Modifiers</h3>
            <div className="text-xs text-slate mb-2">Applied automatically based on platform and patient location</div>
            {[
              { code: '-95', desc: 'Synchronous telehealth via interactive audio/video' },
              { code: '-GT', desc: 'Interactive audio and video telecommunication systems (Medicare)' },
              { code: '-FQ', desc: 'Service rendered via telehealth using audio-only (phone fallback)' },
              { code: '-PH', desc: 'Telephone-only service (when video fails per documentation)' },
            ].map(b => (
              <div key={b.code} className="flex gap-3 items-start py-1.5 border-b border-border last:border-0">
                <span className="font-mono font-bold text-navy text-sm w-10 shrink-0">{b.code}</span>
                <span className="text-sm text-slate">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {newSessionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="font-bold text-navy text-lg">Schedule Telehealth Session</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate mb-1">Patient *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              {[
                { label: 'Date', type: 'date', defaultValue: '2026-07-20' },
                { label: 'Time', type: 'time', defaultValue: '10:00' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-slate mb-1">{f.label}</label>
                  <input type={f.type} defaultValue={f.defaultValue} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Modality</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Individual Therapy','Group Therapy','Psychiatric Evaluation','Medication Management','Family Session','Case Management'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Platform</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Doxy.me</option>
                  <option>Zoom for Healthcare</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setNewSessionOpen(false)} className="flex-1 border border-border text-slate rounded-lg px-4 py-2 text-sm">Cancel</button>
              <LockedButton locked={readOnly} onClick={() => setNewSessionOpen(false)} className="flex-1 btn-primary text-sm">Schedule Session</LockedButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Telehealth program metrics — session volume, completion rates, platform performance, and patient engagement.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Sessions (30d)', value: 84, color: 'text-navy', sub: '↑ 22% vs prior month' },
              { label: 'Completion Rate', value: '91%', color: 'text-green-600', sub: 'No-show/cancel: 9%' },
              { label: 'Avg Session Length', value: '48min', color: 'text-blue-600', sub: 'Target: 45–60 min' },
              { label: 'Patient Satisfaction', value: '4.6/5', color: 'text-teal-600', sub: 'n=71 responses' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Session Volume by Type</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { type: 'Individual Therapy', count: 38, pct: 45, color: 'bg-blue-500' },
                  { type: 'Psychiatric Evaluation', count: 21, pct: 25, color: 'bg-purple-500' },
                  { type: 'Medication Management', count: 14, pct: 17, color: 'bg-teal-500' },
                  { type: 'Family / Multi-party Session', count: 8, pct: 10, color: 'bg-orange-400' },
                  { type: 'Case Management Check-in', count: 3, pct: 4, color: 'bg-gray-400' },
                ].map(s => (
                  <div key={s.type}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{s.type}</span>
                      <span className="font-semibold text-navy">{s.count} ({s.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${s.color}`} style={{ width: `${s.pct * 1.8}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Platform Performance (30d)</h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {[
                      { metric: 'Sessions with tech issues', value: '4%', ok: true },
                      { metric: 'Avg wait time to connect', value: '1.8 min', ok: true },
                      { metric: 'Dropped calls / reconnects', value: '2.4%', ok: true },
                      { metric: 'Mobile device usage', value: '61%', ok: true },
                      { metric: 'Provider on-time rate', value: '94%', ok: true },
                      { metric: 'No-show rate', value: '6%', ok: true },
                    ].map(r => (
                      <tr key={r.metric} className="hover:bg-gray-50">
                        <td className="py-2 text-slate">{r.metric}</td>
                        <td className="py-2 text-right font-semibold text-navy">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                <strong>Program Note:</strong> Telehealth volume grew 22% MoM driven by IOP participants and step-down patients maintaining care after residential discharge. Rural access expansion accounts for 31% of new telehealth enrollments.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Platform Guide' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Telehealth platform reference — technical requirements, HIPAA-compliant platform comparison, DEA telehealth prescribing rules, and troubleshooting quick guide.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">DEA Telehealth Prescribing Rules — Post-PHE Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 font-medium">
                  Post-COVID PHE rules: DEA has extended temporary flexibilities through 2025. Current policy allows buprenorphine initiation via telehealth without an in-person exam for existing and new patients.
                </div>
                {[
                  { rule: 'Buprenorphine (Schedule III)', detail: 'May be initiated and continued via telehealth without prior in-person visit under current DEA rules. Audio-video required; audio-only NOT sufficient for initial prescribing.' },
                  { rule: 'Stimulants (Schedule II)', detail: 'CANNOT be initiated via telehealth without a prior in-person visit per DEA rules. Continuation of existing prescriptions may be allowed under certain conditions — verify with Medical Director.' },
                  { rule: 'Benzodiazepines (Schedule IV)', detail: 'May be initiated via audio-video telehealth if the prescriber has established a valid patient-provider relationship. Document medical necessity.' },
                  { rule: 'Platform requirement', detail: 'Must use HIPAA-compliant, DEA-compliant audio-video platform. Consumer platforms (FaceTime, Zoom free) are NOT compliant. See approved platforms below.' },
                ].map(r => (
                  <div key={r.rule} className="border border-border rounded-lg p-2.5">
                    <div className="font-semibold text-navy">{r.rule}</div>
                    <div className="text-slate mt-0.5">{r.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Approved HIPAA-Compliant Platforms at Sunrise</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 text-slate">
                      {['Platform', 'Use Case', 'DEA Compliant', 'BAA', 'Status'].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { platform: 'Doxy.me (Clinical)', use: 'All telehealth visits', dea: '✓', baa: '✓ On file', status: 'Primary' },
                      { platform: 'Epic MyChart Video', use: 'EHR-integrated visits', dea: '✓', baa: '✓ On file', status: 'Active' },
                      { platform: 'Zoom for Healthcare', use: 'Group sessions, psych consults', dea: '✓', baa: '✓ On file', status: 'Active' },
                      { platform: 'Spruce Health', use: 'Secure messaging + video', dea: '✓', baa: '✓ On file', status: 'Active' },
                    ].map(r => (
                      <tr key={r.platform} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-medium text-navy">{r.platform}</td>
                        <td className="px-2 py-1.5 text-slate">{r.use}</td>
                        <td className="px-2 py-1.5 text-center text-green-600">{r.dea}</td>
                        <td className="px-2 py-1.5 text-green-600">{r.baa}</td>
                        <td className="px-2 py-1.5"><span className={`text-[9px] font-bold px-1 py-0.5 rounded ${r.status === 'Primary' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-2">Troubleshooting Quick Reference</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { issue: 'Patient cannot connect', fix: 'Verify browser is Chrome/Edge (not Safari); clear cache; check mic/camera permissions' },
                    { issue: 'Video freezing / poor quality', fix: 'Ask patient to move closer to router, close background tabs, switch to audio-only if <5 Mbps' },
                    { issue: 'Audio echo or feedback', fix: 'One party should use headphones; mute when not speaking' },
                    { issue: 'Session drops unexpectedly', fix: 'Rejoin from visit link; document "technical interruption" in note' },
                    { issue: 'Patient cannot locate link', fix: 'Resend from platform dashboard; have patient check spam folder' },
                  ].map(t => (
                    <div key={t.issue} className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">{t.issue}:</span>
                      <span className="text-navy">{t.fix}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {techCheckSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> Tech check documented in patient record
        </div>
      )}
    </div>
  );
}
