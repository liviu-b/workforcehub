import React from 'react';
import { ClipboardCheck, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Card } from '../components/UI';
import { formatDate } from '../utils/helpers';

export default function ReportsView({ shifts, setActiveShiftId, setView }) {
  const sorted = [...shifts].sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar size={14} />
            Istoric Complet
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Rapoarte <span className="text-slate-600">Proiect</span>
          </h1>
        </div>
        <div className="h-11 w-11 bg-slate-900 rounded-full flex items-center justify-center text-white">
          <ClipboardCheck size={20} />
        </div>
      </div>
      
      <div className="grid gap-3">
        {sorted.length === 0 && (
           <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500">
                <ClipboardCheck size={22} />
              </div>
              <h3 className="text-slate-900 font-semibold text-lg">Nu există istoric</h3>
              <p className="text-slate-400 text-sm mt-1">Rapoartele finalizate vor apărea aici.</p>
           </div>
        )}

        {sorted.map(s => (
           <Card 
            key={s.id} 
            onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
            className="group flex items-center gap-4 hover:border-slate-500 transition-all"
           >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                s.status === 'approved' 
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                 <ClipboardCheck size={20} />
              </div>

              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-900 text-base truncate group-hover:text-slate-900 transition-colors">
                      {s.jobTitle}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider ml-2 ${
                      s.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.status === 'approved' ? 'FINAL' : 'DESCHIS'}
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      <Calendar size={10} /> {formatDate(s.date)}
                    </span>
                    {s.progress > 0 && (
                      <span className="text-slate-700 flex items-center bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <TrendingUp size={10} className="mr-1"/> {s.progress}%
                      </span>
                    )}
                 </div>
              </div>
              
              <ChevronRight size={18} className="text-slate-400" />
           </Card>
        ))}
      </div>
      
      <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>
    </div>
  );
}