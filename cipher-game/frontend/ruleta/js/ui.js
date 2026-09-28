/* ═══════════════════════════════════════════════════════════
   UI.JS — Renderizado y actualizaciones del DOM
   ═══════════════════════════════════════════════════════════ */

import { estado, MULTIPLICADORES_APUESTA } from './estado.js';
import { VALOR_BASE } from './casillas.js';

const LETRAS = ['A', 'B', 'C', 'D'];
let _fichasAnterior = null;

// ── Pantallas ─────────────────────────────────────────────

export function mostrarPantallaInicio() {
  document.getElementById('pantalla-inicio').classList.replace('oculto','activa') ||
    document.getElementById('pantalla-inicio').classList.add('activa');
  document.getElementById('pantalla-juego').classList.add('oculto');
  document.getElementById('pantalla-juego').classList.remove('activa');
}

export function mostrarPantallaJuego() {
  document.getElementById('pantalla-inicio').classList.remove('activa');
  document.getElementById('pantalla-inicio').classList.add('oculto');
  document.getElementById('pantalla-juego').classList.remove('oculto');
  document.getElementById('pantalla-juego').classList.add('activa');
}

// ── HUD ──────────────────────────────────────────────────

export function actualizarHUD() {
  document.getElementById('valor-ronda').textContent  = estado.ronda;
  document.getElementById('valor-cuota').textContent  = estado.cuota;
  document.getElementById('contador-bolas').textContent = estado.bolasRestantes;
  document.getElementById('contador-bolas-total').textContent = estado.configuracionRonda.bolasBase;

  const temaEl = document.getElementById('hud-tema-ronda');
  if (temaEl) temaEl.textContent = estado.configuracionRonda.nombreTema;

  const fichasEl = document.getElementById('valor-fichas');
  if (_fichasAnterior !== null && estado.fichas !== _fichasAnterior) {
    fichasEl.classList.remove('animar-gana','animar-pierde');
    void fichasEl.offsetWidth;
    fichasEl.classList.add(estado.fichas > _fichasAnterior ? 'animar-gana' : 'animar-pierde');
  }
  _fichasAnterior = estado.fichas;
  fichasEl.textContent = estado.fichas;
  fichasEl.classList.toggle('acento-coral',  estado.fichas < 0);
  fichasEl.classList.toggle('acento-dorado', estado.fichas >= 0);

  _renderizarBolas();
  document.getElementById('btn-lanzar').disabled = !estado.puedeLanzar;
}

function _renderizarBolas() {
  const c     = document.getElementById('indicadores-bolas');
  const total = estado.configuracionRonda.bolasBase;
  c.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'indicador-bola' + (i >= estado.bolasRestantes ? ' gastada' : '');
    c.appendChild(d);
  }
}

// ── Toast ─────────────────────────────────────────────────

export function mostrarToastCasilla(casilla, valor, duracionMs) {
  const signo = valor >= 0 ? '+' : '';
  const tipo  = valor > 0 ? 'positivo' : valor < 0 ? 'negativo' : 'base';
  const barra = document.getElementById('toast-barra');

  document.getElementById('toast-numero').textContent = casilla;
  const f = document.getElementById('toast-fichas');
  f.textContent = `${signo}${valor} fichas`;
  f.className   = `toast-fichas ${tipo}`;

  barra.style.transition = 'none';
  barra.style.width = '100%';
  document.getElementById('toast-casilla').classList.remove('oculto');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    barra.style.transition = `width ${duracionMs}ms linear`;
    barra.style.width = '0%';
  }));
}

export function ocultarToastCasilla() {
  document.getElementById('toast-casilla').classList.add('oculto');
}

// ── Cronómetro ────────────────────────────────────────────

const CIRCUNFERENCIA = 2 * Math.PI * 34; // ≈ 213.6

