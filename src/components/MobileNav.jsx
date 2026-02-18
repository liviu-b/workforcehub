import React from 'react';
import { LayoutGrid, ClipboardCheck, Settings } from 'lucide-react'; // Am schimbat Briefcase cu Settings pentru Admin

export const MobileNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Azi' },
    { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
    { id: 'manage', icon: Settings, label: 'Admin' }, // Iconita Settings e mai potrivita
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 group"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-500 group-hover:text-slate-700'
              }`}>
                <item.icon size={22} strokeWidth={2.2} />
              </div>
              
              <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${
                isActive ? 'text-slate-900 opacity-100' : 'text-slate-400 opacity-80'
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