/* ═══════════════════════════════════════════════════════════
   TEMA.JS — Modo claro / oscuro para todas las pantallas

   Va en el <head> de cada página (antes de los estilos se pinten)
   para que no haya parpadeo. Usa la preferencia guardada; si no hay,
   la del dispositivo. Inyecta solo el botón flotante para cambiarlo.
   Avisa a los canvas con el evento 'cambio-tema' (detail: 'claro'|'oscuro').
   ═══════════════════════════════════════════════════════════ */

const Tema = (() => {
  const CLAVE = 'cipher_tema';
  const raiz  = document.documentElement;

  function _leer() {
    try { return localStorage.getItem(CLAVE); } catch (_) { return null; }
  }

  function _actualizarBoton() {
    const btn = document.getElementById('btn-tema');
    if (!btn) return;
    const claro = raiz.dataset.tema === 'claro';
    btn.textContent = claro ? '☾' : '☀';
    btn.setAttribute('aria-label', claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    btn.title = btn.getAttribute('aria-label');
  }

  function aplicar(tema) {
    raiz.dataset.tema = tema;
    try { localStorage.setItem(CLAVE, tema); } catch (_) {}
    _actualizarBoton();
    document.dispatchEvent(new CustomEvent('cambio-tema', { detail: tema }));
  }

  const guardado = _leer();
  raiz.dataset.tema = (guardado === 'claro' || guardado === 'oscuro')
    ? guardado
    : (matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'btn-tema';
    btn.type = 'button';
    btn.className = 'boton-tema';
    btn.addEventListener('click', () => aplicar(raiz.dataset.tema === 'claro' ? 'oscuro' : 'claro'));
    document.body.appendChild(btn);
    _actualizarBoton();
  });

  return { actual: () => raiz.dataset.tema, aplicar };
})();