export function actualizarCronometro(segundosRestantes, totalSegundos) {
  const porcentaje = Math.max(0, segundosRestantes / totalSegundos);
  const offset     = CIRCUNFERENCIA * (1 - porcentaje);

  const arco       = document.getElementById('cronometro-arco');
  const numero     = document.getElementById('cronometro-numero');
  const contenedor = document.querySelector('.cronometro-contenedor');

  arco.style.strokeDashoffset = offset;
  numero.textContent = Math.ceil(segundosRestantes);

  contenedor.classList.remove('cronometro-advertencia', 'cronometro-urgente');
  if (porcentaje <= 0.25) {
    arco.style.stroke = 'var(--color-negativo)';
    contenedor.classList.add('cronometro-urgente');
  } else if (porcentaje <= 0.5) {
    arco.style.stroke = 'var(--color-dorado)';
    contenedor.classList.add('cronometro-advertencia');
  } else {
    arco.style.stroke = 'var(--color-teal)';
  }
}

export function resetearCronometro(totalSegundos) {
  const arco   = document.getElementById('cronometro-arco');
  const numero = document.getElementById('cronometro-numero');
  const c      = document.querySelector('.cronometro-contenedor');

  arco.style.transition = 'none';
  arco.style.strokeDashoffset = 0;
  arco.style.stroke = 'var(--color-teal)';
  numero.textContent = totalSegundos;
  c.classList.remove('cronometro-advertencia', 'cronometro-urgente');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    arco.style.transition = 'stroke-dashoffset 1s linear, stroke 0.4s ease';
  }));
}

// ── Modal de problema ─────────────────────────────────────

export function mostrarModalProblema(timerDuracion) {
  const cont = document.getElementById('contenedor-problemas');
  cont.innerHTML = '';
  estado.problemasActivos.forEach((item, i) => cont.appendChild(_crearTarjeta(item.problema, i)));

  document.getElementById('casilla-aterrizaje').textContent = estado.casillaActual;
  resetearCronometro(timerDuracion);
  _actualizarPanelApuesta();
  document.getElementById('modal-problema').classList.remove('oculto');
}

function _crearTarjeta(problema, indice) {
  const t = document.createElement('div');
  t.className = 'tarjeta-problema seleccionada'; // solo 1 tarjeta, siempre activa
  t.dataset.indice = String(indice);
  t.innerHTML = `
    <div class="problema-numero">Problema</div>
    <p class="problema-enunciado">${problema.enunciado}</p>
    <div class="problema-opciones">
      ${problema.opciones.map((op, i) => `
        <div class="opcion" data-opcion="${i}">
          <span class="opcion-letra">${LETRAS[i]}</span>${op}
        </div>`).join('')}
    </div>`;
  return t;
}

/** Actualiza visualmente qué opciones están apostadas */
export function actualizarOpcionesApostadas() {
  const apostadas = estado.opcionesApostadas;
  document.querySelectorAll('.opcion').forEach(op => {
    const idx = parseInt(op.dataset.opcion);
    op.classList.toggle('apostada', apostadas.includes(idx));
  });
  _actualizarPanelApuesta();
}

function _actualizarPanelApuesta() {
  const n    = estado.opcionesApostadas.length;
  const mult = n > 0 ? MULTIPLICADORES_APUESTA[n] : 0;
  const monto = estado.montoApuesta;
  const listo = n > 0 && monto >= 1 && estado.fichas > 0;

  document.getElementById('apuesta-opciones-count').textContent = `${n} / máx 3`;

  const multEl = document.getElementById('apuesta-multiplicador');
  multEl.textContent = mult > 0 ? `×${mult}` : '—';
  multEl.style.color = n === 1 ? 'var(--color-positivo)' : n === 2 ? 'var(--color-dorado)' : n === 3 ? 'var(--color-neutro)' : 'var(--color-texto-secundario)';

  const inputMonto = document.getElementById('apuesta-monto-display');
  inputMonto.value = monto;
  inputMonto.max   = estado.maxApuesta;
  document.getElementById('btn-apuesta-menos').disabled = monto <= 1;
  document.getElementById('btn-apuesta-mas').disabled   = monto >= estado.maxApuesta;

  if (listo) {
    const ganancia = Math.floor(monto * (mult - 1));
    document.getElementById('apuesta-preview-gana').textContent   = `Ganas: +${ganancia}`;
    document.getElementById('apuesta-preview-pierde').textContent = `Pierdes: −${monto}`;
  } else {
    document.getElementById('apuesta-preview-gana').textContent   = '—';
    document.getElementById('apuesta-preview-pierde').textContent = '—';
  }

  document.getElementById('btn-confirmar').disabled = !listo;
}

