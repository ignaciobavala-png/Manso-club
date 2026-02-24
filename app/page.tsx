import { Hero } from "@/components/Home/Hero";
import { Gallery } from "@/components/Home/Gallery";
import { EventosHome } from "@/components/Home/EventosHome";
import { MembresiasHome } from "@/components/Home/MembresiasHome";
import { PorQueManso } from "@/components/Home/PorQueManso";
import { TiendaHome } from "@/components/Home/TiendaHome";

export default function Home() {
  return (
    /* Contenedor principal limpio - sin fondo que bloquee el Hero */
    <div className="min-h-screen">
      
      {/* Slide 1: Hero */}
      <section id="quienes-somos" className="min-h-screen relative">
        <Hero />
      </section>
      
      {/* Slide 2: Gallery */}
      <section id="galeria" className="min-h-[60vh] md:min-h-screen">
        <Gallery />
      </section>

      {/* Slide 3: Agenda/Eventos */}
      <section id="agenda">
        <EventosHome />
      </section>

      {/* Slide 4: Membresías */}
      <section id="membresias">
        <MembresiasHome />
      </section>

      {/* Slide 5: ¿Por qué Manso? */}
      <section id="por-que-manso">
        <PorQueManso />
      </section>

      {/* Slide 6: Seleccionados de la Tienda */}
      <section id="tienda">
        <TiendaHome />
      </section>

    </div>
  );
}