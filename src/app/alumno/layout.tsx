"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { Bell, BookOpen, Calculator, ChevronDown, ClipboardCheck, Compass, Crown, House, LifeBuoy, LogOut, Menu, UserRound, X } from "lucide-react";
import logoNoova from "@/assets/marca/noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import Ondas from "@/components/alumno/Ondas";
import PiePagina from "@/components/alumno/PiePagina";
import { auth } from "@/firebase/config";
import { borrarNotificaciones, escucharNotificaciones, marcarLeidas, type Notificacion } from "@/firebase/notificaciones";
import { capitalizarNombre } from "@/firebase/perfiles";
import { escucharTicketsDe } from "@/firebase/tickets";
import { herramientas } from "./herramientas/lista";
import "./AlumnoLayout.css";

const enlaces = [
  { href: "/alumno", etiqueta: "Inicio", Icono: House },
  { href: "/alumno/cursos", etiqueta: "Mis cursos", Icono: BookOpen },
  { href: "/alumno/evaluaciones", etiqueta: "Evaluaciones", Icono: ClipboardCheck },
  { href: "/alumno/explorar", etiqueta: "Explorar", Icono: Compass },
];

const opcionesCuenta = [
  { href: "/alumno/perfil", etiqueta: "Mi perfil", Icono: UserRound },
  { href: "/alumno/premium", etiqueta: "Planes", Icono: Crown },
  { href: "/alumno/soporte", etiqueta: "Soporte", Icono: LifeBuoy },
];

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AlumnoLayout({ children }: LayoutProps<"/alumno">) {
  const ruta = usePathname();
  const { perfil, usuario } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const panelAvisos = useRef<HTMLDivElement>(null);
  const menuCuenta = useRef<HTMLDivElement>(null);
  const menuHerramientas = useRef<HTMLDivElement>(null);
  const botonHerramientas = useRef<HTMLButtonElement>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [avisos, setAvisos] = useState<Notificacion[]>([]);
  const [respuestasNuevas, setRespuestasNuevas] = useState(0);
  const uid = perfil?.rol === "alumno" && perfil.estado === "activo" ? usuario?.uid : undefined;
  const sinLeer = avisos.filter((aviso) => !aviso.leida);

  useEffect(() => (uid ? escucharNotificaciones(uid, setAvisos, () => setAvisos([])) : undefined), [uid]);
  useEffect(() => (uid ? escucharTicketsDe(uid, (tickets) => setRespuestasNuevas(tickets.filter((ticket) => ticket.sinLeer).length), () => setRespuestasNuevas(0)) : undefined), [uid]);

  const enHerramientas = ruta.startsWith("/alumno/herramientas");

  function borrar(ids: string[]) {
    if (uid) borrarNotificaciones(uid, ids).catch(() => {});
  }

  function ubicarMenuHerramientas() {
    const boton = botonHerramientas.current?.getBoundingClientRect();
    const menu = menuHerramientas.current;
    if (!boton || !menu) return;
    menu.style.top = `${boton.bottom + 8}px`;
    menu.style.left = `${Math.max(8, Math.min(boton.left, window.innerWidth - 308))}px`;
  }

  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Estudiante");

  return (
    <AccesoPorRol rol="alumno">
      <div className="alumno-estructura">
        <header className="alumno-encabezado">
          <Ondas className="alumno-encabezado__ondas" />
          <Link href="/alumno" className="alumno-marca" aria-label="Noova Learn Mining, inicio">
            <Image src={logoNoova} alt="" preload />
          </Link>
          <nav id="alumno-navegacion" className={`alumno-navegacion ${menuAbierto ? "is-abierto" : ""}`} aria-label="Navegación del alumno">
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
            <button
              ref={botonHerramientas}
              type="button"
              className={enHerramientas ? "is-activo" : ""}
              popoverTarget="alumno-menu-herramientas"
              aria-current={enHerramientas ? "page" : undefined}
            >
              <Calculator />
              Herramientas
              <ChevronDown className="alumno-navegacion__flecha" />
            </button>
          </nav>
          <div className="alumno-usuario">
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
              <span className="alumno-avatar">{perfil?.foto ? <Image src={perfil.foto} alt="" width={34} height={34} unoptimized /> : nombre.charAt(0).toUpperCase()}</span>
              <span className="alumno-usuario__nombre">
                {nombre}
                <small className="alumno-usuario__plan">
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
            aria-controls="alumno-navegacion"
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
          <div className="alumno-avisos__cabecera">
            <h2>Notificaciones</h2>
            {avisos.length > 0 && <button type="button" onClick={() => borrar(avisos.map((aviso) => aviso.id))}>Borrar todas</button>}
          </div>
          {avisos.length === 0 ? <p className="alumno-avisos__vacio">Aún no tienes notificaciones.</p> : (
            <ul>
              {avisos.map((aviso) => (
                <li key={aviso.id} className={aviso.leida ? "" : "is-nueva"}>
                  <Link href={aviso.enlace || "/alumno"} onClick={() => panelAvisos.current?.hidePopover()}>
                    <strong>{aviso.titulo}</strong>
                    {aviso.texto && <span>{aviso.texto}</span>}
                    <small>{formatoFecha.format(aviso.creadoEn)}</small>
                  </Link>
                  <button type="button" className="alumno-avisos__borrar" aria-label={`Borrar notificación: ${aviso.titulo}`} title="Borrar" onClick={() => borrar([aviso.id])}>
                    <X />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          id="alumno-menu-herramientas"
          ref={menuHerramientas}
          popover="auto"
          className="alumno-menu-herramientas"
          aria-label="Herramientas"
          onBeforeToggle={(evento) => { if (evento.newState === "open") ubicarMenuHerramientas(); }}
        >
          {herramientas.map(({ href, nombre: titulo, Icono }) => (
            <Link key={href} href={href} aria-current={ruta === href ? "page" : undefined} onClick={() => { menuHerramientas.current?.hidePopover(); setMenuAbierto(false); }}>
              <Icono />
              {titulo}
            </Link>
          ))}
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
              {href === "/alumno/soporte" && respuestasNuevas > 0 && <span className="alumno-menu-cuenta__nuevas" aria-label={`${respuestasNuevas} sin leer`}>{respuestasNuevas}</span>}
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
        <dialog ref={confirmarSalida} className="alumno-salir" aria-labelledby="alumno-logout-title">
          <h2 id="alumno-logout-title">¿Cerrar sesión?</h2>
          <div className="alumno-salir__acciones">
            <button type="button" onClick={() => confirmarSalida.current?.close()}>
              Cancelar
            </button>
            <button type="button" className="alumno-salir__confirmar" onClick={() => signOut(auth)}>
              Cerrar sesión
            </button>
          </div>
        </dialog>
        {children}
        {ruta === "/alumno" && <PiePagina respuestasNuevas={respuestasNuevas} />}
      </div>
    </AccesoPorRol>
  );
}
