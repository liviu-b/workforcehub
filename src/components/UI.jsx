import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle, X, Trash2, Save } from 'lucide-react';

// --- Card Component ---
export const Card = ({ children, className = "", onClick, noPadding = false, active = false }) => (
  <div 
    onClick={onClick}
    className={`
      relative bg-white transition-all duration-200 ease-out
      ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md hover:border-indigo-200' : ''} 
      ${noPadding ? '' : 'p-5'} 
      ${active ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border border-slate-100 shadow-sm'}
      rounded-2xl ${className}
    `}
  >
    {children}
  </div>
);

// --- Button Component ---
export const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled, fullWidth = false }) => {
  const baseStyle = "relative rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 border border-transparent",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border border-transparent",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200",
    ghost: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 bg-white",
    subtle: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
    icon: "p-3"
  };

  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

// --- Input Component ---
export const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", className = "", icon: Icon, autoFocus }) => (
  <div className="relative flex-1 group">
    {Icon && (
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
    )}
    <input
      type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} autoFocus={autoFocus}
      className={`w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-3.5 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 ${className}`}
    />
  </div>
);

// --- Select Component ---
export const Select = ({ value, onChange, options, className = "" }) => (
  <div className="relative">
    <select value={value} onChange={onChange}
      className={`w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-3.5 px-4 appearance-none text-base font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 cursor-pointer ${className}`}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <ChevronRight size={16} className="rotate-90" />
    </div>
  </div>
);

// --- Toast Component ---
export const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  
  return (
    <div className={`fixed top-6 left-4 right-4 mx-auto max-w-sm ${isSuccess ? 'bg-slate-900/95 text-white' : 'bg-rose-500 text-white'} backdrop-blur-md px-4 py-4 rounded-2xl z-[70] flex items-center gap-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-5 fade-in duration-300 border border-white/10`}>
      <div className={`p-2 rounded-full ${isSuccess ? 'bg-emerald-500/20' : 'bg-white/20'}`}>
        {isSuccess ? <CheckCircle size={20} className="text-emerald-400" /> : <X size={20} />}
      </div>
      <span className="text-sm font-semibold flex-1">{message}</span>
      <button onClick={onClose}><X size={16} className="opacity-70 hover:opacity-100" /></button>
    </div>
  );
};

// --- ConfirmModal Component ---
export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/10">
        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={28} className="text-rose-500" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 text-center">Ești sigur?</h3>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed text-center">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancel}>Anulează</Button>
          <Button variant="danger" onClick={onConfirm}>Șterge</Button>
        </div>
      </div>
    </div>
  );
};

// --- AutoSaveTextarea Component ---
export const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);
   
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) setLocalValue(value || '');
  }, [value]);

  const handleBlur = async () => {
    if (localValue !== value) {
      setIsSaving(true);
      await onSave(localValue);
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group">
      <textarea
        ref={textareaRef} disabled={disabled} value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur}
        className="w-full p-4 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-base min-h-[140px] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
        placeholder={placeholder}
      />
      {isSaving && (
        <div className="absolute bottom-4 right-4 text-xs font-bold text-indigo-600 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
          <Save size={12} className="animate-pulse" />
        </div>
      )}
    </div>
  );
};

// --- Spinner Component ---
export const Spinner = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="relative flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-indigo-600"></div>
    </div>
  </div>
);