/* ═══════════════════════════════════════════════════════════
   ESTADO.JS — Store central de la partida
   Sin sistema de bolas extra — máximo 5 fijo
   Nuevo sistema de apuestas por opción con multiplicadores
   ═══════════════════════════════════════════════════════════ */

// Cuánto sube/baja el valor de una casilla al responder
const MODIFICADORES = {
  muy_baja:   { mejora: 5,  penalizacion: 3  },
  baja:       { mejora: 7,  penalizacion: 4  },
  baja_media: { mejora: 10, penalizacion: 6  },
  media:      { mejora: 14, penalizacion: 8  },
  media_alta: { mejora: 18, penalizacion: 10 },
  alta:       { mejora: 24, penalizacion: 14 },
  muy_alta:   { mejora: 30, penalizacion: 18 },
};

// Multiplicador de ganancia según cuántas opciones apuesta el jugador
// Pago total = apuesta × multiplicador  /  net gain = apuesta × (mult - 1)
export const MULTIPLICADORES_APUESTA = { 1: 2.5, 2: 1.5, 3: 1.0 };

export const MAX_RONDAS = 3;

/** Nombre legible del tema de una ronda específica (para pantallas de transición) */
export function nombreTemaDeRonda(n) {
  return CONFIGURACION_RONDAS[n]?.nombreTema ?? `Ronda ${n}`;
}

// Cada ronda tiene su propio tema matemático — más difícil y nuevo cada vez
const CONFIGURACION_RONDAS = {
  1: {
    cuota: 600, dificultad: 'muy_baja', bolasBase: 5, timerDuracion: 20,
    tema: 'puntos',
    nombreTema: 'Puntos y cuadrantes',
  },
  2: {
    cuota: 5000, dificultad: 'baja', bolasBase: 5, timerDuracion: 35,
    tema: 'desplazamientos',
    nombreTema: 'Desplazamientos en el plano',
  },
  3: {
    cuota: 40000, dificultad: 'baja_media', bolasBase: 6, timerDuracion: 40,
    tema: 'algebra',
    nombreTema: 'Álgebra básica — despejar variables',
  },
};

function crearEstadoInicial() {
  // El nivel/ronda lo define Coordinados al terminar cada habitación
  // (nivel 1 → ronda 1, nivel 2 → ronda 2, nivel 3 → ronda 3)
  const nivelGuardado = parseInt(sessionStorage.getItem('cipher_nivel') ?? '1');
  const ronda = Math.min(Math.max(nivelGuardado, 1), MAX_RONDAS);

  // Fichas acumuladas a través de todos los niveles de Coordinados jugados hasta ahora.
  // Si no existe (primera vez abriendo directo la ruleta), usa monedasRobadas × 15 como respaldo.
  const fichasGuardadas = sessionStorage.getItem('cipher_fichas_totales');
  const monedasRobadas  = parseInt(sessionStorage.getItem('monedasRobadas') ?? '1');
  const fichasIniciales = fichasGuardadas !== null
    ? parseInt(fichasGuardadas)
    : Math.max(1, monedasRobadas) * 15;

  return {
    ronda,
    fase:               'listo',
    fichas:             fichasIniciales,
    monedasOrigen:      monedasRobadas,
    bolasRestantes:     CONFIGURACION_RONDAS[ronda].bolasBase,
    casillaActual:      null,
    problemasActivos:   [],
    problemaSeleccionado: null,
    opcionesApostadas:  [],
    montoApuesta:       1,
    metricas: { correctas: 0, incorrectas: 0 },
  };
}

let _estado = crearEstadoInicial();

