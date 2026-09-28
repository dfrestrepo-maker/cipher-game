/* ═══════════════════════════════════════════════════════
   CONTROLLERS/POSTTESTCONTROLLER.JS — Evaluación final
   Mismas preguntas que el pre-test; comparar ambos mide el
   aprendizaje real del estudiante tras jugar.
   ═══════════════════════════════════════════════════════ */
const supabase = require('../supabase');

async function guardarPosttest(req, res) {
  const { respuestas } = req.body;

  if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ error: 'Respuestas requeridas' });
  }

  const filas = respuestas.map(r => ({
    id_usuario:     req.usuario.id,
    id_pregunta:    r.id_pregunta,
    tema:           r.tema,
    respuesta_dada: r.respuesta_dada,
    es_correcta:    r.es_correcta,
    tiempo_ms:      r.tiempo_ms ?? null,
  }));

  const { error } = await supabase.from('posttest').insert(filas);
  if (error) return res.status(500).json({ error: error.message });

  const correctas = filas.filter(r => r.es_correcta).length;
  const total     = filas.length;

  res.status(201).json({
    mensaje: 'Post-test guardado',
    correctas,
    total,
    porcentaje: Math.round((correctas / total) * 100),
  });
}

/**
 * Devuelve el resumen completo del estudiante para la pantalla final:
 * comparación pre/post por tema, partidas jugadas y desempeño en la ruleta.
 */
async function obtenerResumen(req, res) {
  const idUsuario = req.usuario.id;

  const [pretest, posttest, partidas, sesiones] = await Promise.all([
    supabase.from('pretest')
      .select('id_pregunta, tema, es_correcta, tiempo_ms')
      .eq('id_usuario', idUsuario),

    supabase.from('posttest')
      .select('id_pregunta, tema, es_correcta, tiempo_ms')
      .eq('id_usuario', idUsuario),

    supabase.from('partidas')
      .select('nivel, monedas_recogidas, fue_detectado, intentos, completo')
      .eq('id_usuario', idUsuario),

    supabase.from('ruleta_sesiones')
      .select('fichas_iniciales, fichas_finales, cuota, cuota_alcanzada, ruleta_respuestas(tema, es_correcta)')
      .eq('id_usuario', idUsuario),
  ]);

  res.json({
    pretest:  pretest.data  ?? [],
    posttest: posttest.data ?? [],
    partidas: partidas.data ?? [],
    ruleta:   sesiones.data ?? [],
  });
}

module.exports = { guardarPosttest, obtenerResumen };
