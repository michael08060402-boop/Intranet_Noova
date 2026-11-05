"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChartColumn, ChevronRight, ClipboardCheck, Layers, LifeBuoy, Plus, Users } from "lucide-react";
import { escucharCategorias, escucharCursos, type Categoria, type Curso } from "@/firebase/cursos";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import { escucharTickets, ticketPendiente } from "@/firebase/tickets";
import "./PanelAdmin.css";
import GraficosDashboard from "./GraficosDashboard";

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

export default function PanelAdmin() {
  const { usuario, perfil } = useSesion();
  const uid = usuario?.uid;
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [fallos, setFallos] = useState<string[]>([]);
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

  return (
    <main className="admin-tablero">
      <section className="admin-bienvenida" aria-labelledby="bienvenida-titulo">
        <h1 id="bienvenida-titulo">Panel de administración</h1>
        <p>Bienvenido de nuevo, {perfil?.nombre.split(" ")[0] || "Administrador"}. Aquí tienes un resumen general de la plataforma.</p>
      </section>
      <section className="admin-metricas" aria-label="Indicadores">
        {metricas.map(({ clave, etiqueta, Icono, href }) => (
          <Link href={href} key={clave} className={`admin-metrica admin-tono--${clave}`}>
            <span className="admin-metrica__icono">
              <Icono />
            </span>
            <div>
              <p>{etiqueta}</p>
              <strong>{clave === "soporte" ? porResponder : total(clave)}</strong>
            </div>
          </Link>
        ))}
      </section>
      <GraficosDashboard cursos={cursos} alumnos={alumnos} fallos={fallos}>
        <section className="admin-tarjeta" aria-labelledby="accesos-titulo">
          <h2 id="accesos-titulo">
            Accesos rápidos
          </h2>
          <div className="admin-atajos">
            {accesos.map(({ clave, etiqueta, Icono, href }) => (
              <Link href={href} key={clave} className={`admin-tono--${clave}`}>
                <span className="admin-atajo__icono">
                  <Icono />
                </span>
                <span>{etiqueta}</span>
                <span className="admin-flecha">
                  <ChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </GraficosDashboard>
    </main>
  );
}
