/* ═══════════════════════════════════════════════════════════
   PROBLEMAS.JS — Preguntas por ronda (3 niveles con temas distintos)
   Ronda 1: puntos y cuadrantes
   Ronda 2: desplazamientos en el plano
   Ronda 3: álgebra básica — despejar variables
   ═══════════════════════════════════════════════════════════ */

function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function enteroSinCero(min, max) {
  let n;
  do { n = Math.floor(Math.random() * (max - min + 1)) + min; } while (n === 0);
  return n;
}

const CUADRANTES = ['Cuadrante I', 'Cuadrante II', 'Cuadrante III', 'Cuadrante IV'];

// ═══════════════════════════════════════════════════════════
// RONDA 1 — Puntos y cuadrantes
// ═══════════════════════════════════════════════════════════

function preguntaCuadrante() {
  const x = enteroSinCero(-8, 8), y = enteroSinCero(-8, 8);
  let correcta;
  if (x > 0 && y > 0) correcta = 'Cuadrante I';
  else if (x < 0 && y > 0) correcta = 'Cuadrante II';
  else if (x < 0 && y < 0) correcta = 'Cuadrante III';
  else correcta = 'Cuadrante IV';
  const opciones = mezclar([...CUADRANTES]);
  return {
    enunciado: `¿En qué cuadrante se encuentra el punto (${x}, ${y})?`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

function preguntaPuntoEnCuadrante() {
  const cuadrante = CUADRANTES[Math.floor(Math.random() * 4)];
  const genPunto = (c) => {
    const n = () => enteroSinCero(1, 8);
    if (c === 'Cuadrante I')   return `(${n()}, ${n()})`;
    if (c === 'Cuadrante II')  return `(-${n()}, ${n()})`;
    if (c === 'Cuadrante III') return `(-${n()}, -${n()})`;
    return `(${n()}, -${n()})`;
  };
  const correcta    = genPunto(cuadrante);
  const incorrectas = CUADRANTES.filter(c => c !== cuadrante).map(genPunto);
  const opciones     = mezclar([correcta, ...incorrectas]);
  return {
    enunciado: `¿Cuál de estos puntos está en el ${cuadrante}?`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

function preguntaEje() {
  const ejeX  = Math.random() < 0.5;
  const v     = enteroSinCero(-8, 8);
  const punto = ejeX ? `(${v}, 0)` : `(0, ${v})`;
  const correcta = ejeX ? 'Eje X' : 'Eje Y';
  const base  = ['Eje X', 'Eje Y', 'Cuadrante I', 'Origen (0,0)'];
  const opciones = mezclar([correcta, ...base.filter(o => o !== correcta).slice(0, 3)]);
  return {
    enunciado: `El punto ${punto} está ubicado sobre el...`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

function preguntaSignos() {
  const cuadrante = CUADRANTES[Math.floor(Math.random() * 4)];
  const descripciones = {
    'Cuadrante I':   { desc: 'x positivo e y positivo',  correcta: '(3, 5)'  },
    'Cuadrante II':  { desc: 'x negativo e y positivo',  correcta: '(-4, 6)' },
    'Cuadrante III': { desc: 'x negativo e y negativo',  correcta: '(-2, -7)'},
    'Cuadrante IV':  { desc: 'x positivo e y negativo',  correcta: '(8, -3)' },
  };
  const { desc, correcta } = descripciones[cuadrante];
  const opciones = mezclar(['(3, 5)', '(-4, 6)', '(-2, -7)', '(8, -3)']);
  return {
    enunciado: `¿Cuál punto tiene ${desc}? (${cuadrante})`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

// ═══════════════════════════════════════════════════════════
// RONDA 2 — Desplazamientos en el plano
// ═══════════════════════════════════════════════════════════

function preguntaDesplazamiento() {
  const x0 = enteroSinCero(-6, 6);
  const y0 = enteroSinCero(-6, 6);
  const dx = enteroSinCero(-5, 5);
  const dy = enteroSinCero(-5, 5);
  const xf = x0 + dx;
  const yf = y0 + dy;
  const correcta = `(${xf}, ${yf})`;

  const incorrectas = new Set();
  while (incorrectas.size < 3) {
    const ex = xf + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    const ey = yf + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    const cand = `(${ex}, ${ey})`;
    if (cand !== correcta) incorrectas.add(cand);
  }
  const opciones = mezclar([correcta, ...incorrectas]);
  const signoDx  = dx >= 0 ? `+${dx}` : `${dx}`;
  const signoDy  = dy >= 0 ? `+${dy}` : `${dy}`;
  return {
    enunciado: `Un agente está en (${x0}, ${y0}) y se desplaza ${signoDx} en X y ${signoDy} en Y. ¿A qué punto llega?`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

function preguntaDistanciaEjes() {
  const eje = Math.random() < 0.5 ? 'X' : 'Y';
  const a   = Math.floor(Math.random() * 7) + 1;
  const b   = a + Math.floor(Math.random() * 6) + 2;
  const correcta = String(b - a);
  const incorrectas = new Set();
  while (incorrectas.size < 3) {
    const v = (b - a) + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    if (v > 0 && String(v) !== correcta) incorrectas.add(String(v));
  }
  const opciones = mezclar([correcta, ...incorrectas]);
  const p1 = eje === 'X' ? `(${a}, 0)` : `(0, ${a})`;
  const p2 = eje === 'X' ? `(${b}, 0)` : `(0, ${b})`;
  return {
    enunciado: `¿Cuánto mide la distancia entre los puntos ${p1} y ${p2} sobre el eje ${eje}?`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

function preguntaCuantasUnidades() {
  const eje  = Math.random() < 0.5 ? 'X' : 'Y';
  const dir  = Math.random() < 0.5;
  const ini  = enteroSinCero(-6, 6);
  const delta = Math.floor(Math.random() * 6) + 2;
  const fin  = dir ? ini + delta : ini - delta;
  const sentido = dir
    ? (eje === 'X' ? 'a la derecha' : 'hacia arriba')
    : (eje === 'X' ? 'a la izquierda' : 'hacia abajo');
  const correcta = `${delta} unidades ${sentido}`;
  const otrosSentidos = eje === 'X'
    ? ['a la derecha', 'a la izquierda']
    : ['hacia arriba', 'hacia abajo'];
  const opcionesTexto = [
    correcta,
    `${delta + 2} unidades ${sentido}`,
    `${delta} unidades ${otrosSentidos.find(s => s !== sentido)}`,
    `${Math.max(1, delta - 2)} unidades ${sentido}`,
  ];
  const opciones = mezclar(opcionesTexto);
  const p1 = eje === 'X' ? `(${ini}, 0)` : `(0, ${ini})`;
  const p2 = eje === 'X' ? `(${fin}, 0)` : `(0, ${fin})`;
  return {
    enunciado: `Un agente está en ${p1} y necesita llegar a ${p2}. ¿Cuánto y en qué dirección debe moverse?`,
    opciones,
    indiceCorrecto: opciones.indexOf(correcta),
  };
}

// ═══════════════════════════════════════════════════════════
// RONDA 3 — Álgebra básica: despejar variables
// ═══════════════════════════════════════════════════════════

function preguntaDespejeSuma() {
  const x = enteroSinCero(-12, 12);
  const a = enteroSinCero(1, 15);
  const b = x + a;
  const correcta = String(x);
  const { opciones, indiceCorrecto } = generarOpcionesNumericas(correcta);
  const bTxt = b >= 0 ? `${b}` : `${b}`;
  return {
    enunciado: `Resuelve para x: x + ${a} = ${bTxt}`,
    opciones,
    indiceCorrecto,
  };
}

function preguntaDespejeResta() {
  const x = enteroSinCero(-10, 15);
  const a = enteroSinCero(1, 12);
  const b = x - a;
  const correcta = String(x);
  const { opciones, indiceCorrecto } = generarOpcionesNumericas(correcta);
  return {
    enunciado: `Resuelve para x: x − ${a} = ${b}`,
    opciones,
    indiceCorrecto,
  };
}

function preguntaDespejeMultiplicacion() {
  const x = enteroSinCero(-9, 9);
  const a = enteroSinCero(2, 6);
  const b = x * a;
  const correcta = String(x);
  const { opciones, indiceCorrecto } = generarOpcionesNumericas(correcta);
  return {
    enunciado: `Resuelve para x: ${a}x = ${b}`,
    opciones,
    indiceCorrecto,
  };
}

function preguntaDespejeDosPasos() {
  const x = enteroSinCero(-8, 8);
  const a = enteroSinCero(2, 5);
  const b = enteroSinCero(1, 10);
  const resultado = a * x + b;
  const correcta = String(x);
  const { opciones, indiceCorrecto } = generarOpcionesNumericas(correcta);
  const signoB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  return {
    enunciado: `Resuelve para x: ${a}x ${signoB} = ${resultado}`,
    opciones,
    indiceCorrecto,
  };
}

/** Genera 3 distractores numéricos cercanos al valor correcto */
function generarOpcionesNumericas(correctaStr) {
  const correcta = parseInt(correctaStr);
  const incorrectas = new Set();
  const offsets = [1, 2, 3, -1, -2, -3, 4, -4];
  let i = 0;
  while (incorrectas.size < 3 && i < offsets.length) {
    const cand = correcta + offsets[i];
    if (cand !== correcta) incorrectas.add(String(cand));
    i++;
  }
  const todas = mezclar([String(correcta), ...[...incorrectas].slice(0, 3)]);
  return { opciones: todas, indiceCorrecto: todas.indexOf(String(correcta)) };
}

// ═══════════════════════════════════════════════════════════
// API pública — dispatcher por ronda
// ═══════════════════════════════════════════════════════════

function generarProblema(ronda = 1) {
  let generadores;

  if (ronda === 1) {
    generadores = [preguntaCuadrante, preguntaCuadrante, preguntaPuntoEnCuadrante, preguntaEje, preguntaSignos];
  } else if (ronda === 2) {
    generadores = [preguntaDesplazamiento, preguntaDesplazamiento, preguntaDistanciaEjes, preguntaCuantasUnidades];
  } else {
    generadores = [preguntaDespejeSuma, preguntaDespejeResta, preguntaDespejeMultiplicacion, preguntaDespejeDosPasos];
  }

  return generadores[Math.floor(Math.random() * generadores.length)]();
}

export function generarUnProblema(ronda = 1) {
  return [{ id: 0, problema: generarProblema(ronda), resultado: null }];
}

export function verificarRespuesta(problema, indiceRespuesta) {
  const esCorrecta = indiceRespuesta === problema.indiceCorrecto;
  return {
    esCorrecta,
    indiceCorrecto: problema.indiceCorrecto,
    textoCorrecta:  problema.opciones[problema.indiceCorrecto],
  };
}
