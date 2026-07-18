const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Firebase Config
const apiKey = "AIzaSyBcODDLwTnFOBDh2XoyUkLdzE5wzYBNauo";
const projectId = process.env.FIREBASE_PROJECT_ID || "calculadora-olin";

let adminSdk = null;
let useAdmin = false;

// Intentar cargar Firebase Admin SDK si hay credenciales
const credPath = process.env.FIREBASE_CREDENTIALS_PATH || path.join(__dirname, 'firebase-credentials.json');

if (fs.existsSync(credPath)) {
  try {
    const admin = require('firebase-admin');
    const serviceAccount = require(credPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    adminSdk = admin.firestore();
    useAdmin = true;
    console.log("Firebase Admin SDK inicializado con éxito.");
  } catch (error) {
    console.error("Error al inicializar Firebase Admin SDK, se usará la API REST:", error.message);
  }
}

// Convertir objeto JS simple a formato JSON estructurado de Firestore
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    // Distinguir entre entero y flotante
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const key in val) {
      if (val.hasOwnProperty(key) && val[key] !== undefined) {
        fields[key] = toFirestoreValue(val[key]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Convertir JSON estructurado de Firestore a objeto JS simple
function fromFirestoreValue(fsVal) {
  if (!fsVal) return null;
  if ('nullValue' in fsVal) return null;
  if ('stringValue' in fsVal) return fsVal.stringValue;
  if ('booleanValue' in fsVal) return fsVal.booleanValue;
  if ('integerValue' in fsVal) return parseInt(fsVal.integerValue, 10);
  if ('doubleValue' in fsVal) return parseFloat(fsVal.doubleValue);
  if ('arrayValue' in fsVal) {
    const values = fsVal.arrayValue.values || [];
    return values.map(fromFirestoreValue);
  }
  if ('mapValue' in fsVal) {
    const fields = fsVal.mapValue.fields || {};
    const obj = {};
    for (const key in fields) {
      obj[key] = fromFirestoreValue(fields[key]);
    }
    return obj;
  }
  return null;
}

// Obtener token de autenticación anónima
async function getAnonymousToken() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!response.ok) {
    throw new Error(`Error en Firebase Auth REST: ${response.statusText}`);
  }
  const data = await response.json();
  return data.idToken;
}

/**
 * Guarda una tarea en la colección datosv4 de Firestore como respaldo
 */
async function saveTaskBackup(taskId, taskData) {
  // Limpiar campos para evitar subir datos enriquecidos de la extracción
  const cleanData = {
    id: taskData.id || taskId,
    fecha: taskData.fecha,
    equipo: taskData.equipo,
    integrantes: taskData.integrantes,
    ubicacion: taskData.ubicacion,
    descripcionGeneral: taskData.descripcionGeneral || taskData.descripcion_general,
    esSinExito: !!taskData.esSinExito || !!taskData.es_sin_exito,
    puntosTotalesEstimados: parseFloat(taskData.puntosTotalesEstimados || taskData.puntos_totales_estimados || 0),
    porEncargo: {
      activa: false,
      descripcion: ""
    },
    esUrgente: {
      activa: !!(taskData.esUrgente?.activa || taskData.es_urgente_activa),
      descripcion: taskData.esUrgente?.descripcion || taskData.es_urgente_description || ""
    },
    timestamp: new Date().toISOString()
  };

  // Copiar campos dinámicos de integrantes
  for (const key in taskData) {
    if (key.startsWith('Integrante')) {
      cleanData[key] = taskData[key];
    }
  }

  if (cleanData.esSinExito) {
    cleanData.sinExito = {
      motivo: taskData.sinExito?.motivo || taskData.sin_exito_motivo || "",
      visitas: parseInt(taskData.sinExito?.visitas || taskData.sin_exito_visitas || 1, 10),
      direccion: taskData.sinExito?.direccion || taskData.sin_exito_direccion || null,
      informacionAdicional: taskData.sinExito?.informacionAdicional || taskData.sin_exito_informacion || ""
    };
  } else {
    cleanData.tareaMantenimiento = {
      activa: !!(taskData.tareaMantenimiento?.activa || taskData.tarea_mantenimiento_activa),
      descripcion: taskData.tareaMantenimiento?.descripcion || taskData.tarea_mantenimiento_descripcion || "",
      informacionAdicional: taskData.tareaMantenimiento?.informacionAdicional || taskData.tarea_mantenimiento_informacion || ""
    };
    cleanData.puntosTrabajo = taskData.puntosTrabajo || [];
    cleanData.gastoMaterial = taskData.gastoMaterial || {};
    cleanData.informacionAdicionalMaterial = taskData.informacionAdicionalMaterial || taskData.informacion_adicional_material || "";
    cleanData.cableDesplegado = taskData.cableDesplegado || {};
  }

  // Guardar usando Admin SDK si está configurado
  if (useAdmin && adminSdk) {
    try {
      await adminSdk.collection('datosv4').doc(taskId).set(cleanData);
      console.log(`[Firebase Admin] Respaldo guardado para tarea ${taskId}`);
      return true;
    } catch (error) {
      console.error(`[Firebase Admin] Error guardando tarea ${taskId}:`, error);
    }
  }

  // Fallback a API REST de Firestore
  try {
    const token = await getAnonymousToken();
    const firestoreData = {
      fields: {}
    };

    for (const key in cleanData) {
      if (cleanData.hasOwnProperty(key)) {
        firestoreData.fields[key] = toFirestoreValue(cleanData[key]);
      }
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/datosv4/${taskId}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(firestoreData)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API REST Error: ${response.status} - ${errText}`);
    }

    console.log(`[Firebase REST] Respaldo guardado para tarea ${taskId}`);
    return true;
  } catch (error) {
    console.error(`[Firebase REST] Error guardando tarea ${taskId}:`, error.message);
    return false;
  }
}

/**
 * Obtiene una tarea de Firestore (colección datosv4)
 */
async function getTaskBackup(taskId) {
  if (useAdmin && adminSdk) {
    try {
      const docSnap = await adminSdk.collection('datosv4').doc(taskId).get();
      if (docSnap.exists) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error(`[Firebase Admin] Error obteniendo tarea ${taskId}:`, error);
    }
  }

  // Fallback a API REST
  try {
    const token = await getAnonymousToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/datosv4/${taskId}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 404) {
      return null; // Tarea no encontrada
    }

    if (!response.ok) {
      throw new Error(`API REST Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parsear el documento de Firestore a objeto JS plano
    const obj = {};
    const fields = data.fields || {};
    for (const key in fields) {
      obj[key] = fromFirestoreValue(fields[key]);
    }
    return obj;
  } catch (error) {
    console.error(`[Firebase REST] Error obteniendo tarea ${taskId}:`, error.message);
    return null;
  }
}

/**
 * Elimina una tarea de Firestore (colección datosv4) como respaldo
 */
async function deleteTaskBackup(taskId) {
  if (useAdmin && adminSdk) {
    try {
      await adminSdk.collection('datosv4').doc(taskId).delete();
      console.log(`[Firebase Admin] Respaldo eliminado para tarea ${taskId}`);
      return true;
    } catch (error) {
      console.error(`[Firebase Admin] Error eliminando tarea ${taskId}:`, error);
      return false;
    }
  }

  // Fallback a API REST
  try {
    const token = await getAnonymousToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/datosv4/${taskId}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API REST Error: ${response.status}`);
    }

    console.log(`[Firebase REST] Respaldo de tarea ${taskId} eliminado.`);
    return true;
  } catch (error) {
    console.error(`[Firebase REST] Error eliminando tarea ${taskId}:`, error.message);
    return false;
  }
}

module.exports = {
  saveTaskBackup,
  getTaskBackup,
  deleteTaskBackup
};
