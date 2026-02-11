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
    <html lang="es">
      <body className="antialiased bg-black text-manso-cream selection:bg-manso-cream selection:text-black">
        <Navbar />
        {children}
        <WhatsAppButton />
        <FooterPlayer />
      </body>
    </html>
  );
}