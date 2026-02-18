import React, { useState } from 'react';
import { Clock, Edit2, Briefcase, Users, Plus, ChevronRight, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { apiClient } from '../lib/apiClient';

export default function Dashboard({ shifts, user, userName, setUserName, setActiveShiftId, setView, requestDelete, handleCreateShift, jobs, showToast }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const todayStr = new Date().toLocaleDateString('ro-RO');
  const todaysShifts = shifts.filter(s => {
    const d = s.date?.seconds ? new Date(s.date.seconds * 1000) : new Date(s.date);
    return d.toLocaleDateString('ro-RO') === todayStr;
  });

  const saveName = async () => {
     if (tempName.trim()) {
       try {
         await apiClient.upsertUserProfile(tempName.trim());
         setUserName(tempName.trim());
       } catch (e) { showToast('Eroare', 'error'); }
     }
     setIsEditingName(false);
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
            <Calendar size={14} />
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex gap-2 items-center">
                <input 
                  value={tempName} 
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                  className="bg-transparent border-b-2 border-slate-700 outline-none text-slate-900 font-semibold text-3xl w-full max-w-[220px]"
                />
                <Button size="sm" icon={CheckCircle} onClick={saveName}>Salvează</Button>
              </div>
            ) : (
              <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setTempName(userName); setIsEditingName(true); }}>
                 <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Salut, <span className="text-slate-600">{userName}</span></h1>
                 <Edit2 size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )}
          </div>
        </div>
        <div className="h-11 w-11 bg-slate-900 rounded-full flex items-center justify-center text-white font-semibold text-lg">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card noPadding>
          <div className="p-5">
            <div className="inline-flex p-2 rounded-lg bg-slate-100 text-slate-700 mb-3">
              <Briefcase size={16} />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Lucrări Azi</p>
            <p className="text-3xl font-bold text-slate-900">{todaysShifts.length}</p>
          </div>
        </Card>
        <Card noPadding>
          <div className="p-5">
            <div className="inline-flex p-2 rounded-lg bg-slate-100 text-slate-700 mb-3">
              <Users size={16} />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Muncitori</p>
            <p className="text-3xl font-bold text-slate-900">
              {todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0)}
            </p>
          </div>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-slate-700" /> Activitate
          </h2>
        </div>
        
        {todaysShifts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-300 rounded-2xl bg-white text-center">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-500"><Clock size={20}/></div>
             <p className="text-slate-700 font-semibold">Nicio activitate azi</p>
             <p className="text-sm text-slate-400">Pornește o lucrare nouă pentru a începe.</p>
           </div>
        ) : (
          <div className="space-y-3">
            {todaysShifts.map(s => (
              <Card key={s.id} onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }} className="group flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                   s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                 }`}>
                    {s.status === 'approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-semibold text-slate-900 text-base truncate">{s.jobTitle}</h4>
                   <div className="flex items-center gap-2 text-xs font-medium mt-1">
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{s.assignedEmployeeIds?.length || 0} oameni</span>
                      {s.progress > 0 && <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{s.progress}%</span>}
                   </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); requestDelete('shifts', s.id, 'Ștergi raportul?'); }} className="opacity-0 group-hover:opacity-100">
                   <Trash2 size={18} className="text-rose-500"/>
                 </Button>
                 <ChevronRight size={18} className="text-slate-400" />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 px-1">
          <Plus size={18} className="text-slate-700" /> Lucrare Nouă
        </h2>
        <div className="grid gap-3">
           {jobs.length === 0 && <div className="p-6 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">Nu ai șantiere definite. Mergi la Admin.</div>}
           {jobs.map(job => (
             <button
               key={job.id}
               onClick={() => handleCreateShift(job.id)}
               className="flex items-center justify-between w-full p-4 pl-5 bg-white border border-slate-300 hover:border-slate-500 rounded-2xl transition-all group text-left"
             >
               <span className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">{job.title}</span>
               <div className="bg-slate-900 h-8 w-8 flex items-center justify-center rounded-full transition-all">
                 <Plus size={16} className="text-white" strokeWidth={3} />
               </div>
             </button>
           ))}
        </div>
      </section>
      <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>
    </div>
  );
}