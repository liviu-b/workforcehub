import React, { useState } from 'react';
import { Users, MapPin, Package, Plus, Settings, Trash2, Search, Briefcase } from 'lucide-react';
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

  // Componenta reutilizabila pentru un item din lista (stil Dashboard)
  const ListItem = ({ icon: Icon, title, subtitle, onDelete, colorClass = "bg-indigo-100 text-indigo-600" }) => (
    <div className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all mb-2">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="font-bold text-slate-800">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDelete} 
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500"
      >
        <Trash2 size={18} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 pt-4">
      {/* Header similar cu Dashboard */}
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings size={14} /> ADMINISTRARE
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Setări <span className="text-indigo-600">Proiect</span>
          </h1>
        </div>
        <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
          <Briefcase size={24} />
        </div>
      </div>

      {/* Grid Stats Rapid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-800">{employees.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Oameni</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
            <p className="text-2xl font-black text-indigo-600">{jobs.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Lucrări</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
            <p className="text-2xl font-black text-emerald-600">{materials.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Materiale</p>
        </div>
      </div>

      {/* Sectiune Angajati */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <Users size={20} className="text-indigo-500" /> Echipă
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input 
              value={newEmp} 
              onChange={e => setNewEmp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addData('employees', { name: newEmp }, setNewEmp)}
              placeholder="Adaugă membru nou..." 
              className="rounded-xl border-slate-200 focus:border-indigo-500"
            />
          </div>
          <Button size="icon" onClick={() => addData('employees', { name: newEmp }, setNewEmp)} icon={Plus} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"/>
        </div>
        <div className="space-y-1">
          {employees.map(e => (
            <ListItem 
              key={e.id} 
              icon={Users} 
              title={e.name} 
              onDelete={() => requestDelete('employees', e.id, `Ștergi ${e.name}?`)}
            />
          ))}
          {employees.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Niciun angajat definit.</div>}
        </div>
      </section>

      {/* Sectiune Lucrari */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <MapPin size={20} className="text-indigo-500" /> Lucrări Active
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
             <Input 
              value={newJob} 
              onChange={e => setNewJob(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addData('jobs', { title: newJob }, setNewJob)}
              placeholder="Nume lucrare nouă..." 
            />
          </div>
          <Button size="icon" onClick={() => addData('jobs', { title: newJob }, setNewJob)} icon={Plus} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"/>
        </div>
        <div className="space-y-1">
          {jobs.map(j => (
            <ListItem 
              key={j.id} 
              icon={MapPin} 
              title={j.title} 
              colorClass="bg-orange-50 text-orange-500"
              onDelete={() => requestDelete('jobs', j.id, `Ștergi ${j.title}?`)}
            />
          ))}
           {jobs.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Nicio lucrare activă.</div>}
        </div>
      </section>

      {/* Sectiune Materiale */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 px-1">
          <Package size={20} className="text-indigo-500" /> Catalog Materiale
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="flex-[2]">
            <Input 
              value={newMat} 
              onChange={e => setNewMat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addData('materials', { name: newMat, unit }, setNewMat)}
              placeholder="Nume material..." 
            />
          </div>
          <div className="flex-1">
             <select 
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CONSTRUCTION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
          </div>
          <Button size="icon" onClick={() => addData('materials', { name: newMat, unit }, setNewMat)} icon={Plus} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {materials.map(m => (
            <div key={m.id} className="group relative flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{m.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{m.unit}</p>
              </div>
              <button onClick={() => requestDelete('materials', m.id, `Ștergi ${m.name}?`)} className="absolute top-1 right-1 p-1.5 text-slate-200 hover:text-rose-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {materials.length === 0 && <div className="text-center p-4 text-slate-400 text-sm italic">Niciun material definit.</div>}
      </section>
    </div>
  );
}