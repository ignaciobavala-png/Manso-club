import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Archivo, IBM_Plex_Mono, Space_Mono } from 'next/font/google';
import '@/components/festival/festival.css';
import { leerConfig } from '@/lib/festival';
import { FestivalMenu } from '@/components/festival/FestivalMenu';

/**
 * Subreal (/blur) — sitio chico con identidad propia, sin el navbar de
 * Manso (ver `ChromeManso`). Estructura de basilarfestival.com: un menú arriba
 * y una página por sección.
 *
 * Archivo es variable también en ancho: la misma familia da el título ancho y
 * el menú angosto. Se carga solo acá, no en el sitio de Manso.
 */
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-fest-display',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-fest-mono',
});

/**
 * La del menú y el botón de tickets. Basilar usa Space Grotesk, pero el
 * equipo eligió Space Mono, su hermana monoespaciada (mismo estudio).
 */
const menu = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-fest-menu',
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await leerConfig();
  const nombre = config?.nombre ?? 'Festival';
  return {
    title: { default: nombre, template: `%s — ${nombre}` },
    description: config?.bajada ?? undefined,
    // Aunque se publique, no se indexa hasta que se decida lanzarlo en serio.
    robots: { index: false, follow: false },
  };
}

export default async function FestivalLayout({ children }: { children: React.ReactNode }) {
  // Sin publicar, el RLS no le devuelve la fila a nadie que no sea admin.
  const config = await leerConfig();
  if (!config) notFound();

  const estilo = {
    '--fest-fondo': config.color_fondo,
    '--fest-texto': config.color_texto,
    '--fest-acento': config.color_acento,
    '--fest-resalte': config.color_resalte,
  } as React.CSSProperties;

  const instagram = config.instagram?.replace(/^@/, '');

  return (
    <div
      data-fest-raiz
      style={estilo}
      className={`${display.variable} ${mono.variable} ${menu.variable} min-h-screen flex flex-col bg-[var(--fest-fondo)] text-[var(--fest-texto)] font-sans antialiased selection:bg-[var(--fest-acento)] selection:text-[var(--fest-fondo)]`}
    >
      <div aria-hidden className="fest-grano" />

      {!config.publicado && (
        <div className="bg-[var(--fest-acento)] text-[var(--fest-fondo)] text-center fest-mono text-[10px] uppercase tracking-[0.3em] py-1.5 px-4">
          Borrador — sin publicar, solo lo ven los admins
        </div>
      )}

      <FestivalMenu />

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="relative z-10 bg-[var(--fest-fondo)] border-t border-[var(--fest-texto)]/15 px-4 sm:px-7 pt-4 pb-20 sm:pb-4 flex flex-col items-start sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-8 gap-y-2.5 fest-mono text-[11px] uppercase tracking-[0.2em]">
        <nav className="flex flex-wrap gap-x-[22px] gap-y-1.5 text-[var(--fest-acento)]">
          {config.email && (
            <a href={`mailto:${config.email}`} className="fest-flecha hover:text-[var(--fest-texto)] transition-colors">
              Contacto
            </a>
          )}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fest-flecha hover:text-[var(--fest-texto)] transition-colors"
            >
              Instagram
            </a>
          )}
        </nav>
        {/* En el celular va a la izquierda: a la derecha lo tapa el TICKETS fijo. */}
        <a href="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <b className="font-sans font-black normal-case tracking-[-0.02em] text-[13px]">manso club</b>
        </a>
      </footer>
    </div>
  );
}
