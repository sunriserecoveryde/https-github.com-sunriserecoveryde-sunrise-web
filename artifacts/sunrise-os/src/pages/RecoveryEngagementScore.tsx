import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { RecoveryScoreBadge } from '../components/ui/RecoveryScoreBadge';
import { PatientAvatar } from '../components/ui/PatientAvatar';
import { TrendingUp, Info, Activity } from 'lucide-react';

export function RecoveryEngagementScore({ navigate }: { navigate: (s: Screen) => void }) {
  const sortedPatients = [...MOCK_PATIENTS].sort((a, b) => b.recoveryScore - a.recoveryScore);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sunrise-blue" /> Recovery Engagement Score (RES)
          </h1>
          <p className="text-slate text-sm mt-1">Proprietary composite index measuring clinical engagement and relapse risk</p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-gradient-to-r from-sunrise-blue to-indigo-600 rounded-lg p-5 text-white shadow-md flex gap-6 items-center">
        <div className="bg-white/20 p-3 rounded-full flex-shrink-0 border border-white/20">
          <Info className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">What is the RES?</h3>
          <p className="text-slate-100 text-sm mb-3 max-w-4xl">
            The Recovery Engagement Score is a real-time composite metric (0-100) calculated from daily behavioral data. 
            Higher scores indicate strong programmatic engagement and lower risk of early discharge or relapse.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-white/90 uppercase tracking-wider flex-wrap">
            <span className="bg-black/20 px-2 py-1 rounded">Group Attendance: 25%</span>
            <span className="bg-black/20 px-2 py-1 rounded">Individual Sessions: 20%</span>
            <span className="bg-black/20 px-2 py-1 rounded">UA Compliance: 15%</span>
            <span className="bg-black/20 px-2 py-1 rounded">Med Adherence: 10%</span>
            <span className="bg-black/20 px-2 py-1 rounded">Counselor Rating: 10%</span>
            <span className="bg-black/20 px-2 py-1 rounded">Peer Support: 10%</span>
            <span className="bg-black/20 px-2 py-1 rounded">Assignments: 10%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-border p-5 text-center">
            <h3 className="font-semibold text-slate text-sm uppercase tracking-wider mb-2">Census Average</h3>
            <div className="text-6xl font-bold text-navy mb-2">72</div>
            <div className="text-success font-medium text-sm">↑ +4 from last week</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-border p-5">
            <h3 className="font-bold text-navy mb-4 border-b border-border pb-2">Score Ranges</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-success">80 - 100</span>
                  <span className="text-navy">Strong</span>
                </div>
                <div className="text-slate text-xs">Highly engaged, meeting all treatment goals.</div>
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-moderate">60 - 79</span>
                  <span className="text-navy">Moderate</span>
                </div>
                <div className="text-slate text-xs">Generally compliant, needs minor redirection.</div>
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-high">40 - 59</span>
                  <span className="text-navy">Concerning</span>
                </div>
                <div className="text-slate text-xs">Missing sessions, low motivation noted.</div>
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-critical">0 - 39</span>
                  <span className="text-navy">Critical Risk</span>
                </div>
                <div className="text-slate text-xs">Active intervention required immediately.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border bg-bg flex justify-between items-center">
            <h2 className="font-bold text-navy">RES Leaderboard & Breakdown</h2>
            <select className="border border-border rounded px-2 py-1 text-sm bg-white focus:outline-none">
              <option>All Programs</option>
              <option>Residential Only</option>
              <option>PHP Only</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg text-slate-light font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Rank</th>
                  <th className="p-4">Client</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 w-1/2">Component Breakdown (Visual)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPatients.map((p, idx) => {
                  // Generate deterministic but pseudo-random breakdown widths for the visual bar
                  const w1 = Math.min(25, (p.recoveryScore / 100) * 25 + (idx % 5));
                  const w2 = Math.min(20, (p.recoveryScore / 100) * 20 + (idx % 4));
                  const w3 = Math.min(15, (p.recoveryScore / 100) * 15 + (idx % 3));
                  const w4 = Math.min(40, (p.recoveryScore / 100) * 40 - (idx % 5));
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('PatientDetail', p.id)}>
                      <td className="p-4 pl-6 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PatientAvatar first={p.firstName} last={p.lastName} program={p.program} size="sm" />
                          <div className="font-bold text-navy">{p.firstName} {p.lastName}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <RecoveryScoreBadge score={p.recoveryScore} />
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex h-4 rounded-full overflow-hidden bg-bg border border-border">
                          <div className="bg-sunrise-blue" style={{ width: `${w1}%` }} title="Groups"></div>
                          <div className="bg-sunrise-orange border-l border-white/20" style={{ width: `${w2}%` }} title="Individual"></div>
                          <div className="bg-teal border-l border-white/20" style={{ width: `${w3}%` }} title="Compliance"></div>
                          <div className="bg-purple border-l border-white/20" style={{ width: `${w4}%` }} title="Other"></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
