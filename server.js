const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const db = require('./db');
const firebase = require('./firebase');

const app = express();
const PORT = process.env.PORT || 3113;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'elin_pex_super_secret_session_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
    secure: false // En local / http es false, cambiar a true si usa https
  }
}));

// Configurar Multer para subida de imágenes (guardado temporal local)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por imagen
});

// Middleware de Autenticación
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.userId || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ error: 'Prohibido. Permisos insuficientes.' });
    }
    next();
  };
}

// Inicializar Base de Datos en Arranque con reintentos para esperar a Postgres
async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, 'init-db.sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn("No se encontró init-db.sql. Saltando inicialización.");
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const maxRetries = 15;
    const retryDelay = 2000;

    for (let i = 1; i <= maxRetries; i++) {
      try {
        // Ejecutar el SQL de inicialización
        await db.query(sql);
        console.log("Esquema de base de datos cargado/verificado con éxito.");

        // Verificar si existe el administrador predeterminado
        const result = await db.query("SELECT * FROM users WHERE role = 'admin'");
        if (result.rows.length === 0) {
          const adminEmail = 'admin@instala.xyz';
          const adminPass = 'AdminOlin2026!';
          const hash = await bcrypt.hash(adminPass, 10);
          await db.query(
            "INSERT INTO users (email, password_hash, role, associated_member) VALUES ($1, $2, 'admin', 'Administrador')",
            [adminEmail, hash]
          );
          console.log(`Usuario administrador por defecto creado: ${adminEmail} (Contraseña: ${adminPass})`);
        }
        return; // Éxito, salir de la función
      } catch (error) {
        console.warn(`[Intento ${i}/${maxRetries}] La base de datos no está lista aún: ${error.message}`);
        if (i === maxRetries) {
          console.error("No se pudo conectar a la base de datos después de varios reintentos. Abortando inicialización.");
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  } catch (error) {
    console.error("Error crítico al inicializar la base de datos:", error.message);
  }
}

// --- RUTAS DE AUTENTICACIÓN ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    // Guardar en sesión
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.teamId = user.team_id;
    req.session.associatedMember = user.associated_member;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        team_id: user.team_id,
        associated_member: user.associated_member
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar la sesión.' });
    }
    res.json({ success: true });
  });
});

// Obtener Estado de la Sesión
app.get('/api/auth/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        role: req.session.userRole,
        team_id: req.session.teamId,
        associated_member: req.session.associatedMember
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});


// --- RUTAS DE CONFIGURACIÓN / AJUSTES (ADMINISTRADOR) ---

// Obtener toda la configuración (equipos, conceptos, cables, materiales)
app.get('/api/config', requireAuth, async (req, res) => {
  try {
    const teams = await db.query('SELECT * FROM teams ORDER BY id');
    const concepts = await db.query('SELECT * FROM concepts ORDER BY orden, id');
    const cables = await db.query('SELECT * FROM cables ORDER BY nombre');
    const materials = await db.query('SELECT * FROM materials ORDER BY orden, id');

    res.json({
      teams: teams.rows,
      concepts: concepts.rows,
      cables: cables.rows,
      materials: materials.rows
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ error: 'Error al obtener la configuración.' });
  }
});

// Gestión de Equipos (Admin)
app.post('/api/config/teams', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id, integrantes } = req.body;
  if (!id || !integrantes) {
    return res.status(400).json({ error: 'ID e integrantes requeridos.' });
  }
  try {
    await db.query(
      'INSERT INTO teams (id, integrantes) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET integrantes = EXCLUDED.integrantes',
      [id.trim(), integrantes.trim()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el equipo.' });
  }
});

app.delete('/api/config/teams/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el equipo.' });
  }
});

