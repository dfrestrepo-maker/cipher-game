-- ═══════════════════════════════════════════════════════
-- CIPHER GAME — Schema de base de datos en Supabase
-- Ejecutar este archivo en el SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════

-- ── Extensión para UUIDs ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tabla: roles ─────────────────────────────────────
CREATE TABLE roles (
  id   SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE  -- 'estudiante' | 'admin'
);
INSERT INTO roles (nombre) VALUES ('estudiante'), ('admin');

-- ── Tabla: usuarios ──────────────────────────────────
CREATE TABLE usuarios (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  correo       TEXT NOT NULL UNIQUE,
  grado        TEXT NOT NULL,          -- ej: '10°', '11°'
  password_hash TEXT NOT NULL,
  id_rol       INTEGER REFERENCES roles(id) DEFAULT 1,
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: pretest ───────────────────────────────────
-- Guarda cada respuesta individual del pre-test
CREATE TABLE pretest (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  id_pregunta   INTEGER NOT NULL,      -- número de la pregunta (1-12)
  tema          TEXT NOT NULL,         -- 'puntos' | 'cuadrantes' | 'desplazamientos'
  respuesta_dada INTEGER NOT NULL,     -- índice de opción elegida (0-3)
  es_correcta   BOOLEAN NOT NULL,
  tiempo_ms     INTEGER,               -- tiempo que tardó en responder
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: posttest ──────────────────────────────────
-- Mismas preguntas que el pre-test, aplicadas al terminar el juego.
-- Comparar ambos permite medir el aprendizaje real del estudiante.
CREATE TABLE posttest (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  id_pregunta   INTEGER NOT NULL,      -- mismo id que en pretest (1-16)
  tema          TEXT NOT NULL,         -- 'puntos' | 'cuadrantes' | 'desplazamientos' | 'algebra'
  respuesta_dada INTEGER NOT NULL,
  es_correcta   BOOLEAN NOT NULL,
  tiempo_ms     INTEGER,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: partidas ──────────────────────────────────
-- Una fila por partida jugada (Coordinados)
CREATE TABLE partidas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario        UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nivel             INTEGER NOT NULL,           -- 1 o 2
  monedas_recogidas INTEGER NOT NULL DEFAULT 0, -- 0-3
  fue_detectado     BOOLEAN NOT NULL DEFAULT FALSE,
  intentos          INTEGER NOT NULL DEFAULT 1, -- veces que reinició
  tiempo_segundos   INTEGER,                    -- duración de la partida
  completo          BOOLEAN NOT NULL DEFAULT FALSE,
  fecha             TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: ruleta_sesiones ────────────────────────────
-- Una fila por sesión completa de SIGMA Matrix
CREATE TABLE ruleta_sesiones (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario          UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  id_partida          UUID REFERENCES partidas(id) ON DELETE CASCADE,
  fichas_iniciales    INTEGER NOT NULL,  -- monedas × 15
  fichas_finales      INTEGER NOT NULL,
  cuota               INTEGER NOT NULL,
  cuota_alcanzada     BOOLEAN NOT NULL DEFAULT FALSE,
  bolas_usadas        INTEGER NOT NULL DEFAULT 0,
  fecha               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: ruleta_respuestas ─────────────────────────
-- Cada respuesta individual en la ruleta (post-test real)
CREATE TABLE ruleta_respuestas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_sesion       UUID REFERENCES ruleta_sesiones(id) ON DELETE CASCADE,
  id_pregunta_gen TEXT NOT NULL,       -- enunciado resumido o hash
  tema            TEXT NOT NULL,       -- tipo de pregunta
  es_correcta     BOOLEAN NOT NULL,
  fichas_apostadas INTEGER NOT NULL,
  multiplicador   NUMERIC(3,1) NOT NULL,
  delta_fichas    INTEGER NOT NULL,    -- ganancia o pérdida real
  tiempo_ms       INTEGER,
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Vista para el panel de admin ─────────────────────
CREATE VIEW vista_admin_resultados AS
SELECT
  u.id,
  u.nombre,
  u.correo,
  u.grado,

  -- ── Pre-test (diagnóstico inicial) ──
  pre.total       AS preguntas_pretest,
  pre.correctas   AS correctas_pretest,
  pre.porcentaje  AS porcentaje_pretest,

  -- ── Post-test (evaluación final) ──
  post.total      AS preguntas_posttest,
  post.correctas  AS correctas_posttest,
  post.porcentaje AS porcentaje_posttest,

  -- ── Mejora real: cuántos puntos porcentuales ganó ──
  COALESCE(post.porcentaje, 0) - COALESCE(pre.porcentaje, 0) AS mejora_puntos,

  -- ── Coordinados ──
  coord.partidas      AS partidas_jugadas,
  coord.nivel_maximo  AS nivel_maximo,
  coord.prom_intentos AS promedio_intentos,

  -- ── SIGMA Matrix (ruleta) ──
  rul.total      AS preguntas_ruleta,
  rul.correctas  AS correctas_ruleta,
  rul.porcentaje AS porcentaje_ruleta

FROM usuarios u

-- Agregados del pre-test
LEFT JOIN (
  SELECT id_usuario,
         COUNT(*)                                        AS total,
         SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)   AS correctas,
         ROUND(100.0 * SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(*), 0), 1)                 AS porcentaje
  FROM pretest GROUP BY id_usuario
) pre ON pre.id_usuario = u.id

-- Agregados del post-test
LEFT JOIN (
  SELECT id_usuario,
         COUNT(*)                                        AS total,
         SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)   AS correctas,
         ROUND(100.0 * SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(*), 0), 1)                 AS porcentaje
  FROM posttest GROUP BY id_usuario
) post ON post.id_usuario = u.id

