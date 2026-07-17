document.addEventListener('DOMContentLoaded', () => {
  const startDateInput = document.getElementById('reportStartDate');
  const endDateInput = document.getElementById('reportEndDate');
  const loadReportBtn = document.getElementById('loadReportBtn');
  const summaryBody = document.getElementById('reportSummaryBody');
  const tasksBody = document.getElementById('reportTasksBody');

  // Establecer fechas por defecto (mes actual)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  startDateInput.value = firstDay.toISOString().split('T')[0];
  endDateInput.value = today.toISOString().split('T')[0];

  loadReportBtn.addEventListener('click', loadProductivityReport);

  async function loadProductivityReport() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
      alert("Por favor, selecciona fecha de inicio y fin.");
      return;
    }

    loadReportBtn.disabled = true;
    loadReportBtn.textContent = "Generando Informe...";

    try {
      const response = await fetch(`/api/reports/productivity?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar informe.');
      }

      renderSummaryTable(data.summary);
      renderTasksTable(data.tasks);

    } catch (err) {
      alert("Error al cargar informe: " + err.message);
    } finally {
      loadReportBtn.disabled = false;
      loadReportBtn.textContent = "Generar Informe";
    }
  }

  function renderSummaryTable(summary) {
    if (!summary || summary.length === 0) {
      summaryBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-secondary);">No hay tareas registradas en este rango de fechas.</td>
        </tr>
      `;
      return;
    }

    summaryBody.innerHTML = summary.map(row => `
      <tr>
        <td style="font-weight:600;">${row.equipo}</td>
        <td>${row.total_tareas}</td>
        <td style="color: var(--color-accent); font-weight:700;">${parseFloat(row.total_puntos).toFixed(2)} pts</td>
      </tr>
    `).join('');
  }

  function renderTasksTable(tasks) {
    if (!tasks || tasks.length === 0) {
      tasksBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-secondary);">No hay detalles de tareas disponibles.</td>
        </tr>
      `;
      return;
    }

    tasksBody.innerHTML = tasks.map(task => {
      const cleanDate = new Date(task.fecha).toISOString().split('T')[0];
      const statusBadge = task.es_sin_exito 
        ? `<span class="badge badge-admin">Sin éxito</span>` 
        : `<span class="badge badge-tecnico">Completada</span>`;

      return `
        <tr>
          <td style="font-weight:bold; color: var(--color-info);">${task.id}</td>
          <td>${cleanDate}</td>
          <td>${task.equipo}</td>
          <td>${task.integrantes}</td>
          <td>${task.ubicacion || 'N/D'}</td>
          <td style="font-weight:bold; color: var(--color-accent);">${parseFloat(task.puntos_totales_estimados).toFixed(2)} pts</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }
});
