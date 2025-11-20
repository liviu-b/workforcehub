import React from 'react';
import { LayoutGrid, ClipboardCheck, Briefcase } from 'lucide-react';

export const MobileNav = ({ currentView, setView }) => {
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