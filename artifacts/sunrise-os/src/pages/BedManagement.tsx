import React from 'react';
import OccupancyRing from '@/components/OccupancyRing';
import { BedDouble, ArrowRight, UserMinus, UserPlus } from 'lucide-react';

const BedManagement: React.FC = () => {
  const units = [
    { name: "3-North ICU", type: "Critical Care", beds: 8, occ: 8, arr: ["red","red","red","red","red","red","red","red"] },
    { name: "4-South PCU", type: "Step-down", beds: 8, occ: 6, arr: ["amber","amber","amber","amber","amber","amber","green","green"] },
    { name: "5-East Med-Surg", type: "Acute Care", beds: 12, occ: 10, arr: ["blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","green","gray"] },
    { name: "ED Hold", type: "Observation", beds: 6, occ: 4, arr: ["amber","amber","amber","amber","green","green"] }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy flex items-center gap-2">
            <BedDouble className="text-sunrise-orange" /> Bed Management
          </h1>
          <p className="text-[13px] text-slate-light font-medium mt-1">Hospital-wide census and flow control.</p>
        </div>
        <button className="bg-navy text-white px-4 py-2 rounded-lg text-[12.5px] font-bold shadow-sm hover:bg-navy/90 transition-colors">
          Optimize Flow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Occupancy */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate mb-6 w-full text-left">House-wide Census</h3>
          <OccupancyRing percent={82.3} label="Capacity" size={160} strokeWidth={14} />
          
          <div className="grid grid-cols-3 gap-8 mt-8 w-full border-t border-border pt-6">
            <div>
              <div className="text-[24px] font-extrabold text-navy">28</div>
              <div className="text-[11px] font-bold text-slate-light uppercase">Occupied</div>
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-success">6</div>
              <div className="text-[11px] font-bold text-slate-light uppercase">Available</div>
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-slate-300">1</div>
              <div className="text-[11px] font-bold text-slate-light uppercase">Cleaning</div>
            </div>
          </div>
        </div>

        {/* Unit Breakdown */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {units.map(u => (
            <div key={u.name} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[15px] font-extrabold text-navy">{u.name}</h4>
                  <div className="text-[11.5px] font-medium text-slate-light">{u.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-navy">{u.occ}/{u.beds}</div>
                  <div className="text-[10px] font-bold uppercase text-slate">Beds Full</div>
                </div>
              </div>

              {/* Bed Grid Visual */}
              <div className="flex flex-wrap gap-2 mb-4">
                {u.arr.map((status, i) => (
                  <div 
                    key={i} 
                    className={`w-10 h-10 rounded-md border flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform hover:scale-105 cursor-pointer ${
                      status === 'red' ? 'bg-critical/10 border-critical/30 text-critical' :
                      status === 'amber' ? 'bg-high/10 border-high/30 text-high' :
                      status === 'blue' ? 'bg-routine/10 border-routine/30 text-routine' :
                      status === 'green' ? 'bg-success/10 border-success/30 text-success' :
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    B{i+1}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div className="flex gap-3 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1 text-slate"><div className="w-2 h-2 bg-success rounded-sm"></div> Open</span>
                  <span className="flex items-center gap-1 text-slate"><div className="w-2 h-2 bg-routine rounded-sm"></div> Occ</span>
                  <span className="flex items-center gap-1 text-slate"><div className="w-2 h-2 bg-slate-200 rounded-sm"></div> Dirty</span>
                </div>
                <button className="text-[11px] font-bold text-sunrise-blue flex items-center gap-1">
                  Manage <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Movement Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-4">
            <UserMinus size={16} className="text-success" /> Pending Discharges
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { name: "J. Wilson", room: "ICU-03", time: "11:00 AM", status: "Waiting on transport" },
              { name: "R. Taylor", room: "ICU-05", time: "1:00 PM", status: "Orders signed" }
            ].map((d, i) => (
              <div key={i} className="p-3 border border-border rounded-lg flex justify-between items-center bg-bg">
                <div>
                  <div className="font-bold text-[13px] text-navy">{d.name} <span className="text-slate font-medium text-[11px] ml-1">{d.room}</span></div>
                  <div className="text-[11.5px] text-slate-light">{d.status}</div>
                </div>
                <div className="text-[12px] font-bold text-success bg-success/10 px-2 py-1 rounded">Exp: {d.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-critical" /> Expected Admissions
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { source: "ED", acuity: "Critical", time: "ASAP", status: "Awaiting bed assignment" },
              { source: "OR", acuity: "High", time: "12:30 PM", status: "In recovery" },
              { source: "Direct Transfer", acuity: "Moderate", time: "14:00 PM", status: "En route" }
            ].map((a, i) => (
              <div key={i} className="p-3 border border-border rounded-lg flex justify-between items-center bg-bg">
                <div>
                  <div className="font-bold text-[13px] text-navy">From: {a.source}</div>
                  <div className="text-[11.5px] text-slate-light">{a.status}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    a.acuity === 'Critical' ? 'bg-critical text-white' : 
                    a.acuity === 'High' ? 'bg-high text-white' : 'bg-moderate text-white'
                  }`}>{a.acuity}</span>
                  <div className="text-[11px] font-bold text-navy">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BedManagement;
