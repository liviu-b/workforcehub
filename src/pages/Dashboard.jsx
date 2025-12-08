import React, { useState } from 'react';
import { Clock, Briefcase, Users, Plus, ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
import { Card, Button, Input } from '../components/UI';
import { supabase } from '../lib/supabaseClient';
import { APP_ID } from '../constants';

export default function Dashboard({ shifts, user, userName, setUserName, setActiveShiftId, setView, requestDelete, handleCreateShift, jobs, showToast }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const todayStr = new Date().toLocaleDateString('ro-RO');
  const todaysShifts = shifts.filter(s => {
    const d = s.date?.seconds ? new Date(s.date.seconds * 1000) : new Date(s.date);
    return d.toLocaleDateString('ro-RO') === todayStr;
  });

  const activeEmployeesCount = todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0);

  const saveName = async () => {
     if (tempName.trim()) {
       try {
         await supabase.from('user_profiles').upsert({ app_id: APP_ID, user_id: user.id, name: tempName.trim() }, { onConflict: 'app_id,user_id' });
         setUserName(tempName.trim());
         setIsEditingName(false);
       } catch (e) { showToast('Eroare la salvare', 'error'); }
     }
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* --- Header Section --- */}
      <header className="flex justify-between items-center px-1">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {isEditingName ? (
            <div className="flex gap-2 items-center mt-1">
              <Input 
                value={tempName} 
                onChange={e => setTempName(e.target.value)}
                onBlur={saveName}
                autoFocus
                className="h-8 text-xl font-bold border-transparent bg-transparent px-0 focus:ring-0 focus:border-b focus:border-indigo-500 rounded-none w-40"
              />
            </div>
          ) : (
            <h1 
              onClick={() => { setTempName(userName); setIsEditingName(true); }}
              className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
            >
              Salut, {userName}
            </h1>
          )}
        </div>
        <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
          {userName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* --- Quick Stats --- */}
      <div className="grid grid-cols-2 gap-4">
        <Card noPadding className="bg-slate-900 text-white border-slate-900 relative overflow-hidden">
          <div className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-80">
              <Briefcase size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Lucrări Azi</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold leading-none">{todaysShifts.length}</span>
              <span className="text-xs text-slate-400 mb-1">active</span>
            </div>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
        </Card>

        <Card noPadding className="relative overflow-hidden">
           <div className="p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <Users size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Oameni</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold leading-none text-slate-900">{activeEmployeesCount}</span>
              <span className="text-xs text-slate-400 mb-1">pe teren</span>
            </div>
          </div>
        </Card>
      </div>

      {/* --- Action Bar --- */}
      <div className="flex items-center justify-between px-1 pt-2">
         <h2 className="text-lg font-bold text-slate-900">Activitate Recentă</h2>
         {/* Dropdown for New Job could go here if list is long */}
      </div>

      {/* --- Feed / List --- */}
      <div className="space-y-3">
        {todaysShifts.length === 0 ? (
           <div className="text-center py-10 px-4 bg-white rounded-xl border border-dashed border-slate-200">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
               <Calendar size={20}/>
             </div>
             <p className="text-slate-900 font-medium text-sm">Niciun raport deschis</p>
             <p className="text-slate-500 text-xs mt-1">Începe ziua prin crearea unei lucrări noi mai jos.</p>
           </div>
        ) : (
          todaysShifts.map(s => (
            <Card key={s.id} onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }} className="group flex items-center gap-4 hover:border-indigo-500 transition-colors">
               <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                 s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'
               }`}>
                  {s.status === 'approved' ? <Clock size={20} /> : <Clock size={20} />}
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="font-semibold text-slate-900 text-sm truncate">{s.jobTitle}</h4>
                 <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{s.assignedEmployeeIds?.length || 0} angajați</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className={s.progress > 0 ? "text-indigo-600 font-medium" : ""}>{s.progress}% finalizat</span>
                 </div>
               </div>
               <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
            </Card>
          ))
        )}
      </div>

      {/* --- New Shift Section --- */}
      <div className="pt-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Pornește o lucrare nouă</h2>
        <div className="grid gap-2">
           {jobs.map(job => (
             <button
               key={job.id}
               onClick={() => handleCreateShift(job.id)}
               className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-xl transition-all group text-left"
             >
               <span className="font-semibold text-slate-700 group-hover:text-indigo-700">{job.title}</span>
               <div className="bg-slate-50 group-hover:bg-indigo-600 h-8 w-8 flex items-center justify-center rounded-full transition-colors">
                 <Plus size={16} className="text-slate-400 group-hover:text-white" />
               </div>
             </button>
           ))}
           {jobs.length === 0 && <p className="text-xs text-slate-400 italic px-1">Nu există șantiere definite. Mergi la Setări.</p>}
        </div>
      </div>
    </div>
  );
}