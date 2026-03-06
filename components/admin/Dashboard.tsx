'use client';

import { useState, useEffect } from 'react';
import { logoutAction } from '../../app/mansoadm/actions';
import { FormProducto } from './FormProducto';
import { FormArtista } from './FormArtista';
import { FormEventoHome } from './FormEventoHome';
import { FormAgenda } from './FormAgenda';
import { ItemList } from './ItemList';
import { EventosHomeList } from './EventosHomeList';
import { AgendaList } from './AgendaList';
import { ArtistasList } from './ArtistasList';
import { FormMainMusic } from './FormMainMusic';
import { MainMusicList } from './MainMusicList';
import { FormMembresia } from './FormMembresia';
import { MembresiasList } from './MembresiasList';
import { FormEvento } from './FormEvento';
import { FormTeam } from './FormTeam';
import { EventosList } from './EventosList';
import { TeamList } from './TeamList';
import { FormHero } from './FormHero';
import { HeroList } from './HeroList';
import { FormGallery } from './FormGallery';
import { GalleryList } from './GalleryList';
import { FormSiteConfig } from './FormSiteConfig';
import { FormAboutUs } from './FormAboutUs';
import { LogOut, ShoppingBag, User, Home, Calendar, Music, Crown, Settings, Star, Users, Image, Layout, FileText } from 'lucide-react';

export function Dashboard() {
  const [tab, setTab] = useState<'home' | 'tienda' | 'artistas' | 'agenda' | 'eventos' | 'musica' | 'membresias' | 'team' | 'hero' | 'galeria' | 'sitio' | 'about'>('home');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Obtener información del usuario actual
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Escuchar eventos de actualización del dashboard
    const handleDashboardRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen pt-16 sm:pt-20 lg:pt-20">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">Manso Admin_</h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-manso-cream/60 uppercase tracking-[0.3em]">Panel de Control Centralizado</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-manso-cream/5 text-manso-cream/60 rounded-xl text-[9px] font-medium">
                <User size={12} />
                <span className="truncate max-w-[120px]">{userEmail}</span>
              </div>
            )}
            <a 
              href="/mansoadm/login"
              className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 bg-manso-cream/10 text-manso-cream/80 border border-manso-cream/20 rounded-xl text-[10px] font-bold uppercase hover:bg-manso-cream/20 transition-all"
              title="Cambiar de usuario"
            >
              👤 Cambiar Usuario
            </a>
            <form action={logoutAction} className="flex-1 sm:flex-none">
              <button 
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all shadow-sm"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>

        {/* Selector de Pestañas Estilizado */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-10 bg-manso-cream/10 p-1 rounded-2xl w-full">
          <button 
            onClick={() => setTab('home')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'home' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Home size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button 
            onClick={() => setTab('tienda')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'tienda' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <ShoppingBag size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Tienda</span>
          </button>
          <button 
            onClick={() => setTab('artistas')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'artistas' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <User size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Artistas</span>
          </button>
          <button 
            onClick={() => setTab('agenda')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'agenda' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Calendar size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button 
            onClick={() => setTab('eventos')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'eventos' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Star size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Eventos</span>
          </button>
          <button 
            onClick={() => setTab('musica')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'musica' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Music size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Música</span>
          </button>
          <button 
            onClick={() => setTab('membresias')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'membresias' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Crown size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Membresías</span>
          </button>
          <button 
            onClick={() => setTab('team')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'team' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Users size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Team</span>
          </button>
          <button 
            onClick={() => setTab('hero')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'hero' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Layout size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Hero</span>
          </button>
          <button 
            onClick={() => setTab('galeria')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'galeria' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Image size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Galería</span>
          </button>
          <button 
            onClick={() => setTab('sitio')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'sitio' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Settings size={12} className="sm:size-14" />
            <span className="hidden sm:inline">Sitio</span>
          </button>
          <button 
            onClick={() => setTab('about')} 
            className={`flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'about' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <FileText size={12} className="sm:size-14" />
            <span className="hidden sm:inline">About</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-12">
            {/* Columna Izquierda: Formularios de Creación */}
            <div className="xl:col-span-5">
              <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-4 sm:mb-6 ml-2">
                {tab === 'about' ? 'Editar About Us' : tab === 'home' ? 'Evento del Home' : tab === 'tienda' ? 'Producto' : tab === 'artistas' ? 'Artista' : tab === 'agenda' ? 'Evento de Agenda' : tab === 'eventos' ? 'Evento' : tab === 'musica' ? 'Track para el Home' : tab === 'membresias' ? 'Membresía' : tab === 'team' ? 'Miembro del Team' : tab === 'hero' ? 'Slide del Hero' : tab === 'galeria' ? 'Foto de Galería' : 'Configuración del Sitio'}
              </h2>
              <div className="sticky top-4 sm:top-8">
                {tab === 'about' ? <FormAboutUs /> : tab === 'home' ? <FormEventoHome /> : tab === 'tienda' ? <FormProducto /> : tab === 'artistas' ? <FormArtista /> : tab === 'agenda' ? <FormAgenda /> : tab === 'eventos' ? <FormEvento /> : tab === 'musica' ? <FormMainMusic /> : tab === 'membresias' ? <FormMembresia /> : tab === 'team' ? <FormTeam /> : tab === 'hero' ? <FormHero /> : tab === 'galeria' ? <FormGallery /> : <FormSiteConfig />}
              </div>
            </div>

            {/* Columna Derecha: Listas de Gestión */}
            <div className="xl:col-span-7">
              <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-4 sm:mb-6 ml-2">
                Gestionar Existentes
              </h2>
              {tab === 'about' ? (
                <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
                  <div className="text-center">
                    <FileText className="mx-auto text-manso-cream/40 mb-4" size={48} />
                    <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-2">
                      About Us
                    </h3>
                    <p className="text-sm text-manso-cream/60 mb-4">
                      Edita el contenido de la sección About Us desde el formulario de la izquierda.
                    </p>
                    <p className="text-xs text-manso-cream/40">
                      Los cambios se reflejarán inmediatamente en la página /about
                    </p>
                  </div>
                </div>
              ) : tab === 'home' ? (
                <EventosHomeList refreshTrigger={refreshTrigger} />
              ) : tab === 'tienda' ? (
                <ItemList table="productos" title="Inventario de Tienda" refreshTrigger={refreshTrigger} />
              ) : tab === 'artistas' ? (
                <ArtistasList refreshTrigger={refreshTrigger} />
              ) : tab === 'agenda' ? (
                <AgendaList refreshTrigger={refreshTrigger} />
              ) : tab === 'eventos' ? (
                <EventosList refreshTrigger={refreshTrigger} />
              ) : tab === 'musica' ? (
                <MainMusicList refreshTrigger={refreshTrigger} />
              ) : tab === 'membresias' ? (
                <MembresiasList refreshTrigger={refreshTrigger} />
              ) : tab === 'team' ? (
                <TeamList refreshTrigger={refreshTrigger} />
              ) : tab === 'hero' ? (
                <HeroList refreshTrigger={refreshTrigger} />
              ) : tab === 'galeria' ? (
                <GalleryList refreshTrigger={refreshTrigger} />
              ) : (
                <div></div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}