// Gestión de Conceptos (Admin)
app.post('/api/config/concepts', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id, valor_puntos, orden } = req.body;
  if (!id || valor_puntos === undefined) {
    return res.status(400).json({ error: 'Nombre y puntos requeridos.' });
  }
  try {
    await db.query(
      'INSERT INTO concepts (id, valor_puntos, orden) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET valor_puntos = EXCLUDED.valor_puntos, orden = EXCLUDED.orden',
      [id.trim(), parseFloat(valor_puntos), parseInt(orden || 999, 10)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar concepto.' });
  }
});

app.delete('/api/config/concepts/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM concepts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar concepto.' });
  }
});

// Gestión de Cables (Admin)
app.post('/api/config/cables', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id, nombre, puntos } = req.body;
  if (!id || !nombre || puntos === undefined) {
    return res.status(400).json({ error: 'ID, nombre y puntos requeridos.' });
  }
  try {
    await db.query(
      'INSERT INTO cables (id, nombre, puntos) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, puntos = EXCLUDED.puntos',
      [id.trim().toLowerCase(), nombre.trim(), parseFloat(puntos)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar cable.' });
  }
});

app.delete('/api/config/cables/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM cables WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cable.' });
  }
});

// Gestión de Materiales (Admin)
app.post('/api/config/materials', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id, orden } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Nombre del material requerido.' });
  }
  try {
    await db.query(
      'INSERT INTO materials (id, orden) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET orden = EXCLUDED.orden',
      [id.trim(), parseInt(orden || 999, 10)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar material.' });
  }
});

app.delete('/api/config/materials/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM materials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar material.' });
  }
});

// Gestión de Usuarios (Admin)
app.get('/api/config/users', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, role, team_id, associated_member, created_at FROM users ORDER BY email');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar usuarios.' });
  }
});

