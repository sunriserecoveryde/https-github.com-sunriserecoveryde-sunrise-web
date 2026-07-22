import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, Phone, Calendar, TrendingUp, Heart, Star, AlertTriangle, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

interface AlumniRecord {
  id: string;
  name: string;
  dischargeDate: string;
  program: string;
  los: number;
  primaryDx: string;
  onMat: boolean;
  contacts: {
    type: '30-Day' | '60-Day' | '90-Day' | '6-Month' | '12-Month';
    date?: string;
    outcome: 'Sober' | 'Relapse' | 'In Treatment' | 'Hospitalized' | 'No Answer' | 'Pending';
    notes?: string;
  }[];
  currentStatus: 'Sober' | 'Unknown' | 'Relapse' | 'In Treatment' | 'Deceased';
  alumniEvents: string[];
  satisfaction: number; // 1-5
  testimonial?: string;
}

const ALUMNI: AlumniRecord[] = [
  {
    id: 'ALM-001', name: 'David Chen', dischargeDate: '2026-04-15', program: 'Residential', los: 35,
    primaryDx: 'Opioid Use Disorder, Severe', onMat: true,
    contacts: [
      { type: '30-Day', date: '2026-05-15', outcome: 'Sober', notes: 'Doing well. Suboxone maintained. Working part-time.' },
      { type: '60-Day', date: '2026-06-15', outcome: 'Sober', notes: 'Full-time employment resumed. Attending NA 3x/week.' },
      { type: '90-Day', date: '2026-07-15', outcome: 'Sober', notes: 'Celebrated 90-day chip at NA. Sponsor relationship strong. Volunteering at church.' },
      { type: '6-Month', outcome: 'Pending' },
    ],
    currentStatus: 'Sober', alumniEvents: ['July 4th Cookout', 'Monthly Alumni Meeting 6/7'],
    satisfaction: 5, testimonial: 'Sunrise saved my life. I had been to 4 other programs before this one. The staff actually cared — not just about my addiction but about me as a person. 90 days sober today.',
  },
  {
    id: 'ALM-002', name: 'Sarah Mitchell', dischargeDate: '2026-03-22', program: 'PHP', los: 28,
    primaryDx: 'Alcohol Use Disorder, Severe', onMat: false,
    contacts: [
      { type: '30-Day', date: '2026-04-22', outcome: 'Sober', notes: 'Doing well. AA daily. Licensed therapist resumed practice.' },
      { type: '60-Day', date: '2026-05-22', outcome: 'Sober', notes: 'Applying for CAC-AD certification. Wants to work in addiction counseling.' },
      { type: '90-Day', date: '2026-06-22', outcome: 'Sober', notes: '92 days. Presented her recovery story at alumni meeting.' },
      { type: '6-Month', date: '2026-09-22', outcome: 'Pending' },
    ],
    currentStatus: 'Sober', alumniEvents: ['Monthly Alumni Meeting 5/4', 'Alumni Speaker 6/3'],
    satisfaction: 5, testimonial: 'As a therapist, I thought I had everything under control. Sunrise showed me that getting help is the bravest thing you can do, not the weakest.',
  },
  {
    id: 'ALM-003', name: 'James Torres', dischargeDate: '2026-01-10', program: 'Residential', los: 21,
    primaryDx: 'Opioid Use Disorder, Severe / PTSD', onMat: true,
    contacts: [
      { type: '30-Day', date: '2026-02-10', outcome: 'Sober' },
      { type: '60-Day', date: '2026-03-10', outcome: 'Relapse', notes: 'Patient disclosed brief use (3 days) — re-engaged with outpatient immediately.' },
      { type: '90-Day', date: '2026-04-10', outcome: 'In Treatment', notes: 'Entered IOP after relapse — now 30 days sober again.' },
      { type: '6-Month', date: '2026-07-10', outcome: 'Sober', notes: '120 days sober since IOP completion. VA therapy weekly.' },
    ],
    currentStatus: 'Sober', alumniEvents: ['Veterans\' Alumni Dinner 5/28'],
    satisfaction: 4, testimonial: 'I relapsed — and Sunrise still answered my call. They helped me get back into treatment the same day.',
  },
  {
    id: 'ALM-004', name: 'Linda Patterson', dischargeDate: '2025-12-01', program: 'IOP', los: 12,
    primaryDx: 'Alcohol Use Disorder, Moderate', onMat: false,
    contacts: [
      { type: '30-Day', date: '2026-01-01', outcome: 'Sober' },
      { type: '60-Day', date: '2026-02-01', outcome: 'Relapse', notes: 'Holiday stress. Returned to drinking 12/26.' },
      { type: '90-Day', date: '2026-03-01', outcome: 'No Answer' },
      { type: '6-Month', date: '2026-06-01', outcome: 'No Answer' },
      { type: '12-Month', outcome: 'Pending' },
    ],
    currentStatus: 'Unknown', alumniEvents: [],
    satisfaction: 3,
  },
  {
    id: 'ALM-005', name: 'Marcus Ellis', dischargeDate: '2025-11-15', program: 'Residential', los: 42,
    primaryDx: 'Methamphetamine Use Disorder, Severe', onMat: false,
    contacts: [
      { type: '30-Day', date: '2025-12-15', outcome: 'Sober' },
      { type: '60-Day', date: '2026-01-15', outcome: 'Sober' },
      { type: '90-Day', date: '2026-02-15', outcome: 'Sober' },
      { type: '6-Month', date: '2026-05-15', outcome: 'Sober', notes: '8 months sober. Employed full-time. In recovery coaching training.' },
      { type: '12-Month', outcome: 'Pending' },
    ],
    currentStatus: 'Sober', alumniEvents: ['Monthly Alumni Meeting 6/7', 'July 4th Cookout', 'Alumni Speaker — June Recovery Walk'],
    satisfaction: 5, testimonial: '8 months. Never thought I\'d say that. The long-term residential gave me the time I needed to actually change, not just detox.',
  },
  {
    id: 'ALM-006', name: 'Kim Nakamura', dischargeDate: '2026-05-01', program: 'PHP', los: 18,
    primaryDx: 'Alcohol Use Disorder, Severe / MDD', onMat: false,
    contacts: [
      { type: '30-Day', date: '2026-06-01', outcome: 'Sober', notes: 'Continuing IOP step-down. Lexapro helping.' },
      { type: '60-Day', date: '2026-07-01', outcome: 'Sober', notes: 'Completed IOP. Starting weekly outpatient.' },
      { type: '90-Day', outcome: 'Pending' },
    ],
    currentStatus: 'Sober', alumniEvents: ['Monthly Alumni Meeting 6/7'],
    satisfaction: 4,
  },
];

