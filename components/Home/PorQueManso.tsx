'use client';

import { ArrowRight, Headphones, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export const PorQueManso = () => {
  const features = [
    {
      icon: Users,
      number: '500+',
      label: 'CREATIVOS',
      description: 'Comunidad activa de artistas, diseñadores y tecnólogos'
    },
    {
      icon: Headphones,
      number: '24/7',
      label: 'CULTURA ELECTRÓNICA',
      description: 'Curadura sonora de vanguardia y experiencias inmersivas'
    },
    {
      icon: Zap,
      number: '2x',
      label: 'ESPACIO HÍBRIDO',
      description: 'Coworking de día, club nocturno de noche'
    }
  ];

  return (
    <section className="py-20 px-8 md:px-20" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-widest text-black/60 font-bold mb-4 block">05. ¿Por qué Manso?</span>
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter italic text-black leading-[0.8] mb-8">
            Espacio Híbrido
            <br />
            <span className="text-gray-700">Cultura Digital</span>
          </h2>
        </div>

        {/* Grid de características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center group">
                {/* Icono animado */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <IconComponent 
                        size={32} 
                        className="text-gray-700 group-hover:scale-110 transition-transform" 
                      />
                    </div>
                    {/* Aura animada */}
                    <div className="absolute inset-0 bg-gray-700 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity" />
                  </div>
                </div>

                {/* Número destacado */}
                <div className="mb-3">
                  <span className="text-4xl md:text-5xl font-black text-gray-800 leading-none">
                    {feature.number}
                  </span>
                </div>

                {/* Label */}
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tighter text-black mb-3">
                  {feature.label}
                </h3>

                {/* Descripción */}
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Texto central destacado */}
        <div className="text-center mb-16">
          <p className="text-xl md:text-2xl font-light text-gray-700 leading-relaxed max-w-4xl mx-auto mb-8">
            Manso es un ecosistema nacido en Buenos Aires donde conviven el diseño, 
            la tecnología y la cultura electrónica. Un espacio de pertenencia para mentes 
            creativas que buscan impactar localmente con visión global.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <span className="text-sm font-bold uppercase tracking-wider">San Telmo, Buenos Aires</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <span className="text-sm font-bold uppercase tracking-wider">Desde 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <span className="text-sm font-bold uppercase tracking-wider">Comunidad Creativa</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/about"
            className="inline-flex items-center gap-3 bg-black text-white px-12 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:-translate-y-1 active:scale-95 group"
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
