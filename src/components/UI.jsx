import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, X, Trash2, Save, Loader2 } from 'lucide-react';

// Helper for conditional classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

export const Card = ({ children, className = "", onClick, noPadding = false }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden",
      onClick && "cursor-pointer hover:shadow-md hover:border-slate-300",
      !noPadding && "p-5 sm:p-6",
      className
    )}
  >
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled, loading }) => {
  const baseStyle = "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400 border border-transparent",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 border border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 border border-transparent",
    ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-300"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
    icon: "p-2.5 aspect-square"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={cn(baseStyle, variants[variant], sizes[size], className)}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />}
      {!loading && children}
    </button>
  );
};

export const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", className = "", icon: Icon, autoFocus }) => (
  <div className="relative w-full flex-1 group min-w-0">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={18} />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={cn(
        "block w-full h-12 appearance-none bg-white border border-slate-300 rounded-xl py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200",
        "focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10",
        Icon ? 'pl-11 pr-4' : 'px-4',
        className
      )}
    />
  </div>
);

export const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="w-10 h-10 text-slate-700 animate-spin" />
  </div>
);

export const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const styles = type === 'success' 
    ? 'bg-emerald-600 text-white' 
    : 'bg-rose-600 text-white';
  
  return (
    <div className={cn("fixed top-6 left-1/2 -translate-x-1/2 px-5 py-4 rounded-2xl z-[70] flex items-center gap-3 animate-fade-in shadow-lg min-w-[320px]", styles)}>
      {type === 'success' ? <CheckCircle size={22} className="shrink-0" /> : <X size={22} className="shrink-0" />}
      <span className="text-sm font-semibold flex-1 tracking-wide leading-tight">{message}</span>
      <button onClick={onClose} className="opacity-80 hover:opacity-100 p-1 hover:bg-white/20 rounded-full transition-all"><X size={18} /></button>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-[2px] z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl scale-100">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Trash2 size={26} className="text-rose-700" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 text-center">Ești sigur?</h3>
        <p className="text-slate-500 mb-8 text-center leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancel}>Nu, anulează</Button>
          <Button variant="danger" onClick={onConfirm}>Da, șterge</Button>
        </div>
      </div>
    </div>
  );
};

export const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
     setLocalValue(value || ''); 
  }, [value]);

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
    }, 1000); // Debounce auto-save
  };

  return (
    <div className="relative group">
      <textarea
        disabled={disabled}
        value={localValue}
        onChange={handleChange}
        className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-base min-h-[140px] focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
        placeholder={placeholder}
      />
      {isSaving && (
        <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
          <Loader2 size={12} className="animate-spin" /> Salvăm...
        </div>
      )}
    </div>
  );
};