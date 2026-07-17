-- Esquema de Base de Datos - Planta Externa NetData

-- Crear usuario para la IA (antigravity)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'antigravity') THEN
        CREATE ROLE antigravity WITH LOGIN PASSWORD 'AntigravityPexDb2026!';
    END IF;
END
$$;

-- Otorgar privilegios al usuario antigravity
GRANT ALL PRIVILEGES ON SCHEMA public TO antigravity;

-- 1. Equipos
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    integrantes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios
CREATE TYPE user_role AS ENUM ('tecnico', 'gestor', 'coordinador', 'admin');
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'tecnico',
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE SET NULL,
    associated_member VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Conceptos de Trabajo (Baremos)
CREATE TABLE IF NOT EXISTS concepts (
    id VARCHAR(100) PRIMARY KEY,
    valor_puntos NUMERIC(10, 2) NOT NULL,
    orden INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Conceptos de Cable
CREATE TABLE IF NOT EXISTS cables (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    puntos NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Materiales
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(100) PRIMARY KEY,
    orden INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tareas / Órdenes
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    fecha DATE NOT NULL,
    equipo VARCHAR(50) REFERENCES teams(id) ON DELETE RESTRICT,
    integrantes TEXT NOT NULL,
    ubicacion TEXT,
    descripcion_general TEXT,
    es_sin_exito BOOLEAN NOT NULL DEFAULT FALSE,
    puntos_totales_estimados NUMERIC(10, 2) DEFAULT 0.00,
    por_encargo_activa BOOLEAN DEFAULT FALSE,
    por_encargo_descripcion TEXT,
    es_urgente_activa BOOLEAN DEFAULT FALSE,
    es_urgente_descripcion TEXT,
    tarea_mantenimiento_activa BOOLEAN DEFAULT FALSE,
    tarea_mantenimiento_descripcion TEXT,
    tarea_mantenimiento_informacion TEXT,
    puntos_trabajo JSONB DEFAULT '[]'::jsonb,
    gasto_material JSONB DEFAULT '{}'::jsonb,
    informacion_adicional_material TEXT,
    cable_desplegado JSONB DEFAULT '{}'::jsonb,
    sin_exito_motivo TEXT,
    sin_exito_visitas INTEGER DEFAULT 1,
    sin_exito_direccion TEXT,
    sin_exito_informacion TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Datos de Extracción IA
CREATE TABLE IF NOT EXISTS task_parsed_data (
    task_id VARCHAR(50) PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    correctivo_id VARCHAR(100),
    codigo_tarea_externo VARCHAR(100),
    tipo_incidencia VARCHAR(100),
    estado VARCHAR(100),
    nivel_incidencia VARCHAR(100),
    fecha_registro VARCHAR(100),
    cliente_id VARCHAR(100),
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
    producto VARCHAR(255),
    propietario_red VARCHAR(255),
    instrucciones_tecnicas TEXT,
    notas_operador TEXT,
    sn_router VARCHAR(100),
    sn_cliente VARCHAR(100),
    direccion_instalacion TEXT,
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    es_traslado BOOLEAN DEFAULT FALSE,
    nueva_direccion TEXT,
    nueva_latitud NUMERIC(10, 8),
    nueva_longitud NUMERIC(11, 8),
    coste_cierre NUMERIC(10, 2),
    permanencia_meses INTEGER,
    sugerencias_y_preguntas JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- SEMILLAS INICIALES ---

-- Equipos
INSERT INTO teams (id, integrantes) VALUES
('NetData 1', 'Jose, Ignacio') ON CONFLICT (id) DO UPDATE SET integrantes = EXCLUDED.integrantes;
INSERT INTO teams (id, integrantes) VALUES
('NetData 2', 'Olesandr, Andriy B') ON CONFLICT (id) DO UPDATE SET integrantes = EXCLUDED.integrantes;
INSERT INTO teams (id, integrantes) VALUES
('NetData 3', 'Harrison, Manuel B') ON CONFLICT (id) DO UPDATE SET integrantes = EXCLUDED.integrantes;
INSERT INTO teams (id, integrantes) VALUES
('NetData 4', 'Jose Carlos, Jose R') ON CONFLICT (id) DO UPDATE SET integrantes = EXCLUDED.integrantes;

-- Conceptos de Trabajo
INSERT INTO concepts (id, valor_puntos, orden) VALUES
('manipulación de caja existente', 0.86, 1),
('desmontaje de caja', 0.71, 2),
('instalación de CTO', 1.74, 3),
('instalación de CTR', 1.74, 4),
('instalación de Distribucion', 1.74, 5),
('instalación de Torpedo', 1.74, 6),
('manipulación de Splitter', 0.29, 7),
('preparación de final de cable', 1.33, 8),
('fusiones', 0.66, 9),
('suplemento de fibra en servicio', 0.76, 10),
('etiquetas de cable', 0.05, 11),
('etiquetas de caja', 0.02, 12),
('levantamiento de divisor en Antala', 0.16, 13),
('medición de señal con fusión', 0.88, 14),
('sangrado', 2.26, 15)
ON CONFLICT (id) DO UPDATE SET valor_puntos = EXCLUDED.valor_puntos, orden = EXCLUDED.orden;

-- Cables
INSERT INTO cables (id, nombre, puntos) VALUES
('interior', 'Cable Interior', 0.1449),
('fachada', 'Cable Fachada', 0.1449),
('arqueta', 'Cable Arqueta', 0.0724),
('camara', 'Cable Cámara', 0.0724),
('aereo', 'Cable Aéreo', 0.0902)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, puntos = EXCLUDED.puntos;

-- Materiales
INSERT INTO materials (id, orden) VALUES
('Cable Aereo', 1),
('Cable Tierra', 2),
('CTO blanca (interior)', 3),
('Mixta (rayada)', 4),
('CTO 16 puertos', 5),
('CTO 8 puertos', 6),
('TOF96 (torpedo)', 7),
('Minicau (torpedo nuevo)', 8),
('Divisor 1:2 desnudo', 9),
('Divisor 1:8 desnudo', 10),
('Bridas medianas', 11),
('Bridas grandes', 12),
('Bridas pequeñas', 13),
('Cancamo', 14),
('Pinzas pequeñas', 15),
('Pinzas medianas', 16),
('Cinta', 17),
('Pigtail', 18),
('Pasamuro (enfrentador)', 19),
('Pachcord (latiguillo)', 20)
ON CONFLICT (id) DO UPDATE SET orden = EXCLUDED.orden;
