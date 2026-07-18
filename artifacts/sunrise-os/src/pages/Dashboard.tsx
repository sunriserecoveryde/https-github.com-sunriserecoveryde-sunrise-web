import React from 'react';
import MetricCard from '@/components/MetricCard';
import AlertItem from '@/components/AlertItem';
import OccupancyRing from '@/components/OccupancyRing';
import PatientTable from '@/components/PatientTable';
import { patients, alerts, deadlines } from '@/data/mockData';
import { AlertTriangle, Clock, ArrowRight, Zap, Play, FileText } from 'lucide-react';

interface DashboardProps {
  onPatientClick: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPatientClick }) => {
  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
      
      {/* Role Banner */}
      <div className="bg-routine/5 border border-routine/20 rounded-xl p-3 px-4 flex items-center gap-3">
        <div className="bg-routine/10 text-routine p-2 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-navy flex items-center gap-2">
            Charge Nurse — 3-North ICU 
            <span className="text-slate-light text-[12px] font-medium hidden sm:inline">| Metro General Hospital</span>
          </div>
          <div className="text-[12px] text-slate-light mt-0.5">Shift: 07:00–19:00 (4.5 hrs remaining)</div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
          </span>
          <span className="text-[11px] font-bold text-success uppercase tracking-wider">Shift Active</span>
        </div>
      </div>

      {/* Cosign Banner */}
      <div className="bg-gradient-to-r from-moderate/10 to-amber-500/5 border border-moderate/30 rounded-xl p-3 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-moderate text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[15px] shadow-sm">
            3
          </div>
          <div>
            <div className="text-[13px] font-bold text-navy flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-moderate" />
              Orders Pending Co-Signature
            </div>
            <div className="text-[11.5px] text-slate-light">Dr. Patel requested co-sign on high-risk medications</div>
          </div>
        </div>
        <button className="bg-white border border-moderate/30 text-moderate hover:bg-moderate/5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-colors">
          Review Now
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard 
          label="Unit Census" 
          value="24/28" 
          subtext="85.7% Occupancy" 
          color="orange" 
        />
        <MetricCard 
          label="Critical Alerts" 
          value="3" 
          trend="up" 
          trendValue="+1" 
          trendGood={false}
          color="red" 
        />
        <MetricCard 
          label="Pending Orders" 
          value="7" 
          color="blue" 
          subtext="4 STAT, 3 Routine"
        />
        <MetricCard 
          label="Avg LOS (Days)" 
          value="4.2" 
          trend="down" 
          trendValue="-0.3" 
          color="teal" 
        />
        <MetricCard 
          label="Discharges Today" 
          value="2" 
          subtext="1 expected, 1 actual"
          color="green" 
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          
          {/* Occupancy Card */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate">Bed Status</h3>
              <button className="text-[11px] font-bold text-sunrise-orange hover:underline">Manage</button>
            </div>
            
            <div className="flex items-center gap-5 mb-6">
              <OccupancyRing percent={85.7} label="Occupied" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-slate-light">Occupied</span>
                  <span className="font-bold text-navy">24</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-sunrise-orange w-[85.7%]"></div>
                </div>
                
                <div className="flex justify-between items-center text-[12px] mt-1">
                  <span className="text-slate-light">Available</span>
                  <span className="font-bold text-navy">4</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[14.3%]"></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'ICU', current: 8, max: 8, color: 'bg-critical' },
                { label: 'PCU', current: 6, max: 8, color: 'bg-high' },
                { label: 'Med-Surg', current: 10, max: 12, color: 'bg-moderate' },
              ].map(unit => (
                <div key={unit.label}>
                  <div className="flex justify-between text-[11px] font-bold text-navy mb-1">
                    <span>{unit.label}</span>
                    <span>{unit.current}/{unit.max}</span>
                  </div>
                  <div className="w-full h-2 bg-bg border border-border rounded-full overflow-hidden">
                    <div className={`h-full ${unit.color}`} style={{ width: `${(unit.current/unit.max)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
                <Zap size={14} className="text-critical" />
                Active Alerts
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {alerts.map(a => (
                <AlertItem key={a.id} {...a} />
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* AI Brief */}
          <div className="bg-gradient-to-br from-navy to-navy-mid border border-sunrise-orange/30 rounded-xl p-6 relative overflow-hidden shadow-md">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sunrise-orange via-sunrise-amber to-purple"></div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunrise-orange to-sunrise-amber flex items-center justify-center text-white">
                <Zap size={16} className="fill-current" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">AI Shift Summary</h3>
                <div className="text-[11px] text-white/40 font-medium">Generated 10m ago based on current unit data</div>
              </div>
            </div>
            
            <p className="text-[14px] text-white/80 leading-relaxed mb-5">
              Unit is currently running at <strong className="text-sunrise-amber">high capacity (85.7%)</strong> with the ICU fully saturated. 
              Acuity is trending higher than yesterday, with 3 new critical alerts in the last hour. 
              <strong className="text-sunrise-amber"> Staffing is balanced</strong>, but closely monitor assignments for S. Jenkins given two high-acuity admissions. 
              Recommend expediting the two pending discharges to open beds for expected ED transfers.
            </p>
            
            <div className="flex items-center gap-3">
              <button className="bg-sunrise-orange/15 border border-sunrise-orange/40 text-sunrise-amber hover:bg-sunrise-orange/25 px-4 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-2">
                <FileText size={14} />
                View Detailed Report
              </button>
            </div>
          </div>

          {/* Grid for Deadlines & Doc Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Deadlines */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
                  <Clock size={14} />
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {deadlines.map(d => (
                  <div key={d.id} className="flex items-center p-2.5 rounded-lg border border-border bg-bg gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${d.color === 'red' ? 'critical' : d.color === 'orange' ? 'high' : d.color === 'amber' ? 'moderate' : 'routine'}`}></div>
                    <div className="flex-1 text-[13px] font-semibold text-navy truncate">{d.task}</div>
                    <div className={`text-[11px] font-bold whitespace-nowrap ${d.status === 'urg' ? 'text-critical' : d.status === 'soon' ? 'text-high' : 'text-slate-light'}`}>
                      {d.due}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doc Status */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate mb-4">Documentation Status</h3>
              <div className="flex items-center gap-5 flex-1">
                <div className="relative w-[80px] h-[80px] shrink-0">
                  <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-border" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" className="stroke-success" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="32.6" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-extrabold text-navy leading-none">87%</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[12px] border-b border-border pb-1">
                    <span className="font-semibold text-navy">Assessments</span>
                    <span className="text-success font-bold">22/24</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] border-b border-border pb-1">
                    <span className="font-semibold text-navy">Care Plans</span>
                    <span className="text-success font-bold">20/24</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] pb-1">
                    <span className="font-semibold text-navy">Education</span>
                    <span className="text-moderate font-bold">14/24</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Patient Table */}
      <div className="mt-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[16px] font-extrabold text-navy">My Patients</h2>
          <button 
            onClick={() => {}} 
            className="text-[12px] font-bold text-sunrise-blue hover:text-sunrise-blue/80 flex items-center gap-1"
          >
            View All Patients <ArrowRight size={14} />
          </button>
        </div>
        <PatientTable patients={patients.slice(0, 8)} onPatientClick={onPatientClick} />
      </div>

    </div>
  );
};

export default Dashboard;
