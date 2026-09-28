/* ═══════════════════════════════════════════════════════════
   CASILLAS.JS — Estado de cada ranura de la ruleta
   Todas empiezan con VALOR_BASE. Las respuestas solo modifican
   el valor futuro; las fichas se dan al caer, no al responder.

   Persistencia: cada ronda de SIGMA Matrix es una carga de página
   nueva (el jugador vuelve de Coordinados entre rondas), así que
   el estado de las casillas se guarda en sessionStorage para que
   las mejoras/deterioros se conserven durante TODA la partida,
   no solo dentro de una ronda.
   ═══════════════════════════════════════════════════════════ */

export const VALOR_BASE = 3;

export const ORDEN_TODAS = [
  0, '00', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36,
];

const CLAVE_STORAGE = 'cipher_casillas_estado';

function _cargarDesdeStorage() {
  try {
    const raw = sessionStorage.getItem(CLAVE_STORAGE);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw)));
  } catch {
    return new Map();
  }
}

function _guardarEnStorage() {
  try {
    sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(Object.fromEntries(_modificaciones)));
  } catch {
    // sessionStorage no disponible — continúa sin persistir (no rompe el juego)
  }
}

// Solo guarda casillas cuyo valor fue modificado por alguna respuesta.
// Se restaura al cargar el módulo para que las rondas anteriores no se pierdan.
let _modificaciones = _cargarDesdeStorage();

// ── Consultas ─────────────────────────────────────────────

/** Valor actual (base si nunca fue respondida) */
export function obtenerValorCasilla(numero) {
  return _modificaciones.get(String(numero)) ?? VALOR_BASE;
}

/** True si el jugador ya respondió aquí (en esta ronda o en una anterior) */
export function casillaFueModificada(numero) {
  return _modificaciones.has(String(numero));
}

/**
 * Estado visual: 'base' | 'mejorada' | 'deteriorada' | 'negativa' | 'neutro'
 */
export function obtenerEstadoVisual(numero) {
  if (!casillaFueModificada(numero)) return 'base';
  const v = obtenerValorCasilla(numero);
  if (v > VALOR_BASE) return 'mejorada';
  if (v > 0)          return 'deteriorada';
  if (v < 0)          return 'negativa';
  return 'neutro';
}

/** Mapa con TODAS las casillas y sus valores actuales */
export function obtenerTodasLasCasillas() {
  const mapa = new Map();
  ORDEN_TODAS.forEach(num => {
    mapa.set(String(num), obtenerValorCasilla(num));
  });
  return mapa;
}

// ── Mutaciones ────────────────────────────────────────────

/** Suma delta al valor actual (puede volverse negativa) y lo persiste */
export function modificarCasilla(numero, delta) {
  const actual = obtenerValorCasilla(numero);
  _modificaciones.set(String(numero), actual + delta);
  _guardarEnStorage();
}

/** Reinicia todo (victoria final o derrota — nueva partida desde cero) */
export function reiniciarCasillas() {
  _modificaciones = new Map();
  try { sessionStorage.removeItem(CLAVE_STORAGE); } catch { /* silencioso */ }
}
