/* ═══════════════════════════════════════════════════════
   CONTROLLERS/PARTIDASCONTROLLER.JS — Lógica de partidas (Coordinados)
   ═══════════════════════════════════════════════════════ */
const supabase = require('../supabase');

async function crearPartida(req, res) {
  const { nivel } = req.body;

  const { data, error } = await supabase
    .from('partidas')
    .insert({
      id_usuario: req.usuario.id,
      nivel:      nivel ?? 1,
      completo:   false,
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id_partida: data.id });
}

async function actualizarPartida(req, res) {
  const { id } = req.params;
  const { monedas_recogidas, fue_detectado, intentos, tiempo_segundos, completo } = req.body;

  const { error } = await supabase
    .from('partidas')
    .update({ monedas_recogidas, fue_detectado, intentos, tiempo_segundos, completo })
    .eq('id', id)
    .eq('id_usuario', req.usuario.id); // solo el dueño puede actualizar su propia partida

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Partida actualizada' });
}

module.exports = { crearPartida, actualizarPartida };
