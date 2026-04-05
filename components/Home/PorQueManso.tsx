import { ArrowRight, Users, MapPin, Sparkles, Music } from 'lucide-react';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/siteConfig';
import { ParticleBackground } from './ParticleBackground';

export const PorQueManso = async () => {
  const config = await getSiteConfig();

  const getValue = (key: string, defaultValue: string) => {
    const item = config[key];
    if (!item) return defaultValue;
    if (typeof item === 'string') return item;
    return item.visible ? item.value : defaultValue;
  };

  const isVisible = (key: string) => {
    const item = config[key];
    if (!item) return false;
    if (typeof item === 'string') return true;
    return item.visible;
  };

  const getIcon = (index: number) => {
    const icons = [Users, MapPin, Sparkles, Music];
    return icons[index % icons.length];
  };

  const benefits = [
    {
      title: getValue('beneficio1_titulo', 'Título del Beneficio 1'),
      description: getValue('beneficio1_descripcion', 'Descripción del primer beneficio que ofrece Manso Club...'),
      visible: isVisible('beneficio1_titulo') || isVisible('beneficio1_descripcion')
    },
    {
      title: getValue('beneficio2_titulo', 'Título del Beneficio 2'),
      description: getValue('beneficio2_descripcion', 'Descripción del segundo beneficio que ofrece Manso Club...'),
      visible: isVisible('beneficio2_titulo') || isVisible('beneficio2_descripcion')
    },
    {
      title: getValue('beneficio3_titulo', 'Título del Beneficio 3'),
      description: getValue('beneficio3_descripcion', 'Descripción del tercer beneficio que ofrece Manso Club...'),
      visible: isVisible('beneficio3_titulo') || isVisible('beneficio3_descripcion')
    },
    {
      title: getValue('beneficio4_titulo', 'Título del Beneficio 4'),
      description: getValue('beneficio4_descripcion', 'Descripción del cuarto beneficio que ofrece Manso Club...'),
      visible: isVisible('beneficio4_titulo') || isVisible('beneficio4_descripcion')
    }
  ].filter(benefit => benefit.visible);

  const getGridClass = () => {
    const count = benefits.length;
    if (count === 0) return 'hidden';
    if (count === 1) return 'grid grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  const getCardHeight = () => {
    const count = benefits.length;
    if (count <= 2) return 'h-64 md:h-72';
    return 'h-72 md:h-80';
  };

  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-8 md:px-20 bg-manso-black overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            <span className="block text-white">NUESTRO ADN</span>
            <span className="block italic text-manso-olive mt-2">MUCHO MÁS QUE UN CLUB</span>
          </h2>
        </div>

        {/* Cards */}
        <div className={`${getGridClass()} gap-4 sm:gap-6 mb-16 sm:mb-20`}>
          {benefits.map((benefit, index) => {
            const IconComponent = getIcon(index);
            const num = String(index + 1).padStart(2, '0');
            return (
              <div key={index} className="group relative">
                <div className={`${getCardHeight()} bg-white/10 rounded-3xl px-8 pt-14 pb-8 border border-white/20 hover:bg-white/15 hover:border-white/35 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center`}>

                  {/* Número decorativo de fondo */}
                  <span className="absolute -bottom-4 -right-2 text-[7rem] font-black text-white/5 leading-none select-none pointer-events-none">
                    {num}
                  </span>

                  {/* Ícono — top right */}
                  <div className="absolute top-5 right-5 w-10 h-10 bg-manso-olive/70 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:bg-manso-olive">
                    <IconComponent size={18} className="text-white" />
                  </div>

                  {/* Texto centrado */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed text-sm group-hover:text-white transition-colors duration-500">
                      {benefit.description}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Texto central adicional */}
        {(() => {
          const mainText = getValue('porque_main_text', '');
          return mainText && mainText !== 'Texto descriptivo adicional...' ? (
            <div className="text-center mb-16">
              <p className="text-lg sm:text-xl md:text-2xl font-light text-white/70 leading-relaxed max-w-4xl mx-auto">
                {mainText}
              </p>
            </div>
          ) : null;
        })()}

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/about"
            className="inline-flex items-center gap-3 bg-manso-cream text-manso-black px-10 sm:px-16 py-5 sm:py-7 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-manso-black transition-all duration-500 group rounded-full"
          >
            CONOCENOS
            <ArrowRight
              size={18}
              className="transform transition-transform duration-500 group-hover:translate-x-2"
            />
          </Link>
        </div>

      </div>
    </section>
  );
};
