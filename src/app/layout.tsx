import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SesionProvider from "@/components/acceso/SesionProvider";
import Accesibilidad from "@/components/acceso/Accesibilidad";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noova Learn Mining | Capacitación Minera",
  description:
    "Plataforma de capacitación minera y herramientas técnicas de Contratistas Generales Noova S.A.C.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={geistSans.variable}>
      <body>
        <Accesibilidad />
        <SesionProvider>{children}</SesionProvider>
      </body>
    </html>
  );
}
