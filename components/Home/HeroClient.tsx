'use client';

import { useSyncExternalStore } from 'react';
import { getMediaUrlForDevice } from '@/lib/hero';
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

type Device = 'desktop' | 'mobile';

// Mismo corte que antes (innerWidth <= 768). Antes se volvían a pedir los
// slides a Supabase en cada resize, y en mobile la barra de direcciones que se
// esconde al scrollear dispara resize: el carrusel se reiniciaba scrolleando.
const MOBILE_QUERY = '(max-width: 768px)';

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
const getDevice = (): Device => (window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop');
// En el servidor no se sabe el dispositivo.
const getServerDevice = (): Device | null => null;

export function HeroClient({ slides }: { slides: HeroSlide[] }) {
  const device = useSyncExternalStore<Device | null>(subscribe, getDevice, getServerDevice);

  // Sin saber el dispositivo (HTML del servidor e hidratación) se muestran los
  // slides que van en los dos; si no hay ninguno así, todos.
  const ambos = slides.filter((s) => s.device_type === 'ambos');
  const visibles = device
    ? slides.filter((s) => s.device_type === 'ambos' || s.device_type === device)
    : ambos.length > 0 ? ambos : slides;

  // Sin slides en la DB, se usa el fallback hardcodeado
  if (visibles.length === 0) {
    return <HeroCarousel slides={HERO_SLIDES} />;
  }

  // Un solo camino de render para todos los tipos: el carrusel resuelve
  // video / imagen / gradiente. Antes había tres ramas casi idénticas y la
  // de carrusel no dibujaba video, así que un slide de video mezclado con
  // imágenes se veía como el gradiente de fallback.
  //
  // Las imágenes llevan las dos versiones y el carrusel elige por CSS, así
  // que salen bien desde el HTML. El video sí espera a saber el dispositivo:
  // un <video> con autoplay no se puede dejar oculto sin que se descargue.
  const carouselSlides = visibles.map((slide) => ({
    ...slide,
    title: [slide.title_line1, slide.title_line2 || ''].filter(Boolean),
    media_url:
      slide.tipo === 'imagen'
        ? getMediaUrlForDevice(slide, 'desktop')
        : slide.tipo === 'video'
          ? device
            ? getMediaUrlForDevice(slide, device) || slide.media_url
            : null
          : null,
    media_url_mobile: slide.tipo === 'imagen' ? getMediaUrlForDevice(slide, 'mobile') : null,
  }));

  return <HeroCarousel slides={carouselSlides} />;
}
