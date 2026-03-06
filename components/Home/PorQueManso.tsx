import { ArrowRight } from 'lucide-react';
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

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20 bg-manso-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter text-white leading-[0.9] mb-4 sm:mb-6">
            {getValue('porque_titulo', 'Why Manso')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            {getValue('porque_subtitulo', 'More than just a workspace. We provide everything you need to thrive in today\'s dynamic business environment.')}
          </p>
        </div>

        {/* Grid de cards de beneficios */}
        <div className={`${getGridClass()} gap-4 sm:gap-6 mb-12 sm:mb-16`}>
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-manso-cream/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-manso-cream/10 hover:bg-manso-cream/10 transition-all duration-300 group">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 group-hover:text-manso-terra transition-colors">
                {benefit.title}
              </h3>
              <p className="text-white/60 leading-relaxed text-xs sm:text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
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
            className="inline-flex items-center gap-3 bg-manso-terra text-white px-8 sm:px-12 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all transform hover:-translate-y-1 active:scale-95 group rounded-full"
          >
            CONOCENOS
            <ArrowRight 
              size={16} 
              className="transform transition-transform group-hover:translate-x-2" 
            />
          </Link>
        </div>
      </div>
    </section>
  );
};
