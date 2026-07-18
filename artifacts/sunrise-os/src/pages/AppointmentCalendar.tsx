import React, { useState } from 'react';
import { MOCK_GROUPS } from '../data/mockGroups';
import { Screen } from '../App';
import { Calendar as CalendarIcon, Users, User, HeartPulse, FileEdit, Plus } from 'lucide-react';

export function AppointmentCalendar({ navigate }: { navigate: (s: Screen) => void }) {
  const [view, setView] = useState('Week');
  
  const days = ['Mon, Oct 30', 'Tue, Oct 31', 'Wed, Nov 1', 'Thu, Nov 2', 'Fri, Nov 3'];
  const hours = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  // Mock appointments for the grid
  const mockAppts = [
    { day: 0, hour: 1, duration: 1, type: 'Individual', title: '1:1 Marcus Webb', staff: 'Sarah Jenkins', color: 'bg-sunrise-orange border-sunrise-orange text-white' },
    { day: 0, hour: 3, duration: 1.5, type: 'Group', title: 'Process Group A', staff: 'Maria Gonzales', color: 'bg-sunrise-blue border-sunrise-blue text-white' },
    { day: 1, hour: 2, duration: 0.5, type: 'Medical', title: 'Med Check: Devon P.', staff: 'Dr. Chen', color: 'bg-critical border-critical text-white' },
    { day: 2, hour: 1, duration: 1, type: 'Intake', title: 'Intake Assessment', staff: 'Amanda Lewis', color: 'bg-purple border-purple text-white' },
    { day: 3, hour: 5, duration: 1, type: 'Discharge', title: 'Discharge Planning', staff: 'David Odom', color: 'bg-teal border-teal text-white' },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-var(--topbar-height)-var(--banner-height)-48px)] flex flex-col">
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy">Appointment Calendar</h1>
          <p className="text-slate text-sm mt-1">Schedule and manage all clinical appointments</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white rounded border border-border shadow-sm p-1">
            {['Day', 'Week', 'Month'].map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  view === v ? 'bg-bg text-navy shadow-sm' : 'text-slate hover:text-navy'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="bg-sunrise-blue text-white px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-sunrise-blue-light shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar Filters & Legend */}
        <div className="w-64 flex flex-col gap-6 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <h3 className="font-bold text-navy text-sm mb-3">Calendars</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border text-sunrise-orange" />
                <span className="w-3 h-3 rounded-full bg-sunrise-orange"></span> Individual Therapy
              </label>
              <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border text-sunrise-blue" />
                <span className="w-3 h-3 rounded-full bg-sunrise-blue"></span> Group Therapy
              </label>
              <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border text-critical" />
                <span className="w-3 h-3 rounded-full bg-critical"></span> Medical/Psychiatric
              </label>
              <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border text-purple" />
                <span className="w-3 h-3 rounded-full bg-purple"></span> Intakes & Assessments
              </label>
              <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border text-teal" />
                <span className="w-3 h-3 rounded-full bg-teal"></span> Discharge Planning
              </label>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex-1 overflow-y-auto no-scrollbar">
            <h3 className="font-bold text-navy text-sm mb-3">Today's Highlights</h3>
            <div className="space-y-3">
              <div className="p-3 bg-bg rounded border border-border border-l-2 border-l-sunrise-orange">
                <div className="text-xs font-bold text-navy mb-1">08:00 AM</div>
                <div className="text-sm font-medium text-slate">1:1 Marcus Webb</div>
                <div className="text-xs text-slate-light mt-1">High AMA Risk Check-in</div>
              </div>
              <div className="p-3 bg-bg rounded border border-border border-l-2 border-l-sunrise-blue">
                <div className="text-xs font-bold text-navy mb-1">11:00 AM</div>
                <div className="text-sm font-medium text-slate">Process Group A</div>
                <div className="text-xs text-slate-light mt-1">12 Enrolled</div>
              </div>
              <div className="p-3 bg-bg rounded border border-border border-l-2 border-l-purple">
                <div className="text-xs font-bold text-navy mb-1">02:00 PM</div>
                <div className="text-sm font-medium text-slate">New Intake</div>
                <div className="text-xs text-slate-light mt-1">John Doe (PHP)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-border flex flex-col overflow-hidden">
          <div className="flex border-b border-border bg-bg">
            <div className="w-20 border-r border-border shrink-0"></div>
            {days.map((day, i) => (
              <div key={i} className="flex-1 p-3 text-center border-r border-border last:border-r-0">
                <div className="text-sm font-bold text-navy">{day.split(',')[0]}</div>
                <div className="text-xs text-slate">{day.split(',')[1]}</div>
              </div>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-50/50">
            {hours.map((hour, i) => (
              <div key={i} className="flex border-b border-border min-h-[80px]">
                <div className="w-20 border-r border-border shrink-0 p-2 text-xs font-medium text-slate text-right bg-white">
                  {hour}
                </div>
                {days.map((_, dayIndex) => (
                  <div key={dayIndex} className="flex-1 border-r border-border last:border-r-0 relative">
                    {/* Render matching appointments */}
                    {mockAppts.filter(a => a.day === dayIndex && a.hour === i).map((appt, idx) => (
                      <div 
                        key={idx} 
                        className={`absolute left-1 right-1 top-1 rounded p-2 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all z-10 ${appt.color}`}
                        style={{ height: `calc(${appt.duration * 100}% - 8px)`, minHeight: '40px' }}
                      >
                        <div className="font-bold mb-0.5 truncate">{appt.title}</div>
                        <div className="opacity-90 truncate">{appt.staff}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {/* Current time line mock */}
            <div className="absolute left-20 right-0 top-[240px] h-px bg-sunrise-orange z-20 flex items-center">
              <div className="w-2 h-2 rounded-full bg-sunrise-orange -ml-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
