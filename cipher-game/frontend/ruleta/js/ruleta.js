/* ═══════════════════════════════════════════════════════════
   RULETA.JS — Motor de Canvas: renderizado y animación
   Dibuja la ruleta americana (38 casillas) y anima la bola
   ═══════════════════════════════════════════════════════════ */

// Orden oficial de casillas en la ruleta americana
const ORDEN_CASILLAS = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24,
  36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21,
  33, 16, 4, 23, 35, 14, 2,
];

const NUMEROS_ROJOS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const TOTAL_CASILLAS      = ORDEN_CASILLAS.length;
const ANGULO_POR_CASILLA  = (2 * Math.PI) / TOTAL_CASILLAS;

// Paleta de colores del canvas (espejo de las CSS vars)
const COLOR = {
  casillaRoja:    '#B03060',
  casillaNegra:   '#1A1640',
  casillaVerde:   '#0D9B8C',
  bordeRueda:     '#C9A84C',
  bordeDelgado:   '#A0844A',
  hubFondo:       '#0A0D1A',
  hubBorde:       '#C9A84C',
  bola:           '#F5F0E8',
  bolaBrillo:     '#FFFFFF',
  texto:          '#F0EDD4',
  anilloExterior: '#0D1525',
  indicador:      '#C9A84C',
  // Estados de casilla modificada
  mejorada:    '#3DD68C',
  deteriorada: '#C9A84C',
  negativa:    '#F06060',
  neutro:      '#8A9BB0',
  base:        '#8A9BB0',
};

export class RuletaCanvas {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');

    // Ángulo de rotación de la rueda (rad)
    this.anguloRueda   = 0;
    // Velocidad angular de la rueda (rad/frame)
    this.velocidadRueda = 0;

    // Ángulo absoluto de la bola (rad)
    this.anguloBola    = 0;
    // Velocidad angular de la bola (rad/frame)
    this.velocidadBola = 0;
    // Radio actual de la bola (px)
    this.radioBola     = 0;

    this.girando       = false;
    this._rafId        = null;
    this._alTerminar   = null;

    // Mapa de casillas activadas: clave → 'positivo'|'neutro'|'negativo'
    this._estadoCasillas = new Map();

