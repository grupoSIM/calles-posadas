-- ============================================================================
-- Calles de Posadas — Esquema de Base de Datos SQLite (DEC-001)
-- Tablas Relacionales + FTS5 (Búsqueda) + R*Tree (Espacial Bounding Box)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Barrios y Chacras
CREATE TABLE IF NOT EXISTS barrios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'BARRIO_OFICIAL', 'BARRIO_SOCIAL', 'CHACRA', 'OTRO'
    numero_chacra INTEGER NULL,
    referencia_ordenanza TEXT NULL,
    geojson TEXT NOT NULL, -- Polígono o MultiPolígono en GeoJSON
    min_x REAL NOT NULL,
    max_x REAL NOT NULL,
    min_y REAL NOT NULL,
    max_y REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_barrios_nombre ON barrios(nombre);
CREATE INDEX IF NOT EXISTS idx_barrios_numero_chacra ON barrios(numero_chacra);

-- 2. Tabla Principal de Calles y Avenidas
CREATE TABLE IF NOT EXISTS calles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    nombre_oficial TEXT NOT NULL,
    nombre_normalizado TEXT NOT NULL,
    numero_calle INTEGER NULL,
    tipo_via TEXT NOT NULL, -- 'AVENIDA', 'CALLE', 'PASAJE', 'DIAGONAL', 'COSTANERA'
    sentido_circulacion TEXT NOT NULL DEFAULT 'DOBLE', -- 'MANO_UNICA', 'DOBLE', 'PEATONAL'
    longitud_total_m REAL NOT NULL DEFAULT 0,
    tiene_ciclovia INTEGER NOT NULL DEFAULT 0, -- 0 o 1
    tipo_ciclovia TEXT NULL, -- 'CICLOVIA_SEGREGADA', 'BICISENDA_COMPARTIDA', NULL
    explicacion TEXT NULL,
    referencia_ordenanza TEXT NULL,
    url_ordenanza TEXT NULL,
    categoria_toponimica TEXT NOT NULL DEFAULT 'OTRO',
    min_x REAL NOT NULL,
    max_x REAL NOT NULL,
    min_y REAL NOT NULL,
    max_y REAL NOT NULL,
    geojson_traza TEXT NOT NULL, -- FeatureCollection / LineString en GeoJSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calles_slug ON calles(slug);
CREATE INDEX IF NOT EXISTS idx_calles_numero ON calles(numero_calle);
CREATE INDEX IF NOT EXISTS idx_calles_tipo_via ON calles(tipo_via);
CREATE INDEX IF NOT EXISTS idx_calles_tiene_ciclovia ON calles(tiene_ciclovia);

-- 3. Segmentos y Tramos
CREATE TABLE IF NOT EXISTS tramos_calle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calle_id INTEGER NOT NULL REFERENCES calles(id) ON DELETE CASCADE,
    orden_tramo INTEGER NOT NULL DEFAULT 1,
    altura_inicio INTEGER NULL,
    altura_fin INTEGER NULL,
    barrio_id INTEGER NULL REFERENCES barrios(id) ON DELETE SET NULL,
    numero_chacra INTEGER NULL,
    tiene_ciclovia INTEGER NOT NULL DEFAULT 0,
    longitud_m REAL NOT NULL DEFAULT 0,
    geojson TEXT NOT NULL,
    FOREIGN KEY (calle_id) REFERENCES calles(id)
);

CREATE INDEX IF NOT EXISTS idx_tramos_calle_id ON tramos_calle(calle_id);
CREATE INDEX IF NOT EXISTS idx_tramos_barrio_id ON tramos_calle(barrio_id);

-- 4. Relación N:M Calles <-> Barrios (para consultas y filtros de catálogo)
CREATE TABLE IF NOT EXISTS calle_barrios (
    calle_id INTEGER NOT NULL REFERENCES calles(id) ON DELETE CASCADE,
    barrio_id INTEGER NOT NULL REFERENCES barrios(id) ON DELETE CASCADE,
    PRIMARY KEY (calle_id, barrio_id)
);

