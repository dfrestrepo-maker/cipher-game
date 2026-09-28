-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN — Añadir post-test a una base de datos existente
--
-- Ejecuta este archivo SOLO si ya corriste schema.sql antes y
-- no quieres perder los datos de estudiantes ya registrados.
-- Si vas a empezar de cero, ejecuta schema.sql completo en su lugar.
-- ═══════════════════════════════════════════════════════

-- 1) Nueva tabla del post-test
CREATE TABLE IF NOT EXISTS posttest (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  id_pregunta   INTEGER NOT NULL,
  tema          TEXT NOT NULL,
  respuesta_dada INTEGER NOT NULL,
  es_correcta   BOOLEAN NOT NULL,
  tiempo_ms     INTEGER,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posttest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario_propio_posttest" ON posttest;
CREATE POLICY "usuario_propio_posttest"
  ON posttest FOR ALL
  USING (id_usuario::text = current_setting('app.user_id', true));

-- 2) Reemplazar la vista del admin para incluir pre vs post
DROP VIEW IF EXISTS vista_admin_resultados;

CREATE VIEW vista_admin_resultados AS
SELECT
  u.id,
  u.nombre,
  u.correo,
  u.grado,
  pre.total       AS preguntas_pretest,
  pre.correctas   AS correctas_pretest,
  pre.porcentaje  AS porcentaje_pretest,
  post.total      AS preguntas_posttest,
  post.correctas  AS correctas_posttest,
  post.porcentaje AS porcentaje_posttest,
  COALESCE(post.porcentaje, 0) - COALESCE(pre.porcentaje, 0) AS mejora_puntos,
  coord.partidas      AS partidas_jugadas,
  coord.nivel_maximo  AS nivel_maximo,
  coord.prom_intentos AS promedio_intentos,
  rul.total      AS preguntas_ruleta,
  rul.correctas  AS correctas_ruleta,
  rul.porcentaje AS porcentaje_ruleta
FROM usuarios u
LEFT JOIN (
  SELECT id_usuario, COUNT(*) AS total,
         SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END) AS correctas,
         ROUND(100.0 * SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(*), 0), 1) AS porcentaje
  FROM pretest GROUP BY id_usuario
) pre ON pre.id_usuario = u.id
LEFT JOIN (
  SELECT id_usuario, COUNT(*) AS total,
         SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END) AS correctas,
         ROUND(100.0 * SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(*), 0), 1) AS porcentaje
  FROM posttest GROUP BY id_usuario
) post ON post.id_usuario = u.id
LEFT JOIN (
  SELECT id_usuario, COUNT(*) AS partidas,
         MAX(nivel) AS nivel_maximo,
         ROUND(AVG(intentos), 1) AS prom_intentos
  FROM partidas GROUP BY id_usuario
) coord ON coord.id_usuario = u.id
LEFT JOIN (
  SELECT rs.id_usuario, COUNT(rr.id) AS total,
         SUM(CASE WHEN rr.es_correcta THEN 1 ELSE 0 END) AS correctas,
         ROUND(100.0 * SUM(CASE WHEN rr.es_correcta THEN 1 ELSE 0 END)
               / NULLIF(COUNT(rr.id), 0), 1) AS porcentaje
  FROM ruleta_sesiones rs
  JOIN ruleta_respuestas rr ON rr.id_sesion = rs.id
  GROUP BY rs.id_usuario
) rul ON rul.id_usuario = u.id
WHERE u.id_rol = 1
ORDER BY u.nombre;
