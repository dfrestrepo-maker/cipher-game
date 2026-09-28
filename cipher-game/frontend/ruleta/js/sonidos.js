/* ═══════════════════════════════════════════════════════════
   SONIDOS.JS — Motor de audio con Web Audio API
   Sin archivos externos · Sin API key · Sin librerías
   ═══════════════════════════════════════════════════════════ */

let _ctx = null;
let _tickInterval = null;

/** Obtiene (o crea) el AudioContext. Se llama tras interacción del usuario. */
function ctx() {
  // Reutiliza el contexto de Musica para compartir la cadena de volumen
  if (typeof Musica !== 'undefined') {
    Musica.activar();
    const nodo = Musica.nodoSFX();
    if (nodo) { _ctx = nodo.context; return _ctx; }
  }
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/** Nodo de salida de los efectos: respeta el volumen de SFX del jugador */
function destinoSFX() {
  if (typeof Musica !== 'undefined') {
    const nodo = Musica.nodoSFX();
    if (nodo) return nodo;
  }
  return ctx().destination;
}

/**
 * Genera una nota sintética.
 * @param {number} hz       - frecuencia
 * @param {number} t        - tiempo de inicio (ctx.currentTime + offset)
 * @param {number} dur      - duración en segundos
 * @param {string} tipo     - tipo de oscilador: sine | square | sawtooth | triangle
 * @param {number} vol      - volumen máximo (0-1)
 */
function nota(hz, t, dur, tipo = 'sine', vol = 0.25) {
  const c = ctx();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.connect(env);
  env.connect(destinoSFX());
  osc.type = tipo;
  osc.frequency.value = hz;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(vol, t + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

// ── Sonidos del juego ─────────────────────────────────────

/** Tick suave cada segundo mientras el cronómetro corre */
export function sonidoTick() {
  const c = ctx(), t = c.currentTime;
  nota(900, t, 0.025, 'square', 0.05);
}

/** Tick urgente cuando quedan ≤5 segundos */
export function sonidoTickUrgente() {
  const c = ctx(), t = c.currentTime;
  nota(1400, t,        0.03, 'square', 0.1);
  nota(1000, t + 0.04, 0.03, 'square', 0.07);
}

/** Buzzer cuando el tiempo se agota */
export function sonidoBuzzer() {
  const c = ctx(), t = c.currentTime;
  nota(180, t,        0.35, 'sawtooth', 0.28);
  nota(140, t + 0.18, 0.35, 'sawtooth', 0.22);
  nota(100, t + 0.38, 0.3,  'sawtooth', 0.18);
}

/** Monedas cayendo al sacrificar fichas por bolas extra */
export function sonidoGastarFichas() {
  const c = ctx(), t = c.currentTime;
  [520, 420, 320].forEach((hz, i) => {
    nota(hz, t + i * 0.07, 0.1, 'sine', 0.18);
  });
  nota(90, t + 0.18, 0.15, 'triangle', 0.15);
}

/** Tick rápido mientras la ruleta gira */
export function iniciarGiro() {
  let velocidad = 60;
  _tickInterval = setInterval(() => {
    const c = ctx();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env); env.connect(destinoSFX());
    osc.type = 'square';
    osc.frequency.value = 900 + Math.random() * 200;
    env.gain.setValueAtTime(0.04, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    osc.start(t); osc.stop(t + 0.02);
  }, velocidad);
}

export function detenerGiro() {
  clearInterval(_tickInterval);
  _tickInterval = null;
}

/** Click metálico cuando la bola cae en la casilla */
export function sonidoCaida() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.connect(env); env.connect(destinoSFX());
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
  env.gain.setValueAtTime(0.5, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.start(t); osc.stop(t + 0.13);
}

/** Arpeggio ascendente al acertar */
export function sonidoCorrecto() {
  const c = ctx(), t = c.currentTime;
  nota(523, t,        0.18, 'sine', 0.28); // C5
  nota(659, t + 0.1,  0.18, 'sine', 0.24); // E5
  nota(784, t + 0.2,  0.28, 'sine', 0.22); // G5
  nota(1047, t + 0.3, 0.3,  'sine', 0.18); // C6
}

/** Buzz descendente al fallar */
export function sonidoIncorrecto() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.connect(env); env.connect(destinoSFX());
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.linearRampToValueAtTime(80, t + 0.35);
  env.gain.setValueAtTime(0.22, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  osc.start(t); osc.stop(t + 0.36);
}

/** Ping de moneda al recibir fichas (positivo) o whoosh al perder */
export function sonidoFichas(valor) {
  const c = ctx(), t = c.currentTime;
  if (valor > 0) {
    nota(880,  t,       0.07, 'sine', 0.18);
    nota(1100, t + 0.05, 0.07, 'sine', 0.14);
  } else if (valor < 0) {
    nota(280, t, 0.18, 'triangle', 0.2);
  }
}

/** Fanfare corta al ganar */
export function sonidoVictoria() {
  const c = ctx(), t = c.currentTime;
  [523, 659, 784, 1047, 1319].forEach((hz, i) => {
    nota(hz, t + i * 0.11, 0.22, 'sine', 0.28);
  });
}

/** Trombón triste al perder */
export function sonidoDerrota() {
  const c = ctx(), t = c.currentTime;
  [400, 350, 300, 240].forEach((hz, i) => {
    nota(hz, t + i * 0.18, 0.22, 'sawtooth', 0.2);
  });
}

/** Llamar en el primer clic del usuario para desbloquear el contexto */
export function activar() { ctx(); }

// ── Música de fondo ──────────────────────────────────────
// Delegada al motor compartido Musica (frontend/js/musica.js),
// que genera música adaptativa y respeta los controles de volumen.

export function iniciarBeatFondo() {
  if (typeof Musica !== 'undefined') { Musica.activar(); Musica.iniciar(); }
}

export function detenerBeatFondo() {
  if (typeof Musica !== 'undefined') Musica.detener();
}

/** Ajusta el ánimo de la música (0 = calma, 1 = frenético) */
export function setIntensidadMusica(v) {
  if (typeof Musica !== 'undefined') Musica.setIntensidad(v);
}
