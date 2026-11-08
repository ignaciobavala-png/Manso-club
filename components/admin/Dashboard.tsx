'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { logoutAction } from '../../app/mansoadm/actions';
import { FileText, BookOpen, LogOut, User, Home, Calendar, Crown, Star, Users, Image, Layout, Video, Calculator, Briefcase, Mail, Network, MessageSquare, BarChart2, Sparkles, DoorOpen, Ticket, ShoppingBag, Bot } from 'lucide-react';
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
import { FormOfertaEmpleo } from './FormOfertaEmpleo';
import { OfertasEmpleoList } from './OfertasEmpleoList';
import { PropuestasList } from './PropuestasList';
import { AsistenteIA } from './AsistenteIA';

type SeccionId = 'crm' | 'comunidad' | 'chat' | 'membresias' | 'cultura' | 'espacio' | 'festival' | 'agenda' | 'streaming' | 'artistas' | 'home' | 'contenidos' | 'empleos' | 'newsletter' | 'tienda' | 'eventos' | 'hero' | 'galeria' | 'cotizador' | 'team' | 'about' | 'manifiesto' | 'ia';

/** Mismo orden de botones que el panel de siempre; IA va al final. */
const TABS: { id: SeccionId; label: string; Icon: typeof Home }[] = [
  { id: 'crm', label: 'CRM', Icon: BarChart2 },
  { id: 'comunidad', label: 'Comunidad', Icon: Network },
  { id: 'chat', label: 'Chat', Icon: MessageSquare },
  { id: 'membresias', label: 'Membresías', Icon: Crown },
  { id: 'cultura', label: 'Cultura', Icon: Sparkles },
  { id: 'espacio', label: 'Espacio', Icon: DoorOpen },
  { id: 'festival', label: 'Festival', Icon: Ticket },
  { id: 'agenda', label: 'Agenda', Icon: Calendar },
  { id: 'streaming', label: 'Streaming', Icon: Video },
  { id: 'artistas', label: 'Artistas', Icon: User },
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'contenidos', label: 'Contenidos', Icon: Video },
  { id: 'empleos', label: 'Empleos', Icon: Briefcase },
  { id: 'newsletter', label: 'Mailing', Icon: Mail },
  { id: 'tienda', label: 'Tienda', Icon: ShoppingBag },
  { id: 'eventos', label: 'Eventos', Icon: Star },
  { id: 'hero', label: 'Hero', Icon: Layout },
  { id: 'galeria', label: 'Galería', Icon: Image },
  { id: 'cotizador', label: 'Cotizador', Icon: Calculator },
  { id: 'team', label: 'Team', Icon: Users },
  { id: 'about', label: 'About', Icon: FileText },
  { id: 'manifiesto', label: 'Manifiesto', Icon: BookOpen },
  { id: 'ia', label: 'IA', Icon: Bot },
];

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
    case 'ia': return <AsistenteIA />;
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
    case 'empleos': return {
      titulo: 'Nueva Oferta', form: <FormOfertaEmpleo />,
      lista: (
        <div className="space-y-8">
          <OfertasEmpleoList refreshTrigger={r} />
          <div className="border-t border-manso-cream/10 pt-8"><PropuestasList refreshTrigger={r} /></div>
        </div>
      ),
    };
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
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen pt-8 sm:pt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">Manso Admin_</h1>
            <p className="text-[12px] font-bold text-manso-cream/62 uppercase tracking-[0.3em]">Panel de Control Centralizado</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-manso-cream/5 text-manso-cream/70 rounded-xl text-[12px] font-medium">
                <User size={14} />
                <span className="truncate max-w-[200px]">{userEmail}</span>
              </div>
            )}
            <a
              href="/login?force=true"
              className="flex-1 sm:flex-none px-3 py-2 bg-manso-cream/10 text-manso-cream/80 border border-manso-cream/20 rounded-xl text-[12px] font-bold uppercase hover:bg-manso-cream/20 transition-all"
              title="Cambiar de usuario"
            >
              Cambiar usuario
            </a>
            <form action={logoutAction} className="flex-1 sm:flex-none">
              <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-[12px] font-bold uppercase hover:opacity-80 transition-all">
                <LogOut size={14} /> Salir
              </button>
            </form>
          </div>
        </div>

        <div role="tablist" className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-10 bg-manso-cream/10 p-1 rounded-2xl w-full">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-label={label}
              title={label}
              onClick={() => setTab(id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[12px] sm:text-[13px] font-black uppercase tracking-widest transition-all ${
                tab === id
                  ? (id === 'crm' ? 'bg-manso-terra text-white' : 'bg-manso-cream text-manso-black') + ' shadow-sm'
                  : 'text-manso-cream/70 hover:text-manso-cream'
              }`}
            >
              <Icon size={12} aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {completa && <div className="mb-8">{completa}</div>}

        {dividida && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-12">
            <div className="xl:col-span-5">
              <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-manso-cream/70 mb-4 sm:mb-6 ml-2">{dividida.titulo}</h2>
              <div className="sticky top-4 sm:top-8">{dividida.form}</div>
            </div>
            <div className="xl:col-span-7">
              <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-manso-cream/70 mb-4 sm:mb-6 ml-2">Gestionar existentes</h2>
              {dividida.lista}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
