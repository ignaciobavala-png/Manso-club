import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Layout/Navbar";
import { FooterPlayer } from "@/components/Layout/FooterPlayer";
import { WhatsAppButton } from "@/components/UI/WhatsAppButton";

export const metadata: Metadata = {
  title: "Manso Club | Espacio Creativo",
  description: "Cultura electrónica y diseño en Buenos Aires",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Layout con colores correctos y footer visible */
    <html lang="es" className="scroll-smooth">
      <body className="antialiased text-manso-cream selection:bg-manso-terra selection:text-manso-white min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-auto bg-white">
          {children}
          <FooterPlayer /> {/* Movido acá para que herede el flujo de la página */}
        </main>
        <WhatsAppButton />
      </body>
    </html>
  );
}