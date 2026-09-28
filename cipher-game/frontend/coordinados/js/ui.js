// ── Generador de ecuaciones simples (nivel álgebra) ───────────────────────────
// Dado un valor objetivo (la coordenada real), devuelve una ecuación de una
// variable cuya solución es exactamente ese valor — el jugador debe despejar
// x para descubrir la coordenada real de la salida.
function generarEcuacionPara(objetivo) {
  const forma = Math.floor(Math.random() * 4);
  const a = Math.floor(Math.random() * 4) + 2; // 2 a 5
  const b = Math.floor(Math.random() * 8) + 1; // 1 a 8

  switch (forma) {
    case 0: { // x + a = c
      return `x + ${a} = ${objetivo + a}`;
    }
    case 1: { // x − a = c
      return `x − ${a} = ${objetivo - a}`;
    }
    case 2: { // a·x = c
      return `${a}x = ${a * objetivo}`;
    }
    default: { // a·x ± b = c
      const negativo = Math.random() < 0.5;
      const c = negativo ? a * objetivo - b : a * objetivo + b;
      return negativo ? `${a}x − ${b} = ${c}` : `${a}x + ${b} = ${c}`;
    }
  }
}

// ── Objeto ui ─────────────────────────────────────────────────────────────────

const ui = {

  /**
   * Rellena la pantalla de inicio con la explicación específica de este
   * nivel: qué mecánica usa (coordenadas absolutas o desplazamiento),
   * un ejemplo resuelto, y el objetivo concreto.
   */
  actualizarIntroNivel(datos, indice) {
    document.getElementById('inicio-nivel-badge').textContent =
      `NIVEL ${indice + 1} DE ${HABITACIONES.length} · ${datos.concepto} · DIFICULTAD ${datos.dificultad}`;

    const reglas = [];

    if (datos.modoDesplazamiento) {
      reglas.push({
        icono: '➡️',
        texto: 'No escribes el punto final: escribes <strong>cuánto te mueves</strong>. Los valores (Δx, Δy) se SUMAN a tu posición actual.',
      });
      reglas.push({
        icono: '🧮',
        texto: 'Ejemplo: si estás en <strong>(2, 3)</strong> y escribes <strong>(4, −1)</strong>, llegarás a <strong>(6, 2)</strong> — no al punto (4, −1).',
      });
    } else {
      reglas.push({
        icono: '🗺️',
        texto: 'Escribe la coordenada exacta de destino <strong>(x, y)</strong> — el agente se mueve directamente a ese punto del plano.',
      });
    }

    if (datos.modoAlgebra) {
      reglas.push({
        icono: '🔢',
        texto: 'La salida ya NO se muestra como número directo: se entrega detrás de una <strong>ecuación</strong>. Debes despejar x para descubrir la coordenada real.',
      });
      reglas.push({
        icono: '✏️',
        texto: 'Ejemplo: si el panel dice <strong>x → 2x + 3 = 11</strong>, despeja: 2x = 8 → <strong>x = 4</strong>. Ese 4 es la coordenada real de la salida.',
      });
      reglas.push({
        icono: '🕵️',
        texto: 'La salida está <strong>OCULTA</strong> en este nivel: no la verás en el mapa. Solo aparece en el panel como ecuaciones — resolverlas es la única forma de encontrarla.',
      });
      reglas.push({
        icono: '🎯',
        texto: 'Esta es la misma habilidad que usarás en SIGMA Matrix ronda 3 — practícala aquí con calma, con lápiz y papel.',
      });
    }

    reglas.push({ icono: '🪙', texto: 'Recoge al menos <strong>1 moneda</strong> antes de llegar a la salida.' });
    reglas.push({ icono: '👁️', texto: 'Evita el <strong>cono rojo</strong> de los guardias o serás detectado.' });
    reglas.push({ icono: '📦', texto: 'Usa las <strong>cajas</strong> para bloquear la visión de los guardias.' });

    if (datos.problema?.pista) {
      reglas.push({ icono: '💡', texto: datos.problema.pista });
    }

    document.getElementById('inicio-reglas').innerHTML = reglas.map(r => `
      <div class="inicio-regla">
        <span>${r.icono}</span>
        <span>${r.texto}</span>
      </div>`).join('');
  },

  actualizarPantalla(datos, estado) {
    const i = estado.habActual;
    document.getElementById('etiqueta-habitacion').textContent = `NIVEL ${i + 1} / ${HABITACIONES.length}`;
    document.getElementById('etiqueta-concepto').textContent   = datos.concepto;
    document.getElementById('texto-pista').textContent         = datos.problema.pista;

    this.actualizarPosicion(datos.jugadorInicio.x, datos.jugadorInicio.y);
    this.actualizarIntentos(1);
    this.actualizarHistorial([]);
    this.actualizarProgreso(i);
    this.actualizarMonedas(0);
    this.actualizarProblema(estado.monedas, estado.salida, estado.jugador);

    document.getElementById('area-calculos').innerHTML = '<span class="apagado">—</span>';
    this.limpiarInputs();
  },

  actualizarPosicion(x, y) {
    document.getElementById('posicion-actual').textContent = `(${x}, ${y})`;
  },

  actualizarIntentos(n) {
    document.getElementById('intentos').textContent = `${n} / ${CONFIG.MAX_INTENTOS}`;
  },

  actualizarTiempo(t, urgente = false) {
    const el = document.getElementById('tiempo');
    el.textContent = t;
    el.classList.toggle('tiempo-urgente', urgente);
  },

  actualizarMonedas(recogidas) {
    document.getElementById('monedas-count').textContent = `${recogidas} / ${CONFIG.TOTAL_MONEDAS}`;
  },

  // Construye el texto del problema según el estado actual de las monedas
  actualizarProblema(monedas, salida, jugador) {
    const recogidas  = monedas.filter(m => m.recogida).length;
    const sinRecoger = monedas.filter(m => !m.recogida);
    const esAlgebra  = !!HABITACIONES[juego.habActual]?.modoAlgebra;
    let texto;

    if (recogidas === 0) {
      // Mostrar la moneda más cercana al jugador
      const cercana = sinRecoger.sort((a, b) => {
        const da = Math.abs(a.x - jugador.x) + Math.abs(a.y - jugador.y);
        const db = Math.abs(b.x - jugador.x) + Math.abs(b.y - jugador.y);
        return da - db;
      })[0];
      texto = `Recoge al menos una moneda para escapar.\nMoneda más cercana en (${cercana.x}, ${cercana.y}).`;
    } else {
      const descripcionSalida = esAlgebra
        ? `Salida en (x, y):\n  x → ${generarEcuacionPara(salida.x)}\n  y → ${generarEcuacionPara(salida.y)}`
        : `Salida en (${salida.x}, ${salida.y}).`;

      texto = sinRecoger.length > 0
        ? `¡Tienes ${recogidas} moneda(s)! Ya puedes escapar.\n${descripcionSalida}\nO busca más botín escondido en el mapa.`
        : `¡Colección completa! Escapa por la salida.\n${descripcionSalida}`;
    }

    document.getElementById('texto-problema').textContent = texto;
  },

  actualizarHistorial(posiciones) {
    const contenedor = document.getElementById('historial');
    if (posiciones.length <= 1) {
      contenedor.innerHTML = '<span class="apagado">Sin movimientos aún</span>';
      return;
    }
    contenedor.innerHTML = posiciones.map((pos, i) => {
      const esUltimo = i === posiciones.length - 1;
      const clase    = esUltimo ? 'hist-coord final' : 'hist-coord';
      const flecha   = esUltimo ? '' : '<span class="hist-flecha"> → </span>';
      return `<span class="${clase}">(${pos.x}, ${pos.y})</span>${flecha}`;
    }).join('');
  },

  actualizarCalculo(historial) {
    if (historial.length < 2) return;
    const ant = historial[historial.length - 2];
    const act = historial[historial.length - 1];
    document.getElementById('area-calculos').innerHTML = `
      <span class="calculo-box">(${ant.x}, ${ant.y})</span>
      <span class="calculo-flecha"> → </span>
      <span class="calculo-resultado">(${act.x}, ${act.y})</span>
    `;
  },

  actualizarProgreso(indiceActual) {
    document.querySelectorAll('.punto').forEach((p, i) => {
      p.classList.remove('activo', 'completado');
      if      (i < indiceActual)  p.classList.add('completado');
      else if (i === indiceActual) p.classList.add('activo');
    });
  },

  mostrarDeteccion(x, y) {
    // Restaurar el overlay a su versión de "detectado" (por si quedó
    // modificado por un mensaje previo de tiempo agotado)
    document.querySelector('#overlay-deteccion .overlay-emoji').textContent = '🚨';
    document.querySelector('#overlay-deteccion h2').textContent = '¡DETECTADO!';
    document.querySelector('#overlay-deteccion .info-box').style.display = '';

    document.getElementById('pos-detectado').textContent =
      `(${x}, ${y})`;
    document.getElementById('msg-deteccion').textContent =
      `Un guardia te detectó en la posición (${x}, ${y}).`;
    document.getElementById('overlay-deteccion').classList.remove('oculto');

    // Registrar el intento fallido en la BD (silencioso si falla)
    const idPartida = sessionStorage.getItem('cipher_partida_id');
    if (idPartida) {
      API.patch(`/partidas/${idPartida}`, {
        fue_detectado: true,
        intentos:      juego.intentos ?? 1,
        completo:      false,
      }).catch(() => {});
    }
  },

  /** Reutiliza el overlay de detección con mensaje de tiempo agotado */
  mostrarTiempoAgotado() {
    document.querySelector('#overlay-deteccion .overlay-emoji').textContent = '⏱';
    document.querySelector('#overlay-deteccion h2').textContent = '¡TIEMPO AGOTADO!';
    document.getElementById('msg-deteccion').textContent =
      'Se acabó el tiempo para completar este nivel. Vuelve a intentarlo.';
    document.querySelector('#overlay-deteccion .info-box').style.display = 'none';
    document.getElementById('overlay-deteccion').classList.remove('oculto');

    const idPartida = sessionStorage.getItem('cipher_partida_id');
    if (idPartida) {
      API.patch(`/partidas/${idPartida}`, {
        fue_detectado: false,
        intentos:      juego.intentos ?? 1,
        completo:      false,
      }).catch(() => {});
    }
  },

  mostrarVictoria(movimientos, tiempo) {
    // Guardar resultado en la BD (silencioso si falla)
    const idPartida = sessionStorage.getItem('cipher_partida_id');
    const robadas   = juego.monedas.filter(m => m.recogida).length;
    if (idPartida) {
      API.patch(`/partidas/${idPartida}`, {
        monedas_recogidas: robadas,
        fue_detectado:     false,
        intentos:          juego.intentos ?? 1,
        completo:          true,
      }).catch(() => {});
    }
    document.getElementById('stat-movimientos').textContent = movimientos;
    document.getElementById('stat-tiempo').textContent      = tiempo;

    // Cada habitación completada suma fichas y manda a la ronda correspondiente
    // de SIGMA Matrix: Nivel 1 → Ronda 1, Nivel 2 → Ronda 2, Nivel 3 → Ronda 3
    const nivelActual  = juego.habActual + 1;
    const fichasNuevas = robadas * 15;
    const fichasPrevias = parseInt(sessionStorage.getItem('cipher_fichas_totales') ?? '0');
    const fichasTotales = fichasPrevias + fichasNuevas;

    sessionStorage.setItem('cipher_fichas_totales', String(fichasTotales));
    sessionStorage.setItem('cipher_nivel', String(nivelActual));
    sessionStorage.setItem('monedasRobadas', String(robadas));

    const btnSig = document.getElementById('btn-siguiente');
    btnSig.textContent = `🎰 IR A SIGMA MATRIX — RONDA ${nivelActual} ▶`;
    btnSig.style.background = 'linear-gradient(135deg, #C9A84C, #A07830)';

    let infoEl = document.getElementById('info-botin');
    if (!infoEl) {
      infoEl = document.createElement('p');
      infoEl.id = 'info-botin';
      infoEl.style.cssText = 'color:#C9A84C;font-size:0.9rem;margin:8px 0;';
      btnSig.parentNode.insertBefore(infoEl, btnSig);
    }
    infoEl.textContent = `🪙 +${fichasNuevas} fichas de este nivel · Total acumulado: ${fichasTotales} fichas`;

    document.getElementById('overlay-victoria').classList.remove('oculto');
  },

  // Mensaje temporal en el panel de pista (sin bloquear el juego)
  mostrarMensajeTemporal(msg) {
    const el       = document.getElementById('texto-pista');
    const original = el.textContent;
    el.style.color  = '#ef5350';
    el.textContent  = msg;
    setTimeout(() => {
      el.style.color = '';
      el.textContent  = original;
    }, 2500);
  },

  limpiarInputs() {
    document.getElementById('input-x').value = '';
    document.getElementById('input-y').value = '';
    document.getElementById('input-x').focus();
  },

  flashError(inputId) {
    const el = document.getElementById(inputId);
    el.style.borderColor = '#ef5350';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 700);
  },
};


