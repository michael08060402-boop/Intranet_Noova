"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChartColumn, ChevronRight, ClipboardCheck, Clock, FileText, Layers, LifeBuoy, Plus, Trash2, Users, Zap } from "lucide-react";
import { escucharCategorias, escucharCursos, type Categoria, type Curso } from "@/firebase/cursos";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import { escucharTickets, ticketPendiente } from "@/firebase/tickets";
import "./PanelAdmin.css";

const metricas = [
  { clave: "cursos", etiqueta: "Cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "categorias", etiqueta: "Categorías", Icono: Layers, href: "/admin/cursos?categorias" },
  { clave: "alumnos", etiqueta: "Alumnos", Icono: Users, href: "/admin/alumnos" },
  { clave: "soporte", etiqueta: "Tickets abiertos", Icono: LifeBuoy, href: "/admin/soporte" },
];

const accesos = [
  { clave: "cursos", etiqueta: "Crear curso", Icono: Plus, href: "/admin/cursos?nuevo" },
  { clave: "categorias", etiqueta: "Gestionar cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "evaluaciones", etiqueta: "Crear evaluación", Icono: ClipboardCheck, href: "/admin/evaluaciones?nuevo" },
  { clave: "alumnos", etiqueta: "Ver alumnos", Icono: Users, href: "/admin/alumnos" },
  { clave: "reportes", etiqueta: "Ver reportes", Icono: ChartColumn, href: "/admin/reportes" },
];

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const claveLimpieza = "admin-actividad-limpiada";

function leerLimpieza() {
  try { return Number(localStorage.getItem(claveLimpieza)) || 0; }
  catch { return 0; }
}

export default function PanelAdmin() {
  const uid = useSesion().usuario?.uid;
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [fallos, setFallos] = useState<string[]>([]);
  const [limpiadoHasta, setLimpiadoHasta] = useState(leerLimpieza);
  const [porResponder, setPorResponder] = useState(0);

  useEffect(() => {
    const fallo = (clave: string) => () => setFallos((actuales) => [...actuales, clave]);
    const dejarCursos = escucharCursos(false, setCursos, fallo("cursos"));
    const dejarCategorias = escucharCategorias(false, setCategorias, fallo("categorias"));
    const dejarAlumnos = escucharAlumnos(setAlumnos, fallo("alumnos"));
    return () => { dejarCursos(); dejarCategorias(); dejarAlumnos(); };
  }, []);

  useEffect(() => escucharTickets(
    (tickets) => setPorResponder(tickets.filter((ticket) => ticketPendiente(ticket, uid)).length),
    () => setPorResponder(0),
  ), [uid]);

  const listas: Record<string, unknown[] | null> = { cursos, categorias, alumnos };
  const total = (clave: string) => fallos.includes(clave) ? "—" : listas[clave] ? String(listas[clave].length) : "…";

  const actividad = [
    ...(cursos ?? []).map((curso) => ({ id: `curso-${curso.id}`, tipo: "cursos" as const, texto: `Curso creado: ${curso.nombre}`, fecha: curso.creadoEn })),
    ...(alumnos ?? []).map((alumno) => ({ id: `alumno-${alumno.id}`, tipo: "alumnos" as const, texto: `Nuevo alumno: ${alumno.nombre}`, fecha: alumno.creadoEn })),
  ].filter((evento) => evento.fecha > limpiadoHasta).sort((a, b) => b.fecha - a.fecha).slice(0, 6);

  function limpiarActividad() {
    const ahora = Date.now();
    setLimpiadoHasta(ahora);
    try { localStorage.setItem(claveLimpieza, String(ahora)); } catch {}
  }

  return (
    <main className="admin-dashboard">
      <section className="admin-welcome" aria-labelledby="bienvenida-titulo">
        <h1 id="bienvenida-titulo">Panel de administración</h1>
      </section>
      <section className="admin-metrics" aria-label="Indicadores">
        {metricas.map(({ clave, etiqueta, Icono, href }) => (
          <Link href={href} key={clave} className={`admin-metric admin-tone--${clave}`}>
            <span className="admin-metric__icon">
              <Icono />
            </span>
            <div>
              <p>{etiqueta}</p>
              <strong>{clave === "soporte" ? porResponder : total(clave)}</strong>
            </div>
            <span className="admin-arrow">
              <ChevronRight />
            </span>
          </Link>
        ))}
      </section>
      <div className="admin-panels">
        <section className="admin-card" aria-labelledby="actividad-titulo">
          <div className="admin-card__titulo">
            <h2 id="actividad-titulo">
              <Clock />
              Actividad reciente
            </h2>
            {actividad.length > 0 && (
              <button type="button" className="admin-limpiar" onClick={limpiarActividad}>
                <Trash2 />
                Limpiar
              </button>
            )}
          </div>
          {actividad.length > 0 ? (
            <ul className="admin-actividad">
              {actividad.map((evento) => (
                <li key={evento.id} className={`admin-tone--${evento.tipo}`}>
                  <span className="admin-actividad__icono">{evento.tipo === "cursos" ? <BookOpen /> : <Users />}</span>
                  <span className="admin-actividad__texto">{evento.texto}</span>
                  <time dateTime={new Date(evento.fecha).toISOString()}>{formatoFecha.format(evento.fecha)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty">
              <span className="admin-empty__document">
                <FileText />
              </span>
              <p>No hay actividad reciente.</p>
              <span>Los cursos creados y los alumnos registrados se mostrarán aquí.</span>
            </div>
          )}
        </section>
        <section className="admin-card" aria-labelledby="accesos-titulo">
          <h2 id="accesos-titulo">
            <Zap />
            Accesos rápidos
          </h2>
          <div className="admin-shortcuts">
            {accesos.map(({ clave, etiqueta, Icono, href }) => (
              <Link href={href} key={clave} className={`admin-tone--${clave}`}>
                <span className="admin-shortcut__icon">
                  <Icono />
                </span>
                <span>{etiqueta}</span>
                <span className="admin-arrow">
                  <ChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
