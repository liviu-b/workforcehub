import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Zap } from 'lucide-react';

// Components
import { Spinner, Toast, ConfirmModal } from './components/UI';
import { MobileNav } from './components/MobileNav';

// Pages
import Dashboard from './pages/Dashboard';
import ManageView from './pages/Manage';
import ReportsView from './pages/Reports';
import ShiftDetailView from './pages/ShiftDetail';

// REMOVED: import { APP_ID } from './constants';

// Componenta Welcome Screen
const WelcomeScreen = ({ onFinished }) => {
  const [fade, setFade] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setFade(true), 2000);
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
        <p className="text-indigo-100 font-medium text-lg opacity-90">WorkforceHub</p>
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
  const [appId, setAppId] = useState(null); // STATE PENTRU MULTITENANCY
  const [view, setView] = useState('dashboard'); 
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmData, setConfirmData] = useState({ isOpen: false, message: '', action: null });
  const [showWelcome, setShowWelcome] = useState(true);
  
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

  // Auth & Tenant Resolution
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        // 1. Get User
        let currentUser = null;
        const { data: { user: existingUser }, error } = await supabase.auth.getUser();
        
        if (existingUser) {
          currentUser = existingUser;
        } else {
          // Auto login anonymously if no user
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (!signInError) currentUser = data.user;
        }

        if (currentUser && isMounted) {
          setUser(currentUser);

          // 2. Resolve Tenant (App ID)
          // Cautam profilul utilizatorului sa vedem daca are deja un APP_ID asociat
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('app_id, name')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (profile?.app_id) {
            // User existent -> Setam App ID-ul lui
            setAppId(profile.app_id);
            setUserName(profile.name || 'Utilizator');
          } else {
            // User nou -> Generam un App ID nou si il salvam
            const newAppId = crypto.randomUUID();
            const { error: profileError } = await supabase.from('user_profiles').insert({
              user_id: currentUser.id,
              app_id: newAppId,
              name: 'Utilizator Nou'
            });

            if (!profileError) {
              setAppId(newAppId);
              setUserName('Utilizator Nou');
            } else {
              console.error('Error creating profile:', profileError);
              showToast('Eroare inițializare cont', 'error');
            }
          }
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
      if (!session?.user) setAppId(null); // Reset appId on logout
    });
    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user || !appId) return; // Fetch only if we have user AND appId
    setLoading(true);
    try {
      const [
        { data: shiftsData, error: shiftsError },
        { data: employeesData, error: employeesError },
        { data: jobsData, error: jobsError },
        { data: materialsData, error: materialsError },
      ] = await Promise.all([
        supabase.from('shifts').select('*').eq('app_id', appId),
        supabase.from('employees').select('*').eq('app_id', appId),
        supabase.from('jobs').select('*').eq('app_id', appId),
        supabase.from('materials').select('*').eq('app_id', appId),
      ]);

      if (shiftsError) console.error(shiftsError);
      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
      setJobs(jobsData || []);
      setMaterials(materialsData || []);
    } catch (e) {
      console.error(e);
      showToast('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, appId]); // Added appId to dependencies

  useEffect(() => {
    if (user && appId) fetchData();
  }, [user, appId, fetchData]);

  // Actions
  const requestDelete = (tableName, rowId, message) => {
    setConfirmData({
      isOpen: true,
      message: message || 'Această acțiune este ireversibilă.',
      action: async () => {
        try {
          const { error } = await supabase.from(tableName).delete().match({ id: rowId, app_id: appId });
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
    if (!user || !appId) return;
    const job = jobs.find(j => j.id === jobId);
    try {
      const newShift = {
        app_id: appId, // Use dynamic appId
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

  if (loading || !appId) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {showWelcome && <WelcomeScreen onFinished={() => setShowWelcome(false)} />}
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={() => setConfirmData({ isOpen: false, message: '', action: null })} />
      
      <div className="max-w-lg mx-auto min-h-screen relative bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100">
        <div className="p-6 animate-fade-in"> 
          
          {view === 'dashboard' && 
            <div className="animate-slide-up">
              <Dashboard 
                appId={appId} // Pass prop
                shifts={shifts} user={user} userName={userName} setUserName={setUserName} 
                setActiveShiftId={setActiveShiftId} setView={setView} requestDelete={requestDelete} 
                handleCreateShift={handleCreateShift} jobs={jobs} showToast={showToast}
              />
            </div>
          }
          
          {view === 'manage' && 
            <div className="animate-slide-up">
              <ManageView 
                appId={appId} // Pass prop
                employees={employees} jobs={jobs} materials={materials}
                setEmployees={setEmployees} setJobs={setJobs} setMaterials={setMaterials}
                showToast={showToast} requestDelete={requestDelete}
                shifts={shifts}
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
                appId={appId} // Pass prop
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