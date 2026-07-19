import React from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { OccupancyRing } from '../components/ui/OccupancyRing';
import { AlertTriangle, Clock, ChevronRight, UserPlus, FileText, Droplets, DollarSign, TrendingUp, BarChart3, Users } from 'lucide-react';
import { Screen } from '../App';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useRole } from '../context/RoleContext';

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

const REVENUE_TREND = [
  { month: 'Jan', collected: 420, billed: 510 },
  { month: 'Feb', collected: 390, billed: 480 },
  { month: 'Mar', collected: 460, billed: 530 },
  { month: 'Apr', collected: 490, billed: 560 },
  { month: 'May', collected: 510, billed: 590 },
  { month: 'Jun', collected: 530, billed: 615 },
  { month: 'Jul', collected: 310, billed: 380 },
];

export function Dashboard({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const { role, canAccessScreen } = useRole();
  const highRiskPatients = MOCK_PATIENTS.filter(p => p.amaRisk === 'High').slice(0, 8);

  // Determine dashboard view — mutually exclusive, priority order
  type DashView = 'clinical' | 'bht' | 'financial' | 'operations' | 'bizdev' | 'hr' | 'aftercare' | 'admin';
  const dashView: DashView =
    role.id === 'bht'                    ? 'bht'        :
    role.id === 'billing_staff' ||
    role.id === 'accounting_staff' ||
    role.id === 'ownership'              ? 'financial'  :
    role.id === 'director_of_operations' ||
    role.id === 'bht_supervisor'         ? 'operations' :
    role.id === 'business_development'   ? 'bizdev'     :
    role.id === 'human_resources'        ? 'hr'         :
    role.id === 'aftercare_staff'        ? 'aftercare'  :
    ['Clinical', 'Medical', 'Nursing & Direct Care'].includes(role.category) ? 'clinical' :
    'admin';

  const isClinical   = dashView === 'clinical';
  const isBHT        = dashView === 'bht';
  const isFinancial  = dashView === 'financial';
  const isOperations = dashView === 'operations';
  const isBizDev     = dashView === 'bizdev';
  const isHR         = dashView === 'hr';
  const isAftercare  = dashView === 'aftercare';
  const isAdmin      = dashView === 'admin';

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className={`border px-4 py-3 rounded-lg shadow-sm flex items-center justify-between ${role.color} ${role.borderColor}`}>
        <div className="font-medium text-white">
          <span className={`font-bold mr-2 ${role.textColor}`}>{role.label}</span>
          <span className="text-slate-300">— Sunrise Recovery Center</span>
        </div>
        <div className="flex gap-4 text-sm text-slate-300">
          <span>Active Census: <strong className="text-white">18/22</strong></span>
          <span>Shift: <strong className="text-white">Day</strong></span>
          {isFinancial && <span>MTD Revenue: <strong className="text-white">$310K</strong></span>}
          {isHR && <span>Staff Count: <strong className="text-white">12 active</strong></span>}
        </div>
      </div>

      {/* ── CLINICAL VIEW ──────────────────────────────────────────────────── */}
      {isClinical && !isBHT && (
        <>
          {/* Alerts */}
          <div className="space-y-2">
            <div className="bg-high-bg border border-high/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-high" />
              <span className="text-sm font-medium text-navy"><strong>AMA Risk Alert:</strong> 2 clients flagged HIGH for early departure</span>
            </div>
            {canAccessScreen('CosignQueue') && (
              <div className="bg-moderate-bg border border-moderate/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
                <Clock className="w-5 h-5 text-moderate" />
                <span className="text-sm font-medium text-navy">4 co-sign requests pending from primary counselors</span>
              </div>
            )}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <MetricCard title="Census" value="18/22" subtitle="81.8% Occupancy" color="orange" onClick={() => navigate('CensusBedBoard')} />
            {canAccessScreen('RiskDashboard') && <MetricCard title="AMA Risk" value="2" subtitle="High Risk Clients" color="red" onClick={() => navigate('RiskDashboard')} />}
            {canAccessScreen('CosignQueue') && <MetricCard title="Pending Co-signs" value="4" subtitle="Action Required" color="amber" onClick={() => navigate('CosignQueue')} />}
            <MetricCard title="Avg LOS" value="18.4" subtitle="Days" trend={{ value: '1.2', direction: 'down' }} color="blue" onClick={() => navigate('OutcomeTracking')} />
            {canAccessScreen('Discharges') && <MetricCard title="Discharges" value="3" subtitle="This Week" color="green" onClick={() => navigate('Discharges')} />}
          </div>

          {/* Main 2-Col */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-navy mb-4">Program Utilization</h3>
                <div className="flex items-center gap-6 mb-6">
                  <OccupancyRing percentage={81.8} />
                  <div className="flex-1 space-y-4">
                    {[
                      { label: 'Residential', val: '8/10', pct: '80%', color: 'bg-sunrise-blue' },
                      { label: 'PHP', val: '5/6', pct: '83%', color: 'bg-sunrise-orange' },
                      { label: 'IOP', val: '5/6', pct: '83%', color: 'bg-purple' },
                    ].map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate">{p.label}</span>
                          <span className="text-navy font-bold">{p.val}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`${p.color} h-2 rounded-full`} style={{ width: p.pct }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {canAccessScreen('RecoveryEngagementScore') && (
                  <>
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
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* AI Clinical Brief — clinical roles only */}
              <div className="bg-navy p-6 rounded-lg shadow-sm border-l-4 border-l-sunrise-orange relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-sunrise-orange">&#9728;</span> AI Clinical Brief
                </h3>
                <p className="text-slate-300 text-sm mb-4">Generated summary of today&apos;s critical action items across the census.</p>
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

              {/* Priority Clients table — only for roles with patient access */}
              {canAccessScreen('PatientDetail') && (
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
                            <td className="p-3"><span className="text-xs font-semibold text-slate">{p.program}</span></td>
                            <td className="p-3"><AcuityBadge acuity={p.amaRisk === 'High' ? 'Critical' : 'High'} /></td>
                            <td className="p-3"><RecoveryScoreBadge score={p.recoveryScore} /></td>
                            <td className="p-3">
                              <button className="text-sunrise-blue text-xs font-medium hover:underline">Review Chart</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                { label: 'Chart Review', icon: Clock, screen: 'ChartReview' as Screen, color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
              ].filter(a => canAccessScreen(a.screen)).map(({ label, icon: Icon, screen, color }) => (
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

            {canAccessScreen('Admissions') ? (
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
                    <Bar dataKey="admissions" fill="#3B9ED4" radius={[3,3,0,0]} name="Admissions" />
                    <Bar dataKey="discharges" fill="#E8761A" radius={[3,3,0,0]} name="Discharges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-navy text-sm mb-4">Group Schedule Today</h3>
                <div className="space-y-2">
                  {[
                    { time: '9:00 AM', group: 'Morning Meditation', room: 'Rm 1', count: 8 },
                    { time: '10:30 AM', group: 'CBT Skills Group', room: 'Rm 2', count: 6 },
                    { time: '1:00 PM', group: 'Relapse Prevention', room: 'Rm 1', count: 10 },
                    { time: '3:00 PM', group: 'Process Group', room: 'Rm 3', count: 7 },
                  ].map(g => (
                    <div key={g.time} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="font-medium text-navy text-sm">{g.group}</div>
                        <div className="text-xs text-slate">{g.time} · {g.room}</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{g.count} clients</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── BHT VIEW ───────────────────────────────────────────────────────── */}
      {isBHT && (
        <>
          <div className="bg-moderate-bg border border-moderate/20 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
            <Users className="w-5 h-5 text-moderate" />
            <span className="text-sm font-medium text-navy">3 clients need 15-minute checks this hour. See shift handoff for assignments.</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Active Census" value="18" subtitle="Clients on unit" color="blue" onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Groups Today" value="4" subtitle="Scheduled sessions" color="green" onClick={() => navigate('GroupSchedule')} />
            <MetricCard title="Open Incidents" value="2" subtitle="Needs follow-up" color="red" onClick={() => navigate('IncidentReporting')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy mb-3">Today&apos;s Group Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM', group: 'Morning Meditation', room: 'Rm 1' },
                  { time: '10:30 AM', group: 'CBT Skills Group', room: 'Rm 2' },
                  { time: '1:00 PM', group: 'Relapse Prevention', room: 'Rm 1' },
                  { time: '3:00 PM', group: 'Process Group', room: 'Rm 3' },
                ].map(g => (
                  <div key={g.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{g.group}</div><div className="text-xs text-slate">{g.time} · {g.room}</div></div>
                    <button onClick={() => navigate('GroupSchedule')} className="text-xs text-sunrise-blue hover:underline">View</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy mb-3">Recent Training</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'De-escalation Techniques', due: 'Due Jul 30', status: 'bg-amber-100 text-amber-700' },
                  { name: 'Suicide Prevention (QPR)', due: 'Completed Jun 15', status: 'bg-green-100 text-green-700' },
                  { name: 'Trauma-Informed Care', due: 'Due Aug 15', status: 'bg-blue-100 text-blue-700' },
                ].map(t => (
                  <div key={t.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-navy font-medium">{t.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status}`}>{t.due}</span>
                  </div>
                ))}
                <button onClick={() => navigate('Training')} className="text-xs text-sunrise-blue hover:underline mt-1">View all training</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FINANCIAL / OWNERSHIP VIEW ─────────────────────────────────────── */}
      {isFinancial && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="MTD Revenue" value="$310K" subtitle="Jul billed to date" color="green" onClick={() => navigate('RevenueCycle')} />
            <MetricCard title="Collection Rate" value="87.3%" subtitle="Last 30 days" trend={{ value: '2.1', direction: 'up' }} color="blue" onClick={() => navigate('RevenueCycle')} />
            <MetricCard title="Pending Claims" value="$84K" subtitle="Awaiting payment" color="amber" onClick={() => navigate('InsuranceAuthorization')} />
            <MetricCard title="Denied Claims" value="12" subtitle="This month" color="red" onClick={() => navigate('RevenueCycle')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-navy text-sm">Revenue Trend — Billed vs. Collected</h3>
                <button onClick={() => navigate('RevenueCycle')} className="text-xs text-sunrise-blue font-medium hover:underline">Revenue Cycle &#8594;</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}K`} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`$${v}K`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="billed" fill="#3B9ED4" radius={[3,3,0,0]} name="Billed" />
                  <Bar dataKey="collected" fill="#27ae60" radius={[3,3,0,0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">30-Day Census Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="censusGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8761A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8761A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="census" stroke="#E8761A" strokeWidth={2} fill="url(#censusGrad2)" name="Census" dot={{ r: 2.5, fill: '#E8761A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── OPERATIONS / BHT SUPERVISOR VIEW ──────────────────────────────── */}
      {isOperations && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Bed Occupancy" value="18/22" subtitle="81.8%" color="orange" onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Waitlist" value="7" subtitle="Pending placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Open Incidents" value="2" subtitle="Needs review" color="red" onClick={() => navigate('IncidentReporting')} />
            <MetricCard title="Staff on Shift" value="8" subtitle="Day shift active" color="blue" onClick={() => navigate('StaffScheduling')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">Bed Status</h3>
              <div className="space-y-2">
                {[
                  { program: 'Residential (10 beds)', occupied: 8, color: 'bg-sunrise-blue' },
                  { program: 'PHP (6 slots)', occupied: 5, color: 'bg-sunrise-orange' },
                  { program: 'IOP (6 slots)', occupied: 5, color: 'bg-purple' },
                ].map(p => (
                  <div key={p.program}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate">{p.program}</span>
                      <span className="font-bold text-navy">{p.occupied}/{parseInt(p.program.match(/\d+/)![0])}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${p.color} h-2 rounded-full`} style={{ width: `${p.occupied / parseInt(p.program.match(/\d+/)![0]) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-navy text-sm mb-4">Certifications Expiring (60 days)</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins, LPC', cert: 'CADC III', days: 22, urgent: true },
                  { name: 'Kevin Wright', cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres, RN', cert: 'BLS', days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.days}d</span>
                  </div>
                ))}
                <button onClick={() => navigate('CertificationTracker')} className="text-xs text-sunrise-blue hover:underline">View all &#8594;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BUSINESS DEVELOPMENT VIEW ──────────────────────────────────────── */}
      {isBizDev && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="MTD Referrals" value="23" subtitle="New this month" color="blue" trend={{ value: '4', direction: 'up' }} onClick={() => navigate('ReferralTracker')} />
            <MetricCard title="Occupancy" value="81.8%" subtitle="18/22 beds" color="green" onClick={() => navigate('Dashboard')} />
            <MetricCard title="Waitlist" value="7" subtitle="Ready for placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Alumni Active" value="142" subtitle="In program" color="orange" onClick={() => navigate('AlumniProgram')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Top Referral Sources — July</h3>
              <div className="space-y-2">
                {[
                  { source: 'Vanderbilt Medical Center', referrals: 7 },
                  { source: 'Saint Thomas West', referrals: 5 },
                  { source: 'Self / Family', referrals: 4 },
                  { source: 'Probation / Courts', referrals: 4 },
                  { source: 'AA / NA Community', referrals: 3 },
                ].map(r => (
                  <div key={r.source} className="flex items-center justify-between text-sm">
                    <span className="text-navy">{r.source}</span>
                    <span className="font-bold text-sunrise-blue">{r.referrals}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Outcomes Summary (aggregate)</h3>
              <div className="space-y-3">
                {[
                  { label: '30-day sobriety (alumni)', value: '78%', color: 'bg-green-500' },
                  { label: '90-day treatment completion', value: '64%', color: 'bg-sunrise-blue' },
                  { label: 'Alumni program engagement', value: '55%', color: 'bg-purple' },
                  { label: 'Family satisfaction score', value: '4.6/5', color: 'bg-sunrise-orange' },
                ].map(o => (
                  <div key={o.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{o.label}</span><strong className="text-navy">{o.value}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── HR VIEW ────────────────────────────────────────────────────────── */}
      {isHR && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Total Staff" value="12" subtitle="Active employees" color="blue" onClick={() => navigate('StaffScheduling')} />
            <MetricCard title="Certs Expiring" value="3" subtitle="Within 60 days" color="amber" onClick={() => navigate('CertificationTracker')} />
            <MetricCard title="Training Due" value="5" subtitle="Overdue items" color="red" onClick={() => navigate('Training')} />
            <MetricCard title="Supervision Done" value="8/12" subtitle="This month" color="green" onClick={() => navigate('ClinicalSupervision')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Staff by Department</h3>
              <div className="space-y-2 text-sm">
                {[
                  { dept: 'Clinical / Counseling', count: 4 },
                  { dept: 'Medical / Nursing', count: 3 },
                  { dept: 'Operations / BHT', count: 3 },
                  { dept: 'Administrative', count: 2 },
                ].map(d => (
                  <div key={d.dept} className="flex justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-slate">{d.dept}</span>
                    <span className="font-bold text-navy">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Renewals</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins', cert: 'CADC III', days: 22, urgent: true },
                  { name: 'Kevin Wright', cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres', cert: 'BLS', days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.days}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ADMIN / INTAKE STAFF VIEW ─────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Today&apos;s Appointments" value="11" subtitle="Scheduled today" color="blue" onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Waitlist" value="7" subtitle="Pending placement" color="amber" onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Active Census" value="18" subtitle="Current clients" color="orange" onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Unread Messages" value="3" subtitle="Secure inbox" color="green" onClick={() => navigate('SecureMessaging')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Today&apos;s Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM', name: 'New Intake — Marcus Webb', type: 'Admission', badge: 'bg-green-100 text-green-700' },
                  { time: '10:30 AM', name: 'Follow-up — Devon Patel', type: 'Appt', badge: 'bg-blue-100 text-blue-700' },
                  { time: '1:00 PM', name: 'Discharge — Ashley Monroe', type: 'Discharge', badge: 'bg-orange-100 text-orange-700' },
                  { time: '3:00 PM', name: 'Insurance verify — Samantha Choi', type: 'Insurance', badge: 'bg-purple-100 text-purple-700' },
                ].map(a => (
                  <div key={a.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.time}</div></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.badge}`}>{a.type}</span>
                  </div>
                ))}
                <button onClick={() => navigate('AppointmentCalendar')} className="text-xs text-sunrise-blue hover:underline">View full calendar &#8594;</button>
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Waitlist — Top Priority</h3>
              <div className="space-y-2">
                {[
                  { name: 'Jordan Hayes', source: 'ER Referral', payer: 'Medicaid', days: 3, pri: 'P1' },
                  { name: 'Casey Nguyen', source: 'Self-refer', payer: 'BCBS', days: 7, pri: 'P2' },
                  { name: 'Alex Morales', source: 'Probation', payer: 'Medicaid', days: 10, pri: 'P2' },
                ].map(w => (
                  <div key={w.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div>
                      <div className="font-medium text-navy">{w.name}</div>
                      <div className="text-xs text-slate">{w.source} · {w.payer}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.pri === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{w.pri}</span>
                      <div className="text-xs text-slate mt-0.5">{w.days}d waiting</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('WaitlistManager')} className="text-xs text-sunrise-blue hover:underline">View waitlist &#8594;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── AFTERCARE VIEW ─────────────────────────────────────────────────── */}
      {isAftercare && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Alumni Active" value="142" subtitle="In program" color="blue" onClick={() => navigate('AlumniProgram')} />
            <MetricCard title="30-Day Sobriety" value="78%" subtitle="Recent alumni" color="green" onClick={() => navigate('OutcomeTracking')} />
            <MetricCard title="Appts This Week" value="11" subtitle="Follow-up sessions" color="orange" onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Discharges (30d)" value="14" subtitle="Available for contact" color="amber" onClick={() => navigate('AftercarePlanning')} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Alumni Appointments</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'Marcus Webb', date: 'Jul 21 — 2:00 PM', type: '30-day check-in' },
                  { name: 'Devon Patel', date: 'Jul 22 — 10:00 AM', type: '60-day follow-up' },
                  { name: 'Ashley Monroe', date: 'Jul 23 — 1:00 PM', type: '90-day review' },
                ].map(a => (
                  <div key={a.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.type}</div></div>
                    <span className="text-xs text-slate">{a.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Alumni Engagement Scores</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { period: '30d', score: 78 },
                  { period: '60d', score: 71 },
                  { period: '90d', score: 65 },
                  { period: '6mo', score: 58 },
                  { period: '12mo', score: 52 },
                ]} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Sobriety rate']} />
                  <Bar dataKey="score" fill="#27ae60" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
