import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Spinner, Toast, ConfirmModal } from './components/UI';
import { MobileNav } from './components/MobileNav';

// Pages
import Dashboard from './pages/Dashboard';
import ManageView from './pages/Manage';
import ReportsView from './pages/Reports';
import ShiftDetailView from './pages/ShiftDetail';

import { APP_ID } from './constants';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmData, setConfirmData] = useState({ isOpen: false, message: '', action: null });
  
  // Data State
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Helpers
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const updateShiftLocally = (shiftId, partial) => {
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, ...partial } : s)));
  };

  // Auth & Init
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        if (!existingUser) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error && isMounted) setUser(data.user);
        } else if (isMounted) {
          setUser(existingUser);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: shiftsData },
        { data: employeesData },
        { data: jobsData },
        { data: materialsData },
        { data: profileData },
      ] = await Promise.all([
        supabase.from('shifts').select('*').eq('app_id', APP_ID),
        supabase.from('employees').select('*').eq('app_id', APP_ID),
        supabase.from('jobs').select('*').eq('app_id', APP_ID),
        supabase.from('materials').select('*').eq('app_id', APP_ID),
        supabase.from('user_profiles').select('*').eq('app_id', APP_ID).eq('user_id', user.id).maybeSingle(),
      ]);

      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
      setJobs(jobsData || []);
      setMaterials(materialsData || []);
      setUserName(profileData?.name || 'Utilizator');
    } catch (e) {
      showToast('Eroare la conexiune', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // Actions
  const requestDelete = (tableName, rowId, message) => {
    setConfirmData({
      isOpen: true,
      message: message || 'Această acțiune este ireversibilă.',
      action: async () => {
        try {
          const { error } = await supabase.from(tableName).delete().match({ id: rowId, app_id: APP_ID });
          if (error) throw error;

          if (tableName === 'shifts') {
            setShifts(prev => prev.filter(s => s.id !== rowId));
            if (activeShiftId === rowId) { setView('dashboard'); setActiveShiftId(null); }
          }
          if (tableName === 'employees') setEmployees(prev => prev.filter(e => e.id !== rowId));
          if (tableName === 'jobs') setJobs(prev => prev.filter(j => j.id !== rowId));
          if (tableName === 'materials') setMaterials(prev => prev.filter(m => m.id !== rowId));

          showToast('Șters cu succes!');
        } catch (e) { showToast('Eroare la ștergere', 'error'); }
        setConfirmData({ isOpen: false, message: '', action: null });
      }
    });
  };

  const handleCreateShift = async (jobId) => {
    if (!user) return;
    const job = jobs.find(j => j.id === jobId);
    try {
      const newShift = {
        app_id: APP_ID,
        jobId,
        jobTitle: job?.title || 'Lucrare',
        date: new Date().toISOString(),
        status: 'open',
        progress: 0,
        assignedEmployeeIds: [],
        employeeHours: {},
        materialUsage: [],
        notes: '',
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };

      const { data, error } = await supabase.from('shifts').insert([newShift]).select().single();
      if (error) throw error;

      setShifts(prev => [...prev, data]);
      setActiveShiftId(data.id);
      setView('shift-detail');
      showToast('Raport inițiat');
    } catch (error) { showToast('Eroare la creare', 'error'); }
  };

  if (loading || !user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={() => setConfirmData({ isOpen: false, message: '', action: null })} />
      
      {/* Main Container - constrained width for mobile feel on desktop */}
      <div className="max-w-lg mx-auto min-h-screen bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100 flex flex-col">
        <div className="flex-1 p-5 animate-fade-in relative">
          
          {view === 'dashboard' && 
            <Dashboard 
              shifts={shifts} user={user} userName={userName} setUserName={setUserName} 
              setActiveShiftId={setActiveShiftId} setView={setView} requestDelete={requestDelete} 
              handleCreateShift={handleCreateShift} jobs={jobs} showToast={showToast}
            />
          }
          
          {view === 'manage' && 
            <ManageView 
              employees={employees} jobs={jobs} materials={materials}
              setEmployees={setEmployees} setJobs={setJobs} setMaterials={setMaterials}
              showToast={showToast} requestDelete={requestDelete} shifts={shifts}
            />
          }
          
          {view === 'shifts' && 
            <ReportsView shifts={shifts} setActiveShiftId={setActiveShiftId} setView={setView} />
          }
          
          {view === 'shift-detail' && 
            <ShiftDetailView 
              shift={shifts.find(s => s.id === activeShiftId)} 
              activeShiftId={activeShiftId} setView={setView} requestDelete={requestDelete}
              employees={employees} materials={materials} updateShiftLocally={updateShiftLocally}
              showToast={showToast} user={user} userName={userName} fetchData={fetchData}
            />
          }
        </div>
        
        {view !== 'shift-detail' && <MobileNav currentView={view} setView={setView} />}
      </div>
    </div>
  );
}