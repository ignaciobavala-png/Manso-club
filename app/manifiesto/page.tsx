import { ParticleBackground } from '@/components/Home/ParticleBackground';

export const metadata = { title: 'Manifiesto — Manso Club' };

export default function ManifiestoPage() {
  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
          Manso Club
        </p>
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-20">
          Manifiesto
        </h1>

        <div className="space-y-10 text-manso-cream/80 font-light leading-relaxed text-lg md:text-xl">
          <p>
            Manso Club nació de una convicción simple: el talento no necesita permiso para existir,
            pero sí necesita un lugar donde encontrarse.
          </p>
          <p>
            Somos una central de conexiones. Un espacio donde artistas, creadores, pensadores
            y hacedores confluyen para generar algo que ninguno podría construir solo.
            La sinergia no es un concepto abstracto acá — es lo que pasa cuando dos personas
            que no deberían haberse conocido se sientan en la misma mesa.
          </p>
          <p>
            Creemos en el proceso tanto como en el resultado. En la conversación que antecede
            al proyecto. En el ensayo antes de la obra. En el boceto antes del mural.
            Manso no es un destino final — es el lugar donde las cosas empiezan a tomar forma.
          </p>
          <p>
            Conectamos talentos con oportunidades porque entendemos que las oportunidades
            no caen del cielo: se construyen, se cultivan, se comparten.
            Cada artista que pasa por acá lleva consigo algo de los demás.
            Cada proyecto que nace acá tiene ADN colectivo.
          </p>
          <p>
            Lo que nos une no es el género, ni el formato, ni la disciplina.
            Lo que nos une es la urgencia de hacer. La necesidad de crear.
            El deseo de que lo que existe sea diferente a lo que existía antes.
          </p>
          <p className="text-manso-cream font-medium">
            Eso es Manso. Un lugar donde el hacer es el lenguaje común.
          </p>
        </div>

        <div className="mt-20 w-16 h-px bg-manso-terra" />
        <p className="mt-6 text-[9px] uppercase tracking-[0.5em] text-manso-cream/20">
          Buenos Aires — 2026
        </p>
      </div>
    </div>
  );
}