// ── Procesamiento del movimiento del jugador ──────────────────────────────────

function procesarMovimiento() {
  if (juego.estado !== ESTADO.JUGANDO) return;

  const xStr = document.getElementById('input-x').value.trim();
  const yStr = document.getElementById('input-y').value.trim();

  if (xStr === '' || yStr === '') {
    ui.flashError(xStr === '' ? 'input-x' : 'input-y');
    return;
  }

  const valX = Number(xStr);
  const valY = Number(yStr);

  if (!Number.isInteger(valX) || !Number.isInteger(valY)) {
    ui.mostrarMensajeTemporal('Los valores deben ser números enteros.');
    return;
  }

  const lim = CONFIG.RADIO_GRID;
  const esDesplazamiento = !!HABITACIONES[juego.habActual]?.modoDesplazamiento;
  let xFinal, yFinal;

  if (esDesplazamiento) {
    // Desplazamiento relativo a la posición actual (niveles 2 y 3)
    xFinal = juego.jugador.x + valX;
    yFinal = juego.jugador.y + valY;
    if (xFinal < -lim || xFinal > lim || yFinal < -lim || yFinal > lim) {
      ui.mostrarMensajeTemporal(`El desplazamiento saca al agente del plano. Rango: -${lim} a ${lim}.`);
      return;
    }
  } else {
    // Coordenadas absolutas (nivel 1)
    xFinal = valX;
    yFinal = valY;
    if (xFinal < -lim || xFinal > lim || yFinal < -lim || yFinal > lim) {
      ui.mostrarMensajeTemporal(`Coordenadas fuera del plano. Rango: -${lim} a ${lim}.`);
      return;
    }
  }

  ui.limpiarInputs();
  ejecutarMovimiento(xFinal, yFinal);
}



