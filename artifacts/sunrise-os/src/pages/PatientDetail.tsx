import React, { useState } from 'react';
import { patients } from '@/data/mockData';
import { ArrowLeft, Activity, Pill, FlaskConical, Stethoscope, FileText as NoteIcon, Camera } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

interface PatientDetailProps {
  patientId: string | null;
  onBack: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onBack }) => {
  const patient = patients.find(p => p.id === patientId) || patients[0];
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'orders', label: 'Orders', icon: Stethoscope },
    { id: 'meds', label: 'Medications', icon: Pill },
    { id: 'notes', label: 'Notes', icon: NoteIcon },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging', icon: Camera },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-[13px] font-bold text-slate hover:text-sunrise-orange w-fit transition-colors">
        <ArrowLeft size={16} /> Back to List
      </button>

      {/* Header Card */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-sunrise-orange to-sunrise-amber"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pl-4">
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md flex items-center justify-center text-2xl font-extrabold text-slate-500">
              {patient.initials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[24px] font-extrabold text-navy">{patient.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  patient.acuity === 'Critical' ? 'bg-critical text-white' : 
                  patient.acuity === 'High' ? 'bg-high text-white' : 'bg-moderate text-white'
                }`}>
                  {patient.acuity}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-success/10 text-success border border-success/20 uppercase">
                  {patient.status}
                </span>
              </div>
              <div className="text-[13px] font-medium text-slate flex flex-wrap items-center gap-3">
                <span className="text-navy">{patient.mrn}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{patient.age}y {patient.gender} • DOB: {patient.dob}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-navy font-bold">{patient.room}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <button className="bg-white border border-border text-navy px-4 py-2 rounded-lg text-[12px] font-bold shadow-sm hover:bg-slate-50 transition-colors">
              Add Note
            </button>
            <button className="bg-gradient-to-r from-sunrise-orange to-sunrise-amber text-white px-4 py-2 rounded-lg text-[12px] font-bold shadow-[0_2px_6px_rgba(249,115,22,0.3)] hover:opacity-90 transition-opacity">
              Order Entry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border pl-4 text-[13px]">
          <div>
            <div className="text-slate-light text-[11px] font-bold uppercase mb-1">Primary Diagnosis</div>
            <div className="font-bold text-navy">{patient.diagnosis}</div>
          </div>
          <div>
            <div className="text-slate-light text-[11px] font-bold uppercase mb-1">Attending Provider</div>
            <div className="font-bold text-navy">{patient.provider}</div>
          </div>
          <div>
            <div className="text-slate-light text-[11px] font-bold uppercase mb-1">Length of Stay</div>
            <div className="font-bold text-navy">{patient.los} Days</div>
          </div>
          <div>
            <div className="text-slate-light text-[11px] font-bold uppercase mb-1">Code Status</div>
            <div className="font-bold text-success">Full Code</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-border pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-sunrise-orange text-sunrise-orange bg-white' 
                : 'border-transparent text-slate hover:text-navy hover:bg-white/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Heart Rate" value="88" subtext="bpm" color="blue" />
            <MetricCard label="Blood Pressure" value="118/74" subtext="mmHg" color="teal" />
            <MetricCard label="Resp Rate" value="16" subtext="bpm" color="green" />
            <MetricCard label="SpO2" value="98%" subtext="Room Air" color="blue" />
            <MetricCard label="Temp" value="37.2" subtext="°C" color="orange" />
            <MetricCard label="Pain Score" value="3/10" subtext="Resting" color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate mb-5 border-b border-border pb-3">Recent Notes</h3>
              <div className="flex flex-col gap-4">
                {[
                  { title: "Nursing Shift Note", time: "2 hours ago", author: "S. Jenkins, RN", text: "Patient resting comfortably. Denies pain. Vitals stable. Tolerating oral intake well." },
                  { title: "Progress Note", time: "6 hours ago", author: "Dr. S. Patel", text: "Patient continues to improve on current antibiotic regimen. Plan to transition to PO tomorrow." }
                ].map((note, i) => (
                  <div key={i} className="bg-bg p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-[13px] text-navy">{note.title}</div>
                      <div className="text-[11px] text-slate-light font-medium">{note.time}</div>
                    </div>
                    <div className="text-[13px] text-slate leading-relaxed mb-3">{note.text}</div>
                    <div className="text-[11px] text-slate-light font-bold">— {note.author}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate mb-5 border-b border-border pb-3">Clinical Outcomes Tracker</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Sepsis Bundle", pct: 100, color: "bg-success" },
                  { label: "VTE Prophylaxis", pct: 100, color: "bg-success" },
                  { label: "Pain Reassessment", pct: 75, color: "bg-moderate" },
                  { label: "Discharge Readiness", pct: 40, color: "bg-sunrise-blue" }
                ].map((item, i) => (
                  <div key={i} className="bg-bg p-3 rounded-lg border border-border">
                    <div className="text-[11.5px] font-bold text-slate mb-1">{item.label}</div>
                    <div className="text-[18px] font-extrabold text-navy mb-2">{item.pct}%</div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for other tabs */}
      {activeTab !== 'overview' && (
        <div className="bg-white border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in duration-300 min-h-[300px]">
          <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4 text-slate-300">
            <Activity size={32} />
          </div>
          <h3 className="text-[16px] font-bold text-navy mb-2">Detailed view coming soon</h3>
          <p className="text-[13px] text-slate max-w-sm">
            This module is simulated for the demo. In production, this would fetch real-time {activeTab} data via FHIR APIs.
          </p>
        </div>
      )}

    </div>
  );
};

export default PatientDetail;
