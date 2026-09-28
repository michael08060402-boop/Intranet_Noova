"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/src/components/admin/AdminHeader.css";

const enlaces = [
  { href: "/admin", etiqueta: "Dashboard", icono: "tablero" as const },
  { href: "/admin/cursos", etiqueta: "Cursos", icono: "libro" as const },
  { href: "/admin/alumnos", etiqueta: "Alumnos", icono: "alumnos" as const },
];

function Icono({
  nombre,
}: {
  nombre: "tablero" | "libro" | "alumnos" | "buscar" | "campana" | "salir";
}) {
  const trazos = {
    tablero: "M4 4h7v7H4ZM13 4h7v4h-7ZM13 10h7v10h-7ZM4 13h7v7H4Z",
    libro: "M4 5c2.2-1 5.2-1 8 1 2.8-2 5.8-2 8-1v14c-2.2-1-5.2-1-8 1-2.8-2-5.8-2-8-1Z M12 6v14",
    alumnos: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 20v-2a6 6 0 0 1 16 0v2M19 8a3 3 0 1 0 0 6",
    buscar: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
    campana: "M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Zm4 12a2 2 0 0 0 4 0",
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
  const nombre = "Administrador";

  return (
    <header className="admin-header">
      <Link href="/admin" className="admin-header__brand" aria-label="Noova Learn Mining, inicio">
        <Image src="/assets/login/noova_logo.png" alt="" width={70} height={36} preload />
        <span>NOOVA<small>LEARN MINING</small></span>
      </Link>
      <nav className="admin-header__nav" aria-label="Secciones de administración">
        {enlaces.map((enlace) => {
          const activo = enlace.href === "/admin" ? ruta === "/admin" : ruta.startsWith(enlace.href);

          return (
            <Link key={enlace.href} href={enlace.href} className={activo ? "is-active" : ""}>
              <Icono nombre={enlace.icono} />
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>

      <form className="admin-header__search" role="search" onSubmit={(evento) => evento.preventDefault()}>
        <Icono nombre="buscar" />
        <input type="search" name="q" placeholder="Buscar curso o alumno..." aria-label="Buscar curso o alumno" />
      </form>

      <div className="admin-header__actions">
        <button type="button" className="admin-header__icon" aria-label="Notificaciones">
          <Icono nombre="campana" />
        </button>
        <div className="admin-header__user">
          <span className="admin-header__avatar">{nombre.charAt(0).toUpperCase()}</span>
          <span className="admin-header__identity">{nombre}<small>Panel</small></span>
        </div>
        <button type="button" className="admin-header__icon admin-header__logout" aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icono nombre="salir" />
        </button>
      </div>
    </header>
  );
}