const OUTCOME_TREND = [
  { month: 'Feb', sober: 72, relapse: 18, unknown: 10 },
  { month: 'Mar', sober: 74, relapse: 16, unknown: 10 },
  { month: 'Apr', sober: 78, relapse: 15, unknown: 7 },
  { month: 'May', sober: 81, relapse: 12, unknown: 7 },
  { month: 'Jun', sober: 82, relapse: 11, unknown: 7 },
  { month: 'Jul', sober: 83, relapse: 10, unknown: 7 },
];

const OUTCOME_PIE = [
  { name: 'Sober', value: 83, color: '#2ECC71' },
  { name: 'Unknown', value: 7, color: '#95a5a6' },
  { name: 'Relapse', value: 10, color: '#E74C3C' },
];

const CONTACT_RATES = [
  { period: '30-Day', rate: 95 },
  { period: '60-Day', rate: 88 },
  { period: '90-Day', rate: 82 },
  { period: '6-Month', rate: 75 },
  { period: '12-Month', rate: 62 },
];

const OUTCOME_COLOR: Record<string, string> = {
  'Sober':        'bg-green-100 text-green-700',
  'Relapse':      'bg-red-100 text-red-700',
  'In Treatment': 'bg-blue-100 text-blue-700',
  'Hospitalized': 'bg-red-200 text-red-800',
  'No Answer':    'bg-gray-100 text-gray-600',
  'Pending':      'bg-amber-100 text-amber-700',
  'Unknown':      'bg-gray-100 text-gray-600',
  'Deceased':     'bg-gray-800 text-white',
};

