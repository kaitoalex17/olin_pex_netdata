# Datos Exportados de la Base de Datos (Firestore)

A continuación se presentan en formato de tablas todos los registros actuales extraídos de la base de datos `calculadora-olin`, excluyendo la colección de órdenes (`datosv3`) según lo solicitado.

---

## 1. Equipos de Trabajo (`equipos`)

Esta tabla contiene los equipos de técnicos registrados para realizar las tareas.

| ID de Equipo | Integrantes | Color Asignado |
| :--- | :--- | :--- |
| **NetData 1** | Samuel O, Daniel, Miguel A | `#4a94e8` (Azul) |
| **NetData 2** | Oleksandr B, Andriy B | `#4cc260` (Verde) |
| **NetData 3** | José R, - | `#c91d1d` (Rojo) |
| **NetData 4** | Juan Carlos M, - | `#e6df19` (Amarillo) |
| **NetData 5** | Miguel A, Daniel M | `#34342d` (Gris oscuro) |

---

## 2. Conceptos de Trabajo (`conceptos`)

Esta tabla muestra los baremos de puntuación para cada tarea unitaria de mantenimiento.

| Concepto de Trabajo (ID) | Valor en Puntos | Orden de Visualización |
| :--- | :--- | :--- |
| **FALLO - ALGODON** | 0.50 | *No asignado* |
| **FORMULARIO - ALGODON** | 1.00 | *No asignado* |
| **Instalación de cliente (Nivel 1) - ICT 2 , interior** | 4.00 | *No asignado* |
| **Instalación de cliente (Nivel 2) - Fachada, complicada** | 4.70 | *No asignado* |
| **Instalación de cliente (Nivel 3) - Poste, local o mucho cable** | 7.00 | *No asignado* |
| **LEVANTAMIENTO - ALGODON** | 2.00 | *No asignado* |
| **Unidad de visita de mantenimiento** | 11.95 | *No asignado* |
| **desmontaje de caja** | 0.71 | *No asignado* |
| **desmontar cable en canalizado** | 0.03 | *No asignado* |
| **desmontar cable en interior** | 0.07 | *No asignado* |
| **etiquetas de cable** | 0.05 | 11 |
| **etiquetas de caja** | 0.02 | 12 |
| **fusiones** | 0.66 | 9 |
| **instalación de CTO** | 1.74 | 3 |
| **instalación de CTR** | 1.74 | 4 |
| **instalación de Distribucion** | 1.74 | 5 |
| **instalación de Torpedo** | 1.74 | 6 |
| **levantamiento de divisor en Antala** | 0.16 | 13 |
| **manipulación de Splitter** | 0.29 | 7 |
| **manipulación de caja existente** | 0.86 | 1 |
| **medición de señal** | 0.22 | 14 |
| **medición de señal con fusión** | 0.88 | 15 |
| **preparación de final de cable** | 1.33 | 8 |
| **sangrado** | 2.26 | 16 |
| **suplemento de fibra en servicio** | 0.76 | 10 |

---

## 3. Conceptos de Cable (`ConceptoCable`)

Baremos de puntos por metro de cable según la ubicación de la instalación.

| Tipo de Cable (ID) | Puntos por Metro | Nombre Corto |
| :--- | :--- | :--- |
| **Cable Arqueta** | 0.0724 | `arqueta` |
| **Cable Aéreo** | 0.0902 | `aereo` |
| **Cable Cámara** | 0.0724 | `camara` |
| **Cable Fachada** | 0.1449 | `fachada` |
| **Cable Interior** | 0.1449 | `interior` |

---

## 4. Catálogo de Materiales (`materiales`)

Materiales disponibles para declarar en las órdenes.

| ID del Material |
| :--- |
| **Bandeja 24 puertos** |
| **Bandeja 48 puertos** |
| **Bridas grandes** |
| **Bridas medians** |
| **Bridas pequeñas** |
| **CTO 16 puertos** |
| **CTO 8 puertos** |
| **CTO blanca (interior)** |
| **Cable Aereo** |
| **Cable Tierra** |
| **Cancamo** |
| **Cinta** |
| **Divisor 1:2 (conector)** |
| **Divisor 1:2 desnudo** |
| **Divisor 1:8 (conector)** |
| **Divisor 1:8 desnudo** |
| **Minicau (torpedo nuevo)** |
| **Mixta (rayada)** |
| **Pachcord (latiguillo)** |
| **Pasamuro (enfrentador)** |
| **Pigtail** |
| **Pinzas medianas** |
| **Pinzas pequeñas** |
| **TOF96 (torpedo)** |

---

## 5. Conceptos de Imagen (`concepimagen`)

Conceptos utilizados para clasificar los reportes fotográficos.

| Tabla 1 (Puntos/Ubicaciones) | Tabla 2 (Detalles/Intervenciones) |
| :--- | :--- |
| Punto 1 | Fusiones |
| Punto 2 | etiquetado |
| Punto 3 | señal |
| Punto 4 | señal divisor 1 |
| Metraje cable | señal divisor 2 |
| Mapa despliegue | señal fibra fusionada |
| Punto 5 | caja abierta |
| Punto 6 | colgado entorno |
| Punto 7 | etiquetado interior |
| Punto 8 | antes de intervenir |
| Punto 9 | inicio |
| Punto 10 | final |
| Punto 11 | Antala |
| Punto 12 | |
| Punto 13 | |
| Punto 14 | |
| Punto 15 | |
| Falta permiso | |
