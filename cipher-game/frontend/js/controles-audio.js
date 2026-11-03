/* ═══════════════════════════════════════════════════════════
   CONTROLES-AUDIO.JS — Panel flotante de volumen

   Se inyecta solo en cualquier página que lo cargue; no requiere
   marcado previo en el HTML. Controla los dos canales por separado
   (música y efectos) a través del módulo Musica.
   ═══════════════════════════════════════════════════════════ */

const ControlesAudio = (() => {

  const ESTILOS = `
    .audio-fab {
      position: fixed; right: 16px; bottom: 16px; z-index: 900;
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--tema-panel, rgba(13,27,46,0.94)); border: 1px solid var(--tema-borde, #1E2E45);
      color: var(--tema-texto, #EEE8D5); font-size: 1.1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .18s ease;
    }
    .audio-fab:hover { border-color: var(--tema-acento, #14BDAC); background: rgba(20,189,172,.14); }

    .audio-panel {
      position: fixed; right: 16px; bottom: 70px; z-index: 900;
      width: 230px; padding: 16px;
      background: var(--tema-panel, rgba(13,27,46,0.97)); border: 1px solid var(--tema-borde, #1E2E45);
      border-radius: 12px; color: var(--tema-texto, #EEE8D5);
      font-family: 'Inter', sans-serif;
      box-shadow: 0 8px 30px rgba(0,0,0,.45);
      display: flex; flex-direction: column; gap: 14px;
    }
    .audio-panel.oculto { display: none; }

    .audio-titulo {
      font-size: .7rem; font-weight: 700; letter-spacing: .09em;
      text-transform: uppercase; color: var(--tema-dorado, #C9A84C);
    }
    .audio-fila { display: flex; flex-direction: column; gap: 5px; }
    .audio-fila-top {
      display: flex; justify-content: space-between; align-items: center;
      font-size: .78rem; color: var(--tema-dim, #7A8FA6);
    }
    .audio-valor { color: var(--tema-acento, #14BDAC); font-weight: 600; }

    .audio-slider {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 4px; border-radius: 3px;
      background: var(--tema-borde, #1E2E45); outline: none; cursor: pointer;
    }
    .audio-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--tema-acento, #14BDAC); cursor: pointer; border: none;
    }
    .audio-slider::-moz-range-thumb {
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--tema-acento, #14BDAC); cursor: pointer; border: none;
    }

    .audio-btn-pantalla {
      width: 100%; padding: 9px; border-radius: 8px;
      background: transparent; border: 1px solid var(--tema-acento, #14BDAC);
      color: var(--tema-acento, #14BDAC); font-size: .8rem; font-weight: 600;
      cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background .15s ease;
    }
    .audio-btn-pantalla:hover { background: rgba(20,189,172,.12); }

    .audio-nota {
      font-size: .66rem; color: var(--tema-dim, #5A7A8A); line-height: 1.45;
      border-top: 1px solid var(--tema-borde, #162035); padding-top: 10px;
    }
  `;

  function _inyectarEstilos() {
    if (document.getElementById('estilos-audio')) return;
    const s = document.createElement('style');
    s.id = 'estilos-audio';
    s.textContent = ESTILOS;
    document.head.appendChild(s);
  }

  function _crearPanel() {
    const pct = v => Math.round(v * 100);

    const fab = document.createElement('button');
    fab.className = 'audio-fab';
    fab.id = 'audio-fab';
    fab.title = 'Ajustes de audio';
    fab.textContent = '🎚️';

    const panel = document.createElement('div');
    panel.className = 'audio-panel oculto';
    panel.id = 'audio-panel';
    panel.innerHTML = `
      <div class="audio-titulo">⚙️ Ajustes</div>

      <div class="audio-fila">
        <div class="audio-fila-top">
          <span>🎵 Música</span>
          <span class="audio-valor" id="audio-val-musica">${pct(Musica.getVolumenMusica())}%</span>
        </div>
        <input type="range" class="audio-slider" id="audio-slider-musica"
               min="0" max="100" value="${pct(Musica.getVolumenMusica())}"/>
      </div>

      <div class="audio-fila">
        <div class="audio-fila-top">
          <span>🔊 Efectos</span>
          <span class="audio-valor" id="audio-val-sfx">${pct(Musica.getVolumenSFX())}%</span>
        </div>
        <input type="range" class="audio-slider" id="audio-slider-sfx"
               min="0" max="100" value="${pct(Musica.getVolumenSFX())}"/>
      </div>

      <button class="audio-btn-pantalla" id="audio-btn-pantalla">
        ⛶ Pantalla completa
      </button>

      <p class="audio-nota">
        La música cambia según cómo te vaya: se vuelve intensa cuando aciertas
        y se calma cuando necesitas concentrarte.
      </p>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener('click', () => panel.classList.toggle('oculto'));

    // Cerrar al hacer clic fuera del panel
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== fab) panel.classList.add('oculto');
    });

    const sMus = document.getElementById('audio-slider-musica');
    const sSfx = document.getElementById('audio-slider-sfx');

    sMus.addEventListener('input', () => {
      const v = sMus.value / 100;
      Musica.setVolumenMusica(v);
      document.getElementById('audio-val-musica').textContent = sMus.value + '%';
    });

    const btnPantalla = document.getElementById('audio-btn-pantalla');
    btnPantalla.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      btnPantalla.textContent = document.fullscreenElement
        ? '⛶ Salir de pantalla completa'
        : '⛶ Pantalla completa';
    });

    sSfx.addEventListener('input', () => {
      const v = sSfx.value / 100;
      Musica.setVolumenSFX(v);
      document.getElementById('audio-val-sfx').textContent = sSfx.value + '%';
    });
  }

  return {
    /** Inyecta el panel en la página actual */
    montar() {
      if (typeof Musica === 'undefined') {
        console.warn('ControlesAudio requiere que musica.js esté cargado antes.');
        return;
      }
      _inyectarEstilos();
      if (!document.getElementById('audio-fab')) _crearPanel();
    },
  };
})();