const UPCOMING_EVENTS = [
  { date: '2026-08-01', event: 'Monthly Alumni Meeting', location: 'Sunrise Recovery, Sunrise Room', time: '6:00 PM' },
  { date: '2026-08-07', event: 'Recovery Walk Rockville', location: 'Croydon Creek Nature Center', time: '9:00 AM — All alumni welcome' },
  { date: '2026-08-15', event: 'Alumni Family BBQ', location: 'Sunrise Recovery, Outdoor Pavilion', time: '12:00 PM noon' },
  { date: '2026-09-06', event: 'Monthly Alumni Meeting + 1-Year Chip Ceremony', location: 'Sunrise Recovery', time: '6:00 PM' },
];

export function AlumniProgram({ navigate, readOnly }: Props) {
  const [tab, setTab] = useState<'Alumni' | 'Outcomes' | 'Events' | 'Testimonials' | 'Re-admission' | 'Engagement Analytics'>('Alumni');
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [callSaved, setCallSaved] = useState<string | null>(null);
  const saveAlumniAction = (msg: string) => { setCallSaved(msg); setTimeout(() => setCallSaved(null), 2500); };

  const soberCount = ALUMNI.filter(a => a.currentStatus === 'Sober').length;
  const pendingCalls = ALUMNI.flatMap(a => a.contacts).filter(c => c.outcome === 'Pending').length;
  const avgSatisfaction = Math.round(ALUMNI.filter(a => a.satisfaction).reduce((sum, a) => sum + a.satisfaction, 0) / ALUMNI.filter(a => a.satisfaction).length * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Alumni Program</h1>
          <p className="text-slate text-sm mt-0.5">Post-discharge outcomes, 30/60/90 day follow-up, alumni events, and recovery success stories</p>
        </div>
        <LockedButton locked={readOnly} onClick={() => setCallLogOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Phone className="w-4 h-4" /> Log Follow-up Call</LockedButton>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Alumni in Program', value: ALUMNI.length, sub: 'Post-discharge tracking', color: 'text-navy' },
          { label: 'Known Sober', value: `${soberCount}/${ALUMNI.length}`, sub: `${Math.round(soberCount/ALUMNI.length*100)}% recovery rate`, color: 'text-green-600' },
          { label: 'Calls Pending', value: pendingCalls, sub: 'Scheduled follow-ups', color: pendingCalls > 3 ? 'text-amber-600' : 'text-navy' },
          { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, sub: 'Discharge survey score', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Alumni', 'Outcomes', 'Events', 'Testimonials', 'Re-admission', 'Engagement Analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Alumni' && (
        <div className="space-y-4">
          {ALUMNI.map(alum => (
            <div key={alum.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {alum.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{alum.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLOR[alum.currentStatus]}`}>{alum.currentStatus}</span>
                      {alum.onMat && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">On MAT</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">
                      Discharged {alum.dischargeDate} · {alum.program} · {alum.los} days · {alum.primaryDx}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < alum.satisfaction ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>

              {/* Follow-up contacts timeline */}
              <div className="flex gap-3 flex-wrap">
                {alum.contacts.map(c => (
                  <div key={c.type} className={`px-3 py-2 rounded-lg border text-center min-w-[80px] ${c.outcome === 'Pending' ? 'border-dashed border-amber-300 bg-amber-50' : 'border-border'}`}>
                    <div className="text-[10px] text-slate font-semibold">{c.type}</div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 ${OUTCOME_COLOR[c.outcome]}`}>{c.outcome}</div>
                    {c.date && <div className="text-[10px] text-slate mt-0.5">{c.date.slice(5)}</div>}
                    {c.outcome === 'Pending' && <button onClick={() => saveAlumniAction('Call logged')} className="text-[10px] text-orange hover:underline mt-1 block">Log Call</button>}
                  </div>
                ))}
              </div>

              {alum.testimonial && (
                <div className="bg-navy/5 border border-navy/10 rounded-lg px-4 py-3 text-sm text-navy italic">
                  "{alum.testimonial}"
                </div>
              )}

              {alum.alumniEvents.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate">
                  <span className="font-semibold">Events attended:</span>
                  {alum.alumniEvents.map((e, i) => (
                    <span key={i} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Outcomes' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">30-Day Outcome Distribution (Current Cohort)</h3>
            <p className="text-xs text-slate mb-3">Alumni with known outcomes</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={OUTCOME_PIE} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {OUTCOME_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-0.5">Recovery Rate Trend (6 Months)</h3>
            <p className="text-xs text-slate mb-3">% alumni in confirmed recovery at each checkpoint</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={OUTCOME_TREND} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line dataKey="sober" stroke="#2ECC71" strokeWidth={2.5} dot={{ r: 3 }} name="Sober" />
                <Line dataKey="relapse" stroke="#E74C3C" strokeWidth={2} dot={{ r: 3 }} name="Relapse" />
                <Line dataKey="unknown" stroke="#95a5a6" strokeWidth={2} dot={{ r: 3 }} name="Unknown" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card col-span-2">
            <h3 className="font-semibold text-navy text-sm mb-3">Follow-up Contact Rate by Period</h3>
            <div className="flex items-end gap-3">
              {CONTACT_RATES.map(c => (
                <div key={c.period} className="flex-1 text-center">
                  <div className="text-sm font-bold text-navy">{c.rate}%</div>
                  <div className="w-full bg-gray-100 rounded-t-lg" style={{ height: '80px', position: 'relative' }}>
                    <div className="absolute bottom-0 w-full bg-orange rounded-t-lg" style={{ height: `${c.rate * 0.8}px` }} />
                  </div>
                  <div className="text-xs text-slate mt-1">{c.period}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate">
              <span className="text-green-600 font-semibold">✓ SAMHSA NOMs target (≥75%)</span> met for 30-day, 60-day, and 90-day contact periods. <span className="text-amber-600 font-semibold">⚠ 6-month exactly at threshold.</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'Events' && (
        <div className="space-y-4">
          <div className="card bg-orange/5 border-orange/20">
            <div className="font-semibold text-navy mb-1">Alumni Program Overview</div>
            <div className="text-sm text-slate leading-relaxed">
              The Sunrise Alumni Program provides ongoing community support and connection for graduates of our residential, PHP, and IOP programs. Monthly meetings, quarterly events, a peer mentorship network, and 30/60/90/180-day follow-up calls are provided at no cost to alumni. Alumni can also volunteer as speakers and peer supports.
            </div>
          </div>
          <div className="space-y-3">
            {UPCOMING_EVENTS.map((ev, i) => (
              <div key={i} className="card flex items-center gap-4">
                <div className="w-16 text-center shrink-0">
                  <div className="text-xs font-bold text-orange uppercase">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div className="text-2xl font-bold text-navy">{new Date(ev.date).getDate()}</div>
                </div>
                <div className="border-l border-border pl-4 flex-1">
                  <div className="font-semibold text-navy">{ev.event}</div>
                  <div className="text-xs text-slate mt-0.5">{ev.location} · {ev.time}</div>
                </div>
                <button onClick={() => saveAlumniAction('Invitation sent')} className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Invite Alumni</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Testimonials' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">
            Alumni testimonials (shared with written consent) — used for public recovery messaging and program marketing.
          </div>
          {ALUMNI.filter(a => a.testimonial).map(alum => (
            <div key={alum.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-navy text-white font-bold text-sm flex items-center justify-center">{alum.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <div className="font-semibold text-navy">{alum.name}</div>
                  <div className="text-xs text-slate">{alum.program} Graduate · {alum.dischargeDate} · {alum.primaryDx.split(',')[0]}</div>
                </div>
                <div className="flex ml-auto gap-0.5">
                  {Array.from({ length: alum.satisfaction }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
              </div>
              <blockquote className="text-navy italic text-sm leading-relaxed border-l-4 border-orange pl-4">
                "{alum.testimonial}"
              </blockquote>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLOR[alum.currentStatus]}`}>{alum.currentStatus}</span>
                {alum.onMat && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">On MAT</span>}
                <span className="text-xs text-slate ml-1">Consent to share: on file</span>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => saveAlumniAction('Testimonial updated')} className="text-xs border border-border text-slate px-3 py-1 rounded-lg hover:bg-gray-50">Edit</button>
                  <LockedButton locked={readOnly} onClick={() => saveAlumniAction('Added to marketing library')} className="text-xs btn-primary px-3 py-1">Use in Marketing</LockedButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Re-admission' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '30-Day Readmission Rate', value: '22%', sub: 'Target: <15%', color: 'text-red-600' },
              { label: 'AMA Returns', value: 4, sub: 'In last 90 days', color: 'text-amber-600' },
              { label: 'Planned Readmissions', value: 2, sub: 'Step-up from OP/IOP', color: 'text-blue-600' },
              { label: 'Avg Days to Readmit', value: '12.4', sub: 'Post-discharge', color: 'text-navy' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Readmission Risk Factors</h3>
              <div className="space-y-2.5">
                {[
                  { factor: 'Left AMA on previous admission', odds: '3.8×', pct: 95 },
                  { factor: 'Housing instability at discharge', odds: '2.9×', pct: 73 },
                  { factor: 'No IOP/OP step-down arranged', odds: '2.4×', pct: 60 },
                  { factor: 'No MAT at discharge (OUD patients)', odds: '2.1×', pct: 53 },
                  { factor: 'Missing 30-day follow-up call', odds: '1.7×', pct: 43 },
                  { factor: 'No peer sponsor/support identified', odds: '1.4×', pct: 35 },
                ].map(r => (
                  <div key={r.factor}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{r.factor}</span>
                      <span className="font-bold text-red-600">{r.odds}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
                <div className="text-[10px] text-slate pt-1">Odds ratios vs. population without factor. Source: internal outcomes data + SAMHSA literature.</div>
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-navy text-sm">Protective Factors at Discharge</h3>
              {[
                { factor: 'IOP / OP step-down scheduled before discharge', pct: 72 },
                { factor: 'MAT continued into outpatient (OUD patients)', pct: 68 },
                { factor: 'Stable housing confirmed', pct: 61 },
                { factor: 'Peer specialist assigned for 30d post-discharge', pct: 55 },
                { factor: 'Alumni program enrolled', pct: 83 },
                { factor: '30-day follow-up call completed', pct: 77 },
              ].map(r => (
                <div key={r.factor}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate">{r.factor}</span><span className="font-bold text-green-600">{r.pct}%</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${r.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-navy text-sm">Alumni Who Readmitted — Case Review</h3>
              <span className="text-xs text-slate">Last 90 days · 6 readmissions</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-slate">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Alumni</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Original DC</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Days Out</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Trigger</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Protective Gaps</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'M. Webb', dc: '2026-04-15', days: 14, trigger: 'Relationship conflict / stress', gaps: 'No step-down, unstable housing', type: 'Unplanned' },
                  { name: 'D. Patel', dc: '2026-05-02', days: 9, trigger: 'Pain medication misuse', gaps: 'No MAT, no peer sponsor', type: 'Unplanned' },
                  { name: 'A. Monroe', dc: '2026-05-20', days: 22, trigger: 'Employment loss', gaps: 'Step-down missed first appt', type: 'Planned step-up' },
                  { name: 'R. Navarro', dc: '2026-06-01', days: 7, trigger: 'Return to using environment', gaps: 'Housing unstable, no peer support', type: 'Unplanned' },
                  { name: 'L. Farris', dc: '2026-06-10', days: 18, trigger: 'Anxiety / PTSD escalation', gaps: 'No MAT, missed 30-day call', type: 'Unplanned' },
                  { name: 'S. Choi', dc: '2026-06-28', days: 5, trigger: 'OD — Naloxone reversed', gaps: 'No MAT, no peer, no step-down', type: 'Emergency' },
                ].map(r => (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate">{r.dc}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-navy">{r.days}d</td>
                    <td className="px-4 py-2.5 text-slate">{r.trigger}</td>
                    <td className="px-4 py-2.5 text-slate">{r.gaps}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.type === 'Emergency' ? 'bg-red-100 text-red-700' : r.type === 'Unplanned' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Engagement Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Alumni engagement metrics — activity rates, touchpoint frequency, re-engagement success, and program ROI for the trailing 12 months.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Alumni (Active)', value: 142, color: 'text-navy', sub: 'Opted into alumni program' },
              { label: 'Monthly Engagement Rate', value: '54%', color: 'text-green-600', sub: '77 of 142 engaged last 30d' },
              { label: 'Event Attendance Rate', value: '38%', color: 'text-blue-600', sub: 'Avg across monthly events' },
              { label: '12-Month Sobriety (Alumni)', value: '61%', color: 'text-teal-600', sub: 'Self-reported at check-in' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">Engagement by Touchpoint Type</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { type: 'Monthly Check-in Call', completions: 61, pct: 43, color: 'bg-blue-500' },
                  { type: 'Alumni Group Meeting', completions: 41, pct: 29, color: 'bg-teal-500' },
                  { type: 'App / Portal Login', completions: 58, pct: 41, color: 'bg-purple-500' },
                  { type: 'Event Attendance', completions: 27, pct: 19, color: 'bg-orange-400' },
                  { type: 'Sponsor/Mentorship Contact', completions: 22, pct: 15, color: 'bg-green-500' },
                  { type: 'Crisis Line Utilized', completions: 4, pct: 3, color: 'bg-red-400' },
                ].map(t => (
                  <div key={t.type}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{t.type}</span>
                      <span className="font-semibold text-navy">{t.completions} alumni ({t.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${t.color}`} style={{ width: `${t.pct * 1.8}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Alumni Engagement → Re-admission Correlation</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { group: 'High engagement (≥3 touchpoints/mo)', readmit: '7%', sob12: '74%', n: 38 },
                    { group: 'Moderate engagement (1–2/mo)', readmit: '14%', sob12: '62%', n: 51 },
                    { group: 'Low engagement (<1/mo)', readmit: '27%', sob12: '48%', n: 53 },
                  ].map(g => (
                    <div key={g.group} className="border border-border rounded p-2.5">
                      <div className="font-medium text-navy mb-0.5">{g.group} (n={g.n})</div>
                      <div className="flex gap-4 text-slate">
                        <span>Re-admission rate: <strong className="text-red-600">{g.readmit}</strong></span>
                        <span>12-mo sobriety: <strong className="text-green-600">{g.sob12}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
                <strong>Program Insight:</strong> Alumni with ≥3 engagement touchpoints per month have 3.9× lower re-admission rates vs. disengaged alumni. Investment in engagement coordination has measurable bed and revenue impact.
              </div>
            </div>
          </div>
        </div>
      )}

      {callLogOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCallLogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2"><Phone className="w-5 h-5 text-orange-500" /> Log Follow-up Call</h2>
              <button onClick={() => setCallLogOpen(false)} className="text-slate hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Alumni *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Aiden K. — 90-day follow-up</option><option>Priya R. — 60-day follow-up</option><option>Devon Price — 30-day follow-up</option><option>Marcus T. — 90-day follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Follow-up Milestone</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>30-day post-discharge</option><option>60-day post-discharge</option><option>90-day post-discharge</option><option>6-month check-in</option><option>1-year anniversary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Contact Outcome</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Reached — maintaining sobriety</option><option>Reached — relapse disclosed</option><option>Reached — re-admission requested</option><option>Voicemail left</option><option>Disconnected / wrong number</option><option>No answer — no VM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Mood / Stability (1–5)</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>5 — Thriving, stable</option><option>4 — Doing well</option><option>3 — Managing</option><option>2 — Struggling</option><option>1 — Crisis / urgent concern</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase mb-1">Notes</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[70px] resize-none" placeholder="What did the alumni share? Any safety concerns, referrals made, next steps..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setCallLogOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm text-slate hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setCallLogOpen(false); saveAlumniAction('Follow-up call logged'); }} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold">Save Call Log</button>
            </div>
          </div>
        </div>
      )}

      {callSaved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" /> {callSaved}
        </div>
      )}
    </div>
  );
}
