import React from 'react';
import { ClipboardCheck, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Card } from '../components/UI';
import { formatDate } from '../utils/helpers';

export default function ReportsView({ shifts, setActiveShiftId, setView }) {
  const sorted = [...shifts].sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <div className="space-y-8 pb-24 pt-4">
      {/* Header Aligned with Dashboard/Manage */}
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar size={14} />
            Istoric Complet
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Rapoarte <span className="text-purple-600">Proiect</span>
          </h1>
        </div>
        <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shadow-sm">
          <ClipboardCheck size={24} />
        </div>
      </div>
      
      <div className="grid gap-3">
        {sorted.length === 0 && (
           <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                <ClipboardCheck size={28} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">Nu există istoric</h3>
              <p className="text-slate-400 text-sm mt-1">Rapoartele finalizate vor apărea aici.</p>
           </div>
        )}

        {sorted.map(s => (
           <Card 
            key={s.id} 
            onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
            className="group flex items-center gap-4 hover:border-purple-300 transition-all"
           >
              {/* Consistent Icon Box Style */}
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                s.status === 'approved' 
                  ? 'bg-purple-50 text-purple-600' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                 <ClipboardCheck size={24} />
              </div>

              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-lg truncate group-hover:text-purple-700 transition-colors">
                      {s.jobTitle}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider ml-2 ${
                      s.status === 'approved' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status === 'approved' ? 'FINAL' : 'DESCHIS'}
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <Calendar size={10} /> {formatDate(s.date)}
                    </span>
                    {s.progress > 0 && (
                      <span className="text-purple-600 flex items-center bg-purple-50 px-2 py-0.5 rounded-md">
                        <TrendingUp size={10} className="mr-1"/> {s.progress}%
                      </span>
                    )}
                 </div>
              </div>
              
              <ChevronRight size={20} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
           </Card>
        ))}
      </div>
      
      <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>
    </div>
  );
}