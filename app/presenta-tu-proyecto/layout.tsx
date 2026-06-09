import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Presentá tu proyecto | Manso Club',
  description: '¿Tenés un proyecto? Presentalo en Manso Club. Recibimos propuestas de eventos, arte y cultura.',
  openGraph: {
    title: 'Presentá tu proyecto | Manso Club',
    description: 'Presentá tu proyecto en Manso Club.',
    images: [{ url: '/og-image.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Presentá tu proyecto | Manso Club',
    description: 'Presentá tu proyecto en Manso Club.',
    images: ['/og-image.png'],
  },
};

export default function PresentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
