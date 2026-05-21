import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agenda | Manso Club',
  description: 'Eventos, fiestas y actividades culturales en Manso Club. Enterate de las próximas fechas en Buenos Aires.',
  openGraph: {
    title: 'Agenda | Manso Club',
    description: 'Eventos, fiestas y actividades culturales en Manso Club.',
    images: [{ url: '/manso-logo-black.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agenda | Manso Club',
    description: 'Eventos, fiestas y actividades culturales en Manso Club.',
    images: ['/manso-logo-black.png'],
  },
};

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
