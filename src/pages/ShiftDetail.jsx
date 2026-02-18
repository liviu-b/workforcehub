import React from 'react';
import { ChevronRight, Clock, Download, Trash2, TrendingUp, Users, Package, Plus, X, CheckCircle } from 'lucide-react';
import { Card, Button, AutoSaveTextarea } from '../components/UI';
import { formatDate, generatePDF } from '../utils/helpers';
import { apiClient } from '../lib/apiClient';

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function ShiftDetailView({ shift, activeShiftId, setView, requestDelete, employees, materials, jobs, allShifts, updateShiftLocally, showToast, user, userName, fetchData }) {
  // Dacă nu există date, nu randăm nimic sau putem pune un loader
  if (!shift) return null;

  const [newTaskText, setNewTaskText] = React.useState('');

  const isApproved = shift.status === 'approved';
  const currentJob = jobs.find((job) => job.id === shift.jobId);

  const getShiftCosts = (targetShift) => {
    const employeeHours = targetShift.employeeHours || {};
    const laborCost = Object.entries(employeeHours).reduce((sum, [employeeId, hours]) => {
      const employee = employees.find((emp) => emp.id === employeeId);
      return sum + parseNumber(hours) * parseNumber(employee?.hourlyRate);
    }, 0);

    const materialCost = (targetShift.materialUsage || []).reduce((sum, usage) => {
      const material = materials.find((mat) => mat.id === usage.materialId);
      return sum + parseNumber(usage.quantity) * parseNumber(material?.unitCost);
    }, 0);

    return {
      laborCost,
      materialCost,
      total: laborCost + materialCost,
    };
  };

  const currentShiftCosts = getShiftCosts(shift);
  const relatedShifts = allShifts.filter((item) => item.jobId === shift.jobId);
  const jobActualCosts = relatedShifts.reduce((acc, item) => {
    const itemCosts = getShiftCosts(item);
    return {
      laborCost: acc.laborCost + itemCosts.laborCost,
      materialCost: acc.materialCost + itemCosts.materialCost,
      total: acc.total + itemCosts.total,
    };
  }, { laborCost: 0, materialCost: 0, total: 0 });

  const estimatedLabor = parseNumber(currentJob?.estimatedLaborCost);
  const estimatedMaterials = parseNumber(currentJob?.estimatedMaterialCost);
  const estimatedTotal = estimatedLabor + estimatedMaterials;

  // --- FUNCȚII DE UPDATE (Logica de bază) ---

  const updateShift = async (field, value) => {
    const partial = { [field]: value };
    updateShiftLocally(activeShiftId, partial);
    try {
      await apiClient.updateRecord('shifts', activeShiftId, partial);
    } catch (error) {
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
    try {
      await apiClient.updateRecord('shifts', activeShiftId, partial);
    } catch (error) {
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
    try {
      await apiClient.updateRecord('shifts', activeShiftId, partial);
      showToast('Material adăugat');
    } catch (error) {
      console.error(error);
      showToast('Eroare la salvare', 'error');
      fetchData();
    }
  };

  const addTask = async () => {
    const text = newTaskText.trim();
    if (!text) return;

    const current = shift.taskChecklist || [];
    const updated = [...current, { id: `${Date.now()}`, label: text, done: false }];
    await updateShift('taskChecklist', updated);
    setNewTaskText('');
  };

  const toggleTask = async (taskId) => {
    const current = shift.taskChecklist || [];
    const updated = current.map((task) => (
      task.id === taskId ? { ...task, done: !task.done } : task
    ));
    await updateShift('taskChecklist', updated);
  };

  const removeTask = async (taskId) => {
    const current = shift.taskChecklist || [];
    const updated = current.filter((task) => task.id !== taskId);
    await updateShift('taskChecklist', updated);
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
      await apiClient.updateRecord('shifts', activeShiftId, partial);

      showToast('Raport aprobat cu succes!');

      // 3. TRIMITEM NOTIFICAREA EMAIL (Aici apelăm funcția din cloud)
      console.log('Se trimite notificarea...');
      
      await apiClient.sendShiftNotification({
        shiftTitle: shift.jobTitle,
        approvedBy: userName,
        date: new Date(shift.date).toLocaleDateString('ro-RO'),
        recipientEmail: 'email',
      });
      console.log('Email trimis cu succes!');

    } catch (error) {
      console.error(error);
      showToast('Eroare la aprobare', 'error');
      fetchData(); 
    }
  };

  return (
    <div className="pb-32 animate-in slide-in-from-right-5 duration-300">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 -mx-6 mb-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
             <ChevronRight className="rotate-180" size={22} />
           </button>
           <div className="flex flex-col">
             <h2 className="font-semibold text-slate-900 text-base leading-none">{shift.jobTitle}</h2>
             <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1 flex items-center gap-1">
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="text-emerald-700 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-emerald-900 text-sm">Raport Finalizat</h4>
              <p className="text-emerald-700 text-xs mt-0.5">Acest raport a fost semnat de {shift.approvedByName} și nu mai poate fi modificat.</p>
            </div>
          </div>
        )}

        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
               <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700"><TrendingUp size={16}/></div> Progres
             </h3>
             <span className="text-2xl font-bold text-slate-900">{shift.progress || 0}%</span>
          </div>
          <input 
            type="range" min="0" max="100" step="5" disabled={isApproved}
            value={shift.progress || 0}
            onChange={(e) => updateShift('progress', Number(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800 transition-all"
          />
        </Card>

        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700"><Users size={16}/></div> Echipă
          </h3>
          
          {!isApproved && (
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {employees.map(emp => {
                const isSelected = shift.assignedEmployeeIds?.includes(emp.id);
                return (
                  <button
                    key={emp.id} onClick={() => toggleEmployee(emp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
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
                   <span className="font-semibold text-slate-700 text-sm pl-2 border-l-2 border-slate-700">{emp?.name}</span>
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

        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
           <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700"><Package size={16}/></div> Materiale
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
              <input id="matQty" type="number" placeholder="Cant." className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 text-center text-sm font-bold outline-none focus:border-slate-500 transition-all" />
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
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{u.quantity} {mat?.unit}</span>
                        {!isApproved && <button onClick={() => updateShift('materialUsage', shift.materialUsage.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500"><X size={16}/></button>}
                     </div>
                  </div>
                )
             })}
             {(!shift.materialUsage?.length) && <div className="text-center py-4 text-slate-400 text-sm">Niciun material adăugat.</div>}
          </div>
        </Card>

        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700"><CheckCircle size={16}/></div> Checklist Lucrări
          </h3>

          {!isApproved && (
            <div className="flex gap-2 mb-4">
              <input
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Adaugă pas de lucru..."
                className="flex-1 h-11 px-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
              />
              <Button size="icon" onClick={addTask} icon={Plus} />
            </div>
          )}

          <div className="space-y-2">
            {(shift.taskChecklist || []).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-white">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`h-5 w-5 rounded-md border flex items-center justify-center ${task.done ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 text-transparent'}`}
                >
                  <CheckCircle size={12} />
                </button>
                <p className={`flex-1 text-sm ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.label}</p>
                {!isApproved && (
                  <button onClick={() => removeTask(task.id)} className="text-slate-400 hover:text-rose-600">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {(shift.taskChecklist || []).length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">Nu există task-uri încă.</div>
            )}
          </div>
        </Card>

        <Card className={isApproved ? 'opacity-60 pointer-events-none' : ''}>
          <h3 className="font-semibold text-slate-900 mb-2 text-sm">Note & Observații</h3>
          <AutoSaveTextarea 
            disabled={isApproved}
            value={shift.notes}
            onSave={(val) => updateShift('notes', val)}
            placeholder="Scrie aici observații, probleme întâmpinate sau starea vremii..."
          />
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Costuri Lucrare</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Raport curent</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <p>Manoperă: <span className="font-semibold text-slate-900">{currentShiftCosts.laborCost.toFixed(2)} RON</span></p>
                <p>Materiale: <span className="font-semibold text-slate-900">{currentShiftCosts.materialCost.toFixed(2)} RON</span></p>
                <p>Total: <span className="font-bold text-slate-900">{currentShiftCosts.total.toFixed(2)} RON</span></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lucrare (estimat vs real)</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <p>Estimare totală: <span className="font-semibold text-slate-900">{estimatedTotal.toFixed(2)} RON</span></p>
                <p>Real total: <span className="font-semibold text-slate-900">{jobActualCosts.total.toFixed(2)} RON</span></p>
                <p>Diferență: <span className={`font-bold ${jobActualCosts.total > estimatedTotal ? 'text-rose-600' : 'text-emerald-600'}`}>{(jobActualCosts.total - estimatedTotal).toFixed(2)} RON</span></p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Estimarea vine din setările lucrării, iar costul real se calculează din ore x tarif angajat + consum materiale x cost unitar.
          </p>
        </Card>
        <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>
      </div>

      {!isApproved && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-30 flex justify-center">
          <Button variant="success" size="lg" className="w-full max-w-md" onClick={approveShift}>
            <CheckCircle size={20} /> Finalizează Raportul
          </Button>
        </div>
      )}
    </div>
  );
}