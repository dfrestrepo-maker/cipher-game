const CONFIG = {
  CANVAS: { ANCHO: 638, ALTO: 638 },  // 2*39 + 16*35 = 638 — grid perfectamente centrado
  TAMANO_CELDA: 35,
  RADIO_GRID: 8,
  MARGEN: 39,
  MAX_INTENTOS: 3,
  TOTAL_MONEDAS: 3,
  RADIO_ZONA_SEGURA: 2,

  COLORES: {
    jugador:      '#4fc3f7',
    jugadorBorde: '#0288d1',
    jugadorGlow:  'rgba(79,195,247,0.3)',

    guardia:      '#ef5350',
    guardiaBorde: '#b71c1c',
    coneRelleno:  'rgba(239,83,80,0.18)',
    coneBorde:    'rgba(239,83,80,0.55)',

    salida:       '#66bb6a',
    salidaBorde:  '#2e7d32',
    salidaGlow:   'rgba(102,187,106,0.5)',

    moneda:       '#ffd54f',
    monedaBorde:  '#f57f17',
    monedaGlow:   'rgba(255,213,79,0.5)',

    obstaculo:      '#5d3a1a',
    obstaculoBorde: '#8b5e3c',
    obstaculoLinea: '#7a4e2d',
  },

  RADIOS: {
    jugador: 14,
    guardia: 12,
    moneda:  9,
  },
};

// Colores del plano que cambian con el modo claro/oscuro (js/tema.js).
// El resto (jugador, guardias, monedas, salida) se ve bien en ambos fondos.
const COLORES_PLANO = {
  oscuro: { fondoCanvas: '#0c0c20', lineaGrid: '#1a1a3e', ejeGrid: '#d4cbb4', textoGrid: '#b8af98' },
  claro:  { fondoCanvas: '#FFFFFF', lineaGrid: '#E1E7EE', ejeGrid: '#2A3546', textoGrid: '#5B6B7E' },
};
function aplicarTemaPlano(tema) {
  Object.assign(CONFIG.COLORES, COLORES_PLANO[tema] || COLORES_PLANO.oscuro);
}
aplicarTemaPlano(document.documentElement.dataset.tema);
document.addEventListener('cambio-tema', e => aplicarTemaPlano(e.detail));
