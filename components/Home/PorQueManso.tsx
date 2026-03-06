import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/siteConfig';

export const PorQueManso = async () => {
  const config = await getSiteConfig();
  
  const benefits = [
    {
      title: config.beneficio1_titulo || 'Título del Beneficio 1',
      description: config.beneficio1_descripcion || 'Descripción del primer beneficio que ofrece Manso Club...'
    },
    {
      title: config.beneficio2_titulo || 'Título del Beneficio 2',
      description: config.beneficio2_descripcion || 'Descripción del segundo beneficio que ofrece Manso Club...'
    },
    {
      title: config.beneficio3_titulo || 'Título del Beneficio 3',
      description: config.beneficio3_descripcion || 'Descripción del tercer beneficio que ofrece Manso Club...'
    },
    {
      title: config.beneficio4_titulo || 'Título del Beneficio 4',
      description: config.beneficio4_descripcion || 'Descripción del cuarto beneficio que ofrece Manso Club...'
    }
  ];

  return (
    <section className="py-20 px-8 md:px-20 bg-manso-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter text-white leading-[0.9] mb-6">
            {config.porque_titulo || 'Why Manso'}
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            {config.porque_subtitulo || 'More than just a workspace. We provide everything you need to thrive in today\'s dynamic business environment.'}
          </p>
        </div>

        {/* Grid de cards de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-manso-cream/5 backdrop-blur-sm rounded-2xl p-8 border border-manso-cream/10 hover:bg-manso-cream/10 transition-all duration-300 group">
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-manso-terra transition-colors">
                {benefit.title}
              </h3>
              <p className="text-white/60 leading-relaxed text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Texto central adicional */}
        {config.porque_main_text && (
          <div className="text-center mb-16">
            <p className="text-xl md:text-2xl font-light text-white/70 leading-relaxed max-w-4xl mx-auto">
              {config.porque_main_text}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/about"
            className="inline-flex items-center gap-3 bg-manso-terra text-white px-12 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all transform hover:-translate-y-1 active:scale-95 group rounded-full"
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
