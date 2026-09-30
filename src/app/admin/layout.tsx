"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, LayoutDashboard, LogOut, Search, Users } from "lucide-react";
import isotipo from "@/assets/marca/isotipo-noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./AdminLayout.css";

const enlaces = [
  { href: "/admin", etiqueta: "Dashboard", Icono: LayoutDashboard },
  { href: "/admin/cursos", etiqueta: "Cursos", Icono: BookOpen },
  { href: "/admin/alumnos", etiqueta: "Alumnos", Icono: Users },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const ruta = usePathname();
  const { perfil } = useSesion();
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Administrador");

  return (
    <AccesoPorRol rol="admin">
      <div className="admin-shell">
        <header className="admin-header">
          <Link href="/admin" className="admin-header__brand" aria-label="Noova Learn Mining, inicio">
            <Image src={isotipo} alt="" preload />
            <span>
              NOOVA<small>LEARN MINING</small>
            </span>
          </Link>
          <nav className="admin-header__nav" aria-label="Secciones de administración">
            {enlaces.map(({ href, etiqueta, Icono }) => {
              const activo = href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);

              return (
                <Link key={href} href={href} className={activo ? "is-active" : ""}>
                  <Icono />
                  {etiqueta}
                </Link>
              );
            })}
          </nav>

          <form className="admin-header__search" role="search" onSubmit={(evento) => evento.preventDefault()}>
            <Search />
            <input
              type="search"
              name="q"
              placeholder="Buscar curso o alumno..."
              aria-label="Buscar curso o alumno"
            />
          </form>

          <div className="admin-header__actions">
            <button type="button" className="admin-header__icon" aria-label="Notificaciones">
              <Bell />
            </button>
            <div className="admin-header__user">
              <span className="admin-header__avatar">{nombre.charAt(0).toUpperCase()}</span>
              <span className="admin-header__identity">
                {nombre}
                <small>Admin</small>
              </span>
            </div>
            <button
              type="button"
              className="admin-header__icon admin-header__logout"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut />
            </button>
          </div>
        </header>
        {children}
      </div>
    </AccesoPorRol>
  );
}
