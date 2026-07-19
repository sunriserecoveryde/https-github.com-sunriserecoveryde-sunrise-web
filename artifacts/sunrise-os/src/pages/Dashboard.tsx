import React from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { OccupancyRing } from '../components/ui/OccupancyRing';
import { AlertTriangle, Clock, Flag as FlagIcon, ChevronRight, UserPlus, FileText, AlertOctagon, Droplets } from 'lucide-react';
import { Screen } from '../App';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const CENSUS_TREND = [
  { date: 'Jun 19', census: 16, capacity: 22 },
  { date: 'Jun 22', census: 17, capacity: 22 },
  { date: 'Jun 24', census: 19, capacity: 22 },
  { date: 'Jun 27', census: 18, capacity: 22 },
  { date: 'Jun 29', census: 20, capacity: 22 },
  { date: 'Jul 1',  census: 21, capacity: 22 },
  { date: 'Jul 3',  census: 20, capacity: 22 },
  { date: 'Jul 6',  census: 19, capacity: 22 },
  { date: 'Jul 8',  census: 20, capacity: 22 },
  { date: 'Jul 10', census: 21, capacity: 22 },
  { date: 'Jul 12', census: 20, capacity: 22 },
  { date: 'Jul 14', census: 19, capacity: 22 },
  { date: 'Jul 16', census: 21, capacity: 22 },
  { date: 'Jul 18', census: 20, capacity: 22 },
  { date: 'Jul 19', census: 18, capacity: 22 },
];

const ADMISSIONS_TREND = [
  { week: 'W1 Jun', admissions: 4, discharges: 3 },
  { week: 'W2 Jun', admissions: 5, discharges: 4 },
  { week: 'W3 Jun', admissions: 3, discharges: 2 },
  { week: 'W4 Jun', admissions: 6, discharges: 5 },
  { week: 'W1 Jul', admissions: 4, discharges: 4 },
  { week: 'W2 Jul', admissions: 5, discharges: 3 },
  { week: 'W3 Jul', admissions: 2, discharges: 3 },
];