    // Los radios y el primer dibujo se hacen al llamar redimensionar()
    this._calcularRadios();
  }

  // ── Configuración de radios según tamaño del canvas ──────
  _calcularRadios() {
    const r = this.canvas.width / 2;
    this.cx = r;
    this.cy = r;

    this.RADIO_EXTERIOR   = r * 0.97;  // anillo decorativo externo
    this.RADIO_RUEDA      = r * 0.90;  // borde externo de casillas
    this.RADIO_NUMEROS    = r * 0.73;  // posición del número en cada sector
    this.RADIO_SEPARADOR  = r * 0.55;  // borde interno de casillas
    this.RADIO_HUB        = r * 0.22;  // radio del centro decorativo
    this.RADIO_PISTA_BOLA = r * 0.86;  // órbita exterior de la bola en giro
    this.RADIO_BOLA_REPOSO= r * 0.72;  // radio donde la bola descansa en casilla
    this.RADIO_BOLA       = r * 0.030; // tamaño visual de la bola
  }

  // ── Color de una casilla según su número ─────────────────
  _colorCasilla(numero) {
    if (numero === 0 || numero === '00') return COLOR.casillaVerde;
    if (NUMEROS_ROJOS.has(Number(numero))) return COLOR.casillaRoja;
    return COLOR.casillaNegra;
  }

  // ── Dibujo completo de un frame ──────────────────────────
  _dibujar() {
    const { ctx, canvas, cx, cy } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._dibujarAnilloExterior();
    this._dibujarCasillas();
    this._dibujarMarcadoresActivados();
    this._dibujarNumeros();
    this._dibujarHub();
    this._dibujarIndicadorTop();
    this._dibujarBola();
  }

  // Anillo decorativo exterior (dorado oscuro)
  _dibujarAnilloExterior() {
    const { ctx, cx, cy } = this;
    ctx.beginPath();
    ctx.arc(cx, cy, this.RADIO_EXTERIOR, 0, 2 * Math.PI);
    ctx.fillStyle = COLOR.anilloExterior;
    ctx.fill();
    ctx.strokeStyle = COLOR.bordeRueda;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Sectores de cada casilla
  _dibujarCasillas() {
    const { ctx, cx, cy } = this;
    for (let i = 0; i < TOTAL_CASILLAS; i++) {
      const numero    = ORDEN_CASILLAS[i];
      const angInicio = this.anguloRueda - Math.PI / 2 + i * ANGULO_POR_CASILLA;
      const angFin    = angInicio + ANGULO_POR_CASILLA;

      // Sector: arco externo + arco interno invertido
      ctx.beginPath();
      ctx.arc(cx, cy, this.RADIO_RUEDA,      angInicio, angFin);
      ctx.arc(cx, cy, this.RADIO_SEPARADOR,  angFin, angInicio, true);
      ctx.closePath();

      ctx.fillStyle = this._colorCasilla(numero);
      ctx.fill();

      ctx.strokeStyle = COLOR.bordeDelgado;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // Puntos de colores en casillas ya activadas por el jugador
  _dibujarMarcadoresActivados() {
    const { ctx, cx, cy } = this;
    const radioMarcador = this.canvas.width * 0.018;

    for (let i = 0; i < TOTAL_CASILLAS; i++) {
      const numero = ORDEN_CASILLAS[i];
      const estado = this._estadoCasillas.get(String(numero));
      if (!estado) continue;

      const angMedio = this.anguloRueda - Math.PI / 2 + (i + 0.5) * ANGULO_POR_CASILLA;
      const radioPos = (this.RADIO_RUEDA + this.RADIO_SEPARADOR) / 2;
      const mx = cx + radioPos * Math.cos(angMedio);
      const my = cy + radioPos * Math.sin(angMedio);

      ctx.beginPath();
      ctx.arc(mx, my, radioMarcador, 0, 2 * Math.PI);
      ctx.fillStyle = COLOR[estado];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Números sobre cada sector
  _dibujarNumeros() {
    const { ctx, cx, cy } = this;
    const tamFuente = Math.max(9, this.canvas.width * 0.028);

    ctx.font = `bold ${tamFuente}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.texto;

    for (let i = 0; i < TOTAL_CASILLAS; i++) {
      const numero   = ORDEN_CASILLAS[i];
      const angMedio = this.anguloRueda - Math.PI / 2 + (i + 0.5) * ANGULO_POR_CASILLA;
      const nx = cx + this.RADIO_NUMEROS * Math.cos(angMedio);
      const ny = cy + this.RADIO_NUMEROS * Math.sin(angMedio);

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(angMedio + Math.PI / 2);
      ctx.fillText(String(numero), 0, 0);
      ctx.restore();
    }
  }

  // Hub central decorativo
  _dibujarHub() {
    const { ctx, cx, cy } = this;

    // Fondo del hub
    ctx.beginPath();
    ctx.arc(cx, cy, this.RADIO_HUB, 0, 2 * Math.PI);
    const gradiente = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, this.RADIO_HUB);
    gradiente.addColorStop(0, '#1E2A45');
    gradiente.addColorStop(1, COLOR.hubFondo);
    ctx.fillStyle = gradiente;
    ctx.fill();

    // Borde dorado
    ctx.strokeStyle = COLOR.hubBorde;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Punto central
    ctx.beginPath();
    ctx.arc(cx, cy, this.RADIO_HUB * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = COLOR.bordeRueda;
    ctx.fill();
  }

  // Triángulo indicador en la parte superior (marca dónde cae la bola)
  _dibujarIndicadorTop() {
    const { ctx, cx } = this;
    const y = this.cy - this.RADIO_EXTERIOR + 6;
    const size = this.canvas.width * 0.022;

    ctx.beginPath();
    ctx.moveTo(cx, y + size * 1.5);
    ctx.lineTo(cx - size, y);
    ctx.lineTo(cx + size, y);
    ctx.closePath();
    ctx.fillStyle = COLOR.indicador;
    ctx.fill();
  }

  // Bola
  _dibujarBola() {
    const { ctx, cx, cy } = this;
    if (this.radioBola === 0) return;

    const bx = cx + this.radioBola * Math.cos(this.anguloBola);
    const by = cy + this.radioBola * Math.sin(this.anguloBola);
    const rb = this.RADIO_BOLA;

    // Sombra
    ctx.beginPath();
    ctx.arc(bx + 1.5, by + 1.5, rb, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    // Cuerpo de la bola
    const grad = ctx.createRadialGradient(bx - rb * 0.3, by - rb * 0.3, rb * 0.1, bx, by, rb);
    grad.addColorStop(0, COLOR.bolaBrillo);
    grad.addColorStop(0.4, COLOR.bola);
    grad.addColorStop(1, '#C8C0B0');
    ctx.beginPath();
    ctx.arc(bx, by, rb, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── Animación de giro ────────────────────────────────────
  girar(alTerminar) {
    if (this.girando) return;
    this._alTerminar = alTerminar;

    // Velocidades iniciales aleatorias (rueda y bola en sentidos opuestos)
    this.velocidadRueda = 0.06 + Math.random() * 0.06;
    this.velocidadBola  = -(0.14 + Math.random() * 0.06);

    // Bola parte en la pista exterior
    this.radioBola  = this.RADIO_PISTA_BOLA;
    this.anguloBola = Math.random() * 2 * Math.PI;

    this.girando = true;
    this._animarFrame();
  }

  _animarFrame() {
    // Deceleración (fricción)
    this.velocidadRueda *= 0.9935;
    this.velocidadBola  *= 0.9920;

    // Actualizar ángulos
    this.anguloRueda += this.velocidadRueda;
    this.anguloBola  += this.velocidadBola;

    // La bola cae hacia las casillas a medida que desacelera
    const velAbs = Math.abs(this.velocidadBola);
    const t = Math.min(1, Math.max(0, (velAbs - 0.008) / 0.13));
    this.radioBola = this.RADIO_BOLA_REPOSO + t * (this.RADIO_PISTA_BOLA - this.RADIO_BOLA_REPOSO);

    this._dibujar();

    // Condición de parada
    const ruedaParada = Math.abs(this.velocidadRueda) < 0.002;
    const bolaParada  = Math.abs(this.velocidadBola) < 0.006;

    if (ruedaParada && bolaParada) {
      this.velocidadRueda = 0;
      this.velocidadBola  = 0;
      this.radioBola      = this.RADIO_BOLA_REPOSO;
      this.girando        = false;

      const casilla = this._calcularCasillaAterrizaje();
      this._dibujar();

      if (this._alTerminar) this._alTerminar(casilla);
      return;
    }

    this._rafId = requestAnimationFrame(() => this._animarFrame());
  }

  // Calcula en qué casilla quedó la bola según los ángulos finales
  _calcularCasillaAterrizaje() {
    // Ángulo de la bola relativo al eje de la rueda, con offset de inicio
    let anguloRelativo = this.anguloBola - this.anguloRueda + Math.PI / 2;

    // Normalizar a [0, 2π]
    anguloRelativo = ((anguloRelativo % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    const indice = Math.floor(anguloRelativo / ANGULO_POR_CASILLA) % TOTAL_CASILLAS;
    return ORDEN_CASILLAS[indice];
  }

  // ── API pública ──────────────────────────────────────────

  /** Marca una casilla con su estado para dibujar el indicador de color */
  marcarCasilla(numero, estado) {
    this._estadoCasillas.set(String(numero), estado);
    this._dibujar();
  }

  /** Ajusta el tamaño del canvas y recalcula radios */
  redimensionar(tamaño) {
    this.canvas.width  = tamaño;
    this.canvas.height = tamaño;
    this._calcularRadios();
    this._dibujar();
  }

  /** Muestra la bola en reposo sin girar (estado inicial) */
  mostrarBolaEnReposo() {
    this.radioBola  = this.RADIO_BOLA_REPOSO;
    this.anguloBola = -Math.PI / 2; // parte arriba
    this._dibujar();
  }
}
