'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { FileText, BookOpen } from 'lucide-react';
import { AdminNav } from './AdminNav';
import type { SeccionId } from './adminNav';
import { FormArtista } from './FormArtista';
import { FormEventoHome } from './FormEventoHome';
import { FormAgenda } from './FormAgenda';
import { EventosHomeList } from './EventosHomeList';
import { AgendaList } from './AgendaList';
import { ArtistasList } from './ArtistasList';
import { MembresiasAdmin } from './MembresiasAdmin';
import { CulturaAdmin } from './CulturaAdmin';
import { EspacioAdmin } from './EspacioAdmin';
import { FestivalAdmin } from './FestivalAdmin';
import { FormEvento } from './FormEvento';
import { FormTeam } from './FormTeam';
import { EventosList } from './EventosList';
import { TeamList } from './TeamList';
import { FormHero } from './FormHero';
import { HeroList } from './HeroList';
import { FormGallery } from './FormGallery';
import { GalleryList } from './GalleryList';
import { FormAboutUs } from './FormAboutUs';
import { FormMultimedia } from './FormMultimedia';
import { MultimediaList } from './MultimediaList';
import { StreamingAdmin } from './StreamingAdmin';
import { TiendaAdmin } from './TiendaAdmin';
import { FormManifiesto } from './FormManifiesto';
import { CotizadorConfigAdmin } from './CotizadorConfigAdmin';
import { CotizacionesList } from './CotizacionesList';
import { MailingAdmin } from './MailingAdmin';
import { ComunidadAdmin } from './ComunidadAdmin';
import { ChatAdmin } from './ChatAdmin';
import { CRMAdmin } from './CRMAdmin';

/** Pantallas que ocupan todo el ancho. */
function pantallaCompleta(id: SeccionId, r: number): ReactNode | null {
  switch (id) {
    case 'crm': return <CRMAdmin />;
    case 'comunidad': return <ComunidadAdmin />;
    case 'chat': return <ChatAdmin />;
    case 'streaming': return <StreamingAdmin refreshTrigger={r} />;
    case 'membresias': return <MembresiasAdmin refreshTrigger={r} />;
    case 'cultura': return <CulturaAdmin />;
    case 'espacio': return <EspacioAdmin />;
    case 'festival': return <FestivalAdmin />;
    case 'tienda': return <TiendaAdmin refreshTrigger={r} />;
    case 'newsletter': return <MailingAdmin />;
    default: return null;
  }
}

function Nota({ icono, titulo, texto, pie }: { icono: ReactNode; titulo: string; texto: string; pie: string }) {
  return (
    <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 text-center">
      <div className="mx-auto mb-4 w-fit text-manso-cream/62">{icono}</div>
      <h3 className="text-xl font-black uppercase tracking-tighter text-manso-cream mb-2">{titulo}</h3>
      <p className="text-[15px] text-manso-cream/70 mb-4">{texto}</p>
      <p className="text-[13px] text-manso-cream/62">{pie}</p>
    </div>
  );
}

/** Pantallas de dos columnas: formulario a la izquierda, lista a la derecha. */
function pantallaDividida(id: SeccionId, r: number): { titulo: string; form: ReactNode; lista: ReactNode } | null {
  switch (id) {
    case 'about': return {
      titulo: 'Editar About Us', form: <FormAboutUs />,
      lista: <Nota icono={<FileText size={48} />} titulo="About Us"
        texto="Editá el contenido de la sección About Us desde el formulario de la izquierda."
        pie="Los cambios se reflejan al instante en /about" />,
    };
    case 'home': return { titulo: 'Evento del Home', form: <FormEventoHome />, lista: <EventosHomeList refreshTrigger={r} /> };
    case 'artistas': return { titulo: 'Artista', form: <FormArtista />, lista: <ArtistasList refreshTrigger={r} /> };
    case 'agenda': return { titulo: 'Evento de Agenda', form: <FormAgenda />, lista: <AgendaList refreshTrigger={r} /> };
    case 'eventos': return { titulo: 'Evento', form: <FormEvento />, lista: <EventosList refreshTrigger={r} /> };
    case 'team': return { titulo: 'Miembro del Team', form: <FormTeam />, lista: <TeamList refreshTrigger={r} /> };
    case 'hero': return { titulo: 'Slide del Hero', form: <FormHero />, lista: <HeroList refreshTrigger={r} /> };
    case 'galeria': return { titulo: 'Foto de Galería', form: <FormGallery />, lista: <GalleryList refreshTrigger={r} /> };
    case 'contenidos': return { titulo: 'Nuevo Video', form: <FormMultimedia />, lista: <MultimediaList refreshTrigger={r} /> };
    case 'cotizador': return { titulo: 'Configuración', form: <CotizadorConfigAdmin />, lista: <CotizacionesList refreshTrigger={r} /> };
    case 'manifiesto': return {
      titulo: 'Editar Manifiesto', form: <FormManifiesto />,
      lista: <Nota icono={<BookOpen size={48} />} titulo="Manifiesto"
        texto="Escribí el texto desde el formulario de la izquierda. Cada párrafo va separado por una línea en blanco."
        pie="Los cambios se reflejan en /manifiesto al guardar." />,
    };
    default: return null;
  }
}

export function Dashboard() {
  const [tab, setTab] = useState<SeccionId>('crm');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user?.email) setUserEmail(data.user.email);
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Los formularios avisan con este evento cuando guardan, para refrescar las listas.
    const handleDashboardRefresh = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    return () => window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
  }, []);

  const completa = pantallaCompleta(tab, refreshTrigger);
  const dividida = completa ? null : pantallaDividida(tab, refreshTrigger);

  return (
    <div className="min-h-screen bg-manso-black">
      <AdminNav tab={tab} onChange={setTab} userEmail={userEmail} />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        {completa}

        {dividida && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-12">
            <div className="xl:col-span-5">
              <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-manso-cream/70 mb-4 sm:mb-6 ml-2">
                {dividida.titulo}
              </h2>
              <div className="sticky top-44">{dividida.form}</div>
            </div>
            <div className="xl:col-span-7">
              <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-manso-cream/70 mb-4 sm:mb-6 ml-2">
                Gestionar existentes
              </h2>
              {dividida.lista}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