export function ocultarModalProblema() {
  document.getElementById('modal-problema').classList.add('oculto');
}

// ── Alerta casilla modificada ─────────────────────────────

export function mostrarAlertaCasilla(estadoVisual, valor) {
  const alerta  = document.getElementById('alerta-casilla');
  const signo   = valor >= 0 ? '+' : '';
  const positivo = valor > 0;
  alerta.className = `alerta-casilla ${positivo ? 'positivo' : 'negativo'}`;
  document.getElementById('alerta-icono').textContent = positivo ? '💰' : '⚠️';
  document.getElementById('alerta-texto').innerHTML =
    positivo
      ? `Esta casilla vale <strong>${signo}${valor} fichas</strong>. ¡Apuesta fuerte y acierta para mejorarla!`
      : `Esta casilla vale <strong>${signo}${valor} fichas</strong>. Acierta para recuperarla.`;
  alerta.classList.remove('oculto');
}

export function ocultarAlertaCasilla() {
  document.getElementById('alerta-casilla').classList.add('oculto');
}

// ── Modal de resultado ────────────────────────────────────

export function mostrarModalResultado({ esCorrecta, textoCorrecta, deltaApuesta, deltaCasilla, nuevoValor, casilla, esTiempoAgotado }) {
  const signoNuevo = nuevoValor >= 0 ? '+' : '';
  const signoAp    = deltaApuesta >= 0 ? '+' : '';

  document.getElementById('resultado-icono').textContent =
    esTiempoAgotado ? '⏱' : esCorrecta ? '🎯' : '📚';

  const tituloEl = document.getElementById('resultado-titulo');
  tituloEl.textContent = esTiempoAgotado
    ? '¡Tiempo agotado!'
    : esCorrecta ? '¡Respuesta correcta!' : 'Respuesta incorrecta';
  tituloEl.className = `resultado-titulo ${esCorrecta ? 'positivo' : 'negativo'}`;

  document.getElementById('resultado-descripcion').textContent =
    `La casilla ${casilla} ahora dará ${signoNuevo}${nuevoValor} fichas la próxima vez.`;

  document.getElementById('resultado-respuesta').innerHTML = `
    <span class="chip-respuesta ${esCorrecta ? 'correcto' : 'incorrecto'}">
      ${esTiempoAgotado ? '⏱ Tiempo agotado — cuenta como fallo' : esCorrecta ? '✓ Respuesta correcta' : '✗ Respuesta incorrecta'}
    </span>
    ${!esCorrecta && !esTiempoAgotado ? `<p class="respuesta-correcta-texto">La respuesta era: <strong>${textoCorrecta}</strong></p>` : ''}
    <div class="fichas-delta ${deltaApuesta >= 0 ? 'positivo' : 'negativo'}">
      Apuesta: ${signoAp}${deltaApuesta} fichas
    </div>
    <div style="font-size:0.8rem;color:var(--color-texto-secundario);margin-top:2px">
      Casilla ${casilla}: ${deltaCasilla >= 0 ? '+' : ''}${deltaCasilla} → ahora vale ${signoNuevo}${nuevoValor}
    </div>`;

  document.getElementById('modal-resultado').classList.remove('oculto');
}

export function ocultarModalResultado() {
  document.getElementById('modal-resultado').classList.add('oculto');
}