export function Dashboard({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const highRiskPatients = MOCK_PATIENTS.filter(p => p.amaRisk === 'High').slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-border px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
        <div className="font-medium text-navy">
          <span className="text-sunrise-orange font-bold mr-2">Clinical Director</span>
          Sunrise Recovery Center
        </div>
        <div className="flex gap-4 text-sm text-slate">
          <span>Active Census: <strong className="text-navy">18/22</strong></span>
          <span>Shift: <strong className="text-navy">Day</strong></span>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        <div className="bg-high-bg border border-high/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-high" />
          <span className="text-sm font-medium text-navy"><strong>AMA Risk Alert:</strong> 2 clients flagged HIGH for early departure</span>
        </div>
        <div className="bg-moderate-bg border border-moderate/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-moderate" />
          <span className="text-sm font-medium text-navy">4 co-sign requests pending from primary counselors</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard title="Census" value="18/22" subtitle="81.8% Occupancy" color="orange" onClick={() => navigate('CensusBedBoard')} />
        <MetricCard title="AMA Risk" value="2" subtitle="High Risk Clients" color="red" onClick={() => navigate('RiskDashboard')} />
        <MetricCard title="Pending Co-signs" value="4" subtitle="Action Required" color="amber" onClick={() => navigate('CosignQueue')} />
        <MetricCard title="Avg LOS" value="18.4" subtitle="Days" trend={{ value: '1.2', direction: 'down' }} color="blue" onClick={() => navigate('OutcomeTracking')} />
        <MetricCard title="Discharges" value="3" subtitle="This Week" color="green" onClick={() => navigate('Discharges')} />
      </div>

      {/* Main 2-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-border">
            <h3 className="font-bold text-navy mb-4">Program Utilization</h3>
            <div className="flex items-center gap-6 mb-6">
              <OccupancyRing percentage={81.8} />
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate">Residential</span>
                    <span className="text-navy font-bold">8/10</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sunrise-blue h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate">PHP</span>
                    <span className="text-navy font-bold">5/6</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sunrise-orange h-2 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate">IOP</span>
                    <span className="text-navy font-bold">5/6</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple h-2 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="font-bold text-navy mb-3 mt-8">Recovery Engagement Score</h3>
            <div className="bg-bg p-4 rounded-md border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate">Average Score</span>
                <span className="text-xl font-bold text-navy">72/100</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden mt-2">
                <div className="bg-critical" style={{ width: '10%' }} title="Low: 10%"></div>
                <div className="bg-sunrise-amber" style={{ width: '30%' }} title="Med: 30%"></div>
                <div className="bg-success" style={{ width: '60%' }} title="High: 60%"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy p-6 rounded-lg shadow-sm border-l-4 border-l-sunrise-orange relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="text-sunrise-orange">☀</span> AI Clinical Brief
            </h3>
            <p className="text-slate-300 text-sm mb-4">Generated summary of today's critical action items across the census.</p>
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded text-sm">
                <strong className="text-sunrise-orange">Marcus Webb (Res):</strong> High AMA risk reported during morning group. Expressed severe cravings. Dr. Chen adjusting Suboxone. Action: Counselor Sarah Jenkins needs to conduct 1:1 check-in before lunch.
              </div>
              <div className="bg-white/10 p-3 rounded text-sm">
                <strong className="text-sunrise-orange">Samantha Choi (Res):</strong> Restricted meals for last 24h. Psychiatric flags active. Action: Schedule immediate consult with Dr. Stone; dietary monitoring required.
              </div>
              <div className="bg-white/10 p-3 rounded text-sm">
                <strong className="text-sunrise-orange">Devon Patel (Res):</strong> Recent UA returned positive for Methamphetamine. Mild paranoia noted in nursing notes. Action: Hold from group therapy today, initiate behavioral protocol.
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-navy">Priority Clients</h3>
              <button onClick={() => navigate('PatientList')} className="text-sm text-sunrise-blue font-medium hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-4 rounded-tl">Flags</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Prog</th>
                    <th className="p-3">Acuity</th>
                    <th className="p-3">RES</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {highRiskPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                      <td className="p-3 pl-4">
                        <div className="flex gap-1">
                          {p.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} />)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                          <div>
                            <div className="font-bold text-navy">{p.firstName} {p.lastName}</div>
                            <div className="text-[10px] text-slate">{p.mrn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold text-slate">{p.program}</span>
                      </td>
                      <td className="p-3">
                        <AcuityBadge acuity={p.amaRisk === 'High' ? 'Critical' : 'High'} />
                      </td>
                      <td className="p-3">
                        <RecoveryScoreBadge score={p.recoveryScore} />
                      </td>
                      <td className="p-3">
                        <button className="text-sunrise-blue text-xs font-medium hover:underline">Review Chart</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border rounded-lg px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy">Quick Actions</span>
          <span className="text-xs text-slate">Common tasks for today</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: 'New Admission', icon: UserPlus, screen: 'Admissions' as Screen, color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
            { label: 'New Progress Note', icon: FileText, screen: 'ProgressNotes' as Screen, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
            { label: 'Co-sign Queue (4)', icon: FileText, screen: 'CosignQueue' as Screen, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
            { label: 'UA Results', icon: Droplets, screen: 'UADrugTesting' as Screen, color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
            { label: 'Open Incidents (2)', icon: AlertTriangle, screen: 'IncidentReporting' as Screen, color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
            { label: 'Chart Deficiencies', icon: Clock, screen: 'ChartReview' as Screen, color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
          ].map(({ label, icon: Icon, screen, color }) => (
            <button key={label} onClick={() => navigate(screen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Census Trend + Admissions */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-navy text-sm">30-Day Census Trend</h3>
            <button onClick={() => navigate('CensusBedBoard')} className="text-xs text-sunrise-blue font-medium hover:underline flex items-center gap-1">
              Bed Board <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate mb-4">Daily census vs. 22-bed capacity</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="censusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8761A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E8761A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number, name: string) => [v, name === 'census' ? 'Census' : 'Capacity']} />
              <Area type="monotone" dataKey="capacity" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" fill="url(#capGrad)" name="capacity" />
              <Area type="monotone" dataKey="census" stroke="#E8761A" strokeWidth={2} fill="url(#censusGrad)" name="census" dot={{ r: 2.5, fill: '#E8761A' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-navy text-sm">Weekly Admissions vs. Discharges</h3>
            <button onClick={() => navigate('Admissions')} className="text-xs text-sunrise-blue font-medium hover:underline flex items-center gap-1">
              Admissions <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate mb-4">7-week flow — admissions in, discharges out</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ADMISSIONS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="admissions" fill="#3B9ED4" radius={[3, 3, 0, 0]} name="Admissions" />
              <Bar dataKey="discharges" fill="#E8761A" radius={[3, 3, 0, 0]} name="Discharges" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
