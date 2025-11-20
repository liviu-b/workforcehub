import React, { useState } from 'react';
import { Users, MapPin, Package, Plus, Briefcase, Trash2 } from 'lucide-react';
import { Card, Input, Button } from '../components/UI';
import { CONSTRUCTION_UNITS, APP_ID } from '../constants';
import { supabase } from '../lib/supabaseClient';

export default function ManageView({ employees, jobs, materials, setEmployees, setJobs, setMaterials, showToast, requestDelete }) {
  const [newEmp, setNewEmp] = useState('');
  const [newJob, setNewJob] = useState('');
  const [newMat, setNewMat] = useState('');
  const [unit, setUnit] = useState('buc');

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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Administrare</h2>
        <div className="bg-blue-50 p-3 rounded-xl">
          <Briefcase size={24} className="text-blue-600" />
        </div>
      </div>
      
      {/* Employees */}
      <Card className="border-l-4 border-l-blue-500">
        <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Users size={20} className="text-blue-500"/> Echipă
        </h3>
        <div className="flex gap-3 mb-4">
          <Input 
            value={newEmp} 
            onChange={e => setNewEmp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addData('employees', { name: newEmp }, setNewEmp)}
            placeholder="Nume angajat..." 
          />
          <Button size="icon" onClick={() => addData('employees', { name: newEmp }, setNewEmp)} icon={Plus} />
        </div>
        <div className="flex flex-wrap gap-2">
          {employees.map(e => (
            <div key={e.id} className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm font-medium border border-slate-100 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-default">
              <span>{e.name}</span>
              <button onClick={() => requestDelete('employees', e.id, `Ștergi ${e.name}?`)} className="text-slate-400 hover:text-red-500 transition-colors p-0.5"><Trash2 size={13} /></button>
            </div>
          ))}
          {employees.length === 0 && <span className="text-sm text-slate-400 italic flex items-center gap-2"><Users size={14}/> Adaugă membrii echipei.</span>}
        </div>
      </Card>

      {/* Jobs */}
      <Card className="border-l-4 border-l-orange-500">
        <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800">
          <MapPin size={20} className="text-orange-500"/> Lucrări
        </h3>
        <div className="flex gap-3 mb-4">
          <Input 
            value={newJob} 
            onChange={e => setNewJob(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addData('jobs', { title: newJob }, setNewJob)}
            placeholder="Nume lucrare..." 
          />
          <Button size="icon" variant="primary" className="bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-orange-500/20" onClick={() => addData('jobs', { title: newJob }, setNewJob)} icon={Plus} />
        </div>
        <div className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 group">
              <span className="truncate">{j.title}</span>
              <button onClick={() => requestDelete('jobs', j.id, `Ștergi ${j.title}?`)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={16} /></button>
            </div>
          ))}
          {jobs.length === 0 && <span className="text-sm text-slate-400 italic flex items-center gap-2"><MapPin size={14}/> Adaugă șantiere active.</span>}
        </div>
      </Card>

      {/* Materials */}
      <Card className="border-l-4 border-l-emerald-500">
        <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Package size={20} className="text-emerald-500"/> Materiale
        </h3>
        <div className="flex gap-3 mb-4">
          <Input 
            value={newMat} 
            onChange={e => setNewMat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addData('materials', { name: newMat, unit }, setNewMat)}
            placeholder="Material..." 
          />
          <select 
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {CONSTRUCTION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <Button size="icon" variant="primary" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-emerald-500/20" onClick={() => addData('materials', { name: newMat, unit }, setNewMat)} icon={Plus} />
        </div>
        <div className="flex flex-wrap gap-2">
          {materials.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 cursor-default">
              <span>{m.name} ({m.unit})</span>
              <button onClick={() => requestDelete('materials', m.id, `Ștergi ${m.name}?`)} className="hover:text-red-500 transition-colors p-0.5"><Trash2 size={12} /></button>
            </div>
          ))}
           {materials.length === 0 && <span className="text-sm text-slate-400 italic flex items-center gap-2"><Package size={14}/> Definește catalogul de materiale.</span>}
        </div>
      </Card>
    </div>
  );
}