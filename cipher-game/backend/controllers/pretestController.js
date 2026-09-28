/* ═══════════════════════════════════════════════════════
   CONTROLLERS/PRETESTCONTROLLER.JS — Lógica del diagnóstico inicial
   ═══════════════════════════════════════════════════════ */
const supabase = require('../supabase');

async function guardarPretest(req, res) {
  const { respuestas } = req.body; // [{ id_pregunta, tema, respuesta_dada, es_correcta, tiempo_ms }]

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

  const { error } = await supabase.from('pretest').insert(filas);
  if (error) return res.status(500).json({ error: error.message });

  const correctas = filas.filter(r => r.es_correcta).length;
  const total      = filas.length;

  res.status(201).json({
    mensaje: 'Pre-test guardado',
    correctas,
    total,
    porcentaje: Math.round((correctas / total) * 100),
  });
}

async function obtenerEstadoPretest(req, res) {
  const { data, error } = await supabase
    .from('pretest')
    .select('id')
    .eq('id_usuario', req.usuario.id)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ completado: data.length > 0 });
}

module.exports = { guardarPretest, obtenerEstadoPretest };
