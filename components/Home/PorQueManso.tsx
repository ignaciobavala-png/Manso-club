import { ArrowRight, Users, MapPin, Sparkles, Music } from 'lucide-react';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/siteConfig';

export const PorQueManso = async () => {
  const config = await getSiteConfig();
  
  // Función helper para obtener valor visible
  const getValue = (key: string, defaultValue: string) => {
    const item = config[key];
    if (!item) return defaultValue;
    if (typeof item === 'string') return item;
    return item.visible ? item.value : defaultValue;
  };

  // Función helper para verificar si un elemento es visible
  const isVisible = (key: string) => {
    const item = config[key];
    if (!item) return false;
    if (typeof item === 'string') return true; // Compatibilidad con datos antiguos
    return item.visible;
  };

  // Iconos para cada beneficio
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

  // Determinar clases de grid según cantidad de beneficios
  const getGridClass = () => {
    const count = benefits.length;
    if (count === 0) return 'hidden';
    if (count === 1) return 'grid grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  // Forzar altura uniforme para todas las cards
  const getCardHeight = () => {
    const count = benefits.length;
    if (count <= 2) return 'h-64 md:h-72';
    return 'h-72 md:h-80';
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20 bg-manso-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-thin uppercase tracking-[0.15em] text-white leading-[0.9] mb-4">
            <span className="block font-light">NUESTRO ADN</span>
            <span className="block font-extralight text-manso-cream mt-1">MUCHO MÁS QUE UN CLUB</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            {getValue('porque_subtitulo', 'More than just a workspace. We provide everything you need to thrive in today\'s dynamic business environment.')}
          </p>
        </div>

        {/* Grid de cards de beneficios */}
        <div className={`${getGridClass()} gap-6 sm:gap-8 mb-16 sm:mb-20`}>
          {benefits.map((benefit, index) => {
            const IconComponent = getIcon(index);
            return (
              <div key={index} className="group relative">
                {/* Card principal con altura uniforme */}
                <div className={`${getCardHeight()} bg-manso-cream/5 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-manso-cream/10 hover:bg-manso-cream/10 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-3 hover:shadow-2xl hover:shadow-white/10 relative overflow-hidden flex flex-col`}>
                  
                  {/* Icono animado */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:scale-110">
                    <IconComponent 
                      size={18} 
                      className="text-white transition-transform duration-500 group-hover:rotate-12" 
                    />
                  </div>
                  
                  {/* Contenido */}
                  <div className="flex flex-col flex-1 justify-start py-2 pr-12">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-manso-cream transition-colors duration-500">
                      {benefit.title}
                    </h3>
                    <p className="text-white/70 leading-snug text-xs sm:text-sm transition-all duration-500 group-hover:text-white/90 line-clamp-3">
                      {benefit.description}
                    </p>
                  </div>
                  
                  {/* Efecto de luz sutil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Borde animado */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 pointer-events-none" />
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
            className="inline-flex items-center gap-3 bg-manso-terra text-white px-10 sm:px-16 py-5 sm:py-7 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 active:scale-95 group rounded-full shadow-lg hover:shadow-2xl hover:shadow-white/20"
          >
            CONOCENOS
            <ArrowRight 
              size={18} 
              className="transform transition-all duration-500 group-hover:translate-x-3 group-hover:scale-125" 
            />
          </Link>
        </div>
      </div>
    </section>
  );
};
