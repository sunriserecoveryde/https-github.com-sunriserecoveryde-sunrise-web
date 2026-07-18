import React, { useState } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { Screen } from '../App';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { Search, Filter, FileCheck, AlertCircle } from 'lucide-react';

export function ASAMAssessments({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Sort by highest d5 (relapse potential) for demonstration
  const sortedPatients = [...MOCK_PATIENTS].sort((a, b) => b.asam.d5 - a.asam.d5);

  const getDimensionColor = (score: number) => {
    if (score >= 3) return 'bg-critical text-white';
    if (score === 2) return 'bg-sunrise-amber text-navy';
    if (score === 1) return 'bg-success text-white';
    return 'bg-slate-100 text-slate';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">ASAM Assessments</h1>
          <p className="text-slate text-sm mt-1">Review and manage multidimensional assessments across the census</p>
        </div>
        <button className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors">
          New Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-critical-bg flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-critical" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">12</div>
            <div className="text-sm font-medium text-slate">High Risk (Dim 5)</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-sunrise-amber/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-sunrise-amber" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">8</div>
            <div className="text-sm font-medium text-slate">Overdue Reviews</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">45</div>
            <div className="text-sm font-medium text-slate">Completed this month</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue"
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate border border-border px-3 py-2 rounded hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Client</th>
                <th className="p-4">Program</th>
                <th className="p-4 text-center" title="Acute Intoxication/Withdrawal">Dim 1</th>
                <th className="p-4 text-center" title="Biomedical Conditions">Dim 2</th>
                <th className="p-4 text-center" title="Emotional/Behavioral">Dim 3</th>
                <th className="p-4 text-center" title="Readiness to Change">Dim 4</th>
                <th className="p-4 text-center" title="Relapse Potential">Dim 5</th>
                <th className="p-4 text-center" title="Recovery Environment">Dim 6</th>
                <th className="p-4">Recommended LOC</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                      <div 
                        className="font-bold text-navy hover:text-sunrise-blue cursor-pointer"
                        onClick={() => navigate('PatientDetail', p.id)}
                      >
                        {p.firstName} {p.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate">{p.program}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d1)}`}>{p.asam.d1}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d2)}`}>{p.asam.d2}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d3)}`}>{p.asam.d3}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d4)}`}>{p.asam.d4}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d5)}`}>{p.asam.d5}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-6 h-6 rounded font-bold text-xs leading-6 ${getDimensionColor(p.asam.d6)}`}>{p.asam.d6}</span>
                  </td>
                  <td className="p-4 font-semibold text-navy">
                    {p.program === 'Residential' ? '3.7' : p.program === 'PHP' ? '2.5' : '2.1'}
                  </td>
                  <td className="p-4 text-slate">10/24/2023</td>
                  <td className="p-4">
                    <button className="text-sunrise-blue text-xs font-medium hover:underline">Review</button>
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
