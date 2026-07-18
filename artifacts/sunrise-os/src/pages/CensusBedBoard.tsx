import React from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { FlagBadge } from '../components/ui/FlagBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { Screen } from '../App';

export function CensusBedBoard({ navigate }: { navigate: (s: Screen, id?: string) => void }) {
  const residentialBeds = Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}A`,
    type: 'Residential',
    patient: MOCK_PATIENTS.find(p => p.program === 'Residential' && p.bed === `${i + 1}A`),
    status: MOCK_PATIENTS.find(p => p.program === 'Residential' && p.bed === `${i + 1}A`) ? 'Occupied' : 'Available'
  }));

  const phpBeds = Array.from({ length: 6 }, (_, i) => ({
    id: `PHP-${i + 1}`,
    type: 'PHP',
    patient: MOCK_PATIENTS.find(p => p.program === 'PHP' && p.bed === `PHP-${i + 1}`),
    status: MOCK_PATIENTS.find(p => p.program === 'PHP' && p.bed === `PHP-${i + 1}`) ? 'Occupied' : 'Available'
  }));

  const renderBed = (bed: any) => {
    if (bed.status === 'Occupied' && bed.patient) {
      return (
        <div 
          key={bed.id} 
          onClick={() => navigate('PatientDetail', bed.patient.id)}
          className="bg-white border-2 border-sunrise-blue rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate bg-slate-100 px-2 py-0.5 rounded">{bed.id}</span>
            <div className="flex gap-1">
              {bed.patient.flags.slice(0,3).map((f: any, i: number) => <FlagBadge key={i} type={f.type} />)}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <PatientAvatar first={bed.patient.firstName} last={bed.patient.lastName} program={bed.patient.program} size="md" />
            <div>
              <div className="font-bold text-navy text-sm group-hover:text-sunrise-blue transition-colors">{bed.patient.firstName} {bed.patient.lastName}</div>
              <div className="text-xs text-slate">LOS: {bed.patient.los}d</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={bed.id} className="bg-bg border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center min-h-[100px] text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">
        <span className="text-xs font-bold mb-1">{bed.id}</span>
        <span className="text-xs">Available</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy">Census & Bed Board</h1>
          <p className="text-slate text-sm mt-1">Real-time facility occupancy and acuity management</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-border shadow-sm">
            <div className="w-3 h-3 bg-sunrise-blue rounded-full"></div> Occupied
          </div>
          <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-border shadow-sm">
            <div className="w-3 h-3 bg-border rounded-full"></div> Available
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            Residential 
            <span className="bg-slate-100 text-slate text-xs px-2 py-0.5 rounded-full font-semibold">10 Beds</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {residentialBeds.map(renderBed)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            Partial Hospitalization (PHP)
            <span className="bg-slate-100 text-slate text-xs px-2 py-0.5 rounded-full font-semibold">6 Slots</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {phpBeds.map(renderBed)}
        </div>
      </div>
    </div>
  );
}
