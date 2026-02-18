import React, { useMemo, useState } from 'react';
import { Clock3, Download } from 'lucide-react';
import { Card, Button } from '../components/UI';

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseHours = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function TimesheetView({ shifts, employees }) {
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));

  const rows = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    const filtered = shifts.filter((shift) => {
      const d = new Date(shift.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    return employees.map((employee) => {
      let totalHours = 0;
      let workedDays = 0;
      let entries = 0;

      filtered.forEach((shift) => {
        const employeeHours = shift.employeeHours || {};
        if (employeeHours[employee.id] !== undefined) {
          totalHours += parseHours(employeeHours[employee.id]);
          workedDays += 1;
          entries += 1;
        }
      });

      return {
        employeeId: employee.id,
        name: employee.name,
        totalHours,
        workedDays,
        entries,
        avgHours: workedDays > 0 ? totalHours / workedDays : 0,
      };
    });
  }, [selectedMonth, shifts, employees]);

  const exportCsv = () => {
    const header = ['Angajat', 'Ore totale', 'Zile lucrate', 'Intrari', 'Medie ore/zi'];
    const lines = rows.map((row) => [
      row.name,
      row.totalHours.toFixed(2),
      String(row.workedDays),
      String(row.entries),
      row.avgHours.toFixed(2),
    ]);

    const csv = [header, ...lines].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalHours = rows.reduce((acc, row) => acc + row.totalHours, 0);

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock3 size={14} /> Pontaj & Ore
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timesheet <span className="text-slate-600">Lunar</span></h1>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-11 px-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
          />
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600 font-semibold">Total ore: <span className="text-slate-900">{totalHours.toFixed(2)}</span></p>
            <Button variant="outline" onClick={exportCsv} icon={Download}>CSV</Button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="py-3">Angajat</th>
                <th className="py-3">Ore totale</th>
                <th className="py-3">Zile lucrate</th>
                <th className="py-3">Intrări</th>
                <th className="py-3">Medie/zi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employeeId} className="border-b border-slate-100">
                  <td className="py-3 font-semibold text-slate-800">{row.name}</td>
                  <td className="py-3">{row.totalHours.toFixed(2)}</td>
                  <td className="py-3">{row.workedDays}</td>
                  <td className="py-3">{row.entries}</td>
                  <td className="py-3">{row.avgHours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-2">
          {rows.map((row) => (
            <div key={row.employeeId} className="border border-slate-200 rounded-xl p-3">
              <p className="font-semibold text-slate-800">{row.name}</p>
              <p className="text-xs text-slate-500 mt-1">Ore: {row.totalHours.toFixed(2)} · Zile: {row.workedDays} · Medie: {row.avgHours.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
