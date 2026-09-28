// Síntesis de sonidos con Web Audio API — sin archivos externos

const Audio = {
  ctx: null,

  activar() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn('Web Audio no disponible');
    }
  },

  _tono(frec, tipo, duracion, volumen, frecFin) {
    if (!this.ctx) return;
    try {
      const t    = this.ctx.currentTime;
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = tipo;
      osc.frequency.setValueAtTime(frec, t);
      if (frecFin) osc.frequency.exponentialRampToValueAtTime(frecFin, t + duracion);

      gain.gain.setValueAtTime(volumen, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duracion);

      osc.start(t);
      osc.stop(t + duracion + 0.05);
    } catch(e) {}
  },

  // Paso del jugador: clic suave
  paso() {
    this._tono(180, 'sine', 0.04, 0.07, 130);
  },

  // Moneda recogida: dos notas rápidas ascendentes
  moneda() {
    this._tono(880,  'sine', 0.08, 0.22);
    setTimeout(() => this._tono(1320, 'sine', 0.12, 0.18), 75);
  },

  // Obstáculo: golpe sordo
  obstaculo() {
    this._tono(95, 'sawtooth', 0.10, 0.18, 60);
  },

  // Detectado: dos pitidos de alarma descendentes
  detectado() {
    this._tono(330, 'sawtooth', 0.22, 0.38, 165);
    setTimeout(() => this._tono(280, 'sawtooth', 0.22, 0.38, 140), 260);
  },

  // Victoria: arpegio ascendente de cuatro notas
  victoria() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this._tono(f, 'sine', 0.22, 0.28), i * 85)
    );
  },

  // Salida bloqueada (sin monedas): tono de error suave
  salidaBloqueada() {
    this._tono(220, 'triangle', 0.15, 0.2, 180);
  },
};
