/* ═══════════════════════════════════════════════════════════
   MAIN.JS — Flujo del juego con apuestas y cronómetro
   Tiempo agotado = fallo automático (pierde apuesta + casilla empeora)
   ═══════════════════════════════════════════════════════════ */

import {
  estado, setFase, setCasillaActual, setProblemasActivos,
  setProblemaSeleccionado, toggleOpcionApostada, setMontoApuesta,
  aplicarFichas, gastarBola, registrarRespuesta,
  nombreTemaDeRonda,
  MULTIPLICADORES_APUESTA,
} from './estado.js';

import {
  VALOR_BASE,
  obtenerValorCasilla, casillaFueModificada,
  obtenerEstadoVisual, obtenerTodasLasCasillas,
  modificarCasilla, reiniciarCasillas,
} from './casillas.js';

import { generarUnProblema, verificarRespuesta } from './problemas.js';
import { RuletaCanvas } from './ruleta.js';
import * as ui from './ui.js';
import * as sonidos from './sonidos.js';

let ruleta      = null;
let _timerToast = null;           // setTimeout del toast antes del modal
let _timerCrono = null;           // setInterval del cronómetro
let _segundosRestantes  = 0;
let _totalSegundosCrono = 0;
let _eventosRegistrados = false;

// ── Inicialización ────────────────────────────────────────

function init() {
  // Mostrar el botín acumulado y en qué ronda está el jugador
  const monedasEsteNivel = parseInt(sessionStorage.getItem('monedasRobadas') ?? '1');
  const fichasEsteNivel  = Math.max(1, monedasEsteNivel) * 15;
  const fichasTotalesRaw = sessionStorage.getItem('cipher_fichas_totales');
  const fichasTotales    = fichasTotalesRaw !== null ? parseInt(fichasTotalesRaw) : fichasEsteNivel;
  const nivelActual      = parseInt(sessionStorage.getItem('cipher_nivel') ?? '1');

  const botinEl = document.getElementById('botin-texto');
  if (botinEl) {
    botinEl.textContent = nivelActual > 1
      ? `⬡ Ronda ${nivelActual} · +${fichasEsteNivel} créditos de este nivel · Total acumulado: ${fichasTotales} créditos`
      : `⬡ ${monedasEsteNivel} fragmento${monedasEsteNivel !== 1 ? 's' : ''} recuperado${monedasEsteNivel !== 1 ? 's' : ''} en Coordinados = ${fichasTotales} créditos`;
  }

  ui.mostrarPantallaInicio();
  document.getElementById('btn-comenzar').addEventListener('click', () => {
    sonidos.activar();
    sonidos.iniciarBeatFondo();
    ControlesAudio.montar();
    _actualizarIntensidadMusica();
    ui.mostrarPantallaJuego();
    _iniciarJuego();
  });
}

function _iniciarJuego() {
  const canvas = document.getElementById('canvas-ruleta');
  if (!ruleta) ruleta = new RuletaCanvas(canvas);
  ruleta.redimensionar(_tamañoCanvas());
  ruleta.mostrarBolaEnReposo();
  // Crear sesión en la BD con las fichas iniciales
  _crearSesionRuleta(estado.fichas, estado.cuota);

  ui.actualizarHUD();
  ui.inicializarTabsPanel();
  ui.actualizarGridTodasCasillas(obtenerTodasLasCasillas(), null);
  _registrarEventos();
  window.addEventListener('resize', () => ruleta?.redimensionar(_tamañoCanvas()));
}

function _tamañoCanvas() {
  const hudH   = document.getElementById('hud').offsetHeight;
  const ctrlH  = document.getElementById('controles').offsetHeight;
  const panelW = document.getElementById('panel-casillas').offsetWidth;
  return Math.max(240, Math.min(
    window.innerHeight - hudH - ctrlH - 24,
    window.innerWidth  - panelW - 32,
  ));
}

// ── Eventos ───────────────────────────────────────────────

