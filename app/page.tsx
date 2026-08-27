import { Hero } from "@/components/Home/Hero";
import { Gallery } from "@/components/Home/Gallery";
import { AboutUsPreview } from "@/components/Home/AboutUsPreview";
import { EventosHome } from "@/components/Home/EventosHome";
import { MembresiasHome } from "@/components/Home/MembresiasHome";
import { PorQueManso } from "@/components/Home/PorQueManso";
import { SponsorBelt } from "@/components/Home/SponsorBelt";
import { RandomGalleryPlaceholders } from "@/components/Home/RandomGalleryPlaceholders";
import { Newsletter } from "@/components/Home/Newsletter";

export const revalidate = 30;

export default function Home() {
  return (
    <div id="page-root" className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      
      {/* Slide 1: Hero */}
      <section id="quienes-somos" className="min-h-screen relative">
        <Hero />
      </section>
      
      {/* Slide 2: Gallery */}
      <section id="galeria">
        <Gallery />
      </section>

      {/* Slide 2.5: Quiénes somos */}
      <section id="quienes-somos-preview">
        <AboutUsPreview />
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
        <PorQueManso>
          <RandomGalleryPlaceholders count={4} />
        </PorQueManso>
      </section>

      {/* Newsletter */}
      <Newsletter />

      {/* Cinturón de confianza — sponsors */}
      <SponsorBelt />

    </div>
  );
}