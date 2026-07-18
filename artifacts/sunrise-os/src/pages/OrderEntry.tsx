import React, { useState } from 'react';
import { AlertTriangle, Search, CheckCircle, Plus } from 'lucide-react';
import { patients } from '@/data/mockData';

const OrderEntry: React.FC<{ patientId?: string | null }> = ({ patientId }) => {
  const patient = patients.find(p => p.id === patientId) || patients[0];
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    { name: "Medications", count: 142 },
    { name: "Laboratory", count: 85 },
    { name: "Imaging", count: 24 },
    { name: "Nursing/Protocol", count: 56 },
    { name: "Consults", count: 18 },
    { name: "Dietary", count: 12 }
  ];

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setShowModal(false);
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto relative">
      
      {/* Header context */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy">Order Entry</h1>
          <p className="text-[13px] text-slate-light font-medium mt-1">
            Placing orders for <strong className="text-navy">{patient.name}</strong> ({patient.room})
          </p>
        </div>
        <button className="bg-white border border-border text-navy px-4 py-2 rounded-lg text-[12px] font-bold shadow-sm hover:bg-slate-50 transition-colors">
          View Active Orders
        </button>
      </div>

      {/* Safety Banner */}
      <div className="bg-gradient-to-r from-critical/10 to-rose-400/5 border border-critical/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="text-critical shrink-0 mt-0.5" size={18} />
        <div>
          <div className="text-[13.5px] font-bold text-critical mb-1">HIGH ALERT</div>
          <div className="text-[12.5px] font-medium text-navy">
            Review all LASA (Look-Alike, Sound-Alike) medications before ordering. Patient has active allergy to <strong className="text-critical">Penicillin</strong>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Categories Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-light mb-2 px-1">Order Sets & Categories</div>
          {categories.map((c, i) => (
            <button key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg text-[13px] font-bold transition-colors ${
              i === 0 ? 'bg-sunrise-blue text-white shadow-md' : 'bg-white border border-border text-slate hover:border-sunrise-blue/50 hover:text-navy'
            }`}>
              {c.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-white/20' : 'bg-bg text-slate-light'}`}>
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search and List */}
        <div className="md:col-span-3 flex flex-col gap-4">
          
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-light" />
            <input 
              type="text" 
              placeholder="Search for medication to order..." 
              className="w-full pl-12 pr-4 py-3 text-[14px] border border-border rounded-xl bg-white focus:outline-none focus:border-sunrise-blue focus:ring-2 focus:ring-sunrise-blue/10 shadow-sm font-medium text-navy"
            />
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-border bg-bg px-5 py-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate">Common Medications</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Acetaminophen", dose: "650 mg", route: "PO", freq: "Q6H PRN" },
                { name: "Ondansetron", dose: "4 mg", route: "IV", freq: "Q8H PRN" },
                { name: "Lisinopril", dose: "10 mg", route: "PO", freq: "Daily" },
                { name: "Heparin", dose: "5000 units", route: "SUBQ", freq: "Q12H" },
              ].map((med, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-[14px] font-bold text-navy mb-1">{med.name}</div>
                    <div className="text-[12px] text-slate font-medium flex gap-2">
                      <span className="bg-bg px-2 rounded border border-border">{med.dose}</span>
                      <span className="bg-bg px-2 rounded border border-border">{med.route}</span>
                      <span className="bg-bg px-2 rounded border border-border">{med.freq}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-8 h-8 rounded-full border border-border text-sunrise-blue hover:bg-sunrise-blue hover:text-white hover:border-sunrise-blue transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fake Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[600px] w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 bg-navy text-white flex justify-between items-center">
              <div>
                <div className="text-[16px] font-extrabold">Ondansetron (Zofran)</div>
                <div className="text-[12px] text-white/60 font-medium">Order Entry Form</div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            {success ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle size={48} className="text-success mb-4" />
                <h3 className="text-[18px] font-bold text-navy mb-2">Order Signed Successfully</h3>
                <p className="text-[13px] text-slate font-medium">Order has been routed to Pharmacy and Nursing.</p>
              </div>
            ) : (
              <form onSubmit={handleSign} className="p-6 flex flex-col gap-5">
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-navy">Dose</label>
                    <select className="border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-sunrise-blue">
                      <option>4 mg</option>
                      <option>8 mg</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-navy">Route</label>
                    <select className="border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-sunrise-blue">
                      <option>IV Push</option>
                      <option>PO</option>
                      <option>IM</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-navy">Frequency</label>
                    <select className="border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-sunrise-blue">
                      <option>Q8H PRN</option>
                      <option>Q6H PRN</option>
                      <option>STAT</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-navy">PRN Reason</label>
                    <input type="text" defaultValue="Nausea/Vomiting" className="border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-sunrise-blue" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-navy">Special Instructions</label>
                  <textarea rows={2} className="border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-sunrise-blue resize-none"></textarea>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg text-[13px] font-bold text-slate hover:bg-bg border border-transparent">
                    Cancel
                  </button>
                  <button type="submit" className="bg-sunrise-blue text-white px-6 py-2 rounded-lg text-[13px] font-bold shadow-md hover:bg-sunrise-blue/90">
                    Sign Order
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEntry;
