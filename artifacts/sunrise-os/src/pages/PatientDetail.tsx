import React, { useState } from 'react';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { FlagBadge } from '../components/ui/FlagBadge';
import { AcuityBadge } from '../components/ui/AcuityBadge';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { CustomButtons } from '../components/ui/CustomButtons';
import { ArrowLeft, Edit, Save, Plus, FileText, Download, Calendar, Activity, Pill, User } from 'lucide-react';
import { Screen } from '../App';

export function PatientDetail({ patientId, navigate }: { patientId: string | null, navigate: (s: Screen) => void }) {
  const patient = MOCK_PATIENTS.find(p => p.id === patientId) || MOCK_PATIENTS[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const [isComposingNote, setIsComposingNote] = useState(false);
  const [noteFormat, setNoteFormat] = useState('BIRP');
  const [noteContent, setNoteContent] = useState('');

  const handleQuickInsert = (text: string) => {
    setNoteContent(prev => prev + text);
  };

  const tabs = [
    'Overview', 'ASAM Assessment', 'Progress Notes', 'Treatment Plan', 
    'Medications', 'Group Notes', 'Vitals', 'Labs', 'History', 'Documents'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-navy-mid rounded-t-lg p-6 text-white shadow-sm flex-shrink-0">
        <button 
          onClick={() => navigate('PatientList')}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5">
            <PatientAvatar first={patient.firstName} last={patient.lastName} program={patient.program} size="xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{patient.firstName} {patient.lastName}</h1>
                <AcuityBadge acuity={patient.amaRisk === 'High' ? 'Critical' : (patient.amaRisk === 'Med' ? 'High' : 'Routine')} />
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded font-semibold border border-white/10">{patient.program}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                <span>{patient.mrn}</span>
                <span>•</span>
                <span>DOB: {patient.dob} ({patient.age}y)</span>
                <span>•</span>
                <span>Admitted: {patient.admitDate} (LOS: {patient.los}d)</span>
                <span>•</span>
                <span>Counselor: {patient.counselor.split(',')[0]}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {patient.flags.map((f, i) => <FlagBadge key={i} type={f.type} note={f.note} size="md" />)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="mb-2">
              <span className="text-slate-300 text-sm font-medium mr-3">Recovery Engagement Score</span>
              <RecoveryScoreBadge score={patient.recoveryScore} size="lg" />
            </div>
            <div className="text-sm text-slate-300 font-medium">
              Exp. Discharge: {patient.expectedDischarge}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-x border-border px-4 flex gap-6 shadow-sm overflow-x-auto no-scrollbar flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'border-sunrise-orange text-sunrise-orange' 
                : 'border-transparent text-slate hover:text-navy hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white border-x border-b border-border rounded-b-lg p-6 overflow-y-auto no-scrollbar">
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">Current Mood</div>
                <div className="text-3xl font-bold text-navy">{patient.mood}<span className="text-base text-slate font-medium">/10</span></div>
              </div>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">Cravings</div>
                <div className="text-3xl font-bold text-navy">{patient.craving}<span className="text-base text-slate font-medium">/10</span></div>
              </div>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">Last UA</div>
                <div className={`text-lg font-bold ${patient.lastUa === 'Negative' ? 'text-success' : 'text-critical'}`}>
                  {patient.lastUa}
                </div>
              </div>
              <div className="bg-bg border border-border p-4 rounded-lg">
                <div className="text-slate-light text-xs font-semibold uppercase tracking-wider mb-1">Next Appt</div>
                <div className="text-lg font-bold text-navy">{patient.nextAppointment}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sunrise-blue" />
                  ASAM Dimensions Summary
                </h3>
                <div className="space-y-3">
                  {[
                    { d: 1, label: 'Acute Intoxication & Withdrawal', score: patient.asam.d1 },
                    { d: 2, label: 'Biomedical Conditions', score: patient.asam.d2 },
                    { d: 3, label: 'Emotional & Behavioral', score: patient.asam.d3 },
                    { d: 4, label: 'Readiness to Change', score: patient.asam.d4 },
                    { d: 5, label: 'Relapse Potential', score: patient.asam.d5 },
                    { d: 6, label: 'Recovery Environment', score: patient.asam.d6 },
                  ].map(dim => (
                    <div key={dim.d} className="flex items-center gap-4 text-sm">
                      <div className="w-8 h-8 rounded bg-bg border border-border flex items-center justify-center font-bold text-navy">
                        D{dim.d}
                      </div>
                      <div className="flex-1 text-slate font-medium">{dim.label}</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(s => (
                          <div 
                            key={s} 
                            className={`w-8 h-2 rounded-sm ${
                              s <= dim.score 
                                ? (dim.score >= 3 ? 'bg-critical' : dim.score === 2 ? 'bg-sunrise-amber' : 'bg-success')
                                : 'bg-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sunrise-blue" />
                    Recent Notes
                  </h3>
                  <button 
                    onClick={() => { setActiveTab('Progress Notes'); setIsComposingNote(true); }}
                    className="text-sm text-sunrise-blue font-medium hover:underline"
                  >
                    + Quick Note
                  </button>
                </div>
                
                {patient.notes.length > 0 ? (
                  <div className="space-y-4">
                    {patient.notes.slice(0, 3).map(note => (
                      <div key={note.id} className="border border-border p-4 rounded-lg bg-bg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-navy">{note.type} Note</div>
                          <div className="text-xs text-slate">{note.date}</div>
                        </div>
                        <p className="text-sm text-slate-light mb-2 line-clamp-2">{note.content}</p>
                        <div className="text-xs font-medium text-slate">By: {note.author}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-bg rounded-lg border border-dashed border-border text-slate">
                    No recent notes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ASAM Assessment' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-sunrise-blue/10 border border-sunrise-blue/20 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sunrise-blue text-lg">Recommended Level of Care</h3>
                <p className="text-slate text-sm">Based on most recent multidimensional assessment</p>
              </div>
              <div className="text-2xl font-bold text-sunrise-blue bg-white px-4 py-2 rounded shadow-sm">
                Residential (3.7)
              </div>
            </div>

            {[
              { d: 1, label: 'Acute Intoxication & Withdrawal Potential', score: patient.asam.d1, text: "Client indicates moderate to severe withdrawal potential requiring medical monitoring." },
              { d: 2, label: 'Biomedical Conditions & Complications', score: patient.asam.d2, text: "Stable biomedical conditions. Routine monitoring required." },
              { d: 3, label: 'Emotional, Behavioral & Cognitive Conditions', score: patient.asam.d3, text: "Significant emotional instability. Diagnosed with Major Depressive Disorder. Symptoms interfere with recovery." },
              { d: 4, label: 'Readiness to Change', score: patient.asam.d4, text: "Client exhibits external motivation (court-ordered) but internal motivation is currently low to moderate." },
              { d: 5, label: 'Relapse, Continued Use & Continued Problem Potential', score: patient.asam.d5, text: "High risk of relapse without structured environment. Previous attempts at outpatient treatment have failed." },
              { d: 6, label: 'Recovery & Living Environment', score: patient.asam.d6, text: "Current living environment is unsupportive of recovery. Substance use prevalent in household." },
            ].map((dim) => (
              <div key={dim.d} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                  <div className="font-bold text-navy flex items-center gap-3">
                    <span className="bg-white border border-border w-8 h-8 rounded flex items-center justify-center text-sunrise-blue">D{dim.d}</span>
                    {dim.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate">Severity Rating:</span>
                    <span className={`px-2 py-0.5 rounded text-sm font-bold text-white ${
                      dim.score >= 3 ? 'bg-critical' : dim.score === 2 ? 'bg-sunrise-amber' : 'bg-success'
                    }`}>{dim.score}/4</span>
                  </div>
                </div>
                <div className="p-4">
                  <textarea 
                    className="w-full text-sm text-slate border border-border rounded p-3 focus:outline-none focus:border-sunrise-blue min-h-[100px]"
                    defaultValue={dim.text}
                  />
                  <div className="flex gap-4 mt-3">
                    <label className="flex items-center gap-2 text-sm text-slate">
                      <input type="checkbox" checked={dim.score >= 3} readOnly className="rounded border-border text-sunrise-blue" /> Immediate Risk
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate">
                      <input type="checkbox" checked={dim.score > 0} readOnly className="rounded border-border text-sunrise-blue" /> Service Required
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Progress Notes' && (
          <div className="flex h-full gap-6">
            <div className={`flex-col h-full ${isComposingNote ? 'w-1/3' : 'w-full'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-navy">Progress Notes</h2>
                {!isComposingNote && (
                  <button 
                    onClick={() => setIsComposingNote(true)}
                    className="bg-sunrise-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors"
                  >
                    + New Note
                  </button>
                )}
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {patient.notes.map(note => (
                  <div key={note.id} className="border border-border rounded-lg p-4 hover:border-sunrise-blue transition-colors cursor-pointer group">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy group-hover:text-sunrise-blue transition-colors">{note.type} Note</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          note.status === 'Signed' ? 'bg-success/20 text-success' : 
                          note.status === 'Draft' ? 'bg-slate-100 text-slate' : 'bg-sunrise-amber/20 text-sunrise-amber'
                        }`}>{note.status}</span>
                      </div>
                      <span className="text-xs font-medium text-slate">{note.date}</span>
                    </div>
                    <div className="text-xs text-slate-light mb-3">Format: {note.format} • Author: {note.author}</div>
                    <p className="text-sm text-navy line-clamp-3">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {isComposingNote && (
              <div className="w-2/3 border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
                <div className="bg-bg p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-navy">Compose Note</h3>
                  <div className="flex gap-2">
                    <select 
                      value={noteFormat} 
                      onChange={e => setNoteFormat(e.target.value)}
                      className="border border-border rounded px-2 py-1 text-sm text-slate focus:outline-none"
                    >
                      <option value="BIRP">BIRP Format</option>
                      <option value="DAP">DAP Format</option>
                      <option value="Free Text">Free Text</option>
                    </select>
                    <button 
                      onClick={() => setIsComposingNote(false)}
                      className="text-slate hover:text-navy px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate mb-1">Note Type</label>
                        <select className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue">
                          <option>Individual Therapy</option>
                          <option>Group Therapy</option>
                          <option>Case Management</option>
                          <option>Medical/Psychiatric</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate mb-1">Date/Time</label>
                        <input type="datetime-local" className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue" defaultValue={new Date().toISOString().slice(0, 16)} />
                      </div>
                    </div>

                    {noteFormat === 'BIRP' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-navy mb-1 uppercase">Behavior</label>
                          <textarea 
                            className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]"
                            placeholder="Objective description of client's behavior and presentation..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-navy mb-1 uppercase">Intervention</label>
                          <textarea className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]" placeholder="Counselor's methods and actions..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-navy mb-1 uppercase">Response</label>
                          <textarea className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]" placeholder="Client's reaction to intervention..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-navy mb-1 uppercase">Plan</label>
                          <textarea className="w-full border border-border rounded p-2 text-sm focus:outline-none focus:border-sunrise-blue min-h-[80px]" placeholder="Next steps, assignments, future appointments..." />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="w-64 border-l border-border bg-bg p-4 flex flex-col">
                    <CustomButtons onInsert={handleQuickInsert} />
                  </div>
                </div>

                <div className="bg-bg border-t border-border p-4 flex justify-between items-center">
                  <div className="text-xs text-slate">Auto-saved at {new Date().toLocaleTimeString()}</div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50 transition-colors">
                      Save Draft
                    </button>
                    <button className="px-4 py-2 border border-sunrise-orange text-sunrise-orange bg-sunrise-orange/10 rounded text-sm font-medium hover:bg-sunrise-orange/20 transition-colors">
                      Send for Co-sign
                    </button>
                    <button className="px-4 py-2 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light transition-colors">
                      Sign & Lock
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Treatment Plan Tab */}
        {activeTab === 'Treatment Plan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy">Master Treatment Plan</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-border rounded text-sm font-medium text-slate hover:bg-slate-50">Review Plan</button>
                <button className="px-3 py-1.5 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">+ Add Goal</button>
              </div>
            </div>

            {patient.goals.length > 0 ? (
              <div className="space-y-4">
                {patient.goals.map(goal => (
                  <div key={goal.id} className="border border-border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-bg px-4 py-3 border-b border-border flex justify-between items-center">
                      <div className="font-bold text-navy">{goal.category} Goal</div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        goal.status === 'Met' ? 'bg-success/20 text-success' :
                        goal.status === 'In Progress' ? 'bg-sunrise-blue/20 text-sunrise-blue' :
                        'bg-slate-100 text-slate'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Problem Statement</div>
                        <div className="text-sm text-navy font-medium">{goal.problem}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 border-t border-border pt-4">
                        <div>
                          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Long Term Goal</div>
                          <div className="text-sm text-navy">{goal.longTerm}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Short Term Objective</div>
                          <div className="text-sm text-navy">{goal.shortTerm}</div>
                          <div className="text-xs text-sunrise-orange font-medium mt-1">Target: {goal.targetDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg">
                <h3 className="font-semibold text-slate mb-2">No Active Goals</h3>
                <p className="text-sm text-slate-light mb-4">Create a treatment plan to track client progress.</p>
                <button className="px-4 py-2 bg-sunrise-blue text-white rounded text-sm font-medium hover:bg-sunrise-blue-light">
                  Initialize Master Treatment Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fallback for un-implemented tabs */}
        {!['Overview', 'ASAM Assessment', 'Progress Notes', 'Treatment Plan'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full text-slate">
            <h3 className="text-xl font-semibold mb-2">{activeTab}</h3>
            <p>This module is available in the full version of Sunrise OS.</p>
          </div>
        )}

      </div>
    </div>
  );
}
