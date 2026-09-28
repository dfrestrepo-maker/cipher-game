/* ═══════════════════════════════════════════════════════
   API.JS — Cliente HTTP para el backend de CIPHER
   ═══════════════════════════════════════════════════════ */

const API = (() => {
  // Detecta entorno local tanto por 'localhost' como por '127.0.0.1'
  // (Live Server usa 127.0.0.1, por eso el chequeo anterior fallaba)
  const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const BASE = esLocal
    ? 'http://localhost:3000/api'  // backend Node corriendo aparte
    : '/api';                      // mismo dominio en Vercel

  async function _fetch(method, endpoint, body) {
    const token = localStorage.getItem('cipher_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    return data;
  }

  return {
    get:    (endpoint)        => _fetch('GET',   endpoint),
    post:   (endpoint, body)  => _fetch('POST',  endpoint, body),
    patch:  (endpoint, body)  => _fetch('PATCH', endpoint, body),
  };
})();
