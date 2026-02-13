import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { supabase } from '@/lib/supabase';
import { User, Instagram, ExternalLink } from 'lucide-react';

export default async function ArtistasPage() {
  const { data: artistas } = await supabase
    .from('artistas')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return (
    <AdaptiveSectionLayout title="Artistas" subtitle="Comunidad Manso_">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
        {artistas?.map((artista) => (
          <div key={artista.id} className="aspect-[3/4] bg-zinc-800/50 rounded-[40px] overflow-hidden border border-zinc-700 group relative">
            <img 
              src={artista.imagen_url || '/manso.png'} 
              alt={artista.nombre}
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
            />
            
            {/* Overlay con información */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
              <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-1">
                {artista.nombre}
              </h3>
              {artista.bio && (
                <p className="text-white/80 text-xs font-medium line-clamp-2 mb-3">
                  {artista.bio}
                </p>
              )}
              
              {/* Redes sociales */}
              <div className="flex gap-2">
                {artista.redes_sociales?.instagram && (
                  <a 
                    href={`https://instagram.com/${artista.redes_sociales.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <Instagram size={14} className="text-white" />
                  </a>
                )}
                {artista.redes_sociales?.spotify && (
                  <a 
                    href={artista.redes_sociales.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink size={14} className="text-white" />
                  </a>
                )}
                {artista.redes_sociales?.soundcloud && (
                  <a 
                    href={artista.redes_sociales.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink size={14} className="text-white" />
                  </a>
                )}
              </div>
            </div>
            
            {/* Nombre visible siempre */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-black text-sm uppercase tracking-tighter drop-shadow-lg">
                {artista.nombre}
              </h3>
            </div>
          </div>
        ))}

        {(!artistas || artistas.length === 0) && (
          <div className="col-span-full text-center py-20">
            <User size={48} className="text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-400 mb-2">
              Próximamente
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              La comunidad de artistas de Manso Club está creciendo. Muy pronto podrás conocer a los talentos que forman parte de nuestro colectivo.
            </p>
          </div>
        )}
      </div>
    </AdaptiveSectionLayout>
  );
}
