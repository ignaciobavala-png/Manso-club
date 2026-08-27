'use client';

import { useEffect, useState } from 'react';
import { getHeroSlidesByDevice, getMediaUrlForDevice } from '@/lib/hero';
import { HeroCarousel } from '@/components/Home/HeroCarousel';
import { HeroSlide } from '@/lib/hero';

const HERO_SLIDES = [
  {
    tag: "01. Quiénes Somos",
    title: ["Espacio", "Creativo"],
    description: "Manso es un ecosistema nacido en Buenos Aires donde conviven el diseño, la tecnología y la cultura electrónica. Sanamos el trabajo a través de la comunidad.",
  },
  {
    tag: "02. Nuestra Visión",
    title: ["Sonido", "Digital"],
    description: "Impulsamos la cultura electrónica local a través de experiencias inmersivas y curaduría sonora de vanguardia.",
  },
  {
    tag: "03. Comunidad",
    title: ["Manso", "Club"],
    description: "Un espacio de pertenencia para mentes creativas. Conectamos talento local con impacto global.",
  }
];

export function HeroClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const loadSlides = async () => {
      try {
        // Detectar dispositivo client-side
        const isMobile = window.innerWidth <= 768;
        const device = isMobile ? 'mobile' : 'desktop';
        setCurrentDevice(device);

        const heroSlides = await getHeroSlidesByDevice(device);
        setSlides(heroSlides);
      } catch (error) {
        console.error('Error loading hero slides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSlides();

    // Escuchar cambios de tamaño de ventana
    const handleResize = () => {
      loadSlides();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <section id="hero" className="relative min-h-screen flex items-center justify-center bg-manso-black">
        <div className="animate-pulse text-manso-cream/60">Cargando...</div>
      </section>
    );
  }

  // Sin slides en la DB, se usa el fallback hardcodeado
  if (slides.length === 0) {
    return <HeroCarousel slides={HERO_SLIDES} />;
  }

  // Un solo camino de render para todos los tipos: el carrusel resuelve
  // video / imagen / gradiente. Antes había tres ramas casi idénticas y la
  // de carrusel no dibujaba video, así que un slide de video mezclado con
  // imágenes se veía como el gradiente de fallback.
  const carouselSlides = slides.map((slide) => ({
    ...slide,
    title: [slide.title_line1, slide.title_line2 || ''].filter(Boolean),
    media_url:
      slide.tipo === 'imagen'
        ? getMediaUrlForDevice(slide, currentDevice)
        : slide.tipo === 'video'
          ? getMediaUrlForDevice(slide, currentDevice) || slide.media_url
          : null,
  }));

  return <HeroCarousel slides={carouselSlides} />;
}
