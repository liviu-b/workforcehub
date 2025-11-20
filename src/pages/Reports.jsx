import React from 'react';
import { ClipboardCheck, TrendingUp } from 'lucide-react';
import { Card } from '../components/UI';
import { formatDate } from '../utils/helpers';

export default function ReportsView({ shifts, setActiveShiftId, setView }) {
  const sorted = [...shifts].sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-2 rounded-xl"><ClipboardCheck size={24} className="text-purple-600"/></div>
        <h2 className="text-2xl font-bold text-slate-900">Istoric Rapoarte</h2>
      </div>
      
      <div className="grid gap-4">
        {sorted.length === 0 && (
           <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <ClipboardCheck size={48} className="text-slate-300 mx-auto mb-4"/>
              <p className="text-slate-400 font-medium">Nu există istoric.</p>
           </div>
        )}
        {sorted.map(s => (
           <Card 
            key={s.id} 
            onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
            className="flex items-center gap-4 hover:border-blue-400 transition-all group"
           >
              <div className="flex-1">
                 <h4 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors">{s.jobTitle}</h4>
                 <div className="flex gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{formatDate(s.date)}</span>
                    {s.progress > 0 && <span className="text-purple-600 flex items-center bg-purple-50 px-2 py-1 rounded-md"><TrendingUp size={10} className="mr-1"/> {s.progress}%</span>}
                 </div>
              </div>
              <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                s.status === 'approved' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {s.status === 'approved' ? 'FINAL' : 'DESCHIS'}
              </span>
           </Card>
        ))}
      </div>
    </div>
  );
}