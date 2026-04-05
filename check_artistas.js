// Script para verificar artistas en la base de datos
const { createClient } = require('@supabase/supabase-js');

// Reemplaza con tus credenciales
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArtistas() {
  try {
    const { data: artistas, error } = await supabase
      .from('artistas')
      .select('id, nombre, slug, imagen_url, active')
      .eq('active', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error:', error);
      return;
    }

  } catch (err) {
    console.error('Error al verificar artistas:', err);
  }
}

checkArtistas();