app.post('/api/config/users', requireAuth, requireRole(['admin']), async (req, res) => {
  const { email, password, role, team_id, associated_member } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email y Rol son requeridos.' });
  }

  try {
    // Si es creación y no hay password
    if (!password && !req.body.id) {
      return res.status(400).json({ error: 'Contraseña requerida para nuevos usuarios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanTeam = team_id || null;
    const cleanMember = associated_member || null;

    if (req.body.id) {
      // Actualizar usuario existente
      let query = 'UPDATE users SET email = $1, role = $2, team_id = $3, associated_member = $4';
      const params = [cleanEmail, role, cleanTeam, cleanMember];

      if (password && password.trim()) {
        const hash = await bcrypt.hash(password, 10);
        query += ', password_hash = $5 WHERE id = $6';
        params.push(hash, req.body.id);
      } else {
        query += ' WHERE id = $5';
        params.push(req.body.id);
      }

      await db.query(query, params);
    } else {
      // Crear nuevo usuario
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (email, password_hash, role, team_id, associated_member) VALUES ($1, $2, $3, $4, $5)',
        [cleanEmail, hash, role, cleanTeam, cleanMember]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el usuario. Puede que el email ya exista.' });
  }
});

app.delete('/api/config/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.session.userId) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});


// --- RUTAS DE TAREAS (PROCESAMIENTO Y ACCESO) ---

// Guardar Tarea
app.post('/api/tasks', requireAuth, async (req, res) => {
  const taskData = req.body;
  const taskId = taskData.id;

  if (!taskId) {
    return res.status(400).json({ error: 'El ID de tarea es requerido.' });
  }

  try {
    // Si es Técnico, validar que no esté modificando una tarea de otro equipo
    if (req.session.userRole === 'tecnico') {
      const existing = await db.query('SELECT team_id FROM tasks WHERE id = $1', [taskId]);
      if (existing.rows.length > 0 && existing.rows[0].team_id !== req.session.teamId) {
        return res.status(403).json({ error: 'No tienes permisos para modificar tareas de otro equipo.' });
      }
      // Sobrescribir el equipo en el payload con el equipo del usuario
      taskData.equipo = req.session.teamId;
    }

    // 1. Guardar o actualizar la tarea principal en PostgreSQL
    const query = `
      INSERT INTO tasks (
        id, fecha, equipo, integrantes, ubicacion, descripcion_general, es_sin_exito, puntos_totales_estimados,
        por_encargo_activa, por_encargo_description, es_urgente_activa, es_urgente_descripcion,
        tarea_mantenimiento_activa, tarea_mantenimiento_descripcion, tarea_mantenimiento_informacion,
        puntos_trabajo, gasto_material, informacion_adicional_material, cable_desplegado,
        sin_exito_motivo, sin_exito_visitas, sin_exito_direccion, sin_exito_informacion,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      ON CONFLICT (id) DO UPDATE SET
        fecha = EXCLUDED.fecha,
        equipo = EXCLUDED.equipo,
        integrantes = EXCLUDED.integrantes,
        ubicacion = EXCLUDED.ubicacion,
        descripcion_general = EXCLUDED.descripcion_general,
        es_sin_exito = EXCLUDED.es_sin_exito,
        puntos_totales_estimados = EXCLUDED.puntos_totales_estimados,
        por_encargo_activa = EXCLUDED.por_encargo_activa,
        por_encargo_description = EXCLUDED.por_encargo_description,
        es_urgente_activa = EXCLUDED.es_urgente_activa,
        es_urgente_descripcion = EXCLUDED.es_urgente_descripcion,
        tarea_mantenimiento_activa = EXCLUDED.tarea_mantenimiento_activa,
        tarea_mantenimiento_descripcion = EXCLUDED.tarea_mantenimiento_descripcion,
        tarea_mantenimiento_informacion = EXCLUDED.tarea_mantenimiento_informacion,
        puntos_trabajo = EXCLUDED.puntos_trabajo,
        gasto_material = EXCLUDED.gasto_material,
        informacion_adicional_material = EXCLUDED.informacion_adicional_material,
        cable_desplegado = EXCLUDED.cable_desplegado,
        sin_exito_motivo = EXCLUDED.sin_exito_motivo,
        sin_exito_visitas = EXCLUDED.sin_exito_visitas,
        sin_exito_direccion = EXCLUDED.sin_exito_direccion,
        sin_exito_informacion = EXCLUDED.sin_exito_informacion
    `;

    const params = [
      taskId,
      taskData.fecha,
      taskData.equipo,
      taskData.integrantes,
      taskData.ubicacion,
      taskData.descripcionGeneral || taskData.descripcion_general || '',
      !!taskData.esSinExito,
      parseFloat(taskData.puntosTotalesEstimados || 0),
      !!taskData.porEncargo?.activa,
      taskData.porEncargo?.descripcion || '',
      !!taskData.esUrgente?.activa,
      taskData.esUrgente?.descripcion || '',
      !!taskData.tareaMantenimiento?.activa,
      taskData.tareaMantenimiento?.descripcion || '',
      taskData.tareaMantenimiento?.informacionAdicional || '',
      JSON.stringify(taskData.puntosTrabajo || []),
      JSON.stringify(taskData.gastoMaterial || {}),
      taskData.informacionAdicionalMaterial || '',
      JSON.stringify(taskData.cableDesplegado || {}),
      taskData.sinExito?.motivo || null,
      parseInt(taskData.sinExito?.visitas || 1, 10),
      taskData.sinExito?.direccion || null,
      taskData.sinExito?.informacionAdicional || null,
      req.session.userId
    ];

    await db.query(query, params);

    // 2. Guardar datos de extracción IA en PostgreSQL (si existen)
    if (taskData.parsedData) {
      const p = taskData.parsedData;
      const parseQuery = `
        INSERT INTO task_parsed_data (
          task_id, correctivo_id, codigo_tarea_externo, tipo_incidencia, estado, nivel_incidencia, fecha_registro,
          cliente_id, cliente_nombre, cliente_telefono, producto, propietario_red, instrucciones_tecnicas, notas_operador,
          sn_router, sn_cliente, direccion_instalacion, latitud, longitud, es_traslado, nueva_direccion, nueva_latitud, nueva_longitud,
          coste_cierre, permanencia_meses, sugerencias_y_preguntas, raw_text
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) ON CONFLICT (task_id) DO UPDATE SET
          correctivo_id = EXCLUDED.correctivo_id,
          codigo_tarea_externo = EXCLUDED.codigo_tarea_externo,
          tipo_incidencia = EXCLUDED.tipo_incidencia,
          estado = EXCLUDED.estado,
          nivel_incidencia = EXCLUDED.nivel_incidencia,
          fecha_registro = EXCLUDED.fecha_registro,
          cliente_id = EXCLUDED.cliente_id,
          cliente_nombre = EXCLUDED.cliente_nombre,
          cliente_telefono = EXCLUDED.cliente_telefono,
          producto = EXCLUDED.producto,
          propietario_red = EXCLUDED.propietario_red,
          instrucciones_tecnicas = EXCLUDED.instrucciones_tecnicas,
          notas_operador = EXCLUDED.notas_operador,
          sn_router = EXCLUDED.sn_router,
          sn_cliente = EXCLUDED.sn_cliente,
          direccion_instalacion = EXCLUDED.direccion_instalacion,
          latitud = EXCLUDED.latitud,
          longitud = EXCLUDED.longitud,
          es_traslado = EXCLUDED.es_traslado,
          nueva_direccion = EXCLUDED.nueva_direccion,
          nueva_latitud = EXCLUDED.nueva_latitud,
          nueva_longitud = EXCLUDED.nueva_longitud,
          coste_cierre = EXCLUDED.coste_cierre,
          permanencia_meses = EXCLUDED.permanencia_meses,
          sugerencias_y_preguntas = EXCLUDED.sugerencias_y_preguntas,
          raw_text = EXCLUDED.raw_text
      `;
      const parseParams = [
        taskId,
        p.identificacion_tarea?.correctivo_id || null,
        p.identificacion_tarea?.codigo_tarea_externo || null,
        p.identificacion_tarea?.tipo_incidencia || null,
        p.identificacion_tarea?.estado || null,
        p.identificacion_tarea?.nivel_incidencia || null,
        p.identificacion_tarea?.fecha_registro || null,
        p.cliente?.id || null,
        p.cliente?.nombre || null,
        p.cliente?.telefono || null,
        p.servicio_contratado?.producto || null,
        p.servicio_contratado?.propietario_red || null,
        p.operativa_tecnica?.instrucciones_tecnicas || null,
        p.operativa_tecnica?.notas_operador || null,
        p.operativa_tecnica?.equipamiento?.sn_router || null,
        p.operativa_tecnica?.equipamiento?.sn_cliente || null,
        p.logistica_ubicacion?.direccion_instalacion || null,
        p.logistica_ubicacion?.coordenadas_instalacion?.latitud || null,
        p.logistica_ubicacion?.coordenadas_instalacion?.longitud || null,
        !!p.logistica_ubicacion?.es_traslado,
        p.logistica_ubicacion?.nueva_direccion || null,
        p.logistica_ubicacion?.nuevas_coordenadas?.latitud || null,
        p.logistica_ubicacion?.nuevas_coordenadas?.longitud || null,
        p.condiciones_comerciales?.coste_cierre || null,
        p.condiciones_comerciales?.permanencia_meses || null,
        JSON.stringify(p.sugerencias_y_preguntas || []),
        p.raw_text || null
      ];
      await db.query(parseQuery, parseParams);
    }

    // 3. Replicar a Firestore de respaldo (Colección datosv4)
    // Se ejecuta en background para no retrasar la respuesta HTTP
    firebase.saveTaskBackup(taskId, taskData).catch(err => {
      console.error(`Fallo al subir respaldo en Firebase para tarea ${taskId}:`, err.message);
    });

    // 4. Manejar Tarea en Conjunto (Crear tarea 'A' para el equipo secundario)
    if (taskData.isJointTask && taskData.jointTaskDetails && !taskData.esSinExito) {
      const [primaryPercent, secondaryPercent] = taskData.jointTaskDetails.proportion.split('-').map(Number);
      const totalPoints = parseFloat(taskData.puntosTotalesEstimados || 0);

      // Calcular proporción
      const secondaryPoints = totalPoints * (secondaryPercent / 100);
      const secondaryTaskId = `${taskId}A`;
      const secondaryTeamId = taskData.jointTaskDetails.secondaryTeam;

      // Cargar integrantes del equipo secundario
      const secondaryTeamResult = await db.query('SELECT integrantes FROM teams WHERE id = $1', [secondaryTeamId]);
      const secondaryIntegrantes = secondaryTeamResult.rows[0]?.integrantes || '';

      const jointTaskData = {
        id: secondaryTaskId,
        fecha: taskData.fecha,
        equipo: secondaryTeamId,
        integrantes: secondaryIntegrantes,
        ubicacion: taskData.ubicacion,
        descripcionGeneral: `Puntos Compartidos de la tarea ${taskId}`,
        esSinExito: false,
        puntosTotalesEstimados: parseFloat(secondaryPoints.toFixed(2)),
        porEncargo: taskData.porEncargo || { activa: false, descripcion: '' },
        esUrgente: taskData.esUrgente || { activa: false, descripcion: '' },
        tareaMantenimiento: { activa: false, descripcion: '', informacionAdicional: '' },
        puntosTrabajo: [],
        gastoMaterial: {},
        cableDesplegado: {}
      };

      // Guardar tarea A en local
      await db.query(
        `INSERT INTO tasks (id, fecha, equipo, integrantes, ubicacion, descripcion_general, es_sin_exito, puntos_totales_estimados, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           fecha = EXCLUDED.fecha, equipo = EXCLUDED.equipo, integrantes = EXCLUDED.integrantes,
           ubicacion = EXCLUDED.ubicacion, descripcion_general = EXCLUDED.descripcion_general,
           puntos_totales_estimados = EXCLUDED.puntos_totales_estimados`,
        [secondaryTaskId, jointTaskData.fecha, secondaryTeamId, secondaryIntegrantes, jointTaskData.ubicacion, jointTaskData.descripcionGeneral, false, jointTaskData.puntosTotalesEstimados, req.session.userId]
      );

      // Guardar tarea A en Firebase backup
      firebase.saveTaskBackup(secondaryTaskId, jointTaskData).catch(err => {
        console.error(`Fallo al subir respaldo en Firebase para tarea conjunta ${secondaryTaskId}:`, err.message);
      });
    }

    res.json({ success: true, message: 'Tarea guardada localmente y en cola de respaldo.' });
  } catch (error) {
    console.error("Error al guardar tarea:", error);
    res.status(500).json({ error: 'Error interno al guardar la tarea.' });
  }
});

// Buscar Tarea por ID (Consulta local + fallback Firestore)
app.get('/api/tasks/:id', requireAuth, async (req, res) => {
  const taskId = req.params.id;
  try {
    // 1. Intentar buscar en PostgreSQL local
    const localResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (localResult.rows.length > 0) {
      const task = localResult.rows[0];

      // Verificar permisos de Técnico
      if (req.session.userRole === 'tecnico' && task.equipo !== req.session.teamId) {
        return res.status(403).json({ 
          error: 'Acceso denegado. Esta tarea pertenece a otro equipo.',
          belongsToOtherTeam: true 
        });
      }

      // Cargar datos parsed si existen
      const parsedResult = await db.query('SELECT * FROM task_parsed_data WHERE task_id = $1', [taskId]);
      
      // Mapear campos PostgreSQL al JSON esperado por el frontend
      const frontendTask = {
        id: task.id,
        fecha: task.fecha.toISOString().split('T')[0],
        equipo: task.equipo,
        integrantes: task.integrantes,
        ubicacion: task.ubicacion,
        descripcionGeneral: task.descripcion_general,
        esSinExito: task.es_sin_exito,
        puntosTotalesEstimados: parseFloat(task.puntos_totales_estimados),
        porEncargo: {
          activa: task.por_encargo_activa,
          descripcion: task.por_encargo_description
        },
        esUrgente: {
          activa: task.es_urgente_activa,
          descripcion: task.es_urgente_descripcion
        },
        tareaMantenimiento: {
          activa: task.tarea_mantenimiento_activa,
          descripcion: task.tarea_mantenimiento_descripcion,
          informacionAdicional: task.tarea_mantenimiento_informacion
        },
        puntosTrabajo: task.puntos_trabajo,
        gastoMaterial: task.gasto_material,
        informacionAdicionalMaterial: task.informacion_adicional_material,
        cableDesplegado: task.cable_desplegado,
        sinExito: task.es_sin_exito ? {
          motivo: task.sin_exito_motivo,
          visitas: task.sin_exito_visitas,
          direccion: task.sin_exito_direccion,
          informacionAdicional: task.sin_exito_informacion
        } : null,
        parsedData: parsedResult.rows[0] ? parsedResult.rows[0] : null
      };

      return res.json({ found: true, source: 'local', task: frontendTask });
    }

    // 2. Fallback: Intentar buscar en el respaldo de Firestore
    console.log(`Tarea ${taskId} no encontrada en PostgreSQL. Buscando en Firestore de respaldo...`);
    const backupTask = await firebase.getTaskBackup(taskId);

    if (backupTask) {
      // Verificar permisos de Técnico
      if (req.session.userRole === 'tecnico' && backupTask.equipo !== req.session.teamId) {
        return res.status(403).json({ 
          error: 'Acceso denegado. Esta tarea en Firestore pertenece a otro equipo.',
          belongsToOtherTeam: true 
        });
      }

      return res.json({ 
        found: true, 
        source: 'backup', 
        message: 'La tarea existe en el respaldo (Firestore). ¿Desea importarla a la base de datos local?',
        task: backupTask 
      });
    }

    res.json({ found: false });
  } catch (error) {
    console.error("Error al buscar tarea:", error);
    res.status(500).json({ error: 'Error del servidor al buscar la tarea.' });
  }
});


// --- CONFIGURACIÓN DE GROQ API Y PARSER (LLAMA 3.3) ---

// Obtener API Key de Groq desde la Base de Datos o Env
async function getGroqApiKey() {
  try {
    const res = await db.query("SELECT value FROM system_settings WHERE key = 'groq_api_key'");
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
  } catch (e) {
    console.error("Error reading groq_api_key from db:", e.message);
  }
  return process.env.GROQ_API_KEY;
}

// Obtener si la API Key está configurada (enmascarada para el frontend)
app.get('/api/config/groq-key', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const key = await getGroqApiKey();
    if (key) {
      const masked = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '***';
      return res.json({ exists: true, maskedKey: masked });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar la clave.' });
  }
});

// Guardar la API Key de Groq
app.post('/api/config/groq-key', requireAuth, requireRole(['admin']), async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'La clave no puede estar vacía.' });
  }
  try {
    await db.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ('groq_api_key', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [apiKey.trim()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la clave.' });
  }
});

// Probar conexión a Groq
app.post('/api/config/test-groq', requireAuth, requireRole(['admin']), async (req, res) => {
  let { apiKey } = req.body;
  if (!apiKey || apiKey.includes('...')) {
    apiKey = await getGroqApiKey();
  }
  if (!apiKey) {
    return res.status(400).json({ error: 'No se especificó ninguna API Key para probar.' });
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: 'responde solo con un JSON: {"status": "ok"}' }
        ],
        response_format: { type: 'json_object' }
      })
    });
    if (response.ok) {
      res.json({ success: true, message: '¡Conexión con Groq exitosa!' });
    } else {
      const errText = await response.text();
      res.status(400).json({ error: `Groq rechazó la clave: ${response.status}. ${errText}` });
    }
  } catch (error) {
    res.status(500).json({ error: `Error al conectar con Groq: ${error.message}` });
  }
});

