import React from 'react';
import { ChevronRight, Clock, Download, Trash2, TrendingUp, Users, Package, Plus, X, ClipboardCheck, CheckCircle } from 'lucide-react';
import { Card, Button, AutoSaveTextarea } from '../components/UI';
import { formatDate, generatePDF } from '../utils/helpers';
import { supabase } from '../lib/supabaseClient';
import { APP_ID } from '../constants';

export default function ShiftDetailView({ shift, activeShiftId, setView, requestDelete, employees, materials, updateShiftLocally, showToast, user, userName, fetchData }) {
  if (!shift) return <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-2"><Briefcase size={40} className="opacity-20"/> Raportul nu a fost găsit.</div>;

  const isApproved = shift.status === 'approved';

  const updateShift = async (field, value) => {
    const partial = { [field]: value };
    updateShiftLocally(activeShiftId, partial);
    const { error } = await supabase
      .from('shifts')
      .update(partial)
      .match({ id: activeShiftId, app_id: APP_ID });
    if (error) {
      console.error(error);
      showToast('Eroare la salvare', 'error');
      fetchData(); // re-sync dacă a eșuat
    }
  };

  const toggleEmployee = async (empId) => {
    const currentIds = shift.assignedEmployeeIds || [];
    const currentHours = shift.employeeHours || {};
    let newIds = [...currentIds], newHours = {...currentHours};
    
    if (currentIds.includes(empId)) {
      newIds = newIds.filter(id => id !== empId);
      delete newHours[empId];
    } else {
      newIds.push(empId);
      newHours[empId] = 8;
    }

    const partial = { assignedEmployeeIds: newIds, employeeHours: newHours };
    updateShiftLocally(activeShiftId, partial);
    const { error } = await supabase
      .from('shifts')
      .update(partial)
      .match({ id: activeShiftId, app_id: APP_ID });
    if (error) {
      console.error(error);
      showToast('Eroare la salvare', 'error');
      fetchData();
    }
  };

  const addMaterial = async (matId, qty) => {
    if (!matId || qty <= 0) return;
    const current = shift.materialUsage || [];
    const idx = current.findIndex(m => m.materialId === matId);
    const updated = [...current];
    if (idx >= 0) updated[idx].quantity = Number(updated[idx].quantity) + Number(qty);
    else updated.push({ materialId: matId, quantity: Number(qty) });

    const partial = { materialUsage: updated };
    updateShiftLocally(activeShiftId, partial);
    const { error } = await supabase
      .from('shifts')
      .update(partial)
      .match({ id: activeShiftId, app_id: APP_ID });
    if (error) {
      console.error(error);
      showToast('Eroare la salvare', 'error');
      fetchData();
    } else {
      showToast('Material adăugat');
    }
  };

  const approveShift = async () => {
    const nowIso = new Date().toISOString();
    const partial = {
      status: 'approved',
      approvedAt: nowIso,
      approvedBy: user.id,
      approvedByName: userName
    };
    updateShiftLocally(activeShiftId, partial);
    const { error } = await supabase
      .from('shifts')
      .update(partial)
      .match({ id: activeShiftId, app_id: APP_ID });
    if (error) {
      console.error(error);
      showToast('Eroare la aprobare', 'error');
      fetchData();
    } else {
      showToast('Raport aprobat!');
    }
  };

  return (
    <div className="pb-24 animate-in slide-in-from-right-5 duration-300">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 -mx-6 mb-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
           <button onClick={() => setView('dashboard')} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600 border border-transparent hover:border-slate-200">
             <ChevronRight className="rotate-180" size={20} strokeWidth={2.5} />
           </button>
           <div>
             <h2 className="font-bold text-slate-900 leading-tight text-lg">{shift.jobTitle}</h2>
             <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock size={10} /> {formatDate(shift.date)}</span>
           </div>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => generatePDF(shift, employees, materials)}><Download size={16} /></Button>
           {isApproved && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-200 tracking-wide flex items-center">APROBAT</span>}
           <Button variant="danger" size="icon" className="h-9 w-9" onClick={() => requestDelete('shifts', shift.id, 'Ștergi raportul?')}><Trash2 size={16} /></Button>
         </div>
      </div>

      <div className="space-y-6">
        {/* Progress */}
        <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
            <TrendingUp size={18} className="text-purple-500" /> Progres Lucrare
          </h3>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <input 
              type="range" min="0" max="100" step="5" disabled={isApproved}
              value={shift.progress || 0}
              onChange={(e) => updateShift('progress', Number(e.target.value))}
              className="flex-1 h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 transition-all"
            />
            <span className="font-bold text-2xl w-16 text-right text-purple-600">{shift.progress || 0}%</span>
          </div>
        </Card>

        {/* Team */}
        <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Users size={18} className="text-blue-500" /> Echipă & Ore
          </h3>
          {!isApproved && (
            <div className="flex flex-wrap gap-2 mb-6">
              {employees.map(emp => (
                <button
                  key={emp.id} onClick={() => toggleEmployee(emp.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
                    shift.assignedEmployeeIds?.includes(emp.id)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          )}
          <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-100">
            {shift.assignedEmployeeIds?.map(id => {
               const emp = employees.find(e => e.id === id);
               return (
                 <div key={id} className="flex justify-between items-center p-4">
                   <span className="font-semibold text-slate-700">{emp?.name}</span>
                   <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
                     <input 
                       type="number" min="0" max="24"
                       value={shift.employeeHours?.[id] ?? 8}
                       disabled={isApproved}
                       onChange={(e) => updateShift('employeeHours', { ...shift.employeeHours, [id]: e.target.value })}
                       className="w-10 text-center bg-transparent text-sm font-bold outline-none text-slate-900"
                     />
                     <span className="text-[10px] font-bold text-slate-400 pr-2 uppercase">ore</span>
                   </div>
                 </div>
               );
            })}
            {(!shift.assignedEmployeeIds || shift.assignedEmployeeIds.length === 0) && <div className="text-center py-8 text-slate-400 text-sm italic">Selectează angajații prezenți din lista de mai sus.</div>}
          </div>
        </Card>

        {/* Materials */}
        <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Package size={18} className="text-emerald-500" /> Materiale
          </h3>
          {!isApproved && (
            <div className="flex gap-3 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <select id="matSelect" className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none border-none cursor-pointer">
                <option value="">Selectează material...</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              <div className="w-px bg-slate-200 my-1"></div>
              <input 
                id="matQty" type="number" placeholder="0" 
                className="w-16 bg-transparent text-sm font-bold text-center outline-none text-slate-900"
                onKeyDown={(e) => e.key === 'Enter' && addMaterial(document.getElementById('matSelect').value, e.target.value)}
              />
              <Button size="sm" variant="success" icon={Plus} onClick={() => {
                const s = document.getElementById('matSelect'), i = document.getElementById('matQty');
                addMaterial(s.value, i.value);
                i.value = '';
              }} />
            </div>
          )}
          <div className="space-y-2">
            {shift.materialUsage?.map((u, idx) => {
              const mat = materials.find(m => m.id === u.materialId);
              return (
                <div key={idx} className="flex justify-between items-center px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-slate-700 text-sm font-medium">{mat?.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 text-sm bg-slate-100 px-2 py-1 rounded">{u.quantity} {mat?.unit}</span>
                    {!isApproved && <button onClick={() => updateShift('materialUsage', shift.materialUsage.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16}/></button>}
                  </div>
                </div>
              );
            })}
            {(!shift.materialUsage?.length) && <div className="text-center py-8 text-slate-400 text-sm italic">Fără consumuri înregistrate.</div>}
          </div>
        </Card>

        {/* Notes */}
        <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
          <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Note</h3>
          <AutoSaveTextarea 
            disabled={isApproved}
            value={shift.notes}
            onSave={(val) => updateShift('notes', val)}
            placeholder="Scrie aici observații, probleme întâmpinate sau starea vremii..."
          />
        </Card>

        {/* Footer Action */}
        {!isApproved ? (
          <Button variant="success" size="lg" className="w-full py-4 text-lg shadow-emerald-500/30 hover:shadow-emerald-500/50" onClick={approveShift}>
            <ClipboardCheck size={24} /> Aprobă & Semnează
          </Button>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 text-center shadow-inner">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <p className="font-bold text-emerald-800 text-lg">Raport Finalizat</p>
            <div className="text-sm text-emerald-600 font-medium mt-2 bg-white/50 inline-block px-3 py-1 rounded-lg border border-emerald-100">
               Semnat de: {shift.approvedByName || 'Utilizator'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}