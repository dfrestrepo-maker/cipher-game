/* ═══════════════════════════════════════════════════════════
   MUSICA.JS — Motor de música adaptativa (Web Audio API)

   Sin archivos externos ni licencias: todo se sintetiza en vivo.
   Se carga como script global para poder usarse tanto en
   Coordinados (scripts planos) como en SIGMA Matrix (módulos ES).

   La música reacciona al desempeño del jugador:
     intensidad ALTA  → electrónico frenético (kick 4x4, acid bass, arpegios)
     intensidad MEDIA → electrónico contenido
     intensidad BAJA  → guitarras suaves, sin percusión agresiva
   ═══════════════════════════════════════════════════════════ */

const Musica = (() => {

  // ── Contexto y cadena de audio ──────────────────────────
  let ctx        = null;
  let gainMaster = null;  // volumen global
  let gainMusica = null;  // solo música
  let gainSFX    = null;  // solo efectos (lo usan los otros módulos)

  let reproduciendo = false;
  let intervalo     = null;
  let paso          = 0;

  // Intensidad objetivo (0 = calma, 1 = frenético) y la actual (se interpola
  // para que los cambios de ánimo no sean bruscos)
  let intensidadObjetivo = 0.5;
  let intensidadActual   = 0.5;

  // ── Volúmenes persistidos ───────────────────────────────
  const CLAVE_VOL_MUSICA = 'cipher_vol_musica';
  const CLAVE_VOL_SFX    = 'cipher_vol_sfx';

  function _leerVol(clave, pordefecto) {
    const v = parseFloat(localStorage.getItem(clave));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : pordefecto;
  }

  let volMusica = _leerVol(CLAVE_VOL_MUSICA, 0.55);
  let volSFX    = _leerVol(CLAVE_VOL_SFX,    0.80);

  // ── Escala pentatónica de La menor (todo suena consonante) ──
  const BAJO  = [110.00, 130.81, 146.83, 164.81];            // A2 C3 D3 E3
  const MEDIO = [220.00, 261.63, 293.66, 329.63, 392.00];    // A3 C4 D4 E4 G4
  const ALTO  = [440.00, 523.25, 587.33, 659.25, 783.99];    // A4 C5 D5 E5 G5

  const PASOS_COMPAS = 16;

  // Patrones rítmicos por capa
  const KICK_INTENSO  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0];
  const KICK_MEDIO    = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
  const SNARE         = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
  const HAT_INTENSO   = [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1];
  const HAT_MEDIO     = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];

  // ── Inicialización de la cadena ─────────────────────────
  function _asegurarContexto() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      gainMaster = ctx.createGain();
      gainMaster.gain.value = 1;
      gainMaster.connect(ctx.destination);

      gainMusica = ctx.createGain();
      gainMusica.gain.value = volMusica;
      gainMusica.connect(gainMaster);

      gainSFX = ctx.createGain();
      gainSFX.gain.value = volSFX;
      gainSFX.connect(gainMaster);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Voces sintéticas ────────────────────────────────────

  function _kick(t, fuerza = 1) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env); env.connect(gainMusica);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    env.gain.setValueAtTime(0.85 * fuerza, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t); osc.stop(t + 0.18);
  }

  function _ruido(dur) {
    const n = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function _hat(t, fuerza = 1) {
    const src = _ruido(0.03);
    const hp  = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 8000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.16 * fuerza, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    src.connect(hp); hp.connect(env); env.connect(gainMusica);
    src.start(t); src.stop(t + 0.04);
  }

  function _snare(t, fuerza = 1) {
    const src = _ruido(0.12);
    const bp  = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.32 * fuerza, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    src.connect(bp); bp.connect(env); env.connect(gainMusica);
    src.start(t); src.stop(t + 0.14);
  }

  /** Bajo "acid": sierra con filtro resonante que se abre según la intensidad */
  function _bajo(hz, t, dur, intensidad) {
    const osc = ctx.createOscillator();
    const filtro = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = hz;

    filtro.type = 'lowpass';
    filtro.Q.value = 6 + 10 * intensidad;
    filtro.frequency.setValueAtTime(320 + 2200 * intensidad, t);
    filtro.frequency.exponentialRampToValueAtTime(220, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.28, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filtro); filtro.connect(env); env.connect(gainMusica);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /** Arpegio brillante para los momentos frenéticos */
  function _arp(hz, t, dur, vol) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = hz;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env); env.connect(gainMusica);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /**
   * Cuerda pulsada tipo guitarra suave — para el modo calma.
   * Triangular + filtro pasabajos + envolvente de decaimiento largo.
   */
  function _guitarra(hz, t, vol = 0.22) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();  // quinta suave para dar cuerpo
    const filtro = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type  = 'triangle'; osc.frequency.value  = hz;
    osc2.type = 'triangle'; osc2.frequency.value = hz * 1.5;

    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(2600, t);
    filtro.frequency.exponentialRampToValueAtTime(700, t + 1.2);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

    osc.connect(filtro); osc2.connect(filtro);
    filtro.connect(env); env.connect(gainMusica);
    osc.start(t);  osc.stop(t + 1.7);
    osc2.start(t); osc2.stop(t + 1.7);
  }

  // ── Secuenciador ────────────────────────────────────────

  function _tick() {
    // Interpolación suave hacia la intensidad objetivo
    intensidadActual += (intensidadObjetivo - intensidadActual) * 0.06;
    const I = intensidadActual;
    const t = ctx.currentTime;
    const p = paso % PASOS_COMPAS;
    const compas = Math.floor(paso / PASOS_COMPAS);

    if (I < 0.34) {
      // ── MODO CALMA: guitarras suaves, sin percusión ──
      // Un acorde arpegiado lento cada medio compás
      if (p === 0 || p === 8) {
        const raiz = MEDIO[(compas + (p === 8 ? 2 : 0)) % MEDIO.length];
        _guitarra(raiz / 2, t, 0.18);
        _guitarra(raiz,     t + 0.16, 0.14);
        _guitarra(raiz * 1.25, t + 0.32, 0.11);
      }
      if (p === 4 || p === 12) {
        _guitarra(BAJO[compas % BAJO.length], t, 0.14);
      }

    } else {
      // ── MODO ELECTRÓNICO: intensidad media a frenética ──
      const frenetico = I > 0.66;
      const fuerza    = 0.55 + 0.45 * I;

      const kick = frenetico ? KICK_INTENSO : KICK_MEDIO;
      const hat  = frenetico ? HAT_INTENSO  : HAT_MEDIO;

      if (kick[p])  _kick(t, fuerza);
      if (SNARE[p]) _snare(t, fuerza * 0.9);
      if (hat[p])   _hat(t, frenetico ? 0.9 : 0.55);

      // Bajo en corcheas (más denso cuanto más intenso)
      if (p % 2 === 0 || (frenetico && p % 2 === 1 && Math.random() < 0.35)) {
        const nota = BAJO[(compas * 2 + Math.floor(p / 4)) % BAJO.length];
        _bajo(nota, t, frenetico ? 0.13 : 0.2, I);
      }

      // Arpegio brillante solo en modo frenético
      if (frenetico && p % 2 === 1) {
        const escala = (compas % 2 === 0) ? MEDIO : ALTO;
        const nota = escala[(paso * 3) % escala.length];
        _arp(nota, t, 0.09, 0.075);
      }
    }

    paso++;
  }

  /** Duración de un paso en ms — el tempo sube con la intensidad */
  function _msPorPaso() {
    const bpm = 84 + 52 * intensidadActual;  // 84 bpm calmado → 136 bpm frenético
    return (60 / bpm) * 1000 / 4;            // semicorcheas
  }

  let msActual = 0;
  function _programar() {
    const ms = _msPorPaso();
    // Solo reiniciar el intervalo si el tempo cambió de forma apreciable
    if (Math.abs(ms - msActual) > 3) {
      clearInterval(intervalo);
      msActual = ms;
      intervalo = setInterval(_tick, ms);
    }
  }

  // ── API pública ─────────────────────────────────────────

  return {
    /** Debe llamarse tras una interacción del usuario (política del navegador) */
    activar() { _asegurarContexto(); },

    /** Nodo al que los módulos de efectos deben conectarse */
    nodoSFX() { _asegurarContexto(); return gainSFX; },

    iniciar() {
      _asegurarContexto();
      if (reproduciendo) return;
      reproduciendo = true;
      paso = 0;
      msActual = _msPorPaso();
      intervalo = setInterval(_tick, msActual);
      // Revisa el tempo periódicamente por si cambió la intensidad
      this._tempoWatch = setInterval(_programar, 900);
    },

    detener() {
      reproduciendo = false;
      clearInterval(intervalo);
      clearInterval(this._tempoWatch);
      intervalo = null;
    },

    estaReproduciendo() { return reproduciendo; },

    /**
     * Ajusta el ánimo de la música.
     * @param {number} v 0 = calma total (guitarras) · 1 = frenético total
     */
    setIntensidad(v) {
      intensidadObjetivo = Math.min(1, Math.max(0, v));
    },

    getIntensidad() { return intensidadObjetivo; },

    // ── Volúmenes ──
    setVolumenMusica(v) {
      volMusica = Math.min(1, Math.max(0, v));
      localStorage.setItem(CLAVE_VOL_MUSICA, String(volMusica));
      if (gainMusica) gainMusica.gain.value = volMusica;
    },
    setVolumenSFX(v) {
      volSFX = Math.min(1, Math.max(0, v));
      localStorage.setItem(CLAVE_VOL_SFX, String(volSFX));
      if (gainSFX) gainSFX.gain.value = volSFX;
    },
    getVolumenMusica() { return volMusica; },
    getVolumenSFX()    { return volSFX; },
  };
})();
