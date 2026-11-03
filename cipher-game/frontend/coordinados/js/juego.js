const ESTADO = {
  JUGANDO:       'jugando',
  DETECTADO:     'detectado',
  TIEMPO_AGOTADO:'tiempo_agotado',
  VICTORIA:      'victoria',
  COMPLETO:      'completo',
};

const juego = {
  estado:         ESTADO.JUGANDO,
  habActual:      0,
  intentos:       1,
  movimientos:    0,
  historial:      [],
  monedas:        [],
  obstaculos:     [],
  zonaSegura:     null,
  tiempoInicio:   null,
  timerInterval:  null,
  timestamp:      0,
  iniciado:       false,
  flashDeteccion: 0,
  rastro:         [],

  jugador:   null,
  guardias:  [],
  salida:    null,

  canvas:     null,
  ctx:        null,
  miniCanvas: null,
  miniCtx:    null,
};

// Animación de movimiento del jugador
const anim = {
  x: 0, y: 0,
  origenX: 0, origenY: 0,
  t: 1,
  tsInicio: 0,
  DURACION: 140,
};

// Partículas visuales activas
const particulas = [];


// ── Inicialización ────────────────────────────────────────────────────────────

function inicializarJuego() {
  juego.canvas     = document.getElementById('canvas-juego');
  juego.ctx        = juego.canvas.getContext('2d');
  juego.miniCanvas = document.getElementById('minimapa');
  juego.miniCtx    = juego.miniCanvas.getContext('2d');

  // Retoma en el nivel donde el jugador se quedó (1, 2 o 3).
  // Por defecto empieza en el nivel 1 (índice 0).
  const nivelGuardado = parseInt(sessionStorage.getItem('cipher_nivel') ?? '1');
  const indiceInicial = Math.min(Math.max(nivelGuardado - 1, 0), HABITACIONES.length - 1);

  // Rellenar la pantalla de inicio con la explicación específica de este nivel
  ui.actualizarIntroNivel(HABITACIONES[indiceInicial], indiceInicial);

  // Cargar sprites primero, luego arrancar
  cargarSprites(() => {
    cargarHabitacion(indiceInicial, false);
    requestAnimationFrame(bucleJuego);
  });
}

function cargarHabitacion(indice, esTransicion = false) {
  const datos = HABITACIONES[indice];

  juego.habActual    = indice;
  juego.intentos     = 1;
  juego.movimientos  = 0;
  juego.historial    = [];
  juego.estado       = ESTADO.JUGANDO;
  juego.zonaSegura   = datos.zonaSegura;

  // Actualizar labels del panel según el nivel
  if (typeof actualizarLabelsNivel === 'function') actualizarLabelsNivel();
  juego.iniciado     = esTransicion;
  juego.flashDeteccion = 0;
  juego.rastro       = [];
  particulas.length  = 0;

  juego.jugador  = new Jugador(datos.jugadorInicio);
  juego.guardias = generarGuardias(datos);
  juego.salida   = generarSalida(datos, juego.guardias);
  juego.obstaculos = generarObstaculos(datos, juego.guardias, juego.salida);
  juego.monedas  = generarMonedas(datos, juego.guardias, juego.salida, juego.obstaculos);

  juego.historial.push({ ...datos.jugadorInicio });

  anim.x = datos.jugadorInicio.x;
  anim.y = datos.jugadorInicio.y;
  anim.t = 1;

  detenerTimer();
  if (esTransicion) iniciarTimer();

  ui.actualizarPantalla(datos, juego);
}

function reiniciarHabitacion() {
  const datos = HABITACIONES[juego.habActual];

  juego.intentos     = Math.min(juego.intentos + 1, CONFIG.MAX_INTENTOS);
  actualizarIntensidadMusica();
  juego.movimientos  = 0;
  juego.historial    = [];
  juego.estado       = ESTADO.JUGANDO;
  juego.iniciado     = true;
  juego.flashDeteccion = 0;
  juego.rastro       = [];
  particulas.length  = 0;

  juego.jugador  = new Jugador(datos.jugadorInicio);
  juego.guardias = generarGuardias(datos);
  juego.salida   = generarSalida(datos, juego.guardias);
  juego.obstaculos = generarObstaculos(datos, juego.guardias, juego.salida);
  juego.monedas  = generarMonedas(datos, juego.guardias, juego.salida, juego.obstaculos);

  juego.historial.push({ ...datos.jugadorInicio });

  anim.x = datos.jugadorInicio.x;
  anim.y = datos.jugadorInicio.y;
  anim.t = 1;

  detenerTimer();
  iniciarTimer();

  ui.actualizarIntentos(juego.intentos);
  ui.actualizarHistorial([]);
  ui.actualizarMonedas(0);
  ui.actualizarProblema(juego.monedas, juego.salida, juego.jugador);
}