CREATE INDEX IF NOT EXISTS idx_calle_barrios_barrio ON calle_barrios(barrio_id);

-- 5. Tabla Virtual FTS5 para Búsqueda Full-Text por Nombres, Números y Alias
CREATE VIRTUAL TABLE IF NOT EXISTS calles_fts USING fts5(
    nombre_oficial,
    nombre_normalizado,
    numero_calle,
    content='calles',
    content_rowid='id'
);

-- Triggers para mantener sincronizada la tabla FTS5
CREATE TRIGGER IF NOT EXISTS calles_ai AFTER INSERT ON calles BEGIN
    INSERT INTO calles_fts(rowid, nombre_oficial, nombre_normalizado, numero_calle)
    VALUES (new.id, new.nombre_oficial, new.nombre_normalizado, new.numero_calle);
END;

CREATE TRIGGER IF NOT EXISTS calles_ad AFTER DELETE ON calles BEGIN
    INSERT INTO calles_fts(calles_fts, rowid, nombre_oficial, nombre_normalizado, numero_calle)
    VALUES('delete', old.id, old.nombre_oficial, old.nombre_normalizado, old.numero_calle);
END;

CREATE TRIGGER IF NOT EXISTS calles_au AFTER UPDATE ON calles BEGIN
    INSERT INTO calles_fts(calles_fts, rowid, nombre_oficial, nombre_normalizado, numero_calle)
    VALUES('delete', old.id, old.nombre_oficial, old.nombre_normalizado, old.numero_calle);
    INSERT INTO calles_fts(rowid, nombre_oficial, nombre_normalizado, numero_calle)
    VALUES (new.id, new.nombre_oficial, new.nombre_normalizado, new.numero_calle);
END;

-- 6. Tablas Virtuales R*Tree para Índices Espaciales (Bounding Boxes)
-- calles_rtree permite filtrar calles dentro del viewport visible del mapa en microsegundos
CREATE VIRTUAL TABLE IF NOT EXISTS calles_rtree USING rtree(
    id,
    min_x, max_x, -- Longitud (min_lon, max_lon)
    min_y, max_y  -- Latitud  (min_lat, max_lat)
);

CREATE TRIGGER IF NOT EXISTS calles_rtree_ai AFTER INSERT ON calles BEGIN
    INSERT INTO calles_rtree(id, min_x, max_x, min_y, max_y)
    VALUES (new.id, new.min_x, new.max_x, new.min_y, new.max_y);
END;

CREATE TRIGGER IF NOT EXISTS calles_rtree_ad AFTER DELETE ON calles BEGIN
    DELETE FROM calles_rtree WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS calles_rtree_au AFTER UPDATE ON calles BEGIN
    DELETE FROM calles_rtree WHERE id = old.id;
    INSERT INTO calles_rtree(id, min_x, max_x, min_y, max_y)
    VALUES (new.id, new.min_x, new.max_x, new.min_y, new.max_y);
END;

-- barrios_rtree para búsqueda espacial de barrios
CREATE VIRTUAL TABLE IF NOT EXISTS barrios_rtree USING rtree(
    id,
    min_x, max_x,
    min_y, max_y
);

CREATE TRIGGER IF NOT EXISTS barrios_rtree_ai AFTER INSERT ON barrios BEGIN
    INSERT INTO barrios_rtree(id, min_x, max_x, min_y, max_y)
    VALUES (new.id, new.min_x, new.max_x, new.min_y, new.max_y);
END;

CREATE TRIGGER IF NOT EXISTS barrios_rtree_ad AFTER DELETE ON barrios BEGIN
    DELETE FROM barrios_rtree WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS barrios_rtree_au AFTER UPDATE ON barrios BEGIN
    DELETE FROM barrios_rtree WHERE id = old.id;
    INSERT INTO barrios_rtree(id, min_x, max_x, min_y, max_y)
    VALUES (new.id, new.min_x, new.max_x, new.min_y, new.max_y);
END;
