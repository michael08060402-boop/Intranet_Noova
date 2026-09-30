"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { Bell, BookOpen, Calculator, ChevronDown, Compass, House, LogOut } from "lucide-react";
import logoNoova from "@/assets/marca/noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import { auth } from "@/firebase/config";
import { escucharNotificaciones, marcarLeidas, type Notificacion } from "@/firebase/notificaciones";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./AlumnoLayout.css";

const enlaces = [
  { href: "/alumno", etiqueta: "Inicio", Icono: House },
  { href: "/alumno/cursos", etiqueta: "Mis cursos", Icono: BookOpen },
  { href: "/alumno/explorar", etiqueta: "Explorar", Icono: Compass },
];

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AlumnoLayout({ children }: LayoutProps<"/alumno">) {
  const ruta = usePathname();
  const { perfil, usuario } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const panelAvisos = useRef<HTMLDivElement>(null);
  const [avisos, setAvisos] = useState<Notificacion[]>([]);
  const uid = usuario?.uid;
  const sinLeer = avisos.filter((aviso) => !aviso.leida);

  useEffect(() => (uid ? escucharNotificaciones(uid, setAvisos, () => setAvisos([])) : undefined), [uid]);

  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Estudiante");

  return (
    <AccesoPorRol rol="alumno">
      <div className="student-shell">
        <header className="student-header">
          <Link href="/alumno" className="student-brand" aria-label="Noova Learn Mining, inicio">
            <Image src={logoNoova} alt="" preload />
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
            <button
              type="button"
              className="student-campana"
              popoverTarget="student-avisos"
              aria-label={sinLeer.length > 0 ? `Notificaciones: ${sinLeer.length} sin leer` : "Notificaciones"}
              title="Notificaciones"
            >
              <Bell />
              {sinLeer.length > 0 && <span>{sinLeer.length > 9 ? "9+" : sinLeer.length}</span>}
            </button>
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
        {/* Al cerrar el panel, lo visto se marca como leído. */}
        <div
          id="student-avisos"
          ref={panelAvisos}
          popover="auto"
          className="student-avisos"
          aria-label="Notificaciones"
          onToggle={(evento) => {
            if (evento.newState === "closed" && uid && sinLeer.length > 0) marcarLeidas(uid, sinLeer.map((aviso) => aviso.id)).catch(() => {});
          }}
        >
          <h2>Notificaciones</h2>
          {avisos.length === 0 ? <p className="student-avisos__vacio">Aún no tienes notificaciones.</p> : (
            <ul>
              {avisos.map((aviso) => (
                <li key={aviso.id} className={aviso.leida ? "" : "is-nueva"}>
                  <Link href={aviso.enlace || "/alumno"} onClick={() => panelAvisos.current?.hidePopover()}>
                    <strong>{aviso.titulo}</strong>
                    {aviso.texto && <span>{aviso.texto}</span>}
                    <small>{formatoFecha.format(aviso.creadoEn)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
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
