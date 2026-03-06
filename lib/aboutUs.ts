import { supabase } from './supabase';

export interface AboutUsContent {
  id: string;
  subtitle: string;
  description: string;
  main_photo_url: string | null;
  gallery_photos: string[];
  created_at: string;
  updated_at: string;
}

export async function getAboutUs(): Promise<AboutUsContent> {
  try {
    const { data, error } = await supabase
      .from('about_us')
      .select('*')
      .single();

    // Si la tabla no existe, retornar datos por defecto
    if (error && error.code === 'PGRST116') {
      console.warn('Tabla about_us no existe, usando datos por defecto');
      return {
        id: 'default',
        subtitle: 'QUIÉNES SOMOS_',
        description: 'Manso Club es un club creativo para personas curiosas: emprendedores, artistas, entusiastas y amantes de la cultura que buscan comunidad e inspiración.\n\nManso nace de la idea de que los mejores proyectos surgen cuando se mezclan disciplinas, generaciones e ideas en un mismo lugar. Acá se puede trabajar, escuchar música, participar de talleres, descubrir artistas y compartir momentos con personas afines. Manso es un punto de encuentro ante una sociedad aislada y una plataforma que exporta talento local.',
        main_photo_url: null,
        gallery_photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    if (error) {
      console.error('Error fetching about us content:', error);
      throw new Error('Error al cargar el contenido de About Us');
    }

    if (!data) {
      // Si no existe registro, crear uno por defecto
      const defaultData = {
        subtitle: 'QUIÉNES SOMOS_',
        description: 'Manso Club es un club creativo para personas curiosas: emprendedores, artistas, entusiastas y amantes de la cultura que buscan comunidad e inspiración.\n\nManso nace de la idea de que los mejores proyectos surgen cuando se mezclan disciplinas, generaciones e ideas en un mismo lugar. Acá se puede trabajar, escuchar música, participar de talleres, descubrir artistas y compartir momentos con personas afines. Manso es un punto de encuentro ante una sociedad aislada y una plataforma que exporta talento local.',
        main_photo_url: null,
        gallery_photos: []
      };

      const { data: newData, error: insertError } = await supabase
        .from('about_us')
        .insert(defaultData)
        .select()
        .single();

      if (insertError) {
        throw new Error('Error al crear contenido por defecto de About Us');
      }

      return newData as AboutUsContent;
    }

    return data as AboutUsContent;
  } catch (error) {
    console.error('Error in getAboutUs:', error);
    
    // Fallback final si todo falla
    return {
      id: 'fallback',
      subtitle: 'QUIÉNES SOMOS_',
      description: 'Manso Club es un club creativo para personas curiosas: emprendedores, artistas, entusiastas y amantes de la cultura que buscan comunidad e inspiración.\n\nManso nace de la idea de que los mejores proyectos surgen cuando se mezclan disciplinas, generaciones e ideas en un mismo lugar. Acá se puede trabajar, escuchar música, participar de talleres, descubrir artistas y compartir momentos con personas afines. Manso es un punto de encuentro ante una sociedad aislada y una plataforma que exporta talento local.',
      main_photo_url: null,
      gallery_photos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function updateAboutUs(data: Partial<AboutUsContent>): Promise<void> {
  try {
    const { error } = await supabase
      .from('about_us')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);

    // Si la tabla no existe, mostrar error amigable
    if (error && error.code === 'PGRST116') {
      throw new Error('La tabla about_us no existe. Por favor, ejecuta la migration primero.');
    }

    if (error) {
      console.error('Error updating about us content:', error);
      throw new Error('Error al actualizar el contenido de About Us');
    }
  } catch (error) {
    console.error('Error in updateAboutUs:', error);
    throw error;
  }
}

export async function uploadAboutUsPhoto(file: File, type: 'main' | 'gallery'): Promise<string> {
  try {
    // Validar archivo
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('El archivo no puede superar los 5MB');
    }

    // Validar formato
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten archivos JPG, PNG o WebP');
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const folderPath = type === 'main' ? 'about-main' : 'about-gallery';
    const filePath = `${folderPath}/${fileName}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('team-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Error al subir la foto');
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('team-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadAboutUsPhoto:', error);
    throw error;
  }
}

export async function deleteAboutUsPhoto(url: string, type: 'main' | 'gallery'): Promise<void> {
  try {
    if (!url) {
      throw new Error('URL de la foto no válida');
    }

    // Extraer el path de la URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = type === 'main' ? 'about-main' : 'about-gallery';
    const filePath = `${folderPath}/${fileName}`;

    // Eliminar archivo del storage
    const { error } = await supabase.storage
      .from('team-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Error al eliminar la foto');
    }
  } catch (error) {
    console.error('Error in deleteAboutUsPhoto:', error);
    throw error;
  }
}

// Función para revalidar la página after cambios
export async function revalidateAboutUsPage(): Promise<void> {
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/about'
      })
    });
  } catch (error) {
    console.error('Error revalidating about page:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}
