import type { Metadata } from 'next';
import Image from 'next/image';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { getTeamMembers } from '@/lib/team';
import { getAboutUs } from '@/lib/aboutUs';
import { ParticleBackground } from '@/components/Home/ParticleBackground';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Nosotros | Manso Club',
  description: 'Conocé el espacio creativo Manso Club en Buenos Aires. Nuestro equipo, nuestra historia y nuestra comunidad.',
  openGraph: {
    title: 'Nosotros | Manso Club',
    description: 'Conocé el espacio creativo Manso Club en Buenos Aires.',
    images: [{ url: '/og-image.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nosotros | Manso Club',
    description: 'Conocé el espacio creativo Manso Club en Buenos Aires.',
    images: ['/og-image.png'],
  },
};

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();
  const aboutUs = await getAboutUs();

  return (
    <div
      className="relative min-h-screen bg-manso-black"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }}
    >
      <ParticleBackground />
      <AdaptiveSectionLayout title="About Us" subtitle={aboutUs.subtitle} customBg="bg-transparent" forceDark>
      {/* Sección principal con layout dinámico */}
      <div className="space-y-12">
        {/* Layout original mejorado: texto y foto principal */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Texto principal */}
          <div className="w-full lg:w-1/2 space-y-6 pr-0 lg:pr-8 px-4 lg:px-0">
            {aboutUs.description.split('\n').filter(p => p.trim()).map((paragraph, index) => (
              <p key={index} className="text-manso-cream text-lg md:text-xl leading-relaxed font-normal break-words">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Foto principal */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              {aboutUs.main_photo_url ? (
                <Image
                  src={aboutUs.main_photo_url}
                  alt="Manso Club — Fachada del edificio"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={95}
                  priority
                />
              ) : (
                <div className="w-full h-full bg-manso-cream/10 flex items-center justify-center">
                  <p className="text-manso-cream/40 text-sm font-medium">No hay foto principal</p>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Galería de fotos */}
      {aboutUs.gallery_photos && aboutUs.gallery_photos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {aboutUs.gallery_photos.map((photo, index) => (
            <div key={index} className="relative aspect-[4/3] w-full sm:w-1/2 rounded-2xl overflow-hidden">
              <Image
                src={photo}
                alt={`Manso Club — Galería ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      )}

      {/* Team Section */}
      <div className="mt-16 md:mt-24">
        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
          Team<span className="text-manso-cream/20 cursor-blink">_</span>
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-manso-olive mt-1 mb-10">
          Las personas detrás de Manso
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2">
          {teamMembers.map((member) => {
            const initials = member.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div key={member.id} className="flex flex-col w-full">
                {member.photo_url ? (
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-3 flex-shrink-0">
                    <Image
                      src={member.photo_url}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 22vw"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-zinc-500 text-2xl md:text-3xl font-black tracking-widest">{initials}</span>
                  </div>
                )}
                <p className="text-manso-cream font-black uppercase text-base md:text-lg tracking-tight leading-tight">{member.name}</p>
                <p className="text-zinc-500 text-sm md:text-base mt-1">{member.role}</p>
              </div>
            );
          })}
          {teamMembers.length === 0 && (
            <>
              {(['AH', 'AM', 'FB', 'JP'] as const).map((ini) => (
                <div key={ini} className="flex flex-col w-full">
                  <div className="w-full aspect-[3/4] bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-zinc-500 text-2xl font-black tracking-widest">{ini}</span>
                  </div>
                  <p className="text-manso-black font-black uppercase text-base md:text-lg tracking-tight leading-tight">Nombre</p>
                  <p className="text-zinc-500 text-sm md:text-base mt-1">Rol</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      </div>
    </AdaptiveSectionLayout>
    </div>
  );
}
