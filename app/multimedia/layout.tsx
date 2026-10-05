import type { Metadata } from 'next';
import { og } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Multimedia | Manso Club',
  description: 'Videos, mixes y contenido audiovisual de Manso Club y sus artistas.',
  openGraph: og({
    title: 'Multimedia | Manso Club',
    description: 'Videos, mixes y contenido audiovisual de Manso Club.',
  }),
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