function _registrarEventos() {
  if (_eventosRegistrados) return;
  _eventosRegistrados = true;

  document.getElementById('btn-lanzar').addEventListener('click', _onLanzar);
  document.getElementById('btn-continuar').addEventListener('click', _onContinuar);

  // Botón para silenciar/activar los beats de fondo
  // El panel flotante de volumen reemplaza al botón simple de silencio
  ControlesAudio.montar();

  // Evaluación final: post-test + pantalla de resultados comparativos
  document.getElementById('btn-evaluacion-final').addEventListener('click', () => {
    sonidos.detenerBeatFondo();
    window.location.href = '../pages/resultados.html';
  });

  // Mismo destino desde la pantalla de derrota
  document.getElementById('btn-evaluacion-derrota').addEventListener('click', () => {
    sonidos.detenerBeatFondo();
    window.location.href = '../pages/resultados.html';
  });

  // Victoria final: ir a Coordinados para una nueva misión (reset completo)
  document.getElementById('btn-reiniciar-victoria').addEventListener('click', () => {
    sessionStorage.removeItem('monedasRobadas');
    sessionStorage.removeItem('cipher_nivel');
    sessionStorage.removeItem('cipher_fichas_totales');
    reiniciarCasillas();
    window.location.href = '../coordinados/index.html';
  });

  // Derrota: volver a Coordinados nivel 1, limpiando toda la sesión (roguelike = desde 0)
  document.getElementById('btn-volver-robar').addEventListener('click', () => {
    sessionStorage.removeItem('monedasRobadas');
    sessionStorage.removeItem('cipher_nivel');
    sessionStorage.removeItem('cipher_fichas_totales');
    reiniciarCasillas();
    window.location.href = '../coordinados/index.html';
  });

  // Opciones de respuesta → toggle apuesta
  document.getElementById('contenedor-problemas').addEventListener('click', e => {
    if (estado.fase !== 'problema') return;
    const opcion = e.target.closest('.opcion');
    if (!opcion) return;
    toggleOpcionApostada(parseInt(opcion.dataset.opcion));
    ui.actualizarOpcionesApostadas();
  });

  // Stepper
  document.getElementById('btn-apuesta-menos').addEventListener('click', () => {
    setMontoApuesta(estado.montoApuesta - 1);
    ui.actualizarOpcionesApostadas();
  });
  document.getElementById('btn-apuesta-mas').addEventListener('click', () => {
    setMontoApuesta(estado.montoApuesta + 1);
    ui.actualizarOpcionesApostadas();
  });

  // Input directo — el jugador escribe la cantidad
  document.getElementById('apuesta-monto-display').addEventListener('input', e => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setMontoApuesta(val);
      ui.actualizarOpcionesApostadas();
    }
  });
  document.getElementById('apuesta-monto-display').addEventListener('blur', () => {
    ui.actualizarOpcionesApostadas(); // revalidar y mostrar valor corregido
  });

  // Botón ½ Mitad
  document.getElementById('btn-apuesta-mitad').addEventListener('click', () => {
    setMontoApuesta(Math.max(1, Math.floor(estado.montoApuesta / 2)));
    ui.actualizarOpcionesApostadas();
  });

  // Botón Apostar Todo
  document.getElementById('btn-apuesta-todo').addEventListener('click', () => {
    setMontoApuesta(estado.maxApuesta);
    ui.actualizarOpcionesApostadas();
  });

  document.getElementById('btn-confirmar').addEventListener('click', _onConfirmarApuesta);
}

// ── Cronómetro ────────────────────────────────────────────

