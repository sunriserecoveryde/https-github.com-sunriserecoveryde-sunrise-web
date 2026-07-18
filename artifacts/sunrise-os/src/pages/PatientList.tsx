import React, { useState } from 'react';
import PatientTable from '@/components/PatientTable';
import { patients } from '@/data/mockData';
import { Search, Filter, Download } from 'lucide-react';

interface PatientListProps {
  onPatientClick: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onPatientClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [acuityFilter, setAcuityFilter] = useState('All');
  
  const filteredPatients = patients.filter(p => {
    if (acuityFilter !== 'All' && p.acuity !== acuityFilter) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.room.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy">Patient List</h1>
          <p className="text-[13px] text-slate-light font-medium mt-1">All active and admitted patients across Metro General.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-border text-navy px-4 py-2 rounded-lg text-[12.5px] font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={14} />
            Export List
          </button>
          <button className="bg-gradient-to-r from-sunrise-orange to-sunrise-amber text-white px-4 py-2 rounded-lg text-[12.5px] font-bold shadow-[0_2px_6px_rgba(249,115,22,0.3)] hover:opacity-90 transition-opacity">
            + New Admission
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-border rounded-xl p-3 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
          <input 
            type="text" 
            placeholder="Search name, room, MRN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[12.5px] border border-border rounded-lg bg-bg focus:outline-none focus:border-sunrise-orange focus:ring-2 focus:ring-sunrise-orange/10 transition-all"
          />
        </div>
        
        <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

        <select 
          className="px-3 py-2 text-[12.5px] font-medium border border-border rounded-lg bg-white text-navy focus:outline-none focus:border-sunrise-orange cursor-pointer"
          value={acuityFilter}
          onChange={(e) => setAcuityFilter(e.target.value)}
        >
          <option value="All">All Acuity Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Routine">Routine</option>
        </select>

        <select className="px-3 py-2 text-[12.5px] font-medium border border-border rounded-lg bg-white text-navy focus:outline-none focus:border-sunrise-orange cursor-pointer hidden sm:block">
          <option>All Units</option>
          <option>3-North ICU</option>
          <option>4-South PCU</option>
          <option>Med-Surg</option>
        </select>

        <select className="px-3 py-2 text-[12.5px] font-medium border border-border rounded-lg bg-white text-navy focus:outline-none focus:border-sunrise-orange cursor-pointer hidden md:block">
          <option>All Providers</option>
          <option>Dr. S. Patel</option>
          <option>Dr. K. Lee</option>
          <option>Dr. J. Chen</option>
        </select>

        <select className="px-3 py-2 text-[12.5px] font-medium border border-border rounded-lg bg-white text-navy focus:outline-none focus:border-sunrise-orange cursor-pointer hidden lg:block">
          <option>Active Status</option>
          <option>On Hold</option>
          <option>Discharged</option>
        </select>

        <button className="ml-auto p-2 text-slate hover:bg-slate-100 rounded-lg border border-transparent hover:border-border transition-all">
          <Filter size={16} />
        </button>
      </div>

      {/* Patient Table */}
      <PatientTable patients={filteredPatients} onPatientClick={onPatientClick} />

    </div>
  );
};

export default PatientList;
