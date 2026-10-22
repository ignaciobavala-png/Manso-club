import type { Metadata } from 'next';
import Link from 'next/link';
import { og } from '@/lib/seo';
import { Aparece } from '@/components/recorrido/Aparece';
import { TextoPalabras } from '@/components/recorrido/TextoPalabras';
import { RecorridoViaje } from '@/components/recorrido/RecorridoViaje';

const titulo = 'Recorrido | Manso Club';
const descripcion =
  'Un paseo con scroll por Manso Club, de la puerta de calle al balcón: el salón, la cabina, la escalera y el cowork.';

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  openGraph: og({ title: titulo, description: descripcion }),
};

export default function RecorridoPage() {
  return (
    <main className="bg-manso-black text-manso-cream">
      {/* Sin JS no corre ningún observador: que nada quede en blanco */}
      <noscript>
        <style>{`[data-reveal],[data-item] article{opacity:1!important;transform:none!important;filter:none!important}`}</style>
      </noscript>

      {/* Portada */}
      <header className="flex min-h-svh flex-col justify-center px-4 pb-24 pt-24 md:px-[8vw]">
        <Aparece>
          <p className="text-sm text-manso-cream/60">Colegiales, Buenos Aires</p>
          <h1 className="mt-4 max-w-[680px] text-5xl font-bold md:text-8xl [text-wrap:balance]">
            Recorré Manso desde la puerta
          </h1>
        </Aparece>
        <Aparece retraso={150}>
          <p className="mt-6 max-w-[680px] text-lg text-manso-cream/80 md:text-xl [text-wrap:pretty]">
            Catorce fotos, un solo camino. Scrolleá y entrá: del hall al salón, de la escalera al cowork y al balcón.
          </p>
        </Aparece>
        <Aparece retraso={300}>
          <p className="mt-16 text-sm text-manso-cream/60">Seguí bajando</p>
        </Aparece>
      </header>

      {/* Frase que se enciende palabra por palabra */}
      <section className="px-4 py-24 md:px-[8vw] md:py-48">
        <TextoPalabras
          texto="Una casa con escalera de madera, un piano y una cabina. Se trabaja en una mesa larga, se escucha música y se sale al balcón a mirar la esquina."
          className="max-w-[900px] text-4xl font-bold md:text-6xl [text-wrap:balance]"
        />
      </section>

      <RecorridoViaje />

      {/* Cierre */}
      <section className="px-4 py-24 md:px-[8vw] md:py-48">
        <Aparece>
          <h2 className="max-w-[680px] text-4xl font-bold md:text-6xl [text-wrap:balance]">
            Ahora falta que vengas
          </h2>
          <p className="mt-6 max-w-[680px] text-lg text-manso-cream/80 [text-wrap:pretty]">
            Mirá los planes del cowork y sumate a la mesa larga.
          </p>
          <Link
            href="/membresias"
            className="mt-8 inline-flex items-center rounded-full bg-manso-cream px-6 py-3 text-base font-semibold text-manso-black transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-manso-cream"
          >
            Ver membresías
          </Link>
        </Aparece>
      </section>
    </main>
  );
}
