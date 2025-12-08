import React from 'react';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

export const MobileNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'shifts', icon: FileText, label: 'Rapoarte' },
    { id: 'manage', icon: Settings, label: 'Setări' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-1 flex-col items-center justify-center h-full group active:bg-slate-50 transition-colors"
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 group-hover:text-slate-600'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};