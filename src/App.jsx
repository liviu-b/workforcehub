import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  Plus, 
  MapPin, 
  Package, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  X, 
  Trash2, 
  Save, 
  TrendingUp,
  Briefcase,
  LayoutGrid,
  Edit2,
  Download,
} from 'lucide-react';

import { supabase } from './lib/supabaseClient';

// --- Config multi-tenant (păstrat exact ca la Firebase) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const CONSTRUCTION_UNITS = [
  { value: 'buc', label: 'Bucăți' },
  { value: 'kg', label: 'Kilograme' },
  { value: 'm', label: 'Metri' },
  { value: 'mp', label: 'Metri Pătrați' },
  { value: 'mc', label: 'Metri Cubi' },
  { value: 'ml', label: 'Metri Liniari' },
  { value: 'l', label: 'Litri' },
  { value: 'sac', label: 'Saci' },
  { value: 'palet', label: 'Paleți' },
  { value: 'cutie', label: 'Cutii' },
  { value: 'set', label: 'Seturi' },
];

// --- UI Components ---

const Card = ({ children, className = "", onClick, noPadding = false }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 transition-all ${onClick ? 'cursor-pointer active:scale-[0.99] hover:shadow-md hover:border-blue-100' : ''} ${noPadding ? '' : 'p-5'} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled }) => {
  const baseStyle = "rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 border border-blue-600",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border border-red-500",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
    icon: "p-2.5"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", className = "", icon: Icon, autoFocus }) => (
  <div className="relative flex-1">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl py-3 ${Icon ? 'pl-11' : 'pl-4'} pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${className}`}
    />
  </div>
);

const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
);

const MobileNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Azi' },
    { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
    { id: 'manage', icon: Briefcase, label: 'Admin' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-safe pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${
              currentView === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-colors ${currentView === item.id ? 'bg-blue-50' : ''}`}>
              <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] mt-0.5 font-semibold ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const styles = type === 'success' 
    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' 
    : 'bg-red-500 text-white shadow-xl shadow-red-500/30';
  
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 ${styles} px-4 py-3.5 rounded-2xl z-[70] flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 min-w-[320px] max-w-sm border border-white/10`}>
      {type === 'success' ? <CheckCircle size={20} className="text-emerald-100" /> : <X size={20} className="text-red-100" />}
      <span className="text-sm font-semibold flex-1 tracking-wide">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 p-1 hover:bg-white/20 rounded-full transition-all"><X size={16} /></button>
    </div>
  );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-slate-900 text-center">Ești sigur?</h3>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed text-center">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancel}>Anulează</Button>
          <Button variant="danger" onClick={onConfirm}>Șterge</Button>
        </div>
      </div>
    </div>
  );
};

// 5. AutoSave Textarea
const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setLocalValue(value || '');
    }
  }, [value]);

  const handleBlur = async () => {
    if (localValue !== value) {
      setIsSaving(true);
      await onSave(localValue);
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        disabled={disabled}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full p-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
        placeholder={placeholder}
      />
      {isSaving && (
        <div className="absolute bottom-4 right-4 text-xs font-medium text-blue-600 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
          <Save size={12} className="animate-pulse" /> Salvăm...
        </div>
      )}
    </div>
  );
};

// --- Main Application ---

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

  // --- Helpers ---
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp?.seconds) {
      // suport pentru date vechi de tip Firestore
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  const updateShiftLocally = (shiftId, partial) => {
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, ...partial } : s)));
  };

  // --- Auth Supabase (înlocuiește Firebase Auth) ---
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { user: existingUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Auth error (getUser):', error);
        }

        if (!existingUser) {
          // Anonymous login (echivalent cu signInAnonymously din Firebase)
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) {
            console.error('Auth error (anonymous):', signInError);
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

  // --- Data Fetching cu Supabase (înlocuiește onSnapshot Firestore) ---
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
        supabase.from('shifts').select('*').eq('app_id', appId),
        supabase.from('employees').select('*').eq('app_id', appId),
        supabase.from('jobs').select('*').eq('app_id', appId),
        supabase.from('materials').select('*').eq('app_id', appId),
        supabase.from('user_profiles').select('*').eq('app_id', appId).eq('user_id', user.id).maybeSingle(),
      ]);

      if (shiftsError) console.error(shiftsError);
      if (employeesError) console.error(employeesError);
      if (jobsError) console.error(jobsError);
      if (materialsError) console.error(materialsError);
      if (profileError && profileError.code !== 'PGRST116') console.error(profileError); // PGRST116 = not found

      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
      setJobs(jobsData || []);
      setMaterials(materialsData || []);

      if (profileData) {
        setUserName(profileData.name || 'Utilizator');
      } else {
        setUserName('Utilizator');
      }
    } catch (e) {
      console.error(e);
      showToast('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // --- Delete helper folosit de tot (înlocuiește deleteDoc Firestore) ---
  const requestDelete = (tableName, rowId, message) => {
    setConfirmData({
      isOpen: true,
      message: message || 'Această acțiune este ireversibilă.',
      action: async () => {
        try {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .match({ id: rowId, app_id: appId });

          if (error) throw error;

          if (tableName === 'shifts') {
            setShifts(prev => prev.filter(s => s.id !== rowId));
            if (activeShiftId === rowId) {
              setView('dashboard');
              setActiveShiftId(null);
            }
          }
          if (tableName === 'employees') {
            setEmployees(prev => prev.filter(e => e.id !== rowId));
          }
          if (tableName === 'jobs') {
            setJobs(prev => prev.filter(j => j.id !== rowId));
          }
          if (tableName === 'materials') {
            setMaterials(prev => prev.filter(m => m.id !== rowId));
          }

          showToast('Șters cu succes!');
          setConfirmData({ isOpen: false, message: '', action: null });
        } catch (e) {
          console.error(e);
          showToast('Eroare la ștergere', 'error');
        }
      }
    });
  };

  // --- Create shift (înlocuiește addDoc Firestore) ---
  const handleCreateShift = async (jobId) => {
    if (!user) return;
    const job = jobs.find(j => j.id === jobId);
    try {
      const newShift = {
        app_id: appId,
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

      const { data, error } = await supabase
        .from('shifts')
        .insert([newShift])
        .select()
        .single();

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

  // --- PDF Generator (nemodificat, doar sursa de date e Supabase acum) ---
  const generatePDF = (shift) => {
    const printWindow = window.open('', '_blank');
    
    const empList = shift.assignedEmployeeIds?.map(id => {
      const e = employees.find(emp => emp.id === id);
      const h = shift.employeeHours?.[id] ?? 8;
      return e ? { name: e.name, hours: h } : null;
    }).filter(Boolean) || [];

    const matList = shift.materialUsage?.map(u => {
      const m = materials.find(mat => mat.id === u.materialId);
      return m ? { name: m.name, unit: m.unit, quantity: u.quantity } : null;
    }).filter(Boolean) || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raport - ${shift.jobTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
          .meta { color: #64748b; font-size: 14px; margin-top: 5px; }
          .status { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .approved { background: #d1fae5; color: #065f46; }
          .open { background: #f1f5f9; color: #475569; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          .notes { background: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic; font-size: 14px; border: 1px solid #e2e8f0; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
          .signature { text-align: right; }
          .signature strong { display: block; color: #333; font-size: 14px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Raport de Lucru</h1>
            <div class="meta">WorkforceHub • ${formatDate(shift.date)}</div>
          </div>
          <div class="status ${shift.status === 'approved' ? 'approved' : 'open'}">
            ${shift.status === 'approved' ? 'Aprobat Final' : 'Deschis'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detalii Lucrare</div>
          <p><strong>Proiect:</strong> ${shift.jobTitle}</p>
          <p><strong>Progres:</strong> ${shift.progress || 0}%</p>
        </div>

        <div class="section">
          <div class="section-title">Echipă și Ore (${empList.length})</div>
          <table>
            <thead><tr><th>Nume Angajat</th><th>Ore Lucrate</th></tr></thead>
            <tbody>
              ${empList.map(e => `<tr><td>${e.name}</td><td>${e.hours} ore</td></tr>`).join('')}
              ${empList.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:#999">Niciun angajat</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Materiale Consumate (${matList.length})</div>
          <table>
            <thead><tr><th>Material</th><th>Cantitate</th></tr></thead>
            <tbody>
              ${matList.map(m => `<tr><td>${m.name}</td><td>${m.quantity} ${m.unit}</td></tr>`).join('')}
              ${matList.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:#999">Fără materiale</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Note</div>
          <div class="notes">${shift.notes || 'Fără observații.'}</div>
        </div>

        <div class="footer">
          <div>Generat automat din WorkforceHub</div>
          <div class="signature">
             ${shift.status === 'approved' ? `
               Semnat digital de:
               <strong>${shift.approvedByName || 'Utilizator'}</strong>
               <div>${new Date(shift.approvedAt).toLocaleString('ro-RO')}</div>
             ` : 'Nesemnat'}
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- Views ---

  const ManageView = () => {
    const [newEmp, setNewEmp] = useState('');
    const [newJob, setNewJob] = useState('');
    const [newMat, setNewMat] = useState('');
    const [unit, setUnit] = useState('buc');

    const addData = async (tableName, data, resetFn) => {
      if (!data.name && !data.title) return;
      try {
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert([{ ...data, app_id: appId }])
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
  };

  const ShiftDetailView = () => {
    const shift = shifts.find(s => s.id === activeShiftId);
    if (!shift) return <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-2"><Briefcase size={40} className="opacity-20"/> Raportul nu a fost găsit.</div>;

    const isApproved = shift.status === 'approved';

    const updateShift = async (field, value) => {
      const partial = { [field]: value };
      updateShiftLocally(activeShiftId, partial);
      const { error } = await supabase
        .from('shifts')
        .update(partial)
        .match({ id: activeShiftId, app_id: appId });
      if (error) {
        console.error(error);
        showToast('Eroare la salvare', 'error');
        fetchData(); // re-sync dacă a eșuat
      }
    };

    const toggleEmployee = async (empId) => {
      const currentIds = shift.assignedEmployeeIds || [];
      const currentHours = shift.employeeHours || {};
      let newIds = [...currentIds], newHours = {...currentHours};
      
      if (currentIds.includes(empId)) {
        newIds = newIds.filter(id => id !== empId);
        delete newHours[empId];
      } else {
        newIds.push(empId);
        newHours[empId] = 8;
      }

      const partial = { assignedEmployeeIds: newIds, employeeHours: newHours };
      updateShiftLocally(activeShiftId, partial);
      const { error } = await supabase
        .from('shifts')
        .update(partial)
        .match({ id: activeShiftId, app_id: appId });
      if (error) {
        console.error(error);
        showToast('Eroare la salvare', 'error');
        fetchData();
      }
    };

    const addMaterial = async (matId, qty) => {
      if (!matId || qty <= 0) return;
      const current = shift.materialUsage || [];
      const idx = current.findIndex(m => m.materialId === matId);
      const updated = [...current];
      if (idx >= 0) updated[idx].quantity = Number(updated[idx].quantity) + Number(qty);
      else updated.push({ materialId: matId, quantity: Number(qty) });

      const partial = { materialUsage: updated };
      updateShiftLocally(activeShiftId, partial);
      const { error } = await supabase
        .from('shifts')
        .update(partial)
        .match({ id: activeShiftId, app_id: appId });
      if (error) {
        console.error(error);
        showToast('Eroare la salvare', 'error');
        fetchData();
      } else {
        showToast('Material adăugat');
      }
    };

    const approveShift = async () => {
      const nowIso = new Date().toISOString();
      const partial = {
        status: 'approved',
        approvedAt: nowIso,
        approvedBy: user.id,
        approvedByName: userName
      };
      updateShiftLocally(activeShiftId, partial);
      const { error } = await supabase
        .from('shifts')
        .update(partial)
        .match({ id: activeShiftId, app_id: appId });
      if (error) {
        console.error(error);
        showToast('Eroare la aprobare', 'error');
        fetchData();
      } else {
        showToast('Raport aprobat!');
      }
    };

    return (
      <div className="pb-24 animate-in slide-in-from-right-5 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 -mx-6 mb-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
             <button onClick={() => setView('dashboard')} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600 border border-transparent hover:border-slate-200">
               <ChevronRight className="rotate-180" size={20} strokeWidth={2.5} />
             </button>
             <div>
               <h2 className="font-bold text-slate-900 leading-tight text-lg">{shift.jobTitle}</h2>
               <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock size={10} /> {formatDate(shift.date)}</span>
             </div>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => generatePDF(shift)}><Download size={16} /></Button>
             {isApproved && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-200 tracking-wide flex items-center">APROBAT</span>}
             <Button variant="danger" size="icon" className="h-9 w-9" onClick={() => requestDelete('shifts', shift.id, 'Ștergi raportul?')}><Trash2 size={16} /></Button>
           </div>
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
              <TrendingUp size={18} className="text-purple-500" /> Progres Lucrare
            </h3>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input 
                type="range" min="0" max="100" step="5" disabled={isApproved}
                value={shift.progress || 0}
                onChange={(e) => updateShift('progress', Number(e.target.value))}
                className="flex-1 h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 transition-all"
              />
              <span className="font-bold text-2xl w-16 text-right text-purple-600">{shift.progress || 0}%</span>
            </div>
          </Card>

          {/* Team */}
          <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Users size={18} className="text-blue-500" /> Echipă & Ore
            </h3>
            {!isApproved && (
              <div className="flex flex-wrap gap-2 mb-6">
                {employees.map(emp => (
                  <button
                    key={emp.id} onClick={() => toggleEmployee(emp.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
                      shift.assignedEmployeeIds?.includes(emp.id)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            )}
            <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-100">
              {shift.assignedEmployeeIds?.map(id => {
                 const emp = employees.find(e => e.id === id);
                 return (
                   <div key={id} className="flex justify-between items-center p-4">
                     <span className="font-semibold text-slate-700">{emp?.name}</span>
                     <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
                       <input 
                         type="number" min="0" max="24"
                         value={shift.employeeHours?.[id] ?? 8}
                         disabled={isApproved}
                         onChange={(e) => updateShift('employeeHours', { ...shift.employeeHours, [id]: e.target.value })}
                         className="w-10 text-center bg-transparent text-sm font-bold outline-none text-slate-900"
                       />
                       <span className="text-[10px] font-bold text-slate-400 pr-2 uppercase">ore</span>
                     </div>
                   </div>
                 );
              })}
              {(!shift.assignedEmployeeIds || shift.assignedEmployeeIds.length === 0) && <div className="text-center py-8 text-slate-400 text-sm italic">Selectează angajații prezenți din lista de mai sus.</div>}
            </div>
          </Card>

          {/* Materials */}
          <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Package size={18} className="text-emerald-500" /> Materiale
            </h3>
            {!isApproved && (
              <div className="flex gap-3 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <select id="matSelect" className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none border-none cursor-pointer">
                  <option value="">Selectează material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <div className="w-px bg-slate-200 my-1"></div>
                <input 
                  id="matQty" type="number" placeholder="0" 
                  className="w-16 bg-transparent text-sm font-bold text-center outline-none text-slate-900"
                  onKeyDown={(e) => e.key === 'Enter' && addMaterial(document.getElementById('matSelect').value, e.target.value)}
                />
                <Button size="sm" variant="success" icon={Plus} onClick={() => {
                  const s = document.getElementById('matSelect'), i = document.getElementById('matQty');
                  addMaterial(s.value, i.value);
                  i.value = '';
                }} />
              </div>
            )}
            <div className="space-y-2">
              {shift.materialUsage?.map((u, idx) => {
                const mat = materials.find(m => m.id === u.materialId);
                return (
                  <div key={idx} className="flex justify-between items-center px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <span className="text-slate-700 text-sm font-medium">{mat?.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900 text-sm bg-slate-100 px-2 py-1 rounded">{u.quantity} {mat?.unit}</span>
                      {!isApproved && <button onClick={() => updateShift('materialUsage', shift.materialUsage.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16}/></button>}
                    </div>
                  </div>
                );
              })}
              {(!shift.materialUsage?.length) && <div className="text-center py-8 text-slate-400 text-sm italic">Fără consumuri înregistrate.</div>}
            </div>
          </Card>

          {/* Notes */}
          <Card className={isApproved ? 'opacity-75 grayscale-[0.5]' : ''}>
            <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Note</h3>
            <AutoSaveTextarea 
              disabled={isApproved}
              value={shift.notes}
              onSave={(val) => updateShift('notes', val)}
              placeholder="Scrie aici observații, probleme întâmpinate sau starea vremii..."
            />
          </Card>

          {/* Footer Action */}
          {!isApproved ? (
            <Button variant="success" size="lg" className="w-full py-4 text-lg shadow-emerald-500/30 hover:shadow-emerald-500/50" onClick={approveShift}>
              <ClipboardCheck size={24} /> Aprobă & Semnează
            </Button>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 text-center shadow-inner">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <p className="font-bold text-emerald-800 text-lg">Raport Finalizat</p>
              <div className="text-sm text-emerald-600 font-medium mt-2 bg-white/50 inline-block px-3 py-1 rounded-lg border border-emerald-100">
                 Semnat de: {shift.approvedByName || 'Utilizator'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);

    const todayStr = new Date().toLocaleDateString('ro-RO');
    const todaysShifts = shifts.filter(s => {
      const d = s.date?.seconds ? new Date(s.date.seconds * 1000) : new Date(s.date);
      return d.toLocaleDateString('ro-RO') === todayStr;
    });

    const saveName = async () => {
       if (tempName.trim()) {
         try {
           await supabase
             .from('user_profiles')
             .upsert(
               {
                 app_id: appId,
                 user_id: user.id,
                 name: tempName.trim()
               },
               { onConflict: 'app_id,user_id' }
             );
           setUserName(tempName.trim());
         } catch (e) {
           console.error(e);
           showToast('Eroare la salvarea numelui', 'error');
         }
       }
       setIsEditingName(false);
    };

    return (
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 -mx-6 -mt-6 p-8 pb-12 rounded-b-[2.5rem] text-white shadow-xl shadow-blue-900/20">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
                WorkforceHub • {new Date().toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex items-center gap-3">
                {isEditingName ? (
                  <div className="flex gap-2 items-center bg-white/10 p-1 rounded-lg backdrop-blur-md">
                    <input 
                      value={tempName} 
                      onChange={e => setTempName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveName()}
                      autoFocus
                      className="bg-transparent border-none outline-none text-white placeholder-white/50 font-bold text-2xl w-full min-w-[150px] px-2"
                    />
                    <button onClick={saveName} className="bg-white text-blue-600 p-1 rounded hover:bg-blue-50"><CheckCircle size={20}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                     <h1 className="text-3xl font-extrabold tracking-tight">Salut, {userName}!</h1>
                     <button onClick={() => { setTempName(userName); setIsEditingName(true); }} className="text-blue-200 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-all opacity-50 group-hover:opacity-100">
                       <Edit2 size={18} />
                     </button>
                  </div>
                )}
              </div>
            </div>
            <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner border border-white/10">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="-mt-16 px-2">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="border-none shadow-lg shadow-blue-900/5" noPadding>
              <div className="p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-blue-50 opacity-50"><Briefcase size={80} /></div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Lucrări Azi</p>
                <p className="text-4xl font-black text-slate-800">{todaysShifts.length}</p>
              </div>
            </Card>
            <Card className="border-none shadow-lg shadow-blue-900/5" noPadding>
              <div className="p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50"><Users size={80} /></div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Muncitori</p>
                <p className="text-4xl font-black text-slate-800">
                  {todaysShifts.reduce((acc, s) => acc + (s.assignedEmployeeIds?.length || 0), 0)}
                </p>
              </div>
            </Card>
          </div>

          {/* Active Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pl-1">
              <Clock size={20} className="text-blue-600" /> Activitate Curentă
            </h2>
            
            {todaysShifts.length === 0 ? (
               <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-slate-400"/>
                 </div>
                 <p className="text-slate-400 font-medium">Nu există rapoarte deschise azi.</p>
                 <p className="text-xs text-slate-400 mt-1">Pornește o lucrare nouă mai jos.</p>
               </div>
            ) : (
              <div className="grid gap-3">
                {todaysShifts.map(s => (
                  <Card 
                    key={s.id} 
                    onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
                    className="flex items-center gap-4 group hover:border-blue-300 transition-all"
                  >
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                       s.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-orange-100 text-orange-600'
                     }`}>
                        {s.status === 'approved' ? <CheckCircle size={24} strokeWidth={2.5}/> : <Clock size={24} strokeWidth={2.5}/>}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-slate-900 truncate text-base">{s.jobTitle}</h4>
                       <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                          <span className="flex items-center gap-1"><Users size={12}/> {s.assignedEmployeeIds?.length || 0}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                          <span className={s.progress > 0 ? 'text-purple-600 font-bold' : ''}>{s.progress || 0}% gata</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); requestDelete('shifts', s.id, 'Ștergi raportul?'); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                       >
                         <Trash2 size={18} />
                       </Button>
                       <ChevronRight size={20} className="text-slate-300" strokeWidth={2.5} />
                     </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Start Job */}
          <div className="space-y-4 mt-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pl-1">
              <Plus size={20} className="text-blue-600" /> Pornește Lucrare Nouă
            </h2>
            <div className="grid gap-3">
               {jobs.length === 0 && <div className="text-sm text-slate-500 bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">Nu ai definit lucrări.<br/>Mergi la <span className="font-bold">Admin</span> pentru a adăuga șantiere.</div>}
               {jobs.map(job => (
                 <button
                   key={job.id}
                   onClick={() => handleCreateShift(job.id)}
                   className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl transition-all group text-left"
                 >
                   <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{job.title}</span>
                   <div className="bg-slate-50 group-hover:bg-blue-600 p-2.5 rounded-xl transition-all shadow-sm">
                     <Plus size={18} className="text-slate-400 group-hover:text-white transition-colors" strokeWidth={3} />
                   </div>
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReportsView = () => {
    const sorted = [...shifts].sort((a, b) => (a.date > b.date ? -1 : 1));

    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-xl"><ClipboardCheck size={24} className="text-purple-600"/></div>
          <h2 className="text-2xl font-bold text-slate-900">Istoric Rapoarte</h2>
        </div>
        
        <div className="grid gap-4">
          {sorted.length === 0 && (
             <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <ClipboardCheck size={48} className="text-slate-300 mx-auto mb-4"/>
                <p className="text-slate-400 font-medium">Nu există istoric.</p>
             </div>
          )}
          {sorted.map(s => (
             <Card 
              key={s.id} 
              onClick={() => { setActiveShiftId(s.id); setView('shift-detail'); }}
              className="flex items-center gap-4 hover:border-blue-400 transition-all group"
             >
                <div className="flex-1">
                   <h4 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors">{s.jobTitle}</h4>
                   <div className="flex gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{formatDate(s.date)}</span>
                      {s.progress > 0 && <span className="text-purple-600 flex items-center bg-purple-50 px-2 py-1 rounded-md"><TrendingUp size={10} className="mr-1"/> {s.progress}%</span>}
                   </div>
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                  s.status === 'approved' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.status === 'approved' ? 'FINAL' : 'DESCHIS'}
                </span>
             </Card>
          ))}
        </div>
      </div>
    );
  };

  // --- Layout & Render ---
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;
  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Se conectează...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      <ConfirmModal isOpen={confirmData.isOpen} message={confirmData.message} onConfirm={confirmData.action} onCancel={() => setConfirmData({ isOpen: false, message: '', action: null })} />
      
      <div className="max-w-lg mx-auto min-h-screen relative bg-white shadow-2xl shadow-slate-200/50 sm:border-x sm:border-slate-100">
        <div className="p-6">
          {view === 'dashboard' && <Dashboard />}
          {view === 'manage' && <ManageView />}
          {view === 'shifts' && <ReportsView />}
          {view === 'shift-detail' && <ShiftDetailView />}
        </div>
        {view !== 'shift-detail' && <MobileNav currentView={view} setView={setView} />}
      </div>
    </div>
  );
}
