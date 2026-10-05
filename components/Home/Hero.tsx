import { getHeroSlides } from '@/lib/hero';
import { HeroClient } from './HeroClient';

// Los slides se traen en el servidor (la home revalida cada 30 s) para que el
// título del hero —el LCP de la página— venga en el HTML. Antes se pedían
// desde el navegador después de hidratar y hasta entonces se veía "Cargando...".
export const Hero = async () => {
  const slides = await getHeroSlides();
  return <HeroClient slides={slides} />;
};
