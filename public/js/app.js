document.addEventListener('DOMContentLoaded', () => {
  // Hamburger Menu elements
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const navLinksList = document.getElementById('navLinks');

  if (menuToggleBtn && navLinksList) {
    menuToggleBtn.addEventListener('click', () => {
      menuToggleBtn.classList.toggle('active');
      navLinksList.classList.toggle('active');
    });
  }

  // Navigation tabs switching
  const navLinks = document.querySelectorAll('.nav-link');
  const tabs = document.querySelectorAll('.spa-tab');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetTab = link.getAttribute('data-tab');
      if (!targetTab) return; // Salir si no es un link de tab (como logout)

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById(targetTab).classList.add('active');

      // Cerrar menú responsivo si está abierto
      if (menuToggleBtn && navLinksList) {
        menuToggleBtn.classList.remove('active');
        navLinksList.classList.remove('active');
      }

      // Si entramos a ajustes, cargar datos frescos
      if (targetTab === 'settingsTab' && window.loadSettingsData) {
        window.loadSettingsData();
      }
    });
  });

  // --- ELEMENTOS DEL DOM ---
  const loadingOverlay = document.getElementById('loadingOverlay');
  const logoutLink = document.getElementById('logoutLink');
  const themeSelector = document.getElementById('themeSelector');

  // Modales de Imágenes
  const imageViewerModal = document.getElementById('imageViewerModal');
  const imageViewerSource = document.getElementById('imageViewerSource');
  const imageViewerTitle = document.getElementById('imageViewerTitle');
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  const closeImageViewerBtn = document.getElementById('closeImageViewerBtn');
  const closeImageViewerBtn2 = document.getElementById('closeImageViewerBtn2');

  const closeViewer = () => {
    imageViewerModal.classList.remove('active');
    imageViewerSource.src = '';
  };
  if (closeImageViewerBtn) closeImageViewerBtn.addEventListener('click', closeViewer);
  if (closeImageViewerBtn2) closeImageViewerBtn2.addEventListener('click', closeViewer);
  if (imageViewerModal) {
    imageViewerModal.addEventListener('click', (e) => {
      if (e.target === imageViewerModal) closeViewer();
    });
  }

  window.openImageViewer = function(url, title = 'Visualizar Imagen') {
    imageViewerSource.src = url;
    imageViewerTitle.textContent = title;
    downloadImageBtn.href = url;
    downloadImageBtn.download = title.replace(/\s+/g, '_') + '.jpg';
    imageViewerModal.classList.add('active');
  };
  
  // Elementos del formulario
  const taskNumberInput = document.getElementById('taskNumber');
  const taskDateInput = document.getElementById('taskDate');
  const equipoSelect = document.getElementById('equipoSelect');
  const teamNamesInput = document.getElementById('teamNames');
  const ubicacionInput = document.getElementById('ubicacionLocalizacion');
  const generalDescriptionInput = document.getElementById('generalDescription');
  
  // Checkboxes
  const urgenteCheckbox = document.getElementById('urgenteCheckbox');
  const urgenteSection = document.getElementById('urgenteSection');
  const urgenteDescription = document.getElementById('urgenteDescription');
  
  const jointTaskCheckbox = document.getElementById('jointTaskCheckbox');
  const jointTaskSection = document.getElementById('jointTaskSection');
  const secondaryTeamSelect = document.getElementById('secondaryTeamSelect');
  const proportionSelect = document.getElementById('proportionSelect');
  
  const tareaMantenimientoCheckbox = document.getElementById('tareaMantenimientoCheckbox');
  const tareaMantenimientoSection = document.getElementById('tareaMantenimientoSection');
  const tareaMantenimientoDesc = document.getElementById('tareaMantenimientoDesc');
  const adicionalTareaMantenimiento = document.getElementById('adicionalTareaMantenimiento');
  
  const sinExitoCheckbox = document.getElementById('sinExitoCheckbox');
  const sinExitoSection = document.getElementById('sinExitoSection');
  const sinExitoMotivoSelect = document.getElementById('sinExitoMotivo');
  const sinExitoOtroDiv = document.getElementById('sinExitoOtroDiv');
  const sinExitoOtroInput = document.getElementById('sinExitoOtroInput');
  const direccionDiv = document.getElementById('direccionDiv');
  const direccionFachadaInput = document.getElementById('direccionFachada');
  const adicionalSinExitoInput = document.getElementById('adicionalSinExito');
  const visitasSinExitoInput = document.getElementById('visitasSinExito');

  const pointSectionsDiv = document.getElementById('pointSections');
  const addPointBtn = document.getElementById('addPointBtn');

  // Cable
  const cableCheckbox = document.getElementById('cableCheckbox');
  const cableExpenseSection = document.getElementById('cableExpenseSection');
  const cableInputsContainer = document.getElementById('cableInputsContainer');
  const totalCableMetersSpan = document.getElementById('totalCableMeters');
  const adicionalCableInput = document.getElementById('adicionalCable');

  // Materiales
  const gastoMaterialCheckbox = document.getElementById('gastoMaterialCheckbox');
  const materialExpenseSection = document.getElementById('materialExpenseSection');
  const materialInputsContainer = document.getElementById('materialInputsContainer');
  const adicionalMaterialInput = document.getElementById('adicionalMaterial');

  // Outputs
  const totalPointsDisplay = document.getElementById('totalPointsDisplay');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const generateCommentBtn = document.getElementById('generateCommentBtn');
  const generatedCommentDiv = document.getElementById('generatedComment');
  const excelCommentTextarea = document.getElementById('excelComment');
  const copyCommentBtn = document.getElementById('copyCommentBtn');

  // --- MODAL DE ALERTAS Y CONFIRMACIÓN ---
  const alertModal = document.getElementById('alertModal');
  const alertModalTitle = document.getElementById('alertModalTitle');
  const alertModalMessage = document.getElementById('alertModalMessage');
  const alertModalOkBtn = document.getElementById('alertModalOkBtn');

  const confirmLoadModal = document.getElementById('confirmLoadModal');
  const confirmLoadTitle = document.getElementById('confirmLoadTitle');
  const confirmLoadMessage = document.getElementById('confirmLoadMessage');
  const confirmLoadYesBtn = document.getElementById('confirmLoadYesBtn');
  const confirmLoadNoBtn = document.getElementById('confirmLoadNoBtn');

  function showMessage(title, message) {
    alertModalTitle.textContent = title;
    alertModalMessage.textContent = message;
    alertModal.classList.add('active');
  }
  alertModalOkBtn.addEventListener('click', () => alertModal.classList.remove('active'));

  let confirmPromiseResolver = null;
  function showConfirm(title, message) {
    confirmLoadTitle.textContent = title;
    confirmLoadMessage.textContent = message;
    confirmLoadModal.classList.add('active');
    return new Promise(resolve => {
      confirmPromiseResolver = resolve;
    });
  }
  confirmLoadYesBtn.addEventListener('click', () => {
    confirmLoadModal.classList.remove('active');
    if (confirmPromiseResolver) confirmPromiseResolver(true);
  });
  confirmLoadNoBtn.addEventListener('click', () => {
    confirmLoadModal.classList.remove('active');
    if (confirmPromiseResolver) confirmPromiseResolver(false);
  });

  // --- CONFIGURACIÓN DE SESIÓN Y USUARIO ---
  let currentUser = null;
  let catalogTeams = {};
  let catalogConcepts = {}; window.catalogConcepts = catalogConcepts;
  let catalogCables = [];
  let catalogMaterials = [];
  let commonConceptsList = [];

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (!data.loggedIn) {
        window.location.href = '/login';
        return;
      }

      currentUser = data.user;
      setupRoleVisibility(currentUser.role);
      applyTheme(currentUser.theme);
    } catch (err) {
      console.error(err);
      window.location.href = '/login';
    }
  }
  window.checkSession = checkSession;

  function setupRoleVisibility(role) {
    // Navbar links
    const reportsLink = document.getElementById('navReportsLink');
    const settingsLink = document.getElementById('navSettingsLink');

    if (role === 'admin') {
      reportsLink.style.display = 'block';
      settingsLink.style.display = 'block';
    } else if (role === 'coordinador' || role === 'gestor') {
      reportsLink.style.display = 'block';
      settingsLink.style.display = 'none';
    } else {
      reportsLink.style.display = 'none';
      settingsLink.style.display = 'none';
    }
  }

  // Cerrar Sesión
  logoutLink.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      alert("Error al cerrar sesión.");
    }
  });

  // --- CARGA DE CATÁLOGOS ---
  async function loadCatalogs() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();

      // Procesar equipos
      data.teams.forEach(team => {
        catalogTeams[team.id] = team;
      });

      // Procesar conceptos
      commonConceptsList = [];
      data.concepts.forEach(c => {
        catalogConcepts[c.id] = parseFloat(c.valor_puntos);
        commonConceptsList.push(c.id);
      });

      // Cargar valor de mantenimiento dinámico
      const maintVal = parseFloat(data.settings?.mantenimiento_value || 11.95);
      catalogConcepts['Tarea de Mantenimiento'] = maintVal;

      // Cargar configuración de imágenes dinámicas
      window.imageMaxSize = parseInt(data.settings?.image_max_size || 1600, 10);
      window.imageQuality = parseFloat(data.settings?.image_quality || 0.80);

      // Guardar categorías de imágenes en el estado global
      window.catalogImageCategories = data.imageCategories || [];

      // Procesar cables
      catalogCables = data.cables || [];
      
      // Procesar materiales
      catalogMaterials = data.materials || [];

      // Renderizar desplegables y estructuras dinámicas
      renderTeamSelects(data.teams);
      renderCableInputs();
      renderMaterialInputs();

      // Si el usuario es técnico, restringir su equipo
      if (currentUser.role === 'tecnico' && currentUser.team_id) {
        equipoSelect.value = currentUser.team_id;
        equipoSelect.disabled = true;
        equipoSelect.dispatchEvent(new Event('change'));
      }

    } catch (error) {
      console.error("Error al cargar configuraciones:", error);
      showMessage("Error", "No se pudo cargar la configuración de la base de datos.");
    }
  }

  function renderTeamSelects(teams) {
    let html = '<option value="">Selecciona un equipo</option>';
    teams.forEach(t => {
      html += `<option value="${t.id}">${t.id}</option>`;
    });
    equipoSelect.innerHTML = html;
    secondaryTeamSelect.innerHTML = html;
  }

  function renderCableInputs() {
    cableInputsContainer.innerHTML = '';
    catalogCables.forEach(cable => {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label class="form-label">${cable.nombre} (metros)</label>
        <div class="flex-row-gap">
          <input type="number" step="0.01" min="0" data-cable-id="${cable.id}" data-cable-points="${cable.puntos}" class="form-control cable-input" placeholder="0.00" style="flex-grow:1;">
          <button type="button" class="btn btn-secondary calc-cable-btn" style="padding:0.75rem 0.5rem; font-size:0.8rem;">Calc</button>
        </div>
      `;
      cableInputsContainer.appendChild(div);

      // Botón calculadora de cable
      div.querySelector('.calc-cable-btn').addEventListener('click', () => {
        const meters = prompt("Calculadora de Metros\nIntroduce el inicio y final del cable separados por coma (ej: 120,380):");
        if (meters) {
          const parts = meters.split(',').map(m => parseFloat(m.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const result = Math.abs(parts[1] - parts[0]);
            div.querySelector('.cable-input').value = result.toFixed(2);
            calculatePoints();
          } else {
            alert("Formato incorrecto. Ingresa dos números separados por coma.");
          }
        }
      });
    });
  }

  function renderMaterialInputs() {
    materialInputsContainer.innerHTML = '';
    catalogMaterials.forEach(m => {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="material-${m.id}" class="form-label">${m.id} (unidades)</label>
        <input type="number" id="material-${m.id}" data-material-id="${m.id}" class="form-control material-input" min="0" placeholder="0">
      `;
      materialInputsContainer.appendChild(div);
    });
  }

  // Manejar cambio en equipo seleccionado
  equipoSelect.addEventListener('change', () => {
    const selectedTeam = catalogTeams[equipoSelect.value];
    if (selectedTeam) {
      teamNamesInput.value = selectedTeam.integrantes || '';
    } else {
      teamNamesInput.value = '';
    }
  });

  // --- LÓGICA DE DETECCIÓN Y CARGA DE TAREAS EXISTENTES ---
  let isCheckingTask = false;
  taskNumberInput.addEventListener('change', async () => {
    const taskId = taskNumberInput.value.trim();
    if (!taskId || isCheckingTask) return;

    isCheckingTask = true;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();

      if (res.status === 403) {
        // Bloqueo de Técnico para tareas de otro equipo
        showMessage("Acceso Denegado", data.error);
        taskNumberInput.value = '';
        return;
      }

      if (data.found) {
        if (data.source === 'local') {
          const load = await showConfirm("¡Tarea Registrada!", "Esta tarea ya está registrada localmente. ¿Desea cargar sus datos?");
          if (load) {
            loadTaskForm(data.task);
          }
        } else if (data.source === 'backup') {
          const load = await showConfirm("Cargar de Respaldo", data.message);
          if (load) {
            // Importar tarea remota localmente
            loadTaskForm(data.task);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      isCheckingTask = false;
    }
  });

  function loadTaskForm(task) {
    resetForm(false); // Resetear sin limpiar el número de tarea

    taskNumberInput.value = task.id;
    taskDateInput.value = task.fecha;
    equipoSelect.value = task.equipo;
    equipoSelect.dispatchEvent(new Event('change'));
    teamNamesInput.value = task.integrantes;
    ubicacionInput.value = task.ubicacion || '';
    generalDescriptionInput.value = task.descripcionGeneral || task.descripcion_general || '';

    // Atributos
    urgenteCheckbox.checked = !!task.esUrgente?.activa;
    urgenteCheckbox.dispatchEvent(new Event('change'));
    if (task.esUrgente?.descripcion) urgenteDescription.value = task.esUrgente.descripcion;

    sinExitoCheckbox.checked = !!task.esSinExito;
    sinExitoCheckbox.dispatchEvent(new Event('change'));

    if (task.esSinExito) {
      if (task.sinExito) {
        const m = task.sinExito.motivo || '';
        if (commonConceptsList.includes(m) || ['Falta de permiso', 'Canalizado obstruido', 'Cliente cancela', 'Dirección errónea', 'Trabajo mal planteado en oficina'].includes(m)) {
          sinExitoMotivoSelect.value = m;
        } else {
          sinExitoMotivoSelect.value = 'Otros';
          sinExitoOtroInput.value = m.replace('Otros: ', '');
          sinExitoOtroDiv.style.display = 'block';
        }
        
        if (m === 'Falta de permiso de fachada') {
          sinExitoMotivoSelect.value = m;
          direccionDiv.style.display = 'block';
          direccionFachadaInput.value = task.sinExito.direccion || '';
        }

        adicionalSinExitoInput.value = task.sinExito.informacionAdicional || '';
        visitasSinExitoInput.value = task.sinExito.visitas || 1;
      }
    } else {
      // Cargar Mantenimiento
      tareaMantenimientoCheckbox.checked = !!task.tareaMantenimiento?.activa;
      tareaMantenimientoCheckbox.dispatchEvent(new Event('change'));
      tareaMantenimientoDesc.value = task.tareaMantenimiento?.descripcion || '';
      adicionalTareaMantenimiento.value = task.tareaMantenimiento?.informacionAdicional || '';

      // Cargar Puntos de Trabajo
      pointSectionsDiv.innerHTML = '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 1rem; color: var(--color-info);">Puntos de Trabajo</h2>';
      if (task.puntosTrabajo && task.puntosTrabajo.length > 0) {
        task.puntosTrabajo.forEach(p => addPointSection(p));
      } else {
        addPointSection();
      }

      // Cargar Gasto Material
      if (task.gastoMaterial && Object.keys(task.gastoMaterial).length > 0) {
        gastoMaterialCheckbox.checked = true;
        gastoMaterialCheckbox.dispatchEvent(new Event('change'));
        for (const matName in task.gastoMaterial) {
          const input = document.querySelector(`[data-material-id="${matName}"]`);
          if (input) input.value = task.gastoMaterial[matName];
        }
        adicionalMaterialInput.value = task.informacionAdicionalMaterial || '';
      }

      // Cargar Cables
      if (task.cableDesplegado && Object.keys(task.cableDesplegado).length > 0) {
        cableCheckbox.checked = true;
        cableCheckbox.dispatchEvent(new Event('change'));
        for (const cableId in task.cableDesplegado) {
          const input = document.querySelector(`[data-cable-id="${cableId}"]`);
          if (input) input.value = task.cableDesplegado[cableId];
        }
        adicionalCableInput.value = task.adicionalCable || '';
      }
    }

    // Cargar previsualización de datos de extracción si existen
    if (task.parsedData && window.loadParsedDataPreview) {
      window.currentParsedData = task.parsedData;
      window.loadParsedDataPreview(task.parsedData);
    }

    // Cargar fotos asociadas
    loadTaskImages(task.id);

    calculatePoints();
  }

  // --- MODAL DE COMENTARIO ---
  
  // Exclusividad y visibilidad de secciones por checkboxes
  urgenteCheckbox.addEventListener('change', () => {
    urgenteSection.style.display = urgenteCheckbox.checked ? 'block' : 'none';
  });

  jointTaskCheckbox.addEventListener('change', () => {
    jointTaskSection.style.display = jointTaskCheckbox.checked ? 'grid' : 'none';
    calculatePoints();
  });
  proportionSelect.addEventListener('change', calculatePoints);

  tareaMantenimientoCheckbox.addEventListener('change', () => {
    tareaMantenimientoSection.style.display = tareaMantenimientoCheckbox.checked ? 'block' : 'none';
    calculatePoints();
  });

  gastoMaterialCheckbox.addEventListener('change', () => {
    materialExpenseSection.style.display = gastoMaterialCheckbox.checked ? 'block' : 'none';
  });

  cableCheckbox.addEventListener('change', () => {
    cableExpenseSection.style.display = cableCheckbox.checked ? 'block' : 'none';
    calculatePoints();
  });

  sinExitoCheckbox.addEventListener('change', () => {
    const isChecked = sinExitoCheckbox.checked;
    sinExitoSection.style.display = isChecked ? 'block' : 'none';
    toggleFormDisabledForSinExito(isChecked);
  });

  sinExitoMotivoSelect.addEventListener('change', () => {
    const val = sinExitoMotivoSelect.value;
    sinExitoOtroDiv.style.display = val === 'Otros' ? 'block' : 'none';
    direccionDiv.style.display = val === 'Falta de permiso de fachada' ? 'block' : 'none';
  });

  function toggleFormDisabledForSinExito(disable) {
    if (disable) {
      tareaMantenimientoCheckbox.checked = false;
      tareaMantenimientoCheckbox.disabled = true;
      tareaMantenimientoSection.style.display = 'none';
      
      gastoMaterialCheckbox.checked = false;
      gastoMaterialCheckbox.disabled = true;
      materialExpenseSection.style.display = 'none';
      
      cableCheckbox.checked = false;
      cableCheckbox.disabled = true;
      cableExpenseSection.style.display = 'none';
      
      pointSectionsDiv.innerHTML = '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 1rem; color: var(--color-info);">Puntos de Trabajo</h2><p style="color: var(--text-secondary); font-size: 0.9rem;">No aplicable en tareas SIN ÉXITO.</p>';
      addPointBtn.disabled = true;
    } else {
      tareaMantenimientoCheckbox.disabled = false;
      gastoMaterialCheckbox.disabled = false;
      cableCheckbox.disabled = false;
      addPointBtn.disabled = false;
      pointSectionsDiv.innerHTML = '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 1rem; color: var(--color-info);">Puntos de Trabajo</h2>';
      addPointSection();
    }
    calculatePoints();
  }

  // --- LÓGICA DE PUNTOS DE TRABAJO DINÁMICOS ---
  let pointCounter = 0;
  function addPointSection(pointData = null) {
    pointCounter++;
    const pointId = `point-item-${pointCounter}`;
    const div = document.createElement('div');
    div.id = pointId;
    div.className = 'glass-panel point-item animated-fade-in';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 1rem;">
        <strong style="color: var(--color-info);">Punto ${pointCounter}</strong>
        <button type="button" class="btn btn-danger remove-point-btn" style="padding: 0.25rem 0.5rem; font-size:0.75rem;">Eliminar Punto</button>
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación del Punto</label>
        <select class="form-control point-location">
          <option value="">Selecciona ubicación</option>
          <option value="poste">poste</option>
          <option value="arqueta">arqueta</option>
          <option value="fachada">fachada</option>
          <option value="riti">riti</option>
          <option value="interior">interior</option>
          <option value="camara">camara</option>
          <option value="monolito">monolito</option>
          <option value="otros">otros</option>
        </select>
      </div>
      <div class="concepts-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-top: 1rem;">
        <!-- Conceptos de este punto -->
      </div>
      <button type="button" class="btn btn-secondary add-concept-btn" style="width: 100%; margin-top:1rem; padding: 0.5rem; font-size:0.8rem;">
        + Agregar Concepto
      </button>
      
      <!-- Botones de Acción para Nota e Imágenes -->
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button type="button" class="btn btn-secondary toggle-comment-btn" style="flex: 1; padding: 0.35rem; font-size: 0.75rem; background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); color: var(--color-warning);">
          📝 Nota/Comentario
        </button>
        <button type="button" class="btn btn-secondary toggle-images-btn" style="flex: 1; padding: 0.35rem; font-size: 0.75rem; background: rgba(0, 237, 255, 0.05); border-color: rgba(0, 237, 255, 0.2); color: var(--color-info);">
          📸 Fotos / Imágenes
        </button>
      </div>

      <!-- Contenedor del Comentario (Oculto por defecto) -->
      <div class="comment-container-el" style="display: none; margin-top: 1rem;">
        <label class="form-label" style="font-size:0.8rem; display:block; margin-bottom:0.25rem;">Comentario del Punto</label>
        <input type="text" class="form-control point-comment" style="font-size:0.8rem; padding:0.4rem; background:rgba(0,0,0,0.25); color:#fff; border:1px solid var(--border-color);" placeholder="Comentario opcional para este punto (ej. Fusiones CTO 3)...">
      </div>
    `;

    // Renderizar área de imágenes para este punto
    const imagesArea = document.createElement('div');
    imagesArea.className = 'point-images-area';
    imagesArea.style.marginTop = '1.5rem';
    imagesArea.style.borderTop = '1px solid var(--border-color)';
    imagesArea.style.paddingTop = '1rem';
    imagesArea.style.display = 'none';
    
    const catOptions = (window.catalogImageCategories || [])
      .map(cat => `<option value="${cat.name}">${cat.name}</option>`)
      .join('');

    imagesArea.innerHTML = `
      <label class="form-label">Imágenes del Punto</label>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select class="form-control point-image-category" style="font-size:0.8rem; padding:0.4rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border-color);">
          <option value="">-- Seleccionar Título --</option>
          ${catOptions}
        </select>
        <button type="button" class="btn btn-secondary add-images-btn" style="padding:0.4rem 0.8rem; font-size:0.8rem; flex-shrink:0; background:rgba(0,237,255,0.1); border-color:var(--color-info); color:var(--color-info);">
          Subir Foto
        </button>
      </div>
      <input type="file" class="point-image-input" accept="image/*" style="display:none;">
      <div class="thumbnails-container" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem;">
        <!-- Aquí irán las miniaturas -->
      </div>
    `;
    div.appendChild(imagesArea);

    const fileInput = imagesArea.querySelector('.point-image-input');
    const uploadBtn = imagesArea.querySelector('.add-images-btn');
    const categorySelect = imagesArea.querySelector('.point-image-category');
    const thumbnailsContainer = imagesArea.querySelector('.thumbnails-container');

    uploadBtn.addEventListener('click', () => {
      const taskId = taskNumberInput.value.trim();
      if (!taskId) {
        alert("Por favor, introduce el número de tarea (ID) en la cabecera antes de subir imágenes.");
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const taskId = taskNumberInput.value.trim();
      const currentPointIndex = Array.from(pointSectionsDiv.querySelectorAll('.point-item')).indexOf(div) + 1;
      const category = categorySelect.value;

      // Crear placeholder de carga
      const loadingPlaceholder = document.createElement('div');
      loadingPlaceholder.textContent = "Subiendo...";
      loadingPlaceholder.style.fontSize = '0.75rem';
      loadingPlaceholder.style.color = 'var(--color-info)';
      thumbnailsContainer.appendChild(loadingPlaceholder);

      try {
        // Comprimir en cliente
        const compressedFile = await compressImage(file);

        // Subir
        const formData = new FormData();
        formData.append('image', compressedFile);
        if (category) {
          formData.append('title', category);
        }

        const res = await fetch(`/api/tasks/${taskId}/points/${currentPointIndex}/images`, {
          method: 'POST',
          body: formData
        });
        const resData = await res.json();

        if (!res.ok) throw new Error(resData.error);

        // Quitar placeholder e insertar thumbnail
        loadingPlaceholder.remove();
        renderThumbnail(thumbnailsContainer, resData.image, taskId, currentPointIndex);
      } catch (err) {
        loadingPlaceholder.remove();
        alert("Error al subir imagen: " + err.message);
      } finally {
        fileInput.value = '';
      }
    });

    const toggleCommentBtn = div.querySelector('.toggle-comment-btn');
    const toggleImagesBtn = div.querySelector('.toggle-images-btn');
    const commentContainerEl = div.querySelector('.comment-container-el');

    toggleCommentBtn.addEventListener('click', () => {
      const isHidden = commentContainerEl.style.display === 'none';
      commentContainerEl.style.display = isHidden ? 'block' : 'none';
      toggleCommentBtn.style.background = isHidden ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.05)';
      toggleCommentBtn.style.borderColor = isHidden ? 'var(--color-warning)' : 'rgba(245, 158, 11, 0.2)';
    });

    toggleImagesBtn.addEventListener('click', () => {
      const isHidden = imagesArea.style.display === 'none';
      imagesArea.style.display = isHidden ? 'block' : 'none';
      toggleImagesBtn.style.background = isHidden ? 'rgba(0, 237, 255, 0.2)' : 'rgba(0, 237, 255, 0.05)';
      toggleImagesBtn.style.borderColor = isHidden ? 'var(--color-info)' : 'rgba(0, 237, 255, 0.2)';
    });

    pointSectionsDiv.appendChild(div);

    const locationSelect = div.querySelector('.point-location');
    const conceptsContainer = div.querySelector('.concepts-container');
    const addConceptBtnEl = div.querySelector('.add-concept-btn');
    const removePointBtn = div.querySelector('.remove-point-btn');

    removePointBtn.addEventListener('click', () => {
      div.remove();
      reindexPoints();
      calculatePoints();
    });

    addConceptBtnEl.addEventListener('click', () => addConceptRow(conceptsContainer));

    if (pointData) {
      locationSelect.value = pointData.ubicacion;
      const commentInput = div.querySelector('.point-comment');
      if (commentInput) {
        commentInput.value = pointData.comentario || '';
        if (pointData.comentario) {
          commentContainerEl.style.display = 'block';
          toggleCommentBtn.style.background = 'rgba(245, 158, 11, 0.2)';
          toggleCommentBtn.style.borderColor = 'var(--color-warning)';
        }
      }
      if (pointData.conceptos && pointData.conceptos.length > 0) {
        pointData.conceptos.forEach(c => addConceptRow(conceptsContainer, c));
      } else {
        addConceptRow(conceptsContainer);
      }
    } else {
      addConceptRow(conceptsContainer);
    }
  }
  addPointBtn.addEventListener('click', () => addPointSection());

  function reindexPoints() {
    const pointItems = pointSectionsDiv.querySelectorAll('.point-item');
    pointItems.forEach((item, index) => {
      const title = item.querySelector('strong');
      if (title) title.textContent = `Punto ${index + 1}`;
    });
    pointCounter = pointItems.length;
  }

  function addConceptRow(container, conceptData = null) {
    const div = document.createElement('div');
    div.className = 'flex-row-gap';
    
    let optionsHtml = '<option value="">Selecciona concepto</option>';
    commonConceptsList.forEach(c => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    optionsHtml += '<option value="Otro">Otro (Especificar)</option>';

    div.innerHTML = `
      <select class="form-control concept-select" style="flex-grow:2;">
        ${optionsHtml}
      </select>
      <input type="text" class="form-control concept-custom-name" placeholder="Especifica concepto..." style="display:none; flex-grow:2;">
      <input type="number" class="form-control concept-quantity" value="1" min="1" style="width:70px;">
      <button type="button" class="btn btn-danger remove-concept-btn" style="padding:0.75rem 0.5rem; font-size:0.8rem;">X</button>
    `;

    container.appendChild(div);

    const select = div.querySelector('.concept-select');
    const customInput = div.querySelector('.concept-custom-name');
    const qty = div.querySelector('.concept-quantity');
    const removeBtn = div.querySelector('.remove-concept-btn');

    select.addEventListener('change', () => {
      if (select.value === 'Otro') {
        select.style.display = 'none';
        customInput.style.display = 'block';
      }
      calculatePoints();
    });

    customInput.addEventListener('change', calculatePoints);
    qty.addEventListener('input', calculatePoints);
    removeBtn.addEventListener('click', () => {
      div.remove();
      calculatePoints();
    });

    if (conceptData) {
      if (commonConceptsList.includes(conceptData.nombre)) {
        select.value = conceptData.nombre;
      } else {
        select.value = 'Otro';
        select.style.display = 'none';
        customInput.style.display = 'block';
        customInput.value = conceptData.nombre;
      }
      qty.value = conceptData.cantidad || 1;
    }
  }

  // --- CÁLCULO DE PUNTOS TOTALES ---
  function calculatePoints() {
    let total = 0;
    let totalCable = 0;

    if (!sinExitoCheckbox.checked) {
      // 1. Tarea Mantenimiento base
      if (tareaMantenimientoCheckbox.checked) {
        total += catalogConcepts['Tarea de Mantenimiento'] || 11.95;
      }

      // 2. Sumar conceptos de puntos de trabajo
      const pointItems = pointSectionsDiv.querySelectorAll('.point-item');
      pointItems.forEach(item => {
        const rows = item.querySelectorAll('.concepts-container > div');
        rows.forEach(row => {
          const select = row.querySelector('.concept-select');
          const customInput = row.querySelector('.concept-custom-name');
          const qtyVal = parseInt(row.querySelector('.concept-quantity').value, 10) || 0;

          let name = '';
          if (select.style.display !== 'none') {
            name = select.value;
          } else {
            name = customInput.value.trim();
          }

          if (name && qtyVal > 0) {
            const unitPoints = catalogConcepts[name] || 0;
            total += unitPoints * qtyVal;
          }
        });
      });

      // 3. Sumar cables
      if (cableCheckbox.checked) {
        const inputs = cableInputsContainer.querySelectorAll('.cable-input');
        inputs.forEach(input => {
          const m = parseFloat(input.value) || 0;
          const factor = parseFloat(input.dataset.cablePoints) || 0;
          total += m * factor;
          totalCable += m;
        });
      }
    }

    // Proporción compartida
    if (jointTaskCheckbox.checked) {
      const [primaryPercent] = proportionSelect.value.split('-').map(Number);
      total = total * (primaryPercent / 100);
    }

    totalPointsDisplay.textContent = total.toFixed(2);
    totalCableMetersSpan.textContent = `${totalCable.toFixed(2)} m`;
  }

  // Escuchar inputs globales para recálculos
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('cable-input') || e.target.classList.contains('concept-quantity')) {
      calculatePoints();
    }
  });

  // --- GUARDADO DE TAREA ---
  saveTaskBtn.addEventListener('click', async () => {
    const taskId = taskNumberInput.value.trim();
    if (!taskId) {
      showMessage("Error", 'El "Número de Tarea" es obligatorio para guardar.');
      return;
    }

    const payload = getTaskPayload();
    if (!payload.equipo) {
      showMessage("Error", 'Debes seleccionar un equipo.');
      return;
    }

    saveTaskBtn.disabled = true;
    saveTaskBtn.textContent = 'Guardando en Base de Datos...';

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMessage("Éxito", 'Tarea guardada localmente y en cola de respaldo.');
      saveTaskBtn.classList.replace('btn-primary', 'btn-secondary');
      saveTaskBtn.textContent = '¡Guardado con Éxito!';
      
      setTimeout(() => {
        saveTaskBtn.classList.replace('btn-secondary', 'btn-primary');
        saveTaskBtn.textContent = 'Guardar Tarea en Base de Datos';
        saveTaskBtn.disabled = false;
      }, 3000);

    } catch (err) {
      showMessage("Error", "Error al guardar: " + err.message);
      saveTaskBtn.textContent = 'Error al Guardar';
      saveTaskBtn.disabled = false;
    }
  });

  function getTaskPayload() {
    const taskId = taskNumberInput.value.trim();
    const payload = {
      id: taskId,
      fecha: taskDateInput.value,
      equipo: equipoSelect.value,
      integrantes: teamNamesInput.value.trim(),
      ubicacion: ubicacionInput.value.trim(),
      descripcion_general: generalDescriptionInput.value.trim(),
      esSinExito: sinExitoCheckbox.checked,
      puntosTotalesEstimados: parseFloat(totalPointsDisplay.textContent) || 0,
      porEncargo: {
        activa: false,
        descripcion: ""
      },
      esUrgente: {
        activa: urgenteCheckbox.checked,
        descripcion: urgenteDescription.value.trim()
      },
      // Adjuntar datos de parsing IA si existen
      parsedData: window.currentParsedData
    };

    // Copiar integrantes
    const selectedTeam = catalogTeams[payload.equipo];
    if (selectedTeam) {
      // Replicar campos Integrante1, Integrante2...
      const members = selectedTeam.integrantes.split(',').map(m => m.trim());
      members.forEach((m, idx) => {
        payload[`Integrante${idx+1}`] = m;
      });
    }

    if (payload.esSinExito) {
      let mot = sinExitoMotivoSelect.value;
      if (mot === 'Otros') mot = `Otros: ${sinExitoOtroInput.value.trim()}`;
      
      payload.sinExito = {
        motivo: mot,
        visitas: parseInt(visitasSinExitoInput.value, 10) || 1,
        direccion: sinExitoMotivoSelect.value === 'Falta de permiso de fachada' ? direccionFachadaInput.value.trim() : null,
        informacionAdicional: adicionalSinExitoInput.value.trim()
      };
    } else {
      payload.tareaMantenimiento = {
        activa: tareaMantenimientoCheckbox.checked,
        descripcion: tareaMantenimientoDesc.value.trim(),
        informacionAdicional: adicionalTareaMantenimiento.value.trim()
      };

      // Puntos de trabajo
      payload.puntosTrabajo = [];
      const points = pointSectionsDiv.querySelectorAll('.point-item');
      points.forEach((item, index) => {
        const ptCommentInput = item.querySelector('.point-comment');
        const pointObj = {
          id: index + 1,
          ubicacion: item.querySelector('.point-location').value,
          comentario: ptCommentInput ? ptCommentInput.value.trim() : '',
          conceptos: []
        };

        const rows = item.querySelectorAll('.concepts-container > div');
        rows.forEach(row => {
          const select = row.querySelector('.concept-select');
          const customInput = row.querySelector('.concept-custom-name');
          const qty = parseInt(row.querySelector('.concept-quantity').value, 10) || 0;

          let name = select.style.display !== 'none' ? select.value : customInput.value.trim();
          if (name && qty > 0) {
            const pts = (catalogConcepts[name] || 0) * qty;
            pointObj.conceptos.push({ nombre: name, cantidad: qty, puntos: pts });
          }
        });
        payload.puntosTrabajo.push(pointObj);
      });

      // Materiales
      payload.gastoMaterial = {};
      if (gastoMaterialCheckbox.checked) {
        const matInputs = materialInputsContainer.querySelectorAll('.material-input');
        matInputs.forEach(input => {
          const qty = parseInt(input.value, 10) || 0;
          if (qty > 0) {
            payload.gastoMaterial[input.dataset.materialId] = qty;
          }
        });
        payload.informacionAdicionalMaterial = adicionalMaterialInput.value.trim();
      }

      // Cables
      payload.cableDesplegado = {};
      if (cableCheckbox.checked) {
        const cableInputs = cableInputsContainer.querySelectorAll('.cable-input');
        cableInputs.forEach(input => {
          const m = parseFloat(input.value) || 0;
          if (m > 0) {
            payload.cableDesplegado[input.dataset.cableId] = m;
          }
        });
      }
    }

    // Tarea conjunta
    payload.isJointTask = jointTaskCheckbox.checked;
    if (payload.isJointTask) {
      payload.jointTaskDetails = {
        secondaryTeam: secondaryTeamSelect.value,
        proportion: proportionSelect.value
      };
    }

    return payload;
  }

  // --- GENERACIÓN DE COMENTARIOS ---
  generateCommentBtn.addEventListener('click', () => {
    const taskId = taskNumberInput.value.trim();
    const taskDate = taskDateInput.value;
    if (!taskId || !taskDate || !equipoSelect.value) {
      showMessage("Error", 'Completa el Número de Tarea, Fecha y Equipo para poder generar el comentario.');
      return;
    }

    const formattedDate = taskDate.split('-').reverse().join('/');
    let comment = `${taskId}-${formattedDate}#${teamNamesInput.value.trim()} ${equipoSelect.value}.\n`;

    if (urgenteCheckbox.checked) comment += "--- TAREA URGENTE ---\n";

    if (generalDescriptionInput.value.trim()) {
      comment += `${generalDescriptionInput.value.trim()}\n`;
    }
    comment += `${ubicacionInput.value.trim()}\n---\n`;

    if (sinExitoCheckbox.checked) {
      let mot = sinExitoMotivoSelect.value;
      if (mot === 'Otros') mot += `: ${sinExitoOtroInput.value.trim()}`;
      const dir = sinExitoMotivoSelect.value === 'Falta de permiso de fachada' ? ` (${direccionFachadaInput.value.trim()})` : '';
      comment += `SIN EXITO (No Iniciada)\nVisita N° ${visitasSinExitoInput.value}\nMotivo: ${mot}${dir}\n`;
      if (adicionalSinExitoInput.value.trim()) comment += `Información Adicional: ${adicionalSinExitoInput.value.trim()}\n`;
    } else {
      if (tareaMantenimientoCheckbox.checked) {
        comment += `Tarea de Mantenimiento: ${tareaMantenimientoDesc.value.trim() || 'Se realiza mantenimiento.'}\n`;
        if (adicionalTareaMantenimiento.value.trim()) comment += `Información Adicional: ${adicionalTareaMantenimiento.value.trim()}\n`;
        comment += `---\n`;
      }

      // Puntos
      const points = pointSectionsDiv.querySelectorAll('.point-item');
      points.forEach((item, index) => {
        const loc = item.querySelector('.point-location').value;
        const ptCommentInput = item.querySelector('.point-comment');
        const ptComment = ptCommentInput ? ptCommentInput.value.trim() : '';

        let ptContent = `Punto ${index + 1}${loc ? ` en ${loc}` : ''}\n`;
        let details = false;

        const rows = item.querySelectorAll('.concepts-container > div');
        rows.forEach(row => {
          const select = row.querySelector('.concept-select');
          const customInput = row.querySelector('.concept-custom-name');
          const qty = parseInt(row.querySelector('.concept-quantity').value, 10) || 0;

          const name = select.style.display !== 'none' ? select.value : customInput.value.trim();
          if (name && qty > 0) {
            ptContent += `${qty} ${name}\n`;
            details = true;
          }
        });

        if (ptComment) {
          ptContent += `Comentario: ${ptComment}\n`;
          details = true;
        }

        if (details) comment += `${ptContent}---\n`;
      });

      // Materiales
      if (gastoMaterialCheckbox.checked) {
        const mats = [];
        const matInputs = materialInputsContainer.querySelectorAll('.material-input');
        matInputs.forEach(input => {
          const q = parseInt(input.value, 10) || 0;
          if (q > 0) mats.push(`${q} ${input.dataset.materialId}`);
        });

        if (mats.length > 0 || adicionalMaterialInput.value.trim()) {
          comment += `Gasto Material:\n`;
          mats.forEach(m => comment += `${m}\n`);
          if (adicionalMaterialInput.value.trim()) comment += `Información Adicional: ${adicionalMaterialInput.value.trim()}\n`;
          comment += `---\n`;
        }
      }

      // Cables
      if (cableCheckbox.checked) {
        const cables = [];
        let totalCable = 0;
        const cableInputs = cableInputsContainer.querySelectorAll('.cable-input');
        
        cableInputs.forEach(input => {
          const m = parseFloat(input.value) || 0;
          if (m > 0) {
            const cInfo = catalogCables.find(c => c.id === input.dataset.cableId);
            if (cInfo) {
              cables.push(`${m.toFixed(2)} metros de ${cInfo.nombre.toLowerCase()}`);
              totalCable += m;
            }
          }
        });

        if (cables.length > 0) {
          comment += `Despliegue de Cable:\n`;
          cables.forEach(c => comment += `${c}\n`);
          if (adicionalCableInput.value.trim()) comment += `Información Adicional: ${adicionalCableInput.value.trim()}\n`;
          comment += `Total de cable desplegado: ${totalCable.toFixed(2)} metros\n`;
          comment += `---\n`;
        }
      }
    }

    generatedCommentDiv.textContent = comment;
    excelCommentTextarea.value = getExcelSummaryText();
    copyCommentBtn.style.display = 'inline-flex';
  });

  function getExcelSummaryText() {
    let summary = '';
    const pointsTotal = totalPointsDisplay.textContent;

    if (urgenteCheckbox.checked) summary += "--- TAREA URGENTE ---\n";

    if (sinExitoCheckbox.checked) {
      let mot = sinExitoMotivoSelect.value;
      if (mot === 'Otros') mot += `: ${sinExitoOtroInput.value.trim()}`;
      const dir = sinExitoMotivoSelect.value === 'Falta de permiso de fachada' ? `\nDirección: ${direccionFachadaInput.value.trim()}` : '';
      summary += `TAREA SIN ÉXITO (No Iniciada)\nVisita N° ${visitasSinExitoInput.value}\nMotivo: ${mot}${dir}`;
      if (adicionalSinExitoInput.value.trim()) summary += `\nInformación Adicional: ${adicionalSinExitoInput.value.trim()}`;
    } else {
      const items = [];
      
      if (tareaMantenimientoCheckbox.checked) {
        items.push(`1 - Tarea de Mantenimiento (${(catalogConcepts['Tarea de Mantenimiento'] || 11.95).toFixed(2)} pts)`);
      }

      // Agrupar conceptos idénticos para el resumen de Excel
      const conceptGroup = {};
      const points = pointSectionsDiv.querySelectorAll('.point-item');
      points.forEach(item => {
        const rows = item.querySelectorAll('.concepts-container > div');
        rows.forEach(row => {
          const select = row.querySelector('.concept-select');
          const customInput = row.querySelector('.concept-custom-name');
          const qty = parseInt(row.querySelector('.concept-quantity').value, 10) || 0;

          const name = select.style.display !== 'none' ? select.value : customInput.value.trim();
          if (name && qty > 0) {
            conceptGroup[name] = (conceptGroup[name] || 0) + qty;
          }
        });
      });

      for (const name in conceptGroup) {
        const q = conceptGroup[name];
        const pts = (catalogConcepts[name] || 0) * q;
        items.push(`${q} - ${name} (${pts.toFixed(2)} pts)`);
      }

      // Cables
      if (cableCheckbox.checked) {
        const cableInputs = cableInputsContainer.querySelectorAll('.cable-input');
        cableInputs.forEach(input => {
          const m = parseFloat(input.value) || 0;
          if (m > 0) {
            const cInfo = catalogCables.find(c => c.id === input.dataset.cableId);
            if (cInfo) {
              const pts = m * cInfo.puntos;
              items.push(`${m.toFixed(2)}m - ${cInfo.nombre} (${pts.toFixed(2)} pts)`);
            }
          }
        });
      }

      summary += items.join('\n');
      
      const totalCable = parseFloat(totalCableMetersSpan.textContent) || 0;
      if (totalCable > 0) {
        summary += `\nTotal de cable desplegado: ${totalCable.toFixed(2)} metros`;
      }

      summary += `\n\nTotal estimado: ${pointsTotal} puntos`;

      if (jointTaskCheckbox.checked) {
        const text = proportionSelect.options[proportionSelect.selectedIndex].text;
        summary += `\n(Tarea en conjunto - Porción del equipo: ${text})`;
      }
    }

    if (generalDescriptionInput.value.trim()) {
      summary += `\n\nObservaciones Finales: ${generalDescriptionInput.value.trim()}`;
    }

    return summary;
  }

  // Copiar y Compartir
  copyCommentBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedCommentDiv.textContent)
      .then(() => alert("¡Comentario copiado al portapapeles!"))
      .catch(err => alert("Error al copiar."));
  });

  document.getElementById('sendWhatsappCommentBtn').addEventListener('click', () => {
    const txt = generatedCommentDiv.textContent;
    if (!txt || txt === 'El comentario aparecerá aquí una vez lo generes.') {
      alert("Primero genera el comentario.");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  });

  document.getElementById('sendWhatsappExcelBtn').addEventListener('click', () => {
    const txt = excelCommentTextarea.value;
    if (!txt) {
      alert("Primero genera el comentario.");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  });

  document.getElementById('copyToKeepBtn').addEventListener('click', () => {
    const txt = excelCommentTextarea.value;
    if (!txt) {
      alert("Primero genera el comentario.");
      return;
    }
    navigator.clipboard.writeText(txt)
      .then(() => alert("¡Resumen para Keep copiado al portapapeles!"))
      .catch(err => alert("Error al copiar."));
  });

  // --- RESET FORM ---
  function resetForm(clearTaskId = true) {
    if (clearTaskId) taskNumberInput.value = '';
    generalDescriptionInput.value = '';
    ubicacionInput.value = '';

    // Checkboxes
    urgenteCheckbox.checked = false;
    urgenteCheckbox.dispatchEvent(new Event('change'));
    urgenteDescription.value = '';

    jointTaskCheckbox.checked = false;
    jointTaskCheckbox.dispatchEvent(new Event('change'));

    tareaMantenimientoCheckbox.checked = false;
    tareaMantenimientoCheckbox.dispatchEvent(new Event('change'));
    tareaMantenimientoDesc.value = '';
    adicionalTareaMantenimiento.value = '';

    sinExitoCheckbox.checked = false;
    sinExitoCheckbox.dispatchEvent(new Event('change'));

    // Limpiar puntos
    pointSectionsDiv.innerHTML = '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 1rem; color: var(--color-info);">Puntos de Trabajo</h2>';
    pointCounter = 0;
    addPointSection();

    // Limpiar material
    gastoMaterialCheckbox.checked = false;
    gastoMaterialCheckbox.dispatchEvent(new Event('change'));
    document.querySelectorAll('.material-input').forEach(i => i.value = '');
    adicionalMaterialInput.value = '';

    // Limpiar cable
    cableCheckbox.checked = false;
    cableCheckbox.dispatchEvent(new Event('change'));
    document.querySelectorAll('.cable-input').forEach(i => i.value = '');
    adicionalCableInput.value = '';

    // Limpiar IA parser
    if (window.clearParsedData) window.clearParsedData();

    calculatePoints();
  }

  // Establecer fecha por defecto en formulario
  taskDateInput.value = new Date().toISOString().split('T')[0];

  // --- HELPER DE COMPRESIÓN DE IMÁGENES EN CLIENTE ---
  function compressImage(file, maxWidth = window.imageMaxSize || 1600, maxHeight = window.imageMaxSize || 1600, quality = window.imageQuality || 0.80) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              reject(new Error("Error al comprimir imagen."));
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // --- RENDER DE MINIATURAS ---
  function renderThumbnail(container, imgData, taskId, pointId) {
    const thumb = document.createElement('div');
    thumb.style.position = 'relative';
    thumb.style.width = '70px';
    thumb.style.height = '70px';
    thumb.style.borderRadius = 'var(--radius-sm)';
    thumb.style.border = '1px solid var(--border-color)';
    thumb.style.overflow = 'hidden';
    thumb.style.background = `url(${imgData.image_path}) center/cover no-repeat`;
    thumb.style.cursor = 'pointer';
    
    thumb.addEventListener('click', () => {
      window.openImageViewer(imgData.image_path, imgData.title || 'Imagen de Punto');
    });

    if (imgData.title) {
      thumb.title = imgData.title;
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.innerHTML = '&times;';
    delBtn.style.position = 'absolute';
    delBtn.style.top = '0';
    delBtn.style.right = '0';
    delBtn.style.background = 'rgba(239, 68, 68, 0.8)';
    delBtn.style.color = '#fff';
    delBtn.style.border = 'none';
    delBtn.style.borderRadius = '0 0 0 var(--radius-sm)';
    delBtn.style.cursor = 'pointer';
    delBtn.style.padding = '2px 6px';
    delBtn.style.fontSize = '12px';
    delBtn.style.fontWeight = 'bold';

    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`¿Desea eliminar la imagen "${imgData.title || 'sin título'}"?`)) return;
      try {
        const res = await fetch(`/api/tasks/${taskId}/images/${imgData.id}`, { method: 'DELETE' });
        if (res.ok) {
          thumb.remove();
        } else {
          alert("Error al eliminar la imagen.");
        }
      } catch (err) {
        alert("Error al eliminar.");
      }
    });

    thumb.appendChild(delBtn);
    
    if (imgData.title) {
      const label = document.createElement('div');
      label.textContent = imgData.title;
      label.style.position = 'absolute';
      label.style.bottom = '0';
      label.style.left = '0';
      label.style.right = '0';
      label.style.background = 'rgba(0,0,0,0.6)';
      label.style.color = '#fff';
      label.style.fontSize = '8px';
      label.style.textAlign = 'center';
      label.style.whiteSpace = 'nowrap';
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
      thumb.appendChild(label);
    }

    container.appendChild(thumb);
  }

  // --- CARGAR IMÁGENES ASOCIADAS A LA TAREA ---
  async function loadTaskImages(taskId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/images`);
      if (!res.ok) throw new Error();
      const images = await res.json();
      
      images.forEach(img => {
        const pointItems = pointSectionsDiv.querySelectorAll('.point-item');
        const pointCard = pointItems[img.point_id - 1];
        if (pointCard) {
          const thumbnailsContainer = pointCard.querySelector('.thumbnails-container');
          if (thumbnailsContainer) {
            renderThumbnail(thumbnailsContainer, img, taskId, img.point_id);
            
            // Mostrar contenedor e iluminar botón si tiene imágenes cargadas
            const imagesArea = pointCard.querySelector('.point-images-area');
            const toggleImagesBtn = pointCard.querySelector('.toggle-images-btn');
            if (imagesArea) imagesArea.style.display = 'block';
            if (toggleImagesBtn) {
              toggleImagesBtn.style.background = 'rgba(0, 237, 255, 0.2)';
              toggleImagesBtn.style.borderColor = 'var(--color-info)';
            }
          }
        }
      });
    } catch (e) {
      console.error("Error al cargar imágenes de la tarea:", e);
    }
  }

  // Exponer buscar tarea por id globalmente para orders.js
  window.buscarTareaPorId = async function(taskId) {
    if (!taskId || isCheckingTask) return;
    isCheckingTask = true;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();

      if (res.status === 403) {
        showMessage("Acceso Denegado", data.error);
        taskNumberInput.value = '';
        return;
      }

      if (data.found) {
        loadTaskForm(data.task);
      } else {
        showMessage("No encontrada", "No se encontró la tarea en el servidor local ni en el respaldo.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      isCheckingTask = false;
    }
  };

  // --- CONTROL DE TEMAS ---
  function applyTheme(themeName) {
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });
    
    if (themeName && themeName !== 'default') {
      document.body.classList.add('theme-' + themeName);
    }
    
    if (themeSelector) {
      themeSelector.value = themeName || 'default';
    }
  }

  if (themeSelector) {
    themeSelector.addEventListener('change', async () => {
      const selectedTheme = themeSelector.value;
      applyTheme(selectedTheme);
      
      try {
        await fetch('/api/user/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: selectedTheme })
        });
      } catch (e) {
        console.error("Error al guardar tema:", e);
      }
    });
  }

  // --- ARRANQUE DE LA APP ---
  async function startup() {
    await checkSession();
    await loadCatalogs();

    // Ocultar pantalla de carga
    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.style.display = 'none', 300);
  }

  startup();
});