const SYSTEM_PROMPT = `Eres un asistente de IA especializado en la gestión de telecomunicaciones e instalación de fibra óptica. Tu objetivo es actuar como un parser de texto a JSON para extraer información estructurada a partir de anotaciones de trabajo, partes de averías o solicitudes de alta/traslado.

### CONFIGURACIÓN DE EXTRACCIÓN (AJUSTES)
Modifica estos valores según sea necesario antes de procesar:
- EXCLUDE_DNI_NIE_CIF: true
- SUGGEST_ON_AMBIGUITY: true

### INSTRUCCIONES DE PROCESAMIENTO
1. Analiza el texto proporcionado y extrae la información para rellenar el esquema JSON adjunto.
2. Si "EXCLUDE_DNI_NIE_CIF" es true, ignora por completo cualquier DNI, NIE o CIF del cliente (ej. "25667401E", "H22966337"). No lo incluyas en el campo correspondiente.
3. Detecta de forma inteligente si hay un "[TRASLADO]" o cambio de domicilio. Si es así:
   - Identifica la dirección y coordenadas antiguas (origen).
   - Identifica la nueva dirección y coordenadas (destino).
4. Si hay instrucciones técnicas al inicio o texto libre (ej: "METER LATEGILLO..."), extraelo en "instrucciones_tecnicas".
5. Si encuentras datos de equipamiento como números de serie (SN Router), gúardalos en "equipamiento".
6. REGLA DE DUDA/SUGERENCIA: Si hay datos ambiguos, contradictorios o faltan campos críticos (como el teléfono o la dirección en una avería), procesa lo que puedas y utiliza el campo "sugerencias_y_preguntas" para consultar al usuario o sugerir la corrección.

### FORMATO DE SALIDA (ESTRICTO JSON)
Devuelve ÚNICAMENTE un objeto JSON con la siguiente estructura (si un campo no existe en el texto, devuélvelo como null):

{
  "identificacion_tarea": {
    "correctivo_id": "string o null (Código numérico de correctivo/incidencia)",
    "codigo_tarea_externo": "string o null (Ej: códigos tipo OLINXXXXXX)",
    "tipo_incidencia": "string o null (Ej: Nueva Alta, Avería, Cambio Domicilio)",
    "estado": "string o null",
    "nivel_incidencia": "string o null",
    "fecha_registro": "string o null (Fecha suelta detectada en el texto)"
  },
  "cliente": {
    "id": "string o null (ID numérico entre corchetes)",
    "nombre": "string o null (Nombre o Razón Social)",
    "documento_identidad": "string o null (Solo si EXCLUDE_DNI_NIE_CIF es false)",
    "telefono": "string o null"
  },
  "servicio_contratado": {
    "producto": "string o null (Ej: Fibra Go, Fibra Plus, Fibra Evolution)",
    "propietario_red": "string o null"
  },
  "operativa_tecnica": {
    "instrucciones_tecnicas": "string o null (Acción requerida: fusiones, tirar cable, etc.)",
    "notas_operador": "string o null (Comentarios adicionales entre corchetes o texto libre)",
    "equipamiento": {
      "sn_router": "string o null",
      "sn_cliente": "string o null"
    }
  },
  "logistica_ubicacion": {
    "direccion_instalacion": "string o null (Dirección principal o de origen)",
    "coordenadas_instalacion": {
      "latitud": "number o null",
      "longitud": "number o null"
    },
    "es_traslado": "boolean (true si se detecta cambio de domicilio)",
    "nueva_direccion": "string o null (Solo si es_traslado es true)",
    "nuevas_coordenadas": {
      "latitud": "number o null",
      "longitud": "number o null"
    }
  },
  "condiciones_comerciales": {
    "coste_cierre": "number o null",
    "permanencia_meses": "number o null"
  },
  "sugerencias_y_preguntas": [
    "string (Lista de dudas, datos faltantes o sugerencias si SUGGEST_ON_AMBIGUITY es true)"
  ]
}`;

