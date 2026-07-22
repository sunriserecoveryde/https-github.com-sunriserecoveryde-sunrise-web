import React, { useState } from 'react';
import { AlertTriangle, Search, CheckCircle, Plus } from 'lucide-react';
import { patients } from '@/data/mockData';

const OrderEntry: React.FC<{ patientId?: string | null }> = ({ patientId }) => {
  const patient = patients.find(p => p.id === patientId) || patients[0];
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oeTab, setOeTab] = useState<'New Order' | 'Active Orders' | 'Order History' | 'Order Sets' | 'Drug Reference' | 'Pending Co-sign'>('New Order');
  const [selectedCategory, setSelectedCategory] = useState(0);

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
        <button onClick={() => setOeTab('Active Orders')} className="bg-white border border-border text-navy px-4 py-2 rounded-lg text-[12px] font-bold shadow-sm hover:bg-slate-50 transition-colors">
          View Active Orders
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border">
        {(['New Order', 'Active Orders', 'Order History', 'Order Sets', 'Drug Reference', 'Pending Co-sign'] as const).map(t => (
          <button key={t} onClick={() => setOeTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${oeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {oeTab === 'Active Orders' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">All currently active physician orders for <strong className="text-navy">{patient.name}</strong>.</div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  {['Order', 'Category', 'Frequency', 'Route', 'Ordered By', 'Start', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { order: 'Buprenorphine/Naloxone 8mg/2mg SL', cat: 'Medications', freq: 'BID', route: 'Sublingual', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Ondansetron 4mg', cat: 'Medications', freq: 'Q8H PRN nausea', route: 'PO', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Melatonin 5mg', cat: 'Medications', freq: 'QHS PRN insomnia', route: 'PO', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'CMP (Comprehensive Metabolic Panel)', cat: 'Laboratory', freq: 'Weekly', route: 'Venipuncture', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Urine Drug Screen (10-panel)', cat: 'Laboratory', freq: 'Twice weekly', route: 'UA', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Vitals Q Shift + Weight Daily', cat: 'Nursing/Protocol', freq: 'Q8H + QAM', route: 'N/A', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'CIWA-Ar Q4H', cat: 'Nursing/Protocol', freq: 'Q4H', route: 'N/A', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Fall Risk — Standard Precautions', cat: 'Nursing/Protocol', freq: 'Continuous', route: 'N/A', by: 'Dr. R. Chen', start: '2026-07-14', status: 'Active' },
                  { order: 'Psychiatry Consult — Co-occurring Assessment', cat: 'Consults', freq: 'Once', route: 'N/A', by: 'Dr. R. Chen', start: '2026-07-22', status: 'Pending' },
                ].map(o => (
                  <tr key={o.order} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-navy">{o.order}</td>
                    <td className="px-4 py-2.5"><span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{o.cat}</span></td>
                    <td className="px-4 py-2.5 text-slate">{o.freq}</td>
                    <td className="px-4 py-2.5 text-slate">{o.route}</td>
                    <td className="px-4 py-2.5 text-slate">{o.by}</td>
                    <td className="px-4 py-2.5 text-slate">{o.start}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {oeTab === 'Order History' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Completed, discontinued, and expired orders — full audit trail for <strong className="text-navy">{patient.name}</strong>.</div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg text-slate">
                  {['Order', 'Category', 'Ordered By', 'Start', 'End', 'Reason', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { order: 'Clonidine 0.1mg', cat: 'Medications', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-17', reason: 'Clinically improved — tapered off', status: 'Discontinued' },
                  { order: 'Thiamine 100mg', cat: 'Medications', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-16', reason: 'Course completed (3-day protocol)', status: 'Completed' },
                  { order: 'Folate 1mg', cat: 'Medications', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-16', reason: 'Course completed', status: 'Completed' },
                  { order: 'Acetaminophen 650mg Q6H PRN', cat: 'Medications', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-15', reason: 'Changed to scheduled dosing', status: 'Discontinued' },
                  { order: 'CBC w/ Differential', cat: 'Laboratory', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-14', reason: 'Resulted — WNL', status: 'Completed' },
                  { order: 'EKG (12-Lead)', cat: 'Laboratory', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-14', reason: 'Resulted — QTc 420ms, normal', status: 'Completed' },
                  { order: 'Isolation / Droplet Precautions', cat: 'Nursing/Protocol', by: 'Dr. R. Chen', start: '2026-07-14', end: '2026-07-15', reason: 'Influenza ruled out — rapid negative', status: 'Discontinued' },
                ].map(o => (
                  <tr key={o.order} className="hover:bg-gray-50 text-slate">
                    <td className="px-4 py-2.5 font-medium text-navy">{o.order}</td>
                    <td className="px-4 py-2.5"><span className="text-[10px] font-bold bg-slate-100 text-slate px-1.5 py-0.5 rounded">{o.cat}</span></td>
                    <td className="px-4 py-2.5">{o.by}</td>
                    <td className="px-4 py-2.5">{o.start}</td>
                    <td className="px-4 py-2.5">{o.end}</td>
                    <td className="px-4 py-2.5 italic">{o.reason}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {oeTab === 'New Order' && (
      <div className="space-y-6">
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
            <button key={i} onClick={() => setSelectedCategory(i)} className={`flex items-center justify-between px-4 py-3 rounded-lg text-[13px] font-bold transition-colors ${
              i === selectedCategory ? 'bg-sunrise-blue text-white shadow-md' : 'bg-white border border-border text-slate hover:border-sunrise-blue/50 hover:text-navy'
            }`}>
              {c.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${i === selectedCategory ? 'bg-white/20' : 'bg-bg text-slate-light'}`}>
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
      )}

      {oeTab === 'Order Sets' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Pre-built order sets for common clinical scenarios — reduces entry time and ensures protocol compliance across all providers.</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Alcohol Detox Protocol (CIWA-Ar)', desc: 'Librium/Ativan PRN scale, thiamine, folate, MVI, vital monitoring q4h, fall precautions, seizure precautions.', orders: 9, category: 'Detox' },
              { name: 'Opioid Detox Protocol (COWS)', desc: 'Clonidine, Zofran, Imodium, Restless leg PRN, COWS q8h, buprenorphine candidate evaluation.', orders: 7, category: 'Detox' },
              { name: 'Buprenorphine Induction (OUD)', desc: 'COWS ≥8 threshold, first-dose 2-4mg SL, observe 60min, titration schedule, PDMP check, urine screen.', orders: 6, category: 'MAT' },
              { name: 'Stimulant Detox Supportive Care', desc: 'Sleep hygiene bundle, mood monitoring, nutritional support, PRN Trazodone, psychiatric consult trigger.', orders: 5, category: 'Detox' },
              { name: 'Benzodiazepine Taper (Ashton)', desc: 'Diazepam equivalency conversion, weekly taper schedule 10%, symptom monitoring, interdose schedule.', orders: 8, category: 'Detox' },
              { name: 'Co-occurring MH Admission Bundle', desc: 'Psychiatric evaluation within 24h, PHQ-9, Columbia Suicide Severity, medication reconciliation, MH safety plan.', orders: 6, category: 'Psychiatric' },
              { name: 'Admissions Labs Bundle', desc: 'CMP, CBC, LFTs, Hep B/C, HIV, RPR, UA, urine drug screen, BAL, pregnancy test (if applicable).', orders: 12, category: 'Labs' },
              { name: 'Vital Monitoring Bundle (High Acuity)', desc: 'Vitals q2h for first 24h, fingerstick glucose if DM, SpO₂ monitoring, neuro checks if head injury.', orders: 5, category: 'Monitoring' },
            ].map(os => (
              <div key={os.name} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-navy text-sm">{os.name}</div>
                    <div className="text-xs text-slate mt-0.5 leading-relaxed">{os.desc}</div>
                  </div>
                  <span className={`ml-3 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    os.category === 'Detox' ? 'bg-amber-100 text-amber-700' :
                    os.category === 'MAT' ? 'bg-blue-100 text-blue-700' :
                    os.category === 'Labs' ? 'bg-teal-100 text-teal-700' :
                    os.category === 'Psychiatric' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-slate'}`}>{os.category}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate">{os.orders} orders included</span>
                  <button className="text-xs bg-navy text-white px-3 py-1 rounded font-medium hover:bg-navy/80 transition-colors">Apply Order Set</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {oeTab === 'Drug Reference' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Quick-access drug reference for commonly ordered medications in SUD treatment — dosing, interactions, monitoring, and Schedule classification.</div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Commonly Ordered Medications — SUD Treatment Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-slate">
                  {['Medication', 'Class', 'DEA Schedule', 'Typical Dose', 'Max/Day', 'Key Interactions', 'Monitoring'].map(h => (
                    <th key={h} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { med: 'Buprenorphine/Naloxone', cls: 'Partial opioid agonist', dea: 'CIII', dose: '4–16 mg SL daily', max: '24 mg/day', int: 'Benzodiazepines (↑ resp depression), CYP3A4 inhibitors', mon: 'UDS, respiratory rate, diversion risk, PDMP' },
                  { med: 'Naltrexone (oral)', cls: 'Opioid antagonist', dea: 'Non-scheduled', dose: '50 mg PO daily', max: '50 mg/day', int: 'Opioid analgesics (↓ effect), thioridazine', mon: 'LFTs baseline, UDS (must be opioid-free ≥7–10d first)' },
                  { med: 'Naltrexone ER (Vivitrol)', cls: 'Opioid antagonist', dea: 'Non-scheduled', dose: '380 mg IM q4 weeks', max: '380 mg/injection', int: 'Same as oral naltrexone', mon: 'Injection site, LFTs, opioid-free status confirmed' },
                  { med: 'Disulfiram (Antabuse)', cls: 'Aldehyde dehydrogenase inhibitor', dea: 'Non-scheduled', dose: '250–500 mg PO daily', max: '500 mg/day', int: 'Alcohol (severe reaction), warfarin, phenytoin, isoniazid', mon: 'LFTs, CBC; counsel on alcohol reaction risk' },
                  { med: 'Acamprosate (Campral)', cls: 'GABA modulator', dea: 'Non-scheduled', dose: '666 mg PO TID', max: '1998 mg/day', int: 'Minimal; renal dose adjustment required', mon: 'Renal function (CrCl); GI tolerability' },
                  { med: 'Diazepam', cls: 'Benzodiazepine', dea: 'CIV', dose: '10–20 mg PO PRN CIWA', max: '100 mg/day', int: 'CNS depressants, opioids (↑ resp depression), alcohol', mon: 'CIWA score, sedation level, respiratory rate, BP' },
                  { med: 'Clonidine', cls: 'Alpha-2 agonist', dea: 'Non-scheduled', dose: '0.1–0.3 mg PO TID/QID', max: '1.2 mg/day', int: 'Antihypertensives, beta-blockers, CNS depressants', mon: 'BP (hold if SBP <90), HR, rebound HTN on discontinuation' },
                  { med: 'Quetiapine', cls: 'Atypical antipsychotic', dea: 'Non-scheduled', dose: '25–200 mg PO QHS', max: '800 mg/day', int: 'CNS depressants, QT-prolonging agents, CYP3A4', mon: 'QTc, metabolic panel, EPS symptoms, sedation' },
                ].map(r => (
                  <tr key={r.med} className="hover:bg-gray-50 text-[10px]">
                    <td className="px-2 py-2 font-semibold text-navy">{r.med}</td>
                    <td className="px-2 py-2 text-slate">{r.cls}</td>
                    <td className={`px-2 py-2 font-bold ${r.dea.startsWith('C') ? 'text-amber-700' : 'text-green-700'}`}>{r.dea}</td>
                    <td className="px-2 py-2 text-navy">{r.dose}</td>
                    <td className="px-2 py-2 text-red-700 font-medium">{r.max}</td>
                    <td className="px-2 py-2 text-slate">{r.int}</td>
                    <td className="px-2 py-2 text-slate">{r.mon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {oeTab === 'Pending Co-sign' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Orders written by supervised clinicians or non-prescribers awaiting physician or NP co-signature before activation.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pending Co-sign', value: 4, color: 'text-amber-600', sub: 'Orders not yet active' },
              { label: 'Past 4h Threshold', value: 1, color: 'text-red-600', sub: 'Requires immediate MD review' },
              { label: 'Avg Co-sign Time', value: '1.4h', color: 'text-navy', sub: 'MD orders — rolling 30d' },
              { label: 'On-Call MD', value: 'Dr. Chen', color: 'text-green-600', sub: 'Available via Secure Msg' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Orders Awaiting Co-sign</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Urgency', 'Order', 'Patient', 'Written By', 'Written At', 'Awaiting MD', 'Waiting Time', 'Notes'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { urg: 'STAT', order: 'Diazepam 10mg IV PRN (CIWA ≥15)', pt: 'M. Delgado — Rm 4B', by: 'J. Torres, RN', at: '11:42 AM', md: 'Dr. Chen', wait: '4h 21min', note: 'CIWA 18 — past 4h threshold' },
                  { urg: 'Routine', order: 'Buprenorphine 8mg SL QD', pt: 'T. Barnes — Rm 9A', by: 'P. Wright, NP', at: '10:00 AM', md: 'Dr. Chen', wait: '2h 05min', note: 'MAT induction day 1' },
                  { urg: 'Routine', order: 'Melatonin 5mg PO QHS', pt: 'K. Walsh — Rm 6C', by: 'J. Torres, RN', at: '09:30 AM', md: 'Dr. Hughes', wait: '2h 35min', note: 'Sleep hygiene protocol' },
                  { urg: 'Routine', order: 'Thiamine 100mg PO QD × 7d', pt: 'R. Patel — Rm 11D', by: 'J. Torres, RN', at: '08:15 AM', wait: '3h 50min', md: 'Dr. Chen', note: 'AUD — nutritional support' },
                ].map(r => (
                  <tr key={r.order + r.pt} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.urg === 'STAT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{r.urg}</span></td>
                    <td className="px-3 py-2 font-semibold text-navy">{r.order}</td>
                    <td className="px-3 py-2 text-slate">{r.pt}</td>
                    <td className="px-3 py-2 text-slate">{r.by}</td>
                    <td className="px-3 py-2 text-slate font-mono text-[10px]">{r.at}</td>
                    <td className="px-3 py-2 text-slate">{r.md}</td>
                    <td className="px-3 py-2 font-bold text-amber-700">{r.wait}</td>
                    <td className="px-3 py-2 text-slate italic text-[10px]">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEntry;
