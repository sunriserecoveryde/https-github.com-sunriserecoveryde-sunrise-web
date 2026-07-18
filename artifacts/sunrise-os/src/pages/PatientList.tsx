import React, { useState } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { Screen } from '../App';
import { Search, Filter, Plus } from 'lucide-react';

export function PatientList({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_PATIENTS.filter(p => 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">Patient List</h1>
          <p className="text-slate text-sm mt-1">Active Census: {MOCK_PATIENTS.length} patients</p>
        </div>
        <button className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Admit Patient
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or MRN..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-bg border border-border rounded text-sm px-3 py-2 text-slate font-medium focus:outline-none">
              <option>All Programs</option>
              <option>Residential</option>
              <option>PHP</option>
              <option>IOP</option>
            </select>
            <button className="flex items-center gap-2 text-sm font-medium text-slate border border-border px-3 py-2 rounded hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 rounded-tl">Flags</th>
                <th className="p-4">Client</th>
                <th className="p-4">Program</th>
                <th className="p-4">Primary Diagnosis</th>
                <th className="p-4 text-center">LOS</th>
                <th className="p-4 text-center">Acuity</th>
                <th className="p-4 text-center">RES</th>
                <th className="p-4">Counselor</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex gap-1 max-w-[60px] flex-wrap">
                      {p.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} />)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="md" />
                      <div>
                        <div 
                          className="font-bold text-navy hover:text-sunrise-blue cursor-pointer"
                          onClick={() => navigate('PatientDetail', p.id)}
                        >
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-slate font-mono">{p.mrn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate bg-slate-100 px-2 py-1 rounded">{p.program}</span>
                  </td>
                  <td className="p-4 max-w-[200px] truncate" title={p.primaryDiagnosis}>
                    {p.primaryDiagnosis}
                  </td>
                  <td className="p-4 text-center font-medium">
                    {p.los}d
                  </td>
                  <td className="p-4 text-center">
                    <AcuityBadge acuity={p.amaRisk === 'High' ? 'Critical' : (p.amaRisk === 'Med' ? 'High' : 'Routine')} />
                  </td>
                  <td className="p-4 text-center">
                    <RecoveryScoreBadge score={p.recoveryScore} />
                  </td>
                  <td className="p-4 text-slate">
                    {p.counselor.split(',')[0]}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate('PatientDetail', p.id)}
                      className="text-sunrise-blue text-xs font-medium hover:underline bg-sunrise-blue/10 px-3 py-1.5 rounded"
                    >
                      View Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate">
              No patients found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
