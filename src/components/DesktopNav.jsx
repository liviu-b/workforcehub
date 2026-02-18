import React from 'react';
import { LayoutGrid, ClipboardCheck, Settings, CalendarDays, Clock3 } from 'lucide-react';

const items = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'timesheet', icon: Clock3, label: 'Timesheet' },
  { id: 'shifts', icon: ClipboardCheck, label: 'Rapoarte' },
  { id: 'manage', icon: Settings, label: 'Administrare' },
];

export const DesktopNav = ({ currentView, setView }) => {
  return (
    <aside className="hidden lg:flex flex-col border-r border-slate-200 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 min-h-screen p-5">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">WorkforceHub</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">Control Center</h2>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <Icon size={18} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
