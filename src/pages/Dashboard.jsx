import React, { useState } from 'react';
import { Clock, Edit2, Briefcase, Users, LayoutGrid, Plus, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
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
         await supabase
           .from('user_profiles')
           .upsert(
             {
               app_id: APP_ID,
               user_id: user.id,
               name: tempName.trim()
             },
             { onConflict: 'app_id,user_id' }
           );
         setUserName(tempName.trim());
       } catch (e) {
         console.error(e);
         showToast('Eroare la salvarea numelui', 'error');
       }
     }
     setIsEditingName(false);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 -mx-6 -mt-6 p-8 pb-12 rounded-b-[2.5rem] text-white shadow-xl shadow-blue-900/20">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
              WorkforceHub • {new Date().toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex gap-2 items-center bg-white/10 p-1 rounded-lg backdrop-blur-md">
                  <input 
                    value={tempName} 
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                    className="bg-transparent border-none outline-none text-white placeholder-white/50 font-bold text-2xl w-full min-w-[150px] px-2"
                  />
                  <button onClick={saveName} className="bg-white text-blue-600 p-1 rounded hover:bg-blue-50"><CheckCircle size={20}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                   <h1 className="text-3xl font-extrabold tracking-tight">Salut, {userName}!</h1>
                   <button onClick={() => { setTempName(userName); setIsEditingName(true); }} className="text-blue-200 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-all opacity-50 group-hover:opacity-100">
                     <Edit2 size={18} />
                   </button>
                </div>
              )}
            </div>
          </div>
          <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner border border-white/10">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="-mt-16 px-2">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-none shadow-lg shadow-blue-900/5" noPadding>
            <div className="p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-blue-50 opacity-50"><Briefcase size={80} /></div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Lucrări Azi</p>
              <p className="text-4xl font-black text-slate-800">{todaysShifts.length}</p>
            </div>
          </Card>
          <Card className="border-none shadow-lg shadow-blue-900/5" noPadding>
            <div className="p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50"><Users size={80} /></div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Muncitori</p>
              <p className="text-4xl font-black text-slate-800">
                {todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Active Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pl-1">
            <Clock size={20} className="text-blue-600" /> Activitate Curentă
          </h2>
          
          {todaysShifts.length === 0 ? (
             <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} className="text-slate-400"/>
               </div>
               <p className="text-slate-400 font-medium">Nu există rapoarte deschise azi.</p>
               <p className="text-xs text-slate-400 mt-1">Pornește o lucrare nouă mai jos.</p>
             </div>
          ) : (
            <div className="grid gap-3">
              {todaysShifts.map(s => (
                <Card 
                  key={s.id} 
                  onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
                  className="flex items-center gap-4 group hover:border-blue-300 transition-all"
                >
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                     s.status === 'approved' 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-orange-100 text-orange-600'
                   }`}>
                      {s.status === 'approved' ? <CheckCircle size={24} strokeWidth={2.5}/> : <Clock size={24} strokeWidth={2.5}/>}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-slate-900 truncate text-base">{s.jobTitle}</h4>
                     <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Users size={12}/> {s.assignedEmployeeIds?.length || 0}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <span className={s.progress > 0 ? 'text-purple-600 font-bold' : ''}>{s.progress || 0}% gata</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); requestDelete('shifts', s.id, 'Ștergi raportul?'); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                     >
                       <Trash2 size={18} />
                     </Button>
                     <ChevronRight size={20} className="text-slate-300" strokeWidth={2.5} />
                   </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Start Job */}
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pl-1">
            <Plus size={20} className="text-blue-600" /> Pornește Lucrare Nouă
          </h2>
          <div className="grid gap-3">
             {jobs.length === 0 && <div className="text-sm text-slate-500 bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">Nu ai definit lucrări.<br/>Mergi la <span className="font-bold">Admin</span> pentru a adăuga șantiere.</div>}
             {jobs.map(job => (
               <button
                 key={job.id}
                 onClick={() => handleCreateShift(job.id)}
                 className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl transition-all group text-left"
               >
                 <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{job.title}</span>
                 <div className="bg-slate-50 group-hover:bg-blue-600 p-2.5 rounded-xl transition-all shadow-sm">
                   <Plus size={18} className="text-slate-400 group-hover:text-white transition-colors" strokeWidth={3} />
                 </div>
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}