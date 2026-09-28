// ── Guardia ───────────────────────────────────────────────────────────────────

class Guardia {
  constructor({ id, rutaPatrulla, velocidad, fov, rango }) {
    this.id             = id;
    this.rutaPatrulla   = rutaPatrulla;
    this.velocidad      = velocidad;
    this.fov            = fov;
    this.rango          = rango;
    this.x              = rutaPatrulla[0].x;
    this.y              = rutaPatrulla[0].y;
    this.indiceDestino  = 1;           // empieza moviéndose hacia el punto [1]
    this.ultimoMovimiento = 0;
    this.direccion      = this._direccionHacia(rutaPatrulla[1]);
  }

  // Calcula el ángulo en grados hacia un punto destino
  _direccionHacia(destino) {
    const dx = destino.x - this.x;
    const dy = destino.y - this.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 0 : 180;
    return dy > 0 ? 90 : 270;
  }

  // Actualiza posición en cada frame. Devuelve true si se movió.
  actualizar(timestamp, zonaSegura) {
    if (timestamp - this.ultimoMovimiento < this.velocidad) return false;
    this.ultimoMovimiento = timestamp;

    const destino = this.rutaPatrulla[this.indiceDestino];
    const dx = Math.sign(destino.x - this.x);
    const dy = Math.sign(destino.y - this.y);

    if (dx === 0 && dy === 0) {
      // Llegó al destino: invertir dirección de patrulla
      this.indiceDestino = 1 - this.indiceDestino;
      return false;
    }

    const nx = this.x + dx;
    const ny = this.y + dy;

    // Respetar zona segura: si la celda siguiente está dentro del radio, no avanzar
    const distSegura = Math.sqrt(
      Math.pow(nx - zonaSegura.x, 2) + Math.pow(ny - zonaSegura.y, 2)
    );
    if (distSegura <= zonaSegura.radio) {
      this.indiceDestino = 1 - this.indiceDestino;
      return false;
    }

    // Actualizar dirección y mover
    if      (dx > 0) this.direccion = 0;
    else if (dx < 0) this.direccion = 180;
    else if (dy > 0) this.direccion = 90;
    else             this.direccion = 270;

    this.x = nx;
    this.y = ny;
    return true;
  }

  // true si la celda (cx, cy) cae dentro del cono de visión
  esCeldaVisible(cx, cy) {
    const dx = cx - this.x;
    const dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0 || dist > this.rango) return false;

    const angulo = Math.atan2(dy, dx) * (180 / Math.PI);
    let diff = angulo - this.direccion;
    while (diff >  180) diff -= 360;
    while (diff < -180) diff += 360;

    return Math.abs(diff) <= this.fov / 2;
  }

  dibujar(ctx, cx, cy) {
    this.dibujarCono(ctx, cx, cy);
    this.dibujarCuerpo(ctx, cx, cy);
  }

  dibujarCono(ctx, cx, cy) {
    const radio    = this.rango * CONFIG.TAMANO_CELDA;
    const angCanvas = -(this.direccion * Math.PI / 180);
    const mitad    = (this.fov / 2) * (Math.PI / 180);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radio, angCanvas - mitad, angCanvas + mitad);
    ctx.closePath();
    ctx.fillStyle   = CONFIG.COLORES.coneRelleno;
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORES.coneBorde;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  dibujarCuerpo(ctx, cx, cy) {
    const tam = CONFIG.TAMANO_CELDA * 2.5;
    // Intentar dibujar sprite del drone
    const sprite = obtenerFrameDrone(this.direccion);
    if (sprite && dibujarSprite(ctx, sprite, cx, cy, tam)) return;

    // Fallback: círculo rojo original
    const r = CONFIG.RADIOS.guardia;
    ctx.save();
    ctx.shadowColor = 'rgba(239,83,80,0.6)';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle   = CONFIG.COLORES.guardia;
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORES.guardiaBorde;
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
    const angCanvas = -(this.direccion * Math.PI / 180);
    const px = cx + Math.cos(angCanvas) * (r + 5);
    const py = cy + Math.sin(angCanvas) * (r + 5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
}


// ── Jugador ───────────────────────────────────────────────────────────────────

class Jugador {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.ultimaDireccion = 'south'; // dirección para sprite
    this.moviendose      = false;
  }

  moverA(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    // Determinar dirección cardinal predominante
    if (Math.abs(dx) >= Math.abs(dy)) {
      this.ultimaDireccion = dx > 0 ? 'east' : 'west';
    } else {
      this.ultimaDireccion = dy > 0 ? 'north' : 'south';
    }
    this.moviendose = true;
    this.x = x;
    this.y = y;
    // Vuelve a idle tras 400ms
    clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => { this.moviendose = false; }, 400);
  }

  dibujar(ctx, cx, cy) {
    const tam    = CONFIG.TAMANO_CELDA * 2.5;
    const sprite = obtenerFrameSigma(this.ultimaDireccion, this.moviendose);

    if (sprite && dibujarSprite(ctx, sprite, cx, cy, tam)) return;

    // Fallback: círculo cyan original
    const r = CONFIG.RADIOS.jugador;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORES.jugadorGlow;
    ctx.fill();
    ctx.shadowColor = CONFIG.COLORES.jugador;
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle   = CONFIG.COLORES.jugador;
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORES.jugadorBorde;
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}


// ── Moneda ────────────────────────────────────────────────────────────────────

class Moneda {
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.recogida = false;
  }

  dibujar(ctx, cx, cy, timestamp) {
    if (this.recogida) return;
    const sprite = SPRITES_DATA.moneda;
    const tam    = CONFIG.TAMANO_CELDA * 0.92;
    // Efecto de pulso
    const pulso  = 0.88 + 0.12 * Math.sin(timestamp / 450);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.translate(cx, cy);
      ctx.scale(pulso, pulso);
      ctx.drawImage(sprite, -tam / 2, -tam / 2, tam, tam);
      ctx.restore();
      return;
    }
    // Fallback
    const r = CONFIG.RADIOS.moneda * pulso;
    ctx.save();
    ctx.shadowColor = CONFIG.COLORES.monedaGlow;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORES.moneda;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#5d4037';
    ctx.font = `bold ${Math.round(r)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 1);
  }
}
