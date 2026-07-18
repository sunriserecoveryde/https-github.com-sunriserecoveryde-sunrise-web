import React from 'react';
import { MOCK_GROUPS } from '../data/mockGroups';
import { Screen } from '../App';
import { UsersRound, MapPin, User, Clock } from 'lucide-react';

export function GroupSchedule({ navigate }: { navigate: (s: Screen) => void }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timeSlots = [
    '08:00 AM', '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '07:00 PM'
  ];

  const getGroupsForSlot = (day: string, time: string) => {
    return MOCK_GROUPS.filter(g => g.days.includes(day) && g.time === time);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)]">
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy">Master Group Schedule</h1>
          <p className="text-slate text-sm mt-1">Weekly recurring therapy and psychoeducation groups</p>
        </div>
        <button className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium shadow-sm hover:bg-sunrise-blue-light transition-colors">
          Manage Master Schedule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border flex-1 flex flex-col overflow-hidden">
        <div className="flex bg-navy text-white text-sm font-bold flex-shrink-0">
          <div className="w-24 shrink-0 border-r border-white/20 p-4 flex items-center justify-center">Time</div>
          {days.map(day => (
            <div key={day} className="flex-1 p-4 text-center border-r border-white/20 last:border-0 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-bg">
          {timeSlots.map(time => (
            <div key={time} className="flex border-b border-border min-h-[120px]">
              <div className="w-24 shrink-0 border-r border-border p-4 flex items-center justify-center text-sm font-bold text-slate bg-white">
                {time}
              </div>
              {days.map(day => {
                const groups = getGroupsForSlot(day, time);
                return (
                  <div key={`${day}-${time}`} className="flex-1 p-2 border-r border-border last:border-0 relative">
                    {groups.map(group => (
                      <div 
                        key={group.id} 
                        className="bg-white border-l-4 border-l-sunrise-blue border-y border-r border-border rounded shadow-sm p-3 mb-2 last:mb-0 hover:border-l-sunrise-orange transition-colors cursor-pointer"
                        onClick={() => {}}
                      >
                        <div className="font-bold text-navy text-sm mb-2 leading-tight">{group.name}</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate">
                            <User className="w-3 h-3" /> {group.facilitator.split(',')[0]}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate">
                            <MapPin className="w-3 h-3" /> {group.room}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-sunrise-blue">
                              <UsersRound className="w-3 h-3" /> {group.enrolled}/{group.capacity}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">View Roster</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {groups.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-border text-2xl font-light">
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
