import type { Metadata } from 'next';
import { og } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Agenda | Manso Club',
  description: 'Eventos, fiestas y actividades culturales en Manso Club. Enterate de las próximas fechas en Buenos Aires.',
  openGraph: og({
    title: 'Agenda | Manso Club',
    description: 'Eventos, fiestas y actividades culturales en Manso Club.',
  }),
  twitter: {
    card: 'summary_large_image',
    title: 'Agenda | Manso Club',
    description: 'Eventos, fiestas y actividades culturales en Manso Club.',
    images: ['/og-image.png'],
  },
};

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
