'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { User, Instagram, ExternalLink, Play } from 'lucide-react';
import { ArtistModal } from '@/components/ui/ArtistModal';

interface Artist {
  id: string;
  nombre: string;
  slug: string;
  bio?: string;
  estilo?: string;
  imagen_url?: string;
  soundcloud_url?: string;
  tipo?: string;
  social_links?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
  // Legacy compat
  redes_sociales?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
}

interface ArtistasClientProps {
  artistas: Artist[];
}

const placeholderArtists: Artist[] = [
  { id: 'p1', nombre: 'Ana Hagen', slug: 'ana-hagen', estilo: 'Techno / House / EBM', social_links: { instagram: 'anahagen__' } },
  { id: 'p2', nombre: 'Porti', slug: 'porti', estilo: 'Progressive / Techno / Live Hybrid', social_links: { instagram: 'johnny.driver_' } },
  { id: 'p3', nombre: 'Lucas Romero', slug: 'lucas-romero', estilo: 'Melodic Techno', social_links: { instagram: 'lucasromero____' } },
  { id: 'p4', nombre: 'Lu Russo', slug: 'lu-russo', estilo: 'Minimal / House', social_links: { instagram: 'run_luli_run' } },
  { id: 'p5', nombre: 'Joaquinn', slug: 'joaquinn', estilo: 'Raw Techno / Industrial', social_links: { instagram: 'joaquinn_______' } },
  { id: 'p6', nombre: 'Manu Alvarez', slug: 'manu-alvarez', estilo: 'House / Tech-House' },
  { id: 'p7', nombre: 'Fabi Sarinelli', slug: 'fabi-sarinelli', estilo: 'Techno / House / Vinyl Select', social_links: { instagram: 'fabustin' } },
  { id: 'p8', nombre: 'Lau Loinaz', slug: 'lau-loinaz', estilo: 'Ecléctico / Electronic' },
];

function ArtistImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
        <Image
          src="/manso.png"
          alt={alt}
          width={200}
          height={200}
          className="opacity-30 object-contain"
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, 25vw"
      className="object-cover group-hover:scale-110 transition-all duration-500"
      onError={() => setError(true)}
    />
  );
}

export function ArtistasClient({ artistas }: ArtistasClientProps) {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const displayArtists = artistas && artistas.length > 0 ? artistas : placeholderArtists;

  // Separar artistas por tipo
  const djs = displayArtists.filter(artista => artista.tipo === 'DJ' || !artista.tipo);
  const artistasVisuales = displayArtists.filter(artista => artista.tipo === 'Artista Visual');

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArtist(null);
  };

  return (
    <>
      <AdaptiveSectionLayout title="Artistas" subtitle="Comunidad Manso_">
        {djs.length > 0 && (
          <>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-black mb-8 mt-16">
              DJS_
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
              {djs.map((artista) => (
                <Link
                  href={`/artistas/${artista.slug}`}
                  key={artista.id} 
                  className="aspect-[3/4] bg-zinc-800/50 rounded-[40px] overflow-hidden border border-zinc-700 group relative cursor-pointer block"
                >
                  <ArtistImage
                    src={artista.imagen_url}
                    alt={artista.nombre}
                  />
                  
                  {/* Overlay con información */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-1">
                      {artista.nombre}
                    </h3>
                    {artista.estilo && (
                      <p className="text-white/80 text-xs font-medium line-clamp-2 mb-3">
                        {artista.estilo}
                      </p>
                    )}
                    
                    {/* Redes sociales */}
                    <div className="flex gap-2">
                      {(artista.social_links?.instagram || artista.redes_sociales?.instagram) && (
                        <span
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                          <Instagram size={14} className="text-white" />
                        </span>
                      )}
                      {(artista.soundcloud_url || artista.social_links?.soundcloud || artista.redes_sociales?.soundcloud) && (
                        <span
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                          <ExternalLink size={14} className="text-white" />
                        </span>
                      )}
                    </div>

                    {/* Indicador de música */}
                    {(artista.soundcloud_url || artista.social_links?.soundcloud || artista.redes_sociales?.soundcloud) && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-manso-terra/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Nombre visible siempre, se oculta en hover */}
                  <div className="absolute bottom-4 left-4 right-4 group-hover:opacity-0 transition-opacity duration-300">
                    <h3 className="text-white font-black text-sm uppercase tracking-tighter drop-shadow-lg">
                      {artista.nombre}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {artistasVisuales.length > 0 && (
          <>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-black mb-8 mt-16">
              Artistas Visuales_
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
              {artistasVisuales.map((artista) => (
                <Link
                  href={`/artistas/${artista.slug}`}
                  key={artista.id} 
                  className="aspect-[3/4] bg-zinc-800/50 rounded-[40px] overflow-hidden border border-zinc-700 group relative cursor-pointer block"
                >
                  <ArtistImage
                    src={artista.imagen_url}
                    alt={artista.nombre}
                  />
                  
                  {/* Overlay con información */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-1">
                      {artista.nombre}
                    </h3>
                    {artista.estilo && (
                      <p className="text-white/80 text-xs font-medium line-clamp-2 mb-3">
                        {artista.estilo}
                      </p>
                    )}
                    
                    {/* Redes sociales */}
                    <div className="flex gap-2">
                      {(artista.social_links?.instagram || artista.redes_sociales?.instagram) && (
                        <span
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                          <Instagram size={14} className="text-white" />
                        </span>
                      )}
                      {(artista.soundcloud_url || artista.social_links?.soundcloud || artista.redes_sociales?.soundcloud) && (
                        <span
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                          <ExternalLink size={14} className="text-white" />
                        </span>
                      )}
                    </div>

                    {/* Indicador de música */}
                    {(artista.soundcloud_url || artista.social_links?.soundcloud || artista.redes_sociales?.soundcloud) && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-manso-terra/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Nombre visible siempre, se oculta en hover */}
                  <div className="absolute bottom-4 left-4 right-4 group-hover:opacity-0 transition-opacity duration-300">
                    <h3 className="text-white font-black text-sm uppercase tracking-tighter drop-shadow-lg">
                      {artista.nombre}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

          {displayArtists.length === 0 && (
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
      </AdaptiveSectionLayout>

      {/* Modal del artista */}
      <ArtistModal 
        artist={selectedArtist}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