function _iniciarCronometro() {
  const duracion = estado.configuracionRonda.timerDuracion;
  _totalSegundosCrono = duracion;
  _segundosRestantes  = duracion;

  _timerCrono = setInterval(() => {
    _segundosRestantes--;
    ui.actualizarCronometro(_segundosRestantes, _totalSegundosCrono);

    // Sonido por segundo
    if (_segundosRestantes <= 5 && _segundosRestantes > 0) {
      sonidos.sonidoTickUrgente();
    } else if (_segundosRestantes > 5) {
      sonidos.sonidoTick();
    }

    if (_segundosRestantes <= 0) {
      _detenerCronometro();
      sonidos.sonidoBuzzer();
      _onTiempoAgotado();
    }
  }, 1000);
}

function _detenerCronometro() {
  clearInterval(_timerCrono);
  _timerCrono = null;
}

// ── Handlers ──────────────────────────────────────────────

function _onLanzar() {
  if (!estado.puedeLanzar) return;
  setFase('girando');
  ui.actualizarHUD();
  sonidos.iniciarGiro();

  ruleta.girar(casilla => {
    sonidos.detenerGiro();
    sonidos.sonidoCaida();

    gastarBola();
    setCasillaActual(casilla);

    // Dar fichas de la casilla automáticamente
    const valorCasilla = obtenerValorCasilla(casilla);
    aplicarFichas(valorCasilla);
    sonidos.sonidoFichas(valorCasilla);
    ui.actualizarHUD();

    // Toast con countdown
    const DURACION_TOAST = 2200;
    ui.mostrarToastCasilla(casilla, valorCasilla, DURACION_TOAST);

    _timerToast = setTimeout(() => {
      ui.ocultarToastCasilla();

      // Verificar si puede apostar
      if (estado.fichas <= 0) {
        sonidos.detenerBeatFondo();
        sonidos.sonidoDerrota();
        setFase('derrota');
        ui.mostrarDerrota(estado.fichas, estado.cuota, 'sin_fichas');
        return;
      }

      _abrirModalProblema(casilla);
    }, DURACION_TOAST);
  });
}

function _abrirModalProblema(casilla) {
  const problemas = generarUnProblema(estado.ronda);
  setProblemasActivos(problemas);
  setProblemaSeleccionado(0);
  setFase('problema');

  if (casillaFueModificada(casilla)) {
    ui.mostrarAlertaCasilla(obtenerEstadoVisual(casilla), obtenerValorCasilla(casilla));
  } else {
    ui.ocultarAlertaCasilla();
  }

  ui.mostrarModalProblema(estado.configuracionRonda.timerDuracion);
  _iniciarCronometro();
}

function _onTiempoAgotado() {
  if (estado.fase !== 'problema') return;

  const item = estado.problemasActivos[estado.problemaSeleccionado];
  const n    = estado.opcionesApostadas.length;
  const mult = n > 0 ? (MULTIPLICADORES_APUESTA[n] ?? 1) : 1;

  // Pérdida: lo que hubiera apostado, o mínimo 1 ficha si no llegó a apostar nada
  const montoEfectivo = (n > 0 && estado.montoApuesta >= 1)
    ? estado.montoApuesta
    : 1;

  registrarRespuesta(false);
  _aplicarResultadoFallo(item, montoEfectivo, mult, true);
}

function _onConfirmarApuesta() {
  if (!estado.puedeApostar) return;
  _detenerCronometro();

  const item = estado.problemasActivos[estado.problemaSeleccionado];
  const { textoCorrecta, indiceCorrecto } = verificarRespuesta(item.problema, 0);
  const apostoCorrectamente = estado.opcionesApostadas.includes(indiceCorrecto);

  registrarRespuesta(apostoCorrectamente);

  const n     = estado.opcionesApostadas.length;
  const mult  = MULTIPLICADORES_APUESTA[n] ?? 1;
  const monto = estado.montoApuesta;

  if (apostoCorrectamente) {
    const ganancia = Math.floor(monto * (mult - 1));
    aplicarFichas(ganancia);
    sonidos.sonidoCorrecto();
    _aplicarResultadoCasilla(item, true, estado.casillaActual, monto, mult, ganancia, textoCorrecta);
  } else {
    sonidos.sonidoIncorrecto();
    _aplicarResultadoFallo(item, monto, mult, false, textoCorrecta);
  }
}

