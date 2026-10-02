"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { Bell, BookOpen, ChartColumn, ClipboardCheck, LayoutDashboard, LogOut, Users } from "lucide-react";
import logoNoova from "@/assets/marca/noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import { auth } from "@/firebase/config";
import { escucharIntentos } from "@/firebase/evaluaciones";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./AdminLayout.css";

const enlaces = [
  { href: "/admin", etiqueta: "Dashboard", Icono: LayoutDashboard },
  { href: "/admin/cursos", etiqueta: "Cursos", Icono: BookOpen },
  { href: "/admin/evaluaciones", etiqueta: "Evaluaciones", Icono: ClipboardCheck },
  { href: "/admin/alumnos", etiqueta: "Alumnos", Icono: Users },
  { href: "/admin/reportes", etiqueta: "Reportes", Icono: ChartColumn },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const ruta = usePathname();
  const { perfil } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Administrador");
  const [porCalificar, setPorCalificar] = useState(0);

  useEffect(() => escucharIntentos("entregado", (intentos) => setPorCalificar(intentos.length), () => setPorCalificar(0)), []);

  return (
    <AccesoPorRol rol="admin">
      <div className="admin-shell">
        <header className="admin-header">
          <Link
            href="/admin"
            className="admin-header__brand"
            aria-label="Noova Learn Mining, panel de administración"
          >
            <Image src={logoNoova} alt="" preload />
          </Link>
          <nav className="admin-header__nav" aria-label="Secciones de administración">
            {enlaces.map(({ href, etiqueta, Icono }) => {
              const activo = href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={activo ? "is-activo" : ""}
                  aria-current={activo ? "page" : undefined}
                >
                  <Icono />
                  {etiqueta}
                </Link>
              );
            })}
          </nav>
          <div className="admin-header__actions">
            <Link
              href="/admin/evaluaciones"
              className="admin-header__campana"
              aria-label={porCalificar > 0 ? `${porCalificar} entregas por calificar` : "Notificaciones: no hay entregas por calificar"}
              title={porCalificar > 0 ? `${porCalificar} entregas por calificar` : "No hay entregas por calificar"}
            >
              <Bell />
              {porCalificar > 0 && <span>{porCalificar > 99 ? "99+" : porCalificar}</span>}
            </Link>
            <span className="admin-header__avatar">{nombre.charAt(0).toUpperCase()}</span>
            <span className="admin-header__identity">
              {nombre}
              <small>Administrador</small>
            </span>
            <button
              type="button"
              className="admin-header__logout"
              onClick={() => confirmarSalida.current?.showModal()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut />
            </button>
          </div>
          <dialog ref={confirmarSalida} className="admin-logout" aria-labelledby="admin-logout-title">
            <h2 id="admin-logout-title">¿Cerrar sesión?</h2>
            <p>Tendrás que volver a ingresar para administrar la plataforma.</p>
            <div className="admin-logout__actions">
              <button type="button" onClick={() => confirmarSalida.current?.close()}>
                Cancelar
              </button>
              <button type="button" className="admin-logout__confirm" onClick={() => signOut(auth)}>
                Cerrar sesión
              </button>
            </div>
          </dialog>
        </header>
        {children}
      </div>
    </AccesoPorRol>
  );
}
