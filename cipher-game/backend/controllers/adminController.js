/* ═══════════════════════════════════════════════════════
   CONTROLLERS/ADMINCONTROLLER.JS — Lógica del panel de administración
   ═══════════════════════════════════════════════════════ */
const supabase = require('../supabase');

async function obtenerResultados(req, res) {
  const { data, error } = await supabase
    .from('vista_admin_resultados')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function obtenerDetalleUsuario(req, res) {
  const { id } = req.params;

  const [pretest, posttest, partidas, sesiones] = await Promise.all([
    supabase.from('pretest')
      .select('id_pregunta, tema, es_correcta, tiempo_ms, fecha')
      .eq('id_usuario', id)
      .order('fecha'),

    supabase.from('posttest')
      .select('id_pregunta, tema, es_correcta, tiempo_ms, fecha')
      .eq('id_usuario', id)
      .order('fecha'),

    supabase.from('partidas')
      .select('nivel, monedas_recogidas, fue_detectado, intentos, tiempo_segundos, completo, fecha')
      .eq('id_usuario', id)
      .order('fecha'),

    supabase.from('ruleta_sesiones')
      .select(`
        fichas_iniciales, fichas_finales, cuota, cuota_alcanzada, bolas_usadas, fecha,
        ruleta_respuestas(tema, es_correcta, fichas_apostadas, multiplicador, delta_fichas, tiempo_ms)
      `)
      .eq('id_usuario', id)
      .order('fecha'),
  ]);

  res.json({
    pretest:  pretest.data  ?? [],
    posttest: posttest.data ?? [],
    partidas: partidas.data ?? [],
    ruleta:   sesiones.data ?? [],
  });
}

async function obtenerEstadisticasGlobales(req, res) {
  const { data: usuarios } = await supabase
    .from('usuarios').select('id', { count: 'exact' }).eq('id_rol', 1);

  const { data: pretests } = await supabase
    .from('pretest').select('es_correcta');

  const { data: posttests } = await supabase
    .from('posttest').select('es_correcta');

  const { data: ruleta } = await supabase
    .from('ruleta_respuestas').select('es_correcta');

  const porcentajeAciertos = arr => arr?.length
    ? Math.round(100 * arr.filter(r => r.es_correcta).length / arr.length)
    : 0;

  res.json({
    total_estudiantes:   usuarios?.length ?? 0,
    porcentaje_pretest:  porcentajeAciertos(pretests),
    porcentaje_posttest: porcentajeAciertos(posttests),
    porcentaje_ruleta:   porcentajeAciertos(ruleta),
    total_respuestas:    (pretests?.length ?? 0) + (posttests?.length ?? 0) + (ruleta?.length ?? 0),
  });
}

module.exports = { obtenerResultados, obtenerDetalleUsuario, obtenerEstadisticasGlobales };