// ── Generación aleatoria ──────────────────────────────────────────────────────

function generarGuardias(datos) {
  const celdasForbidden = new Set(
    celdasEnRadio(datos.zonaSegura, datos.zonaSegura.radio).map(clavePos)
  );

  // Determina el cuadrante de un punto (null si está sobre un eje)
  function cuadranteDe(x, y) {
    if (x === 0 || y === 0) return null;
    if (x > 0 && y > 0) return 'I';
    if (x < 0 && y > 0) return 'II';
    if (x < 0 && y < 0) return 'III';
    return 'IV';
  }

  // ¿El origen (0,0) cae dentro del cono de visión desde (gx,gy) mirando hacia `direccion`?
  function origenVisibleDesde(gx, gy, direccion, fov, rango) {
    const dx = 0 - gx;
    const dy = 0 - gy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist > rango) return false;
    const angulo = Math.atan2(dy, dx) * (180 / Math.PI);
    let diff = angulo - direccion;
    while (diff >  180) diff -= 360;
    while (diff < -180) diff += 360;
    return Math.abs(diff) <= fov / 2;
  }

  /**
   * Recorre TODA la ruta de patrulla (en ambos sentidos de marcha, ya que
   * el guardia invierte dirección en cada extremo) y verifica que en
   * ningún punto el cono de visión llegue a cubrir el origen — así el
   * jugador nunca puede ser detectado apenas aparece en (0,0).
   */
  function patrullaExponeOrigen(rutaPatrulla, tipo, fov, rango) {
    const [a, b] = rutaPatrulla;
    if (tipo === 'horizontal') {
      const y = a.y;
      const xMin = Math.min(a.x, b.x), xMax = Math.max(a.x, b.x);
      for (let x = xMin; x <= xMax; x++) {
        if (origenVisibleDesde(x, y, 0,   fov, rango)) return true; // marchando a la derecha
        if (origenVisibleDesde(x, y, 180, fov, rango)) return true; // marchando a la izquierda
      }
    } else {
      const x = a.x;
      const yMin = Math.min(a.y, b.y), yMax = Math.max(a.y, b.y);
      for (let y = yMin; y <= yMax; y++) {
        if (origenVisibleDesde(x, y, 90,  fov, rango)) return true; // marchando hacia arriba
        if (origenVisibleDesde(x, y, 270, fov, rango)) return true; // marchando hacia abajo
      }
    }
    return false;
  }

  const cuadrantesUsados = new Set();

  return datos.guardias.map(cfg => {
    let rutaPatrulla = null;
    let intentos = 0;

    while (!rutaPatrulla && intentos < 400) {
      intentos++;

      if (cfg.tipo === 'horizontal') {
        const y  = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
        const x1 = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 4);
        const x2 = Math.min(x1 + aleatorioEntero(3, 5), CONFIG.RADIO_GRID - 1);
        const celdas = [];
        for (let x = x1; x <= x2; x++) celdas.push({ x, y });
        if (celdas.some(c => celdasForbidden.has(clavePos(c)))) continue;

        // Usar el punto medio de la patrulla para asignar cuadrante
        const xMid = Math.round((x1 + x2) / 2);
        const cuad = cuadranteDe(xMid, y);
        if (cuad && cuadrantesUsados.has(cuad)) continue;

        // Guardias no pueden patrullar cerca de los ejes (zona de paso del jugador)
        if (Math.abs(y) <= 1) continue;

        const candidato = [{ x: x1, y }, { x: x2, y }];
        if (patrullaExponeOrigen(candidato, 'horizontal', cfg.fov, cfg.rango)) continue;

        if (cuad) cuadrantesUsados.add(cuad);
        rutaPatrulla = candidato;

      } else {
        const x  = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
        const y1 = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 4);
        const y2 = Math.min(y1 + aleatorioEntero(3, 5), CONFIG.RADIO_GRID - 1);
        const celdas = [];
        for (let y = y1; y <= y2; y++) celdas.push({ x, y });
        if (celdas.some(c => celdasForbidden.has(clavePos(c)))) continue;

        const yMid = Math.round((y1 + y2) / 2);
        const cuad = cuadranteDe(x, yMid);
        if (cuad && cuadrantesUsados.has(cuad)) continue;

        // Guardias no pueden patrullar cerca de los ejes (zona de paso del jugador)
        if (Math.abs(x) <= 1) continue;

        const candidato = [{ x, y: y1 }, { x, y: y2 }];
        if (patrullaExponeOrigen(candidato, 'vertical', cfg.fov, cfg.rango)) continue;

        if (cuad) cuadrantesUsados.add(cuad);
        rutaPatrulla = candidato;
      }
    }

    // Fallback en cuadrantes distintos por defecto
    if (!rutaPatrulla) {
      const fallbacks = {
        horizontal: [{ x: -6, y: 4 }, { x: -2, y: 4 }],
        vertical:   [{ x: 5,  y: -5 }, { x: 5, y: -1 }],
      };
      rutaPatrulla = fallbacks[cfg.tipo];
    }

    return new Guardia({ ...cfg, rutaPatrulla });
  });
}

