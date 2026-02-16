import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAnon } from '@/lib/supabase-anon';
import { ArrowLeft, Instagram, ExternalLink, Music } from 'lucide-react';
import { ArtistProfilePlayer } from './ArtistProfilePlayer';

interface Artista {
  id: string;
  nombre: string;
  slug: string;
  bio?: string;
  estilo?: string;
  imagen_url?: string;
  soundcloud_url?: string;
  social_links?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArtista(slug: string): Promise<Artista | null> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('artistas')
    .select('id, nombre, slug, bio, estilo, imagen_url, soundcloud_url, social_links')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artista = await getArtista(slug);

  if (!artista) {
    return { title: 'Artista no encontrado | Manso Club' };
  }

  return {
    title: `${artista.nombre} | Manso Club`,
    description: artista.bio || `${artista.nombre} — ${artista.estilo || 'DJ'} en Manso Club.`,
    openGraph: {
      title: `${artista.nombre} | Manso Club`,
      description: artista.bio || `${artista.nombre} — ${artista.estilo || 'DJ'} en Manso Club.`,
      type: 'profile',
      ...(artista.imagen_url && { images: [{ url: artista.imagen_url }] }),
    },
  };
}

export default async function ArtistaPage({ params }: Props) {
  const { slug } = await params;
  const artista = await getArtista(slug);

  if (!artista) notFound();

  const scUrl = artista.soundcloud_url || artista.social_links?.soundcloud;
  const igHandle = artista.social_links?.instagram;
  const spotifyUrl = artista.social_links?.spotify;

  return (
    <main className="min-h-screen bg-manso-black">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {artista.imagen_url ? (
          <Image
            src={artista.imagen_url}
            alt={artista.nombre}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <Image
              src="/manso.png"
              alt={artista.nombre}
              width={300}
              height={300}
              className="opacity-20"
            />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-manso-black via-manso-black/50 to-transparent" />

        {/* Back button */}
        <Link
          href="/artistas"
          className="absolute top-28 left-6 md:left-12 z-10 flex items-center gap-2 text-manso-cream/80 hover:text-manso-cream transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Artistas</span>
        </Link>

        {/* Name + style overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-[1400px] mx-auto">
            {artista.estilo && (
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
                {artista.estilo}
              </p>
            )}
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
              {artista.nombre}<span className="text-zinc-600">_</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20 space-y-16">
        {/* Bio */}
        {artista.bio && (
          <div className="max-w-3xl">
            <p className="text-lg md:text-xl text-manso-cream/80 leading-relaxed font-light">
              {artista.bio}
            </p>
          </div>
        )}

        {/* Social links */}
        {(igHandle || spotifyUrl || scUrl) && (
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-cream/40">
              Conecta
            </h2>
            <div className="flex flex-wrap gap-4">
              {igHandle && (
                <a
                  href={`https://instagram.com/${igHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                >
                  <Instagram size={18} />
                  <span className="text-sm font-medium">@{igHandle.replace('@', '')}</span>
                </a>
              )}
              {spotifyUrl && (
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                >
                  <ExternalLink size={18} />
                  <span className="text-sm font-medium">Spotify</span>
                </a>
              )}
              {scUrl && (
                <a
                  href={scUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                >
                  <Music size={18} />
                  <span className="text-sm font-medium">SoundCloud</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* SoundCloud Player */}
        {scUrl && (
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-cream/40">
              Escuchá
            </h2>
            <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10">
              <ArtistProfilePlayer
                url={scUrl}
                artistName={artista.nombre}
                imageUrl={artista.imagen_url}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
