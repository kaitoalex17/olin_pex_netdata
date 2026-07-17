# Compilado de Pruebas y Lógica de Datos - NetData (Firestore)

Este artefacto consolida toda la documentación, lógica de datos, esquemas de bases de datos y payloads JSON reales resultantes de las pruebas realizadas (tareas **`222111`**, **`22112`** y **`22113`**). Sirve como guía de referencia técnica para comprender e importar las estructuras de datos de la aplicación en la colección transaccional `datosv3`.

---

## 1. Arquitectura de Interacción con la Base de Datos

La aplicación utiliza la API REST y el SDK de Firebase Firestore de manera directa desde el cliente.
* **Proyecto**: `calculadora-olin`
* **Colección Transaccional Principal**: `datosv3`
* **Document ID**: El número de tarea introducido por el usuario (ej. `"22112"`).

---

## 2. Modelos de Payloads Almacenados (JSON)

### Prueba 1: Tarea Simple de Mantenimiento (`222111`)
Representa el caso de una visita rápida de mantenimiento con puntuación fija de $11.95$ pts.

```json
{
  "id": "222111",
  "fecha": "2026-07-17",
  "equipo": "NetData 5",
  "integrantes": "Miguel A, Daniel M",
  "Integrante1": "Miguel A",
  "Integrante2": "Daniel M",
  "ubicacion": "Prueba IA Antigravity",
  "descripcionGeneral": "Tarea de prueba guardada automáticamente por la IA",
  "esSinExito": false,
  "puntosTotalesEstimados": 11.95,
  "porEncargo": {
    "activa": false,
    "descripcion": ""
  },
  "esUrgente": {
    "activa": false,
    "descripcion": ""
  },
  "tareaMantenimiento": {
    "activa": true,
    "descripcion": "Prueba de guardado automático",
    "informacionAdicional": ""
  },
  "puntosTrabajo": [
    {
      "id": 1,
      "ubicacion": "interior",
      "conceptos": [
        {
          "nombre": "Unidad de visita de mantenimiento",
          "cantidad": 1,
          "puntos": 11.95
        }
      ]
    }
  ],
  "gastoMaterial": {},
  "cableDesplegado": {}
}
```

---

### Prueba 2: Tarea Compleja con Múltiples Puntos y Despliegue de Cable (`22112`)
Representa una instalación con 3 puntos físicos (arqueta, poste y fachada) y despliegue aéreo/fachada.

```json
{
  "id": "22112",
  "fecha": "2026-07-17",
  "equipo": "NetData 5",
  "integrantes": "Miguel A, Daniel M",
  "Integrante1": "Miguel A",
  "Integrante2": "Daniel M",
  "ubicacion": "Málaga Calle Principal",
  "descripcionGeneral": "Intervención de prueba con despliegue de cable y varios puntos de trabajo",
  "esSinExito": false,
  "puntosTotalesEstimados": 29.47,
  "porEncargo": {
    "activa": false,
    "descripcion": ""
  },
  "esUrgente": {
    "activa": false,
    "descripcion": ""
  },
  "tareaMantenimiento": {
    "activa": false,
    "descripcion": "",
    "informacionAdicional": ""
  },
  "puntosTrabajo": [
    {
      "id": 1,
      "ubicacion": "arqueta",
      "conceptos": [
        {
          "nombre": "manipulación de caja existente",
          "cantidad": 1,
          "puntos": 0.86
        },
        {
          "nombre": "preparación de final de cable",
          "cantidad": 2,
          "puntos": 2.66
        }
      ]
    },
    {
      "id": 2,
      "ubicacion": "poste",
      "conceptos": [
        {
          "nombre": "instalación de CTO",
          "cantidad": 1,
          "puntos": 1.74
        },
        {
          "nombre": "fusiones",
          "cantidad": 4,
          "puntos": 2.64
        }
      ]
    },
    {
      "id": 3,
      "ubicacion": "fachada",
      "conceptos": [
        {
          "nombre": "instalación de CTR",
          "cantidad": 1,
          "puntos": 1.74
        },
        {
          "nombre": "medición de señal con fusión",
          "cantidad": 2,
          "puntos": 1.76
        }
      ]
    }
  ],
  "cableDesplegado": {
    "Cable Fachada": 50,
    "Cable Aéreo": 120
  },
  "gastoMaterial": {}
}
```

---

### Prueba 3: Tarea Completa con Puntos, Cables y Gasto de Material (`22113`)
Representa una instalación completa que incluye inventario de materiales consumidos.

