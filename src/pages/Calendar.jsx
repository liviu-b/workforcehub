import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Card, Button } from '../components/UI';

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toIsoDate = (date) => {
  const d = new Date(date);
  return d.toISOString();
};

export default function CalendarView({ shifts, jobs, handleCreateShift, setActiveShiftId, setView }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const shiftsByDay = useMemo(() => {
    const grouped = {};
    shifts.forEach((shift) => {
      const d = new Date(shift.date);
      const key = d.toLocaleDateString('ro-RO');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(shift);
    });
    return grouped;
  }, [shifts]);

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarDays size={14} /> Planificare săptămânală
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calendar <span className="text-slate-600">Lucrări</span></h1>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={18} /></Button>
          <p className="font-semibold text-slate-800 text-sm text-center">
            {days[0].toLocaleDateString('ro-RO')} - {days[6].toLocaleDateString('ro-RO')}
          </p>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={18} /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {days.map((day) => {
            const key = day.toLocaleDateString('ro-RO');
            const dayShifts = shiftsByDay[key] || [];
            const isToday = new Date().toLocaleDateString('ro-RO') === key;

            return (
              <div key={key} className={`border rounded-xl p-3 min-h-[220px] ${isToday ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{day.toLocaleDateString('ro-RO', { weekday: 'short' })}</p>
                  <p className="text-sm font-semibold text-slate-900">{day.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })}</p>
                </div>

                <div className="space-y-2 mb-3">
                  {dayShifts.map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => { setActiveShiftId(shift.id); setView('shift-detail'); }}
                      className="w-full text-left text-xs border border-slate-200 rounded-lg p-2 hover:border-slate-400"
                    >
                      <p className="font-semibold text-slate-800 truncate">{shift.jobTitle}</p>
                      <p className="text-slate-500 mt-1 flex items-center gap-1"><Clock size={12} /> {shift.progress || 0}%</p>
                    </button>
                  ))}
                  {dayShifts.length === 0 && <p className="text-xs text-slate-400">Fără lucrări planificate.</p>}
                </div>

                <div className="space-y-1">
                  {jobs.slice(0, 2).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleCreateShift(job.id, toIsoDate(day))}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span className="truncate">{job.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
