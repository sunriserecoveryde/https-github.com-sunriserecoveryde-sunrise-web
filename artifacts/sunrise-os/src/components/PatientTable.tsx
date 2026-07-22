import React from 'react';
import { Patient } from '@/data/mockData';
import { FileText, Edit } from 'lucide-react';

interface PatientTableProps {
  patients: Patient[];
  onPatientClick: (id: string) => void;
}

const PatientTable: React.FC<PatientTableProps> = ({ patients, onPatientClick }) => {
  const getAcuityColor = (acuity: string) => {
    switch(acuity) {
      case 'Critical': return 'bg-[#FEF2F2] text-critical border border-critical/30';
      case 'High': return 'bg-[#FFF7ED] text-high border border-high/30';
      case 'Moderate': return 'bg-[#FFFBEB] text-moderate border border-moderate/30';
      case 'Routine': return 'bg-[#EFF6FF] text-routine border border-routine/30';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success">Active</span>;
      case 'On Hold': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-moderate/10 text-moderate">On Hold</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate/10 text-slate">{status}</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-border shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg border-b border-border text-[11px] font-bold text-slate uppercase tracking-wider">
            <th className="p-3 pl-4">Patient</th>
            <th className="p-3">Location</th>
            <th className="p-3">Acuity</th>
            <th className="p-3">LOS</th>
            <th className="p-3">Orders/Alerts</th>
            <th className="p-3">Last Assessed</th>
            <th className="p-3">Provider</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {patients.map(p => (
            <tr 
              key={p.id} 
              onClick={() => onPatientClick(p.id)}
              className="hover:bg-sunrise-orange/5 cursor-pointer transition-colors group"
            >
              <td className="p-3 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 group-hover:border-sunrise-orange/30">
                    {p.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-navy">{p.name}</div>
                    <div className="text-[11px] text-slate-light">{p.mrn} • {p.age}{p.gender}</div>
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div className="text-[12.5px] font-semibold text-navy">{p.room}</div>
                <div className="text-[11px] text-slate-light">{p.unit}</div>
              </td>
              <td className="p-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getAcuityColor(p.acuity)}`}>
                  {p.acuity}
                </span>
              </td>
              <td className="p-3 text-[12.5px] font-medium text-navy">
                {p.los} d
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  {p.ordersPending > 0 ? (
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-routine/10 text-routine text-[10px] font-bold border border-routine/20" title={`${p.ordersPending} pending orders`}>
                      {p.ordersPending}
                    </span>
                  ) : <span className="w-5 h-5"></span>}
                  {p.alerts > 0 ? (
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-critical/10 text-critical text-[10px] font-bold border border-critical/20" title={`${p.alerts} active alerts`}>
                      {p.alerts}
                    </span>
                  ) : <span className="w-5 h-5"></span>}
                </div>
              </td>
              <td className="p-3 text-[12px] text-slate-light font-medium">
                {p.lastVitals}
              </td>
              <td className="p-3 text-[12.5px] font-medium text-navy">
                {p.provider}
              </td>
              <td className="p-3">
                {getStatusBadge(p.status)}
              </td>
              <td className="p-3 text-right pr-4">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-1.5 text-slate-light hover:text-sunrise-orange hover:bg-sunrise-orange/10 rounded transition-colors"
                    title="Quick Note"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="p-1.5 text-slate-light hover:text-sunrise-blue hover:bg-sunrise-blue/10 rounded transition-colors"
                    title="View Chart"
                    onClick={(e) => { e.stopPropagation(); onPatientClick(p.id); }}
                  >
                    <FileText size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTable;
