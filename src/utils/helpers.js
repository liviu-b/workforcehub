export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  let date;
  if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'long' });
};

export const generatePDF = (shift, employees, materials) => {
  const printWindow = window.open('', '_blank');
  
  const empList = shift.assignedEmployeeIds?.map(id => {
    const e = employees.find(emp => emp.id === id);
    const h = shift.employeeHours?.[id] ?? 8;
    return e ? { name: e.name, hours: h } : null;
  }).filter(Boolean) || [];

  const matList = shift.materialUsage?.map(u => {
    const m = materials.find(mat => mat.id === u.materialId);
    return m ? { name: m.name, unit: m.unit, quantity: u.quantity } : null;
  }).filter(Boolean) || [];

  const taskList = (shift.taskChecklist || []).map(task => ({
    label: task.label,
    done: !!task.done,
  }));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Raport - ${shift.jobTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .title { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
        .meta { color: #64748b; font-size: 14px; margin-top: 5px; }
        .status { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .approved { background: #d1fae5; color: #065f46; }
        .open { background: #f1f5f9; color: #475569; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
        .notes { background: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic; font-size: 14px; border: 1px solid #e2e8f0; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
        .signature { text-align: right; }
        .signature strong { display: block; color: #333; font-size: 14px; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Raport de Lucru</h1>
          <div class="meta">WorkforceHub • ${formatDate(shift.date)}</div>
        </div>
        <div class="status ${shift.status === 'approved' ? 'approved' : 'open'}">
          ${shift.status === 'approved' ? 'Aprobat Final' : 'Deschis'}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Detalii Lucrare</div>
        <p><strong>Proiect:</strong> ${shift.jobTitle}</p>
        <p><strong>Progres:</strong> ${shift.progress || 0}%</p>
      </div>
      <div class="section">
        <div class="section-title">Echipă și Ore (${empList.length})</div>
        <table>
          <thead><tr><th>Nume Angajat</th><th>Ore Lucrate</th></tr></thead>
          <tbody>
            ${empList.map(e => `<tr><td>${e.name}</td><td>${e.hours} ore</td></tr>`).join('')}
            ${empList.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:#999">Niciun angajat</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Materiale Consumate (${matList.length})</div>
        <table>
          <thead><tr><th>Material</th><th>Cantitate</th></tr></thead>
          <tbody>
            ${matList.map(m => `<tr><td>${m.name}</td><td>${m.quantity} ${m.unit}</td></tr>`).join('')}
            ${matList.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:#999">Fără materiale</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Checklist (${taskList.length})</div>
        <table>
          <thead><tr><th>Task</th><th>Status</th></tr></thead>
          <tbody>
            ${taskList.map(t => `<tr><td>${t.label}</td><td>${t.done ? 'Finalizat' : 'Necompletat'}</td></tr>`).join('')}
            ${taskList.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:#999">Fără task-uri</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Note</div>
        <div class="notes">${shift.notes || 'Fără observații.'}</div>
      </div>
      <div class="footer">
        <div>Generat automat din WorkforceHub</div>
        <div class="signature">
           ${shift.status === 'approved' ? `
             Semnat digital de:
             <strong>${shift.approvedByName || 'Utilizator'}</strong>
             <div>${new Date(shift.approvedAt).toLocaleString('ro-RO')}</div>
           ` : 'Nesemnat'}
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};