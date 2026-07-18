document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navOrdersLink = document.getElementById('navOrdersLink');
  
  // Views toggle buttons
  const toggleListViewBtn = document.getElementById('toggleListViewBtn');
  const toggleCalendarViewBtn = document.getElementById('toggleCalendarViewBtn');
  const ordersListViewSection = document.getElementById('ordersListViewSection');
  const ordersCalendarViewSection = document.getElementById('ordersCalendarViewSection');

  // List view elements
  const ordersScrollWrapper = document.getElementById('ordersScrollWrapper');
  const ordersListContainer = document.getElementById('ordersListContainer');
  const ordersLoadingIndicator = document.getElementById('ordersLoadingIndicator');
  const orderSearchInput = document.getElementById('orderSearchInput');
  const filterBtns = document.querySelectorAll('.filter-order-btn');

  // Calendar elements
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const calendarMonthTitle = document.getElementById('calendarMonthTitle');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const selectedDayTitle = document.getElementById('selectedDayTitle');
  const clearCalendarDayFilterBtn = document.getElementById('clearCalendarDayFilterBtn');
  const calendarDayOrdersContainer = document.getElementById('calendarDayOrdersContainer');

  // State variables
  let allOrders = [];
  let currentFilter = 'all'; // all, pendiente, finalizada
  
  // Pagination state
  let limit = 50;
  let offset = 0;
  let isLoading = false;
  let hasMore = true;

  // Calendar state
  const today = new Date();
  let currentCalendarYear = today.getFullYear();
  let currentCalendarMonth = today.getMonth() + 1; // 1-indexed (1-12)
  let selectedCalendarDate = ''; // YYYY-MM-DD
  let calendarEventsSummary = []; // Array of { fecha, status, count }
  let currentUserRole = '';
  let currentUserTeam = '';

  async function fetchCurrentUserSession() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.loggedIn) {
        currentUserRole = data.user.role;
        currentUserTeam = data.user.team_id;
        // Trigger list reload once we have session info to render correct buttons
        resetListPagination();
        loadOrdersList(true);
      }
    } catch (e) {
      console.error("Error al obtener sesión en orders.js:", e);
    }
  }
  fetchCurrentUserSession();

  const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

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

  // --- NAVIGATION TAB LISTENER ---
  if (navOrdersLink) {
    navOrdersLink.addEventListener('click', () => {
      // Por defecto al entrar mostramos listado
      showListView();
    });
  }

  // --- SWITCH BETWEEN LIST AND CALENDAR VIEWS ---
  if (toggleListViewBtn && toggleCalendarViewBtn) {
    toggleListViewBtn.addEventListener('click', showListView);
    toggleCalendarViewBtn.addEventListener('click', showCalendarView);
  }

  function showListView() {
    toggleListViewBtn.style.background = 'var(--color-info)';
    toggleListViewBtn.style.color = '#000';
    toggleCalendarViewBtn.style.background = 'transparent';
    toggleCalendarViewBtn.style.color = 'var(--text-secondary)';

    ordersListViewSection.style.display = 'block';
    ordersCalendarViewSection.style.display = 'none';

    // Reset list and reload
    resetListPagination();
    loadOrdersList(false);
  }

  function showCalendarView() {
    toggleCalendarViewBtn.style.background = 'var(--color-info)';
    toggleCalendarViewBtn.style.color = '#000';
    toggleListViewBtn.style.background = 'transparent';
    toggleListViewBtn.style.color = 'var(--text-secondary)';

    ordersListViewSection.style.display = 'none';
    ordersCalendarViewSection.style.display = 'block';

    // Render calendar
    renderCalendar();
  }

  // --- PAGINATION AND LIST LOADING ---
  function resetListPagination() {
    offset = 0;
    allOrders = [];
    hasMore = true;
    isLoading = false;
    ordersListContainer.innerHTML = '';
  }

  // Cargar lista de órdenes desde API (con soporte de append para lazy load)
  async function loadOrdersList(append = false) {
    if (isLoading || (!append && !hasMore)) return;
    isLoading = true;

    if (!append) {
      ordersListContainer.innerHTML = '<div style="text-align:center; color: var(--text-secondary); padding: 2rem;">Cargando órdenes de trabajo...</div>';
    } else {
      ordersLoadingIndicator.style.display = 'block';
    }

    try {
      const searchVal = orderSearchInput.value.trim();
      const statusVal = currentFilter;
      
      const res = await fetch(`/api/tasks/list/team?limit=${limit}&offset=${offset}&search=${encodeURIComponent(searchVal)}&status=${statusVal}`);
      if (!res.ok) throw new Error("No se pudieron cargar las órdenes.");
      
      const newOrders = await res.json();
      
      if (newOrders.length < limit) {
        hasMore = false;
      }

      if (append) {
        allOrders = allOrders.concat(newOrders);
      } else {
        allOrders = newOrders;
      }

      renderOrdersList(append);
    } catch (err) {
      console.error(err);
      if (!append) {
        ordersListContainer.innerHTML = `<div style="text-align:center; color: var(--color-danger); padding: 2rem;">Error: ${err.message}</div>`;
      }
    } finally {
      isLoading = false;
      ordersLoadingIndicator.style.display = 'none';
    }
  }

  // Renderizar listado de órdenes
  function renderOrdersList(append = false) {
    if (!append) {
      ordersListContainer.innerHTML = '';
    }

    // Si no hay ninguna orden cargada
    if (allOrders.length === 0) {
      ordersListContainer.innerHTML = '<div style="text-align:center; color: var(--text-secondary); padding: 3rem;">No se encontraron órdenes de trabajo.</div>';
      return;
    }

    // Renderizar tarjetas
    const listToRender = append ? allOrders.slice(allOrders.length - limit) : allOrders;
    listToRender.forEach(order => {
      try {
        const card = createOrderCard(order);
        ordersListContainer.appendChild(card);
      } catch (err) {
        console.error("Error al renderizar tarjeta de orden:", err, order);
      }
    });

    bindOrderLoadButtons(ordersListContainer);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- EVENT LISTENERS DE LISTADO ---

  // Filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      currentFilter = btn.getAttribute('data-status');
      resetListPagination();
      loadOrdersList(false);
    });
  });

  // Búsqueda en tiempo real con debounce
  let searchTimeout = null;
  orderSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      resetListPagination();
      loadOrdersList(false);
    }, 300);
  });

  // Infinite Scroll en listado
  ordersScrollWrapper.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = ordersScrollWrapper;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (!isLoading && hasMore) {
        offset += limit;
        loadOrdersList(true);
      }
    }
  });

  // --- CALENDAR LÓGICA ---

  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentCalendarMonth--;
      if (currentCalendarMonth < 1) {
        currentCalendarMonth = 12;
        currentCalendarYear--;
      }
      renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
      currentCalendarMonth++;
      if (currentCalendarMonth > 12) {
        currentCalendarMonth = 1;
        currentCalendarYear++;
      }
      renderCalendar();
    });
  }

  async function renderCalendar() {
    try {
      // 1. Mostrar mes y año
      calendarMonthTitle.textContent = `${MONTHS_ES[currentCalendarMonth - 1]} ${currentCalendarYear}`;
      calendarDaysGrid.innerHTML = '';

      // 2. Fetch mensual de indicadores desde la API
      try {
        const monthStr = currentCalendarMonth.toString().padStart(2, '0');
        const res = await fetch(`/api/tasks/calendar?year=${currentCalendarYear}&month=${monthStr}`);
        calendarEventsSummary = res.ok ? await res.json() : [];
      } catch (e) {
        console.error("Error al obtener indicadores del calendario:", e);
        calendarEventsSummary = [];
      }

      // 3. Obtener info de días del mes
      const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth - 1, 1).getDay();
      // Ajustar index para empezar en Lunes (getDay: 0 = Dom, 1 = Lun, 2 = Mar... 6 = Sáb)
      const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
      const totalDaysInMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

      // 4. Renderizar celdas vacías del offset inicial
      for (let i = 0; i < adjustedFirstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.background = 'transparent';
        calendarDaysGrid.appendChild(emptyDiv);
      }

      // 5. Renderizar días
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'glass-panel';
        dayDiv.style.padding = '0.35rem';
        dayDiv.style.minHeight = '65px';
        dayDiv.style.display = 'flex';
        dayDiv.style.flexDirection = 'column';
        dayDiv.style.justifyContent = 'space-between';
        dayDiv.style.cursor = 'pointer';
        dayDiv.style.position = 'relative';
        dayDiv.style.border = '1px solid rgba(255,255,255,0.05)';
        dayDiv.style.borderRadius = 'var(--radius-sm)';
        dayDiv.style.transition = 'all 0.2s';

        const dateStr = `${currentCalendarYear}-${currentCalendarMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // Highlight para el día seleccionado
        if (selectedCalendarDate === dateStr) {
          dayDiv.style.borderColor = 'var(--color-info)';
          dayDiv.style.background = 'rgba(0, 237, 255, 0.15)';
        }

        // Resaltar hoy
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) {
          dayDiv.style.boxShadow = '0 0 10px rgba(0, 237, 255, 0.4)';
        }

        // Número de día
        const dayNum = document.createElement('span');
        dayNum.textContent = day;
        dayNum.style.fontSize = '0.75rem';
        dayNum.style.fontWeight = '700';
        dayNum.style.color = (dateStr === todayStr) ? 'var(--color-info)' : 'var(--text-secondary)';
        dayDiv.appendChild(dayNum);

        // Buscar eventos para este día
        let dayEvents = [];
        if (Array.isArray(calendarEventsSummary)) {
          dayEvents = calendarEventsSummary.filter(e => {
            if (!e || !e.fecha) return false;
            try {
              const dbDateClean = typeof e.fecha === 'string'
                ? e.fecha.substring(0, 10)
                : new Date(e.fecha).toISOString().substring(0, 10);
              return dbDateClean === dateStr;
            } catch (err) {
              console.error("Error parsing date in calendar event:", err);
              return false;
            }
          });
        }

        if (dayEvents.length > 0) {
          const indicators = document.createElement('div');
          indicators.style.display = 'flex';
          indicators.style.flexDirection = 'column';
          indicators.style.gap = '2px';
          
          dayEvents.forEach(evt => {
            const pill = document.createElement('div');
            const isPendiente = evt.status === 'pendiente';
            const bg = isPendiente ? 'var(--color-warning)' : 'var(--color-success)';
            const textCol = isPendiente ? '#000' : '#fff';
            
            pill.textContent = `${evt.count} ${isPendiente ? 'Pend' : 'Fin'}`;
            pill.style.fontSize = '0.6rem';
            pill.style.fontWeight = '700';
            pill.style.padding = '1px 3px';
            pill.style.borderRadius = '3px';
            pill.style.background = bg;
            pill.style.color = textCol;
            pill.style.textAlign = 'center';
            pill.style.whiteSpace = 'nowrap';
            pill.style.overflow = 'hidden';
            
            indicators.appendChild(pill);
          });
          
          dayDiv.appendChild(indicators);
        }

        // Click event
        dayDiv.addEventListener('click', () => {
          selectedCalendarDate = dateStr;
          // Re-renderizar calendario para reflejar la selección visual
          document.querySelectorAll('#calendarDaysGrid > div').forEach(el => {
            if (el.style.background !== 'transparent') {
              el.style.borderColor = 'rgba(255,255,255,0.05)';
            }
          });
          dayDiv.style.borderColor = 'var(--color-info)';
          
          loadCalendarDayOrders(dateStr);
        });

        calendarDaysGrid.appendChild(dayDiv);
      }
    } catch (err) {
      console.error("Error crítico en renderCalendar:", err);
      if (calendarDaysGrid) {
        calendarDaysGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 2rem;">Error al renderizar el calendario: ${err.message}</div>`;
      }
    }
  }

  // Cargar órdenes correspondientes al día seleccionado en calendario
  async function loadCalendarDayOrders(dateStr) {
    calendarDayOrdersContainer.innerHTML = '<div style="text-align:center; color: var(--text-secondary); padding: 1.5rem;">Cargando tareas del día...</div>';
    selectedDayTitle.textContent = `Tareas del ${new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    clearCalendarDayFilterBtn.style.display = 'block';

    try {
      const res = await fetch(`/api/tasks/list/team?date=${dateStr}&limit=100`);
      if (!res.ok) throw new Error();
      const tasks = await res.json();

      if (tasks.length === 0) {
        calendarDayOrdersContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No hay tareas registradas en este día.</div>';
        return;
      }

      calendarDayOrdersContainer.innerHTML = '';
      tasks.forEach(task => {
        const card = createOrderCard(task);
        calendarDayOrdersContainer.appendChild(card);
      });

      bindOrderLoadButtons(calendarDayOrdersContainer);
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      calendarDayOrdersContainer.innerHTML = '<div style="text-align: center; color: var(--color-danger); padding: 1.5rem;">Error al cargar tareas.</div>';
    }
  }

  if (clearCalendarDayFilterBtn) {
    clearCalendarDayFilterBtn.addEventListener('click', () => {
      selectedCalendarDate = '';
      clearCalendarDayFilterBtn.style.display = 'none';
      selectedDayTitle.textContent = 'Tareas del día';
      calendarDayOrdersContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 1.5rem; font-size: 0.85rem;">
          Haz clic en cualquier día con indicadores del calendario para ver sus tareas correspondientes.
        </div>
      `;
      renderCalendar();
    });
  }

  // --- ORDER VIEWER MODAL ---
  const orderViewerModal = document.getElementById('orderViewerModal');
  const orderViewerTitle = document.getElementById('orderViewerTitle');
  const orderViewerBody = document.getElementById('orderViewerBody');
  const orderViewerEditBtn = document.getElementById('orderViewerEditBtn');
  const orderViewerCloseBtn = document.getElementById('orderViewerCloseBtn');
  const closeOrderViewerBtn = document.getElementById('closeOrderViewerBtn');

  let currentViewingTaskId = null;

  function closeOrderViewer() {
    if (orderViewerModal) orderViewerModal.classList.remove('active');
  }
  if (closeOrderViewerBtn) closeOrderViewerBtn.addEventListener('click', closeOrderViewer);
  if (orderViewerCloseBtn) orderViewerCloseBtn.addEventListener('click', closeOrderViewer);
  if (orderViewerModal) {
    orderViewerModal.addEventListener('click', (e) => {
      if (e.target === orderViewerModal) closeOrderViewer();
    });
  }

  // Abrir modal de visualización de orden
  async function openOrderViewer(taskId) {
    currentViewingTaskId = taskId;
    orderViewerTitle.textContent = `Orden #${taskId}`;
    orderViewerBody.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-secondary);">Cargando detalle de la orden...</div>';
    orderViewerEditBtn.style.display = 'none';
    const orderViewerDeleteBtn = document.getElementById('orderViewerDeleteBtn');
    if (orderViewerDeleteBtn) orderViewerDeleteBtn.style.display = 'none';
    orderViewerModal.classList.add('active');

    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();

      if (!res.ok) {
        orderViewerBody.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--color-danger);">Error: ${data.error || 'No se pudo cargar la orden.'}</div>`;
        return;
      }

      if (!data.found) {
        orderViewerBody.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--color-danger);">Orden no encontrada.</div>';
        return;
      }

      const t = data.task;

      // Determinar si puede editar
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      const userRole = sessionData.user?.role || 'tecnico';
      const userTeam = sessionData.user?.team_id || '';
      const canEdit = (userRole === 'admin') || (t.equipo === userTeam);

      if (canEdit) {
        orderViewerEditBtn.style.display = 'inline-flex';
        if (orderViewerDeleteBtn) orderViewerDeleteBtn.style.display = 'inline-flex';
      }

      // Construir el HTML de detalle
      const isPendiente = !t.puntosTotalesEstimados || t.puntosTotalesEstimados === 0;
      const statusColor = isPendiente ? 'var(--color-warning)' : 'var(--color-success)';
      const statusText = isPendiente ? 'Pendiente' : 'Finalizada';

      let puntosHtml = '';
      if (t.puntosTrabajo && t.puntosTrabajo.length > 0) {
        puntosHtml = t.puntosTrabajo.map((p, i) => {
          const conceptosHtml = (p.conceptos || []).map(c =>
            `<div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.15rem 0; color: var(--text-secondary);">
              <span>${c.nombre}</span>
              <span style="color: var(--color-accent); font-weight: 600;">x${c.cantidad}</span>
            </div>`
          ).join('');
          const comment = p.comentario ? `<div style="font-size: 0.75rem; color: var(--color-warning); margin-top: 0.25rem; font-style: italic; display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="message-square" style="width: 12px; height: 12px; color: var(--color-warning);"></i> ${p.comentario}</div>` : '';
          return `
            <div class="glass-panel point-item" style="padding: 0.75rem; margin-bottom: 0.5rem;">
              <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--color-info);">Punto ${i + 1} — ${p.ubicacion || 'Sin ubicación'}</div>
              ${conceptosHtml}
              ${comment}
            </div>
          `;
        }).join('');
      }

      let materialHtml = '';
      if (t.gastoMaterial && Object.keys(t.gastoMaterial).length > 0) {
        const matRows = Object.entries(t.gastoMaterial)
          .filter(([, v]) => parseInt(v, 10) > 0)
          .map(([k, v]) => `<div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.15rem 0;"><span style="text-transform: capitalize;">${k.replace(/_/g, ' ')}</span><span style="font-weight: 700; color: var(--color-accent);">${v} uds</span></div>`)
          .join('');
        if (matRows) {
          materialHtml = `
            <div style="margin-top: 1.25rem;">
              <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-accent); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
                <i data-lucide="package" style="width: 15px; height: 15px; color: var(--color-accent);"></i> Material Utilizado
              </h4>
              <div class="glass-panel point-item" style="padding: 0.75rem;">${matRows}</div>
            </div>
          `;
        }
      }

      let cableHtml = '';
      if (t.cableDesplegado && Object.keys(t.cableDesplegado).length > 0) {
        const cabRows = Object.entries(t.cableDesplegado)
          .filter(([, v]) => parseInt(v, 10) > 0)
          .map(([k, v]) => `<div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.15rem 0;"><span>${k}</span><span style="font-weight: 700; color: var(--color-info);">${v} m</span></div>`)
          .join('');
        if (cabRows) {
          cableHtml = `
            <div style="margin-top: 1.25rem;">
              <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-info); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
                <i data-lucide="zap" style="width: 15px; height: 15px; color: var(--color-info);"></i> Cable Desplegado
              </h4>
              <div class="glass-panel point-item" style="padding: 0.75rem;">${cabRows}</div>
            </div>
          `;
        }
      }

      let urgenteHtml = '';
      if (t.esUrgente && t.esUrgente.activa) {
        urgenteHtml = `
          <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); padding: 0.6rem; margin-top: 1rem;">
            <span style="font-weight: 700; color: var(--color-danger); font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="alert-triangle" style="width: 15px; height: 15px; color: var(--color-danger);"></i> Tarea Urgente
            </span>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${t.esUrgente.descripcion || 'Sin descripción'}</p>
          </div>
        `;
      }

      let mantenimientoHtml = '';
      if (t.tareaMantenimiento && t.tareaMantenimiento.activa) {
        mantenimientoHtml = `
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: var(--radius-sm); padding: 0.6rem; margin-top: 0.75rem;">
            <span style="font-weight: 700; color: var(--color-warning); font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="wrench" style="width: 15px; height: 15px; color: var(--color-warning);"></i> Tarea de Mantenimiento
            </span>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${t.tareaMantenimiento.descripcion || ''} ${t.tareaMantenimiento.informacionAdicional || ''}</p>
          </div>
        `;
      }

      let sinExitoHtml = '';
      if (t.esSinExito && t.sinExito) {
        sinExitoHtml = `
          <div style="background: rgba(100,116,139,0.15); border: 1px solid rgba(100,116,139,0.3); border-radius: var(--radius-sm); padding: 0.6rem; margin-top: 0.75rem;">
            <span style="font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="x-circle" style="width: 15px; height: 15px; color: var(--text-secondary);"></i> Sin Éxito
            </span>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Motivo: ${t.sinExito.motivo || 'N/D'} · Visitas: ${t.sinExito.visitas || 'N/D'}
            </p>
          </div>
        `;
      }

      orderViewerBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; gap: 0.5rem;">
          <div>
            <span style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: #fff;">Tarea #${t.id}</span>
            <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.5rem;">${t.fecha}</span>
          </div>
          <span style="padding: 0.3rem 0.9rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: ${statusColor}; background: ${isPendiente ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'}; border: 1px solid ${statusColor}44;">
            ${statusText}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div class="glass-panel point-item" style="padding: 0.75rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.25rem;">Equipo</div>
            <div style="font-weight: 700; color: #fff;">${t.equipo}</div>
          </div>
          <div class="glass-panel point-item" style="padding: 0.75rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.25rem;">Integrantes</div>
            <div style="font-weight: 600; color: #fff; font-size: 0.85rem;">${t.integrantes}</div>
          </div>
          <div class="glass-panel point-item" style="padding: 0.75rem; grid-column: span 2;">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.25rem;">Ubicación</div>
            <div style="font-weight: 600; color: #fff; font-size: 0.85rem;">${t.ubicacion || 'No definida'}</div>
          </div>
        </div>

        ${t.descripcionGeneral ? `<div style="margin-bottom: 1rem;"><div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 0.25rem;">Descripción General</div><p style="font-size: 0.85rem; color: #fff;">${t.descripcionGeneral}</p></div>` : ''}

        ${urgenteHtml}
        ${mantenimientoHtml}
        ${sinExitoHtml}

        ${puntosHtml ? `
          <div style="margin-top: 1.25rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-info); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="map-pin" style="width: 15px; height: 15px; color: var(--color-info);"></i> Puntos de Trabajo (${t.puntosTrabajo.length})
            </h4>
            ${puntosHtml}
          </div>
        ` : ''}

        ${materialHtml}
        ${cableHtml}

        <div class="glass-panel point-item" style="padding: 0.75rem; margin-top: 1.25rem; text-align: center;">
          <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Puntos Totales Estimados</div>
          <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--color-accent);">${(t.puntosTotalesEstimados || 0).toFixed(2)} pts</div>
        </div>

        <!-- Galería de Imágenes -->
        <div style="margin-top: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-info); margin: 0; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="image" style="width: 15px; height: 15px; color: var(--color-info);"></i> Galería de Imágenes
            </h4>
            <span id="orderGalleryCount" style="font-size: 0.75rem; color: var(--text-secondary);">Cargando...</span>
          </div>
          <div id="orderGalleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; min-height: 60px;">
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 0.8rem; padding: 1rem;">Cargando imágenes...</div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      // Cargar galería de imágenes
      loadOrderGallery(taskId);

    } catch (err) {
      console.error(err);
      orderViewerBody.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--color-danger);">Error al cargar la orden.</div>';
    }
  }

  // Cargar y renderizar la galería de imágenes dentro del modal de orden
  async function loadOrderGallery(taskId) {
    const galleryGrid = document.getElementById('orderGalleryGrid');
    const galleryCount = document.getElementById('orderGalleryCount');
    if (!galleryGrid || !galleryCount) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/images`);
      if (!res.ok) throw new Error();
      const images = await res.json();

      galleryCount.textContent = `${images.length} imagen${images.length !== 1 ? 'es' : ''}`;

      if (images.length === 0) {
        galleryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 0.8rem; padding: 1.5rem;">No hay imágenes subidas para esta orden.</div>';
        return;
      }

      galleryGrid.innerHTML = '';

      images.forEach(img => {
        const tile = document.createElement('div');
        tile.style.cssText = `
          position: relative;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-color);
          aspect-ratio: 1;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        `;

        // Imagen de fondo
        tile.style.background = `url(${img.image_path}) center/cover no-repeat`;

        // Hover effect
        tile.addEventListener('mouseenter', () => {
          tile.style.transform = 'scale(1.03)';
          tile.style.boxShadow = '0 4px 15px rgba(0,237,255,0.2)';
        });
        tile.addEventListener('mouseleave', () => {
          tile.style.transform = 'scale(1)';
          tile.style.boxShadow = 'none';
        });

        // Etiqueta de título
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.85));
          padding: 0.5rem 0.35rem 0.3rem;
          display: flex; flex-direction: column; gap: 2px;
        `;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = img.title || `Punto ${img.point_id}`;
        titleSpan.style.cssText = 'font-size: 0.65rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        label.appendChild(titleSpan);

        // Botón de descarga dentro del tile
        const dlBtn = document.createElement('a');
        dlBtn.href = img.image_path;
        dlBtn.download = (img.title || `imagen_punto_${img.point_id}`).replace(/\s+/g, '_') + '.jpg';
        dlBtn.textContent = '📥';
        dlBtn.style.cssText = `
          position: absolute; top: 4px; right: 4px;
          background: rgba(0,0,0,0.6); border-radius: 4px;
          width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; text-decoration: none; cursor: pointer;
          opacity: 0; transition: opacity 0.2s;
        `;
        dlBtn.addEventListener('click', (e) => e.stopPropagation());
        tile.addEventListener('mouseenter', () => { dlBtn.style.opacity = '1'; });
        tile.addEventListener('mouseleave', () => { dlBtn.style.opacity = '0'; });

        tile.appendChild(label);
        tile.appendChild(dlBtn);

        // Click abre el visor de imagen
        tile.addEventListener('click', () => {
          if (window.openImageViewer) {
            window.openImageViewer(img.image_path, img.title || `Punto ${img.point_id}`);
          }
        });

        galleryGrid.appendChild(tile);
      });

    } catch (e) {
      console.error("Error al cargar galería:", e);
      galleryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); font-size: 0.8rem; padding: 1rem;">Error al cargar galería.</div>';
      galleryCount.textContent = 'Error';
    }
  }

  // Editar orden — cargar en formulario
  if (orderViewerEditBtn) {
    orderViewerEditBtn.addEventListener('click', () => {
      if (!currentViewingTaskId) return;
      closeOrderViewer();
      
      document.getElementById('taskNumber').value = currentViewingTaskId;
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-tab') === 'formTab') {
          link.click();
        }
      });
      if (window.buscarTareaPorId) {
        window.buscarTareaPorId(currentViewingTaskId);
      }
    });
  }

  // Borrar orden desde modal
  const orderViewerDeleteBtn = document.getElementById('orderViewerDeleteBtn');
  if (orderViewerDeleteBtn) {
    orderViewerDeleteBtn.addEventListener('click', async () => {
      if (!currentViewingTaskId) return;
      
      let confirmed = false;
      if (window.showConfirm) {
        confirmed = await window.showConfirm("¿Confirmar Eliminación?", `¿Estás seguro de que deseas eliminar permanentemente la orden #${currentViewingTaskId}? Esta acción no se puede deshacer.`);
      } else {
        confirmed = confirm(`¿Estás seguro de que deseas eliminar permanentemente la orden #${currentViewingTaskId}?`);
      }

      if (confirmed) {
        try {
          const res = await fetch(`/api/tasks/${currentViewingTaskId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            if (window.showMessage) {
              window.showMessage("Éxito", data.message || "Tarea eliminada correctamente.");
            } else {
              alert(data.message || "Tarea eliminada correctamente.");
            }
            closeOrderViewer();
            
            // Recargar la vista actual
            if (ordersCalendarViewSection.style.display === 'block') {
              renderCalendar();
            } else {
              resetListPagination();
              loadOrdersList(true);
            }
          } else {
            if (window.showMessage) {
              window.showMessage("Error", data.error || "No se pudo eliminar la tarea.");
            } else {
              alert(data.error || "No se pudo eliminar la tarea.");
            }
          }
        } catch (err) {
          console.error("Error al borrar tarea:", err);
          if (window.showMessage) {
            window.showMessage("Error", "Error de conexión al eliminar la tarea.");
          } else {
            alert("Error de conexión al eliminar la tarea.");
          }
        }
      }
    });
  }

  // --- CARD GENERATOR HELPERS ---

  function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'glass-panel point-item';
    card.style.padding = '1.25rem';
    card.style.marginBottom = '0.5rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '0.75rem';

    // Formatear fecha
    const fechaFormateada = formatLocalDateString(order.fecha);

    // Determinar badge de estado
    const isPendiente = order.status === 'pendiente';
    const statusColor = isPendiente ? 'var(--color-warning)' : 'var(--color-success)';
    const statusText = isPendiente ? 'Pendiente' : 'Finalizada';
    const statusBg = isPendiente ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    // Parsear puntos con seguridad
    let puntosVal = 0.00;
    if (order.puntos_totales_estimados !== null && order.puntos_totales_estimados !== undefined) {
      const parsed = parseFloat(order.puntos_totales_estimados);
      if (!isNaN(parsed)) {
        puntosVal = parsed;
      }
    }
    const puntosTexto = puntosVal.toFixed(2);

    const canModify = currentUserRole === 'admin' || order.equipo === currentUserTeam;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-family:var(--font-display); font-size:1.15rem; font-weight:700; color: #fff;">Tarea #${order.id || 'Sin ID'}</span>
          <span style="font-size:0.8rem; color:var(--text-secondary); margin-left:0.5rem;">(${fechaFormateada})</span>
        </div>
        <span style="padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}44;">
          ${statusText}
        </span>
      </div>
      
      <div style="font-size:0.85rem; color: var(--text-secondary); display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
        <div><strong>Equipo:</strong> ${order.equipo || 'No asignado'}</div>
        <div><strong>Integrantes:</strong> ${order.integrantes || 'Sin integrantes'}</div>
        <div style="grid-column: span 2;"><strong>Ubicación:</strong> ${order.ubicacion || 'No definida'}</div>
        ${!isPendiente ? `<div style="grid-column: span 2; color: var(--color-accent); font-weight:bold;">Puntos: ${puntosTexto} pts</div>` : ''}
      </div>
      
      <div style="display:flex; justify-content: flex-end; gap: 0.5rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary view-order-btn" data-id="${order.id}" style="padding:0.4rem 0.8rem; font-size:0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
          <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Ver
        </button>
        ${canModify ? `
          <button type="button" class="btn btn-secondary load-order-btn" data-id="${order.id}" style="padding:0.4rem 0.8rem; font-size:0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <i data-lucide="${isPendiente ? 'check-square' : 'edit-3'}" style="width: 14px; height: 14px;"></i> ${isPendiente ? 'Completar' : 'Editar'}
          </button>
          <button type="button" class="btn delete-order-btn" data-id="${order.id}" style="background: #ef4444; color: #fff; border: none; padding:0.4rem 0.8rem; font-size:0.85rem; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; border-radius: var(--radius-sm); font-weight: 600;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Borrar
          </button>
        ` : ''}
      </div>
    `;
    return card;
  }

  function bindOrderLoadButtons(parentContainer) {
    // Botón "Ver" — Abre el modal de visualización
    parentContainer.querySelectorAll('.view-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openOrderViewer(btn.getAttribute('data-id'));
      });
    });

    // Botón "Editar / Completar" — Carga en formulario
    parentContainer.querySelectorAll('.load-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        document.getElementById('taskNumber').value = taskId;
        
        // Simular clic en el menú Formulario
        document.querySelectorAll('.nav-link').forEach(link => {
          if (link.getAttribute('data-tab') === 'formTab') {
            link.click();
          }
        });

        // Disparar búsqueda de la tarea en app.js
        if (window.buscarTareaPorId) {
          window.buscarTareaPorId(taskId);
        }
      });
    });

    // Botón "Borrar" — Elimina de base de datos y Firestore
    parentContainer.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const taskId = btn.getAttribute('data-id');
        
        let confirmed = false;
        if (window.showConfirm) {
          confirmed = await window.showConfirm("¿Confirmar Eliminación?", `¿Estás seguro de que deseas eliminar permanentemente la tarea #${taskId}? Esta acción no se puede deshacer.`);
        } else {
          confirmed = confirm(`¿Estás seguro de que deseas eliminar permanentemente la tarea #${taskId}?`);
        }

        if (confirmed) {
          try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
              if (window.showMessage) {
                window.showMessage("Éxito", data.message || "Tarea eliminada correctamente.");
              } else {
                alert(data.message || "Tarea eliminada correctamente.");
              }
              // Recargar la vista actual
              if (ordersCalendarViewSection.style.display === 'block') {
                renderCalendar();
              } else {
                resetListPagination();
                loadOrdersList(true);
              }
            } else {
              if (window.showMessage) {
                window.showMessage("Error", data.error || "No se pudo eliminar la tarea.");
              } else {
                alert(data.error || "No se pudo eliminar la tarea.");
              }
            }
          } catch (err) {
            console.error("Error al borrar tarea:", err);
            if (window.showMessage) {
              window.showMessage("Error", "Error de conexión al eliminar la tarea.");
            } else {
              alert("Error de conexión al eliminar la tarea.");
            }
          }
        }
      });
    });
  }

  // Auto-cargar el listado de órdenes al iniciar la aplicación
  showListView();
});
