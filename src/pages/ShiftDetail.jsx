import React from 'react';
import { ChevronRight, Clock, Download, Trash2, TrendingUp, Users, Package, Plus, X, CheckCircle } from 'lucide-react';
import { Card, Button, AutoSaveTextarea } from '../components/UI';
import { formatDate, generatePDF } from '../utils/helpers';
import { supabase } from '../lib/supabaseClient';
import { APP_ID } from '../constants';

export default function ShiftDetailView({ shift, activeShiftId, setView, requestDelete, employees, materials, updateShiftLocally, showToast, user, userName, fetchData }) {
  // Dacă nu există date, nu randăm nimic sau putem pune un loader
  if (!shift) return null;

  const isApproved = shift.status === 'approved';

  // --- FUNCȚII DE UPDATE (Logica de bază) ---

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
      fetchData();
    }
  };

  const toggleEmployee = async (empId) => {
    const currentIds = shift.assignedEmployeeIds || [];
    const currentHours = shift.employeeHours || {};
    let newIds = [...currentIds];
    let newHours = { ...currentHours };
    
    if (currentIds.includes(empId)) {
      newIds = newIds.filter(id => id !== empId);
      delete newHours[empId];
    } else {
      newIds.push(empId);
      newHours[empId] = 8; // Default 8 ore
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
    
    if (idx >= 0) {
        updated[idx].quantity = Number(updated[idx].quantity) + Number(qty);
    } else {
        updated.push({ materialId: matId, quantity: Number(qty) });
    }

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

  // --- FUNCȚIA DE APROBARE + NOTIFICARE EMAIL ---
  const approveShift = async () => {
    const nowIso = new Date().toISOString();
    
    // 1. Actualizăm local starea (UI Optimistic)
    const partial = {
      status: 'approved',
      approvedAt: nowIso,
      approvedBy: user.id,
      approvedByName: userName
    };

    // Actualizăm UI-ul imediat
    updateShiftLocally(activeShiftId, partial);

    try {
      // 2. Actualizăm baza de date
      const { error } = await supabase
        .from('shifts')
        .update(partial)
        .match({ id: activeShiftId, app_id: APP_ID });

      if (error) throw error;

      showToast('Raport aprobat cu succes!');

      // 3. TRIMITEM NOTIFICAREA EMAIL (Aici apelăm funcția din cloud)
      console.log('Se trimite notificarea...');
      
      const { error: funcError } = await supabase.functions.invoke('send-shift-notification', {
        body: {
          shiftTitle: shift.jobTitle,
          approvedBy: userName,
          date: new Date(shift.date).toLocaleDateString('ro-RO'),
          
          // ⚠️ IMPORTANT: Schimbă adresa de mai jos cu adresa reală a administratorului sau a clientului
          recipientEmail: 'email' 
        }
      });

      if (funcError) {
        console.error('Eroare la trimiterea emailului:', funcError);
      } else {
        console.log('Email trimis cu succes!');
      }

    } catch (error) {
      console.error(error);
      showToast('Eroare la aprobare', 'error');
      fetchData(); // Revenim la starea serverului dacă a eșuat
    }
  };

  // --- RENDER (UI NOU) ---
  return (
    <div className="pb-32 animate-in slide-in-from-right-5 duration-300">
      {/* Navbar / Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-slate-100 px-4 py-3 -mx-6 mb-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-2">
           <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
             <ChevronRight className="rotate-180" size={22} />
           </button>
           <div className="flex flex-col">
             <h2 className="font-bold text-slate-900 text-base leading-none">{shift.jobTitle}</h2>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1">
               <Clock size={10} /> {formatDate(shift.date)}
             </span>
           </div>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={() => generatePDF(shift, employees, materials)}><Download size={18} /></Button>
           <Button variant="danger" size="icon" onClick={() => requestDelete('shifts', shift.id, 'Ștergi raportul?')}><Trash2 size={18} /></Button>
         </div>
      </div>

      <div className="space-y-6">
        {isApproved && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="text-emerald-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">Raport Finalizat</h4>
              <p className="text-emerald-700 text-xs mt-0.5">Acest raport a fost semnat de {shift.approvedByName} și nu mai poate fi modificat.</p>
            </div>
          </div>
        )}

        {/* Progress Section */}
        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
               <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><TrendingUp size={16}/></div> Progres
             </h3>
             <span className="text-2xl font-black text-indigo-600">{shift.progress || 0}%</span>
          </div>
          <input 
            type="range" min="0" max="100" step="5" disabled={isApproved}
            value={shift.progress || 0}
            onChange={(e) => updateShift('progress', Number(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
          />
        </Card>

        {/* Team Section */}
        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Users size={16}/></div> Echipă
          </h3>
          
          {!isApproved && (
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {employees.map(emp => {
                const isSelected = shift.assignedEmployeeIds?.includes(emp.id);
                return (
                  <button
                    key={emp.id} onClick={() => toggleEmployee(emp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {emp.name}
                  </button>
                )
              })}
            </div>
          )}
          
          <div className="space-y-2">
            {shift.assignedEmployeeIds?.map(id => {
               const emp = employees.find(e => e.id === id);
               return (
                 <div key={id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                   <span className="font-semibold text-slate-700 text-sm pl-2 border-l-2 border-blue-500">{emp?.name}</span>
                   <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1">
                     <input 
                       type="number" min="0" max="24"
                       value={shift.employeeHours?.[id] ?? 8}
                       disabled={isApproved}
                       onChange={(e) => updateShift('employeeHours', { ...shift.employeeHours, [id]: e.target.value })}
                       className="w-8 text-center bg-transparent text-sm font-bold outline-none text-slate-900"
                     />
                     <span className="text-[10px] font-bold text-slate-400 uppercase">ore</span>
                   </div>
                 </div>
               );
            })}
            {(!shift.assignedEmployeeIds?.length) && <div className="text-center py-4 text-slate-400 text-sm">Niciun angajat selectat.</div>}
          </div>
        </Card>

        {/* Materials Section */}
        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
           <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Package size={16}/></div> Materiale
          </h3>
          
          {!isApproved && (
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <select id="matSelect" className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all">
                  <option value="">Alege material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
              </div>
              <input id="matQty" type="number" placeholder="Cant." className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 text-center text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
              <Button size="icon" variant="success" icon={Plus} onClick={() => {
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
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm">
                     <span className="font-medium text-slate-700">{mat?.name}</span>
                     <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">{u.quantity} {mat?.unit}</span>
                        {!isApproved && <button onClick={() => updateShift('materialUsage', shift.materialUsage.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500"><X size={16}/></button>}
                     </div>
                  </div>
                )
             })}
             {(!shift.materialUsage?.length) && <div className="text-center py-4 text-slate-400 text-sm">Niciun material adăugat.</div>}
          </div>
        </Card>

        {/* Notes */}
        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <h3 className="font-bold text-slate-900 mb-2 text-sm">Note & Observații</h3>
          <AutoSaveTextarea 
            disabled={isApproved}
            value={shift.notes}
            onSave={(val) => updateShift('notes', val)}
            placeholder="Scrie aici observații, probleme întâmpinate sau starea vremii..."
          />
        </Card>
        <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>
      </div>

      {/* Footer Button */}
      {!isApproved && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-30 flex justify-center">
          <Button variant="success" size="lg" className="w-full max-w-md shadow-lg shadow-emerald-500/30" onClick={approveShift}>
            <CheckCircle size={20} /> Finalizează Raportul
          </Button>
        </div>
      )}
    </div>
  );
}