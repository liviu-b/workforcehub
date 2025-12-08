import React from 'react';
import { LayoutGrid, ClipboardCheck, Settings, LogOut, Zap } from 'lucide-react';

export const Layout = ({ children, currentView, setView, user, userName }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
    { id: 'manage', icon: Settings, label: 'Administrare' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">WorkforceHub</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} strokeWidth={2.5} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                {userName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 md:pl-64 w-full max-w-7xl mx-auto">
        <div className="p-4 pb-24 md:p-8 md:pb-8 max-w-5xl mx-auto animate-enter">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 -translate-y-1' : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};