import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Trabajá con nosotros — Manso Club' };

const areas = [
  { area: 'Producción', descripcion: 'Coordinación de eventos, talleres y actividades en el espacio.' },
  { area: 'Comunicación', descripcion: 'Gestión de redes, contenido visual y estrategia de marca.' },
  { area: 'Curaduría', descripcion: 'Selección y programación de artistas, ciclos y residencias.' },
  { area: 'Técnica', descripcion: 'Sonido, iluminación y soporte técnico para eventos en vivo.' },
];

export default function TrabajaPage() {
  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
          Manso Club
        </p>
        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-8">
          Trabajá con<br />nosotros
        </h1>

        <p className="text-manso-cream/60 font-light text-lg max-w-xl mb-20 leading-relaxed">
          Somos un equipo pequeño con proyectos grandes. Si querés sumar tu energía
          a lo que estamos construyendo, nos interesa escucharte.
        </p>

        {/* Áreas */}
        <div className="space-y-0 mb-20">
          {areas.map((item, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center gap-4 py-8 border-b border-manso-cream/10"
            >
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra w-40 shrink-0">
                {item.area}
              </span>
              <p className="text-manso-cream/70 font-light leading-relaxed">
                {item.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-cream/40">
            Contacto
          </p>
          <a
            href="mailto:hola@mansoclub.com.ar"
            className="inline-flex items-center gap-3 text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-manso-cream hover:text-manso-terra transition-colors duration-300 group"
          >
            hola@mansoclub.com.ar
            <ArrowRight size={24} className="transform transition-transform group-hover:translate-x-2" />
          </a>
          <p className="text-manso-cream/30 text-sm font-light">
            Contanos quién sos, qué hacés y cómo querés colaborar.
          </p>
        </div>
      </div>
    </div>
  );
}