function _aplicarResultadoFallo(item, montoEfectivo, mult, esTiempoAgotado, textoCorrecta = '') {
  aplicarFichas(-montoEfectivo);
  const casilla = estado.casillaActual;
  const { penalizacion } = estado.modificadoresCasilla;
  modificarCasilla(casilla, -penalizacion);
  const nuevoValor = obtenerValorCasilla(casilla);
  ruleta.marcarCasilla(casilla, obtenerEstadoVisual(casilla));

  // Guardar respuesta en la BD
  _guardarRespuestaRuleta({
    id_pregunta_gen: item.problema.enunciado.substring(0, 80),
    tema:            estado.temaRonda,
    es_correcta:     false,
    fichas_apostadas: montoEfectivo,
    multiplicador:   mult,
    delta_fichas:    -montoEfectivo,
  });

  setFase('resultado');
  ui.ocultarModalProblema();
  ui.mostrarModalResultado({
    esCorrecta:   false,
    textoCorrecta: esTiempoAgotado ? '⏱ Tiempo agotado' : textoCorrecta,
    deltaApuesta: -montoEfectivo,
    deltaCasilla: -penalizacion,
    nuevoValor,
    casilla,
    esTiempoAgotado,
  });
  ui.actualizarHUD();
  _actualizarIntensidadMusica();

  const todas = obtenerTodasLasCasillas();
  ui.actualizarPanelCasillas(todas);
  ui.actualizarGridTodasCasillas(todas, casilla);
}

function _aplicarResultadoCasilla(item, apostoCorrectamente, casilla, monto, mult, ganancia, textoCorrecta) {
  const { mejora, penalizacion } = estado.modificadoresCasilla;
  const deltaCasilla = apostoCorrectamente ? mejora : -penalizacion;
  modificarCasilla(casilla, deltaCasilla);
  const nuevoValor = obtenerValorCasilla(casilla);
  ruleta.marcarCasilla(casilla, obtenerEstadoVisual(casilla));

  // Guardar respuesta en la BD
  _guardarRespuestaRuleta({
    id_pregunta_gen: item.problema.enunciado.substring(0, 80),
    tema:            estado.temaRonda,
    es_correcta:     apostoCorrectamente,
    fichas_apostadas: monto,
    multiplicador:   mult,
    delta_fichas:    ganancia,
  });

  setFase('resultado');
  ui.ocultarModalProblema();
  ui.mostrarModalResultado({
    esCorrecta:   apostoCorrectamente,
    textoCorrecta,
    deltaApuesta: ganancia,
    deltaCasilla,
    nuevoValor,
    casilla,
    esTiempoAgotado: false,
  });
  ui.actualizarHUD();
  _actualizarIntensidadMusica();

  const todas = obtenerTodasLasCasillas();
  ui.actualizarPanelCasillas(todas);
  ui.actualizarGridTodasCasillas(todas, casilla);
}

/**
 * Ajusta el ánimo de la música al desempeño en SIGMA Matrix.
 * Cerca de la cuota y acertando → frenético.
 * Lejos de la cuota tras fallar → calmado, para no estresar al jugador.
 */
function _actualizarIntensidadMusica() {
  const m = estado.metricas;
  const respondidas = m.correctas + m.incorrectas;

  // Progreso hacia la cuota (0 a 1)
  const progreso = Math.min(1, Math.max(0, estado.fichas / estado.cuota));

  // Tasa de acierto; sin datos aún se asume neutra
  const acierto = respondidas > 0 ? m.correctas / respondidas : 0.5;

  // El progreso pesa un poco más que el acierto: acercarse a la meta emociona
  let intensidad = progreso * 0.55 + acierto * 0.45;

  // Quedarse sin bolas sin haber llegado a la cuota → bajar el estrés
  if (estado.bolasRestantes <= 1 && progreso < 0.7) intensidad *= 0.5;

  sonidos.setIntensidadMusica(Math.min(1, Math.max(0, intensidad)));
}

