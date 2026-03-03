import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHeroSlides } from '@/lib/hero';
import { HeroCarousel } from '@/components/Home/HeroCarousel';

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

export const Hero = async () => {
  const slides = await getHeroSlides();
  const hasSlides = slides.length > 0;
  
  // If no slides in DB, use hardcoded fallback
  if (!hasSlides) {
    return <HeroCarousel slides={HERO_SLIDES} />;
  }
  
  // If single video slide
  if (slides.length === 1 && slides[0].tipo === 'video' && slides[0].media_url) {
    return (
      <section id="hero" className="relative min-h-screen flex flex-col justify-center px-8 md:px-20 py-20 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ backgroundColor: '#1D1D1B' }}
        >
          <source src={slides[0].media_url} type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 z-10 bg-black/40" />
        
        <div className="relative z-20 w-full max-w-6xl mx-auto">
          <header className="mb-8">
            {slides[0].tag && (
              <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-manso-cream/60 font-bold block mb-4">
                {slides[0].tag}
              </span>
            )}
            <h1 className="text-[16vw] md:text-[11vw] leading-[0.8] font-bold uppercase tracking-tighter text-manso-cream">
              {slides[0].title_line1} <br />
              {slides[0].title_line2 && (
                <span className="italic font-light opacity-80">{slides[0].title_line2}</span>
              )}
            </h1>
          </header>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mt-4">
            {slides[0].description && (
              <p className="max-w-[450px] text-manso-cream/80 text-base md:text-xl leading-relaxed font-light min-h-[100px]">
                {slides[0].description}
              </p>
            )}
            
            <div className="flex flex-col items-start gap-6">
              <button className="bg-manso-cream text-manso-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-manso-white transition-all transform hover:-translate-y-1 active:scale-95">
                Membresías 2026
              </button>
              
              <div className="flex items-center gap-4 text-manso-cream/40 animate-bounce mt-4 md:mt-0">
                <span className="text-[9px] uppercase tracking-widest font-bold">Scroll para explorar</span>
                <ArrowDown size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // If single image slide
  if (slides.length === 1 && slides[0].tipo === 'imagen' && slides[0].media_url) {
    return (
      <section id="hero" className="relative min-h-screen flex flex-col justify-center px-8 md:px-20 py-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${slides[0].media_url})`,
            backgroundColor: '#1D1D1B'
          }}
        />
        
        <div className="absolute inset-0 z-10 bg-black/40" />
        
        <div className="relative z-20 w-full max-w-6xl mx-auto">
          <header className="mb-8">
            {slides[0].tag && (
              <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-manso-cream/60 font-bold block mb-4">
                {slides[0].tag}
              </span>
            )}
            <h1 className="text-[16vw] md:text-[11vw] leading-[0.8] font-bold uppercase tracking-tighter text-manso-cream">
              {slides[0].title_line1} <br />
              {slides[0].title_line2 && (
                <span className="italic font-light opacity-80">{slides[0].title_line2}</span>
              )}
            </h1>
          </header>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mt-4">
            {slides[0].description && (
              <p className="max-w-[450px] text-manso-cream/80 text-base md:text-xl leading-relaxed font-light min-h-[100px]">
                {slides[0].description}
              </p>
            )}
            
            <div className="flex flex-col items-start gap-6">
              <button className="bg-manso-cream text-manso-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-manso-white transition-all transform hover:-translate-y-1 active:scale-95">
                Membresías 2026
              </button>
              
              <div className="flex items-center gap-4 text-manso-cream/40 animate-bounce mt-4 md:mt-0">
                <span className="text-[9px] uppercase tracking-widest font-bold">Scroll para explorar</span>
                <ArrowDown size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // For text slides or multiple slides, use carousel behavior
  const carouselSlides = slides.map(slide => ({
    tag: slide.tag || '',
    title: [slide.title_line1, slide.title_line2 || ''].filter(Boolean),
    description: slide.description || ''
  }));
  
  return <HeroCarousel slides={carouselSlides} />;
};