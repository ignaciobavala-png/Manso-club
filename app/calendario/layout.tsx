import type { Metadata } from 'next';
import { og } from '@/lib/seo';

const titulo = 'Calendario | Manso Club';
const descripcion =
  'El calendario de Manso Club: talleres, encuentros, cowork y eventos mes a mes en Colegiales, Buenos Aires.';

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  openGraph: og({ title: titulo, description: descripcion }),
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
