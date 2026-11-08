// El ancho lo manejan el Dashboard y su barra (que ocupa toda la pantalla).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin className="min-h-screen bg-black text-manso-cream">
      {children}
    </div>
  );
}
