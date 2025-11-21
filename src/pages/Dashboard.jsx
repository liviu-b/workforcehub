import React, { useState } from 'react';
import { Clock, Edit2, Briefcase, Users, Plus, ChevronRight, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { Card, Button } from '../components/UI';
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

  const saveName = async () => {
     if (tempName.trim()) {
       try {
         await supabase.from('user_profiles').upsert({ app_id: APP_ID, user_id: user.id, name: tempName.trim() }, { onConflict: 'app_id,user_id' });
         setUserName(tempName.trim());
       } catch (e) { showToast('Eroare', 'error'); }
     }
     setIsEditingName(false);
  };

  return (
    <div className="space-y-8 pb-24 pt-4">
      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
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
                  className="bg-transparent border-b-2 border-indigo-500 outline-none text-slate-900 font-bold text-3xl w-full max-w-[200px]"
                />
                <Button size="sm" icon={CheckCircle} onClick={saveName} />
              </div>
            ) : (
              <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setTempName(userName); setIsEditingName(true); }}>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Salut, <span className="text-indigo-600">{userName}</span></h1>
                 <Edit2 size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )}
          </div>
        </div>
        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl ring-4 ring-white shadow-lg">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-indigo-500/20" noPadding>
          <div className="p-6 relative overflow-hidden">
            <Briefcase className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12" />
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Lucrări Azi</p>
            <p className="text-4xl font-black">{todaysShifts.length}</p>
          </div>
        </Card>
        <Card className="bg-white border-slate-100" noPadding>
          <div className="p-6 relative overflow-hidden">
            <Users className="absolute -right-4 -bottom-4 text-slate-50 w-24 h-24 rotate-12" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Muncitori</p>
            <p className="text-4xl font-black text-slate-800">
              {todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Active Activity */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" /> Activitate
          </h2>
        </div>
        
        {todaysShifts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-slate-300"><Clock size={24}/></div>
             <p className="text-slate-500 font-medium">Nicio activitate azi</p>
             <p className="text-sm text-slate-400">Pornește o lucrare nouă pentru a începe.</p>
           </div>
        ) : (
          <div className="space-y-3">
            {todaysShifts.map(s => (
              <Card key={s.id} onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }} className="group flex items-center gap-4">
                 <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                   s.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                 }`}>
                    {s.status === 'approved' ? <CheckCircle size={24} /> : <Clock size={24} />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-slate-900 text-lg truncate">{s.jobTitle}</h4>
                   <div className="flex items-center gap-3 text-xs font-medium mt-1">
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{s.assignedEmployeeIds?.length || 0} oameni</span>
                      {s.progress > 0 && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{s.progress}% gata</span>}
                   </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); requestDelete('shifts', s.id, 'Ștergi raportul?'); }} className="opacity-0 group-hover:opacity-100">
                   <Trash2 size={18} className="text-rose-400 hover:text-rose-600"/>
                 </Button>
                 <ChevronRight size={20} className="text-slate-300" />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 px-1">
          <Plus size={20} className="text-indigo-500" /> Lucrare Nouă
        </h2>
        <div className="grid gap-3">
           {jobs.length === 0 && <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-500 text-sm">Nu ai șantiere definite. Mergi la Admin.</div>}
           {jobs.map(job => (
             <button
               key={job.id}
               onClick={() => handleCreateShift(job.id)}
               className="flex items-center justify-between w-full p-4 pl-5 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 rounded-2xl transition-all group text-left"
             >
               <span className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{job.title}</span>
               <div className="bg-slate-100 group-hover:bg-indigo-600 h-8 w-8 flex items-center justify-center rounded-full transition-all">
                 <Plus size={16} className="text-slate-400 group-hover:text-white" strokeWidth={3} />
               </div>
             </button>
           ))}
        </div>
      </section>
    </div>
  );
}