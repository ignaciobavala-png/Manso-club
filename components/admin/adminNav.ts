import {
  BarChart2, Crown, ShoppingBag, Calculator, Network, MessageSquare, Mail,
  Calendar, Star, Video, User, Ticket, Home, Layout, Image, Sparkles,
  DoorOpen, FileText, BookOpen, Users, Briefcase, Globe, CalendarDays,
  type LucideIcon,
} from 'lucide-react';

export type SeccionId =
  | 'crm' | 'membresias' | 'tienda' | 'cotizador'
  | 'comunidad' | 'chat' | 'newsletter'
  | 'agenda' | 'eventos' | 'streaming' | 'artistas'
  | 'festival'
  | 'home' | 'hero' | 'galeria' | 'contenidos' | 'cultura' | 'espacio'
  | 'about' | 'manifiesto' | 'team';

export interface Seccion {
  id: SeccionId;
  label: string;
  icon: LucideIcon;
  /** Se usa poco: va dentro de "Más…" en vez de en la fila principal. */
  escondida?: boolean;
}

export interface Grupo {
  id: string;
  label: string;
  icon: LucideIcon;
  secciones: Seccion[];
}

/**
 * Jerarquía del panel: 5 grupos en vez de 24 pestañas sueltas.
 * Para sumar o sacar una pantalla se toca solo este archivo (y el mapa de
 * `Dashboard.tsx` que dice qué componente muestra cada id).
 *
 * Ya no tienen pantalla: Empleos (las postulaciones las consultará la IA) y
 * SEO (solo editaba seo_title/seo_description; el layout tiene textos por defecto).
 */
export const GRUPOS: Grupo[] = [
  {
    id: 'negocio', label: 'Negocio', icon: Briefcase,
    secciones: [
      { id: 'crm', label: 'CRM', icon: BarChart2 },
      { id: 'membresias', label: 'Membresías', icon: Crown },
      { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
      { id: 'cotizador', label: 'Cotizador', icon: Calculator },
    ],
  },
  {
    id: 'comunidad', label: 'Comunidad', icon: Network,
    secciones: [
      { id: 'comunidad', label: 'Personas y foro', icon: Network },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'newsletter', label: 'Mailing', icon: Mail },
    ],
  },
  {
    id: 'programacion', label: 'Programación', icon: CalendarDays,
    secciones: [
      { id: 'agenda', label: 'Agenda', icon: Calendar },
      { id: 'eventos', label: 'Eventos', icon: Star },
      { id: 'streaming', label: 'Streaming', icon: Video },
      { id: 'artistas', label: 'Artistas', icon: User },
    ],
  },
  {
    id: 'festival', label: 'Festival BLUR', icon: Ticket,
    secciones: [{ id: 'festival', label: 'Festival BLUR', icon: Ticket }],
  },
  {
    id: 'sitio', label: 'Sitio web', icon: Globe,
    secciones: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'hero', label: 'Hero', icon: Layout },
      { id: 'galeria', label: 'Galería', icon: Image },
      { id: 'contenidos', label: 'Contenidos', icon: Video },
      { id: 'cultura', label: 'Cultura', icon: Sparkles },
      { id: 'espacio', label: 'Espacio', icon: DoorOpen },
      // Se cambian poco: escondidas bajo "Más…".
      { id: 'about', label: 'About', icon: FileText, escondida: true },
      { id: 'manifiesto', label: 'Manifiesto', icon: BookOpen, escondida: true },
      { id: 'team', label: 'Team', icon: Users, escondida: true },
    ],
  },
];

export function grupoDe(id: SeccionId): Grupo {
  return GRUPOS.find(g => g.secciones.some(s => s.id === id)) ?? GRUPOS[0];
}
