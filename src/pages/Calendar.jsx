import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, Copy } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { apiClient } from '../lib/apiClient';
import { APP_ID } from '../constants';

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

const moveShiftToDate = (shiftDate, targetDate) => {
  const source = new Date(shiftDate);
  const target = new Date(targetDate);
  target.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
  return target.toISOString();
};

export default function CalendarView({ shifts, jobs, handleCreateShift, updateShiftLocally, fetchData, showToast, setActiveShiftId, setView }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [dragOverKey, setDragOverKey] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

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

  const handleDropShift = async (event, day) => {
    event.preventDefault();
    const shiftId = event.dataTransfer.getData('text/shift-id');
    setDragOverKey('');
    if (!shiftId) return;

    const shift = shifts.find((item) => item.id === shiftId);
    if (!shift) return;

    const newDate = moveShiftToDate(shift.date, day);
    updateShiftLocally(shiftId, { date: newDate });
    try {
      await apiClient.updateRecord('shifts', shiftId, { date: newDate });
      showToast('Raport mutat în calendar');
    } catch (error) {
      console.error(error);
      showToast('Eroare la mutarea raportului', 'error');
      fetchData();
    }
  };

  const duplicateShiftForWeek = async (shift) => {
    if (!shift?.jobId) return;
    const sourceDate = new Date(shift.date);
    const sourceDay = sourceDate.toLocaleDateString('ro-RO');

    const targetDays = days
      .filter((day) => day.toLocaleDateString('ro-RO') !== sourceDay)
      .map((day) => day.toISOString());

    if (targetDays.length === 0) return;

    setIsDuplicating(true);
    try {
      await Promise.all(targetDays.map((dateIso) => apiClient.createRecord('shifts', {
        app_id: APP_ID,
        jobId: shift.jobId,
        jobTitle: shift.jobTitle,
        date: dateIso,
        status: 'open',
        progress: 0,
        assignedEmployeeIds: [],
        employeeHours: {},
        materialUsage: [],
        taskChecklist: [],
        notes: '',
        submittedAt: null,
        submittedBy: null,
        submittedByName: null,
        createdAt: new Date().toISOString(),
        createdBy: shift.createdBy || null,
      })));
      await fetchData();
      showToast('Raport duplicat pe săptămână');
    } catch (error) {
      console.error(error);
      showToast('Eroare la duplicare', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarDays size={14} /> Planificare săptămânală
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar <span className="text-indigo-700">Lucrări</span></h1>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={18} /></Button>
          <p className="font-semibold text-slate-800 text-sm text-center">
            {days[0].toLocaleDateString('ro-RO')} - {days[6].toLocaleDateString('ro-RO')}
          </p>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={18} /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-2">
          {days.map((day) => {
            const key = day.toLocaleDateString('ro-RO');
            const dayShifts = shiftsByDay[key] || [];
            const isToday = new Date().toLocaleDateString('ro-RO') === key;

            return (
              <div
                key={key}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverKey(key);
                }}
                onDragLeave={() => setDragOverKey('')}
                onDrop={(event) => handleDropShift(event, day)}
                className={`border rounded-xl p-2 min-h-[170px] ${isToday ? 'border-indigo-500 bg-gradient-to-b from-indigo-50 to-purple-50' : 'border-indigo-100 bg-white/90'} ${dragOverKey === key ? 'ring-2 ring-indigo-300' : ''}`}
              >
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">{day.toLocaleDateString('ro-RO', { weekday: 'short' })}</p>
                  <p className="text-sm font-semibold text-slate-900">{day.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })}</p>
                </div>

                <div className="space-y-1.5 mb-2.5">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/shift-id', shift.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      className="w-full text-left text-xs border border-indigo-100 rounded-lg p-1.5 hover:border-indigo-300 bg-white"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => { setActiveShiftId(shift.id); setView('shift-detail'); }}
                          className="font-semibold text-slate-800 truncate text-left flex-1"
                        >
                          {shift.jobTitle}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicateShiftForWeek(shift);
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Duplică pe săptămână"
                          disabled={isDuplicating}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-indigo-600 mt-1 flex items-center gap-1"><Clock size={12} /> {shift.progress || 0}%</p>
                    </div>
                  ))}
                  {dayShifts.length === 0 && <p className="text-xs text-slate-400">Fără lucrări planificate.</p>}
                </div>

                <div className="space-y-1">
                  {jobs.slice(0, 2).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleCreateShift(job.id, toIsoDate(day))}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-800 flex items-center gap-1"
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
