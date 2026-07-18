import React from 'react';
import MetricCard from '@/components/MetricCard';
import { incidents, staffAssignments } from '@/data/mockData';
import { ShieldAlert, Users, RadioTower } from 'lucide-react';

const CommandCenter: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-navy flex items-center gap-2">
          <RadioTower className="text-sunrise-blue" /> Command Center
        </h1>
        <p className="text-[13px] text-slate-light font-medium mt-1">Real-time hospital operations and incident management.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Real-time Census" value="342" subtext="92% capacity" color="orange" />
        <MetricCard label="Code Alerts (24h)" value="4" trend="down" trendValue="-2" color="red" trendGood />
        <MetricCard label="Pending STAT Labs" value="12" subtext="Avg TAT: 32m" color="blue" />
        <MetricCard label="Pending Imaging" value="8" subtext="3 STAT, 5 Routine" color="teal" />
        <MetricCard label="Overnight Admits" value="28" trend="up" trendValue="+4" color="purple" trendGood={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Incidents */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
              <ShieldAlert size={16} className="text-critical" />
              Active Incidents
            </h3>
            <button className="text-[12px] font-bold text-sunrise-orange hover:underline">View All</button>
          </div>
          
          <div className="flex flex-col gap-3">
            {incidents.map(inc => (
              <div key={inc.id} className="p-4 rounded-lg border border-border bg-bg hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase 
                      ${inc.severity === 'Critical' ? 'bg-critical text-white' : 
                        inc.severity === 'High' ? 'bg-high text-white' : 
                        inc.severity === 'Moderate' ? 'bg-moderate text-white' : 
                        'bg-routine text-white'}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[13px] font-bold text-navy">{inc.id}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-light bg-white px-2 py-0.5 rounded border border-border">{inc.time}</span>
                </div>
                <p className="text-[13px] text-navy font-medium mb-3">{inc.desc}</p>
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-slate flex items-center gap-1">📍 {inc.location}</span>
                  <span className={`font-bold ${inc.status === 'Open' ? 'text-critical' : inc.status === 'Investigating' ? 'text-high' : 'text-success'}`}>
                    {inc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Staff */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
              <Users size={16} className="text-sunrise-blue" />
              Staff Assignments
            </h3>
            <div className="flex gap-2">
              <select className="text-[11px] border border-border rounded bg-bg px-2 py-1 font-bold text-slate-600 outline-none">
                <option>ICU 3-North</option>
                <option>PCU 4-South</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden border border-border rounded-lg">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-bg border-b border-border text-[11px] uppercase tracking-wider font-bold text-slate">
                <tr>
                  <th className="p-3 pl-4">Staff Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Patients</th>
                  <th className="p-3 text-right pr-4">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {staffAssignments.map((staff, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-4 text-navy font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sunrise-blue/10 text-sunrise-blue flex items-center justify-center text-[10px]">
                        {staff.name.charAt(0)}
                      </div>
                      {staff.name}
                    </td>
                    <td className="p-3 text-slate-light">{staff.role}</td>
                    <td className="p-3 text-navy">
                      <div className="flex gap-1 flex-wrap">
                        {staff.patients.map(p => (
                          <span key={p} className="bg-bg border border-border px-1.5 py-0.5 rounded text-[11px]">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <span className="text-success font-bold bg-success/10 px-2 py-0.5 rounded">{staff.load}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Handoff Timeline */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm mt-2">
        <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate mb-5">Shift Handoff Timeline</h3>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-bg border-y border-border -translate-y-1/2 z-0"></div>
          <div className="flex justify-between relative z-10">
            {['07:00 (Start)', '11:00 (Rounds)', '15:00 (Update)', '19:00 (Handoff)'].map((time, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 ${i === 0 ? 'bg-success border-success' : i === 1 ? 'bg-sunrise-blue border-sunrise-blue' : 'bg-white border-slate-300'}`}></div>
                <span className={`text-[12px] font-bold ${i < 2 ? 'text-navy' : 'text-slate-light'}`}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CommandCenter;
