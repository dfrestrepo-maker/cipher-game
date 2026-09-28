const HABITACIONES = [
  {
    id: 1,
    concepto: 'PLANO CARTESIANO',
    dificultad: 'MUY BAJA',
    tiempoLimite: 90, // segundos
    jugadorInicio: { x: 0, y: 0 },
    zonaSegura:    { x: 0, y: 0, radio: 1 },
    guardias: [
      { id: 1, tipo: 'horizontal', velocidad: 1200, fov: 60, rango: 3 },
      { id: 2, tipo: 'vertical',   velocidad: 1000, fov: 60, rango: 3 },
    ],
    problema: {
      pista: 'Un guardia patrulla en horizontal, otro en vertical. Usa las cajas para bloquear su visión.',
    },
  },

  {
    id: 2,
    concepto: 'CUADRANTES Y DESPLAZAMIENTOS',
    dificultad: 'BAJA',
    tiempoLimite: 130, // segundos — más tiempo por la mecánica nueva
    modoDesplazamiento: true,  // los inputs son Δx / Δy en vez de coordenadas absolutas
    jugadorInicio: { x: 0, y: 0 },
    zonaSegura:    { x: 0, y: 0, radio: 1 },
    // Máximo 3 guardias — más lentos que el nivel 1 para compensar que ahora
    // hay uno más patrullando y la mecánica de desplazamiento es nueva
    guardias: [
      { id: 1, tipo: 'horizontal', velocidad: 1300, fov: 70, rango: 4 },
      { id: 2, tipo: 'vertical',   velocidad: 1250, fov: 70, rango: 4 },
      { id: 3, tipo: 'horizontal', velocidad: 1400, fov: 65, rango: 3 },
    ],
    problema: {
      pista: 'Tres drones patrullan, más lentos pero más atentos. Los movimientos se dan como desplazamientos: avanza X unidades en horizontal y Y en vertical.',
    },
  },

  {
    id: 3,
    concepto: 'ÁLGEBRA BÁSICA — DESPEJAR VARIABLES',
    dificultad: 'BAJA-MEDIA',
    tiempoLimite: 190, // segundos — el jugador necesita resolver ecuaciones antes de moverse
    modoDesplazamiento: true,
    modoAlgebra: true, // el desplazamiento se entrega oculto detrás de una ecuación a resolver
    jugadorInicio: { x: 0, y: 0 },
    zonaSegura:    { x: 0, y: 0, radio: 1 },
    // Máximo 3 guardias — más lentos aún que el nivel 2: el reto de este
    // nivel es resolver la ecuación correctamente, no la velocidad de reacción
    guardias: [
      { id: 1, tipo: 'horizontal', velocidad: 1500, fov: 72, rango: 4 },
      { id: 2, tipo: 'vertical',   velocidad: 1450, fov: 72, rango: 4 },
      { id: 3, tipo: 'horizontal', velocidad: 1600, fov: 68, rango: 4 },
    ],
    problema: {
      pista: 'Cada desplazamiento está oculto detrás de una ecuación: resuelve x antes de escribir tu movimiento. Los drones son lentos — tu verdadero reto es el álgebra.',
    },
  },
];
