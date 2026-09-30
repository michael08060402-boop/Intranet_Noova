"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { BookOpen, Calculator, ChevronDown, Compass, Crown, House, LogOut } from "lucide-react";
import isotipo from "@/assets/marca/isotipo-noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import { auth } from "@/firebase/config";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./AlumnoLayout.css";

const enlaces = [
  { href: "/alumno", etiqueta: "Inicio", Icono: House },
  { href: "/alumno/cursos", etiqueta: "Mis cursos", Icono: BookOpen },
  { href: "/alumno/explorar", etiqueta: "Explorar", Icono: Compass },
];

export default function AlumnoLayout({ children }: LayoutProps<"/alumno">) {
  const ruta = usePathname();
  const { perfil } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Estudiante");

  return (
    <AccesoPorRol rol="alumno">
      <div className="student-shell">
        <header className="student-header">
          <Link href="/alumno" className="student-brand" aria-label="Noova Learn Mining, inicio">
            <Image src={isotipo} alt="" preload />
            <span className="student-brand__texto">
              <span className="student-brand__nombre">NOOVA</span>
              <small>LEARN MINING</small>
            </span>
          </Link>
          <nav className="student-nav" aria-label="Navegación del alumno">
            {enlaces.map(({ href, etiqueta, Icono }) => {
              const activo = ruta === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={activo ? "is-active" : ""}
                  aria-current={activo ? "page" : undefined}
                >
                  <Icono />
                  {etiqueta}
                </Link>
              );
            })}
            <button type="button">
              <Calculator />
              Herramientas
              <ChevronDown />
            </button>
          </nav>
          <div className="student-account">
            {perfil?.plan === "gratis" && (
              <button
                type="button"
                className="student-premium"
                aria-label="Hazte Premium"
                title="Hazte Premium"
              >
                <Crown />
                <span>Hazte Premium</span>
              </button>
            )}
            <span className="student-avatar">{nombre.charAt(0).toUpperCase()}</span>
            <span className="student-account__name">
              {nombre}
              <small className="student-account__plan">
                {perfil?.plan === "premium" ? "Premium" : "Plan gratuito"}
              </small>
            </span>
            <button
              type="button"
              onClick={() => confirmarSalida.current?.showModal()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut />
            </button>
          </div>
        </header>
        <dialog ref={confirmarSalida} className="student-logout" aria-labelledby="student-logout-title">
          <h2 id="student-logout-title">¿Cerrar sesión?</h2>
          <p>Tendrás que volver a ingresar para continuar aprendiendo.</p>
          <div className="student-logout__actions">
            <button type="button" onClick={() => confirmarSalida.current?.close()}>
              Cancelar
            </button>
            <button type="button" className="student-logout__confirm" onClick={() => signOut(auth)}>
              Cerrar sesión
            </button>
          </div>
        </dialog>
        {children}
      </div>
    </AccesoPorRol>
  );
}
