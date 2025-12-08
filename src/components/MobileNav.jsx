import React from 'react';
import { LayoutGrid, ClipboardCheck, Settings } from 'lucide-react'; // Am schimbat Briefcase cu Settings pentru Admin

export const MobileNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Azi' },
    { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
    { id: 'manage', icon: Settings, label: 'Admin' }, // Iconita Settings e mai potrivita
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-90 group`}
            >
              {/* Indicator de glow cand e activ */}
              {isActive && (
                <div className="absolute top-1 w-12 h-12 bg-indigo-500/10 rounded-full blur-md animate-pulse" />
              )}
              
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 -translate-y-1 shadow-sm' 
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${
                isActive ? 'text-indigo-600 opacity-100' : 'text-slate-400 opacity-60 scale-90'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};