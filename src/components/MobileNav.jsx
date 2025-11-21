import React from 'react';
import { LayoutGrid, ClipboardCheck, Briefcase } from 'lucide-react';

export const MobileNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Home' },
    { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
    { id: 'manage', icon: Briefcase, label: 'Admin' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-1.5 max-w-sm mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                relative flex items-center justify-center w-full py-3 rounded-xl transition-all duration-300
                ${isActive ? 'text-indigo-600 bg-indigo-50/80 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
              `}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              {isActive && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};