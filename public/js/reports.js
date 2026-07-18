document.addEventListener('DOMContentLoaded', async () => {
  const startDateInput = document.getElementById('reportStartDate');
  const endDateInput = document.getElementById('reportEndDate');
  const loadReportBtn = document.getElementById('loadReportBtn');
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  const goalsTeamName = document.getElementById('goalsTeamName');
  const goalsProgressText = document.getElementById('goalsProgressText');
  const goalsProgressBar = document.getElementById('goalsProgressBar');
  const goalsMessage = document.getElementById('goalsMessage');
  const materialsReportBody = document.getElementById('materialsReportBody');
  const tasksBody = document.getElementById('reportTasksBody');

  const adminReportsControls = document.getElementById('adminReportsControls');
  const adminReportsDetailsSection = document.getElementById('adminReportsDetailsSection');
  const tecnicoReportsNote = document.getElementById('tecnicoReportsNote');

  let currentUserRole = 'tecnico';
  let currentUserTeam = '';

  // Helper para formatear fechas de manera independiente de la zona horaria
  function formatLocalDateString(dateInput) {
    if (!dateInput) return 'Sin fecha';
    const dateStr = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  }

  // 1. Obtener la sesión del usuario
  try {
    const sessionRes = await fetch('/api/auth/session');
    const sessionData = await sessionRes.json();
    if (sessionData.loggedIn) {
      currentUserRole = sessionData.user.role;
      currentUserTeam = sessionData.user.team_id || '';
    }
  } catch (e) {
    console.error("Error al verificar sesión en informes:", e);
  }

  // Ajustar visibilidad de paneles según rol
  if (currentUserRole === 'tecnico') {
    if (adminReportsControls) adminReportsControls.style.display = 'none';
    if (adminReportsDetailsSection) adminReportsDetailsSection.style.display = 'none';
    if (tecnicoReportsNote) tecnicoReportsNote.style.display = 'block';
  } else {
    if (adminReportsControls) adminReportsControls.style.display = 'block';
    if (adminReportsDetailsSection) adminReportsDetailsSection.style.display = 'block';
    if (tecnicoReportsNote) tecnicoReportsNote.style.display = 'none';
  }

  // Establecer fechas por defecto (mes actual)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  if (startDateInput) startDateInput.value = firstDay.toISOString().split('T')[0];
  if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];

  // Auto-cargar informe del mes actual al abrir la pestaña
  loadProductivityReport();

  if (loadReportBtn) {
    loadReportBtn.addEventListener('click', loadProductivityReport);
  }

  async function loadProductivityReport() {
    let startDate = startDateInput ? startDateInput.value : '';
    let endDate = endDateInput ? endDateInput.value : '';

    // Si es técnico, forzamos fecha del mes actual
    if (currentUserRole === 'tecnico' || !startDate || !endDate) {
      const t = new Date();
      const f = new Date(t.getFullYear(), t.getMonth(), 1);
      startDate = f.toISOString().split('T')[0];
      endDate = t.toISOString().split('T')[0];
    }

    if (loadReportBtn) {
      loadReportBtn.disabled = true;
      loadReportBtn.textContent = "Generando Informe...";
    }

    try {
      const response = await fetch(`/api/reports/productivity?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar informe.');
      }

      renderLeaderboard(data.summary);
      renderMonthlyGoals(data.summary, currentUserTeam);
      renderMaterialsReport(data.materials);
      
      if (currentUserRole !== 'tecnico') {
        renderTasksTable(data.tasks);
      }

    } catch (err) {
      console.error(err);
    } finally {
      if (loadReportBtn) {
        loadReportBtn.disabled = false;
        loadReportBtn.textContent = "Generar Informe";
      }
    }
  }

  function renderLeaderboard(summary) {
    if (!leaderboardContainer) return;
    leaderboardContainer.innerHTML = '';

    if (!summary || summary.length === 0) {
      leaderboardContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No hay tareas en el rango de fechas para calcular el ranking.
        </div>
      `;
      return;
    }

    // Ordenar de mayor a menor puntuación (ya viene ordenado de la DB)
    summary.forEach((teamData, index) => {
      const rank = index + 1;
      let badge = '';
      let glowClass = '';

      if (rank === 1) {
        badge = '<span style="font-size: 1.5rem; filter: drop-shadow(0 0 5px rgba(245,158,11,0.5));">🥇</span>';
        glowClass = 'box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4);';
      } else if (rank === 2) {
        badge = '<span style="font-size: 1.4rem; filter: drop-shadow(0 0 5px rgba(203,213,225,0.5));">🥈</span>';
        glowClass = 'box-shadow: 0 0 10px rgba(203, 213, 225, 0.1); border-color: rgba(203, 213, 225, 0.3);';
      } else if (rank === 3) {
        badge = '<span style="font-size: 1.3rem; filter: drop-shadow(0 0 5px rgba(217,119,6,0.5));">🥉</span>';
        glowClass = 'box-shadow: 0 0 10px rgba(217, 119, 6, 0.1); border-color: rgba(217, 119, 6, 0.3);';
      } else {
        badge = `<span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; background: rgba(255,255,255,0.1); border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-align: center;">${rank}</span>`;
      }

      const teamPoints = parseFloat(teamData.total_puntos) || 0;
      // Porcentaje relativo al primero para la barra visual (min 5%)
      const maxPoints = parseFloat(summary[0].total_puntos) || 1;
      const barPercentage = Math.max(5, (teamPoints / maxPoints) * 100);

      const card = document.createElement('div');
      card.className = 'glass-panel point-item';
      card.style.cssText = `
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        ${glowClass}
      `;

      card.innerHTML = `
        <div style="flex-shrink: 0; display: flex; justify-content: center; align-items: center; width: 35px;">
          ${badge}
        </div>
        
        <div style="flex-grow: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${teamData.equipo}</span>
            <span style="font-weight: 800; color: var(--color-info); font-size: 0.9rem;">${teamPoints.toFixed(2)} pts</span>
          </div>
          <div style="background: rgba(0,0,0,0.3); height: 8px; border-radius: 999px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
            <div style="width: ${barPercentage}%; height: 100%; background: var(--color-info); border-radius: 999px;"></div>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Tareas realizadas: ${teamData.total_tareas}
          </div>
        </div>
      `;

      leaderboardContainer.appendChild(card);
    });
  }

  function renderMonthlyGoals(summary, userTeam) {
    if (!goalsProgressBar || !goalsProgressText || !goalsTeamName || !goalsMessage) return;

    let targetTeamName = userTeam;
    // Si no tiene equipo asignado (ej: admin), evaluamos el primer equipo del ranking
    if (!targetTeamName && summary && summary.length > 0) {
      targetTeamName = summary[0].equipo;
    }

    goalsTeamName.textContent = targetTeamName ? `Progreso de: ${targetTeamName}` : 'Mi Equipo';

    // Buscar puntos del equipo objetivo
    const teamData = summary.find(t => t.equipo === targetTeamName);
    const points = teamData ? parseFloat(teamData.total_puntos) : 0;
    const targetGoal = 500.00; // Meta fija de 500 puntos mensuales
    const percentage = Math.min(100, Math.round((points / targetGoal) * 100));

    goalsProgressText.textContent = `${points.toFixed(2)} / ${targetGoal.toFixed(0)} pts (${percentage}%)`;
    goalsProgressBar.style.width = `${percentage}%`;

    // Mensaje motivacional personalizado
    if (percentage >= 100) {
      goalsMessage.textContent = "🎉 ¡Excelente! Objetivo mensual superado con éxito. ¡Gran trabajo en equipo!";
      goalsProgressBar.style.background = 'linear-gradient(90deg, var(--color-success), #10b981)';
    } else if (percentage >= 75) {
      goalsMessage.textContent = "💪 ¡Ya casi está! Te falta muy poco para conseguir la meta del mes.";
      goalsProgressBar.style.background = 'var(--color-info)';
    } else if (percentage >= 40) {
      goalsMessage.textContent = "⚡ ¡Buen ritmo! Sigue sumando puntos día a día con el equipo.";
      goalsProgressBar.style.background = 'var(--color-info)';
    } else if (points > 0) {
      goalsMessage.textContent = "🚀 Paso a paso. ¡Cada orden cuenta para alcanzar la meta!";
      goalsProgressBar.style.background = 'var(--color-info)';
    } else {
      goalsMessage.textContent = "📅 Comienza el mes sumando tus primeros puntos de trabajo.";
      goalsProgressBar.style.background = 'var(--color-info)';
    }
  }

  function renderMaterialsReport(materials) {
    if (!materialsReportBody) return;
    materialsReportBody.innerHTML = '';

    const materialKeys = Object.keys(materials || {});
    if (materialKeys.length === 0) {
      materialsReportBody.innerHTML = `
        <tr>
          <td colspan="2" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
            No se ha registrado gasto de materiales en el período especificado.
          </td>
        </tr>
      `;
      return;
    }

    // Ordenar materiales por cantidad usada desc
    const sortedMaterials = materialKeys
      .map(k => ({ name: k, qty: materials[k] }))
      .sort((a, b) => b.qty - a.qty);

    materialsReportBody.innerHTML = sortedMaterials.map(m => `
      <tr>
        <td style="font-weight: 600; text-transform: capitalize; color: #fff;">${m.name.replace(/_/g, ' ')}</td>
        <td style="text-align: right; font-weight: 700; color: var(--color-accent);">${m.qty} uds</td>
      </tr>
    `).join('');
  }

  function renderTasksTable(tasks) {
    if (!tasksBody) return;
    tasksBody.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      tasksBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-secondary);">No hay detalles de tareas disponibles.</td>
        </tr>
      `;
      return;
    }

    tasksBody.innerHTML = tasks.map(task => {
      const cleanDate = formatLocalDateString(task.fecha);
      
      const isPendiente = task.status === 'pendiente';
      const statusBadge = task.es_sin_exito 
        ? `<span class="badge" style="background: var(--color-danger); color: #fff;">Sin éxito</span>` 
        : isPendiente
          ? `<span class="badge" style="background: var(--color-warning); color: #000;">Pendiente</span>`
          : `<span class="badge" style="background: var(--color-success); color: #fff;">Finalizada</span>`;

      return `
        <tr>
          <td style="font-weight:bold; color: var(--color-info);">${task.id}</td>
          <td>${cleanDate}</td>
          <td style="font-weight:600;">${task.equipo}</td>
          <td style="font-size:0.8rem; color:var(--text-secondary);">${task.integrantes}</td>
          <td style="font-size:0.8rem;">${task.ubicacion || 'N/D'}</td>
          <td style="font-weight:bold; color: var(--color-accent);">${parseFloat(task.puntos_totales_estimados).toFixed(2)} pts</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }
});