```json
{
  "id": "22113",
  "fecha": "2026-07-17",
  "equipo": "NetData 5",
  "integrantes": "Miguel A, Daniel M",
  "Integrante1": "Miguel A",
  "Integrante2": "Daniel M",
  "ubicacion": "Málaga Sector Oeste",
  "descripcionGeneral": "Prueba final completa con materiales, cable y puntos",
  "esSinExito": false,
  "puntosTotalesEstimados": 12.97,
  "porEncargo": {
    "activa": false,
    "descripcion": ""
  },
  "esUrgente": {
    "activa": false,
    "descripcion": ""
  },
  "tareaMantenimiento": {
    "activa": false,
    "descripcion": "",
    "informacionAdicional": ""
  },
  "puntosTrabajo": [
    {
      "id": 1,
      "ubicacion": "riti",
      "conceptos": [
        {
          "nombre": "instalación de CTR",
          "cantidad": 1,
          "puntos": 1.74
        },
        {
          "nombre": "fusiones",
          "cantidad": 8,
          "puntos": 5.28
        }
      ]
    },
    {
      "id": 2,
      "interior": {
        "stringValue": "interior"
      },
      "conceptos": [
        {
          "nombre": "medición de señal con fusión",
          "cantidad": 1,
          "puntos": 0.88
        }
      ]
    }
  ],
  "cableDesplegado": {
    "Cable Interior": 35
  },
  "gastoMaterial": {
    "CTO blanca (interior)": 1,
    "Pachcord (latiguillo)": 2,
    "Bridas pequeñas": 10
  },
  "informacionAdicionalMaterial": ""
}
```

---

## 3. Esquema Físico y Tipos de Datos de la Colección `datosv3`

El siguiente esquema detalla el tipo de datos físico requerido en Firestore para evitar fallos de formato en futuras integraciones:

| Nombre del Campo | Tipo en Firestore | Subestructura (si es Map/Array) |
| :--- | :--- | :--- |
| `id` | String | *Campo único obligatorio* |
| `fecha` | String | Formato `AAAA-MM-DD` |
| `equipo` | String | Coincidente con ID en `/equipos` |
| `integrantes` | String | Formato de texto libre separado por comas |
| `Integrante1`...`IntegranteN`| String | Nombres separados por técnico |
| `ubicacion` | String | Texto libre |
| `descripcionGeneral` | String | Comentarios del trabajo realizado |
| `esSinExito` | Boolean | Determina si la tarea finalizó con éxito |
| `puntosTotalesEstimados` | Double/Float | Puntos totales sumados y redondeados a 2 decimales |
| `porEncargo` | Map | `{ activa: Boolean, descripcion: String }` |
| `esUrgente` | Map | `{ activa: Boolean, descripcion: String }` |
| `tareaMantenimiento` | Map | `{ activa: Boolean, descripcion: String, informacionAdicional: String }` |
| `gastoMaterial` | Map | Estructura `{ [String nombreMaterial]: Integer cantidad }` |
| `cableDesplegado` | Map | Estructura `{ [String idCable]: Double metros }` |
| `puntosTrabajo` | Array | Lista de Mapas. Estructura de cada mapa:<br>`{ id: Integer, ubicacion: String, conceptos: Array }` |
| `puntosTrabajo.conceptos` | Array | Lista de Mapas. Estructura de cada concepto:<br>`{ nombre: String, cantidad: Integer, puntos: Double }` |

---

## 4. Fórmulas de Cálculo Aplicadas (Lógica de Producción)

Los puntos totales se calculan sumando el baremo unitario de cada concepto multiplicado por su cantidad, más la sumatoria de metros de cable multiplicada por su factor.

$$P_{\text{total}} = \sum (C_i \times V_{p,i}) + \sum (M_j \times F_{c,j})$$

Donde:
* $C_i$: Cantidad del concepto realizado $i$.
* $V_{p,i}$: Valor en puntos del concepto $i$ (definido en la colección `conceptos`).
* $M_j$: Metros del tipo de cable $j$.
* $F_{c,j}$: Factor de puntos por metro del cable $j$ (definido en la colección `ConceptoCable`).
* **Nota**: Si se marca como "Tarea en conjunto", el resultado final se multiplica por la proporción seleccionada (ej. $0.5$ para 50%).

---

## 5. Salidas de Texto (Visualización y Reportes)

### Formato de Reporte de WhatsApp
La interfaz genera un mensaje optimizado concatenando las secciones usando saltos de línea `\n` y separadores `---`:
1. **Línea de Cabecera**: `[ID]-[FECHA]#[INTEGRANTES] [EQUIPO].`
2. **Alertas**: `--- TAREA URGENTE ---` / `--- TAREA POR ENCARGO ---` (si aplican).
3. **Descripción General** y **Ubicación**.
4. **Desglose de Puntos**: Indica la ubicación de cada punto físico seguido de la lista de conceptos y cantidades correspondientes.
5. **Gasto de Material**: Lista de materiales declarados bajo el encabezado `Gasto Material:`.
6. **Cable Desplegado**: Detalla metros por tipo e incluye el sumatorio `Total de cable desplegado: [METROS] metros`.

### Formato de Reporte de Excel
Muestra de forma secuencial una línea por cada concepto agregado especificando:
`[CANTIDAD] - [CONCEPTO] ([PUNTOS_TOTALES] pts)`
Termina mostrando el `Total de cable desplegado` y el `Total estimado: [PUNTOS] puntos`.
