import React, { useState, useMemo } from 'react';
import { Users, MapPin, Package, Plus, Settings, Trash2, Phone, Calendar, User, Clock, X, Save, Briefcase } from 'lucide-react';
import { Card, Input, Button } from '../components/UI';
import { CONSTRUCTION_UNITS, APP_ID } from '../constants';
import { supabase } from '../lib/supabaseClient';

// --- COMPONENTA EDITARE ANGAJAT ---
const EmployeeEditModal = ({ employee, shifts, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: employee.name || '',
    phone: employee.phone || '',
    hire_date: employee.hire_date || ''
  });


  // Calculam statistici (Ore lucrate pe luni)
  const stats = useMemo(() => {
    const history = {};
    shifts.forEach(shift => {
      if (shift.employeeHours && shift.employeeHours[employee.id]) {
        const date = new Date(shift.date?.seconds ? shift.date.seconds * 1000 : shift.date);
        const monthKey = date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' });
        history[monthKey] = (history[monthKey] || 0) + parseFloat(shift.employeeHours[employee.id]);
      }
    });
    return history;
  }, [employee.id, shifts]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">{formData.name}</h3>
            <p className="text-indigo-200 text-sm">Detalii & Istoric</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Formular Editare */}
          <div className="space-y-3">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nume Complet</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} icon={User} />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telefon</label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="07xx..." icon={Phone} />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Angajării</label>
                <Input type="date" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} icon={Calendar} />
             </div>
          </div>

          {/* Istoric Ore */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
             <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Clock size={16} className="text-indigo-500"/> Istoric Activitate</h4>
             {Object.keys(stats).length === 0 ? (
               <p className="text-sm text-slate-400 italic">Nicio activitate înregistrată.</p>
             ) : (
               <div className="space-y-2">
                 {Object.entries(stats).map(([month, hours]) => (
                   <div key={month} className="flex justify-between text-sm border-b border-slate-200 pb-1 last:border-0">
                     <span className="capitalize text-slate-600">{month}</span>
                     <span className="font-bold text-indigo-600">{hours} ore</span>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => onDelete(employee.id)} className="text-rose-500 bg-rose-50 hover:bg-rose-100 flex-1">Șterge</Button>
            <Button onClick={() => onSave(employee.id, formData)} icon={Save} className="flex-[2] bg-indigo-600">Salvează</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTA EDITARE LUCRARE ---
const JobEditModal = ({ job, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: job.title || '',
    location: job.location || '',
    start_date: job.start_date || '',
    manager: job.manager || ''
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 bg-orange-500 text-white flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">Editare Lucrare</h3>
            <p className="text-orange-100 text-sm">{formData.title}</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-3">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nume Lucrare</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} icon={Briefcase} />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Locație</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Adresa..." icon={MapPin} />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Început</label>
                  <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} icon={Calendar} />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Responsabil</label>
                  <Input value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} placeholder="Nume..." icon={User} />
               </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onDelete(job.id)} className="text-rose-500 bg-rose-50 hover:bg-rose-100 flex-1">Șterge</Button>
            <Button onClick={() => onSave(job.id, formData)} icon={Save} className="flex-[2] bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-orange-200">Salvează</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PAGINA PRINCIPALA MANAGE ---
export default function ManageView({ employees, jobs, materials, setEmployees, setJobs, setMaterials, showToast, requestDelete, shifts = [] }) {
  const [newEmp, setNewEmp] = useState('');
  const [newJob, setNewJob] = useState('');
  const [newMat, setNewMat] = useState('');
  const [unit, setUnit] = useState('buc');

  // State pentru modale
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const addData = async (tableName, data, resetFn) => {
    if (!data.name && !data.title) return;
    try {
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert([{ ...data, app_id: APP_ID }])
        .select()
        .single();

      if (error) throw error;

      showToast('Adăugat cu succes!');
      resetFn('');
      if (tableName === 'employees') setEmployees(prev => [...prev, inserted]);
      if (tableName === 'jobs') setJobs(prev => [...prev, inserted]);
      if (tableName === 'materials') setMaterials(prev => [...prev, inserted]);
    } catch (e) {
      console.error(e);
      showToast('Eroare', 'error');
    }
  };

  const updateData = async (tableName, id, updates, stateSetter) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('app_id', APP_ID);

      if (error) throw error;

      stateSetter(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      showToast('Actualizat cu succes!');
      setSelectedEmployee(null);
      setSelectedJob(null);
    } catch (e) {
      console.error(e);
      showToast('Eroare la actualizare', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24 pt-4">
      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar size={14} />
             Administrare
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Setări <span className="text-indigo-600">Proiect</span>
          </h1>
        </div>
        <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
          <Briefcase size={24} />
        </div>
      </div>

      {/* Sectiune Angajati (GRID LAYOUT) */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <Users size={20} className="text-indigo-500" /> Echipă
        </h2>
        <div className="flex gap-2 mb-4">
          <Input 
            value={newEmp} 
            onChange={e => setNewEmp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addData('employees', { name: newEmp }, setNewEmp)}
            placeholder="Nume nou..." 
            className="flex-1"
          />
          <Button size="icon" onClick={() => addData('employees', { name: newEmp }, setNewEmp)} icon={Plus} className="bg-indigo-600 rounded-xl"/>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {employees.map(e => (
            <div 
              key={e.id} 
              onClick={() => setSelectedEmployee(e)}
              className="group bg-white border border-slate-100 p-3 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-colors group-hover:bg-indigo-100"></div>
              <div className="relative z-10">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-2">
                   {e.name.charAt(0)}
                </div>
                <p className="font-bold text-slate-800 truncate">{e.name}</p>
                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                   {e.phone || 'Fără telefon'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {employees.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Adaugă membrii echipei.</div>}
      </section>

      {/* Sectiune Lucrari */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <MapPin size={20} className="text-indigo-500" /> Lucrări Active
        </h2>
        <div className="flex gap-2 mb-4">
          <Input 
            value={newJob} 
            onChange={e => setNewJob(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addData('jobs', { title: newJob }, setNewJob)}
            placeholder="Lucrare nouă..." 
            className="flex-1"
          />
          <Button size="icon" onClick={() => addData('jobs', { title: newJob }, setNewJob)} icon={Plus} className="bg-indigo-600 rounded-xl"/>
        </div>

        <div className="space-y-2">
          {jobs.map(j => (
            <div 
              key={j.id} 
              onClick={() => setSelectedJob(j)}
              className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{j.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {j.location ? <span>{j.location}</span> : <span className="italic">Fără locație</span>}
                    {j.manager && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">Resp: {j.manager}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {jobs.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Adaugă lucrări active.</div>}
      </section>

      {/* Sectiune Materiale */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <Package size={20} className="text-indigo-500" /> Catalog Materiale
        </h2>
        <div className="flex gap-2 mb-4">
           <Input 
             value={newMat} 
             onChange={e => setNewMat(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && addData('materials', { name: newMat, unit }, setNewMat)}
             placeholder="Material..." 
             className="flex-[2]"
           />
           <select 
             value={unit} onChange={e => setUnit(e.target.value)}
             className="flex-1 bg-white border border-slate-200 rounded-xl px-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
           >
             {CONSTRUCTION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
           </select>
           <Button size="icon" onClick={() => addData('materials', { name: newMat, unit }, setNewMat)} icon={Plus} className="bg-indigo-600 rounded-xl"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {materials.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">
              <span>{m.name} ({m.unit})</span>
              <button onClick={() => requestDelete('materials', m.id, `Ștergi ${m.name}?`)} className="hover:text-red-500 p-1"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </section>
      <p className="text-center text-[10px] text-slate-300 pt-6">Power by ACL-Smart Software</p>

      {/* MODALE */}
      {selectedEmployee && (
        <EmployeeEditModal 
          employee={selectedEmployee}
          shifts={shifts}
          onClose={() => setSelectedEmployee(null)}
          onSave={(id, data) => updateData('employees', id, data, setEmployees)}
          onDelete={(id) => { requestDelete('employees', id, `Ștergi ${selectedEmployee.name}?`); setSelectedEmployee(null); }}
        />
      )}

      {selectedJob && (
        <JobEditModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={(id, data) => updateData('jobs', id, data, setJobs)}
          onDelete={(id) => { requestDelete('jobs', id, `Ștergi ${selectedJob.title}?`); setSelectedJob(null); }}
        />
      )}
    </div>
  );
}
