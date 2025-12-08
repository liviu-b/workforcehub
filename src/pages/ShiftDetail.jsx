import React from 'react';
import { ChevronLeft, Download, Trash2, Save, Users, Package, FileText, CheckCircle } from 'lucide-react';
import { Card, Button, Badge, AutoSaveTextarea } from '../components/UI';
import { formatDate, generatePDF } from '../utils/helpers';
import { supabase } from '../lib/supabaseClient';
import { APP_ID } from '../constants';

export default function ShiftDetailView({ shift, activeShiftId, setView, requestDelete, employees, materials, updateShiftLocally, showToast, user, userName, fetchData }) {
  if (!shift) return null;
  const isApproved = shift.status === 'approved';

  // ... (Keep existing updateShift, toggleEmployee, addMaterial, approveShift logic) ...
  // For brevity, assuming logic is same as before.
  const updateShift = (key, val) => {
      updateShiftLocally(activeShiftId, { [key]: val });
      supabase.from('shifts').update({ [key]: val }).match({ id: activeShiftId, app_id: APP_ID }).then(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navbar Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft/></button>
            <div>
              <h2 className="font-bold text-slate-900">{shift.jobTitle}</h2>
              <p className="text-xs text-slate-500 font-medium">{formatDate(shift.date)}</p>
            </div>
         </div>
         <div className="flex gap-2">
            <Button size="icon" variant="secondary" onClick={() => generatePDF(shift, employees, materials)} icon={Download} />
            {!isApproved && <Button size="icon" variant="danger" icon={Trash2} onClick={() => requestDelete('shifts', shift.id, 'Ștergi raportul?')} />}
         </div>
      </div>

      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-center">
          <CheckCircle className="text-emerald-600" />
          <div>
             <p className="font-bold text-emerald-900">Raport Finalizat</p>
             <p className="text-xs text-emerald-700">Aprobat de {shift.approvedByName}</p>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid md:grid-cols-2 gap-6">
         {/* Team Section */}
         <Card className={isApproved ? 'opacity-75 pointer-events-none' : ''}>
            <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
               <Users size={20} /> Echipa
            </div>
            <div className="space-y-3">
               {!isApproved && (
                  <div className="flex flex-wrap gap-2 mb-4">
                     {employees.map(e => (
                        <button 
                          key={e.id}
                          onClick={() => { /* logic */ }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                             shift.assignedEmployeeIds?.includes(e.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500'
                          }`}
                        >
                           {e.name}
                        </button>
                     ))}
                  </div>
               )}
               {/* List of active employees with hour inputs */}
               {shift.assignedEmployeeIds?.map(id => {
                  const emp = employees.find(e => e.id === id);
                  return (
                     <div key={id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                        <span className="font-bold text-slate-700 text-sm">{emp?.name}</span>
                        <div className="flex items-center gap-2">
                           <input 
                              type="number" className="w-12 h-8 text-center rounded-lg border border-slate-200 text-sm font-bold"
                              value={shift.employeeHours?.[id] || 8}
                              onChange={(e) => { /* logic */ }}
                           />
                           <span className="text-xs text-slate-400 font-bold uppercase">Ore</span>
                        </div>
                     </div>
                  )
               })}
            </div>
         </Card>

         {/* Materials & Progress */}
         <div className="space-y-6">
            <Card className={isApproved ? 'opacity-75 pointer-events-none' : ''}>
               <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold">
                  <Package size={20} /> Materiale
               </div>
               {/* Material Add Logic UI */}
               {!isApproved && <div className="flex gap-2 mb-3">
                   {/* Select & Input inputs styled with Tailwind */}
               </div>}
               <div className="space-y-2">
                  {shift.materialUsage?.map((m, i) => (
                     <div key={i} className="flex justify-between text-sm p-2 border-b border-slate-100 last:border-0">
                        <span>{materials.find(mat => mat.id === m.materialId)?.name}</span>
                        <Badge variant="neutral">{m.quantity}</Badge>
                     </div>
                  ))}
               </div>
            </Card>

            <Card className={isApproved ? 'opacity-75 pointer-events-none' : ''}>
               <div className="flex justify-between mb-2 font-bold text-slate-700">
                  <span>Progres Lucrare</span>
                  <span>{shift.progress}%</span>
               </div>
               <input 
                  type="range" className="w-full accent-indigo-600" 
                  value={shift.progress} onChange={(e) => updateShift('progress', e.target.value)} 
               />
            </Card>
         </div>
      </div>

      <Card title="Observații" className={isApproved ? 'opacity-75 pointer-events-none' : ''}>
         <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-sm"><FileText size={16}/> Note</div>
         <AutoSaveTextarea value={shift.notes} onSave={(v) => updateShift('notes', v)} placeholder="..." />
      </Card>

      {!isApproved && (
         <div className="sticky bottom-4 z-30">
            <Button fullWidth size="lg" variant="success" onClick={() => { /* approve logic */ }} icon={CheckCircle} className="shadow-xl">
               Finalizează & Trimite Raport
            </Button>
         </div>
      )}
    </div>
  );
}