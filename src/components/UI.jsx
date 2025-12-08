import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- CARD COMPONENT ---
export const Card = ({ children, className = "", onClick, noPadding = false, footer }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden",
      onClick && "cursor-pointer hover:border-indigo-300 hover:shadow-md active:bg-slate-50",
      className
    )}
  >
    <div className={cn(!noPadding && "p-5")}>
      {children}
    </div>
    {footer && (
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-sm">
        {footer}
      </div>
    )}
  </div>
);

// --- BUTTON COMPONENT ---
export const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled, loading, fullWidth }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-200 shadow-sm",
    danger: "bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 focus:ring-rose-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    link: "text-indigo-600 hover:underline px-0 py-0 h-auto",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2 aspect-square"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={cn(baseStyle, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};

// --- INPUT COMPONENT ---
export const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", className = "", icon: Icon, label, error, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "block w-full h-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all",
          "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
          "disabled:bg-slate-50 disabled:text-slate-500",
          Icon ? 'pl-10 pr-4' : 'px-4',
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
  </div>
);

// --- SPINNER ---
export const Spinner = () => (
  <div className="flex justify-center items-center p-8">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
  </div>
);

// --- TOAST NOTIFICATION ---
export const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  
  const isError = type === 'error';
  
  return (
    <div className={cn(
      "fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md z-[100] min-w-[320px] animate-fade-in",
      isError ? "bg-white/95 border-rose-100 text-rose-700" : "bg-white/95 border-emerald-100 text-slate-700"
    )}>
      {isError ? <AlertCircle size={20} className="text-rose-500 shrink-0" /> : <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
    </div>
  );
};

// --- MODAL ---
export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, title = "Confirmare" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slide-up">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Anulează</Button>
          <Button variant="danger" onClick={onConfirm}>Confirmă</Button>
        </div>
      </div>
    </div>
  );
};

// --- AUTOSAVE TEXTAREA ---
export const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [status, setStatus] = useState('idle'); // idle, saving, saved
  const timeoutRef = useRef(null);
  
  useEffect(() => { setLocalValue(value || ''); }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    setStatus('typing');
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (val !== value) {
        setStatus('saving');
        await onSave(val);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1000);
  };

  return (
    <div className="relative group">
      <textarea
        disabled={disabled}
        value={localValue}
        onChange={handleChange}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[120px] focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
        placeholder={placeholder}
      />
      <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400 transition-opacity duration-300">
        {status === 'saving' && <span className="flex items-center gap-1 text-indigo-600"><Loader2 size={10} className="animate-spin"/> Se salvează...</span>}
        {status === 'saved' && <span className="text-emerald-600">Salvat</span>}
      </div>
    </div>
  );
};