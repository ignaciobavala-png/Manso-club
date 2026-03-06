import Image from 'next/image';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { getTeamMembers } from '@/lib/team';
import { getAboutUs } from '@/lib/aboutUs';

export const revalidate = 60; // revalida cada 60 segundos

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();
  const aboutUs = await getAboutUs();

  return (
    <AdaptiveSectionLayout title="About Us" subtitle={aboutUs.subtitle}>
      {/* Sección principal con layout dinámico */}
      <div className="space-y-12">
        {/* Layout original mejorado: texto y foto principal */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Texto principal */}
          <div className="flex-1 lg:flex-initial lg:w-1/2 space-y-8">
            {aboutUs.description.split('\n').filter(p => p.trim()).map((paragraph, index) => (
              <p key={index} className="text-zinc-800 text-xl md:text-2xl leading-relaxed font-bold">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Foto principal */}
          <div className="flex-1 lg:flex-initial lg:w-1/2 relative">
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
        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-black mb-12">
          Team<span className="text-zinc-200">_</span>
        </h2>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex flex-col items-center">
              {member.photo_url ? (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4">
                  <img
                    src={member.photo_url!}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-800 rounded-full mb-4"></div>
              )}
              <p className="text-manso-black font-medium text-center">{member.name}</p>
              <p className="text-zinc-600 text-sm text-center">{member.role}</p>
            </div>
          ))}
          {/* Si no hay miembros, mostrar placeholders */}
          {teamMembers.length === 0 && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-800 rounded-full mb-4"></div>
                  <p className="text-manso-black font-medium text-center">Nombre</p>
                  <p className="text-zinc-600 text-sm text-center">Rol</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      </div>
    </AdaptiveSectionLayout>
  );
}
