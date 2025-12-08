import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Search, Calendar, ChevronRight, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, Badge } from '../components/UI';
import { formatDate } from '../utils/helpers';

export default function ReportsView({ shifts, setActiveShiftId, setView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'approved'

  // Filter & Sort Logic
  const filteredShifts = useMemo(() => {
    return shifts
      .filter(s => {
        const matchesSearch = s.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' 
          ? true 
          : statusFilter === 'approved' ? s.status === 'approved' : s.status !== 'approved';
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
  }, [shifts, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Section with Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rapoarte & Istoric</h1>
          <p className="text-slate-500 text-sm mt-1">Gestionează și vizualizează rapoartele de activitate.</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Search Input */}
           <div className="relative group min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Caută lucrare..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
             />
           </div>
           
           {/* Filter Tabs */}
           <div className="flex bg-slate-200/50 p-1 rounded-xl">
              {['all', 'open', 'approved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    statusFilter === filter 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {filter === 'all' ? 'Tot' : filter === 'open' ? 'Active' : 'Finalizate'}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShifts.length === 0 ? (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-3xl animate-enter">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <ClipboardCheck size={32} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">Nu am găsit rapoarte</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Încearcă să modifici filtrele sau creează o lucrare nouă din Dashboard.</p>
           </div>
        ) : (
           filteredShifts.map(shift => (
             <Card 
               key={shift.id} 
               hover 
               onClick={() => { setActiveShiftId(shift.id); setView('shift-detail'); }}
               className="group flex flex-col justify-between min-h-[180px] animate-enter"
             >
               <div>
                 <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                       shift.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                       {shift.status === 'approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <Badge variant={shift.status === 'approved' ? 'success' : 'warning'}>
                       {shift.status === 'approved' ? 'Finalizat' : 'În Lucru'}
                    </Badge>
                 </div>
                 
                 <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                   {shift.jobTitle}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(shift.date)}
                 </p>
               </div>

               <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <span className="flex items-center gap-1" title="Progres">
                        <TrendingUp size={14} className={shift.progress > 0 ? "text-indigo-500" : "text-slate-300"}/> 
                        {shift.progress}%
                     </span>
                     <span className="text-slate-300">•</span>
                     <span>{shift.assignedEmployeeIds?.length || 0} Membri</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <ChevronRight size={16} />
                  </div>
               </div>
             </Card>
           ))
        )}
      </div>
    </div>
  );
}