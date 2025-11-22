import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Zap } from 'lucide-react'; // Iconita pentru logo

// Components
import { Spinner, Toast, ConfirmModal } from './components/UI';
import { MobileNav } from './components/MobileNav';

// Pages
import Dashboard from './pages/Dashboard';
import ManageView from './pages/Manage';
import ReportsView from './pages/Reports';
import ShiftDetailView from './pages/ShiftDetail';

// Constants
import { APP_ID } from './constants';

// Componenta Welcome Screen
const WelcomeScreen = ({ onFinished }) => {
  const [fade, setFade] = useState(false);
  
  useEffect(() => {
    // Porneste disparitia dupa 2 secunde
    const timer = setTimeout(() => setFade(true), 2000);
    // Demonstare completa dupa 2.5 secunde (timp pentru animatie CSS)
    const removeTimer = setTimeout(onFinished, 2500);
    return () => { clearTimeout(timer); clearTimeout(removeTimer); };
  }, [onFinished]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 transition-opacity duration-500 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center text-white animate-bounce-slight">
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-md inline-flex mb-6 shadow-2xl ring-4 ring-white/10">
          <Zap size={48} className="text-white fill-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 drop-shadow-lg">Bun venit!</h1>
        <p className="text-indigo-100 font-medium text-lg opacity-90">Workforce Hub</p>
      </div>
      
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-200/60">
          Power by ACL-Smart Software
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmData, setConfirmData] = useState({ isOpen: false, message: '', action: null });
  const [showWelcome, setShowWelcome] = useState(true); // State pentru welcome screen
  
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

  // Auth
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const { data: { user: existingUser }, error } = await supabase.auth.getUser();
        if (error) console.error('Auth error (getUser):', error);

        if (!existingUser) {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) {
            console.error('Auth error:', signInError);
            showToast('Eroare la autentificare', 'error');
          } else if (isMounted) {
            setUser(data.user);
          }
        } else if (isMounted) {
          setUser(existingUser);
        }
      } catch (err) {
        console.error('Auth Error:', err);
        showToast('Eroare la autentificare', 'error');
      }
    };
    initAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });
    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: shiftsData, error: shiftsError },
        { data: employeesData, error: employeesError },
        { data: jobsData, error: jobsError },
        { data: materialsData, error: materialsError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase.from('shifts').select('*').eq('app_id', APP_ID),
        supabase.from('employees').select('*').eq('app_id', APP_ID),
        supabase.from('jobs').select('*').eq('app_id', APP_ID),
        supabase.from('materials').select('*').eq('app_id', APP_ID),
        supabase.from('user_profiles').select('*').eq('app_id', APP_ID).eq('user_id', user.id).maybeSingle(),
      ]);

      if (shiftsError) console.error(shiftsError);
      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
      setJobs(jobsData || []);
      setMaterials(materialsData || []);
      setUserName(profileData?.name || 'Utilizator');
    } catch (e) {
      console.error(e);
      showToast('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Actions (same as before)
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
            if (activeShiftId === rowId) {
              setView('dashboard');
              setActiveShiftId(null);
            }
          }
          if (tableName === 'employees') setEmployees(prev => prev.filter(e => e.id !== rowId));
          if (tableName === 'jobs') setJobs(prev => prev.filter(j => j.id !== rowId));
          if (tableName === 'materials') setMaterials(prev => prev.filter(m => m.id !== rowId));

          showToast('Șters cu succes!');
          setConfirmData({ isOpen: false, message: '', action: null });
        } catch (e) {
          console.error(e);
          showToast('Eroare la ștergere', 'error');
        }
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
        jobTitle: job?.title || 'Lucrare necunoscută',
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
      showToast('Raport nou creat!');
    } catch (error) {
      console.error(error);
      showToast('Eroare la creare', 'error');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;
  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Se conectează...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {showWelcome && <WelcomeScreen onFinished={() => setShowWelcome(false)} />}
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={() => setConfirmData({ isOpen: false, message: '', action: null })} />
      
      <div className="max-w-lg mx-auto min-h-screen relative bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100">
        <div className="p-6 animate-fade-in"> 
          {/* Am adaugat o clasa de animatie simpla pe container */}
          
          {view === 'dashboard' && 
            <div className="animate-slide-up">
              <Dashboard 
                shifts={shifts} user={user} userName={userName} setUserName={setUserName} 
                setActiveShiftId={setActiveShiftId} setView={setView} requestDelete={requestDelete} 
                handleCreateShift={handleCreateShift} jobs={jobs} showToast={showToast}
              />
            </div>
          }
          
          {view === 'manage' && 
            <div className="animate-slide-up">
              <ManageView 
                employees={employees} jobs={jobs} materials={materials}
                setEmployees={setEmployees} setJobs={setJobs} setMaterials={setMaterials}
                showToast={showToast} requestDelete={requestDelete}
              />
            </div>
          }
          
          {view === 'shifts' && 
            <div className="animate-slide-up">
              <ReportsView shifts={shifts} setActiveShiftId={setActiveShiftId} setView={setView} />
            </div>
          }
          
          {view === 'shift-detail' && 
            <div className="animate-slide-in-right">
              <ShiftDetailView 
                shift={shifts.find(s => s.id === activeShiftId)} 
                activeShiftId={activeShiftId} setView={setView} requestDelete={requestDelete}
                employees={employees} materials={materials} updateShiftLocally={updateShiftLocally}
                showToast={showToast} user={user} userName={userName} fetchData={fetchData}
              />
            </div>
          }
        </div>
        {view !== 'shift-detail' && <MobileNav currentView={view} setView={setView} />}
      </div>
    </div>
  );
}