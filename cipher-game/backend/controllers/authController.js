/* ═══════════════════════════════════════════════════════
   CONTROLLERS/AUTHCONTROLLER.JS — Lógica de registro y login
   Las rutas solo delegan aquí; toda la lógica de negocio vive
   en este archivo (separación de responsabilidades).
   ═══════════════════════════════════════════════════════ */
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../supabase');
// Misma lista que usa el frontend — una sola fuente de verdad
const { validarNombre } = require('../../frontend/js/filtro-nombres.js');

function firmarToken(usuario, rol) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

async function registro(req, res) {
  const { nombre, correo, grado, password } = req.body;

  if (!nombre || !correo || !grado || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // El frontend ya valida, pero se revalida aquí: un cliente puede saltarse
  // la validación del navegador enviando la petición directamente.
  const revision = validarNombre(nombre);
  if (!revision.valido) {
    return res.status(400).json({ error: revision.error });
  }

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', correo)
    .single();

  if (existente) {
    return res.status(409).json({ error: 'El correo ya está registrado' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nombre, correo, grado, password_hash, id_rol: 1 })
    .select('id, nombre, correo, grado, id_rol')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = firmarToken(data, 'estudiante');
  res.status(201).json({ token, usuario: data });
}

async function login(req, res) {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, grado, password_hash, id_rol, roles(nombre)')
    .eq('correo', correo)
    .single();

  if (error || !usuario) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const valida = await bcrypt.compare(password, usuario.password_hash);
  if (!valida) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const rol   = usuario.roles?.nombre ?? 'estudiante';
  const token = firmarToken(usuario, rol);

  res.json({
    token,
    usuario: {
      id:     usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      grado:  usuario.grado,
      rol,
    },
  });
}

module.exports = { registro, login };
