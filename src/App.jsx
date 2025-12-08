import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Zap } from 'lucide-react';

// Components
import { Spinner, Toast, ConfirmModal } from './components/UI';
import { MobileNav } from './components/MobileNav';

// Pages
import Auth from './pages/Auth'; // Import the new Auth page
import Dashboard from './pages/Dashboard';
import ManageView from './pages/Manage';
import ReportsView from './pages/Reports';
import ShiftDetailView from './pages/ShiftDetail';

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

  // Derived APP_ID for Multi-tenancy
  // We use the authenticated user's ID as the APP_ID to isolate their data
  const currentAppId = user ? user.id : null;

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const updateShiftLocally = (shiftId, partial) => {
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, ...partial } : s)));
  };

  // Auth Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user || !currentAppId) return;
    
    // We don't set loading(true) here to avoid screen flickering on re-fetches
    // But you could if you want a hard reload effect
    try {
      const [
        { data: shiftsData, error: shiftsError },
        { data: employeesData, error: employeesError },
        { data: jobsData, error: jobsError },
        { data: materialsData, error: materialsError },
        // Fetch profile to get display name (metadata usually has it too)
        { data: profileData } 
      ] = await Promise.all([
        supabase.from('shifts').select('*').eq('app_id', currentAppId),
        supabase.from('employees').select('*').eq('app_id', currentAppId),
        supabase.from('jobs').select('*').eq('app_id', currentAppId),
        supabase.from('materials').select('*').eq('app_id', currentAppId),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (shiftsError) console.error(shiftsError);

      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
      setJobs(jobsData || []);
      setMaterials(materialsData || []);
      
      // Fallback to metadata name if profile doesn't exist yet
      const metaName = user.user_metadata?.full_name;
      setUserName(profileData?.name || metaName || 'Utilizator');
      
    } catch (e) {
      console.error(e);
      showToast('Eroare la încărcarea datelor', 'error');
    }
  }, [user, currentAppId]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Actions
  const requestDelete = (tableName, rowId, message) => {
    setConfirmData({
      isOpen: true,
      message: message || 'Această acțiune este ireversibilă.',
      action: async () => {
        try {
          // IMPORTANT: match app_id to ensure users can only delete their own data
          const { error } = await supabase
            .from(tableName)
            .delete()
            .match({ id: rowId, app_id: currentAppId }); 
            
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
    if (!user || !currentAppId) return;
    const job = jobs.find(j => j.id === jobId);
    try {
      const newShift = {
        app_id: currentAppId, // Assign to current user's tenant
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
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('dashboard');
    setShifts([]);
    setEmployees([]);
    setJobs([]);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;
  
  // If not logged in, show Auth Screen
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {showWelcome && <WelcomeScreen onFinished={() => setShowWelcome(false)} />}
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={() => setConfirmData({ isOpen: false, message: '', action: null })} />
      
      <div className="max-w-lg mx-auto min-h-screen relative bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100">
        <div className="p-6 animate-fade-in pb-24"> 
          
          {/* Header Bar with Logout */}
          <div className="flex justify-between items-center mb-6 px-1">
             <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salut,</span>
               <span className="font-bold text-slate-900 text-lg">{userName}</span>
             </div>
             <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
               Deconectare
             </Button>
          </div>

          {view === 'dashboard' && 
            <div className="animate-slide-up">
              <Dashboard 
                shifts={shifts} user={user} userName={userName} setUserName={setUserName} 
                setActiveShiftId={setActiveShiftId} setView={setView} requestDelete={requestDelete} 
                handleCreateShift={handleCreateShift} jobs={jobs} showToast={showToast}
                // Pass currentAppId down if Dashboard creates items directly
                appId={currentAppId}
              />
            </div>
          }
          
          {view === 'manage' && 
            <div className="animate-slide-up">
              <ManageView 
                employees={employees} jobs={jobs} materials={materials}
                setEmployees={setEmployees} setJobs={setJobs} setMaterials={setMaterials}
                showToast={showToast} requestDelete={requestDelete}
                shifts={shifts}
                appId={currentAppId} // Pass this to Manage view for creating items
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