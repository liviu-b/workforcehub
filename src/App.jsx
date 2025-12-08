import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
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

// Constants
import { APP_ID } from './constants';

// ====================================================
// 1. Workforce Context and Hook (New Architectural Layer)
// ====================================================

const WorkforceContext = createContext(null);

/**
 * Custom hook to consume the Workforce Context.
 * Used by Dashboard, ManageView, ReportsView, and ShiftDetailView.
 */
export const useWorkforce = () => {
  const context = useContext(WorkforceContext);
  if (!context) {
    throw new Error('useWorkforce must be used within a WorkforceProvider');
  }
  return context;
};

/**
 * WorkforceProvider: Manages all global data state, fetching, authentication, and CRUD actions.
 */
const WorkforceProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmData, setConfirmData] = useState({ isOpen: false, message: '', action: null });

  // Data State
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Helpers
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  }, []);
  
  const dismissConfirm = useCallback(() => setConfirmData({ isOpen: false, message: '', action: null }), []);

  const updateShiftLocally = useCallback((shiftId, partial) => {
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, ...partial } : s)));
  }, []);

  // Auth (Moved from App)
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        let currentUser = (await supabase.auth.getUser()).data.user;
        if (!currentUser) {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          currentUser = data.user;
        }
        if (isMounted) setUser(currentUser);
      } catch (err) {
        console.error('Auth Error:', err);
        if (isMounted) showToast('Eroare la autentificare', 'error');
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
  }, [showToast]);

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
      console.error(e);
      showToast('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // CRUD Actions
  const requestDelete = useCallback((tableName, rowId, message, onComplete) => {
    setConfirmData({
      isOpen: true,
      message: message || 'Această acțiune este ireversibilă.',
      action: async () => {
        try {
          const { error } = await supabase.from(tableName).delete().match({ id: rowId, app_id: APP_ID });
          if (error) throw error;

          if (tableName === 'shifts') setShifts(prev => prev.filter(s => s.id !== rowId));
          if (tableName === 'employees') setEmployees(prev => prev.filter(e => e.id !== rowId));
          if (tableName === 'jobs') setJobs(prev => prev.filter(j => j.id !== rowId));
          if (tableName === 'materials') setMaterials(prev => prev.filter(m => m.id !== rowId));

          showToast('Șters cu succes!');
          dismissConfirm();
          if (onComplete) onComplete();
        } catch (e) {
          console.error(e);
          showToast('Eroare la ștergere', 'error');
          dismissConfirm();
        }
      }
    });
  }, [showToast, dismissConfirm]);

  const handleCreateShift = useCallback(async (jobId, onShiftCreated) => {
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
      showToast('Raport nou creat!');
      if (onShiftCreated) onShiftCreated(data.id); // Callback for routing in AppContent

    } catch (error) {
      console.error(error);
      showToast('Eroare la creare', 'error');
    }
  }, [user, jobs, showToast]);
  
  const updateUserName = useCallback(async (name) => {
      try {
         await supabase.from('user_profiles').upsert({ app_id: APP_ID, user_id: user.id, name: name.trim() }, { onConflict: 'app_id,user_id' });
         setUserName(name.trim());
         return true;
       } catch (e) { 
         showToast('Eroare la salvare nume', 'error');
         return false;
       }
  }, [user, showToast]);


  const contextValue = {
    // State
    user, loading, userName, shifts, employees, jobs, materials,
    // Helpers
    showToast, fetchData, updateUserName,
    // Actions
    updateShiftLocally, requestDelete, handleCreateShift,
  };

  return (
    <WorkforceContext.Provider value={contextValue}>
      {/* Toast and ConfirmModal are now centralized in the Provider */}
      {children} 
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={dismissConfirm} />
    </WorkforceContext.Provider>
  );
};


// ====================================================
// Welcome Screen (Kept as is)
// ====================================================

const WelcomeScreen = ({ onFinished }) => {
  // ... (Component logic remains unchanged) ...
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


// ====================================================
// 2. Simplified App Content (UI/Routing only)
// ====================================================

function AppContent() {
  const { user, loading, shifts, employees, materials, fetchData, requestDelete, updateShiftLocally, handleCreateShift } = useWorkforce();
  
  // Local UI State (Routing)
  const [view, setView] = useState('dashboard'); 
  const [activeShiftId, setActiveShiftId] = useState(null);
  
  const activeShift = shifts.find(s => s.id === activeShiftId);
  const isShiftDetailView = view === 'shift-detail' && activeShiftId && activeShift;

  // Loading/Auth checks now reference state from the Provider
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;
  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Se conectează...</div>;
  
  // Wrapper for actions that require local routing state change
  const deleteShiftWithRouting = (tableName, shiftId, message) => {
      // Pass a callback to the provider's requestDelete to handle local routing logic
      requestDelete(tableName, shiftId, message, () => {
        if (tableName === 'shifts' && activeShiftId === shiftId) {
          setView('dashboard');
          setActiveShiftId(null);
        }
      });
  };
  
  const handleCreateShiftAndRoute = (jobId) => {
    // Pass a callback to the provider's handleCreateShift to handle local routing logic
    handleCreateShift(jobId, (newShiftId) => {
      setActiveShiftId(newShiftId);
      setView('shift-detail');
    });
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-lg mx-auto min-h-screen relative bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100">
        <div className="p-6 animate-fade-in"> 
          
          {view === 'dashboard' && 
            <div className="animate-slide-up">
              <Dashboard 
                setActiveShiftId={setActiveShiftId} 
                setView={setView} 
                handleCreateShift={handleCreateShiftAndRoute} 
                requestDelete={deleteShiftWithRouting} // Use the new wrapper
                // All data props (shifts, user, userName, jobs) are removed, Dashboard uses useWorkforce()
              />
            </div>
          }
          
          {view === 'manage' && 
            <div className="animate-slide-up">
              {/* Note: ManageView props should be refactored to use useWorkforce() internally too */}
              <ManageView 
                employees={employees} jobs={jobs} materials={materials}
                setEmployees={()=>{}} setJobs={()=>{}} setMaterials={()=>{}} // Placeholder: should be refactored
                showToast={useWorkforce().showToast} requestDelete={deleteShiftWithRouting}
                shifts={shifts}
              />
            </div>
          }
          
          {view === 'shifts' && 
            <div className="animate-slide-up">
              <ReportsView shifts={shifts} setActiveShiftId={setActiveShiftId} setView={setView} />
            </div>
          }
          
          {isShiftDetailView && 
            <div className="animate-slide-in-right">
              <ShiftDetailView 
                shift={activeShift} 
                activeShiftId={activeShiftId} 
                setView={setView} 
                requestDelete={deleteShiftWithRouting}
                employees={employees} materials={materials} 
                updateShiftLocally={updateShiftLocally}
                showToast={useWorkforce().showToast} user={user} userName={useWorkforce().userName} fetchData={fetchData}
              />
            </div>
          }
        </div>
        {view !== 'shift-detail' && <MobileNav currentView={view} setView={setView} />}
      </div>
    </div>
  );
}

// Main exported App component
export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <WorkforceProvider>
      {showWelcome && <WelcomeScreen onFinished={() => setShowWelcome(false)} />}
      {!showWelcome && <AppContent />}
    </WorkforceProvider>
  );
}