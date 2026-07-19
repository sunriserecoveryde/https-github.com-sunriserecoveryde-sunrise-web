import React, { useState } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { Screen } from '../App';
import { Search, Filter, PenTool, CheckCircle, Clock } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

export function ProgressNotes({ navigate, readOnly }: { navigate: (s: Screen) => void; readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState('All Notes');
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten notes from all patients
  const allNotes = MOCK_PATIENTS.flatMap(p => 
    p.notes.map(n => ({
      ...n,
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`,
      program: p.program
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredNotes = allNotes.filter(n => {
    if (activeTab === 'Awaiting Co-sign' && n.status !== 'Awaiting Co-sign') return false;
    if (activeTab === 'Drafts' && n.status !== 'Draft') return false;
    if (searchTerm && !n.patientName.toLowerCase().includes(searchTerm.toLowerCase()) && !n.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">Progress Notes Queue</h1>
          <p className="text-slate text-sm mt-1">Manage and review all clinical documentation</p>
        </div>
        <LockedButton locked={readOnly} className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light shadow-sm transition-colors">
          <PenTool className="w-4 h-4" /> Batch Sign Notes
        </LockedButton>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {['All Notes', 'Awaiting Co-sign', 'Drafts', 'My Notes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-sunrise-orange text-sunrise-orange bg-sunrise-orange/5' 
                  : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-bg/50">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes, patients, or authors..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded text-sm focus:outline-none focus:border-sunrise-blue"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-white border border-border rounded text-sm px-3 py-2 text-slate font-medium focus:outline-none">
              <option>All Note Types</option>
              <option>Individual</option>
              <option>Group</option>
              <option>Medical</option>
            </select>
            <button className="flex items-center gap-2 text-sm font-medium text-slate bg-white border border-border px-3 py-2 rounded hover:bg-slate-50">
              <Filter className="w-4 h-4" /> More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                <th className="p-4">Date / Time</th>
                <th className="p-4">Client</th>
                <th className="p-4">Note Type</th>
                <th className="p-4 w-1/3">Content Preview</th>
                <th className="p-4">Author</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredNotes.map(n => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="p-4 pl-6">
                    <input type="checkbox" className="rounded border-border text-sunrise-blue" />
                  </td>
                  <td className="p-4 text-navy font-medium whitespace-nowrap">{n.date}</td>
                  <td className="p-4 font-semibold text-navy hover:text-sunrise-blue cursor-pointer" onClick={() => navigate('PatientDetail')}>
                    {n.patientName}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold bg-slate-100 text-slate px-2 py-1 rounded">{n.type}</span>
                  </td>
                  <td className="p-4 text-slate text-xs truncate max-w-xs" title={n.content}>
                    {n.content}
                  </td>
                  <td className="p-4 text-slate">{n.author}</td>
                  <td className="p-4">
                    {n.status === 'Signed' && <span className="flex items-center gap-1 text-success text-xs font-bold"><CheckCircle className="w-3 h-3"/> Signed</span>}
                    {n.status === 'Awaiting Co-sign' && <span className="flex items-center gap-1 text-sunrise-amber text-xs font-bold"><Clock className="w-3 h-3"/> Co-sign Req</span>}
                    {n.status === 'Draft' && <span className="text-slate text-xs font-bold">Draft</span>}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <LockedButton
                      locked={readOnly && n.status === 'Awaiting Co-sign'}
                      className="text-sunrise-blue text-xs font-medium hover:underline bg-sunrise-blue/10 px-3 py-1.5 rounded whitespace-nowrap"
                    >
                      {n.status === 'Awaiting Co-sign' ? 'Review & Sign' : 'View Note'}
                    </LockedButton>
                  </td>
                </tr>
              ))}
              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate">No notes match your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