// ── Labels dinámicos según nivel ─────────────────────
function actualizarLabelsNivel() {
  const esDesplazamiento = !!HABITACIONES[juego.habActual]?.modoDesplazamiento;
  const titulo   = document.querySelector('.card-titulo.amarillo');
  const desc     = document.querySelector('.entrada-desc');
  const lblX     = document.getElementById('input-x');
  const lblY     = document.getElementById('input-y');

  if (esDesplazamiento) {
    if (titulo) titulo.textContent = 'INGRESA EL DESPLAZAMIENTO';
    if (desc)   desc.textContent   = 'Cuántas unidades moverte en cada eje (+ derecha/arriba, - izquierda/abajo):';
    if (lblX)   lblX.placeholder   = 'Δx';
    if (lblY)   lblY.placeholder   = 'Δy';
  } else {
    if (titulo) titulo.textContent = 'INGRESA TUS COORDENADAS';
    if (desc)   desc.textContent   = 'Escribe el punto al que quieres moverte:';
    if (lblX)   lblX.placeholder   = 'x';
    if (lblY)   lblY.placeholder   = 'y';
  }
}

// ── Registro de eventos ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  inicializarJuego();

  // Pantalla de inicio → activa audio y arranca el juego
  document.getElementById('btn-iniciar').addEventListener('click', () => {
    Audio.activar();
    Musica.activar();
    Musica.setIntensidad(0.5); // arranca en tensión media
    Musica.iniciar();
    ControlesAudio.montar();
    juego.iniciado = true;
    iniciarTimer();
    // Crear partida en BD al iniciar
    const nivel = (juego.habActual ?? 0) + 1;
    API.post('/partidas', { nivel })
      .then(d => { if (d.id_partida) sessionStorage.setItem('cipher_partida_id', d.id_partida); })
      .catch(() => {});
    document.getElementById('pantalla-inicio').classList.add('oculto');
    document.getElementById('input-x').focus();
  });

  document.getElementById('btn-mover').addEventListener('click', procesarMovimiento);

  ['input-x', 'input-y'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') procesarMovimiento();
    });
  });

  document.getElementById('btn-reiniciar').addEventListener('click', () => {
    document.getElementById('overlay-deteccion').classList.add('oculto');
    reiniciarHabitacion();
  });

  document.getElementById('btn-siguiente').addEventListener('click', () => {
    document.getElementById('overlay-victoria').classList.add('oculto');
    // sessionStorage ya quedó actualizado en ui.mostrarVictoria() —
    // toda habitación completada manda a su ronda correspondiente en SIGMA Matrix
    window.location.href = '../ruleta/index.html';
  });
});
