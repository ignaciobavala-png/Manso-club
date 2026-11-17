import type { Metadata } from 'next';
import { Inter, Big_Shoulders } from 'next/font/google';
import '@/components/org/org.css';

const cuerpo = Inter({ subsets: ['latin'], variable: '--font-org-cuerpo' });
const titulo = Big_Shoulders({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-org-titulo' });

// Interna: sin buscador, sin enlace desde el sitio, y fuera del sitemap/robots.
export const metadata: Metadata = {
  title: 'Organización · BLUR',
  robots: { index: false, follow: false, nocache: true },
};

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${cuerpo.variable} ${titulo.variable}`}>{children}</div>;
}
