# Análisis de la Base de Datos (Firebase Firestore)

Este documento detalla la estructura y el flujo de datos de la base de datos Firestore asociada a la aplicación de **NetData - Generador de Comentarios de Mantenimiento** (`generadorv6.html`).

---

## Configuración del Entorno de Base de Datos
La aplicación se conecta de forma anónima a un proyecto de Firebase con los siguientes parámetros:

* **Project ID**: `calculadora-olin`
* **Auth Domain**: `calculadora-olin.firebaseapp.com`
* **Storage Bucket**: `calculadora-olin.appspot.com`

---

## 1. Colecciones de Lectura (Configuración/Catálogos)

Estas colecciones se consultan al cargar la página para rellenar los desplegables y calcular las puntuaciones automáticas de las tareas.

### Colección: `equipos`
Almacena los equipos de trabajo disponibles y sus integrantes.

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `Document ID` | String | Código identificador del equipo (ej: `Málaga_1`). |
| `integrantes` | String | Nombres de los integrantes separados por comas (ej: `Juan Pérez, Luis Gómez`). |
| `Integrante1`, `Integrante2`, etc. | String | Campos dinámicos con el nombre de cada miembro del equipo. |

### Colección: `conceptos`
Define los tipos de trabajos unitarios que se pueden realizar en cada punto de trabajo y su valor en puntos.

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `Document ID` | String | Nombre del concepto de trabajo (ej: `Fusión de Fibra`). |
| `valorPuntos` | Número | Puntos que se otorgan por cada unidad de este concepto realizada. |
| `orden` | Número (Opcional) | Posición numérica en la que se ordenan visualmente en la aplicación. |

### Colección: `ConceptoCable`
Contiene los tipos de cables disponibles para despliegue y su factor de puntos por metro.

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `Document ID` | String | Identificador técnico del tipo de cable. |
| `nombre` | String | Nombre comercial/descriptivo del cable (ej: `Acometida Exterior`). |
| `puntos` | Número | Puntos otorgados por cada metro de este cable desplegado. |

### Colección: `materiales`
Almacena el catálogo de materiales que pueden ser declarados como gastados en la intervención.

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `Document ID` | String | Nombre o descripción del material (ej: `Conector SC/APC`). |
| `orden` | Número (Opcional) | Orden de visualización en la interfaz. |

---

## 2. Colección de Escritura y Lectura (Transaccional)

### Colección: `datosv3`
En esta colección se guarda y consulta el reporte final de cada tarea de mantenimiento. El identificador del documento (`Document ID`) es el **Número de Tarea** introducido por el usuario.

#### Campos Generales de la Tarea

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `id` | String | Número de la tarea (ID único). |
| `fecha` | String | Fecha de la tarea en formato `AAAA-MM-DD`. |
| `equipo` | String | ID del equipo asignado (proviene de la colección `equipos`). |
| `integrantes` | String | Lista de integrantes que realizaron el trabajo. |
| `ubicacion` | String | Ubicación física o localización donde se realizó la tarea. |
| `descripcionGeneral` | String | Observaciones finales u observaciones del trabajo. |
| `timestamp` | ServerTimestamp | Fecha y hora exacta de registro en el servidor de Firebase. |
| `esSinExito` | Boolean | `true` si la tarea no pudo iniciarse/completarse; `false` en caso contrario. |
| `puntosTotalesEstimados`| Número | Total de puntos calculados para la tarea (se ve afectado por la proporción de tarea conjunta). |
| `porEncargo` | Objeto | Contiene `{ activa: boolean, descripcion: string }` para tareas indicadas por encargados. |
| `esUrgente` | Objeto | Contiene `{ activa: boolean, descripcion: string }` para tareas urgentes. |
| `Integrante1`, `Integrante2`, ... | String | Nombres de los integrantes del equipo copiados dinámicamente al guardar. |

#### Campos Específicos si la Tarea es Completa (`esSinExito: false`)

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `tareaMantenimiento` | Objeto | Contiene `{ activa: boolean, descripcion: string, informacionAdicional: string }` para tareas de mantenimiento específicas. |
| `puntosTrabajo` | Array de Objetos | Listado de los puntos físicos trabajados (postes, arquetas, fachadas, etc.). Ver estructura abajo. |
| `gastoMaterial` | Objeto (Mapa) | Estructura clave-valor `{ [nombreMaterial]: cantidad }` con el inventario consumido. |
| `informacionAdicionalMaterial` | String | Detalles adicionales referentes a los materiales consumidos. |
| `cableDesplegado` | Objeto (Mapa) | Estructura clave-valor `{ [idCable]: metros }` indicando los metros de cable instalados. |

> [!NOTE]
> **Estructura detallada de un elemento del Array `puntosTrabajo`:**
> * `id`: Número (1, 2, 3...) que identifica el punto dentro de la tarea.
> * `ubicacion`: Ubicación seleccionada (ej: `poste`, `arqueta`, `fachada`, `riti`, `interior`, `camara`, `monolito`, `otros`).
> * `conceptos`: Array de objetos con el detalle del trabajo realizado:
>   * `nombre`: Nombre del concepto realizado.
>   * `cantidad`: Cantidad de veces realizado.
>   * `puntos`: Puntos acumulados por ese concepto (`cantidad` × `valorPuntos` del concepto).

#### Campos Específicos si la Tarea es Fallida (`esSinExito: true`)

| Campo | Tipo de Datos | Descripción / Correspondencia |
| :--- | :--- | :--- |
| `sinExito` | Objeto | Estructura con la justificación del fallo. Contiene:<br>- `motivo` (String): Causa de la inactividad (ej: *Falta de permiso*, *Canalizado obstruido*, etc.).<br>- `visitas` (Número): Número de visitas realizadas.<br>- `direccion` (String \| null): Dirección de fachada si aplica.<br>- `informacionAdicional` (String): Observaciones extra sobre el fallo. |

---

## 3. Lógica Especial: Tareas en Conjunto
Cuando se marca la opción de **Tarea en conjunto** con reparto de puntos (ej. 50-50, 75-25):
1. Se guarda el documento original bajo la ID especificada (ej. `108435`) con el porcentaje de puntos correspondientes al equipo principal.
2. Se crea automáticamente una nueva tarea con la ID terminada en **"A"** (ej. `108435A`) asignada al segundo equipo con el porcentaje de puntos secundario y la descripción `Puntos Compartidos de la tarea 108435`.