function generarSalida(datos, guardias) {
  const forbidden = new Set([
    clavePos(datos.jugadorInicio),
    ...celdasEnRadio(datos.zonaSegura, datos.zonaSegura.radio + 2).map(clavePos),
    ...guardias.flatMap(g => celdasEnRuta(g.rutaPatrulla).map(clavePos)),
  ]);

  let salida = null;
  let intentos = 0;

  while (!salida && intentos < 300) {
    intentos++;
    const x = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
    const y = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
    if (forbidden.has(clavePos({ x, y }))) continue;
    const dist = Math.abs(x - datos.jugadorInicio.x) + Math.abs(y - datos.jugadorInicio.y);
    if (dist < 5) continue;
    salida = { x, y };
  }

  return salida ?? { x: 5, y: 0 };
}

function generarObstaculos(datos, guardias, salida) {
  const forbidden = new Set([
    clavePos(datos.jugadorInicio),
    clavePos(salida),
    ...celdasEnRadio(datos.zonaSegura, datos.zonaSegura.radio).map(clavePos),
    ...guardias.flatMap(g => celdasEnRuta(g.rutaPatrulla).map(clavePos)),
  ]);

  const obstaculos = [];
  let intentos = 0;

  while (obstaculos.length < 3 && intentos < 300) {
    intentos++;
    const esH = Math.random() < 0.5;
    const x = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), esH ? CONFIG.RADIO_GRID - 2 : CONFIG.RADIO_GRID - 1);
    const y = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), esH ? CONFIG.RADIO_GRID - 1 : CONFIG.RADIO_GRID - 2);
    const celdas = esH ? [{ x, y }, { x: x+1, y }] : [{ x, y }, { x, y: y+1 }];
    if (celdas.some(c => forbidden.has(clavePos(c)))) continue;
    // Los ejes deben quedar libres para que el jugador vea el plano claramente
    if (celdas.some(c => c.x === 0 || c.y === 0)) continue;
    celdas.forEach(c => forbidden.add(clavePos(c)));
    obstaculos.push({ celdas });
  }

  return obstaculos;
}

function generarMonedas(datos, guardias, salida, obstaculos) {
  const ocupadas = new Set([
    clavePos(datos.jugadorInicio),
    clavePos(salida),
    ...(obstaculos || []).flatMap(o => o.celdas.map(clavePos)),
    ...guardias.map(g => clavePos(g.rutaPatrulla[0])),
  ]);

  const monedas = [];
  let intentos = 0;

  while (monedas.length < CONFIG.TOTAL_MONEDAS && intentos < 300) {
    intentos++;
    const x = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
    const y = aleatorioEntero(-(CONFIG.RADIO_GRID - 1), CONFIG.RADIO_GRID - 1);
    const k = clavePos({ x, y });
    if (ocupadas.has(k)) continue;
    ocupadas.add(k);
    monedas.push(new Moneda(x, y));
  }

  return monedas;
}


// ── Movimiento ────────────────────────────────────────────────────────────────