// ── Getters ───────────────────────────────────────────────
export const estado = {
  get ronda()                { return _estado.ronda; },
  get fase()                 { return _estado.fase; },
  get fichas()               { return _estado.fichas; },
  get bolasRestantes()       { return _estado.bolasRestantes; },
  get casillaActual()        { return _estado.casillaActual; },
  get problemasActivos()     { return _estado.problemasActivos; },
  get problemaSeleccionado() { return _estado.problemaSeleccionado; },
  get opcionesApostadas()    { return [..._estado.opcionesApostadas]; },
  get montoApuesta()         { return _estado.montoApuesta; },
  get metricas()             { return { ..._estado.metricas }; },

  get configuracionRonda()   { return CONFIGURACION_RONDAS[_estado.ronda] ?? CONFIGURACION_RONDAS[1]; },
  get cuota()                { return this.configuracionRonda.cuota; },
  get modificadoresCasilla() { return MODIFICADORES[this.configuracionRonda.dificultad]; },
  get temaRonda()            { return this.configuracionRonda.tema; },
  get esUltimaRonda()        { return _estado.ronda >= MAX_RONDAS; },

  get puedeLanzar()          { return _estado.fase === 'listo' && _estado.bolasRestantes > 0; },

  /** Multiplicador actual según cuántas opciones están apostadas */
  get multiplicadorActual() {
    const n = _estado.opcionesApostadas.length;
    return n > 0 ? (MULTIPLICADORES_APUESTA[n] ?? 1) : 0;
  },

  /** El jugador puede apostar si tiene al menos 1 ficha */
  get puedeApostar() {
    return _estado.fichas > 0 && _estado.opcionesApostadas.length > 0 && _estado.montoApuesta >= 1;
  },

  /** Máximo que puede apostar (sus fichas actuales) */
  get maxApuesta() {
    return Math.max(0, _estado.fichas);
  },

  /** Ganancia neta si acierta */
  get gananciaNetaSiAcierta() {
    const mult = this.multiplicadorActual;
    return mult > 0 ? Math.floor(_estado.montoApuesta * (mult - 1)) : 0;
  },
};

// ── Mutaciones ────────────────────────────────────────────
export function setFase(f)               { _estado.fase = f; }
export function setCasillaActual(n)      { _estado.casillaActual = n; }
export function setProblemasActivos(p)   {
  _estado.problemasActivos  = p;
  _estado.problemaSeleccionado = null;
  _estado.opcionesApostadas = [];
  _estado.montoApuesta      = 1;
}
export function setProblemaSeleccionado(i) { _estado.problemaSeleccionado = i; }

/** Agrega o quita una opción de la lista de apuestas (toggle) */
export function toggleOpcionApostada(indice) {
  const idx = _estado.opcionesApostadas.indexOf(indice);
  if (idx >= 0) {
    _estado.opcionesApostadas.splice(idx, 1);
  } else if (_estado.opcionesApostadas.length < 3) {
    _estado.opcionesApostadas.push(indice);
  }
  // Ajustar monto si supera el máximo disponible
  if (_estado.montoApuesta > estado.maxApuesta) {
    _estado.montoApuesta = Math.max(1, estado.maxApuesta);
  }
}

export function setMontoApuesta(monto) {
  const max = estado.maxApuesta;
  _estado.montoApuesta = Math.min(max, Math.max(1, Math.floor(monto)));
}

export function aplicarFichas(delta) {
  _estado.fichas = _estado.fichas + delta;
}

export function gastarBola() {
  if (_estado.bolasRestantes > 0) _estado.bolasRestantes--;
}

export function registrarRespuesta(esCorrecta) {
  if (esCorrecta) _estado.metricas.correctas++;
  else            _estado.metricas.incorrectas++;
}

/**
 * Avanza a la siguiente ronda tras superar la cuota.
 * Las fichas se conservan; las bolas se reponen según la nueva ronda.
 */
export function avanzarRonda() {
  if (_estado.ronda >= MAX_RONDAS) return false;
  _estado.ronda++;
  _estado.bolasRestantes = CONFIGURACION_RONDAS[_estado.ronda].bolasBase;
  _estado.casillaActual  = null;
  _estado.problemasActivos = [];
  _estado.problemaSeleccionado = null;
  _estado.opcionesApostadas = [];
  _estado.montoApuesta = 1;
  return true;
}

export function reiniciar() {
  _estado = crearEstadoInicial();
}
