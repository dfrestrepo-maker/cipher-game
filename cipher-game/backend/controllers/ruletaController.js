/* ═══════════════════════════════════════════════════════
   CONTROLLERS/RULETACONTROLLER.JS — Lógica de SIGMA Matrix (ruleta)
   ═══════════════════════════════════════════════════════ */
const supabase = require('../supabase');

async function crearSesion(req, res) {
  const { id_partida, fichas_iniciales, cuota } = req.body;

  const { data, error } = await supabase
    .from('ruleta_sesiones')
    .insert({
      id_usuario:      req.usuario.id,
      id_partida,
      fichas_iniciales,
      fichas_finales:  fichas_iniciales,
      cuota,
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id_sesion: data.id });
}

async function cerrarSesion(req, res) {
  const { fichas_finales, bolas_usadas, cuota_alcanzada } = req.body;

  const { error } = await supabase
    .from('ruleta_sesiones')
    .update({ fichas_finales, bolas_usadas, cuota_alcanzada })
    .eq('id', req.params.id)
    .eq('id_usuario', req.usuario.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Sesión de ruleta cerrada' });
}

async function guardarRespuesta(req, res) {
  const {
    id_sesion, id_pregunta_gen, tema, es_correcta,
    fichas_apostadas, multiplicador, delta_fichas, tiempo_ms,
  } = req.body;

  const { error } = await supabase
    .from('ruleta_respuestas')
    .insert({
      id_sesion, id_pregunta_gen, tema, es_correcta,
      fichas_apostadas, multiplicador, delta_fichas, tiempo_ms,
    });

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ mensaje: 'Respuesta guardada' });
}

module.exports = { crearSesion, cerrarSesion, guardarRespuesta };
