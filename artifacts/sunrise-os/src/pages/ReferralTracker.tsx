import React from 'react';
import { MOCK_REFERRALS } from '../data/mockReferrals';
import { Screen } from '../App';
import { Network, PhoneCall, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';

export function ReferralTracker({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Network className="w-6 h-6 text-sunrise-orange" /> Referral Tracker
          </h1>
          <p className="text-slate text-sm mt-1">Manage partner relationships and admission pipeline</p>
        </div>
        <button className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors">
          Add Referral Source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Referrals (YTD)" value="270" subtitle="↑ 12% vs last year" color="blue" />
        <MetricCard title="Avg Conversion Rate" value="82%" subtitle="Admissions / Referrals" color="green" />
        <MetricCard title="Avg Time to Admit" value="2.4 days" subtitle="From first contact" color="amber" />
        <div className="bg-navy p-4 rounded-lg shadow-sm border border-navy-light text-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-1">Estimated Revenue</h3>
            <div className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" /> 4.2M
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">From referred admissions YTD</div>
        </div>
      </div>

      {/* AI BD Panel */}
      <div className="bg-gradient-to-r from-sunrise-orange/10 to-transparent border border-sunrise-orange/20 rounded-lg p-5 flex items-start gap-4">
        <div className="bg-sunrise-orange p-2 rounded-full shadow-sm text-white shrink-0 mt-1">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-navy text-lg flex items-center gap-2">
            AI Business Development Insight
          </h3>
          <p className="text-slate mt-1 text-sm max-w-3xl leading-relaxed">
            <strong className="text-navy">Call Dr. Peterson Clinic:</strong> They referred 8 clients earlier this year but haven't referred in <strong className="text-critical">47 days</strong>. 
            <br/><br/>
            <strong>Suggested Outreach:</strong> Send the new Relapse Prevention Program brief via email today, followed by a brief check-in call on Thursday morning.
          </p>
          <button className="mt-3 text-sm font-bold text-sunrise-orange hover:underline flex items-center gap-1">
            Log Outreach Activity <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="bg-white rounded-lg shadow-sm border border-border p-5 overflow-x-auto">
        <h3 className="font-bold text-navy mb-4">Active Pipeline</h3>
        <div className="flex gap-4 min-w-max pb-2">
          {['Referral Received', 'VOB/Assessment', 'Pending Admit', 'Active in Tx'].map((stage, i) => (
            <div key={stage} className="w-64 bg-bg border border-border rounded-lg p-3 flex flex-col h-[300px]">
              <div className="font-bold text-slate text-sm mb-3 uppercase tracking-wider">{stage} <span className="float-right bg-white px-1.5 rounded">{5 - i}</span></div>
              <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                {/* Mock Cards */}
                {Array.from({ length: 5 - i }).map((_, j) => (
                  <div key={j} className="bg-white p-3 border border-border rounded shadow-sm hover:border-sunrise-blue cursor-pointer">
                    <div className="font-bold text-navy text-sm mb-1">Jane Doe</div>
                    <div className="text-xs text-slate mb-2">From: Northside Hospital</div>
                    <div className="text-[10px] font-semibold text-slate-400">Expected: PHP</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-4 border-b border-border bg-bg flex justify-between items-center">
          <h2 className="font-bold text-navy">Partner Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Source / Organization</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-center">Referrals</th>
                <th className="p-4 text-center">Admitted</th>
                <th className="p-4 text-center">Conversion</th>
                <th className="p-4 text-center">Avg LOS</th>
                <th className="p-4">Last Referral</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_REFERRALS.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 pl-6 font-bold text-navy">{r.source}</td>
                  <td className="p-4 text-slate">{r.contact}</td>
                  <td className="p-4 text-center font-bold">{r.sent}</td>
                  <td className="p-4 text-center text-success font-bold">{r.admitted}</td>
                  <td className="p-4 text-center">
                    <span className="bg-bg border border-border px-2 py-1 rounded text-xs font-bold text-slate">{r.conversion}</span>
                  </td>
                  <td className="p-4 text-center font-medium text-slate">{r.avgLos}d</td>
                  <td className="p-4 text-slate">{r.lastDate}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                      r.status === 'Active' ? 'bg-success/20 text-success' :
                      r.status === 'At Risk' ? 'bg-sunrise-amber/20 text-sunrise-amber' :
                      'bg-slate-100 text-slate'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
