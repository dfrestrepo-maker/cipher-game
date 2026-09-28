/* Instancia única del cliente Supabase para el backend */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // clave de servicio (solo backend)
);

module.exports = supabase;
