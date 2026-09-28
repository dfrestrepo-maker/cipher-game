/* ═══════════════════════════════════════════════════════
   ROUTES/AUTH.JS — Define los endpoints de autenticación.
   Sin lógica de negocio aquí; ver controllers/authController.js
   ═══════════════════════════════════════════════════════ */
const express = require('express');
const auth    = require('../controllers/authController');

const router = express.Router();

router.post('/registro', auth.registro);
router.post('/login',    auth.login);

module.exports = router;
