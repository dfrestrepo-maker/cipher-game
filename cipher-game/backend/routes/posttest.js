/* ═══════════════════════════════════════════════════════
   ROUTES/POSTTEST.JS — Endpoints de la evaluación final.
   Ver controllers/posttestController.js para la lógica.
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const { verificarToken } = require('../middleware/auth');
const posttest = require('../controllers/posttestController');

const router = express.Router();

router.post('/',        verificarToken, posttest.guardarPosttest);
router.get('/resumen',  verificarToken, posttest.obtenerResumen);

module.exports = router;