function ejecutarMovimiento(x, y) {
  if (!juego.iniciado || juego.estado !== ESTADO.JUGANDO) return;

  if (esCeldaObstaculo(x, y)) {
    Audio.obstaculo();
    ui.mostrarMensajeTemporal('¡Hay un obstáculo en esa posición!');
    return;
  }

  const xAnterior = juego.jugador.x;
  const yAnterior = juego.jugador.y;

  // Rastro de posiciones anteriores
  juego.rastro.push({ x: xAnterior, y: yAnterior, ts: juego.timestamp });
  if (juego.rastro.length > 5) juego.rastro.shift();

  juego.jugador.moverA(x, y);
  juego.movimientos++;
  juego.historial.push({ x, y });

  // Iniciar animación de movimiento
  iniciarAnimacion(xAnterior, yAnterior);

  Audio.paso();
  ui.actualizarHistorial(juego.historial);
  ui.actualizarPosicion(x, y);
  ui.actualizarCalculo(juego.historial);

  // Recoger moneda
  const monedaEnCelda = juego.monedas.find(m => !m.recogida && m.x === x && m.y === y);
  if (monedaEnCelda) {
    monedaEnCelda.recogida = true;
    Audio.moneda();
    actualizarIntensidadMusica();
    particulas.push({ tipo: 'moneda', x, y, ts: juego.timestamp });
    ui.actualizarMonedas(juego.monedas.filter(m => m.recogida).length);
  }

  ui.actualizarProblema(juego.monedas, juego.salida, juego.jugador);

  if (verificarDeteccion(x, y)) return;

  if (x === juego.salida.x && y === juego.salida.y) {
    const recogidas = juego.monedas.filter(m => m.recogida).length;
    if (recogidas === 0) {
      Audio.salidaBloqueada();
      ui.mostrarMensajeTemporal('¡Necesitas al menos un pequeño botín para escapar!');
      return;
    }
    juego.estado = ESTADO.VICTORIA;
    detenerTimer();
    if (typeof Musica !== 'undefined') Musica.detener();
    Audio.victoria();
    // Toda habitación completada (incluida la última) manda a su ronda
    // correspondiente en SIGMA Matrix — la victoria final del juego
    // solo ocurre tras superar la ronda 3 de la ruleta.
    ui.mostrarVictoria(juego.movimientos, tiempoActual());
  }
}


// ── Detección ─────────────────────────────────────────────────────────────────

function verificarDeteccion(x, y) {
  const detectado = juego.guardias.find(g => {
    if (g.x === x && g.y === y) return true;
    return g.esCeldaVisible(x, y) && hayLineaDeVision(g.x, g.y, x, y);
  });

  if (detectado) {
    juego.estado       = ESTADO.DETECTADO;
    juego.flashDeteccion = 1;
    detenerTimer();
    Audio.detectado();
    ui.mostrarDeteccion(x, y);
    return true;
  }
  return false;
}

function verificarDeteccionContinua() {
  if (juego.estado !== ESTADO.JUGANDO) return;
  verificarDeteccion(juego.jugador.x, juego.jugador.y);
}

function hayLineaDeVision(gx, gy, jx, jy) {
  const bloqueadas = new Set(
    juego.obstaculos.flatMap(o => o.celdas.map(c => `${c.x},${c.y}`))
  );
  if (bloqueadas.size === 0) return true;

  const pasos = Math.max(Math.abs(jx - gx), Math.abs(jy - gy)) * 10;
  for (let i = 1; i < pasos; i++) {
    const t  = i / pasos;
    const cx = Math.round(gx + (jx - gx) * t);
    const cy = Math.round(gy + (jy - gy) * t);
    if ((cx === gx && cy === gy) || (cx === jx && cy === jy)) continue;
    if (bloqueadas.has(`${cx},${cy}`)) return false;
  }
  return true;
}


// ── Animación de movimiento ───────────────────────────────────────────────────

function iniciarAnimacion(origenX, origenY) {
  anim.origenX  = origenX;
  anim.origenY  = origenY;
  anim.t        = 0;
  anim.tsInicio = juego.timestamp;
  anim.x        = origenX;
  anim.y        = origenY;
}

function actualizarAnimacion(timestamp) {
  if (anim.t >= 1) return;
  const raw = Math.min((timestamp - anim.tsInicio) / anim.DURACION, 1);
  const t   = raw * (2 - raw); // easeOutQuad
  anim.x = anim.origenX + (juego.jugador.x - anim.origenX) * t;
  anim.y = anim.origenY + (juego.jugador.y - anim.origenY) * t;
  anim.t = raw;
}


// ── Bucle principal ───────────────────────────────────────────────────────────

function bucleJuego(timestamp) {
  juego.timestamp = timestamp;

  if (juego.iniciado && juego.estado === ESTADO.JUGANDO) {
    juego.guardias.forEach(g => g.actualizar(timestamp, juego.zonaSegura));
    verificarDeteccionContinua();
  }

  actualizarAnimacion(timestamp);

  // Decaer flash de detección
  if (juego.flashDeteccion > 0) {
    juego.flashDeteccion = Math.max(0, juego.flashDeteccion - 0.028);
  }

  renderizar();
  requestAnimationFrame(bucleJuego);
}


// ── Timer ─────────────────────────────────────────────────────────────────────

/**
 * Rótulos de los cuatro cuadrantes con sus signos.
 * Solo en el nivel 1: ahí el objetivo es aprender a identificarlos.
 * En los niveles siguientes se retiran para que el jugador los reconozca solo.
 */
