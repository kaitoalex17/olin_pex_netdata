document.addEventListener('DOMContentLoaded', () => {
  const openParserBtn = document.getElementById('openParserBtn');
  const parserModal = document.getElementById('parserModal');
  const closeParserBtn = document.getElementById('closeParserBtn');
  const cancelParserBtn = document.getElementById('cancelParserBtn');
  const processParserBtn = document.getElementById('processParserBtn');
  const rawParserText = document.getElementById('rawParserText');

  // Guardar datos parseados globalmente durante la sesión de edición actual
  window.currentParsedData = null;

  // Abrir modal
  openParserBtn.addEventListener('click', () => {
    rawParserText.value = '';
    parserModal.classList.add('active');
  });

  // Cerrar modal
  const closeModal = () => {
    parserModal.classList.remove('active');
  };
  closeParserBtn.addEventListener('click', closeModal);
  cancelParserBtn.addEventListener('click', closeModal);

  // Procesar con IA (Groq)
  processParserBtn.addEventListener('click', async () => {
    const text = rawParserText.value.trim();
    if (!text) {
      alert("Por favor, introduce o pega algún texto.");
      return;
    }

    processParserBtn.disabled = true;
    processParserBtn.textContent = "Procesando con IA...";

    try {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la anotación.');
      }

      // Guardar datos en el estado global
      window.currentParsedData = data;

      // Auto-rellenar campos en el formulario principal
      if (data.identificacion_tarea) {
        const idTarea = data.identificacion_tarea.codigo_tarea_externo || data.identificacion_tarea.correctivo_id;
        if (idTarea) {
          const taskNumberInput = document.getElementById('taskNumber');
          taskNumberInput.value = idTarea;
          // Disparar evento change para comprobar si ya existe en la BD
          taskNumberInput.dispatchEvent(new Event('change'));
        }

        // Si se encuentra una fecha en el texto (ej: AAAA-MM-DD o formato similar)
        if (data.identificacion_tarea.fecha_registro) {
          // Intentar parsear fecha suelta
          try {
            const parsedDate = new Date(data.identificacion_tarea.fecha_registro);
            if (!isNaN(parsedDate.getTime())) {
              document.getElementById('taskDate').value = parsedDate.toISOString().split('T')[0];
            }
          } catch(e) {}
        }
      }

      // Auto-rellenar ubicación e instrucciones técnicas
      if (data.logistica_ubicacion && data.logistica_ubicacion.direccion_instalacion) {
        document.getElementById('ubicacionLocalizacion').value = data.logistica_ubicacion.direccion_instalacion;
      }

      if (data.operativa_tecnica && data.operativa_tecnica.instrucciones_tecnicas) {
        document.getElementById('generalDescription').value = `[IA: Instrucciones Técnicas]: ${data.operativa_tecnica.instrucciones_tecnicas}`;
      }

      // Mostrar contenedor de datos de extracción interna
      renderParsedDataPreview(data);

      closeModal();
      alert("¡Texto analizado con éxito! Formulario auto-rellenado.");
    } catch (err) {
      alert("Error al analizar texto: " + err.message);
    } finally {
      processParserBtn.disabled = false;
      processParserBtn.textContent = "Procesar y Rellenar";
    }
  });

  // Función para renderizar la previsualización de datos de extracción
  function renderParsedDataPreview(data) {
    const container = document.getElementById('parsedDataViewContainer');
    const detailsDiv = document.getElementById('parsedDataDetails');
    
    if (!data) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const cliente = data.cliente || {};
    const servicio = data.servicio_contratado || {};
    const logistica = data.logistica_ubicacion || {};
    const equipos = data.operativa_tecnica?.equipamiento || {};
    const preguntas = data.sugerencias_y_preguntas || [];

    let html = `
      <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div><strong>Cliente:</strong> ${cliente.nombre || 'No identificado'} (ID: ${cliente.id || 'N/D'})</div>
        <div><strong>Teléfono:</strong> ${cliente.telefono || 'N/D'}</div>
        <div><strong>Producto Contratado:</strong> ${servicio.producto || 'N/D'} (${servicio.propietario_red || 'N/D'})</div>
        <div><strong>Dirección de Instalación:</strong> ${logistica.direccion_instalacion || 'N/D'}</div>
        ${logistica.es_traslado ? `
          <div style="color: var(--color-warning); font-weight: bold;">
            ⚠️ [TRASLADO DETECTADO] Nueva Dirección: ${logistica.nueva_direccion || 'No especificada'}
          </div>
        ` : ''}
        <div><strong>Equipamiento (Router SN):</strong> ${equipos.sn_router || 'N/D'} / <strong>Cliente SN:</strong> ${equipos.sn_cliente || 'N/D'}</div>
      </div>
    `;

    if (preguntas.length > 0) {
      html += `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--color-warning); padding: 0.75rem; border-radius: var(--radius-sm); margin-top: 1rem;">
          <strong style="color: var(--color-warning);">Dudas o Sugerencias detectadas por la IA:</strong>
          <ul style="margin-left: 1.25rem; margin-top: 0.5rem; list-style-type: disc;">
            ${preguntas.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    detailsDiv.innerHTML = html;
  }

  // Hacer que esté disponible globalmente para poder limpiarlo al resetear el formulario
  window.clearParsedData = () => {
    window.currentParsedData = null;
    document.getElementById('parsedDataViewContainer').style.display = 'none';
  };
  window.loadParsedDataPreview = renderParsedDataPreview;
});
