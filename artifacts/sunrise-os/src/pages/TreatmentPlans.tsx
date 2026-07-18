import React, { useState } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { Screen } from '../App';
import { Target, CheckCircle2, Clock, Search } from 'lucide-react';
import { PatientAvatar } from '../components/ui/PatientAvatar';

export function TreatmentPlans({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeTab, setActiveTab] = useState('Due for Review');

  const patientsWithGoals = MOCK_PATIENTS.filter(p => p.goals.length > 0);
  const patientsWithoutGoals = MOCK_PATIENTS.filter(p => p.goals.length === 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">Master Treatment Plans</h1>
          <p className="text-slate text-sm mt-1">Manage, review, and track clinical goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-sunrise-amber">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate text-sm">Due for Review (7 Days)</h3>
            <Clock className="w-5 h-5 text-sunrise-amber" />
          </div>
          <div className="text-2xl font-bold text-navy">12</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-critical">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate text-sm">Overdue / Missing</h3>
            <Target className="w-5 h-5 text-critical" />
          </div>
          <div className="text-2xl font-bold text-navy">{patientsWithoutGoals.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-success">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate text-sm">Goals Met (30 Days)</h3>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="text-2xl font-bold text-navy">24</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex gap-4">
            {['Due for Review', 'Active', 'Overdue/Missing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${
                  activeTab === tab ? 'border-navy text-navy' : 'border-transparent text-slate hover:text-navy'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-1.5 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue"
            />
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Client</th>
                <th className="p-4">Counselor</th>
                <th className="p-4 text-center">Active Goals</th>
                <th className="p-4 text-center">Goals Met</th>
                <th className="p-4">Next Review Due</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patientsWithGoals.map(p => {
                const metCount = p.goals.filter(g => g.status === 'Met').length;
                const totalCount = p.goals.length;
                const progress = totalCount === 0 ? 0 : (metCount / totalCount) * 100;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                        <div 
                          className="font-bold text-navy hover:text-sunrise-blue cursor-pointer"
                          onClick={() => navigate('PatientDetail')}
                        >
                          {p.firstName} {p.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate">{p.counselor.split(',')[0]}</td>
                    <td className="p-4 text-center font-bold text-navy">{totalCount}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="font-bold text-success">{metCount}</span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-success h-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-navy font-medium">11/05/2023</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-sunrise-blue/10 text-sunrise-blue text-xs font-bold rounded">Active</span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button className="text-sunrise-blue text-xs font-medium hover:underline">Update Plan</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
