"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { Bell, BookOpen, ChartColumn, ChevronDown, ChevronRight, ClipboardCheck, LayoutDashboard, LifeBuoy, LogOut, Menu, Users, X } from "lucide-react";
import logoNoova from "@/assets/marca/noova.webp";
import AccesoPorRol from "@/components/acceso/AccesoPorRol";
import { useSesion } from "@/components/acceso/SesionProvider";
import { auth } from "@/firebase/config";
import { escucharIntentos, type Intento } from "@/firebase/evaluaciones";
import { capitalizarNombre } from "@/firebase/perfiles";
import { escucharTickets, ticketPendiente, type Ticket } from "@/firebase/tickets";
import "./AdminLayout.css";

const claveVisto = "admin-pendientes-vistos";

function leerVisto() {
  try { return Number(localStorage.getItem(claveVisto)) || 0; }
  catch { return 0; }
}

const enlaces = [
  { href: "/admin", etiqueta: "Dashboard", Icono: LayoutDashboard },
  { href: "/admin/cursos", etiqueta: "Cursos", Icono: BookOpen },
  { href: "/admin/evaluaciones", etiqueta: "Evaluaciones", Icono: ClipboardCheck },
  { href: "/admin/alumnos", etiqueta: "Alumnos", Icono: Users },
  { href: "/admin/reportes", etiqueta: "Reportes", Icono: ChartColumn },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const ruta = usePathname();
  const { perfil, usuario } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const panelPendientes = useRef<HTMLDivElement>(null);
  const menuCuenta = useRef<HTMLDivElement>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "Administrador");
  const uid = usuario?.uid;
  const [entregas, setEntregas] = useState<Intento[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [vistoHasta, setVistoHasta] = useState(leerVisto);

  const esAdmin = perfil?.rol === "admin" && perfil.estado === "activo";

  useEffect(() => (esAdmin ? escucharIntentos("entregado", setEntregas, () => setEntregas([])) : undefined), [esAdmin]);
  useEffect(() => (esAdmin ? escucharTickets(
    (lista) => setTickets(lista.filter((ticket) => ticketPendiente(ticket, uid))),
    () => setTickets([]),
  ) : undefined), [esAdmin, uid]);

  const porCalificar = entregas.length;
  const porResponder = tickets.length;
  const nuevos = entregas.filter((intento) => (intento.fin ?? intento.inicio) > vistoHasta).length
    + tickets.filter((ticket) => ticket.actualizadoEn > vistoHasta).length;

  function marcarVisto() {
    const ahora = Date.now();
    setVistoHasta(ahora);
    try { localStorage.setItem(claveVisto, String(ahora)); } catch {}
  }

  const avisos = [
    { cantidad: porCalificar, texto: porCalificar === 1 ? "entrega por calificar" : "entregas por calificar", href: "/admin/evaluaciones", Icono: ClipboardCheck },
    { cantidad: porResponder, texto: porResponder === 1 ? "ticket por responder" : "tickets por responder", href: "/admin/soporte", Icono: LifeBuoy },
  ].filter((aviso) => aviso.cantidad > 0);

  return (
    <AccesoPorRol rol="admin">
      <div className="admin-estructura">
        <header className="admin-encabezado">
          <Link
            href="/admin"
            className="admin-encabezado__marca"
            aria-label="Noova Learn Mining, panel de administración"
          >
            <Image src={logoNoova} alt="" preload />
          </Link>
          <nav id="admin-navegacion" className={`admin-encabezado__navegacion ${menuAbierto ? "is-abierto" : ""}`} aria-label="Secciones de administración" onKeyDown={(evento) => {
            if (evento.key === "Escape") { setMenuAbierto(false); document.getElementById("admin-menu-boton")?.focus(); }
          }}>
            {enlaces.map(({ href, etiqueta, Icono }) => {
              const activo = href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);

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
          <div className="admin-encabezado__acciones">
            <button
              type="button"
              className="admin-encabezado__campana"
              popoverTarget="admin-pendientes"
              aria-label={nuevos > 0 ? `Pendientes: ${nuevos} nuevos` : "Pendientes"}
              title="Pendientes"
            >
              <Bell />
              {nuevos > 0 && <span>{nuevos > 99 ? "99+" : nuevos}</span>}
            </button>
            <button type="button" className="admin-encabezado__cuenta" popoverTarget="admin-menu-cuenta" aria-label="Abrir menú de la cuenta">
            <span className="admin-encabezado__avatar">{nombre.charAt(0).toUpperCase()}</span>
            <span className="admin-encabezado__identidad">
              {nombre}
              <small>Administrador</small>
            </span>
            <ChevronDown />
            </button>
            <button id="admin-menu-boton" type="button" className="admin-encabezado__menu" aria-controls="admin-navegacion" aria-expanded={menuAbierto} aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuAbierto(!menuAbierto)}>{menuAbierto ? <X /> : <Menu />}</button>
          </div>
          <div id="admin-menu-cuenta" ref={menuCuenta} popover="auto" className="admin-menu-cuenta" aria-label="Menú de la cuenta">
            <strong>{nombre}</strong><small>Administrador</small>
            <button type="button" onClick={() => { menuCuenta.current?.hidePopover(); confirmarSalida.current?.showModal(); }}><LogOut />Cerrar sesión</button>
          </div>
          <div
            id="admin-pendientes"
            ref={panelPendientes}
            popover="auto"
            className="admin-pendientes"
            aria-label="Pendientes"
            onToggle={(evento) => { if (evento.newState === "open") marcarVisto(); }}
          >
            <h2>Pendientes</h2>
            {avisos.length === 0 ? <p>No tienes pendientes.</p> : (
              <ul>
                {avisos.map(({ cantidad, texto, href, Icono }) => (
                  <li key={href}>
                    <Link href={href} onClick={() => panelPendientes.current?.hidePopover()}>
                      <Icono />
                      <span><strong>{cantidad}</strong> {texto}</span>
                      <ChevronRight />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <dialog ref={confirmarSalida} className="admin-salir" aria-labelledby="admin-logout-title">
            <h2 id="admin-logout-title">¿Cerrar sesión?</h2>
            <p>Tendrás que volver a ingresar para administrar la plataforma.</p>
            <div className="admin-salir__acciones">
              <button type="button" onClick={() => confirmarSalida.current?.close()}>
                Cancelar
              </button>
              <button type="button" className="admin-salir__confirmar" onClick={() => signOut(auth)}>
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
