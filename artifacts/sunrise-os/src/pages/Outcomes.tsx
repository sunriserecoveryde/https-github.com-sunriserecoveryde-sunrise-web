import React from 'react';
import MetricCard from '@/components/MetricCard';
import { Award, TrendingDown, Target, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const Outcomes: React.FC = () => {
  
  const losData = [
    { day: '1', actual: 5.2, target: 4.5 }, { day: '5', actual: 4.8, target: 4.5 },
    { day: '10', actual: 4.9, target: 4.5 }, { day: '15', actual: 4.6, target: 4.5 },
    { day: '20', actual: 4.4, target: 4.5 }, { day: '25', actual: 4.3, target: 4.5 },
    { day: '30', actual: 4.2, target: 4.5 },
  ];

  const readmissionData = [
    { name: 'Heart Failure', rate: 18.2 },
    { name: 'COPD', rate: 15.4 },
    { name: 'Pneumonia', rate: 12.1 },
    { name: 'Sepsis', rate: 14.5 },
    { name: 'CABG', rate: 8.3 },
  ];

  const qualityData = [
    { subject: 'Safety', A: 92, fullMark: 100 },
    { subject: 'Timeliness', A: 85, fullMark: 100 },
    { subject: 'Effectiveness', A: 96, fullMark: 100 },
    { subject: 'Equity', A: 99, fullMark: 100 },
    { subject: 'Efficiency', A: 78, fullMark: 100 },
    { subject: 'Pt Centered', A: 88, fullMark: 100 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-navy flex items-center gap-2">
          <Award className="text-success" /> Analytics & Outcomes
        </h1>
        <p className="text-[13px] text-slate-light font-medium mt-1">30-day trailing quality metrics and performance indicators.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="30D Readmission" value="12.4%" trend="down" trendValue="-1.2%" color="teal" />
        <MetricCard label="Avg LOS" value="4.2d" trend="down" trendValue="-0.3d" color="blue" />
        <MetricCard label="Patient Satisfaction" value="88.5" trend="up" trendValue="+2.1" color="green" />
        <MetricCard label="Quality Score" value="94/100" trend="flat" trendValue="Target: 95" color="purple" trendGood={false} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LOS Trend */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
              <TrendingDown size={16} className="text-sunrise-blue" />
              Length of Stay Trend (30 Days)
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={losData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748B'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold', color: '#0F172A' }} 
                />
                <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 0}} name="Actual LOS" />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target LOS" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Readmission by DRG */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2">
              <Target size={16} className="text-sunrise-orange" />
              Readmission by DRG
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readmissionData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748B'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#0F172A', fontWeight: 600}} width={90} />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Bar dataKey="rate" fill="#F97316" radius={[0, 4, 4, 0]} barSize={24} name="Readmission Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Radar & Text Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-border rounded-xl p-5 shadow-sm">
          
          <div className="flex flex-col">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-purple" />
              Quality Domains
            </h3>
            <div className="h-[280px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Hospital Score" dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.4} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <h4 className="text-[12px] font-bold text-navy border-b border-border pb-2">Key Improvement Areas</h4>
            
            <div className="flex flex-col gap-4">
              {[
                { title: "Medication Reconciliation", metric: "88% → 94%", diff: "+6%", color: "text-success", bg: "bg-success/10" },
                { title: "Sepsis Bundle Compliance", metric: "92% → 98%", diff: "+6%", color: "text-success", bg: "bg-success/10" },
                { title: "Discharge Summaries < 24h", metric: "71% → 78%", diff: "+7%", color: "text-success", bg: "bg-success/10" },
                { title: "Patient Education Documentation", metric: "84% → 82%", diff: "-2%", color: "text-critical", bg: "bg-critical/10" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-bg">
                  <div className="text-[13px] font-bold text-navy">{item.title}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-slate">{item.metric}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.bg} ${item.color}`}>{item.diff}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Outcomes;
