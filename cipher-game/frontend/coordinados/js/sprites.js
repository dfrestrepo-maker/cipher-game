/* ═══════════════════════════════════════════════════════════
   SPRITES.JS — Carga global de imágenes (script tradicional)
   ═══════════════════════════════════════════════════════════ */

const SPRITES_DATA = {
  listo:  false,
  sigma:  {},
  drone:  {},
  moneda: null,
  portal: null,
  caja:   null,
};

function _img(src, onLoad) {
  const i = new Image();
  i.onload  = onLoad;
  i.onerror = onLoad; // no bloquear si falla
  i.src = src;
  return i;
}

function cargarSprites(callback) {
  const base = 'sprites/';
  let pendientes = 0;
  const tick = () => { if (--pendientes === 0) { SPRITES_DATA.listo = true; callback(); } };

  const dirs4 = ['north','south','east','west'];

  // SIGMA walk 6 frames × 4 dirs
  dirs4.forEach(dir => {
    for (let i = 0; i < 6; i++) {
      pendientes++;
      SPRITES_DATA.sigma[`walk_${dir}_${i}`] = _img(`${base}sigma/walk_${dir}_${i}.png`, tick);
    }
  });
  // SIGMA idle 4 frames
  for (let i = 0; i < 4; i++) {
    pendientes++;
    SPRITES_DATA.sigma[`idle_${i}`] = _img(`${base}sigma/idle_${i}.png`, tick);
  }
  // DRONE walk 4 frames × 4 dirs
  dirs4.forEach(dir => {
    for (let i = 0; i < 4; i++) {
      pendientes++;
      SPRITES_DATA.drone[`walk_${dir}_${i}`] = _img(`${base}drone/walk_${dir}_${i}.png`, tick);
    }
  });

  pendientes += 3;
  SPRITES_DATA.moneda = _img(`${base}coin.png`,   tick);
  SPRITES_DATA.portal = _img(`${base}portal.png`, tick);
  SPRITES_DATA.caja   = _img(`${base}box.png`,    tick);
}

// ── Helpers de acceso ─────────────────────────────────────

function _anguloDirSprite(angulo) {
  // angulo: 0=este, 90=norte(cart), 180=oeste, 270=sur(cart)
  if (angulo === 0)   return 'east';
  if (angulo === 180) return 'west';
  if (angulo === 90)  return 'north';
  return 'south';
}

function obtenerFrameSigma(ultimaDireccion, moviendose) {
  const dir = ultimaDireccion || 'south';
  if (!moviendose) {
    const f = Math.floor(Date.now() / 200) % 4;
    return SPRITES_DATA.sigma[`idle_${f}`] ?? null;
  }
  const f = Math.floor(Date.now() / 120) % 6;
  return SPRITES_DATA.sigma[`walk_${dir}_${f}`] ?? null;
}

function obtenerFrameDrone(angulo) {
  const dir = _anguloDirSprite(angulo);
  const f   = Math.floor(Date.now() / 150) % 4;
  return SPRITES_DATA.drone[`walk_${dir}_${f}`] ?? null;
}

// ── Dibujar sprite centrado ───────────────────────────────

function dibujarSprite(ctx, img, cx, cy, tamano) {
  if (!img || !img.complete || img.naturalWidth === 0) return false;
  const h = Math.round(tamano);
  const w = Math.round(tamano);
  ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
  return true;
}
