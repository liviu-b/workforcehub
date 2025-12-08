import React, { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle, X, Trash2 } from 'lucide-react';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const Card = ({ children, className = "", onClick, noPadding = false, hover = false }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden transition-all duration-300",
      hover && "hover:shadow-md hover:border-indigo-200 cursor-pointer hover:-translate-y-0.5",
      !noPadding && "p-5 sm:p-6",
      className
    )}
  >
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled, loading, fullWidth }) => {
  const base = "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-200",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 focus:ring-rose-500",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 focus:ring-emerald-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2.5 aspect-square"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : Icon && <Icon size={18} strokeWidth={2.5} />}
      {!loading && children}
    </button>
  );
};

export const Input = ({ label, error, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">{label}</label>}
    <div className="relative group">
      {props.icon && <props.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />}
      <input
        {...props}
        className={cn(
          "block w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all",
          props.icon ? 'pl-10 pr-4' : 'px-4',
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
          props.className
        )}
      />
    </div>
    {error && <p className="text-xs text-rose-500 mt-1 ml-1">{error}</p>}
  </div>
);

export const Badge = ({ children, variant = 'neutral', className }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    primary: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider", styles[variant], className)}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-enter">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Spinner = () => <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

// Re-export other components (Toast, ConfirmModal, AutoSaveTextarea) keeping their logic but updating classes to match above style...
// (Assuming you keep the logic for Toast/Confirm but update visual classes like rounded-2xl, shadow-sm, etc.)
export const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
  // ... (Keep existing logic, update styles)
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);
  
  useEffect(() => { setLocalValue(value || ''); }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (val !== value) {
        setIsSaving(true);
        await onSave(val);
        setIsSaving(false);
      }
    }, 1000);
  };

  return (
    <div className="relative group">
      <textarea
        disabled={disabled}
        value={localValue}
        onChange={handleChange}
        className="w-full p-4 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm min-h-[120px] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
        placeholder={placeholder}
      />
      {isSaving && <div className="absolute bottom-3 right-3 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md flex gap-1"><Loader2 size={12} className="animate-spin"/> Salvăm...</div>}
    </div>
  );
};