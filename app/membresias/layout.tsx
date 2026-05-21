import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membresías | Manso Club',
  description: 'Membresías de Manso Club. Espacio de coworking, eventos y comunidad para creadores en Buenos Aires.',
  openGraph: {
    title: 'Membresías | Manso Club',
    description: 'Membresías de Manso Club. Espacio de coworking, eventos y comunidad.',
    images: [{ url: '/manso-logo-black.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Membresías | Manso Club',
    description: 'Membresías de Manso Club. Espacio de coworking, eventos y comunidad.',
    images: ['/manso-logo-black.png'],
  },
};

export default function MembresiasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