function _onContinuar() {
  ui.ocultarModalResultado();

  // Cuota alcanzada
  if (estado.fichas >= estado.cuota) {
    if (estado.esUltimaRonda) {
      // Ronda 3 superada → victoria final del juego completo
      sonidos.sonidoVictoria();
      _cerrarSesionRuleta(estado.fichas, estado.configuracionRonda.bolasBase - estado.bolasRestantes, true);
      // Limpia el progreso guardado — una nueva partida empieza desde Coordinados nivel 1
      sessionStorage.removeItem('cipher_nivel');
      sessionStorage.removeItem('cipher_fichas_totales');
      sessionStorage.removeItem('monedasRobadas');
      reiniciarCasillas();
      setFase('victoria');
      ui.mostrarVictoria(estado.fichas);
    } else {
      // Ronda intermedia superada → guardar progreso y volver a Coordinados
      // para jugar el siguiente nivel (nivel N+1 → ronda N+1)
      sonidos.sonidoVictoria();
      _cerrarSesionRuleta(estado.fichas, estado.configuracionRonda.bolasBase - estado.bolasRestantes, true);

      const rondaAnterior = estado.ronda;
      const temaAnterior  = estado.configuracionRonda.nombreTema;
      const rondaSiguiente = rondaAnterior + 1;

      sessionStorage.setItem('cipher_fichas_totales', String(estado.fichas));
      sessionStorage.setItem('cipher_nivel', String(rondaSiguiente));

      ui.mostrarRondaSuperada(
        rondaAnterior, temaAnterior,
        rondaSiguiente, nombreTemaDeRonda(rondaSiguiente),
        () => { window.location.href = '../coordinados/index.html'; }
      );
    }
    return;
  }

  if (estado.bolasRestantes === 0) {
    sonidos.detenerBeatFondo();
    sonidos.sonidoDerrota();
    setFase('derrota');
    ui.mostrarDerrota(estado.fichas, estado.cuota, 'sin_bolas');
    return;
  }

  setFase('listo');
  ui.actualizarHUD();
}

document.addEventListener('DOMContentLoaded', init);

// ── Integración con el backend ────────────────────────
// Se llama automáticamente cuando el juego guarda datos

/** Crear sesión de ruleta cuando el jugador entra al Motor */
async function _crearSesionRuleta(fichasIniciales, cuota) {
  try {
    const idPartida = sessionStorage.getItem('cipher_partida_id');
    const data = await API.post('/ruleta/sesion', {
      id_partida:      idPartida,
      fichas_iniciales: fichasIniciales,
      cuota,
    });
    sessionStorage.setItem('cipher_sesion_ruleta_id', data.id_sesion);
  } catch(e) { console.warn('No se pudo crear sesión ruleta:', e.message); }
}

/** Guardar cada respuesta de la ruleta */
async function _guardarRespuestaRuleta(payload) {
  try {
    const idSesion = sessionStorage.getItem('cipher_sesion_ruleta_id');
    if (!idSesion) return;
    await API.post('/ruleta/respuesta', { id_sesion: idSesion, ...payload });
  } catch(e) { console.warn('No se pudo guardar respuesta ruleta:', e.message); }
}

/** Cerrar sesión de ruleta al terminar */
async function _cerrarSesionRuleta(fichasFinales, bolasUsadas, cuotaAlcanzada) {
  try {
    const idSesion = sessionStorage.getItem('cipher_sesion_ruleta_id');
    if (!idSesion) return;
    await API.patch(`/ruleta/sesion/${idSesion}`, {
      fichas_finales: fichasFinales,
      bolas_usadas:   bolasUsadas,
      cuota_alcanzada: cuotaAlcanzada,
    });
  } catch(e) { console.warn('No se pudo cerrar sesión ruleta:', e.message); }
}
