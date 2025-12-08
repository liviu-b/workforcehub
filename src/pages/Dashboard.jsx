import React, { useState } from 'react';
import { Clock, Briefcase, Users, Plus, ChevronRight, Activity, Calendar } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { supabase } from '../lib/supabaseClient';
import { APP_ID } from '../constants';

export default function Dashboard({ shifts, userName, setUserName, setActiveShiftId, setView, handleCreateShift, jobs, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameVal, setNameVal] = useState(userName);

  const today = new Date().toLocaleDateString('ro-RO');
  const todaysShifts = shifts.filter(s => new Date(s.date).toLocaleDateString('ro-RO') === today);
  
  const saveName = async () => {
     if(nameVal !== userName) {
        await supabase.from('user_profiles').upsert({ app_id: APP_ID, user_id: user.id, name: nameVal });
        setUserName(nameVal);
     }
     setIsEditing(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 font-semibold text-sm mb-1">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {isEditing ? (
             <input 
               autoFocus onBlur={saveName} 
               value={nameVal} onChange={e => setNameVal(e.target.value)}
               className="text-3xl font-bold bg-transparent border-b-2 border-indigo-500 outline-none text-slate-900 w-full md:w-auto"
             />
          ) : (
             <h1 onClick={() => setIsEditing(true)} className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors">
               Salut, {userName}
             </h1>
          )}
        </div>
        <Button onClick={() => document.getElementById('new-shift').scrollIntoView({ behavior: 'smooth' })} icon={Plus} variant="primary">
          Lucrare Nouă
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="bg-indigo-600 text-white border-none" noPadding>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg"><Briefcase size={20}/></div>
                <span className="text-xs font-bold opacity-70">AZI</span>
              </div>
              <p className="text-3xl font-bold">{todaysShifts.length}</p>
              <p className="text-indigo-100 text-sm mt-1">Lucrări active</p>
            </div>
         </Card>
         <Card noPadding>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Users size={20}/></div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0)}
              </p>
              <p className="text-slate-500 text-sm mt-1">Oameni pe teren</p>
            </div>
         </Card>
         {/* More stats can be added here for Desktop */}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Shifts List */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-indigo-500" size={20}/> Activitate Recentă
            </h2>
          </div>
          
          {todaysShifts.length === 0 ? (
            <div className="bg-white border-dashed border-2 border-slate-200 rounded-2xl p-8 text-center">
               <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Clock size={24} />
               </div>
               <p className="text-slate-500 font-medium">Nicio activitate azi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysShifts.map(s => (
                <Card key={s.id} hover onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }} className="flex items-center gap-4 group">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                     s.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                   }`}>
                     <Clock size={20} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-slate-900 truncate">{s.jobTitle}</h3>
                     <div className="flex gap-2 mt-1">
                        <Badge variant="neutral">{s.assignedEmployeeIds?.length || 0} Oameni</Badge>
                        {s.progress > 0 && <Badge variant="primary">{s.progress}% Gata</Badge>}
                     </div>
                   </div>
                   <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions (Create Shift) */}
        <section id="new-shift" className="space-y-4">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus className="text-indigo-500" size={20}/> Start Lucrare
           </h2>
           <div className="grid gap-3">
             {jobs.length === 0 && <p className="text-slate-500 text-sm">Nu ai șantiere definite. Mergi la Admin.</p>}
             {jobs.map(job => (
               <button
                 key={job.id}
                 onClick={() => handleCreateShift(job.id)}
                 className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group text-left w-full"
               >
                 <span className="font-bold text-slate-700 group-hover:text-indigo-600">{job.title}</span>
                 <Plus size={18} className="text-slate-300 group-hover:text-indigo-600" />
               </button>
             ))}
           </div>
        </section>
      </div>
    </div>
  );
}