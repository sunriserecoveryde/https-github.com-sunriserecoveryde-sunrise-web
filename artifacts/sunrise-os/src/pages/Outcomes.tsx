import React, { useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { Award, TrendingDown, Target, ShieldCheck, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const losData = [
  { day: 'Jan', actual: 28.4, target: 25 }, { day: 'Feb', actual: 26.1, target: 25 },
  { day: 'Mar', actual: 27.8, target: 25 }, { day: 'Apr', actual: 25.3, target: 25 },
  { day: 'May', actual: 24.7, target: 25 }, { day: 'Jun', actual: 23.9, target: 25 },
  { day: 'Jul', actual: 24.1, target: 25 },
];

const retentionData = [
  { day: 'D-7', pct: 91 }, { day: 'D-14', pct: 82 }, { day: 'D-21', pct: 74 },
  { day: 'D-28', pct: 68 }, { day: 'D-60', pct: 57 }, { day: 'D-90', pct: 51 },
];

const qualityData = [
  { subject: 'Completion', A: 72, fullMark: 100 },
  { subject: 'Sobriety', A: 61, fullMark: 100 },
  { subject: 'Documentation', A: 94, fullMark: 100 },
  { subject: 'Satisfaction', A: 88, fullMark: 100 },
  { subject: 'Safety', A: 97, fullMark: 100 },
  { subject: 'Engagement', A: 83, fullMark: 100 },
];

const sudOutcomes = [
  { month: 'Jan', completed: 8, ama: 3 }, { month: 'Feb', completed: 10, ama: 2 },
  { month: 'Mar', completed: 9, ama: 4 }, { month: 'Apr', completed: 12, ama: 2 },
  { month: 'May', completed: 11, ama: 3 }, { month: 'Jun', completed: 13, ama: 1 },
  { month: 'Jul', completed: 7, ama: 2 },
];

const Outcomes: React.FC = () => {
  const [tab, setTab] = useState<'Overview' | 'Treatment Outcomes' | 'Patient Satisfaction' | 'Quality Measures' | 'Benchmarks'>('Overview');

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy flex items-center gap-2">
            <Award className="text-success" /> Analytics &amp; Outcomes
          </h1>
          <p className="text-[13px] text-slate-light font-medium mt-1">SUD treatment performance metrics, patient outcomes, and quality indicators — rolling 12 months.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Overview', 'Treatment Outcomes', 'Patient Satisfaction', 'Quality Measures', 'Benchmarks'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Program Completion Rate" value="72%" trend="up" trendValue="+4% vs. Q1" color="green" />
            <MetricCard label="Avg LOS (Residential)" value="24.1d" trend="down" trendValue="-4.3d vs. goal" color="blue" />
            <MetricCard label="AMA Rate" value="11%" trend="down" trendValue="-2% vs. Q1" color="teal" />
            <MetricCard label="90-Day Sobriety (Alumni)" value="61%" trend="up" trendValue="+6% vs. prior yr" color="purple" trendGood={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-4">
                <TrendingDown size={16} className="text-sunrise-blue" /> Avg LOS Trend — Residential (Days)
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={losData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} domain={[15, 35]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} name="Actual LOS" />
                    <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target LOS" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-4">
                <Users size={16} className="text-sunrise-orange" /> Completions vs. AMA Discharges
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sudOutcomes} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Bar dataKey="completed" fill="#22C55E" radius={[3, 3, 0, 0]} name="Completed" barSize={12} />
                    <Bar dataKey="ama" fill="#EF4444" radius={[3, 3, 0, 0]} name="AMA" barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Key Outcome Snapshot</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { metric: 'Completed Tx per ASAM recommendation', value: '72%', target: '≥75%', status: 'Below' },
                { metric: '30-Day sobriety at discharge', value: '89%', target: '≥85%', status: 'Met' },
                { metric: '90-Day sobriety (alumni survey)', value: '61%', target: '≥60%', status: 'Met' },
                { metric: 'Family session participation', value: '54%', target: '≥60%', status: 'Below' },
                { metric: 'Employment or school at discharge', value: '38%', target: '≥40%', status: 'Below' },
                { metric: 'Stable housing at discharge', value: '81%', target: '≥80%', status: 'Met' },
                { metric: 'Follow-up appointment kept (30d)', value: '67%', target: '≥70%', status: 'Below' },
                { metric: 'Naloxone kit dispensed at discharge', value: '94%', target: '100%', status: 'Below' },
              ].map(r => (
                <div key={r.metric} className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium text-slate mb-1">{r.metric}</div>
                  <div className="text-xl font-bold text-navy">{r.value}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate">Target: {r.target}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status === 'Met' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Treatment Outcomes' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Program Completion', value: '72%', color: 'text-green-600', sub: '+4% vs. Q1 2026' },
              { label: 'AMA Discharge Rate', value: '11%', color: 'text-amber-600', sub: 'Goal: <10%' },
              { label: 'Avg Length of Stay', value: '24.1d', color: 'text-navy', sub: 'Residential program' },
              { label: 'Detox Completion', value: '88%', color: 'text-green-600', sub: 'CIWA protocol' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-4">
              Treatment Retention Curve — % Still Engaged
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="pct" stroke="#7C3AED" strokeWidth={3} dot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }} name="% Retained" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Discharge Disposition Analysis</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Disposition</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Count</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">%</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { disp: 'Planned completion — step down to PHP', n: 34, pct: 42, trend: '↑' },
                    { disp: 'Planned completion — home / outpatient', n: 24, pct: 30, trend: '↑' },
                    { disp: 'AMA — Against Medical Advice', n: 9, pct: 11, trend: '↓' },
                    { disp: 'Transfer — Higher LOC (hospital/psych)', n: 7, pct: 9, trend: '→' },
                    { disp: 'Administrative discharge', n: 4, pct: 5, trend: '→' },
                    { disp: 'Deceased / Medical emergency', n: 2, pct: 3, trend: '→' },
                  ].map(r => (
                    <tr key={r.disp} className="hover:bg-gray-50">
                      <td className="py-2 text-navy text-xs">{r.disp}</td>
                      <td className="py-2 text-center font-semibold text-navy">{r.n}</td>
                      <td className="py-2 text-center text-slate">{r.pct}%</td>
                      <td className={`py-2 text-center font-bold ${r.trend === '↑' ? 'text-green-600' : r.trend === '↓' ? 'text-red-600' : 'text-slate'}`}>{r.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Post-Discharge Alumni Survey (90 Days)</h3>
              <div className="space-y-3 text-xs">
                {[
                  { q: 'Abstinent from all substances', y: 61, label: '61%' },
                  { q: 'Stable housing (no homelessness)', y: 81, label: '81%' },
                  { q: 'Employed or enrolled in school', y: 38, label: '38%' },
                  { q: 'Engaged in outpatient tx / recovery support', y: 67, label: '67%' },
                  { q: 'Not re-hospitalized for SUD', y: 84, label: '84%' },
                  { q: 'Would recommend this program', y: 91, label: '91%' },
                ].map(r => (
                  <div key={r.q}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{r.q}</span>
                      <span className="font-bold text-navy">{r.label}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${r.y >= 75 ? 'bg-green-500' : r.y >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${r.y}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-[10px] text-slate italic">Based on 87 alumni surveyed · 68% response rate · Alumni team follow-up via phone</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Patient Satisfaction' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overall Satisfaction', value: '4.4/5', color: 'text-green-600', sub: 'avg CAHPS score' },
              { label: 'Would Recommend', value: '91%', color: 'text-green-600', sub: '"Definitely Yes"' },
              { label: 'Staff Responsiveness', value: '4.6/5', color: 'text-green-600', sub: 'top quartile' },
              { label: 'Surveys Collected', value: 112, color: 'text-navy', sub: 'This quarter' },
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
              <h3 className="font-semibold text-navy text-sm mb-3">CAHPS-SUD Domain Scores (1–5 Scale)</h3>
              <div className="space-y-3 text-xs">
                {[
                  { domain: 'Communication with Counselors', score: 4.6, max: 5 },
                  { domain: 'Communication with Medical Staff', score: 4.5, max: 5 },
                  { domain: 'Responsiveness of Staff', score: 4.6, max: 5 },
                  { domain: 'Pain/Withdrawal Management', score: 4.2, max: 5 },
                  { domain: 'Treatment Environment (Safety, Cleanliness)', score: 4.4, max: 5 },
                  { domain: 'Discharge Information / Planning', score: 3.9, max: 5 },
                  { domain: 'Family Inclusion in Treatment', score: 3.7, max: 5 },
                  { domain: 'Overall Program Rating', score: 4.4, max: 5 },
                ].map(d => (
                  <div key={d.domain}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{d.domain}</span>
                      <span className="font-bold text-navy">{d.score}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${d.score >= 4.3 ? 'bg-green-500' : d.score >= 4.0 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${(d.score / d.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Representative Patient Comments</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { comment: '"The counselors actually listened and didn\'t judge me. I\'ve been to other places and this was different — they treated me like a person."', stars: 5, anon: 'Residential, 30 days' },
                    { comment: '"Medical staff were excellent, especially with withdrawal. I was scared coming in and they made me feel safe."', stars: 5, anon: 'Detox, 7 days' },
                    { comment: '"I wish there had been more family sessions. My relationship with my kids is why I got sober, and I wanted them more involved."', stars: 4, anon: 'Residential, 28 days' },
                    { comment: '"The discharge planning could be better — I felt rushed at the end and wasn\'t totally clear on next steps."', stars: 3, anon: 'PHP, 14 days' },
                  ].map(c => (
                    <div key={c.anon} className="border border-border rounded-lg p-3">
                      <div className="text-yellow-400 text-sm mb-1">{'★'.repeat(c.stars)}{'☆'.repeat(5 - c.stars)}</div>
                      <p className="text-slate italic leading-relaxed">{c.comment}</p>
                      <div className="text-[10px] text-slate mt-1">— Anonymous · {c.anon}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>Improvement Focus:</strong> Discharge planning (3.9/5) and family inclusion (3.7/5) are consistently the lowest-rated domains. Staff training and scheduling adjustments recommended for Q3.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Quality Measures' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-purple" /> Quality Domain Radar
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.4} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">CARF / SAMHSA Required Quality Indicators</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-slate">
                    <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Indicator</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Current</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Threshold</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { ind: 'Program completion rate', cur: '72%', thr: '≥70%', ok: true },
                    { ind: 'MAT assessment within 24h of admit', cur: '97%', thr: '≥95%', ok: true },
                    { ind: 'Discharge summary within 5 days', cur: '88%', thr: '≥95%', ok: false },
                    { ind: 'Incident report filed within 24h', cur: '100%', thr: '100%', ok: true },
                    { ind: 'ASAM level documented at admit', cur: '100%', thr: '100%', ok: true },
                    { ind: 'Suicide risk screened at admit', cur: '100%', thr: '100%', ok: true },
                    { ind: 'Continuing care plan at discharge', cur: '91%', thr: '≥95%', ok: false },
                    { ind: 'Patient rights signed at admit', cur: '100%', thr: '100%', ok: true },
                  ].map(r => (
                    <tr key={r.ind} className="hover:bg-gray-50">
                      <td className="py-2 text-navy text-xs">{r.ind}</td>
                      <td className="py-2 text-center font-semibold text-navy">{r.cur}</td>
                      <td className="py-2 text-center text-slate">{r.thr}</td>
                      <td className="py-2 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.ok ? 'Met' : 'Below'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Safety Events', items: ['0 medication errors causing harm (12 months)', '1 fall with minor injury — root cause completed', '0 patient elopements', '2 restraint/seclusion events — both reviewed'] },
              { title: 'Documentation Quality', items: ['94% of notes co-signed within 24h', '88% discharge summaries filed ≤5 days', '3 chart deficiencies pending — CosignQueue', '100% ASAM assessments documented'] },
              { title: 'Regulatory Compliance', items: ['CARF Accreditation — current (exp 2027)', '42 CFR Part 2 audit — passed March 2026', 'TN BHSO licensure — current', 'SAMHSA OTP certification — N/A (OBOT only)'] },
            ].map(s => (
              <div key={s.title} className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">{s.title}</h3>
                <div className="space-y-1.5 text-xs">
                  {s.items.map(i => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                      <span className="text-slate leading-relaxed">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'Benchmarks' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Sunrise Recovery Center outcome benchmarks against SAMHSA national averages and CARF-accredited SUD treatment programs.</div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Key Outcome Metrics vs. National</h3>
              <div className="space-y-3 text-xs">
                {[
                  { metric: 'Treatment Completion Rate', sunrise: 68, national: 54, tq: 78 },
                  { metric: '30-Day Sobriety (Post-Discharge)', sunrise: 66, national: 52, tq: 74 },
                  { metric: '90-Day Sobriety (Alumni Survey)', sunrise: 62, national: 48, tq: 70 },
                  { metric: 'Employment at 6 Months', sunrise: 38, national: 31, tq: 52 },
                  { metric: 'Housing Stability at 90 Days', sunrise: 61, national: 55, tq: 74 },
                  { metric: 'Patient Satisfaction (CSAT ≥4)', sunrise: 89, national: 76, tq: 92 },
                ].map(m => (
                  <div key={m.metric}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate">{m.metric}</span>
                      <div className="flex gap-3 text-[10px]">
                        <span className="font-bold text-navy">{m.sunrise}%</span>
                        <span className="text-slate">Natl: {m.national}%</span>
                        <span className="text-teal-600">TQ: {m.tq}%</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full">
                      <div className="absolute h-2 rounded-full bg-navy" style={{ width: `${m.sunrise}%` }} />
                      <div className="absolute top-0 w-0.5 h-2 bg-gray-400" style={{ left: `${m.national}%` }} />
                      <div className="absolute top-0 w-0.5 h-2 bg-teal-400" style={{ left: `${m.tq}%` }} />
                    </div>
                    <div className="flex gap-2 mt-0.5 text-[9px] text-slate">
                      <span className="flex items-center gap-1"><span className="inline-block w-2 h-1 bg-navy rounded" />Sunrise</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-0.5 h-3 bg-gray-400" />National avg</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-0.5 h-3 bg-teal-400" />Top quartile</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Accreditation &amp; Recognition</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { body: 'CARF International', status: '3-Year Accreditation', year: '2024–2027', color: 'bg-green-100 text-green-700' },
                    { body: 'SAMHSA OTP Certification', status: 'Active', year: 'Renewed 2025', color: 'bg-green-100 text-green-700' },
                    { body: 'TN Dept. of Mental Health', status: 'Licensed', year: 'Annual', color: 'bg-blue-100 text-blue-700' },
                    { body: 'Joint Commission', status: 'Pending Application', year: '2027 target', color: 'bg-amber-100 text-amber-700' },
                  ].map(a => (
                    <div key={a.body} className="flex items-center justify-between border border-border rounded p-2">
                      <div>
                        <div className="font-semibold text-navy">{a.body}</div>
                        <div className="text-slate">{a.year}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.color}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
                <strong>Performance Summary:</strong> Sunrise outperforms national averages on all tracked metrics and is above national average on 4 of 6 top-quartile comparators. Employment and housing outcomes represent the strongest opportunity for improvement.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outcomes;
