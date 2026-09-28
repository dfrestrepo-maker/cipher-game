/* ═══════════════════════════════════════════════════════
   PREGUNTAS-PRETEST.JS — Banco de 16 preguntas diagnósticas
   Temas: puntos (4), cuadrantes (4), desplazamientos (4), álgebra (4)
   Refleja los 3 niveles de SIGMA Matrix
   ═══════════════════════════════════════════════════════ */

const PREGUNTAS_PRETEST = [

  // ── BLOQUE 1: Identificar puntos en el plano (4) ────
  {
    id: 1,
    tema: 'puntos',
    enunciado: '¿Cuáles son las coordenadas del punto que está 3 unidades a la derecha del origen y 2 unidades arriba?',
    opciones: ['(3, 2)', '(2, 3)', '(-3, 2)', '(3, -2)'],
    correcta: 0,
  },
  {
    id: 2,
    tema: 'puntos',
    enunciado: 'En el punto (−4, 5), ¿qué representa el número −4?',
    opciones: [
      'La distancia al eje Y',
      'La posición sobre el eje X (horizontal)',
      'La posición sobre el eje Y (vertical)',
      'El cuadrante donde está el punto',
    ],
    correcta: 1,
  },
  {
    id: 3,
    tema: 'puntos',
    enunciado: '¿Qué punto está ubicado exactamente sobre el eje X (y = 0)?',
    opciones: ['(0, 5)', '(3, 0)', '(0, 0)', '(2, 2)'],
    correcta: 1,
  },
  {
    id: 4,
    tema: 'puntos',
    enunciado: '¿Cuál es la distancia entre los puntos (1, 0) y (5, 0) sobre el eje X?',
    opciones: ['3', '4', '5', '6'],
    correcta: 1,
  },

  // ── BLOQUE 2: Cuadrantes y signos (4) ───────────────
  {
    id: 5,
    tema: 'cuadrantes',
    enunciado: '¿En qué cuadrante está el punto (−3, 7)?',
    opciones: ['Cuadrante I', 'Cuadrante II', 'Cuadrante III', 'Cuadrante IV'],
    correcta: 1,
  },
  {
    id: 6,
    tema: 'cuadrantes',
    enunciado: '¿Qué tienen en común todos los puntos del Cuadrante III?',
    opciones: [
      'x positivo, y positivo',
      'x negativo, y positivo',
      'x negativo, y negativo',
      'x positivo, y negativo',
    ],
    correcta: 2,
  },
  {
    id: 7,
    tema: 'cuadrantes',
    enunciado: '¿Cuál de estos puntos pertenece al Cuadrante IV?',
    opciones: ['(−2, −5)', '(4, 3)', '(6, −1)', '(−3, 8)'],
    correcta: 2,
  },
  {
    id: 8,
    tema: 'cuadrantes',
    enunciado: 'El punto (0, −4) está ubicado...',
    opciones: [
      'En el Cuadrante III',
      'En el origen',
      'Sobre el eje X',
      'Sobre el eje Y (parte negativa)',
    ],
    correcta: 3,
  },

  // ── BLOQUE 3: Desplazamientos (4) ───────────────────
  {
    id: 9,
    tema: 'desplazamientos',
    enunciado: 'Estás en el punto (2, 3). Te mueves 4 unidades a la derecha y 1 unidad hacia abajo. ¿A qué punto llegaste?',
    opciones: ['(6, 4)', '(6, 2)', '(−2, 4)', '(2, 7)'],
    correcta: 1,
  },
  {
    id: 10,
    tema: 'desplazamientos',
    enunciado: 'Desde el punto (−1, −2), te desplazas +3 en X y +5 en Y. ¿Cuál es tu nueva posición?',
    opciones: ['(2, 3)', '(−4, 3)', '(2, −7)', '(4, 3)'],
    correcta: 0,
  },
  {
    id: 11,
    tema: 'desplazamientos',
    enunciado: 'Un agente está en (5, −3) y necesita llegar a (5, 2). ¿Cuántas unidades debe moverse y en qué dirección?',
    opciones: [
      '5 unidades hacia la derecha',
      '5 unidades hacia arriba',
      '1 unidad hacia arriba',
      '5 unidades hacia abajo',
    ],
    correcta: 1,
  },
  {
    id: 12,
    tema: 'desplazamientos',
    enunciado: 'Desde (−4, 6), te mueves −2 en X (hacia la izquierda) y −4 en Y (hacia abajo). ¿Dónde terminas?',
    opciones: ['(−6, 2)', '(−2, 2)', '(−6, 10)', '(−2, 10)'],
    correcta: 0,
  },

  // ── BLOQUE 4: Álgebra básica — despejar variables (4) ─
  {
    id: 13,
    tema: 'algebra',
    enunciado: 'Resuelve para x: x + 5 = 12',
    opciones: ['5', '7', '12', '17'],
    correcta: 1,
  },
  {
    id: 14,
    tema: 'algebra',
    enunciado: 'Resuelve para x: x − 4 = 9',
    opciones: ['5', '9', '13', '4'],
    correcta: 2,
  },
  {
    id: 15,
    tema: 'algebra',
    enunciado: 'Resuelve para x: 3x = 15',
    opciones: ['3', '5', '12', '45'],
    correcta: 1,
  },
  {
    id: 16,
    tema: 'algebra',
    enunciado: 'Resuelve para x: 2x + 4 = 10',
    opciones: ['2', '3', '6', '7'],
    correcta: 1,
  },
];
