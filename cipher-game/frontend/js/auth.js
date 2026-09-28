/* ═══════════════════════════════════════════════════════
   AUTH.JS — Manejo de sesión en el frontend
   ═══════════════════════════════════════════════════════ */

const Auth = (() => {
  const TOKEN_KEY   = 'cipher_token';
  const USUARIO_KEY = 'cipher_usuario';

  // Ruta absoluta a login.html calculada desde la ubicación real de este script.
  // auth.js siempre vive en frontend/js/auth.js, así que esto funciona sin
  // importar qué carpeta se abrió en Live Server ni la profundidad de la página.
  const _urlJs       = new URL('.', document.currentScript.src);  // .../frontend/js/
  const _urlFrontend = new URL('..', _urlJs);                     // .../frontend/
  const _urlLogin    = new URL('pages/login.html', _urlFrontend).href;

  function guardarSesion(token, usuario) {
    localStorage.setItem(TOKEN_KEY,   token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  }

  function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    window.location.href = _urlLogin;
  }

  function obtenerUsuario() {
    const u = localStorage.getItem(USUARIO_KEY);
    return u ? JSON.parse(u) : null;
  }

  function estaAutenticado() {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /** Llama esto al inicio de cada página protegida */
  function protegerPagina(rolRequerido = null) {
    if (!estaAutenticado()) {
      window.location.href = _urlLogin;
      return null;
    }
    const usuario = obtenerUsuario();
    if (rolRequerido && usuario.rol !== rolRequerido) {
      window.location.href = _urlLogin;
      return null;
    }
    return usuario;
  }

  return { guardarSesion, cerrarSesion, obtenerUsuario, estaAutenticado, protegerPagina };
})();
