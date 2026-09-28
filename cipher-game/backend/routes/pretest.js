/* ═══════════════════════════════════════════════════════
   ROUTES/PRETEST.JS — Endpoints del diagnóstico inicial.
   Ver controllers/pretestController.js para la lógica.
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const { verificarToken } = require('../middleware/auth');
const pretest = require('../controllers/pretestController');

const router = express.Router();

router.post('/',    verificarToken, pretest.guardarPretest);
router.get('/mio',  verificarToken, pretest.obtenerEstadoPretest);

module.exports = router;
