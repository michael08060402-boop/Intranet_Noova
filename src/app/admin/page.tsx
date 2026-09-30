"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Clock, FileText, Layers, Plus, Users, Zap } from "lucide-react";
import { escucharCategorias, escucharCursos, type Categoria, type Curso } from "@/firebase/cursos";
import { escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import "./PanelAdmin.css";

const metricas = [
  { clave: "cursos", etiqueta: "Cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "categorias", etiqueta: "Categorías", Icono: Layers, href: "/admin/cursos?categorias" },
  { clave: "alumnos", etiqueta: "Alumnos", Icono: Users, href: "/admin/alumnos" },
];

const accesos = [
  { clave: "cursos", etiqueta: "Crear curso", Icono: Plus, href: "/admin/cursos?nuevo" },
  { clave: "categorias", etiqueta: "Gestionar cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "alumnos", etiqueta: "Ver alumnos", Icono: Users, href: "/admin/alumnos" },
];

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function PanelAdmin() {
  // null: cargando.
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [fallos, setFallos] = useState<string[]>([]);

  useEffect(() => {
    // Cada consulta falla por separado (por ejemplo, alumnos sin permisos) sin ocultar las demás.
    const fallo = (clave: string) => () => setFallos((actuales) => [...actuales, clave]);
    const dejarCursos = escucharCursos(false, setCursos, fallo("cursos"));
    const dejarCategorias = escucharCategorias(false, setCategorias, fallo("categorias"));
    const dejarAlumnos = escucharAlumnos(setAlumnos, fallo("alumnos"));
    return () => { dejarCursos(); dejarCategorias(); dejarAlumnos(); };
  }, []);

  const listas: Record<string, unknown[] | null> = { cursos, categorias, alumnos };
  const total = (clave: string) => fallos.includes(clave) ? "—" : listas[clave] ? String(listas[clave].length) : "…";

  const actividad = [
    ...(cursos ?? []).map((curso) => ({ id: `curso-${curso.id}`, tipo: "cursos" as const, texto: `Curso creado: ${curso.nombre}`, fecha: curso.creadoEn })),
    ...(alumnos ?? []).map((alumno) => ({ id: `alumno-${alumno.id}`, tipo: "alumnos" as const, texto: `Nuevo alumno: ${alumno.nombre}`, fecha: alumno.creadoEn })),
  ].filter((evento) => evento.fecha > 0).sort((a, b) => b.fecha - a.fecha).slice(0, 6);

  return (
    <main className="admin-dashboard">
      <section className="admin-welcome" aria-labelledby="bienvenida-titulo">
        <p className="admin-kicker">Panel administrativo</p>
        <h1 id="bienvenida-titulo">Panel de administración</h1>
        <p className="admin-lead">Administra el contenido de Noova Learn Mining.</p>
      </section>
      <section className="admin-metrics" aria-label="Indicadores">
        {metricas.map(({ clave, etiqueta, Icono, href }) => (
          <Link href={href} key={clave} className={`admin-metric admin-tone--${clave}`}>
            <span className="admin-metric__icon">
              <Icono />
            </span>
            <div>
              <p>{etiqueta}</p>
              <strong>{total(clave)}</strong>
            </div>
            <span className="admin-arrow">
              <ChevronRight />
            </span>
          </Link>
        ))}
      </section>
      <div className="admin-panels">
        <section className="admin-card" aria-labelledby="actividad-titulo">
          <h2 id="actividad-titulo">
            <Clock />
            Actividad reciente
          </h2>
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
              <p>Aún no hay actividad registrada.</p>
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
