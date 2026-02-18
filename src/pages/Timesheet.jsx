import React, { useMemo, useState } from 'react';
import { Clock3, Download } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { apiClient } from '../lib/apiClient';

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseHours = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function TimesheetView({ shifts, employees, updateShiftLocally, fetchData, showToast }) {
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [savingKey, setSavingKey] = useState('');
  const [bulkDraft, setBulkDraft] = useState({});
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const monthShifts = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    return shifts.filter((shift) => {
      const d = new Date(shift.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [selectedMonth, shifts]);

  const rows = useMemo(() => {
    const filtered = monthShifts;

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
  }, [monthShifts, employees]);

  const entries = useMemo(() => {
    const list = [];
    monthShifts.forEach((shift) => {
      const hoursMap = shift.employeeHours || {};
      Object.entries(hoursMap).forEach(([employeeId, hours]) => {
        const employee = employees.find((emp) => emp.id === employeeId);
        list.push({
          key: `${shift.id}-${employeeId}`,
          shiftId: shift.id,
          employeeId,
          date: shift.date,
          jobTitle: shift.jobTitle,
          employeeName: employee?.name || 'N/A',
          hours: parseHours(hours),
        });
      });
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [monthShifts, employees]);

  const handleHoursChange = (entry, value) => {
    const normalized = Math.max(0, parseHours(value));
    const shift = shifts.find((item) => item.id === entry.shiftId);
    if (!shift) return;

    const updatedHours = { ...(shift.employeeHours || {}), [entry.employeeId]: normalized };
    updateShiftLocally(entry.shiftId, { employeeHours: updatedHours });
  };

  const saveHours = async (entry, value) => {
    const normalized = Math.max(0, parseHours(value));
    const shift = shifts.find((item) => item.id === entry.shiftId);
    if (!shift) return;

    const updatedHours = { ...(shift.employeeHours || {}), [entry.employeeId]: normalized };
    const key = `${entry.shiftId}-${entry.employeeId}`;
    setSavingKey(key);
    try {
      await apiClient.updateRecord('shifts', entry.shiftId, { employeeHours: updatedHours });
      showToast('Pontaj salvat');
    } catch (error) {
      console.error(error);
      showToast('Eroare la salvare pontaj', 'error');
    } finally {
      setSavingKey('');
    }
  };

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

  const hasBulkChanges = rows.some((row) => {
    if (!Object.prototype.hasOwnProperty.call(bulkDraft, row.employeeId)) return false;
    return Math.abs(parseHours(bulkDraft[row.employeeId]) - row.totalHours) > 0.01;
  });

  const handleBulkChange = (employeeId, value) => {
    setBulkDraft((prev) => ({ ...prev, [employeeId]: value }));
  };

  const resetBulkDraft = () => {
    setBulkDraft({});
    showToast('Modificările au fost anulate');
  };

  const saveBulkChanges = async () => {
    if (!hasBulkChanges) return;

    const shiftUpdates = {};

    rows.forEach((row) => {
      if (!Object.prototype.hasOwnProperty.call(bulkDraft, row.employeeId)) return;

      const targetTotal = Math.max(0, parseHours(bulkDraft[row.employeeId]));
      const delta = targetTotal - row.totalHours;
      if (Math.abs(delta) < 0.01) return;

      const employeeEntries = entries
        .filter((entry) => entry.employeeId === row.employeeId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (employeeEntries.length === 0) return;

      const latestEntry = employeeEntries[0];
      const latestShift = shifts.find((shift) => shift.id === latestEntry.shiftId);
      if (!latestShift) return;

      if (!shiftUpdates[latestEntry.shiftId]) {
        shiftUpdates[latestEntry.shiftId] = { ...(latestShift.employeeHours || {}) };
      }

      const currentValue = parseHours(shiftUpdates[latestEntry.shiftId][row.employeeId]);
      shiftUpdates[latestEntry.shiftId][row.employeeId] = Math.max(0, Number((currentValue + delta).toFixed(2)));
    });

    const payload = Object.entries(shiftUpdates);
    if (payload.length === 0) {
      showToast('Nu există modificări valide pentru salvare', 'error');
      return;
    }

    setIsBulkSaving(true);
    try {
      await Promise.all(payload.map(async ([shiftId, employeeHours]) => {
        updateShiftLocally(shiftId, { employeeHours });
        await apiClient.updateRecord('shifts', shiftId, { employeeHours });
      }));
      setBulkDraft({});
      showToast('Pontaj lunar salvat pe lot');
      await fetchData();
    } catch (error) {
      console.error(error);
      showToast('Eroare la salvarea pe lot', 'error');
      await fetchData();
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2">
      <div className="flex justify-between items-start px-1">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock3 size={14} /> Pontaj & Ore
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timesheet <span className="text-indigo-700">Lunar</span></h1>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-11 px-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400"
          />
          <div className="flex items-center gap-2">
            <p className="text-sm text-indigo-700 font-semibold">Total ore: <span className="text-slate-900">{totalHours.toFixed(2)}</span></p>
            <Button variant="outline" onClick={exportCsv} icon={Download}>CSV</Button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-indigo-100 text-indigo-600 uppercase text-xs tracking-wider">
                <th className="py-3">Angajat</th>
                <th className="py-3">Ore totale (editabil)</th>
                <th className="py-3">Zile lucrate</th>
                <th className="py-3">Intrări</th>
                <th className="py-3">Medie/zi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employeeId} className="border-b border-indigo-50">
                  <td className="py-3 font-semibold text-slate-800">{row.name}</td>
                  <td className="py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={Object.prototype.hasOwnProperty.call(bulkDraft, row.employeeId) ? bulkDraft[row.employeeId] : row.totalHours.toFixed(2)}
                      onChange={(e) => handleBulkChange(row.employeeId, e.target.value)}
                      className="w-28 h-9 px-2 border border-indigo-200 rounded-lg text-right focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400"
                    />
                  </td>
                  <td className="py-3">{row.workedDays}</td>
                  <td className="py-3">{row.entries}</td>
                  <td className="py-3">{row.avgHours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hidden md:flex items-center justify-end gap-2 mt-3">
          <Button variant="outline" onClick={resetBulkDraft} disabled={!hasBulkChanges || isBulkSaving}>Undo</Button>
          <Button onClick={saveBulkChanges} disabled={!hasBulkChanges || isBulkSaving} loading={isBulkSaving}>Salvează pe lot</Button>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-indigo-700 mb-3">Editare inline pontaj</h3>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-indigo-100 text-indigo-600 uppercase text-xs tracking-wider">
                  <th className="py-3">Data</th>
                  <th className="py-3">Lucrare</th>
                  <th className="py-3">Angajat</th>
                  <th className="py-3">Ore</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.key} className="border-b border-indigo-50">
                    <td className="py-2.5">{new Date(entry.date).toLocaleDateString('ro-RO')}</td>
                    <td className="py-2.5 font-medium text-slate-800">{entry.jobTitle}</td>
                    <td className="py-2.5">{entry.employeeName}</td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={parseHours(entry.hours)}
                        onChange={(e) => handleHoursChange(entry, e.target.value)}
                        onBlur={(e) => saveHours(entry, e.target.value)}
                        className="w-24 h-9 px-2 border border-indigo-200 rounded-lg text-right focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400"
                      />
                    </td>
                    <td className="py-2.5 text-xs text-indigo-600">{savingKey === entry.key ? 'Se salvează…' : 'Salvat local'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {entries.map((entry) => (
              <div key={entry.key} className="border border-indigo-100 rounded-xl p-3 space-y-2 bg-white/90">
                <div className="text-xs text-indigo-600">{new Date(entry.date).toLocaleDateString('ro-RO')} · {entry.jobTitle}</div>
                <div className="font-semibold text-slate-800 text-sm">{entry.employeeName}</div>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={parseHours(entry.hours)}
                    onChange={(e) => handleHoursChange(entry, e.target.value)}
                    onBlur={(e) => saveHours(entry, e.target.value)}
                    className="w-28 h-9 px-2 border border-indigo-200 rounded-lg text-right"
                  />
                  <span className="text-xs text-indigo-600">{savingKey === entry.key ? 'Se salvează…' : 'OK'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:hidden space-y-2">
          {rows.map((row) => (
            <div key={row.employeeId} className="border border-indigo-100 rounded-xl p-3 bg-white/90">
              <p className="font-semibold text-slate-800">{row.name}</p>
              <p className="text-xs text-indigo-600 mt-1">Ore: {row.totalHours.toFixed(2)} · Zile: {row.workedDays} · Medie: {row.avgHours.toFixed(2)}</p>
              <input
                type="number"
                min="0"
                step="0.5"
                value={Object.prototype.hasOwnProperty.call(bulkDraft, row.employeeId) ? bulkDraft[row.employeeId] : row.totalHours.toFixed(2)}
                onChange={(e) => handleBulkChange(row.employeeId, e.target.value)}
                className="mt-2 w-full h-9 px-2 border border-indigo-200 rounded-lg text-right"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetBulkDraft} disabled={!hasBulkChanges || isBulkSaving}>Undo</Button>
            <Button className="flex-1" onClick={saveBulkChanges} disabled={!hasBulkChanges || isBulkSaving} loading={isBulkSaving}>Salvează lot</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