app.post('/api/parse-task', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texto a procesar es requerido.' });
  }

  const groqApiKey = await getGroqApiKey();
  if (!groqApiKey) {
    return res.status(503).json({ error: 'La API de Groq no está configurada en el servidor.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `[TEXTO A ANALIZAR]:\n${text}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    // Añadir el texto original para guardarlo junto con los resultados
    resultJson.raw_text = text;

    res.json(resultJson);
  } catch (error) {
    console.error("Error al parsear texto con Groq:", error);
    res.status(500).json({ error: 'Error del servidor al procesar la anotación con la IA.' });
  }
});


// --- DESCARGA DE INFORMES DE PRODUCTIVIDAD (GESTOR, COORDINADOR, ADMIN) ---

app.get('/api/reports/productivity', requireAuth, requireRole(['admin', 'coordinador', 'gestor']), async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate y endDate son requeridos en formato AAAA-MM-DD.' });
  }

  try {
    // 1. Resumen por equipo
    const teamProductivity = await db.query(`
      SELECT equipo, SUM(puntos_totales_estimados) as total_puntos, COUNT(id) as total_tareas
      FROM tasks
      WHERE fecha BETWEEN $1 AND $2
      GROUP BY equipo
      ORDER BY total_puntos DESC
    `, [startDate, endDate]);

    // 2. Detalle de todas las tareas en el rango
    const taskDetails = await db.query(`
      SELECT id, fecha, equipo, integrantes, ubicacion, puntos_totales_estimados, es_sin_exito
      FROM tasks
      WHERE fecha BETWEEN $1 AND $2
      ORDER BY fecha DESC, id DESC
    `, [startDate, endDate]);

    res.json({
      summary: teamProductivity.rows,
      tasks: taskDetails.rows
    });
  } catch (error) {
    console.error("Error al calcular informes:", error);
    res.status(500).json({ error: 'Error al generar informe.' });
  }
});


