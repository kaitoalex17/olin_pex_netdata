document.addEventListener('DOMContentLoaded', () => {
  // Navigation for tab
  const navOrdersLink = document.getElementById('navOrdersLink');
  const ordersListContainer = document.getElementById('ordersListContainer');
  const orderSearchInput = document.getElementById('orderSearchInput');
  const filterBtns = document.querySelectorAll('.filter-order-btn');

  let allOrders = [];
  let currentFilter = 'all'; // all, pendiente, finalizada

  if (navOrdersLink) {
    navOrdersLink.addEventListener('click', () => {
      // Activar pestaña
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      navOrdersLink.classList.add('active');

      document.querySelectorAll('.spa-tab').forEach(tab => tab.style.display = 'none');
      document.getElementById('ordersTab').style.display = 'block';

      loadOrdersList();
    });
  }

  // Manejar botones de filtro
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      currentFilter = btn.getAttribute('data-status');
      renderOrders();
    });
  });

  // Manejar búsqueda en tiempo real
  orderSearchInput.addEventListener('input', () => {
    renderOrders();
  });

  // Cargar lista de órdenes desde API
  async function loadOrdersList() {
    try {
      ordersListContainer.innerHTML = '<div style="text-align:center; color: var(--text-secondary); padding: 2rem;">Cargando órdenes de trabajo...</div>';
      
      const res = await fetch('/api/tasks/list/team');
      if (!res.ok) throw new Error("No se pudieron cargar las órdenes.");
      
      allOrders = await res.json();
      renderOrders();
    } catch (err) {
      console.error(err);
      ordersListContainer.innerHTML = `<div style="text-align:center; color: var(--color-danger); padding: 2rem;">Error al cargar las órdenes: ${err.message}</div>`;
    }
  }

  // Renderizar las órdenes aplicando filtros
  function renderOrders() {
    const searchText = orderSearchInput.value.trim().toLowerCase();
    
    // Filtrar
    const filtered = allOrders.filter(order => {
      // Filtro de pestaña (Pendiente/Finalizada)
      if (currentFilter !== 'all' && order.status !== currentFilter) {
        return false;
      }
      
      // Filtro de buscador
      if (searchText) {
        const idMatch = order.id.toLowerCase().includes(searchText);
        const equipoMatch = order.equipo.toLowerCase().includes(searchText);
        const integrantesMatch = order.integrantes.toLowerCase().includes(searchText);
        const ubicacionMatch = (order.ubicacion || '').toLowerCase().includes(searchText);
        return idMatch || equipoMatch || integrantesMatch || ubicacionMatch;
      }
      
      return true;
    });

    if (filtered.length === 0) {
      ordersListContainer.innerHTML = '<div style="text-align:center; color: var(--text-secondary); padding: 3rem;">No se encontraron órdenes de trabajo.</div>';
      return;
    }

    ordersListContainer.innerHTML = '';
    filtered.forEach(order => {
      const card = document.createElement('div');
      card.className = 'glass-panel point-item';
      card.style.padding = '1.25rem';
      card.style.marginBottom = '0.5rem';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '0.75rem';

      // Formatear fecha
      const fechaFormateada = new Date(order.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Determinar badge de estado
      const isPendiente = order.status === 'pendiente';
      const statusColor = isPendiente ? 'var(--color-warning)' : 'var(--color-success)';
      const statusText = isPendiente ? 'Pendiente' : 'Finalizada';
      const statusBg = isPendiente ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <span style="font-family:var(--font-display); font-size:1.15rem; font-weight:700; color: #fff;">Tarea #${order.id}</span>
            <span style="font-size:0.8rem; color:var(--text-secondary); margin-left:0.5rem;">(${fechaFormateada})</span>
          </div>
          <span style="padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}44;">
            ${statusText}
          </span>
        </div>
        
        <div style="font-size:0.85rem; color: var(--text-secondary); display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
          <div><strong>Equipo:</strong> ${order.equipo}</div>
          <div><strong>Integrantes:</strong> ${order.integrantes}</div>
          <div style="grid-column: span 2;"><strong>Ubicación:</strong> ${order.ubicacion || 'No definida'}</div>
          ${!isPendiente ? `<div style="grid-column: span 2; color: var(--color-accent); font-weight:bold;">Puntos: ${order.puntos_totales_estimados} pts</div>` : ''}
        </div>
        
        <div style="display:flex; justify-content: flex-end; gap: 0.5rem; margin-top:0.5rem;">
          <button type="button" class="btn btn-secondary load-order-btn" data-id="${order.id}" style="padding:0.4rem 0.8rem; font-size:0.85rem;">
            ${isPendiente ? 'Completar Tarea' : 'Cargar en Formulario'}
          </button>
        </div>
      `;

      ordersListContainer.appendChild(card);
    });

    // Agregar eventos a los botones de cargar
    ordersListContainer.querySelectorAll('.load-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        // Ir a formulario y cargar
        document.getElementById('taskIdInput').value = taskId;
        
        // Simular clic en el menú Formulario
        document.querySelectorAll('.nav-link').forEach(link => {
          if (link.getAttribute('data-tab') === 'formTab') {
            link.click();
          }
        });

        // Disparar búsqueda de la tarea en app.js
        const searchInput = document.getElementById('taskIdInput');
        if (searchInput) {
          // Desencadenar búsqueda en app.js llamando a la función global de buscar
          if (window.buscarTareaPorId) {
            window.buscarTareaPorId(taskId);
          }
        }
      });
    });
  }
});
