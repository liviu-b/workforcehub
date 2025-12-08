import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/Layout';
import { Spinner, Toast, ConfirmModal } from './components/UI'; // Assuming you keep Toast/Confirm logic in UI.jsx
import Dashboard from './pages/Dashboard';
import ManageView from './pages/Manage';
import ReportsView from './pages/Reports';
import ShiftDetailView from './pages/ShiftDetail';
import { APP_ID } from './constants';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [userName, setUserName] = useState('Utilizator');
  
  // UI Helpers State
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmData, setConfirmData] = useState({ isOpen: false });

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  // ... (Keep existing Auth & FetchData logic exactly as is) ...
  // For brevity, I'm skipping the duplicated fetch logic, just paste your existing useEffects here.
  
  // Auth simulation for preview context:
  useEffect(() => {
     // ... Your auth logic ...
     const init = async () => {
         const { data } = await supabase.auth.getUser();
         setUser(data.user || { id: 'guest' }); // Fallback for dev
         setLoading(false);
         fetchData();
     }
     init();
  }, []);
  
  const fetchData = useCallback(async () => {
      // ... Your fetch logic ...
  }, [user]);

  // Actions
  const handleCreateShift = async (jobId) => {
    // ... logic ...
    const job = jobs.find(j => j.id === jobId);
    const newShift = {
        app_id: APP_ID,
        jobId,
        jobTitle: job?.title || 'Lucrare',
        date: new Date().toISOString(),
        status: 'open',
        progress: 0,
        assignedEmployeeIds: [],
        createdAt: new Date().toISOString(),
    };
    // Simulate DB insert for UI
    const { data } = await supabase.from('shifts').insert([newShift]).select().single();
    if (data) {
        setShifts(prev => [...prev, data]);
        setActiveShiftId(data.id);
        setView('shift-detail');
    }
  };

  const requestDelete = (table, id, msg) => {
      setConfirmData({
          isOpen: true, 
          message: msg, 
          onConfirm: async () => {
              await supabase.from(table).delete().match({ id, app_id: APP_ID });
              if (table === 'shifts') {
                 setShifts(p => p.filter(x => x.id !== id));
                 setView('dashboard');
              }
              // ... handle others ...
              setConfirmData({ isOpen: false });
              showToast('Șters cu succes');
          },
          onCancel: () => setConfirmData({ isOpen: false })
      });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Spinner /></div>;

  return (
    <Layout currentView={view} setView={setView} user={user} userName={userName}>
       {/* Global Modals */}
       {toast.message && <div className="fixed top-4 right-4 z-[100]"><div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold">{toast.message}</div></div>}
       <ConfirmModal {...confirmData} />

       {view === 'dashboard' && (
         <Dashboard 
           shifts={shifts} user={user} userName={userName} setUserName={setUserName}
           setActiveShiftId={setActiveShiftId} setView={setView} requestDelete={requestDelete}
           handleCreateShift={handleCreateShift} jobs={jobs}
         />
       )}

       {view === 'manage' && (
         <ManageView 
           employees={employees} jobs={jobs} materials={materials}
           setEmployees={setEmployees} setJobs={setJobs} setMaterials={setMaterials}
           requestDelete={requestDelete} showToast={showToast} shifts={shifts}
         />
       )}

       {view === 'shifts' && (
         <ReportsView shifts={shifts} setActiveShiftId={setActiveShiftId} setView={setView} />
       )}

       {view === 'shift-detail' && (
         <ShiftDetailView 
           shift={shifts.find(s => s.id === activeShiftId)}
           activeShiftId={activeShiftId} setView={setView} requestDelete={requestDelete}
           employees={employees} materials={materials}
           updateShiftLocally={(id, data) => setShifts(prev => prev.map(s => s.id === id ? {...s, ...data} : s))}
           showToast={showToast} user={user} userName={userName} fetchData={fetchData}
         />
       )}
    </Layout>
  );
}