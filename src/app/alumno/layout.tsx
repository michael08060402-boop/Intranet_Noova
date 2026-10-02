"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { Bell, BookOpen, Calculator, ChevronDown, ClipboardCheck, Compass, Crown, House, LogOut, Menu, UserRound, X } from "lucide-react";
import logoNoova from "@/assets/marca/noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import Ondas from "@/components/alumno/Ondas";
import PiePagina from "@/components/alumno/PiePagina";
import { auth } from "@/firebase/config";
import { escucharNotificaciones, marcarLeidas, type Notificacion } from "@/firebase/notificaciones";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./AlumnoLayout.css";

const enlaces = [
  { href: "/alumno", etiqueta: "Inicio", Icono: House },
  { href: "/alumno/cursos", etiqueta: "Mis cursos", Icono: BookOpen },
  { href: "/alumno/evaluaciones", etiqueta: "Evaluaciones", Icono: ClipboardCheck },
  { href: "/alumno/explorar", etiqueta: "Explorar", Icono: Compass },
  { href: "/alumno/herramientas", etiqueta: "Herramientas", Icono: Calculator },
];

const opcionesCuenta = [
  { href: "/alumno/perfil", etiqueta: "Mi perfil", Icono: UserRound },
  { href: "/alumno/premium", etiqueta: "Planes", Icono: Crown },
];

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AlumnoLayout({ children }: LayoutProps<"/alumno">) {
  const ruta = usePathname();
  const { perfil, usuario } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const panelAvisos = useRef<HTMLDivElement>(null);
  const menuCuenta = useRef<HTMLDivElement>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [avisos, setAvisos] = useState<Notificacion[]>([]);
  const uid = usuario?.uid;
  const sinLeer = avisos.filter((aviso) => !aviso.leida);

  useEffect(() => (uid ? escucharNotificaciones(uid, setAvisos, () => setAvisos([])) : undefined), [uid]);

  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Estudiante");

  return (
    <AccesoPorRol rol="alumno">
      <div className="alumno-estructura">
        <header className="alumno-header">
          <Ondas className="alumno-header__ondas" />
          <Link href="/alumno" className="alumno-brand" aria-label="Noova Learn Mining, inicio">
            <Image src={logoNoova} alt="" preload />
          </Link>
          <nav id="alumno-nav" className={`alumno-nav ${menuAbierto ? "is-abierto" : ""}`} aria-label="Navegación del alumno">
            {enlaces.map(({ href, etiqueta, Icono }) => {
              const activo = href === "/alumno" ? ruta === href : ruta.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={activo ? "is-activo" : ""}
                  aria-current={activo ? "page" : undefined}
                  onClick={() => setMenuAbierto(false)}
                >
                  <Icono />
                  {etiqueta}
                </Link>
              );
            })}
          </nav>
          <div className="alumno-account">
            <button
              type="button"
              className="alumno-campana"
              popoverTarget="alumno-avisos"
              aria-label={sinLeer.length > 0 ? `Notificaciones: ${sinLeer.length} sin leer` : "Notificaciones"}
              title="Notificaciones"
            >
              <Bell />
              {sinLeer.length > 0 && <span>{sinLeer.length > 9 ? "9+" : sinLeer.length}</span>}
            </button>
            <button type="button" className="alumno-cuenta" popoverTarget="alumno-menu-cuenta" aria-label="Abrir menú de la cuenta">
              <span className="alumno-avatar">{nombre.charAt(0).toUpperCase()}</span>
              <span className="alumno-account__name">
                {nombre}
                <small className="alumno-account__plan">
                  {perfil?.plan === "premium" ? <><Crown />Premium</> : "Plan gratuito"}
                </small>
              </span>
              <ChevronDown />
            </button>
          </div>
          <button
            type="button"
            className="alumno-menu-boton"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-expanded={menuAbierto}
            aria-controls="alumno-nav"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? <X /> : <Menu />}
          </button>
        </header>
        <div
          id="alumno-avisos"
          ref={panelAvisos}
          popover="auto"
          className="alumno-avisos"
          aria-label="Notificaciones"
          onToggle={(evento) => {
            if (evento.newState === "closed" && uid && sinLeer.length > 0) marcarLeidas(uid, sinLeer.map((aviso) => aviso.id)).catch(() => {});
          }}
        >
          <h2>Notificaciones</h2>
          {avisos.length === 0 ? <p className="alumno-avisos__vacio">Aún no tienes notificaciones.</p> : (
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
        <div id="alumno-menu-cuenta" ref={menuCuenta} popover="auto" className="alumno-menu-cuenta" aria-label="Menú de la cuenta">
          <div className="alumno-menu-cuenta__datos">
            <strong>{capitalizarNombre(perfil?.nombre ?? nombre)}</strong>
            <span>{perfil?.correo}</span>
          </div>
          {opcionesCuenta.map(({ href, etiqueta, Icono }) => (
            <Link key={href} href={href} onClick={() => menuCuenta.current?.hidePopover()}>
              <Icono />
              {etiqueta}
            </Link>
          ))}
          <button
            type="button"
            className="alumno-menu-cuenta__salir"
            onClick={() => {
              menuCuenta.current?.hidePopover();
              confirmarSalida.current?.showModal();
            }}
          >
            <LogOut />
            Cerrar sesión
          </button>
        </div>
        <dialog ref={confirmarSalida} className="alumno-logout" aria-labelledby="alumno-logout-title">
          <h2 id="alumno-logout-title">¿Cerrar sesión?</h2>
          <p>Tendrás que volver a ingresar para continuar aprendiendo.</p>
          <div className="alumno-logout__actions">
            <button type="button" onClick={() => confirmarSalida.current?.close()}>
              Cancelar
            </button>
            <button type="button" className="alumno-logout__confirm" onClick={() => signOut(auth)}>
              Cerrar sesión
            </button>
          </div>
        </dialog>
        {children}
        {ruta === "/alumno" && <PiePagina />}
      </div>
    </AccesoPorRol>
  );
}
