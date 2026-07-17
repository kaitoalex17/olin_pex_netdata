<?php
define('SESSION_REQUIRED', true);
require_once '../session_handler.php';

// Protección para: can_manage_concepts
if (!isset($_SESSION['permissions']) || !in_array('can_manage_concepts', $_SESSION['permissions'])) {
    header("Location: ../dashboard.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetData - Página de Gestión v5</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        /* ... (Estilos idénticos al bd-managerv3.html original) ... */
        body { font-family: 'Inter', sans-serif; background-color: #f0f2f5; color: #333; }
        .table-container { max-height: 400px; overflow-y: auto; }
        .modal {
            display: none; position: fixed; z-index: 100;
            left: 0; top: 0; width: 100%; height: 100%;
            overflow: auto; background-color: rgba(0,0,0,0.4);
            padding-top: 60px;
        }
        .modal-content {
            background-color: #fefefe; margin: 5% auto; padding: 20px;
            border: 1px solid #888; width: 80%; max-width: 600px;
            border-radius: 8px; position: relative;
        }
        .close-btn {
            color: #aaa; float: right; font-size: 28px; font-weight: bold;
        }
        .close-btn:hover,
        .close-btn:focus {
            color: black; text-decoration: none; cursor: pointer;
        }
    </style>
</head>
<body class="p-4 sm:p-6 md:p-8 lg:p-10">
    <div class="max-w-6xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-xl">
        <h1 class="text-3xl font-bold text-center text-blue-700 mb-4">Página de Gestión de NetData v5</h1>

        <div id="connectionStatus" class="flex items-center justify-center p-2 rounded-lg mb-8 transition-colors duration-300 ease-in-out">
            <div class="w-4 h-4 rounded-full mr-2" id="statusCircle"></div>
            <span class="text-sm font-semibold" id="statusText"></span>
        </div>

        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
                Gestión de Equipos
                <button id="importTeamsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out">
                    Importar Equipos
                </button>
            </h2>
            <p id="importTeamsStatus" class="mt-2 text-sm font-medium"></p>
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input type="text" id="newTeamName" class="flex-grow px-3 py-2 border rounded-md" placeholder="Nuevo equipo: 'NetData 5'">
                <div class="flex-grow flex items-center gap-2" id="teamMembersInputContainer">
                    <input type="text" class="flex-grow px-3 py-2 border rounded-md teamMemberInput" placeholder="Trabajador 1">
                    <input type="text" class="flex-grow px-3 py-2 border rounded-md teamMemberInput" placeholder="Trabajador 2">
                    <button id="addMemberBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-full">+</button>
                </div>
                <div class="flex items-center gap-2">
                    <button id="addTeamBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Añadir Equipo</button>
                </div>
            </div>
            <div class="table-container border rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integrantes</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fusionadoras</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herramientas</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="teamsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
                Gestión de Conceptos
                <button id="importConceptsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out">
                    Importar Conceptos
                </button>
            </h2>
            <p id="importConceptsStatus" class="mt-2 text-sm font-medium"></p>
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input type="text" id="newConceptName" class="flex-grow px-3 py-2 border rounded-md" placeholder="Nuevo concepto: 'Instalación de OLT'">
                <input type="number" id="newConceptPoints" class="w-24 px-3 py-2 border rounded-md" placeholder="Puntos">
                <button id="addConceptBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Añadir Concepto</button>
            </div>
            <div class="table-container border rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Puntos</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="conceptsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
                Gestión de Conceptos de Cable
                <button id="importCableConceptsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out">
                    Importar Conceptos
                </button>
            </h2>
            <p id="importCableConceptsStatus" class="mt-2 text-sm font-medium"></p>
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input type="text" id="newCableConceptName" class="flex-grow px-3 py-2 border rounded-md" placeholder="Nuevo concepto de cable: 'Cable Interior'">
                <input type="text" id="newCableConceptShortName" class="w-32 px-3 py-2 border rounded-md" placeholder="Nombre corto: 'interior'">
                <input type="number" id="newCableConceptPoints" class="w-24 px-3 py-2 border rounded-md" placeholder="Puntos">
                <button id="addCableConceptBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Añadir Concepto</button>
            </div>
            <div class="table-container border rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Corto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos por Metro</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="cableConceptsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>

        <div>
            <h2 class="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
                Gestión de Materiales
                <button id="importMaterialsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out">
                    Importar Materiales
                </button>
            </h2>
            <p id="importMaterialsStatus" class="mt-2 text-sm font-medium"></p>
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input type="text" id="newMaterialName" class="flex-grow px-3 py-2 border rounded-md" placeholder="Nuevo material: 'Conector SC/APC'">
                <button id="addMaterialBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Añadir Material</button>
            </div>
            <div class="table-container border rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="materialsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
                Gestión de Conceptos de Imagen
                <button id="importImageConceptsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out">
                    Importar Conceptos de Imagen
                </button>
            </h2>
            <p id="imageConceptImportStatus" class="mt-2 text-sm font-medium"></p>
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input type="text" id="newImageConceptName" class="flex-grow px-3 py-2 border rounded-md" placeholder="Nuevo concepto de imagen: 'Punto 1'">
                <select id="newImageConceptTable" class="flex-grow px-3 py-2 border rounded-md">
                    <option value="tabla1">Tabla 1 (Puntos)</option>
                    <option value="tabla2">Tabla 2 (Detalles)</option>
                </select>
                <button id="addImageConceptBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Añadir Concepto de Imagen</button>
            </div>
            <div class="table-container border rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="imageConceptsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>

        <div class="mb-8 border-t-2 border-blue-200 pt-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Gestión de Guardias (Planta Externa)</h2>
            
            <div class="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Configuración de Acceso y Equipos</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Establece la contraseña para acceder a la página de asignación de guardias (`ad-guardia-planta.html`) y el número de equipos que estarán de guardia cada día.
                </p>

                <div class="space-y-4">
                    <div>
                        <label for="guardiaNumEquipos" class="block text-sm font-medium text-gray-700">Número de equipos de guardia por día:</label>
                        <input type="number" id="guardiaNumEquipos" class="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Ej: 3">
                    </div>
                    <div>
                        <label for="guardiaPassword" class="block text-sm font-medium text-gray-700">Contraseña de acceso:</label>
                        <input type="password" id="guardiaPassword" class="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Contraseña segura">
                    </div>
                    
                    <button id="saveGuardiaConfigBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-md">
                        Guardar Configuración
                    </button>
                    <p id="configStatus" class="mt-2 text-sm font-medium"></p>
                </div>
            </div>
        </div>
        <div id="editMembersModal" class="modal">
            <div class="modal-content">
                <span class="close-btn" onclick="closeModal('editMembersModal')">&times;</span>
                <h3 class="text-xl font-medium text-gray-700 mb-4">Editar Integrantes del Equipo</h3>
                <p class="mb-2">Equipo: <span id="membersModalTeamName" class="font-semibold"></span></p>
                <div class="flex flex-col gap-2" id="membersModalContainer">
                    </div>
                <div class="flex justify-end mt-4">
                    <button id="addMemberModalBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-full">+</button>
                    <button id="saveMembersBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md ml-2">Guardar</button>
                </div>
            </div>
        </div>

        <div id="editCarModal" class="modal">
            <div class="modal-content">
                <span class="close-btn" onclick="closeModal('editCarModal')">&times;</span>
                <h3 class="text-xl font-medium text-gray-700 mb-4">Detalles del Coche del Equipo</h3>
                <p class="mb-2">Equipo: <span id="carModalTeamName" class="font-semibold"></span></p>
                
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Matrícula</h4>
                <input type="text" id="carMatriculaInput" class="px-3 py-2 border rounded-md w-full mb-4" placeholder="Matrícula">

                <h4 class="text-lg font-semibold text-gray-800 mb-2">Fusionadoras</h4>
                <div id="fusionadorasModalContainer" class="flex flex-col gap-2 mb-4">
                    </div>
                <button id="addFusionadoraModalBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-full">+</button>
                
                <div class="flex justify-end mt-4">
                    <button id="saveCarBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">Guardar</button>
                </div>
            </div>
        </div>

        <div id="editToolsModal" class="modal">
            <div class="modal-content">
                <span class="close-btn" onclick="closeModal('editToolsModal')">&times;</span>
                <h3 class="text-xl font-medium text-gray-700 mb-4">Herramientas del Equipo</h3>
                <p class="mb-2">Equipo: <span id="toolsModalTeamName" class="font-semibold"></span></p>
                <div class="flex flex-col gap-2" id="toolsModalContainer">
                    </div>
                <div class="flex justify-end mt-4">
                    <button id="addToolModalBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-full">+</button>
                    <button id="saveToolsBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md ml-2">Guardar</button>
                </div>
            </div>
        </div>
        </div> <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
        import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

        // --- FIREBASE CONFIGURATION (Extraída de tu archivo) ---
        const firebaseConfig = {
            apiKey: "AIzaSyBcODDLwTnFOBDh2XoyUkLdzE5wzYBNauo",
            authDomain: "calculadora-olin.firebaseapp.com",
            projectId: "calculadora-olin",
            storageBucket: "calculadora-olin.appspot.com",
            messagingSenderId: "1010425618747",
            appId: "1:1010425618747:web:bb3ea318d3481474e4171e",
            measurementId: "G-XMFYD17YB1"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // --- INICIO: LÓGICA DE CONFIGURACIÓN DE GUARDIAS (V5) ---
        const numEquiposInput = document.getElementById('guardiaNumEquipos');
        const passwordInput = document.getElementById('guardiaPassword');
        const saveConfigBtn = document.getElementById('saveGuardiaConfigBtn');
        const configStatus = document.getElementById('configStatus');
        
        const configDocRef = doc(db, "configuracion", "adminGuardias");

        // Cargar configuración existente al cargar la página
        async function loadGuardiaConfig() {
            try {
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    numEquiposInput.value = data.numeroEquiposGuardia || '';
                }
            } catch (error) {
                console.error("Error al cargar configuración: ", error);
                configStatus.textContent = 'Error al cargar config.';
                configStatus.className = 'mt-2 text-sm font-medium text-red-600';
            }
        }

        // Guardar la nueva configuración
        saveConfigBtn.addEventListener('click', async () => {
            const numEquipos = parseInt(numEquiposInput.value, 10);
            const password = passwordInput.value;

            if (isNaN(numEquipos) || numEquipos <= 0) {
                configStatus.textContent = 'Por favor, introduce un número de equipos válido.';
                configStatus.className = 'mt-2 text-sm font-medium text-red-600';
                return;
            }

            if (!password) {
                configStatus.textContent = 'Por favor, introduce una contraseña.';
                configStatus.className = 'mt-2 text-sm font-medium text-red-600';
                return;
            }

            try {
                await setDoc(configDocRef, {
                    numeroEquiposGuardia: numEquipos,
                    guardiaPassword: password
                });
                configStatus.textContent = '¡Configuración guardada con éxito!';
                configStatus.className = 'mt-2 text-sm font-medium text-green-600';
                passwordInput.value = ''; // Limpiar campo de contraseña
            } catch (error) {
                console.error("Error al guardar configuración: ", error);
                configStatus.textContent = 'Error al guardar. Revisa la consola.';
                configStatus.className = 'mt-2 text-sm font-medium text-red-600';
            }
        });

        // --- Carga inicial de todo ---
        document.addEventListener('DOMContentLoaded', async () => {
            // Cargar lógica original de bd-managerv3
            await checkConnection();
            await loadAllData(); 
            
            // Añadir la carga de la nueva configuración
            await loadGuardiaConfig();
        });
        // --- FIN: LÓGICA DE CONFIGURACIÓN DE GUARDIAS (V5) ---
        
        // ====================================================================
        // INICIO DEL CÓDIGO RESTAURADO Y MODIFICADO (V3)
        // ====================================================================

        // --- DATABASE CONNECTION LOGIC ---
        const statusCircle = document.getElementById('statusCircle');
        const statusText = document.getElementById('statusText');

        async function checkConnection() {
            try {
                const docRef = doc(db, "conceptos", "sangrado"); 
                await getDoc(docRef);
                statusCircle.classList.remove('bg-red-500');
                statusCircle.classList.add('bg-green-500');
                statusText.textContent = 'Conectado a la Base de Datos';
                statusText.classList.remove('text-red-500');
                statusText.classList.add('text-green-500');
            } catch (error) {
                console.error("Error al conectar con la base de datos:", error);
                statusCircle.classList.remove('bg-green-500');
                statusCircle.classList.add('bg-red-500');
                statusText.textContent = 'No Conectado a la Base de Datos';
                statusText.classList.remove('text-green-500');
                statusText.classList.add('text-red-500');
            }
        }

        // --- DATA IMPORT LOGIC (Variables y Data) ---
        const importTeamsBtn = document.getElementById('importTeamsBtn');
        const importTeamsStatus = document.getElementById('importTeamsStatus');
        const importConceptsBtn = document.getElementById('importConceptsBtn');
        const importConceptsStatus = document.getElementById('importConceptsStatus');
        const importMaterialsBtn = document.getElementById('importMaterialsBtn');
        const importMaterialsStatus = document.getElementById('importMaterialsStatus');
        const importImageConceptsBtn = document.getElementById('importImageConceptsBtn');
        const imageConceptImportStatus = document.getElementById('imageConceptImportStatus');
        const importCableConceptsBtn = document.getElementById('importCableConceptsBtn');
        const importCableConceptsStatus = document.getElementById('importCableConceptsStatus');

        const factoryData = {
            teams: [
                { id: "NetData 1", integrantes: "Jose DIgnacio" },
                { id: "NetData 2", integrantes: "Olesandr BAndriy B" },
                { id: "NetData 3", integrantes: "Harrison CManuel B" },
                { id: "NetData 4", integrantes: "Jose CarlosJose R" }
            ],
            concepts: [
                { id: "manipulación de caja existente", valorPuntos: 0.86, orden: 1 },
                { id: "desmontaje de caja", valorPuntos: 0.71, orden: 2 },
                { id: "instalación de CTO", valorPuntos: 1.74, orden: 3 },
                { id: "instalación de CTR", valorPuntos: 1.74, orden: 4 },
                { id: "instalación de Distribucion", valorPuntos: 1.74, orden: 5 },
                { id: "instalación de Torpedo", valorPuntos: 1.74, orden: 6 },
                { id: "manipulación de Splitter", valorPuntos: 0.29, orden: 7 },
                { id: "preparación de final de cable", valorPuntos: 1.33, orden: 8 },
                { id: "fusiones", valorPuntos: 0.66, orden: 9 },
                { id: "suplemento de fibra en servicio", valorPuntos: 0.76, orden: 10 },
                { id: "etiquetas de cable", valorPuntos: 0.05, orden: 11 },
                { id: "etiquetas de caja", valorPuntos: 0.02, orden: 12 },
                { id: "levantamiento de divisor en Antala", valorPuntos: 0.16, orden: 13 },
                { id: "medición de señal con fusión", valorPuntos: 0.88, orden: 14 },
                { id: "sangrado", valorPuntos: 2.26, orden: 15 }
            ],
            materials: [
                { id: "Cable Aereo" },
                { id: "Cable Tierra" },
                { id: "CTO blanca (interior)" },
                { id: "Mixta (rayada)" },
                { id: "CTO 16 puertos" },
                { id: "CTO 8 puertos" },
                { id: "TOF96 (torpedo)" },
                { id: "Minicau (torpedo nuevo)" },
                { id: "Divisor 1:2 desnudo" },
                { id: "Divisor 1:8 desnudo" },
                { id: "Bridas medianas" },
                { id: "Bridas grandes" },
                { id: "Bridas pequeñas" },
                { id: "Cancamo" },
                { id: "Pinzas pequeñas" },
                { id: "Pinzas medianas" },
                { id: "Cinta" },
                { id: "Pigtail" },
                { id: "Pasamuro (enfrentador)" },
                { id: "Pachcord (latiguillo)" }
            ],
            cableConcepts: [
                { id: "Cable Interior", nombre: "Cable Interior", puntos: 0.1449, shortName: "interior" },
                { id: "Cable Fachada", nombre: "Cable Fachada", puntos: 0.1449, shortName: "fachada" },
                { id: "Cable Arqueta", nombre: "Cable Arqueta", puntos: 0.0724, shortName: "arqueta" },
                { id: "Cable Cámara", nombre: "Cable Cámara", puntos: 0.0724, shortName: "camara" },
                { id: "Cable Aéreo", nombre: "Cable Aéreo", puntos: 0.0902, shortName: "aereo" }
            ]
        };

        const imageConceptsData = {
            tabla1: [
                "Punto 1", "Punto 2", "Punto 3", "Punto 4", "Metraje cable",
                "Mapa despliegue", "Punto 5", "Punto 6", "Punto 7", "Punto 8",
                "Punto 9", "Punto 10", "Punto 11", "Punto 12", "Punto 13",
                "Punto 14", "Punto 15"
            ],
            tabla2: [
                "Fusiones", "etiquetado", "señal", "señal divisor 1", "señal divisor 2",
                "señal fibra fusionada", "caja abierta", "colgado entorno", "etiquetado interior",
                "antes de intervenir"
            ]
        };
        
        // --- DATA IMPORT LOGIC (Event Listeners) ---
        importTeamsBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres importar los equipos de fábrica? Esto podría sobrescribir o añadir datos existentes.')) return;
            importTeamsStatus.textContent = 'Importando equipos, por favor espera...';
            importTeamsStatus.className = 'mt-2 text-sm font-medium text-gray-600';

            try {
                // Modificación para importar datos con el nuevo formato de integrantes
                const newFormatTeams = factoryData.teams.map(team => {
                    const integrantesArray = team.integrantes.split(/[, ]+/).filter(Boolean);
                    const integrantesObj = {};
                    integrantesArray.forEach((integrante, index) => {
                        integrantesObj[`Integrante${index + 1}`] = integrante;
                    });
                    return { id: team.id, integrantes: team.integrantes, ...integrantesObj };
                });

                const promises = newFormatTeams.map(team => {
                    const { id, ...dataToSave } = team;
                    // El color se inicializará con el valor por defecto si no existe al cargar, o se guardará con la función saveTeamColor
                    return setDoc(doc(db, "equipos", id), dataToSave);
                });
                await Promise.all(promises);
                importTeamsStatus.textContent = '¡Importación de equipos completada con éxito!';
                importTeamsStatus.className = 'mt-2 text-sm font-medium text-green-600';
                await loadAndRenderCollection('equipos', teamsTableBody, renderTeamRow);
            } catch (error) {
                console.error("Error al importar equipos: ", error);
                importTeamsStatus.textContent = 'Error al importar equipos. Revisa la consola para más detalles.';
                importTeamsStatus.className = 'mt-2 text-sm font-medium text-red-600';
            } finally {
                checkConnection();
            }
        });

        importConceptsBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres importar los conceptos de fábrica? Esto podría sobrescribir o añadir datos existentes.')) return;
            importConceptsStatus.textContent = 'Importando conceptos, por favor espera...';
            importConceptsStatus.className = 'mt-2 text-sm font-medium text-gray-600';
            try {
                const promises = factoryData.concepts.map(concept => setDoc(doc(db, "conceptos", concept.id), { valorPuntos: concept.valorPuntos, orden: concept.orden }));
                await Promise.all(promises);
                importConceptsStatus.textContent = '¡Importación de conceptos completada con éxito!';
                importConceptsStatus.className = 'mt-2 text-sm font-medium text-green-600';
                await loadAndRenderCollection('conceptos', conceptsTableBody, renderConceptRow);
            } catch (error) {
                console.error("Error al importar conceptos: ", error);
                importConceptsStatus.textContent = 'Error al importar conceptos. Revisa la consola para más detalles.';
                importConceptsStatus.className = 'mt-2 text-sm font-medium text-red-600';
            } finally {
                checkConnection();
            }
        });

        importCableConceptsBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres importar los conceptos de cable de fábrica? Esto podría sobrescribir o añadir datos existentes.')) return;
            importCableConceptsStatus.textContent = 'Importando conceptos de cable, por favor espera...';
            importCableConceptsStatus.className = 'mt-2 text-sm font-medium text-gray-600';
            try {
                const promises = factoryData.cableConcepts.map(concept => setDoc(doc(db, "ConceptoCable", concept.id), { nombre: concept.nombre, puntos: concept.puntos, shortName: concept.shortName }));
                await Promise.all(promises);
                importCableConceptsStatus.textContent = '¡Importación de conceptos de cable completada con éxito!';
                importCableConceptsStatus.className = 'mt-2 text-sm font-medium text-green-600';
                await loadAndRenderCollection('ConceptoCable', cableConceptsTableBody, renderCableConceptRow);
            } catch (error) {
                console.error("Error al importar conceptos de cable: ", error);
                importCableConceptsStatus.textContent = 'Error al importar conceptos de cable. Revisa la consola para más detalles.';
                importCableConceptsStatus.className = 'mt-2 text-sm font-medium text-red-600';
            } finally {
                checkConnection();
            }
        });

        importMaterialsBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres importar los materiales de fábrica? Esto podría sobrescribir o añadir datos existentes.')) return;
            importMaterialsStatus.textContent = 'Importando materiales, por favor espera...';
            importMaterialsStatus.className = 'mt-2 text-sm font-medium text-gray-600';
            try {
                const promises = factoryData.materials.map(material => setDoc(doc(db, "materiales", material.id), {}));
                await Promise.all(promises);
                importMaterialsStatus.textContent = '¡Importación de materiales completada con éxito!';
                importMaterialsStatus.className = 'mt-2 text-sm font-medium text-green-600';
                await loadAndRenderCollection('materiales', materialsTableBody, renderMaterialRow);
            } catch (error) {
                console.error("Error al importar materiales: ", error);
                importMaterialsStatus.textContent = 'Error al importar materiales. Revisa la consola para más detalles.';
                importMaterialsStatus.className = 'mt-2 text-sm font-medium text-red-600';
            } finally {
                checkConnection();
            }
        });

        importImageConceptsBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres importar los conceptos de imagen? Esto podría sobrescribir o añadir datos existentes.')) return;
            imageConceptImportStatus.textContent = 'Importando conceptos de imagen, por favor espera...';
            imageConceptImportStatus.className = 'mt-2 text-sm font-medium text-gray-600';
            try {
                await setDoc(doc(db, "concepimagen", "tabla1"), { conceptos: imageConceptsData.tabla1 });
                await setDoc(doc(db, "concepimagen", "tabla2"), { conceptos: imageConceptsData.tabla2 });
                imageConceptImportStatus.textContent = '¡Importación de conceptos de imagen completada con éxito!';
                imageConceptImportStatus.className = 'mt-2 text-sm font-medium text-green-600';
                await loadAndRenderImageConcepts();
            } catch (error) {
                console.error("Error al importar conceptos de imagen: ", error);
                imageConceptImportStatus.textContent = 'Error al importar conceptos de imagen. Revisa la consola para más detalles.';
                imageConceptImportStatus.className = 'mt-2 text-sm font-medium text-red-600';
            } finally {
                checkConnection();
            }
        });
        
        // --- LOAD AND RENDER LOGIC ---
        const teamsTableBody = document.getElementById('teamsTableBody');
        const conceptsTableBody = document.getElementById('conceptsTableBody');
        const materialsTableBody = document.getElementById('materialsTableBody');
        const imageConceptsTableBody = document.getElementById('imageConceptsTableBody');
        const cableConceptsTableBody = document.getElementById('cableConceptsTableBody');

        async function loadAllData() {
            await Promise.all([
                loadAndRenderCollection('equipos', teamsTableBody, renderTeamRow),
                loadAndRenderCollection('conceptos', conceptsTableBody, renderConceptRow),
                loadAndRenderCollection('materiales', materialsTableBody, renderMaterialRow),
                loadAndRenderCollection('ConceptoCable', cableConceptsTableBody, renderCableConceptRow)
            ]);
            await loadAndRenderImageConcepts();
        }

        async function loadAndRenderImageConcepts() {
            try {
                const docSnap1 = await getDoc(doc(db, "concepimagen", "tabla1"));
                const docSnap2 = await getDoc(doc(db, "concepimagen", "tabla2"));
                
                const allConcepts = [];
                if (docSnap1.exists()) {
                    docSnap1.data().conceptos.forEach(concept => allConcepts.push({ id: concept, tabla: "tabla1" }));
                }
                if (docSnap2.exists()) {
                    docSnap2.data().conceptos.forEach(concept => allConcepts.push({ id: concept, tabla: "tabla2" }));
                }

                imageConceptsTableBody.innerHTML = '';
                allConcepts.sort((a, b) => a.id.localeCompare(b.id)).forEach(item => imageConceptsTableBody.appendChild(renderImageConceptRow(item)));

            } catch (error) {
                console.error("Error loading image concepts:", error);
                imageConceptsTableBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Error al cargar conceptos de imagen. Revisa la consola para más detalles.</td></tr>';
            }
        }

        async function loadAndRenderCollection(collectionName, tableBody, renderFunction) {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            let data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            
            // Sort data by ID
            data.sort((a, b) => a.id.localeCompare(b.id));

            tableBody.innerHTML = '';
            data.forEach(item => tableBody.appendChild(renderFunction(item)));
        }

        // --- RENDER FUNCTIONS ---

        // Función para guardar el color del equipo (NUEVO)
        window.saveTeamColor = async (teamId, color) => {
            try {
                await setDoc(doc(db, "equipos", teamId), { color: color }, { merge: true });
                // console.log(`Color ${color} guardado para el equipo ${teamId}`);
            } catch (error) {
                alert(`Error al guardar el color para el equipo ${teamId}: ${error.message}`);
                console.error(error);
            }
        };

        function renderTeamRow(team) {
            const row = document.createElement('tr');
            const displayIntegrantes = team.integrantes || 'Sin integrantes';
            const fusionadorasDisplay = (team.fusionadoras && team.fusionadoras.length > 0) ? team.fusionadoras.map(f => `${f.tipo} (${f.sn})`).join(', ') : 'Sin fusionadoras';
            const herramientasDisplay = (team.herramientas && team.herramientas.length > 0) ? team.herramientas.join(', ') : 'Sin herramientas';
            const teamColor = team.color || '#4A90E2'; // Color por defecto (Azul, claro y visible)

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${team.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${displayIntegrantes}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.matricula || 'Sin matrícula'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fusionadorasDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${herramientasDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="color" value="${teamColor}" 
                           onchange="saveTeamColor('${team.id}', this.value)" 
                           title="Seleccionar Color del Equipo"
                           class="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button class="text-gray-600 hover:text-gray-900 font-bold py-1 px-2 rounded" onclick="toggleOptionsMenu(this)">...</button>
                    <div class="options-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 hidden">
                        <div class="py-1">
                            <button class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onclick="openEditMembersModal('${team.id}')">Editar Integrantes</button>
                            <button class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onclick="openCarModal('${team.id}')">Coche</button>
                            <button class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onclick="openToolsModal('${team.id}')">Herramientas</button>
                            <button class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left" onclick="deleteDoc('equipos', '${team.id}')">Borrar Equipo</button>
                        </div>
                    </div>
                </td>
            `;
            return row;
        }

        // --- TOGGLE OPTIONS MENU LOGIC ---
        window.toggleOptionsMenu = (button) => {
            const menu = button.nextElementSibling;
            if (menu.classList.contains('hidden')) {
                // Close all other menus
                document.querySelectorAll('.options-menu').forEach(m => m.classList.add('hidden'));
                // Open the clicked menu
                menu.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
            }
        };

        // Close dropdown when clicking outside
        window.onclick = (event) => {
            if (!event.target.matches('.text-gray-600')) {
                const allMenus = document.querySelectorAll('.options-menu');
                allMenus.forEach(m => m.classList.add('hidden'));
            }
        };

        function renderConceptRow(concept) {
            const row = document.createElement('tr');
            const valorPuntos = concept.valorPuntos !== undefined && !isNaN(parseFloat(concept.valorPuntos)) ? concept.valorPuntos : 'Sin información';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" contenteditable="true" data-id="${concept.id}" data-field="id">${concept.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" contenteditable="true" data-id="${concept.id}" data-field="valorPuntos">${valorPuntos}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="saveDoc('conceptos', '${concept.id}', this)">Guardar</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteDoc('conceptos', '${concept.id}')">Borrar</button>
                </td>
            `;
            return row;
        }

        function renderMaterialRow(material) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" contenteditable="true" data-id="${material.id}" data-field="id">${material.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="saveDoc('materiales', '${material.id}', this)">Guardar</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteDoc('materiales', '${material.id}')">Borrar</button>
                </td>
            `;
            return row;
        }

        function renderCableConceptRow(concept) {
            const row = document.createElement('tr');
            const points = concept.puntos !== undefined && !isNaN(parseFloat(concept.puntos)) ? concept.puntos : 'Sin información';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" contenteditable="true" data-id="${concept.id}" data-field="id">${concept.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" contenteditable="true" data-id="${concept.id}" data-field="shortName">${concept.shortName || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" contenteditable="true" data-id="${concept.id}" data-field="puntos">${points}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="saveDoc('ConceptoCable', '${concept.id}', this)">Guardar</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteDoc('ConceptoCable', '${concept.id}')">Borrar</button>
                </td>
            `;
            return row;
        }

        function renderImageConceptRow(concept) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${concept.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${concept.tabla}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900" onclick="deleteImageConcept('${concept.id}', '${concept.tabla}')">Borrar</button>
                </td>
            `;
            return row;
        }


        // --- ADD NEW ITEMS LOGIC ---
        const addTeamBtn = document.getElementById('addTeamBtn');
        const addConceptBtn = document.getElementById('addConceptBtn');
        const addMaterialBtn = document.getElementById('addMaterialBtn');
        const addImageConceptBtn = document.getElementById('addImageConceptBtn');
        const teamMembersInputContainer = document.getElementById('teamMembersInputContainer');
        const addMemberBtn = document.getElementById('addMemberBtn');
        const addCableConceptBtn = document.getElementById('addCableConceptBtn');

        addMemberBtn.addEventListener('click', () => {
            const newMemberInput = document.createElement('input');
            newMemberInput.type = 'text';
            newMemberInput.className = 'flex-grow px-3 py-2 border rounded-md teamMemberInput';
            newMemberInput.placeholder = `Trabajador ${teamMembersInputContainer.querySelectorAll('.teamMemberInput').length + 1}`;
            teamMembersInputContainer.insertBefore(newMemberInput, addMemberBtn);
        });

        addTeamBtn.addEventListener('click', () => {
            const teamName = document.getElementById('newTeamName').value.trim();
            const memberInputs = document.querySelectorAll('.teamMemberInput');
            const members = Array.from(memberInputs).map(input => input.value.trim()).filter(Boolean);
            
            if (!teamName) {
                alert('El nombre del equipo no puede estar vacío.');
                return;
            }

            const membersObject = {};
            const integrantesString = members.join(', ');
            members.forEach((member, index) => {
                membersObject[`Integrante${index + 1}`] = member;
            });

            const teamData = { id: teamName, integrantes: integrantesString, ...membersObject, color: '#4A90E2' }; // Color por defecto al crear
            addDoc('equipos', teamData);
        });

        addConceptBtn.addEventListener('click', () => {
            const conceptName = document.getElementById('newConceptName').value.trim();
            const conceptPoints = document.getElementById('newConceptPoints').value.trim();
            
            let pointsToSave;
            if (conceptPoints === '') {
                pointsToSave = 'Sin información';
            } else {
                pointsToSave = parseFloat(conceptPoints);
            }

            addDoc('conceptos', { id: conceptName, valorPuntos: pointsToSave });
        });

        addMaterialBtn.addEventListener('click', () => addDoc('materiales', { id: document.getElementById('newMaterialName').value.trim() }));

        addImageConceptBtn.addEventListener('click', () => addImageConcept(document.getElementById('newImageConceptName').value.trim(), document.getElementById('newImageConceptTable').value));

        // CABLE CONCEPTS ADD LOGIC
        addCableConceptBtn.addEventListener('click', () => {
            const conceptName = document.getElementById('newCableConceptName').value.trim();
            const shortName = document.getElementById('newCableConceptShortName').value.trim();
            const conceptPoints = document.getElementById('newCableConceptPoints').value.trim();
            
            let pointsToSave;
            if (conceptPoints === '') {
                pointsToSave = 'Sin información';
            } else {
                pointsToSave = parseFloat(conceptPoints);
            }

            addDoc('ConceptoCable', { id: conceptName, nombre: conceptName, puntos: pointsToSave, shortName: shortName });
        });

        async function addDoc(collectionName, data) {
            if (!data.id) {
                alert('El campo de nombre no puede estar vacío.');
                return;
            }
            try {
                const { id, ...dataToSave } = data;
                await setDoc(doc(db, collectionName, id), dataToSave);
                await loadAllData();
            } catch (error) {
                alert(`Error al añadir el elemento: ${error.message}`);
                console.error(error);
            } finally {
                checkConnection();
            }
        }

        async function addImageConcept(conceptName, tabla) {
            if (!conceptName) {
                alert('El campo de nombre no puede estar vacío.');
                return;
            }
            try {
                const docRef = doc(db, "concepimagen", tabla);
                const docSnap = await getDoc(docRef);
                const currentConcepts = docSnap.exists() ? docSnap.data().conceptos : [];

                if (currentConcepts.includes(conceptName)) {
                    alert('Este concepto ya existe en la tabla.');
                    return;
                }

                await setDoc(docRef, { conceptos: [...currentConcepts, conceptName] });
                await loadAndRenderImageConcepts();
            } catch (error) {
                alert(`Error al añadir el concepto de imagen: ${error.message}`);
                console.error(error);
            } finally {
                checkConnection();
            }
        }

        // --- EDITING AND DELETING LOGIC ---
        let currentTeamId = null;

        window.closeModal = (modalId) => {
            document.getElementById(modalId).style.display = "none";
        }

        window.openEditMembersModal = async (teamId) => {
            currentTeamId = teamId;
            const teamDoc = await getDoc(doc(db, "equipos", teamId));
            const teamData = teamDoc.data();

            document.getElementById('membersModalTeamName').textContent = teamId;
            const container = document.getElementById('membersModalContainer');
            container.innerHTML = '';

            const memberKeys = Object.keys(teamData).filter(key => key.startsWith('Integrante')).sort();
            
            memberKeys.forEach((key, index) => {
                const memberName = teamData[key];
                const inputWrapper = document.createElement('div');
                inputWrapper.className = 'flex items-center gap-2';
                inputWrapper.innerHTML = `
                    <label class="font-medium text-sm">Integrante ${index + 1}:</label>
                    <input type="text" class="px-3 py-2 border rounded-md flex-grow" value="${memberName}" data-member-key="${key}">
                `;
                container.appendChild(inputWrapper);
            });

            document.getElementById('editMembersModal').style.display = "block";
        };

        document.getElementById('addMemberModalBtn').addEventListener('click', () => {
            const container = document.getElementById('membersModalContainer');
            const newIndex = container.querySelectorAll('input').length + 1;
            let inputWrapper = document.createElement('div');
            inputWrapper.className = 'flex items-center gap-2';
            inputWrapper.innerHTML = `
                <label class="font-medium text-sm">Integrante ${newIndex}:</label>
                <input type="text" class="px-3 py-2 border rounded-md flex-grow" placeholder="Nuevo Integrante" data-member-key="Integrante${newIndex}">
            `;
            container.appendChild(inputWrapper);
        });

        document.getElementById('saveMembersBtn').addEventListener('click', async () => {
            const container = document.getElementById('membersModalContainer');
            const inputs = container.querySelectorAll('input');
            const newData = {};
            const integrantesArray = [];
            let i = 1;
            
            // Collect members and create a new set of IntegranteX keys
            inputs.forEach(input => {
                if (input.value.trim() !== '') {
                    const newKey = `Integrante${i}`;
                    newData[newKey] = input.value.trim();
                    integrantesArray.push(input.value.trim());
                    i++;
                }
            });
            newData.integrantes = integrantesArray.join(', ');
            
            // Use merge:true to update existing fields and keep other data (like color)
            await setDoc(doc(db, "equipos", currentTeamId), newData, { merge: true });
            
            closeModal('editMembersModal');
            loadAndRenderCollection('equipos', teamsTableBody, renderTeamRow);
        });


        window.openCarModal = async (teamId) => {
            currentTeamId = teamId;
            const teamDoc = await getDoc(doc(db, "equipos", teamId));
            const teamData = teamDoc.data();

            document.getElementById('carModalTeamName').textContent = teamId;
            document.getElementById('carMatriculaInput').value = teamData.matricula || '';

            const fusionadorasContainer = document.getElementById('fusionadorasModalContainer');
            fusionadorasContainer.innerHTML = '';
            
            if (teamData.fusionadoras) {
                teamData.fusionadoras.forEach(f => {
                    const fusionadoraWrapper = document.createElement('div');
                    fusionadoraWrapper.className = 'flex flex-col md:flex-row gap-2 fusionadora-item';
                    fusionadoraWrapper.innerHTML = `
                        <input type="text" class="px-3 py-2 border rounded-md" placeholder="Tipo de Fusionadora" value="${f.tipo || ''}">
                        <input type="text" class="px-3 py-2 border rounded-md" placeholder="S/N de Fusionadora" value="${f.sn || ''}">
                    `;
                    fusionadorasContainer.appendChild(fusionadoraWrapper);
                });
            }
            // Add an empty one for adding new by default
            const emptyFusionadoraWrapper = document.createElement('div');
            emptyFusionadoraWrapper.className = 'flex flex-col md:flex-row gap-2 fusionadora-item';
            emptyFusionadoraWrapper.innerHTML = `
                <input type="text" class="px-3 py-2 border rounded-md" placeholder="Tipo de Fusionadora">
                <input type="text" class="px-3 py-2 border rounded-md" placeholder="S/N de Fusionadora">
            `;
            fusionadorasContainer.appendChild(emptyFusionadoraWrapper);


            document.getElementById('editCarModal').style.display = "block";
        };

        document.getElementById('addFusionadoraModalBtn').addEventListener('click', () => {
            const container = document.getElementById('fusionadorasModalContainer');
            const newFusionadoraWrapper = document.createElement('div');
            newFusionadoraWrapper.className = 'flex flex-col md:flex-row gap-2 fusionadora-item';
            newFusionadoraWrapper.innerHTML = `
                <input type="text" class="px-3 py-2 border rounded-md" placeholder="Tipo de Fusionadora">
                <input type="text" class="px-3 py-2 border rounded-md" placeholder="S/N de Fusionadora">
            `;
            container.appendChild(newFusionadoraWrapper);
        });

        document.getElementById('saveCarBtn').addEventListener('click', async () => {
            const matricula = document.getElementById('carMatriculaInput').value.trim();
            const fusionadoras = [];
            const fusionadoraItems = document.querySelectorAll('#fusionadorasModalContainer .fusionadora-item');
            
            fusionadoraItems.forEach(item => {
                const tipo = item.querySelector('input:nth-child(1)').value.trim();
                const sn = item.querySelector('input:nth-child(2)').value.trim();
                if (tipo || sn) {
                    fusionadoras.push({ tipo, sn });
                }
            });

            await setDoc(doc(db, "equipos", currentTeamId), { 
                matricula: matricula, 
                fusionadoras: fusionadoras 
            }, { merge: true });

            closeModal('editCarModal');
            loadAndRenderCollection('equipos', teamsTableBody, renderTeamRow);
        });

        window.openToolsModal = async (teamId) => {
            currentTeamId = teamId;
            const teamDoc = await getDoc(doc(db, "equipos", teamId));
            const teamData = teamDoc.data();

            document.getElementById('toolsModalTeamName').textContent = teamId;
            const container = document.getElementById('toolsModalContainer');
            container.innerHTML = '';
            
            if (teamData.herramientas) {
                teamData.herramientas.forEach(tool => {
                    const inputWrapper = document.createElement('div');
                    inputWrapper.className = 'flex items-center gap-2 tool-item';
                    inputWrapper.innerHTML = `<input type="text" class="px-3 py-2 border rounded-md flex-grow" placeholder="Nombre de la herramienta" value="${tool}">`;
                    container.appendChild(inputWrapper);
                });
            }
            // Add an empty one for adding new by default
            const emptyInputWrapper = document.createElement('div');
            emptyInputWrapper.className = 'flex items-center gap-2 tool-item';
            emptyInputWrapper.innerHTML = `<input type="text" class="px-3 py-2 border rounded-md flex-grow" placeholder="Nombre de la herramienta">`;
            container.appendChild(emptyInputWrapper);
            

            document.getElementById('editToolsModal').style.display = "block";
        };

        document.getElementById('addToolModalBtn').addEventListener('click', () => {
            const container = document.getElementById('toolsModalContainer');
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'flex items-center gap-2 tool-item';
            inputWrapper.innerHTML = `<input type="text" class="px-3 py-2 border rounded-md flex-grow" placeholder="Nombre de la herramienta">`;
            container.appendChild(inputWrapper);
        });


        document.getElementById('saveToolsBtn').addEventListener('click', async () => {
            const container = document.getElementById('toolsModalContainer');
            const inputs = container.querySelectorAll('input');
            const tools = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);

            await setDoc(doc(db, "equipos", currentTeamId), { herramientas: tools }, { merge: true });

            closeModal('editToolsModal');
            loadAndRenderCollection('equipos', teamsTableBody, renderTeamRow);
        });

        window.saveDoc = async (collectionName, docId, element) => {
            const row = element.closest('tr');
            const editableCells = row.querySelectorAll('[contenteditable="true"]');
            const updates = {};
            let newId = docId;

            try {
                editableCells.forEach(cell => {
                    const field = cell.getAttribute('data-field');
                    let value = cell.textContent.trim();
                    
                    if (field === 'id') {
                        if (value === '') throw new Error('El campo de nombre no puede estar vacío.');
                        newId = value;
                    } else if (field === 'valorPuntos' || field === 'puntos') {
                        if (value === '' || value.toLowerCase() === 'sin información') {
                            value = 'Sin información';
                        } else {
                            const parsedValue = parseFloat(value);
                            if (isNaN(parsedValue)) throw new Error(`El valor de ${field} debe ser un número.`);
                            value = parsedValue;
                        }
                        updates[field] = value;
                    } else {
                        updates[field] = value;
                    }
                });
                
                // If the ID changed, delete the old document and create a new one
                if (newId !== docId) {
                    await deleteDoc(doc(db, collectionName, docId));
                    await setDoc(doc(db, collectionName, newId), updates);
                } else {
                    await setDoc(doc(db, collectionName, docId), updates, { merge: true });
                }

                await loadAllData();
                alert('¡Documento guardado con éxito!');

            } catch (error) {
                alert(`Error al guardar el documento: ${error.message}`);
                console.error(error);
                // Reload data to reset table state on error
                await loadAllData();
            } finally {
                checkConnection();
            }
        };

        window.deleteDoc = async (collectionName, docId) => {
            if (confirm(`¿Estás seguro de que quieres borrar '${docId}' de la base de datos?`)) {
                try {
                    await deleteDoc(doc(db, collectionName, docId));
                    alert('¡Documento borrado con éxito!');
                    await loadAllData();
                } catch (error) {
                    alert(`Error al borrar el elemento: ${error.message}`);
                    console.error(error);
                } finally {
                    checkConnection();
                }
            }
        };

        window.deleteImageConcept = async (conceptName, tabla) => {
            if (confirm(`¿Estás seguro de que quieres borrar '${conceptName}' de la tabla '${tabla}'?`)) {
                try {
                    const docRef = doc(db, "concepimagen", tabla);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const currentConcepts = docSnap.data().conceptos;
                        const updatedConcepts = currentConcepts.filter(c => c !== conceptName);
                        
                        await setDoc(docRef, { conceptos: updatedConcepts });
                        alert('¡Concepto borrado con éxito!');
                        await loadAndRenderImageConcepts();
                    } else {
                        alert('La tabla especificada no existe.');
                    }
                } catch (error) {
                    alert(`Error al borrar el concepto: ${error.message}`);
                    console.error(error);
                } finally {
                    checkConnection();
                }
            }
        };

        // ====================================================================
        // FIN DEL CÓDIGO RESTAURADO Y MODIFICADO
        // ====================================================================

    </script>
</body>
</html>
