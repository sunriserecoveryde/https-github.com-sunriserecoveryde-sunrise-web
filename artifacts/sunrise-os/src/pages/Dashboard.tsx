import React from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { OccupancyRing } from '../components/ui/OccupancyRing';
import {
  AlertTriangle, Clock, ChevronRight, UserPlus, FileText, Droplets,
  DollarSign, TrendingUp, BarChart3, Users, CalendarDays, Bed,
  LogOut, Brain, Shield, Zap, Activity, Star, Heart, Briefcase,
  UserCheck, GraduationCap, ArrowRight,
} from 'lucide-react';
import { Screen } from '../App';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

const DEMO_BOOKING_URL =
  import.meta.env.VITE_DEMO_BOOKING_URL ||
  'mailto:demo@sunrisehealth.com?subject=Schedule%20a%20Live%20Demo';

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
  const { currentStaff } = useAuth();
  const highRiskPatients = MOCK_PATIENTS.filter(p => p.amaRisk === 'High').slice(0, 8);

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

  const firstName = currentStaff?.firstName ?? role.label.split(' ')[0];

  return (
    <div className="space-y-5 fade-in">

      {/* ── CLINICAL VIEW ──────────────────────────────────────────────────── */}
      {isClinical && !isBHT && (
        <>
          {/* Hero gradient banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-navy via-navy-mid to-[#1a2744] px-6 py-5 shadow-lg border border-white/10">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-sunrise-orange opacity-[0.08] blur-3xl" />
              <div className="absolute right-40 bottom-0 w-40 h-40 rounded-full bg-blue-500 opacity-[0.07] blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between gap-6">
              <div>
                <div className="text-xs font-bold text-sunrise-orange uppercase tracking-widest mb-1">
                  Sunrise Recovery Center · Rockville, MD · Day Shift
                </div>
                <h1 className="text-white text-2xl font-bold leading-tight">
                  Good morning, <span className="text-sunrise-orange">{firstName}</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">Mon, Jul 21, 2026 · Here&apos;s your clinical snapshot</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">18</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">of 22 beds</div>
                  <div className="text-xs text-sunrise-amber font-bold">82% occupied</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-red-400">2</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">AMA risk</div>
                  <div className="text-xs text-red-400 font-bold">High priority</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-amber-400">4</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">co-signs</div>
                  <div className="text-xs text-amber-400 font-bold">Pending</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-green-400">18.4</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">avg LOS</div>
                  <div className="text-xs text-green-400 font-bold">↓ 1.2 days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            <div className="alert-high">
              <AlertTriangle className="w-5 h-5 text-high flex-none" />
              <span className="text-sm font-medium text-navy">
                <strong>AMA Risk Alert:</strong> 2 clients flagged HIGH for early departure — review risk dashboard
              </span>
              <button onClick={() => navigate('RiskDashboard')} className="ml-auto text-xs font-semibold text-high hover:underline flex items-center gap-1 shrink-0">
                View <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {canAccessScreen('CosignQueue') && (
              <div className="alert-amber">
                <Clock className="w-5 h-5 text-moderate flex-none" />
                <span className="text-sm font-medium text-navy">4 co-sign requests pending · oldest is 12h overdue</span>
                <button onClick={() => navigate('CosignQueue')} className="ml-auto text-xs font-semibold text-moderate hover:underline flex items-center gap-1 shrink-0">
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
            {canAccessScreen('ClinicalIntelligence') && (
              <div className="alert-critical">
                <Brain className="w-5 h-5 text-critical flex-none" />
                <span className="text-sm font-medium text-navy">
                  <strong>Clinical Intelligence:</strong> 1 critical alert (Benzo + Buprenorphine) · 1 high alert (Safety Plan missing)
                </span>
                <button onClick={() => navigate('ClinicalIntelligence')} className="ml-auto text-xs font-semibold text-critical hover:underline flex items-center gap-1 shrink-0">
                  Resolve <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-5 gap-3">
            <MetricCard title="Census" value="18/22" subtitle="81.8% occupied" color="orange" icon={Bed}
              onClick={() => navigate('CensusBedBoard')} />
            {canAccessScreen('RiskDashboard') && (
              <MetricCard title="AMA Risk" value="2" subtitle="High-risk clients" color="red" icon={AlertTriangle}
                onClick={() => navigate('RiskDashboard')} />
            )}
            {canAccessScreen('CosignQueue') && (
              <MetricCard title="Pending Co-signs" value="4" subtitle="Action required" color="amber" icon={Clock}
                onClick={() => navigate('CosignQueue')} />
            )}
            <MetricCard title="Avg LOS" value="18.4d" subtitle="↓ 1.2 days vs last month" color="blue" icon={TrendingUp}
              trend={{ value: '1.2d', direction: 'down' }}
              onClick={() => navigate('OutcomeTracking')} />
            {canAccessScreen('Discharges') && (
              <MetricCard title="Discharges" value="3" subtitle="This week" color="green" icon={LogOut}
                onClick={() => navigate('Discharges')} />
            )}
          </div>

          {/* Main 3-column layout */}
          <div className="grid grid-cols-3 gap-5">

            {/* Left column: occupancy + engagement */}
            <div className="space-y-5">
              <div className="card">
                <h3 className="font-bold text-navy mb-4 text-sm">Program Utilization</h3>
                <div className="flex items-center gap-5 mb-5">
                  <OccupancyRing percentage={81.8} />
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Residential', val: '8/10', pct: 80,  color: 'bg-blue-500' },
                      { label: 'PHP',         val: '5/6',  pct: 83,  color: 'bg-orange-500' },
                      { label: 'IOP',         val: '5/6',  pct: 83,  color: 'bg-purple-500' },
                    ].map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate">{p.label}</span>
                          <span className="font-bold text-navy">{p.val}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`${p.color} h-1.5 rounded-full`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {canAccessScreen('RecoveryEngagementScore') && (
                  <>
                    <div className="section-title mt-5">Recovery Engagement</div>
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate">Average Score</span>
                        <span className="text-2xl font-extrabold text-blue-700">72<span className="text-sm font-medium text-slate">/100</span></span>
                      </div>
                      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mt-2">
                        <div className="bg-red-400 rounded-l-full"    style={{ width: '10%' }} title="Low: 10%" />
                        <div className="bg-amber-400"                  style={{ width: '30%' }} title="Moderate: 30%" />
                        <div className="bg-green-500 rounded-r-full"  style={{ width: '60%' }} title="High: 60%" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate mt-1">
                        <span>10% Low</span><span>30% Moderate</span><span>60% High</span>
                      </div>
                      <button onClick={() => navigate('RecoveryEngagementScore')} className="mt-3 text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                        Full score breakdown <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Clinical Intelligence teaser */}
              {canAccessScreen('ClinicalIntelligence') && (
                <button
                  onClick={() => navigate('ClinicalIntelligence')}
                  className="card-interactive w-full text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md flex-none">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy text-sm group-hover:text-blue-700 transition-colors">Clinical Intelligence</div>
                      <div className="text-xs text-slate mt-0.5">SBIRT · Recovery Capital · Care Pathways · CDS Alerts</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-none">
                      <span className="pill pill-red">2 open</span>
                      <ChevronRight className="w-4 h-4 text-slate group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: 'SBIRT', val: '100%', sub: 'screened', color: 'text-green-600' },
                      { label: 'RCI', val: '72', sub: 'avg capital', color: 'text-blue-600' },
                      { label: 'Alerts', val: '2', sub: 'open critical', color: 'text-red-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className={`text-base font-extrabold ${s.color}`}>{s.val}</div>
                        <div className="text-[9px] text-slate font-medium">{s.label}</div>
                        <div className="text-[9px] text-slate opacity-70">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </button>
              )}
            </div>

            {/* Middle + Right: AI brief + patients table */}
            <div className="col-span-2 space-y-5">
              {/* AI Clinical Brief */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-navy to-[#1a2744] p-5 shadow-lg border border-white/10 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-sunrise-orange/20 border border-sunrise-orange/30 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-sunrise-orange" />
                  </div>
                  <h3 className="font-bold text-base">AI Clinical Brief</h3>
                  <span className="ml-auto text-[10px] text-slate-400 live-dot font-medium">Live — updated 08:02 AM</span>
                </div>
                <p className="text-slate-400 text-xs mb-3">AI-generated summary of today&apos;s critical action items across the census. Always verify before acting.</p>
                <div className="space-y-2">
                  {[
                    { name: 'Marcus Webb (Res)', color: 'border-l-red-400', tag: 'bg-red-500/20 text-red-300', tagLabel: 'HIGH RISK', text: 'High AMA risk in morning group. Severe cravings. Dr. Chen adjusting Suboxone. Counselor Sarah Jenkins: 1:1 check-in before lunch.' },
                    { name: 'Samantha Choi (Res)', color: 'border-l-amber-400', tag: 'bg-amber-500/20 text-amber-300', tagLabel: 'MEDICAL', text: 'Restricted meals 24h. Psychiatric flags active. Schedule immediate consult with Dr. Stone; dietary monitoring required.' },
                    { name: 'Devon Patel (PHP)', color: 'border-l-orange-400', tag: 'bg-orange-500/20 text-orange-300', tagLabel: 'UA POSITIVE', text: 'UA returned positive for methamphetamine. Mild paranoia in nursing notes. Hold from group today, initiate behavioral protocol.' },
                  ].map(item => (
                    <div key={item.name} className={`bg-white/8 border-l-2 ${item.color} rounded-r-lg px-3 py-2.5 text-sm`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-xs">{item.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.tag}`}>{item.tagLabel}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Clients */}
              {canAccessScreen('PatientDetail') && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-navy text-sm">Priority Clients</h3>
                    <button onClick={() => navigate('PatientList')} className="text-xs text-sunrise-blue font-semibold hover:underline flex items-center gap-1">
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-border text-slate text-[10px] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Flags</th>
                          <th className="px-3 py-2.5">Client</th>
                          <th className="px-3 py-2.5">Prog</th>
                          <th className="px-3 py-2.5">Acuity</th>
                          <th className="px-3 py-2.5">RES</th>
                          <th className="px-3 py-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {highRiskPatients.map(p => (
                          <tr key={p.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                            onClick={() => navigate('PatientDetail', p.id)}>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1">{p.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} />)}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                                <div>
                                  <div className="font-semibold text-navy text-xs">{p.firstName} {p.lastName}</div>
                                  <div className="text-[10px] text-slate">{p.mrn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5"><span className="text-xs font-semibold text-slate">{p.program}</span></td>
                            <td className="px-3 py-2.5"><AcuityBadge acuity={p.amaRisk === 'High' ? 'Critical' : 'High'} /></td>
                            <td className="px-3 py-2.5"><RecoveryScoreBadge score={p.recoveryScore} /></td>
                            <td className="px-3 py-2.5">
                              <button className="text-xs font-semibold text-sunrise-blue hover:underline">Chart →</button>
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
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-navy">Quick Actions</span>
              <span className="text-xs text-slate">Common tasks for today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'New Admission',       icon: UserPlus,       screen: 'Admissions'         as Screen, color: 'bg-green-50  border-green-200  text-green-700  hover:bg-green-100' },
                { label: 'New Progress Note',   icon: FileText,       screen: 'ProgressNotes'      as Screen, color: 'bg-blue-50   border-blue-200   text-blue-700   hover:bg-blue-100' },
                { label: 'Co-sign Queue (4)',   icon: FileText,       screen: 'CosignQueue'        as Screen, color: 'bg-amber-50  border-amber-200  text-amber-700  hover:bg-amber-100' },
                { label: 'Clinical Alerts (2)', icon: Brain,          screen: 'ClinicalIntelligence' as Screen, color: 'bg-red-50    border-red-200    text-red-700    hover:bg-red-100' },
                { label: 'UA Results',          icon: Droplets,       screen: 'UADrugTesting'      as Screen, color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
                { label: 'Open Incidents (2)',  icon: AlertTriangle,  screen: 'IncidentReporting'  as Screen, color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
              ].filter(a => canAccessScreen(a.screen)).map(({ label, icon: Icon, screen, color }) => (
                <button key={label} onClick={() => navigate(screen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm hover:shadow ${color}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-navy text-sm">30-Day Census Trend</h3>
                <button onClick={() => navigate('CensusBedBoard')} className="text-xs text-sunrise-blue font-semibold hover:underline flex items-center gap-1">
                  Bed Board <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate mb-4">Daily census vs. 22-bed capacity</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="censusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number, n: string) => [v, n === 'census' ? 'Census' : 'Capacity']} />
                  <Area type="monotone" dataKey="capacity" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" fill="url(#capGrad)" name="capacity" />
                  <Area type="monotone" dataKey="census"   stroke="#F97316" strokeWidth={2.5} fill="url(#censusGrad)" name="census" dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {canAccessScreen('Admissions') ? (
              <div className="card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-navy text-sm">Weekly Admissions vs. Discharges</h3>
                  <button onClick={() => navigate('Admissions')} className="text-xs text-sunrise-blue font-semibold hover:underline flex items-center gap-1">
                    Admissions <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate mb-4">7-week patient flow</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ADMISSIONS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="admissions" fill="#2563EB" radius={[4,4,0,0]} name="Admissions" />
                    <Bar dataKey="discharges"  fill="#F97316" radius={[4,4,0,0]} name="Discharges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="card">
                <h3 className="font-bold text-navy text-sm mb-4">Group Schedule Today</h3>
                <div className="space-y-2">
                  {[
                    { time: '9:00 AM',  group: 'Morning Meditation',  room: 'Rm 1', count: 8 },
                    { time: '10:30 AM', group: 'CBT Skills Group',     room: 'Rm 2', count: 6 },
                    { time: '1:00 PM',  group: 'Relapse Prevention',   room: 'Rm 1', count: 10 },
                    { time: '3:00 PM',  group: 'Process Group',        room: 'Rm 3', count: 7 },
                  ].map(g => (
                    <div key={g.time} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="font-medium text-navy text-sm">{g.group}</div>
                        <div className="text-xs text-slate">{g.time} · {g.room}</div>
                      </div>
                      <span className="pill pill-blue">{g.count} clients</span>
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
          <div className="alert-amber">
            <Users className="w-5 h-5 text-moderate flex-none" />
            <span className="text-sm font-medium text-navy">3 clients need 15-minute checks this hour. See shift handoff for assignments.</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Active Census" value="18" subtitle="Clients on unit"      color="blue"  icon={Users}        onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Groups Today"  value="4"  subtitle="Scheduled sessions"  color="green" icon={CalendarDays}  onClick={() => navigate('GroupSchedule')} />
            <MetricCard title="Open Incidents" value="2" subtitle="Needs follow-up"     color="red"   icon={AlertTriangle} onClick={() => navigate('IncidentReporting')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy mb-3 text-sm">Today&apos;s Group Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM',  group: 'Morning Meditation', room: 'Rm 1' },
                  { time: '10:30 AM', group: 'CBT Skills Group',    room: 'Rm 2' },
                  { time: '1:00 PM',  group: 'Relapse Prevention',  room: 'Rm 1' },
                  { time: '3:00 PM',  group: 'Process Group',       room: 'Rm 3' },
                ].map(g => (
                  <div key={g.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{g.group}</div><div className="text-xs text-slate">{g.time} · {g.room}</div></div>
                    <button onClick={() => navigate('GroupSchedule')} className="text-xs text-sunrise-blue hover:underline font-semibold">View</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy mb-3 text-sm">My Training</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'De-escalation Techniques', due: 'Due Jul 30',    status: 'pill-amber' },
                  { name: 'Suicide Prevention (QPR)', due: 'Done Jun 15',   status: 'pill-green' },
                  { name: 'Trauma-Informed Care',     due: 'Due Aug 15',    status: 'pill-blue'  },
                ].map(t => (
                  <div key={t.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-navy font-medium">{t.name}</span>
                    <span className={`pill ${t.status}`}>{t.due}</span>
                  </div>
                ))}
                <button onClick={() => navigate('Training')} className="text-xs text-sunrise-blue hover:underline font-semibold mt-1">View all training →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FINANCIAL / OWNERSHIP VIEW ─────────────────────────────────────── */}
      {isFinancial && (
        <>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-900 via-emerald-900 to-teal-900 px-6 py-5 shadow-lg border border-white/10 text-white mb-1">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-green-400 opacity-5 blur-3xl" />
            <div className="text-xs font-bold text-green-300 uppercase tracking-widest mb-1">Financial Overview · {firstName}</div>
            <h1 className="text-2xl font-bold">Revenue &amp; Collections Dashboard</h1>
            <p className="text-green-200/70 text-sm mt-1">Sunrise Recovery Center · Rockville, MD · FY 2026</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="MTD Revenue"      value="$310K"  subtitle="Jul billed to date"   color="green" icon={DollarSign}   onClick={() => navigate('RevenueCycle')} />
            <MetricCard title="Collection Rate"  value="87.3%"  subtitle="Last 30 days"         color="blue"  icon={TrendingUp}   trend={{ value: '2.1%', direction: 'up' }} onClick={() => navigate('RevenueCycle')} />
            <MetricCard title="Pending Claims"   value="$84K"   subtitle="Awaiting payment"     color="amber" icon={Clock}        onClick={() => navigate('InsuranceAuthorization')} />
            <MetricCard title="Denied Claims"    value="12"     subtitle="This month"            color="red"   icon={AlertTriangle} onClick={() => navigate('RevenueCycle')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-navy text-sm">Revenue — Billed vs. Collected</h3>
                <button onClick={() => navigate('RevenueCycle')} className="text-xs text-sunrise-blue font-semibold hover:underline">Revenue Cycle →</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}K`} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`$${v}K`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="billed"    fill="#2563EB" radius={[4,4,0,0]} name="Billed" />
                  <Bar dataKey="collected" fill="#16A34A" radius={[4,4,0,0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">30-Day Census Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={CENSUS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="censusGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[10, 22]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="census" stroke="#F97316" strokeWidth={2.5} fill="url(#censusGrad2)" name="Census" dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }} />
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
            <MetricCard title="Bed Occupancy"   value="18/22" subtitle="81.8%"               color="orange" icon={Bed}           onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Waitlist"         value="7"     subtitle="Pending placement"   color="amber"  icon={Clock}         onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Open Incidents"  value="2"     subtitle="Needs review"         color="red"    icon={AlertTriangle} onClick={() => navigate('IncidentReporting')} />
            <MetricCard title="Staff on Shift"  value="8"     subtitle="Day shift active"     color="blue"   icon={UserCheck}     onClick={() => navigate('StaffScheduling')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Bed Status</h3>
              <div className="space-y-3">
                {[
                  { program: 'Residential', beds: 10, occupied: 8, color: 'bg-blue-500' },
                  { program: 'PHP',         beds: 6,  occupied: 5, color: 'bg-orange-500' },
                  { program: 'IOP',         beds: 6,  occupied: 5, color: 'bg-purple-500' },
                ].map(p => (
                  <div key={p.program}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate font-medium">{p.program} ({p.beds} beds)</span>
                      <span className="font-bold text-navy">{p.occupied}/{p.beds}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${p.color} h-2 rounded-full`} style={{ width: `${(p.occupied/p.beds)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Certifications Expiring (60 days)</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins, LPC',  cert: 'CAC-AD',  days: 22, urgent: true  },
                  { name: 'Kevin Wright',          cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres, RN',   cert: 'BLS',     days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`pill ${c.urgent ? 'pill-red' : 'pill-amber'}`}>{c.days}d</span>
                  </div>
                ))}
                <button onClick={() => navigate('CertificationTracker')} className="text-xs text-sunrise-blue hover:underline font-semibold mt-1">View all →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BUSINESS DEVELOPMENT VIEW ──────────────────────────────────────── */}
      {isBizDev && (
        <>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1a1f3a] via-[#1e2d54] to-navy px-6 py-5 shadow-lg border border-white/10 text-white mb-1">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-blue-500 opacity-5 blur-3xl" />
            <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Business Development · {firstName}</div>
            <h1 className="text-2xl font-bold">Referral &amp; Occupancy Dashboard</h1>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="MTD Referrals" value="23"    subtitle="New this month"   color="blue"  icon={TrendingUp}  trend={{ value: '4', direction: 'up' }} onClick={() => navigate('ReferralTracker')} />
            <MetricCard title="Occupancy"      value="81.8%" subtitle="18/22 beds"       color="green" icon={Bed}         onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Waitlist"       value="7"    subtitle="Ready for placement" color="amber" icon={Clock}    onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Alumni Active"  value="142"  subtitle="In program"        color="orange" icon={Heart}     onClick={() => navigate('AlumniProgram')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Top Referral Sources — July</h3>
              <div className="space-y-2">
                {[
                  { source: 'University of Maryland Medical Center', referrals: 7 },
                  { source: 'Shady Grove Medical Center',            referrals: 5 },
                  { source: 'Self / Family',                         referrals: 4 },
                  { source: 'Probation / Courts',                    referrals: 4 },
                  { source: 'AA / NA Community',                     referrals: 3 },
                ].map(r => (
                  <div key={r.source} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="text-navy font-medium">{r.source}</span>
                    <span className="font-bold text-sunrise-blue">{r.referrals}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Outcomes Summary (aggregate)</h3>
              <div className="space-y-3">
                {[
                  { label: '30-day sobriety (alumni)',       value: '78%',   color: 'bg-green-500', w: '78%' },
                  { label: '90-day treatment completion',   value: '64%',   color: 'bg-blue-500',  w: '64%' },
                  { label: 'Alumni program engagement',     value: '55%',   color: 'bg-purple-500',w: '55%' },
                  { label: 'Family satisfaction score',     value: '4.6/5', color: 'bg-orange-500',w: '92%' },
                ].map(o => (
                  <div key={o.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate">{o.label}</span><strong className="text-navy">{o.value}</strong></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`${o.color} h-1.5 rounded-full`} style={{ width: o.w }} />
                    </div>
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
            <MetricCard title="Total Staff"       value="12"   subtitle="Active employees"  color="blue"  icon={Users}          onClick={() => navigate('StaffScheduling')} />
            <MetricCard title="Certs Expiring"    value="3"    subtitle="Within 60 days"    color="amber" icon={AlertTriangle}  onClick={() => navigate('CertificationTracker')} />
            <MetricCard title="Training Due"      value="5"    subtitle="Overdue items"     color="red"   icon={GraduationCap}  onClick={() => navigate('Training')} />
            <MetricCard title="Supervision Done"  value="8/12" subtitle="This month"        color="green" icon={UserCheck}      onClick={() => navigate('ClinicalSupervision')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Staff by Department</h3>
              <div className="space-y-1.5 text-sm">
                {[
                  { dept: 'Clinical / Counseling', count: 4 },
                  { dept: 'Medical / Nursing',      count: 3 },
                  { dept: 'Operations / BHT',       count: 3 },
                  { dept: 'Administrative',          count: 2 },
                ].map(d => (
                  <div key={d.dept} className="flex justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-slate font-medium">{d.dept}</span>
                    <span className="font-bold text-navy">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Renewals</h3>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Jenkins', cert: 'CAC-AD', days: 22, urgent: true  },
                  { name: 'Kevin Wright',   cert: 'CPR/AED', days: 38, urgent: false },
                  { name: 'Jessica Torres', cert: 'BLS',    days: 55, urgent: false },
                ].map(c => (
                  <div key={c.name} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{c.name}</div><div className="text-xs text-slate">{c.cert}</div></div>
                    <span className={`pill ${c.urgent ? 'pill-red' : 'pill-amber'}`}>{c.days}d</span>
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
            <MetricCard title="Today's Appts"   value="11" subtitle="Scheduled today"    color="blue"   icon={CalendarDays}  onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Waitlist"         value="7"  subtitle="Pending placement"  color="amber"  icon={Clock}         onClick={() => navigate('WaitlistManager')} />
            <MetricCard title="Active Census"   value="18" subtitle="Current clients"    color="orange" icon={Bed}           onClick={() => navigate('CensusBedBoard')} />
            <MetricCard title="Unread Messages" value="3"  subtitle="Secure inbox"       color="green"  icon={Activity}      onClick={() => navigate('SecureMessaging')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Today&apos;s Schedule</h3>
              <div className="space-y-2">
                {[
                  { time: '9:00 AM',  name: 'New Intake — Marcus Webb',        type: 'Admission', badge: 'pill-green'  },
                  { time: '10:30 AM', name: 'Follow-up — Devon Patel',         type: 'Appt',      badge: 'pill-blue'   },
                  { time: '1:00 PM',  name: 'Discharge — Ashley Monroe',       type: 'Discharge', badge: 'pill-orange' },
                  { time: '3:00 PM',  name: 'Insurance verify — Samantha Choi',type: 'Insurance', badge: 'pill-purple' },
                ].map(a => (
                  <div key={a.time} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.time}</div></div>
                    <span className={`pill ${a.badge}`}>{a.type}</span>
                  </div>
                ))}
                <button onClick={() => navigate('AppointmentCalendar')} className="text-xs text-sunrise-blue hover:underline font-semibold mt-1">View full calendar →</button>
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Waitlist — Top Priority</h3>
              <div className="space-y-2">
                {[
                  { name: 'Jordan Hayes', source: 'ER Referral',  payer: 'Medicaid', days: 3,  pri: 'P1' },
                  { name: 'Casey Nguyen', source: 'Self-refer',   payer: 'BCBS',     days: 7,  pri: 'P2' },
                  { name: 'Alex Morales', source: 'Probation',    payer: 'Medicaid', days: 10, pri: 'P2' },
                ].map(w => (
                  <div key={w.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div>
                      <div className="font-medium text-navy">{w.name}</div>
                      <div className="text-xs text-slate">{w.source} · {w.payer}</div>
                    </div>
                    <div className="text-right">
                      <span className={`pill ${w.pri === 'P1' ? 'pill-red' : 'pill-amber'}`}>{w.pri}</span>
                      <div className="text-xs text-slate mt-0.5">{w.days}d waiting</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('WaitlistManager')} className="text-xs text-sunrise-blue hover:underline font-semibold mt-1">View waitlist →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── AFTERCARE VIEW ─────────────────────────────────────────────────── */}
      {isAftercare && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Alumni Active"     value="142" subtitle="In program"          color="blue"   icon={Users}       onClick={() => navigate('AlumniProgram')} />
            <MetricCard title="30-Day Sobriety"   value="78%" subtitle="Recent alumni"       color="green"  icon={Star}        onClick={() => navigate('OutcomeTracking')} />
            <MetricCard title="Appts This Week"   value="11"  subtitle="Follow-up sessions"  color="orange" icon={CalendarDays} onClick={() => navigate('AppointmentCalendar')} />
            <MetricCard title="Discharges (30d)"  value="14"  subtitle="Available for contact" color="amber" icon={Heart}      onClick={() => navigate('AftercarePlanning')} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Upcoming Alumni Appointments</h3>
              <div className="space-y-2 text-sm">
                {[
                  { name: 'Marcus Webb',   date: 'Jul 21 — 2:00 PM',  type: '30-day check-in' },
                  { name: 'Devon Patel',   date: 'Jul 22 — 10:00 AM', type: '60-day follow-up' },
                  { name: 'Ashley Monroe', date: 'Jul 23 — 1:00 PM',  type: '90-day review'   },
                ].map(a => (
                  <div key={a.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div><div className="font-medium text-navy">{a.name}</div><div className="text-xs text-slate">{a.type}</div></div>
                    <span className="text-xs text-slate">{a.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-3">Alumni Engagement — Sobriety Rates</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { period: '30d', score: 78 },
                  { period: '60d', score: 71 },
                  { period: '90d', score: 65 },
                  { period: '6mo', score: 58 },
                  { period: '12mo',score: 52 },
                ]} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v}%`, 'Sobriety rate']} />
                  <Bar dataKey="score" fill="#16A34A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── Demo CTA ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden flex items-center justify-between gap-4 px-6 py-4 rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white opacity-[0.04] blur-2xl" />
          <div className="absolute right-20 -bottom-10 w-40 h-40 rounded-full bg-purple-300 opacity-[0.08] blur-2xl" />
        </div>
        <div className="relative flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-none">
            <CalendarDays className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">See Sunrise OS in your environment</div>
            <div className="text-purple-200 text-xs">Explore every screen, every role, live clinical data — on your terms</div>
          </div>
        </div>
        <a href={DEMO_BOOKING_URL} target="_blank" rel="noopener noreferrer"
          className="relative flex-shrink-0 flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 transition-all text-sm font-bold px-5 py-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <CalendarDays className="w-4 h-4" />
          Schedule a Live Demo →
        </a>
      </div>

    </div>
  );
}
