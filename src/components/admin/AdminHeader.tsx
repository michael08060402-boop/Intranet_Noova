"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/config";
import "@/src/components/admin/AdminHeader.css";
import { useSesion } from "@/src/components/auth/SesionProvider";
import { capitalizarNombre } from "@/src/firebase/perfiles";

const enlaces = [
  { href: "/admin", etiqueta: "Dashboard", icono: "tablero" as const },
  { href: "/admin/cursos", etiqueta: "Cursos", icono: "libro" as const },
  { href: "/admin/alumnos", etiqueta: "Alumnos", icono: "alumnos" as const },
];

function Icono({ nombre }: { nombre: "tablero" | "libro" | "alumnos" | "salir" }) {
  const trazos = {
    tablero: "M4 4h7v7H4ZM13 4h7v4h-7ZM13 10h7v10h-7ZM4 13h7v7H4Z",
    libro: "M4 5c2.2-1 5.2-1 8 1 2.8-2 5.8-2 8-1v14c-2.2-1-5.2-1-8 1-2.8-2-5.8-2-8-1Z M12 6v14",
    alumnos: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 20v-2a6 6 0 0 1 16 0v2M19 8a3 3 0 1 0 0 6",
    salir: "M9 4H4v16h5M9 12h12m-5-5 5 5-5 5",
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  );
}

export default function AdminHeader() {
  const ruta = usePathname();
  const { perfil } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Administrador");

  return (
    <header className="admin-header">
      <Link href="/admin" className="admin-header__brand" aria-label="Noova Learn Mining, panel de administración">
        <Image src="/assets/login/noova_logo.webp" alt="" width={70} height={36} preload />
        <span className="admin-header__texto"><span className="admin-header__nombre">NOOVA</span><small>LEARN MINING</small></span>      </Link>
      <nav className="admin-header__nav" aria-label="Secciones de administración">
        {enlaces.map((enlace) => {
          const activo = enlace.href === "/admin" ? ruta === "/admin" : ruta.startsWith(enlace.href);

          return (
            <Link key={enlace.href} href={enlace.href} className={activo ? "is-active" : ""} aria-current={activo ? "page" : undefined}>
              <Icono nombre={enlace.icono} />
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>
      <div className="admin-header__actions">
        <span className="admin-header__avatar">{nombre.charAt(0).toUpperCase()}</span>
        <span className="admin-header__identity">{nombre}<small>Administrador</small></span>
        <button type="button" className="admin-header__logout" onClick={() => confirmarSalida.current?.showModal()} aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icono nombre="salir" />
        </button>
      </div>
      <dialog ref={confirmarSalida} className="admin-logout" aria-labelledby="admin-logout-title">
        <h2 id="admin-logout-title">¿Cerrar sesión?</h2>
        <p>Tendrás que volver a ingresar para administrar la plataforma.</p>
        <div className="admin-logout__actions">
          <button type="button" onClick={() => confirmarSalida.current?.close()}>Cancelar</button>
          <button type="button" className="admin-logout__confirm" onClick={() => signOut(auth)}>Cerrar sesión</button>
        </div>
      </dialog>
    </header>
  );
}
