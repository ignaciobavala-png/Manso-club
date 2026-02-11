"use client";

import { Hero } from "@/components/Home/Hero";
import { Manifesto } from "@/components/Home/Manifesto";
import { EventList } from "@/components/Home/EventList";
import { SectionsGrid } from "@/components/Home/SectionsGrid";

export default function Home() {
  return (
    /* Contenedor principal limpio - sin fondo que bloquee el Hero */
    <div className="min-h-screen">
      
      {/* Slide 1: Hero */}
      <section className="min-h-screen">
        <Hero />
      </section>
      
      {/* Slide 2: Manifesto */}
      <section className="min-h-screen">
        <Manifesto />
      </section>

      {/* Slide 3: Cronograma + Carrito */}
      <section 
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