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
import { HeroFotos } from '@/components/membresias/HeroFotos';

interface Props {
  membresias: Membresia[];
  galeria: { id: string; src: string }[];
  textoIntro: string;
  /** Fotos que pasan en la card Cultural Manso al pasar el mouse. */
  fotosCultural: string[];
}

export function MembresiasClient({ membresias, galeria, textoIntro, fotosCultural }: Props) {
  // Una foto borrada del storage deja la fila viva en la DB: si no carga, se
  // saca del mosaico en vez de mostrar el ícono de imagen rota.
  const [fotosRotas, setFotosRotas] = useState<string[]>([]);
  const [openCoworkAbierto, setOpenCoworkAbierto] = useState(false);
  const { currency, rate } = useCurrency();

  // La sección es clara (crema con cards negras): el navbar la reconoce por la
  // ruta (ver `paginaClara` en Navbar). Las piezas siguen recibiendo `claro` por
  // si algún día vuelve el modo oscuro.
  const claro = true;

  // Un link compartido (?form=open-cowork) cae directo en el formulario.
  // Se lee de window en vez de useSearchParams para no forzar un Suspense en
  // una página que se prerenderiza estática.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(PARAM_FORM);
    if (param === FORM_OPEN_COWORK) setOpenCoworkAbierto(true);
  }, []);

  const galleryVisible = galeria.filter(img => !fotosRotas.includes(img.id));

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 ${claro ? 'bg-[#F6E9E4]' : 'bg-manso-black'}`}
      style={claro ? {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      } : undefined}
    >
      {/* Canvas de partículas — siempre montado, no se ve afectado por cambios de estado */}
      <ParticleBackground mode={claro ? 'light' : 'dark'} />

      <AdaptiveSectionLayout
        title="Membresías"
        subtitle="Acceso exclusivo_"
        customBg="bg-transparent"
        forceDark={!claro}
        forceLight={claro}
        // Párrafo de gancho: va pegado al título, en el mismo bloque que la foto.
        intro={
          textoIntro.trim() ? (
            <div className="max-w-2xl space-y-5">
              {textoIntro.trim().split(/\n\n+/).map((p, i) => (
                <p key={i} className={`${claro ? 'text-manso-black/80' : 'text-manso-cream/80'} text-lg sm:text-xl lg:text-2xl leading-snug text-pretty`}>
                  {p.replace(/\s(\S+)$/, ' $1')}
                </p>
              ))}
            </div>
          ) : undefined
        }
        aside={
          <HeroFotos
            fotos={galleryVisible}
            destino="el-espacio"
            claro={claro}
            onError={(id) => setFotosRotas((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          />
        }
      >
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
                    <span className={`text-[9px] font-black uppercase tracking-[0.6em] ${claro ? 'text-manso-black/60' : 'text-manso-cream/50'}`}>
                      {categoria}
                    </span>
                    <div className={`flex-1 h-px ${claro ? 'bg-manso-black/15' : 'bg-manso-cream/10'}`} />
                  </div>

                  {/* El toggle de moneda es parte de las cards: va bajo la primera línea */}
                  {ci === 0 && (
                    <div className="flex justify-start mb-8">
                      <CurrencyToggle claro={claro} />
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
                        claro={claro}
                        fotos={fotosCultural}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <CoworkModal
          open={openCoworkAbierto}
          onClose={() => setOpenCoworkAbierto(false)}
          origen="open_cowork"
        />

        {/* Galería mosaico del cowork — cierre visual */}
        {galleryVisible.length > 0 && (
          <div id="el-espacio" className="mt-20 scroll-mt-24">
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
