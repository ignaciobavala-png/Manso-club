import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear cuenta | Manso Club',
  description: 'Creá tu cuenta en Manso Club.',
  robots: { index: false },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
