import type { Metadata } from 'next';
import { Hero } from "@/components/Home/Hero";
import { Gallery } from "@/components/Home/Gallery";
import { AboutUsPreview } from "@/components/Home/AboutUsPreview";
import { EventosHome } from "@/components/Home/EventosHome";
import { MembresiasHome } from "@/components/Home/MembresiasHome";
import { PorQueManso } from "@/components/Home/PorQueManso";
import { SponsorBelt } from "@/components/Home/SponsorBelt";
import { RandomGalleryPlaceholders } from "@/components/Home/RandomGalleryPlaceholders";

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Manso Club | Cowork Creativo & Talleres en Buenos Aires',
  description: 'Ideal para freelancers, emprendedores, startups, trabajadores remotos, estudiantes y artistas que busquen un lugar creativo de pertenencia.',
  openGraph: {
    title: 'Manso Club | Cowork Creativo & Talleres en Buenos Aires',
    description: 'Ideal para freelancers, emprendedores, startups, trabajadores remotos, estudiantes y artistas que busquen un lugar creativo de pertenencia.',
    url: 'https://manso.club',
    siteName: 'Manso Club',
    images: [{ url: '/manso-logo-black.png', width: 800, height: 800 }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manso Club | Cowork Creativo & Talleres en Buenos Aires',
    description: 'Ideal para freelancers, emprendedores, startups, trabajadores remotos, estudiantes y artistas que busquen un lugar creativo de pertenencia.',
    images: ['/manso-logo-black.png'],
  },
};

export default function Home() {
  return (
    <div id="page-root" className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      
      {/* Slide 1: Hero */}
      <section id="quienes-somos" className="min-h-screen relative">
        <Hero />
      </section>
      
      {/* Slide 2: Gallery */}
      <section id="galeria" className="min-h-[60vh] md:min-h-screen">
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

      {/* Cinturón de confianza — sponsors */}
      <SponsorBelt />

    </div>
  );
}