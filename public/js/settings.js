document.addEventListener('DOMContentLoaded', () => {
  // Ajustes Subnavigation Tabs
  const settingsTabButtons = document.querySelectorAll('[data-panel]');
  const subpanels = document.querySelectorAll('.settings-subpanel');

  settingsTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      settingsTabButtons.forEach(b => b.classList.remove('active-settings-btn', 'btn-primary'));
      settingsTabButtons.forEach(b => b.classList.add('btn-secondary'));
      
      btn.classList.remove('btn-secondary');
      btn.classList.add('active-settings-btn', 'btn-primary');

      const targetPanel = btn.getAttribute('data-panel');
      subpanels.forEach(p => p.style.display = 'none');
      document.getElementById(targetPanel).style.display = 'block';
    });
  });

  // Configuración de Formularios y Elementos
  const userForm = document.getElementById('userForm');
  const userIdInput = document.getElementById('userIdInput');
  const userEmailInput = document.getElementById('userEmail');
  const userPasswordInput = document.getElementById('userPassword');
  const userPasswordLabel = document.getElementById('userPasswordLabel');
  const userRoleSelect = document.getElementById('userRoleSelect');
  const userTeamSelect = document.getElementById('userTeamSelect');
  const userMemberSelect = document.getElementById('userMemberSelect');
  const cancelUserEditBtn = document.getElementById('cancelUserEditBtn');
  const userFormTitle = document.getElementById('userFormTitle');

  const usersTableBody = document.getElementById('usersTableBody');
  const teamsTableBody = document.getElementById('teamsTableBody');
  const conceptsTableBody = document.getElementById('conceptsTableBody');
  const cablesTableBody = document.getElementById('cablesTableBody');
  const materialsTableBody = document.getElementById('materialsTableBody');

  const teamForm = document.getElementById('teamForm');
  const conceptForm = document.getElementById('conceptForm');
  const cableForm = document.getElementById('cableForm');
  const materialForm = document.getElementById('materialForm');
  const groqForm = document.getElementById('groqForm');
  const groqKeyInput = document.getElementById('groqKeyInput');
  const testGroqBtn = document.getElementById('testGroqBtn');
  const groqKeyStatus = document.getElementById('groqKeyStatus');
  const mantenimientoValueForm = document.getElementById('mantenimientoValueForm');
  const mantenimientoPointsInput = document.getElementById('mantenimientoPointsInput');
  const categoryForm = document.getElementById('categoryForm');
  const categoryNameInput = document.getElementById('categoryNameInput');
  const categoriesTableBody = document.getElementById('categoriesTableBody');

  // Estado local para equipos y miembros
  let systemTeams = [];

  // --- CONTROL DE USUARIOS Y VINCULACIÓN ---

  // Actualizar lista de integrantes cuando cambia el equipo del usuario
  userTeamSelect.addEventListener('change', () => {
    const selectedTeamId = userTeamSelect.value;
    updateMemberSelectOptions(selectedTeamId);
  });

  function updateMemberSelectOptions(teamId, selectedValue = '') {
    userMemberSelect.innerHTML = '<option value="">Ninguno</option>';
    if (!teamId) {
      userMemberSelect.innerHTML = '<option value="">Ninguno (Elegir un equipo primero)</option>';
      return;
    }

    const team = systemTeams.find(t => t.id === teamId);
    if (team && team.integrantes) {
      const members = team.integrantes.split(',').map(m => m.trim()).filter(Boolean);
      members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        if (member === selectedValue) option.selected = true;
        userMemberSelect.appendChild(option);
      });
    }
  }

  // Cargar todos los datos de configuración
  window.loadSettingsData = async function() {
    try {
      // 1. Cargar catálogo del sistema
      const resConfig = await fetch('/api/config');
      const config = await resConfig.json();

      systemTeams = config.teams || [];

      // Renderizar catálogos
      renderTeamsList(config.teams);
      renderConceptsList(config.concepts);
      renderCablesList(config.cables);
      renderMaterialsList(config.materials);
      renderCategoriesList(config.imageCategories || []);
      
      if (config.settings?.mantenimiento_value) {
        mantenimientoPointsInput.value = config.settings.mantenimiento_value;
      }

      // Rellenar desplegables de equipos en formularios
      fillTeamSelectOptions(config.teams);

      // 2. Cargar lista de usuarios
      await loadUsersList();

      // 3. Cargar configuración de Groq
      await loadGroqConfig();

    } catch (err) {
      console.error("Error al cargar ajustes:", err);
    }
  };

  function fillTeamSelectOptions(teams) {
    // Para formulario de usuarios
    userTeamSelect.innerHTML = '<option value="">Ninguno (Gestores/Coordinadores)</option>';
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.id;
      userTeamSelect.appendChild(option);
    });
  }

  async function loadUsersList() {
    try {
      const res = await fetch('/api/config/users');
      const users = await res.json();
      renderUsersList(users);
    } catch (err) {
      console.error(err);
    }
  }

  function renderUsersList(users) {
    if (!users || users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay usuarios.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td>${user.email}</td>
        <td><span class="badge badge-${user.role}">${user.role}</span></td>
        <td>${user.team_id || 'Ninguno'}</td>
        <td>${user.associated_member || 'No vinculado'}</td>
        <td>
          <button type="button" class="btn btn-secondary edit-user-btn" data-id="${user.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Editar</button>
          <button type="button" class="btn btn-danger delete-user-btn" data-id="${user.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
        </td>
      </tr>
    `).join('');

    // Eventos de edición y borrado
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-id');
        const user = users.find(u => u.id == userId);
        if (user) {
          // Entrar en modo edición
          userIdInput.value = user.id;
          userEmailInput.value = user.email;
          userRoleSelect.value = user.role;
          userTeamSelect.value = user.team_id || '';
          
          // Actualizar integrantes del equipo y seleccionar el correcto
          updateMemberSelectOptions(user.team_id, user.associated_member);
          
          userPasswordInput.placeholder = "Dejar en blanco para no cambiar";
          userPasswordLabel.textContent = "Cambiar Contraseña";
          userFormTitle.textContent = `Editar Usuario: ${user.email}`;
          cancelUserEditBtn.style.display = 'inline-flex';
        }
      });
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-id');
        if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
          try {
            const res = await fetch(`/api/config/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert("Usuario eliminado.");
            loadUsersList();
          } catch (err) {
            alert("Error: " + err.message);
          }
        }
      });
    });
  }

  // Cancelar edición
  cancelUserEditBtn.addEventListener('click', () => {
    resetUserForm();
  });

  function resetUserForm() {
    userForm.reset();
    userIdInput.value = '';
    userPasswordInput.placeholder = "••••••••";
    userPasswordLabel.textContent = "Contraseña";
    userFormTitle.textContent = "Crear Nuevo Usuario";
    cancelUserEditBtn.style.display = 'none';
    userMemberSelect.innerHTML = '<option value="">Ninguno (Elegir un equipo primero)</option>';
  }

  // Formulario Usuario Submit
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: userIdInput.value || undefined,
      email: userEmailInput.value,
      password: userPasswordInput.value,
      role: userRoleSelect.value,
      team_id: userTeamSelect.value,
      associated_member: userMemberSelect.value
    };

    try {
      const res = await fetch('/api/config/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Usuario guardado con éxito.");
      resetUserForm();
      loadUsersList();
      // Recargar también la sesión si es el usuario actual para reflejar cambios
      if (window.checkSession) window.checkSession();
    } catch (err) {
      alert("Error: " + err.message);
    }
  });


  // --- EQUIPOS, CONCEPTOS, CABLES Y MATERIALES ---

  function renderTeamsList(teams) {
    if (!teams || teams.length === 0) {
      teamsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay equipos.</td></tr>';
      return;
    }
    teamsTableBody.innerHTML = teams.map(team => `
      <tr>
        <td style="font-weight:600; color: var(--color-info);">${team.id}</td>
        <td>${team.integrantes}</td>
        <td>
          <button type="button" class="btn btn-secondary edit-team-btn" data-id="${team.id}" data-members="${team.integrantes}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Editar</button>
          <button type="button" class="btn btn-danger delete-team-btn" data-id="${team.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('teamIdInput').value = btn.getAttribute('data-id');
        document.getElementById('teamMembersInput').value = btn.getAttribute('data-members');
        document.getElementById('teamIdInput').focus();
      });
    });

    document.querySelectorAll('.delete-team-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Eliminar equipo ${id}?`)) {
          const res = await fetch(`/api/config/teams/${id}`, { method: 'DELETE' });
          if (res.ok) { loadSettingsData(); } else { alert("Error al eliminar."); }
        }
      });
    });
  }

  teamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('teamIdInput').value;
    const integrantes = document.getElementById('teamMembersInput').value;
    const res = await fetch('/api/config/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, integrantes })
    });
    if (res.ok) {
      teamForm.reset();
      loadSettingsData();
      alert("Equipo guardado.");
    } else {
      alert("Error al guardar.");
    }
  });

  function renderConceptsList(concepts) {
    conceptsTableBody.innerHTML = concepts.map(c => `
      <tr>
        <td style="font-weight:600;">${c.id}</td>
        <td style="color: var(--color-accent); font-weight:700;">${parseFloat(c.valor_puntos).toFixed(2)} pts</td>
        <td>${c.orden}</td>
        <td>
          <button type="button" class="btn btn-secondary edit-concept-btn" data-id="${c.id}" data-points="${c.valor_puntos}" data-order="${c.orden}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Editar</button>
          <button type="button" class="btn btn-danger delete-concept-btn" data-id="${c.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-concept-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('conceptIdInput').value = btn.getAttribute('data-id');
        document.getElementById('conceptPointsInput').value = btn.getAttribute('data-points');
        document.getElementById('conceptOrderInput').value = btn.getAttribute('data-order');
        document.getElementById('conceptIdInput').focus();
      });
    });

    document.querySelectorAll('.delete-concept-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Eliminar concepto "${id}"?`)) {
          const res = await fetch(`/api/config/concepts/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) { loadSettingsData(); } else { alert("Error al eliminar."); }
        }
      });
    });
  }

  conceptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('conceptIdInput').value;
    const valor_puntos = document.getElementById('conceptPointsInput').value;
    const orden = document.getElementById('conceptOrderInput').value;
    const res = await fetch('/api/config/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, valor_puntos, orden })
    });
    if (res.ok) {
      conceptForm.reset();
      loadSettingsData();
      alert("Concepto guardado.");
    } else {
      alert("Error al guardar.");
    }
  });

  function renderCablesList(cables) {
    cablesTableBody.innerHTML = cables.map(c => `
      <tr>
        <td style="font-weight:600; color: var(--color-info);">${c.id}</td>
        <td>${c.nombre}</td>
        <td style="color: var(--color-accent); font-weight:700;">${parseFloat(c.puntos).toFixed(4)} pts/m</td>
        <td>
          <button type="button" class="btn btn-secondary edit-cable-btn" data-id="${c.id}" data-name="${c.nombre}" data-points="${c.puntos}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Editar</button>
          <button type="button" class="btn btn-danger delete-cable-btn" data-id="${c.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-cable-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cableIdInput').value = btn.getAttribute('data-id');
        document.getElementById('cableNameInput').value = btn.getAttribute('data-name');
        document.getElementById('cablePointsInput').value = btn.getAttribute('data-points');
        document.getElementById('cableIdInput').focus();
      });
    });

    document.querySelectorAll('.delete-cable-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Eliminar cable "${id}"?`)) {
          const res = await fetch(`/api/config/cables/${id}`, { method: 'DELETE' });
          if (res.ok) { loadSettingsData(); } else { alert("Error al eliminar."); }
        }
      });
    });
  }

  cableForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cableIdInput').value;
    const nombre = document.getElementById('cableNameInput').value;
    const puntos = document.getElementById('cablePointsInput').value;
    const res = await fetch('/api/config/cables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre, puntos })
    });
    if (res.ok) {
      cableForm.reset();
      loadSettingsData();
      alert("Cable guardado.");
    } else {
      alert("Error al guardar.");
    }
  });

  function renderMaterialsList(materials) {
    materialsTableBody.innerHTML = materials.map(m => `
      <tr>
        <td style="font-weight:600;">${m.id}</td>
        <td>${m.orden}</td>
        <td>
          <button type="button" class="btn btn-secondary edit-material-btn" data-id="${m.id}" data-order="${m.orden}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Editar</button>
          <button type="button" class="btn btn-danger delete-material-btn" data-id="${m.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-material-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('materialIdInput').value = btn.getAttribute('data-id');
        document.getElementById('materialOrderInput').value = btn.getAttribute('data-order');
        document.getElementById('materialIdInput').focus();
      });
    });

    document.querySelectorAll('.delete-material-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Eliminar material "${id}"?`)) {
          const res = await fetch(`/api/config/materials/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) { loadSettingsData(); } else { alert("Error al eliminar."); }
        }
      });
    });
  }

  materialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('materialIdInput').value;
    const orden = document.getElementById('materialOrderInput').value;
    const res = await fetch('/api/config/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, orden })
    });
    if (res.ok) {
      materialForm.reset();
      loadSettingsData();
      alert("Material guardado.");
    } else {
      alert("Error al guardar.");
    }
  });

  // --- CONFIGURACIÓN Y PRUEBA DE GROQ ---

  async function loadGroqConfig() {
    try {
      const res = await fetch('/api/config/groq-key');
      const data = await res.json();
      if (data.exists) {
        groqKeyInput.value = data.maskedKey;
        groqKeyStatus.textContent = "Clave configurada (Enmascarada)";
        groqKeyStatus.style.color = "var(--color-success)";
        groqKeyStatus.style.display = "inline";
      } else {
        groqKeyInput.value = '';
        groqKeyStatus.textContent = "Sin configurar";
        groqKeyStatus.style.color = "var(--color-danger)";
        groqKeyStatus.style.display = "inline";
      }
    } catch (e) {
      console.error("Error al cargar la clave de Groq:", e);
    }
  }

  testGroqBtn.addEventListener('click', async () => {
    const apiKey = groqKeyInput.value.trim();
    if (!apiKey) {
      alert("Por favor, escribe una API Key para probar.");
      return;
    }

    testGroqBtn.disabled = true;
    testGroqBtn.textContent = "Probando...";
    groqKeyStatus.style.display = 'none';

    try {
      const res = await fetch('/api/config/test-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert(data.message || "¡Conexión exitosa con Groq!");
      groqKeyStatus.textContent = "Conexión exitosa";
      groqKeyStatus.style.color = "var(--color-success)";
      groqKeyStatus.style.display = "inline";
    } catch (err) {
      alert("Error en la prueba: " + err.message);
      groqKeyStatus.textContent = "Error de conexión";
      groqKeyStatus.style.color = "var(--color-danger)";
      groqKeyStatus.style.display = "inline";
    } finally {
      testGroqBtn.disabled = false;
      testGroqBtn.textContent = "Probar Conexión";
    }
  });

  groqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = groqKeyInput.value.trim();
    if (!apiKey || apiKey.includes('...')) {
      alert("Introduce una clave válida para guardar (no puede ser la enmascarada).");
      return;
    }

    try {
      const res = await fetch('/api/config/groq-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert("API Key de Groq guardada con éxito.");
      loadGroqConfig();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  });

  // --- CONFIGURACIÓN DE TAREA DE MANTENIMIENTO ---

  mantenimientoValueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = parseFloat(mantenimientoPointsInput.value);
    if (isNaN(value)) {
      alert("Por favor introduce un valor numérico válido.");
      return;
    }
    try {
      const res = await fetch('/api/config/mantenimiento-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        alert("Valor de mantenimiento guardado con éxito.");
        loadSettingsData();
      } else {
        alert("Error al guardar.");
      }
    } catch (err) {
      alert("Error de conexión.");
    }
  });

  // --- CONFIGURACIÓN DE CATEGORÍAS DE IMÁGENES ---

  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    if (!name) return;

    try {
      const res = await fetch('/api/config/image-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        categoryNameInput.value = '';
        loadSettingsData();
        alert("Título de imagen agregado.");
      } else {
        alert("Error al agregar.");
      }
    } catch (err) {
      alert("Error de conexión.");
    }
  });

  function renderCategoriesList(categories) {
    categoriesTableBody.innerHTML = '';
    if (categories.length === 0) {
      categoriesTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-secondary);">No hay títulos de imágenes configurados.</td></tr>';
      return;
    }

    categories.forEach(cat => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cat.name}</td>
        <td>
          <button type="button" class="btn btn-secondary delete-cat-btn" data-id="${cat.id}" style="padding:0.25rem 0.5rem; background:rgba(239, 68, 68, 0.15); border-color:rgba(239, 68, 68, 0.3); color:var(--color-danger);">
            Eliminar
          </button>
        </td>
      `;
      categoriesTableBody.appendChild(tr);
    });

    categoriesTableBody.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm("¿Está seguro de eliminar este título de imagen?")) return;
        const id = btn.getAttribute('data-id');
        try {
          const res = await fetch(`/api/config/image-categories/${id}`, { method: 'DELETE' });
          if (res.ok) {
            loadSettingsData();
            alert("Título eliminado.");
          } else {
            alert("Error al eliminar.");
          }
        } catch (err) {
          alert("Error al eliminar.");
        }
      });
    });
  }
});