// ── Panel tablero ─────────────────────────────────────────

export function actualizarPanelCasillas(casillasMap) {
  const lista = document.getElementById('lista-casillas');
  const mod   = [...casillasMap.entries()].filter(([,v]) => v !== VALOR_BASE);
  if (mod.length === 0) { lista.innerHTML = '<p class="panel-vacio">Sin modificaciones aún</p>'; return; }
  lista.innerHTML = mod.sort((a,b) => b[1]-a[1]).map(([num,val]) => {
    const tipo  = val > VALOR_BASE ? 'mejorada' : val > 0 ? 'deteriorada' : val < 0 ? 'negativa' : 'neutro';
    const signo = val >= 0 ? '+' : '';
    return `<div class="casilla-item ${tipo}">
      <span class="casilla-numero">${num}</span>
      <span class="casilla-tendencia">${val > VALOR_BASE ? '▲' : '▼'}</span>
      <span class="casilla-valor">${signo}${val}</span>
    </div>`;
  }).join('');
}

export function actualizarGridTodasCasillas(casillasMap, resaltada) {
  document.getElementById('grid-todas-casillas').innerHTML =
    [...casillasMap.entries()].map(([num, val]) => {
      const tipo   = val > VALOR_BASE ? 'mejorada' : val > 0 && val < VALOR_BASE ? 'deteriorada' : val < 0 ? 'negativa' : 'base';
      const signo  = val >= 0 ? '+' : '';
      const hl     = String(resaltada) === num ? ' resaltada' : '';
      return `<div class="casilla-celda ${tipo}${hl}" title="Casilla ${num}: ${signo}${val}">
        <span class="celda-num">${num}</span>
        <span class="celda-val">${signo}${val}</span>
      </div>`;
    }).join('');
}

export function inicializarTabsPanel() {
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('activa'));
      tab.classList.add('activa');
      const v = tab.dataset.tab;
      document.getElementById('seccion-activadas').classList.toggle('oculto', v !== 'activadas');
      document.getElementById('seccion-todas').classList.toggle('oculto', v !== 'todas');
    });
  });
}

// ── Pantallas fin ─────────────────────────────────────────

// ── Ronda superada (transición entre niveles) ─────────────

export function mostrarRondaSuperada(rondaAnterior, temaAnterior, rondaNueva, temaNuevo, onContinuar) {
  const modal = document.getElementById('modal-ronda-superada');
  document.getElementById('ronda-superada-anterior').textContent = `Ronda ${rondaAnterior} · ${temaAnterior}`;
  document.getElementById('ronda-superada-nueva').textContent    = `Ronda ${rondaNueva} · ${temaNuevo}`;
  modal.classList.remove('oculto');

  const btn = document.getElementById('btn-continuar-ronda');
  const handler = () => {
    modal.classList.add('oculto');
    btn.removeEventListener('click', handler);
    onContinuar();
  };
  btn.addEventListener('click', handler);
}

export function mostrarVictoria(fichas) {
  document.getElementById('fichas-finales-victoria').textContent = fichas;
  document.getElementById('pantalla-victoria').classList.remove('oculto');
}

export function mostrarDerrota(fichas, cuota, razon) {
  const textos = {
    sin_bolas:  `Sistema detenido: sin proyectiles de predicción. Necesitabas ${cuota} créditos, tenías ${fichas}. Vuelve a recuperar fragmentos.`,
    sin_fichas: `Créditos en cero. Sin créditos no hay predicción posible.`,
  };
  document.getElementById('texto-derrota').textContent =
    textos[razon] ?? `Fin del juego con ${fichas} fichas. Vuelve a robar para continuar.`;
  document.getElementById('pantalla-derrota').classList.remove('oculto');
}

export function ocultarPantallasFin() {
  document.getElementById('pantalla-victoria').classList.add('oculto');
  document.getElementById('pantalla-derrota').classList.add('oculto');
}
