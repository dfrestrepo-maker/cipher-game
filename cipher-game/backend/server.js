/* ═══════════════════════════════════════════════════════
   SERVER.JS — Punto de entrada del backend de CIPHER
   ═══════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const pretestRoutes = require('./routes/pretest');
const posttestRoutes= require('./routes/posttest');
const partidaRoutes = require('./routes/partidas');
const ruletaRoutes  = require('./routes/ruleta');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ─────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/pretest', pretestRoutes);
app.use('/api/posttest',posttestRoutes);
app.use('/api/partidas',partidaRoutes);
app.use('/api/ruleta',  ruletaRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health check ──────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, version: '1.0.0' }));

app.listen(PORT, () => console.log(`CIPHER backend activo en puerto ${PORT}`));