function dibujarEtiquetasCuadrantes(ctx) {
  if (juego.habActual !== 0) return;

  const mitad = CONFIG.RADIO_GRID / 2;          // centro de cada cuadrante
  const etiquetas = [
    { nombre: 'I cuadrante',   signos: '( + ; + )', x:  mitad, y:  mitad },
    { nombre: 'II cuadrante',  signos: '( − ; + )', x: -mitad, y:  mitad },
    { nombre: 'III cuadrante', signos: '( − ; − )', x: -mitad, y: -mitad },
    { nombre: 'IV cuadrante',  signos: '( + ; − )', x:  mitad, y: -mitad },
  ];

  const tamNombre = Math.max(11, CONFIG.TAMANO_CELDA * 0.42);
  const tamSignos = Math.max(10, CONFIG.TAMANO_CELDA * 0.38);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  etiquetas.forEach(e => {
    const { cx, cy } = cartesianoACanvas(e.x, e.y);

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#14BDAC';
    ctx.font = `bold ${tamNombre}px ${'Inter, sans-serif'}`;
    ctx.fillText(e.nombre, cx, cy - tamNombre * 0.75);

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = CONFIG.COLORES.textoGrid;
    ctx.font = `${tamSignos}px ${'Inter, sans-serif'}`;
    ctx.fillText(e.signos, cx, cy + tamSignos * 0.75);
  });

  ctx.restore();
}

/**
 * Ajusta el ánimo de la música al desempeño del jugador.
 * Va bien (recoge monedas, sin fallar) → electrónico frenético.
 * Va mal (ha sido detectado varias veces) → guitarras suaves, sin estrés.
 */
function actualizarIntensidadMusica() {
  if (typeof Musica === 'undefined') return;

  const recogidas = juego.monedas ? juego.monedas.filter(m => m.recogida).length : 0;
  const fallos    = Math.max(0, (juego.intentos ?? 1) - 1);

  let intensidad = 0.5;
  intensidad += recogidas * 0.17;   // progreso: sube el ánimo
  intensidad -= fallos    * 0.30;   // detecciones: calma la música

  // Recta final con buen desempeño → clímax
  const limite = HABITACIONES[juego.habActual]?.tiempoLimite ?? 90;
  if (fallos === 0 && juego.tiempoRestante > 0 && juego.tiempoRestante < limite * 0.3) {
    intensidad += 0.15;
  }

  Musica.setIntensidad(Math.min(1, Math.max(0, intensidad)));
}

function iniciarTimer() {
  juego.tiempoInicio   = Date.now();              // para el stat "tiempo transcurrido" en victoria
  const limite = HABITACIONES[juego.habActual]?.tiempoLimite ?? 90;
  juego.tiempoRestante = limite;
  ui.actualizarTiempo(formatearSegundos(juego.tiempoRestante), false);

  juego.timerInterval = setInterval(() => {
    juego.tiempoRestante--;
    const urgente = juego.tiempoRestante <= 15;
    ui.actualizarTiempo(formatearSegundos(juego.tiempoRestante), urgente);

    if (juego.tiempoRestante <= 0) {
      detenerTimer();
      manejarTiempoAgotado();
    }
  }, 1000);
}

function detenerTimer() {
  clearInterval(juego.timerInterval);
}

function manejarTiempoAgotado() {
  if (juego.estado !== ESTADO.JUGANDO) return;
  juego.estado = ESTADO.TIEMPO_AGOTADO;
  Audio.detectado();
  ui.mostrarTiempoAgotado();
}

