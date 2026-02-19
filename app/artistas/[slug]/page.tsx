import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAnon } from '@/lib/supabase';
import { ArrowLeft, Instagram, ExternalLink, Music } from 'lucide-react';
import { ArtistProfilePlayer } from './ArtistProfilePlayer';
import { ArtistTrackEmitter } from '@/components/ui/ArtistTrackEmitter';

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

export async function generateStaticParams() {
  const supabase = createSupabaseAnon();
  const { data: artistas } = await supabase
    .from('artistas')
    .select('slug')
    .eq('active', true)
    .order('nombre', { ascending: true });

  return (artistas || []).map((artista) => ({
    slug: artista.slug,
  }));
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

  const links = artista.social_links;
  const scUrl = artista.soundcloud_url || links?.soundcloud;
  const igHandle = links?.instagram;
  const spotifyUrl = links?.spotify;

  return (
    <main className="min-h-screen bg-manso-black">
      {/* Emite al reproductor global: si el artista tiene SC, lo swapea */}
      <ArtistTrackEmitter artistName={artista.nombre} soundcloudUrl={scUrl} />

      {/* Back button */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-28 pb-4">
        <Link
          href="/artistas"
          className="inline-flex items-center gap-2 text-manso-cream/60 hover:text-manso-cream transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Artistas</span>
        </Link>
      </div>

      {/* Profile header: photo + info side by side */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          {/* Info */}
          <div className="flex-1 min-w-0 space-y-6 md:pt-4 order-2 md:order-1">

            {artista.estilo && (
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra">
                {artista.estilo}
              </p>
            )}

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
              {artista.nombre}<span className="text-zinc-600">_</span>
            </h1>

            {artista.bio && (
              <p className="text-base md:text-lg text-manso-cream/70 leading-relaxed font-light max-w-2xl">
                {artista.bio}
              </p>
            )}

            {/* Social links */}
            {(igHandle || spotifyUrl || scUrl) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {igHandle && (
                  <a
                    href={`https://instagram.com/${igHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                  >
                    <Instagram size={16} />
                    <span className="text-xs font-medium">@{igHandle.replace('@', '')}</span>
                  </a>
                )}
                {spotifyUrl && (
                  <a
                    href={spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                  >
                    <ExternalLink size={16} />
                    <span className="text-xs font-medium">Spotify</span>
                  </a>
                )}
                {scUrl && (
                  <a
                    href={scUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                  >
                    <Music size={16} />
                    <span className="text-xs font-medium">SoundCloud</span>
                  </a>
                )}
              </div>
            )}

            {/* SoundCloud Player inline */}
            {scUrl && (
              <div className="pt-4 space-y-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-cream/40">
                  Escuchá
                </h2>
                <div className="bg-manso-cream/5 rounded-2xl p-5 border border-manso-cream/10">
                  <ArtistProfilePlayer
                    url={scUrl}
                    artistName={artista.nombre}
                    imageUrl={artista.imagen_url}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Profile photo */}
          <div className="w-full md:w-80 lg:w-96 flex-shrink-0 order-1 md:order-2">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-manso-cream/10 bg-zinc-900 relative">
              {artista.imagen_url ? (
                <Image
                  src={artista.imagen_url}
                  alt={artista.nombre}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/manso.png"
                    alt={artista.nombre}
                    width={160}
                    height={160}
                    className="opacity-20"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
