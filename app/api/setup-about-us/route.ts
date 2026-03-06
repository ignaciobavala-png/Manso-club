import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseAnon();

    // Verificar si la tabla ya existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'about_us');

    if (tablesError) {
      console.error('Error checking table existence:', tablesError);
      return NextResponse.json({ error: 'Error checking table existence' }, { status: 500 });
    }

    // Si la tabla ya existe, retornar success
    if (tables && tables.length > 0) {
      return NextResponse.json({ message: 'Table already exists' });
    }

    // Crear la tabla usando RPC (necesitarías crear esta función en Supabase)
    // Por ahora, vamos a usar el SQL directo
    const createTableSQL = `
      CREATE TABLE about_us (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subtitle TEXT DEFAULT 'QUIÉNES SOMOS_',
        description TEXT DEFAULT '',
        main_photo_url TEXT,
        gallery_photos TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Insertar registro inicial con contenido actual del sitio
      INSERT INTO about_us (subtitle, description) 
      VALUES (
        'QUIÉNES SOMOS_', 
        'Manso Club es un club creativo para personas curiosas: emprendedores, artistas, entusiastas y amantes de la cultura que buscan comunidad e inspiración.

Manso nace de la idea de que los mejores proyectos surgen cuando se mezclan disciplinas, generaciones e ideas en un mismo lugar. Acá se puede trabajar, escuchar música, participar de talleres, descubrir artistas y compartir momentos con personas afines. Manso es un punto de encuentro ante una sociedad aislada y una plataforma que exporta talento local.'
      );

      -- Crear trigger para actualizar updated_at automáticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_about_us_updated_at 
          BEFORE UPDATE ON about_us 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Ejecutar el SQL usando el cliente de Supabase
    // Nota: Esto podría no funcionar directamente, podrías necesitar usar el SQL Editor de Supabase
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (createError) {
      console.error('Error creating table:', createError);
      return NextResponse.json({ 
        error: 'Error creating table', 
        details: createError.message,
        sql: createTableSQL 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Table created successfully' });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
