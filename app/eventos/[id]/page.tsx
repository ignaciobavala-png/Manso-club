import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseAnon } from '@/lib/supabase';
import { og, descripcion } from '@/lib/seo';
import { fechaParaOg } from '@/lib/og-evento';
import { ShareButton } from '@/components/ShareButton';
import { WhatsAppShareButton } from '@/components/WhatsAppShareButton';
import { AgregarCalendario } from '@/components/AgregarCalendario';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

async function getEvento(id: string) {
  // Un id que no es uuid hace fallar el query: se trata como "no existe".
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createSupabaseAnon()
    .from('eventos')
    .select('id, titulo, descripcion, categoria, fecha, imagen_url, disponible, link_tickets')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const evento = await getEvento(id);
  if (!evento) return { title: 'Evento no encontrado | Manso Club' };

  const desc =
    descripcion(evento.descripcion) ??
    [evento.fecha && fechaParaOg(evento.fecha), 'Manso Club, Colegiales'].filter(Boolean).join(' · ');

  // La imagen la arma ./og: el flyer entero en 1200×630. Se declara también en
  // twitter porque Next no la hereda del og y el root layout pone la genérica.
  const imagen = { url: `/eventos/${evento.id}/og`, width: 1200, height: 630, alt: evento.titulo };
  return {
    title: `${evento.titulo} | Manso Club`,
    description: desc,
    openGraph: og({ title: `${evento.titulo} | Manso Club`, description: desc, images: [imagen] }),
    twitter: { card: 'summary_large_image', title: evento.titulo, description: desc, images: [imagen.url] },
  };
}

export default async function EventoPage({ params }: Props) {
  const { id } = await params;
  const evento = await getEvento(id);
  if (!evento) notFound();

  const ruta = `/eventos/${evento.id}`;

  return (
    <main className="min-h-screen bg-manso-black text-manso-cream">
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 pb-4">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-manso-cream/60 hover:text-manso-cream transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Agenda</span>
        </Link>
      </div>

      <section className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14 grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-10 md:gap-16 items-start">
        {evento.imagen_url && (
          <div className="relative aspect-[3/4] w-full max-w-sm mx-auto md:mx-0 overflow-hidden rounded-2xl bg-manso-blue/30">
            <Image
              src={evento.imagen_url}
              alt={evento.titulo}
              fill
              priority
              sizes="(min-width: 768px) 360px, 90vw"
              className="object-cover"
            />
          </div>
        )}

        <div className={evento.imagen_url ? '' : 'md:col-span-2'}>
          {evento.categoria && (
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              {evento.categoria}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-6">
            {evento.titulo}
          </h1>
          {evento.fecha && (
            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70 mb-6">
              {fechaParaOg(evento.fecha)}
            </p>
          )}
          {evento.descripcion && (
            <p className="text-sm md:text-base text-manso-cream/60 leading-relaxed font-light mb-8 whitespace-pre-line">
              {evento.descripcion}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {evento.disponible && evento.link_tickets ? (
              <a
                href={evento.link_tickets}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-manso-cream text-manso-black hover:bg-white px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Tickets →
              </a>
            ) : (
              !evento.disponible && (
                <span className="px-6 py-3.5 rounded-full border border-manso-cream/20 text-[10px] font-black uppercase tracking-widest text-manso-cream/50">
                  Sold out
                </span>
              )
            )}
            <WhatsAppShareButton title={`${evento.titulo} | Manso Club`} path={ruta} />
            <ShareButton title={`${evento.titulo} | Manso Club`} url={ruta} />
          </div>

          {evento.fecha && new Date(evento.fecha) > new Date() && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <AgregarCalendario
                evento={{ titulo: evento.titulo, descripcion: evento.descripcion, inicio: new Date(evento.fecha), path: ruta }}
                icsPath={`${ruta}/ics`}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
