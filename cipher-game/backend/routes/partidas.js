/* ═══════════════════════════════════════════════════════
   ROUTES/PARTIDAS.JS — Endpoints de partidas (Coordinados).
   Ver controllers/partidasController.js para la lógica.
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const { verificarToken } = require('../middleware/auth');
const partidas = require('../controllers/partidasController');

const router = express.Router();

router.post('/',      verificarToken, partidas.crearPartida);
router.patch('/:id',  verificarToken, partidas.actualizarPartida);

module.exports = router;
