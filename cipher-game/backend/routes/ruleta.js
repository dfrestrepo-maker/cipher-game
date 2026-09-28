/* ═══════════════════════════════════════════════════════
   ROUTES/RULETA.JS — Endpoints de SIGMA Matrix (ruleta).
   Ver controllers/ruletaController.js para la lógica.
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const { verificarToken } = require('../middleware/auth');
const ruleta = require('../controllers/ruletaController');

const router = express.Router();

router.post('/sesion',        verificarToken, ruleta.crearSesion);
router.patch('/sesion/:id',   verificarToken, ruleta.cerrarSesion);
router.post('/respuesta',     verificarToken, ruleta.guardarRespuesta);

module.exports = router;
