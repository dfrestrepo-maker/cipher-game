/* ═══════════════════════════════════════════════════════
   ROUTES/ADMIN.JS — Endpoints del panel de administración.
   Ver controllers/adminController.js para la lógica.
   Todas las rutas requieren token válido y rol admin.
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const admin   = require('../controllers/adminController');

const router = express.Router();

router.use(verificarToken, soloAdmin);

router.get('/resultados',    admin.obtenerResultados);
router.get('/usuario/:id',   admin.obtenerDetalleUsuario);
router.get('/estadisticas',  admin.obtenerEstadisticasGlobales);

module.exports = router;
