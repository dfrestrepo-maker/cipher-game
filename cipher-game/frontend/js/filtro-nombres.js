/* ═══════════════════════════════════════════════════════════
   FILTRO-NOMBRES.JS — Validación de nombres de usuario

   Módulo UMD: funciona como script global en el navegador y como
   módulo CommonJS en el backend, para que la lista de términos
   viva en un solo lugar.

   Estrategia anti-falsos-positivos: la detección se hace por
   PALABRAS COMPLETAS (con sufijos), no por subcadena. Así
   "cálculo" no se confunde con un insulto, "Maricarmen" y
   "Zorrilla" (apellido real) siguen siendo válidos, etc.
   ═══════════════════════════════════════════════════════════ */

(function (raiz, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else raiz.FiltroNombres = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ── Raíces ofensivas (se comparan como palabra completa + sufijos) ──
  const RAICES = [
    'puta', 'puto', 'putas', 'putos',
    'zorra', 'zorras', 'perra', 'perras',
    'marica', 'maricas', 'maricon', 'maricones',
    'gonorrea', 'malparido', 'malparida',
    'pendejo', 'pendeja', 'gilipollas', 'capullo',
    'cabron', 'cabrona', 'imbecil', 'estupido', 'estupida',
    'idiota', 'tarado', 'tarada', 'subnormal', 'retrasado',
    'mongolico', 'mongolica',
    'verga', 'vergas', 'polla', 'pollas', 'pija', 'pito',
    'coño', 'cono', 'chocha', 'panocha', 'concha',
    'culo', 'culos', 'culero', 'culera', 'culiao', 'culiado',
    'teta', 'tetas', 'pene', 'vagina',
    'follar', 'joder', 'jodete', 'chingar', 'chinga', 'chingada',
    'mierda', 'mierdas', 'cagada', 'cagon',
    'bastardo', 'bastarda', 'cornudo', 'cornuda',
    'prostituta', 'ramera', 'golfa', 'furcia', 'cerda',
    'huevon', 'hueon', 'weon', 'wea', 'boludo', 'pelotudo',
    'pinche', 'cojones', 'puñeta', 'puneta', 'carajo',
    'nazi', 'violador', 'violadora',
  ];

  // ── Secuencias inequívocas: sí se buscan como subcadena ──
  // Son combinaciones que no aparecen dentro de palabras legítimas.
  const SECUENCIAS = [
    'hijueputa', 'hijodeputa', 'hijaputa', 'hijadeputa',
    'chupamela', 'chupapollas', 'comemierda',
    'lameculos', 'zorrita', 'putita', 'putito',
    'hpta', 'hdp', 'ctm', 'qlo', 'vrga',
  ];

  // Sufijos permitidos tras una raíz (putita, zorras, pendejazo…)
  const SUFIJOS = [
    '', 's', 'es', 'a', 'o', 'as', 'os',
    'ita', 'ito', 'itas', 'itos',
    'ota', 'ote', 'otas', 'otes',
    'aza', 'azo', 'azas', 'azos',
    'on', 'ona', 'ones', 'onas',
    'illo', 'illa', 'illos', 'illas',
  ];

  /** Normaliza: minúsculas, sin acentos, sin leetspeak, sin repeticiones */
  function normalizar(texto) {
    return String(texto)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[0@]/g, 'o')
      .replace(/[1!¡|]/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/[5$]/g, 's')
      .replace(/7/g, 't')
      .replace(/(.)\1{2,}/g, '$1');  // puuuuta → puta
  }

  /** ¿El token es una raíz ofensiva con algún sufijo permitido? */
  function tokenEsOfensivo(token) {
    for (const raiz of RAICES) {
      if (!token.startsWith(raiz)) continue;
      const resto = token.slice(raiz.length);
      if (SUFIJOS.includes(resto)) return true;
    }
    return false;
  }

  /**
   * Valida un nombre de usuario.
   * @returns {{valido: boolean, error?: string}}
   */
  function validarNombre(nombre) {
    const original = String(nombre ?? '').trim();

    if (original.length < 3) {
      return { valido: false, error: 'El nombre debe tener al menos 3 caracteres' };
    }
    if (original.length > 60) {
      return { valido: false, error: 'El nombre no puede superar los 60 caracteres' };
    }
    // Solo letras (con acentos y ñ), espacios, guiones y apóstrofes
    if (!/^[\p{L}\s'’-]+$/u.test(original)) {
      return { valido: false, error: 'El nombre solo puede contener letras y espacios' };
    }

    const normalizado = normalizar(original);
    const compacto    = normalizado.replace(/[\s'’-]/g, '');

    // 1) Secuencias inequívocas en el texto compactado
    for (const seq of SECUENCIAS) {
      if (compacto.includes(seq)) {
        return { valido: false, error: 'Ese nombre contiene lenguaje no permitido' };
      }
    }

    // 2) Tokens completos (con sufijos)
    const tokens = normalizado.split(/[\s'’-]+/).filter(Boolean);
    for (const t of tokens) {
      if (tokenEsOfensivo(t)) {
        return { valido: false, error: 'Ese nombre contiene lenguaje no permitido' };
      }
    }

    return { valido: true };
  }

  return { validarNombre, normalizar };
});
