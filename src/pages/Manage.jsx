import React, { useState } from 'react';
import { Users, MapPin, Package, Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, Input, Button, Modal, Badge } from '../components/UI';
import { CONSTRUCTION_UNITS, APP_ID } from '../constants';
import { supabase } from '../lib/supabaseClient';

export default function ManageView({ employees, jobs, materials, setEmployees, setJobs, setMaterials, showToast, requestDelete }) {
  const [activeTab, setActiveTab] = useState('employees'); // employees, jobs, materials
  const [modalOpen, setModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({});

  // Helper to handle generic add
  const handleAdd = async () => {
    const table = activeTab;
    const payload = { ...newItem, app_id: APP_ID };
    
    // Simple validation
    if (!payload.name && !payload.title) return;

    const { data, error } = await supabase.from(table).insert([payload]).select().single();
    if (data) {
       if (table === 'employees') setEmployees(p => [...p, data]);
       if (table === 'jobs') setJobs(p => [...p, data]);
       if (table === 'materials') setMaterials(p => [...p, data]);
       setModalOpen(false);
       setNewItem({});
       showToast('Adăugat cu succes');
    }
  };

  const tabs = [
    { id: 'employees', label: 'Angajați', icon: Users },
    { id: 'jobs', label: 'Șantiere', icon: MapPin },
    { id: 'materials', label: 'Materiale', icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Administrare</h1>
        <div className="flex p-1 bg-slate-200/50 rounded-xl w-full md:w-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
         <Button onClick={() => setModalOpen(true)} icon={Plus} variant="primary">Adaugă {activeTab === 'employees' ? 'Angajat' : activeTab === 'jobs' ? 'Lucrare' : 'Material'}</Button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {activeTab === 'employees' && employees.map(e => (
          <Card key={e.id} className="flex items-center gap-4 relative group">
             <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
               {e.name.charAt(0)}
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-slate-900">{e.name}</h4>
               <p className="text-xs text-slate-500">{e.phone || 'Nespecificat'}</p>
             </div>
             <button onClick={() => requestDelete('employees', e.id, `Ștergi ${e.name}?`)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
               <Trash2 size={18} />
             </button>
          </Card>
        ))}

        {activeTab === 'jobs' && jobs.map(j => (
          <Card key={j.id} className="group">
             <div className="flex justify-between items-start">
               <div>
                  <Badge variant="warning" className="mb-2">Activ</Badge>
                  <h4 className="font-bold text-slate-900 text-lg">{j.title}</h4>
               </div>
               <button onClick={() => requestDelete('jobs', j.id, `Ștergi ${j.title}?`)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                 <Trash2 size={18} />
               </button>
             </div>
             <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
               <MapPin size={16} /> {j.location || 'Fără locație'}
             </div>
          </Card>
        ))}

        {activeTab === 'materials' && materials.map(m => (
          <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
             <div>
               <p className="font-bold text-slate-800">{m.name}</p>
               <span className="text-xs text-slate-400 font-bold uppercase">{m.unit}</span>
             </div>
             <button onClick={() => requestDelete('materials', m.id, `Ștergi ${m.name}?`)} className="text-slate-300 hover:text-rose-500 transition-colors">
               <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adaugă Element Nou">
        <div className="space-y-4">
           {activeTab === 'employees' && (
             <>
               <Input label="Nume" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
               <Input label="Telefon" value={newItem.phone || ''} onChange={e => setNewItem({...newItem, phone: e.target.value})} />
             </>
           )}
           {activeTab === 'jobs' && (
             <>
               <Input label="Titlu Lucrare" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
               <Input label="Locație" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} />
             </>
           )}
           {activeTab === 'materials' && (
             <div className="flex gap-2">
               <Input className="flex-[2]" label="Denumire" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
               <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Unitate</label>
                 <select 
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-2 text-sm"
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    value={newItem.unit || 'buc'}
                 >
                    {CONSTRUCTION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                 </select>
               </div>
             </div>
           )}
           <div className="pt-4">
             <Button fullWidth onClick={handleAdd}>Salvează</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}