-- Agregados de Coordinados
LEFT JOIN (
  SELECT id_usuario,
         COUNT(*)                      AS partidas,
         MAX(nivel)                    AS nivel_maximo,
         ROUND(AVG(intentos), 1)       AS prom_intentos
  FROM partidas GROUP BY id_usuario
) coord ON coord.id_usuario = u.id

-- Agregados de la ruleta (respuestas de todas sus sesiones)
LEFT JOIN (
  SELECT rs.id_usuario,
         COUNT(rr.id)                                       AS total,
         SUM(CASE WHEN rr.es_correcta THEN 1 ELSE 0 END)   AS correctas,
         ROUND(100.0 * SUM(CASE WHEN rr.es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(rr.id), 0), 1)                AS porcentaje
  FROM ruleta_sesiones rs
  JOIN ruleta_respuestas rr ON rr.id_sesion = rs.id
  GROUP BY rs.id_usuario
) rul ON rul.id_usuario = u.id

WHERE u.id_rol = 1  -- solo estudiantes
ORDER BY u.nombre;

-- ── Insertar admins iniciales ─────────────────────────
-- Reemplaza el password_hash con bcrypt real antes de producción
INSERT INTO usuarios (nombre, correo, grado, password_hash, id_rol)
VALUES
  ('Admin Principal', 'admin@cipher.edu.co', 'N/A',
   '$2b$10$PLACEHOLDER_HASH_ADMIN_1', 2),
  ('Admin ThinkIOT',  'thinkiot@cipher.edu.co', 'N/A',
   '$2b$10$PLACEHOLDER_HASH_ADMIN_2', 2);

-- ── Row Level Security (RLS) ─────────────────────────
-- Los estudiantes solo ven sus propios datos
ALTER TABLE pretest              ENABLE ROW LEVEL SECURITY;
ALTER TABLE posttest             ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruleta_sesiones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruleta_respuestas    ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario solo accede a sus filas
CREATE POLICY "usuario_propio_pretest"
  ON pretest FOR ALL
  USING (id_usuario::text = current_setting('app.user_id', true));

CREATE POLICY "usuario_propio_posttest"
  ON posttest FOR ALL
  USING (id_usuario::text = current_setting('app.user_id', true));

CREATE POLICY "usuario_propio_partidas"
  ON partidas FOR ALL
  USING (id_usuario::text = current_setting('app.user_id', true));
