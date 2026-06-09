import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multimedia | Manso Club',
  description: 'Videos, mixes y contenido audiovisual de Manso Club y sus artistas.',
  openGraph: {
    title: 'Multimedia | Manso Club',
    description: 'Videos, mixes y contenido audiovisual de Manso Club.',
    images: [{ url: '/og-image.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multimedia | Manso Club',
    description: 'Videos, mixes y contenido audiovisual de Manso Club.',
    images: ['/og-image.png'],
  },
};

export default function MultimediaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
