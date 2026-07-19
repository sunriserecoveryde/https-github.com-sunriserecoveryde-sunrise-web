import React, { useState } from 'react';
import { Screen } from '../App';
import { CheckCircle, Phone, Calendar, TrendingUp, Heart, Star, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

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
      { type: '90-Day', date: '2026-07-15', outcome: 'Sober', notes: 'Celebrated 90-day chip at NA. Sponsor relationship strong. Volunterring at church.' },
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
      { type: '60-Day', date: '2026-05-22', outcome: 'Sober', notes: 'Applying for CADC certification. Wants to work in addiction counseling.' },
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
  { date: '2026-08-07', event: 'Recovery Walk Nashville', location: 'Riverfront Park', time: '9:00 AM — All alumni welcome' },
  { date: '2026-08-15', event: 'Alumni Family BBQ', location: 'Sunrise Recovery, Outdoor Pavilion', time: '12:00 PM noon' },
  { date: '2026-09-06', event: 'Monthly Alumni Meeting + 1-Year Chip Ceremony', location: 'Sunrise Recovery', time: '6:00 PM' },
];

export function AlumniProgram({ navigate }: Props) {
  const [tab, setTab] = useState<'Alumni' | 'Outcomes' | 'Events' | 'Testimonials'>('Alumni');

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
        <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Phone className="w-4 h-4" /> Log Follow-up Call</button>
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
        {(['Alumni', 'Outcomes', 'Events', 'Testimonials'] as const).map(t => (
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
                    {c.outcome === 'Pending' && <button className="text-[10px] text-orange hover:underline mt-1 block">Log Call</button>}
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
                <button className="text-xs border border-border text-slate px-3 py-1.5 rounded-lg hover:bg-gray-50">Invite Alumni</button>
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
                  <button className="text-xs border border-border text-slate px-3 py-1 rounded-lg hover:bg-gray-50">Edit</button>
                  <button className="text-xs btn-primary px-3 py-1">Use in Marketing</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
