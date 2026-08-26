import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase';
import { ArrowLeft, ExternalLink, Music, Lock, Users } from 'lucide-react';
import { ArtistProfilePlayer } from './ArtistProfilePlayer';
import { ArtistTrackManager } from '@/components/artistas/ArtistTrackManager';
import { GalleryGrid } from '@/components/Home/GalleryGrid';
import { ShareButton } from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

interface Artista {
  id: string;
  nombre: string;
  slug: string;
  bio?: string;
  estilo?: string;
  imagen_url?: string;
  soundcloud_url?: string;
  // Nuevo formato: array [{label, url}]
  // Formato viejo: {instagram, spotify, soundcloud}
  social_links?: { label: string; url: string }[] | { instagram?: string; spotify?: string; soundcloud?: string };
}

type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

interface ArtistTrack {
  id: string;
  titulo: string;
  soundcloud_url: string;
  orden: number;
}

interface ArtistaFoto {
  id: string;
  url: string;
  orden: number;
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

async function getArtistaFotos(artistaId: string): Promise<ArtistaFoto[]> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('artista_fotos')
    .select('id, url, orden')
    .eq('artista_id', artistaId)
    .order('orden', { ascending: true });

  return data || [];
}

async function getArtistTracks(artistaId: string, nivelesVisibles: string[]): Promise<ArtistTrack[]> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('artistas_tracks')
    .select('id, titulo, soundcloud_url, orden')
    .eq('artista_id', artistaId)
    .eq('activo', true)
    .in('visibilidad', nivelesVisibles)
    .order('orden', { ascending: true });

  return data || [];
}

async function getHiddenTracksExist(artistaId: string, nivelesVisibles: string[]): Promise<boolean> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('artistas_tracks')
    .select('visibilidad')
    .eq('artista_id', artistaId)
    .eq('activo', true);

  if (!data) return false;
  return data.some(t => !nivelesVisibles.includes(t.visibilidad));
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

  // Determinar nivel del usuario
  const supabaseServer = await createSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  let nivel: Nivel = 'publico';
  if (user) {
    const { data: profile } = await supabaseServer
      .from('user_profiles')
      .select('permisos_totales')
      .eq('id', user.id)
      .single();

    nivel = profile?.permisos_totales ? 'miembro' : 'registrado';
  }

  const nivelesVisibles = NIVELES_VISIBLES[nivel];

  const artista = await getArtista(slug);
  if (!artista) notFound();

  const [tracks, fotos, hayTracksOcultos] = await Promise.all([
    getArtistTracks(artista.id, nivelesVisibles),
    getArtistaFotos(artista.id),
    nivel !== 'miembro' ? getHiddenTracksExist(artista.id, nivelesVisibles) : Promise.resolve(false),
  ]);

  const scUrl = artista.soundcloud_url;

  // Normalizar social_links al nuevo formato array
  const rawLinks = artista.social_links;
  const publicLinks: { label: string; url: string }[] = Array.isArray(rawLinks)
    ? rawLinks
    : rawLinks
      ? [
          rawLinks.instagram ? { label: 'Instagram', url: `https://instagram.com/${(rawLinks.instagram as string).replace('@', '')}` } : null,
          rawLinks.spotify   ? { label: 'Spotify',   url: rawLinks.spotify as string } : null,
          rawLinks.soundcloud ? { label: 'SoundCloud', url: rawLinks.soundcloud as string } : null,
        ].filter(Boolean) as { label: string; url: string }[]
      : [];

  return (
    <main className="min-h-screen bg-manso-black">
      {/* Maneja el track del artista en el reproductor global */}
      <ArtistTrackManager artist={artista} />

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
              {artista.nombre}<span className="text-zinc-600 cursor-blink">_</span>
            </h1>

            {artista.bio && (
              <p className="text-base md:text-lg text-manso-cream/70 leading-relaxed font-light max-w-2xl">
                {artista.bio}
              </p>
            )}

            {/* Links del artista */}
            {(publicLinks.length > 0 || scUrl) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {publicLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                  >
                    <ExternalLink size={16} />
                    <span className="text-xs font-medium">{link.label}</span>
                  </a>
                ))}
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
                <ShareButton
                  title={`${artista.nombre} | Manso Club`}
                  url={`/artistas/${artista.slug}`}
                />
              </div>
            )}
            {publicLinks.length === 0 && !scUrl && (
              <div className="pt-2">
                <ShareButton
                  title={`${artista.nombre} | Manso Club`}
                  url={`/artistas/${artista.slug}`}
                />
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
                    tracks={tracks}
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

      {/* Gate — contenido oculto por nivel */}
      {hayTracksOcultos && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-8">
          <div className={`flex items-center gap-4 p-5 rounded-2xl border ${
            nivel === 'publico'
              ? 'bg-manso-blue/10 border-manso-blue/30'
              : 'bg-manso-terra/10 border-manso-terra/30'
          }`}>
            {nivel === 'publico' ? (
              <Users size={20} className="text-manso-blue shrink-0" />
            ) : (
              <Lock size={20} className="text-manso-terra shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-manso-cream">
                {nivel === 'publico'
                  ? `Hay más tracks de ${artista.nombre} para miembros registrados`
                  : `Hay tracks exclusivos de ${artista.nombre} para miembros`}
              </p>
              <p className="text-xs text-manso-cream/50 mt-0.5">
                {nivel === 'publico'
                  ? 'Creá tu cuenta gratis para acceder'
                  : 'Activá tu membresía para desbloquearlos'}
              </p>
            </div>
            <Link
              href={nivel === 'publico' ? '/login' : '/membresias'}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                nivel === 'publico'
                  ? 'bg-manso-blue text-manso-cream hover:bg-manso-blue/80'
                  : 'bg-manso-terra text-manso-cream hover:bg-manso-terra/80'
              }`}
            >
              {nivel === 'publico' ? 'Registrarse' : 'Ver membresías'}
            </Link>
          </div>
        </section>
      )}

      {/* Mosaico de obras — solo si hay fotos */}
      {fotos.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-cream/40 mb-6">
            Obras
          </h2>
          <GalleryGrid images={fotos.map(f => ({ id: f.id, src: f.url }))} />
        </section>
      )}

    </main>
  );
}