function formatearSegundos(seg) {
  const s = Math.max(0, seg);
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

function tiempoActual() {
  const seg = Math.floor((Date.now() - juego.tiempoInicio) / 1000);
  const m   = String(Math.floor(seg / 60)).padStart(2, '0');
  const s   = String(seg % 60).padStart(2, '0');
  return `${m}:${s}`;
}


// ── Renderizado ───────────────────────────────────────────────────────────────

function renderizar() {
  const { ctx } = juego;
  ctx.clearRect(0, 0, CONFIG.CANVAS.ANCHO, CONFIG.CANVAS.ALTO);

  dibujarFondo(ctx);
  dibujarEjes(ctx);
  dibujarNumerosGrid(ctx);
  dibujarEtiquetasCuadrantes(ctx);

  // Clip — nada se renderiza fuera del área del grid
  // Se expande media celda para que sprites en los bordes no queden cortados
  const m    = CONFIG.MARGEN;
  const lado = CONFIG.RADIO_GRID * 2 * CONFIG.TAMANO_CELDA;
  const pad  = Math.ceil(CONFIG.TAMANO_CELDA / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(m - pad, m - pad, lado + pad * 2, lado + pad * 2);
  ctx.clip();

  dibujarZonaSegura(ctx);
  dibujarRastro(ctx);

  // Conos detrás de los obstáculos
  juego.guardias.forEach(g => {
    const { cx, cy } = cartesianoACanvas(g.x, g.y);
    g.dibujarCono(ctx, cx, cy);
  });

  // Obstáculos encima de los conos
  dibujarObstaculos(ctx);
  dibujarSalida(ctx);
  dibujarMonedas(ctx);

  // Cuerpos de guardias encima de obstáculos
  juego.guardias.forEach(g => {
    const { cx, cy } = cartesianoACanvas(g.x, g.y);
    g.dibujarCuerpo(ctx, cx, cy);
  });

  // Jugador en posición animada
  const { cx, cy } = cartesianoACanvas(anim.x, anim.y);
  juego.jugador.dibujar(ctx, cx, cy);

  dibujarParticulas(ctx);

  // Cerrar el clip del grid antes del flash (que debe cubrir toda la pantalla)
  ctx.restore();

  // Flash rojo de detección al frente de todo
  if (juego.flashDeteccion > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(239,83,80,${juego.flashDeteccion * 0.45})`;
    ctx.fillRect(0, 0, CONFIG.CANVAS.ANCHO, CONFIG.CANVAS.ALTO);
    ctx.restore();
  }

  renderizarMinimapa();
}

// Indicador pulsante de zona segura (aparece los primeros 6 segundos)
function dibujarZonaSegura(ctx) {
  if (!juego.tiempoInicio) return;
  const seg = (Date.now() - juego.tiempoInicio) / 1000;
  if (seg > 6) return;

  const alpha = Math.min(1, (6 - seg) / 2) * (0.14 + 0.07 * Math.sin(juego.timestamp / 500));
  const datos = HABITACIONES[juego.habActual];
  const { cx, cy } = cartesianoACanvas(datos.jugadorInicio.x, datos.jugadorInicio.y);
  const radio = CONFIG.RADIO_ZONA_SEGURA * CONFIG.TAMANO_CELDA;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radio, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(79,195,247,${alpha})`;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Rastro de posiciones anteriores del jugador
function dibujarRastro(ctx) {
  const DURACION = 700;
  juego.rastro.forEach(p => {
    const age = (juego.timestamp - p.ts) / DURACION;
    if (age >= 1) return;
    const alpha = (1 - age) * 0.28;
    const r     = CONFIG.RADIOS.jugador * (0.75 - age * 0.4);
    const { cx, cy } = cartesianoACanvas(p.x, p.y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(r, 2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(79,195,247,${alpha})`;
    ctx.fill();
    ctx.restore();
  });
}

// Partículas visuales (anillos de moneda al recoger)
function dibujarParticulas(ctx) {
  const DURACION = 480;
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    const t = (juego.timestamp - p.ts) / DURACION;
    if (t >= 1) { particulas.splice(i, 1); continue; }

    if (p.tipo === 'moneda') {
      const { cx, cy } = cartesianoACanvas(p.x, p.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, t * 30, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,213,79,${(1 - t) * 0.85})`;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
      // Segundo anillo ligeramente retrasado
      if (t > 0.15) {
        ctx.beginPath();
        ctx.arc(cx, cy, (t - 0.15) * 22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,193,7,${(1 - t) * 0.5})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function dibujarFondo(ctx) {
  ctx.fillStyle = CONFIG.COLORES.fondoCanvas;
  ctx.fillRect(0, 0, CONFIG.CANVAS.ANCHO, CONFIG.CANVAS.ALTO);

  const { MARGEN, TAMANO_CELDA, RADIO_GRID } = CONFIG;
  const total = RADIO_GRID * 2;

  ctx.strokeStyle = CONFIG.COLORES.lineaGrid;
  ctx.lineWidth   = 0.5;

  for (let i = 0; i <= total; i++) {
    const pos = MARGEN + i * TAMANO_CELDA;
    ctx.beginPath(); ctx.moveTo(pos, MARGEN); ctx.lineTo(pos, MARGEN + total * TAMANO_CELDA); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MARGEN, pos); ctx.lineTo(MARGEN + total * TAMANO_CELDA, pos); ctx.stroke();
  }
}

function dibujarEjes(ctx) {
  const origen = cartesianoACanvas(0, 0);
  const { MARGEN, TAMANO_CELDA, RADIO_GRID } = CONFIG;
  const limite = MARGEN + RADIO_GRID * 2 * TAMANO_CELDA;

  ctx.strokeStyle = CONFIG.COLORES.ejeGrid;
  ctx.lineWidth   = 1.5;

  ctx.beginPath(); ctx.moveTo(MARGEN, origen.cy); ctx.lineTo(limite, origen.cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(origen.cx, MARGEN);  ctx.lineTo(origen.cx, limite); ctx.stroke();

  dibujarPuntaFlecha(ctx, limite,    origen.cy,  0);
  dibujarPuntaFlecha(ctx, origen.cx, MARGEN,   -90);

  ctx.fillStyle    = CONFIG.COLORES.ejeGrid;
  ctx.font         = 'bold 12px sans-serif';
  ctx.textAlign    = 'left';   ctx.textBaseline = 'middle';
  ctx.fillText('X', limite + 7, origen.cy);
  ctx.textAlign    = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('Y', origen.cx, MARGEN - 5);
}

function dibujarPuntaFlecha(ctx, x, y, anguloDeg) {
  const rad = anguloDeg * Math.PI / 180;
  const t   = 6;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rad);
  ctx.beginPath();
  ctx.moveTo(t, 0); ctx.lineTo(-t, -t * 0.6); ctx.lineTo(-t, t * 0.6);
  ctx.closePath();
  ctx.fillStyle = CONFIG.COLORES.ejeGrid;
  ctx.fill();
  ctx.restore();
}

function dibujarNumerosGrid(ctx) {
  const origen = cartesianoACanvas(0, 0);
  ctx.fillStyle = CONFIG.COLORES.textoGrid;
  ctx.font      = '10px sans-serif';

  for (let i = -CONFIG.RADIO_GRID; i <= CONFIG.RADIO_GRID; i++) {
    if (i === 0) continue;
    const { cx } = cartesianoACanvas(i, 0);
    const { cy } = cartesianoACanvas(0, i);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(i, cx, origen.cy + 5);
    ctx.textAlign = 'right';  ctx.textBaseline = 'middle';
    ctx.fillText(i, origen.cx - 6, cy);
  }
}

function dibujarObstaculos(ctx) {
  const pad = CONFIG.TAMANO_CELDA * 0.41;
  const cajaSprite = SPRITES_DATA.caja;

  juego.obstaculos.forEach(o => {
    const ps = o.celdas.map(c => cartesianoACanvas(c.x, c.y));
    const x0 = Math.min(...ps.map(p => p.cx)) - pad;
    const y0 = Math.min(...ps.map(p => p.cy)) - pad;
    const x1 = Math.max(...ps.map(p => p.cx)) + pad;
    const y1 = Math.max(...ps.map(p => p.cy)) + pad;
    const w  = x1 - x0;
    const h  = y1 - y0;

    if (cajaSprite && cajaSprite.complete && cajaSprite.naturalWidth > 0) {
      ctx.drawImage(cajaSprite, x0, y0, w, h);
      return;
    }
    // Fallback visual original
    ctx.fillStyle = CONFIG.COLORES.obstaculo;
    dibujarRectRedondeado(ctx, x0, y0, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORES.obstaculoBorde;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.strokeStyle = CONFIG.COLORES.obstaculoLinea;
    ctx.lineWidth   = 1;
    o.celdas.forEach(c => {
      const { cx, cy } = cartesianoACanvas(c.x, c.y);
      const m = pad * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx - m, cy - m); ctx.lineTo(cx + m, cy + m);
      ctx.moveTo(cx + m, cy - m); ctx.lineTo(cx - m, cy + m);
      ctx.stroke();
    });
  });
}

function dibujarSalida(ctx) {
  // En los niveles de álgebra la salida está OCULTA: el jugador solo puede
  // encontrarla resolviendo las ecuaciones del panel. Si se dibujara, podría
  // llegar a ojo sin despejar x — que es justo lo que el nivel debe enseñar.
  if (HABITACIONES[juego.habActual]?.modoAlgebra) return;

  const { cx, cy }   = cartesianoACanvas(juego.salida.x, juego.salida.y);
  const disponible   = juego.monedas.some(m => m.recogida);
  const portalSprite = SPRITES_DATA.portal;
  const tam          = CONFIG.TAMANO_CELDA * 1.15;

  // Pulso lento
  const pulso = 0.92 + 0.08 * Math.sin(Date.now() / 600);

  if (portalSprite && portalSprite.complete && portalSprite.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = disponible ? 1 : 0.45;
    ctx.translate(cx, cy);
    ctx.scale(pulso, pulso);
    ctx.drawImage(portalSprite, -tam / 2, -tam / 2, tam, tam);
    ctx.restore();
    return;
  }
  // Fallback
  const tamFb = tam * 0.44;
  ctx.save();
  ctx.shadowColor = CONFIG.COLORES.salidaGlow;
  ctx.shadowBlur  = disponible ? 22 : 8;
  dibujarRectRedondeado(ctx, cx - tamFb / 2, cy - tamFb / 2, tamFb, tamFb, 4);
  ctx.fillStyle   = disponible ? CONFIG.COLORES.salida : '#2a5a2a';
  ctx.fill();
  ctx.strokeStyle = CONFIG.COLORES.salidaBorde;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = disponible ? '#fff' : '#4a8a4a';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SALIDA', cx, cy);
}

function dibujarMonedas(ctx) {
  juego.monedas.forEach(m => {
    if (m.recogida) return;
    const { cx, cy } = cartesianoACanvas(m.x, m.y);
    m.dibujar(ctx, cx, cy, juego.timestamp);
  });
}

function dibujarRectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}


// ── Minimapa ──────────────────────────────────────────────────────────────────

function renderizarMinimapa() {
  const { miniCtx, miniCanvas } = juego;
  const tam = miniCanvas.width / (CONFIG.RADIO_GRID * 2 + 1);

  miniCtx.fillStyle = CONFIG.COLORES.fondoCanvas;
  miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

  juego.obstaculos.forEach(o => o.celdas.forEach(c => {
    const ox = (c.x + CONFIG.RADIO_GRID) * tam + tam / 2;
    const oy = (CONFIG.RADIO_GRID - c.y) * tam + tam / 2;
    miniCtx.fillStyle = CONFIG.COLORES.obstaculoBorde;
    miniCtx.fillRect(ox - tam * 0.4, oy - tam * 0.4, tam * 0.8, tam * 0.8);
  }));

  juego.monedas.forEach(m => {
    if (m.recogida) return;
    const mx = (m.x + CONFIG.RADIO_GRID) * tam + tam / 2;
    const my = (CONFIG.RADIO_GRID - m.y) * tam + tam / 2;
    miniCtx.beginPath(); miniCtx.arc(mx, my, 3, 0, Math.PI * 2);
    miniCtx.fillStyle = CONFIG.COLORES.moneda; miniCtx.fill();
  });

  // La salida también se oculta del minimapa en niveles de álgebra
  if (!HABITACIONES[juego.habActual]?.modoAlgebra) {
    const sx = (juego.salida.x + CONFIG.RADIO_GRID) * tam + tam / 2;
    const sy = (CONFIG.RADIO_GRID - juego.salida.y) * tam + tam / 2;
    miniCtx.fillStyle = CONFIG.COLORES.salida;
    miniCtx.fillRect(sx - 3, sy - 3, 6, 6);
  }

  juego.guardias.forEach(g => {
    const gx = (g.x + CONFIG.RADIO_GRID) * tam + tam / 2;
    const gy = (CONFIG.RADIO_GRID - g.y) * tam + tam / 2;
    miniCtx.beginPath(); miniCtx.arc(gx, gy, 3, 0, Math.PI * 2);
    miniCtx.fillStyle = CONFIG.COLORES.guardia; miniCtx.fill();
  });

  const jx = (anim.x + CONFIG.RADIO_GRID) * tam + tam / 2;
  const jy = (CONFIG.RADIO_GRID - anim.y) * tam + tam / 2;
  miniCtx.beginPath(); miniCtx.arc(jx, jy, 4, 0, Math.PI * 2);
  miniCtx.fillStyle = CONFIG.COLORES.jugador; miniCtx.fill();
}


// ── Utilidades ────────────────────────────────────────────────────────────────

function cartesianoACanvas(x, y) {
  const origen = CONFIG.MARGEN + CONFIG.RADIO_GRID * CONFIG.TAMANO_CELDA;
  return { cx: origen + x * CONFIG.TAMANO_CELDA, cy: origen - y * CONFIG.TAMANO_CELDA };
}

function celdasEnRuta(rutaPatrulla) {
  const [a, b] = rutaPatrulla;
  const celdas = [];
  if (a.y === b.y) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) celdas.push({ x, y: a.y });
  } else {
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) celdas.push({ x: a.x, y });
  }
  return celdas;
}

function celdasEnRadio(centro, radio) {
  const celdas = [];
  for (let dx = -radio; dx <= radio; dx++)
    for (let dy = -radio; dy <= radio; dy++)
      if (Math.sqrt(dx*dx + dy*dy) <= radio) celdas.push({ x: centro.x+dx, y: centro.y+dy });
  return celdas;
}

function esCeldaObstaculo(x, y) {
  return juego.obstaculos.some(o => o.celdas.some(c => c.x === x && c.y === y));
}

function clavePos(pos) { return `${pos.x},${pos.y}`; }

function aleatorioEntero(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
