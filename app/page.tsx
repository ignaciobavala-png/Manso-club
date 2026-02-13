"use client";

import { Hero } from "@/components/Home/Hero";
import { Gallery } from "@/components/Home/Gallery";
import { EventList } from "@/components/Home/EventList";
import { SectionsGrid } from "@/components/Home/SectionsGrid";

export default function Home() {
  return (
    /* Contenedor principal limpio - sin fondo que bloquee el Hero */
    <div className="min-h-screen">
      
      {/* Slide 1: Hero */}
      <section id="quienes-somos" className="min-h-screen">
        <Hero />
      </section>
      
      {/* Slide 2: Gallery */}
      <section id="galeria" className="min-h-[60vh] md:min-h-screen">
        <Gallery />
      </section>

      {/* Slide 3: Cronograma + Carrito */}
      <section 
        id="agenda"
        className="min-h-screen flex flex-col md:flex-row"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-full md:w-1/2">
          <EventList />
        </div>
        <div className="w-full md:w-1/2">
          <SectionsGrid />
        </div>
      </section>

    </div>
  );
}