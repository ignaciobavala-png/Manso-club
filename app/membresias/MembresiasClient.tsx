'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { Membresia } from '@/lib/types/membresia';
import { Crown } from 'lucide-react';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { useCurrency } from '@/store/useCurrency';
import { MembresiaCard } from '@/components/ui/MembresiaCard';
import { gridMembresias } from '@/lib/membresia-grid';
import { CoworkModal, PARAM_FORM, FORM_OPEN_COWORK } from '@/components/ui/CoworkModal';

export interface ProximaFechaCowork {
  fecha: string;
  horario: string | null;
  restantes: number;
}

interface Props {
  membresias: Membresia[];
  galeria: { id: string; src: string }[];
  textoIntro: string;
  proximaFecha: ProximaFechaCowork | null;
}

export function MembresiasClient({ membresias, galeria, textoIntro, proximaFecha }: Props) {
  // Una foto borrada del storage deja la fila viva en la DB: si no carga, se
  // saca del mosaico en vez de mostrar el ícono de imagen rota.
  const [fotosRotas, setFotosRotas] = useState<string[]>([]);
  const [openCoworkAbierto, setOpenCoworkAbierto] = useState(false);
  const { currency, rate } = useCurrency();

  // Un link compartido (?form=open-cowork) cae directo en el formulario.
  // Se lee de window en vez de useSearchParams para no forzar un Suspense en
  // una página que se prerenderiza estática.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(PARAM_FORM);
    if (param === FORM_OPEN_COWORK) setOpenCoworkAbierto(true);
  }, []);

  const galleryVisible = galeria.filter(img => !fotosRotas.includes(img.id));

  return (
    <div className="relative min-h-screen bg-manso-black">
      {/* Canvas de partículas — siempre montado, no se ve afectado por cambios de estado */}
      <ParticleBackground />

      <AdaptiveSectionLayout
        title="Membresías"
        subtitle="Acceso exclusivo_"
        customBg="bg-transparent"
      >
        {/* Párrafo de gancho */}
        {textoIntro.trim() && (
          <div className="mb-16 max-w-2xl space-y-4">
            {textoIntro.trim().split(/\n\n+/).map((p, i) => (
              <p key={i} className="text-manso-cream/80 text-base sm:text-lg leading-relaxed text-pretty">
                {p.replace(/\s(\S+)$/, ' $1')}
              </p>
            ))}
          </div>
        )}

        {membresias.length === 0 ? (
          <div className="text-center py-20">
            <Crown size={48} className="text-manso-cream/20 mx-auto mb-4" />
            <p className="text-sm text-manso-cream/40">Próximamente disponibles</p>
          </div>
        ) : (() => {
          // Agrupar por categoría manteniendo el orden: Cowork primero, resto después
          const ORDEN_CATEGORIAS = ['Cowork', 'Socios & Residentes'];
          const grupos = membresias.reduce<Record<string, typeof membresias>>((acc, m) => {
            const cat = m.categoria || 'Cowork';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(m);
            return acc;
          }, {});
          const categoriasOrdenadas = [
            ...ORDEN_CATEGORIAS.filter(c => grupos[c]),
            ...Object.keys(grupos).filter(c => !ORDEN_CATEGORIAS.includes(c)),
          ];

          return (
            <div className="py-10 space-y-20">
              {categoriasOrdenadas.map((categoria, ci) => (
                <div key={categoria}>
                  {/* Encabezado de categoría */}
                  <div className={`flex items-center gap-4 ${ci === 0 ? 'mb-6' : 'mb-10'}`}>
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-cream/50">
                      {categoria}
                    </span>
                    <div className="flex-1 h-px bg-manso-cream/10" />
                  </div>

                  {/* El toggle de moneda es parte de las cards: va bajo la primera línea */}
                  {ci === 0 && (
                    <div className="flex justify-start mb-8">
                      <CurrencyToggle />
                    </div>
                  )}

                  <div className={`mx-auto grid gap-3 sm:gap-5 items-stretch ${gridMembresias(grupos[categoria].length)}`}>
                    {grupos[categoria].map((membresia, i) => (
                      <MembresiaCard
                        key={membresia.id}
                        membresia={membresia}
                        currency={currency}
                        rate={rate}
                        posicion={i}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Open Cowork — va entre las cards y las fotos, solo en esta sección */}
        <div className="mt-4">
          <button
            onClick={() => setOpenCoworkAbierto(true)}
            className="group w-full flex items-center justify-between gap-5 border border-manso-cream/15 rounded-3xl p-5 md:p-7 hover:border-manso-terra/50 hover:bg-manso-cream/5 transition-all duration-500 text-left"
          >
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
                Open Cowork
              </h2>
              <p className="text-sm text-manso-cream/40 font-light mt-2 max-w-md leading-relaxed">
                Abrimos el cowork para que vengan a conocer a otras personas de la comunidad,
                compartir ideas, proyectos, charlas.
              </p>
              {proximaFecha && <CuposProximaFecha fecha={proximaFecha} />}
            </div>
            <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full border border-manso-cream/20 text-manso-cream group-hover:bg-manso-cream group-hover:text-manso-black group-hover:border-manso-cream transition-all duration-500 text-lg">
              →
            </span>
          </button>
        </div>

        <CoworkModal
          open={openCoworkAbierto}
          onClose={() => setOpenCoworkAbierto(false)}
          origen="open_cowork"
        />

        {/* Galería mosaico del cowork — cierre visual */}
        {galleryVisible.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra">
                El espacio
              </span>
              <div className="flex-1 h-px bg-manso-cream/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {galleryVisible.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                >
                  <Image
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    src={image.src}
                    alt="Manso Club Cowork"
                    className="object-cover"
                    onError={() => setFotosRotas(prev => prev.includes(image.id) ? prev : [...prev, image.id])}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        )}
      </AdaptiveSectionLayout>
    </div>
  );
}

/** Próximo encuentro y cuántos lugares quedan: es lo que decide si alguien se anota. */
function CuposProximaFecha({ fecha }: { fecha: ProximaFechaCowork }) {
  const d = new Date(`${fecha.fecha}T00:00:00`);
  const dia = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = fecha.horario ? ` · ${fecha.horario.slice(0, 5)} hs` : '';
  const lleno = fecha.restantes <= 0;
  const quedan = fecha.restantes === 1 ? 'Queda 1 lugar' : `Quedan ${fecha.restantes} lugares`;

  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-[0.15em] text-manso-cream/60">
      <span>Próximo: {dia}{hora}</span>
      <span className={lleno ? 'text-manso-cream/40' : 'text-manso-terra'}>
        {lleno ? 'Completo' : quedan}
      </span>
    </p>
  );
}