// --- ACCIONES FUTURAS: SUBIDA DE IMÁGENES Y GENERACIÓN DE PDF ---

// Subida de imagen
app.post('/api/upload-image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  }
  
  res.json({ 
    success: true, 
    filePath: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Generación de PDF (placeholder funcional para reportes de órdenes)
app.get('/api/generate-pdf/:taskId', requireAuth, async (req, res) => {
  const taskId = req.params.taskId;
  try {
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).send('Tarea no encontrada.');
    }
    const task = taskResult.rows[0];

    const doc = new PDFDocument();
    
    // Configurar descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-tarea-${taskId}.pdf`);
    doc.pipe(res);

    // Contenido
    doc.fontSize(20).text(`NetData - Reporte de Tarea #${task.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${task.fecha.toISOString().split('T')[0]}`);
    doc.text(`Equipo: ${task.equipo}`);
    doc.text(`Integrantes: ${task.integrantes}`);
    doc.text(`Ubicación: ${task.ubicacion || 'No especificada'}`);
    doc.moveDown();
    
    doc.text('Detalles del Trabajo:', { underline: true });
    doc.text(`Es Sin Éxito: ${task.es_sin_exito ? 'Sí' : 'No'}`);
    doc.text(`Puntos Totales: ${task.puntos_totales_estimados} pts`);
    
    if (task.descripcion_general) {
      doc.moveDown();
      doc.text('Observaciones:');
      doc.fontSize(10).text(task.descripcion_general);
    }

    doc.end();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send('Error al generar PDF.');
  }
});


// --- SERVIR FRONTEND ESTÁTICO ---

// Servir la carpeta public como estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir páginas específicas
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.redirect('/login');
});

app.get('*', (req, res, next) => {
  // Redirigir a login si no hay sesión iniciada y solicita la página principal
  if (!req.session.userId && req.url === '/') {
    return res.redirect('/login');
  }
  next();
});

// Iniciar Servidor
app.listen(PORT, async () => {
  console.log(`Servidor Planta Externa corriendo en http://localhost:${PORT}`);
  await initializeDatabase();
});
