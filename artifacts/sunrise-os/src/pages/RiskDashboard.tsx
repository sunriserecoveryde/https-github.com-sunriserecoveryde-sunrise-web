import React from 'react';
import { Screen } from '../App';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, HeartPulse } from 'lucide-react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MetricCard } from '../components/ui/MetricCard';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function RiskDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  const highRisk = MOCK_PATIENTS.filter(p => p.amaRisk === 'High');
  const medRisk = MOCK_PATIENTS.filter(p => p.amaRisk === 'Med');

  const riskFactors = [
    'Recent AMA Threats',
    'Severe Cravings',
    'Missed Groups (>2)',
    'Positive UA',
    'Psychiatric Instability',
    'Low Motivation (Dim 4)'
  ];

  const trendData = Array.from({ length: 14 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    cravings: (Math.random() * 3 + 3).toFixed(1),
    mood: (Math.random() * 2 + 5).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-critical" /> Risk & AMA Dashboard
          </h1>
          <p className="text-slate text-sm mt-1">Predictive risk analysis and early intervention tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-critical-bg border-l-4 border-l-critical p-4 rounded-lg shadow-sm border-y border-r border-critical/20">
          <h3 className="text-sm font-semibold text-critical mb-1 uppercase tracking-wider">High AMA Risk</h3>
          <div className="text-3xl font-bold text-critical">{highRisk.length} <span className="text-sm font-normal">clients</span></div>
        </div>
        <div className="bg-sunrise-amber/10 border-l-4 border-l-sunrise-amber p-4 rounded-lg shadow-sm border-y border-r border-sunrise-amber/20">
          <h3 className="text-sm font-semibold text-sunrise-amber mb-1 uppercase tracking-wider">Medium Risk</h3>
          <div className="text-3xl font-bold text-sunrise-amber">{medRisk.length} <span className="text-sm font-normal">clients</span></div>
        </div>
        <MetricCard title="Avg Recovery Score" value="72" subtitle="Across active census" color="blue" />
        <MetricCard title="Avg Cravings (7d)" value="4.2/10" subtitle="Self-reported" trend={{ value: '0.8', direction: 'down' }} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Priority Intervention List</h2>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[300px]">
            {[...highRisk, ...medRisk].map(p => (
              <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                <div className="flex gap-4">
                  <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="md" />
                  <div>
                    <div className="font-bold text-navy hover:text-sunrise-blue mb-1 flex items-center gap-2">
                      {p.firstName} {p.lastName}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${p.amaRisk === 'High' ? 'bg-critical text-white' : 'bg-sunrise-amber text-navy'}`}>
                        {p.amaRisk} Risk
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <span className="bg-bg border border-border text-slate text-[10px] px-2 py-0.5 rounded-full font-semibold">Cravings: {p.craving}/10</span>
                      {p.lastUa !== 'Negative' && <span className="bg-critical/10 border border-critical/20 text-critical text-[10px] px-2 py-0.5 rounded-full font-semibold">Positive UA</span>}
                      {p.asam.d5 >= 3 && <span className="bg-bg border border-border text-slate text-[10px] px-2 py-0.5 rounded-full font-semibold">ASAM D5 High</span>}
                    </div>
                  </div>
                </div>
                <RecoveryScoreBadge score={p.recoveryScore} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Mood & Craving Trends (14 Days)</h2>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#0F172A', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" name="Avg Mood" dataKey="mood" stroke="#16A34A" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Avg Cravings" dataKey="cravings" stroke="#DC2626" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg">
            <h2 className="font-bold text-navy">Risk Factor Heatmap</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-border font-semibold text-slate">Client</th>
                  {riskFactors.map((rf, i) => (
                    <th key={i} className="p-2 border-b border-border font-semibold text-slate text-center rotate-[-45deg] whitespace-nowrap h-24 align-bottom pb-2">
                      <div className="w-4">{rf}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...highRisk, ...medRisk].slice(0, 8).map((p, idx) => (
                  <tr key={p.id}>
                    <td className="p-2 border-b border-border font-medium text-navy whitespace-nowrap">{p.firstName} {p.lastName}</td>
                    {riskFactors.map((_, i) => {
                      // Randomize heatmap for mock visual
                      const isPresent = (p.amaRisk === 'High' && i < 3) || (Math.random() > 0.6);
                      return (
                        <td key={i} className="p-1 border-b border-border text-center">
                          <div className={`w-full h-6 rounded-sm ${isPresent ? 'bg-critical/80' : 'bg-bg'}`}></div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
