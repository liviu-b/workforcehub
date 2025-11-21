import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, X, Trash2, Save } from 'lucide-react';

export const Card = ({ children, className = "", onClick, noPadding = false }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 transition-all ${onClick ? 'cursor-pointer active:scale-[0.99] hover:shadow-md hover:border-blue-100' : ''} ${noPadding ? '' : 'p-5'} ${className}`}
  >
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, size = 'md', disabled }) => {
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

export const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", className = "", icon: Icon, autoFocus }) => (
  <div className="relative flex-1">
    {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl py-3 ${Icon ? 'pl-11' : 'pl-4'} pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${className}`}
    />
  </div>
);

export const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
);

export const Toast = ({ message, type, onClose }) => {
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

export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
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

export const AutoSaveTextarea = ({ value, onSave, disabled, placeholder }) => {
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
        className="w-full p-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl text-base min-h-[120px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
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