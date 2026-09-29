"use client";

import { useState } from "react";
import Icono from "./StudentIcon";
import "./StudentCourses.css";

const filtros = ["Todos", "En progreso", "Completados", "Sin empezar"] as const;

export default function StudentCourses() {
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>("Todos");
  const [vista, setVista] = useState<"cuadricula" | "lista">("cuadricula");

  return (
    <main className="my-courses" id="cursos">
      <div className="my-courses__top">
        <header className="my-courses__heading">
          <h1>Mis <span>cursos</span></h1>
          <p>Continúa tu formación donde la dejaste.</p>
        </header>
        <div className="my-courses__toolbar">
          <div className="my-courses__filters" aria-label="Filtrar cursos por progreso">
            {filtros.map((nombre, indice) => <button key={nombre} type="button" aria-pressed={filtro === nombre} className={filtro === nombre ? "is-active" : ""} onClick={() => setFiltro(nombre)}><FiltroIcono indice={indice} />{nombre} (0)</button>)}
          </div>
          <div className="my-courses__controls">
            <div className="my-courses__views" aria-label="Vista de cursos">
              <button type="button" aria-label="Vista de cuadrícula" aria-pressed={vista === "cuadricula"} onClick={() => setVista("cuadricula")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z" /></svg></button>
              <button type="button" aria-label="Vista de lista" aria-pressed={vista === "lista"} onClick={() => setVista("lista")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 5h13M8 12h13M8 19h13M3 5h2M3 12h2M3 19h2" /></svg></button>
            </div>
            <select aria-label="Ordenar cursos" defaultValue="recientes"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option><option value="nombre">Nombre: A–Z</option></select>
          </div>
        </div>
      </div>
      <section className="my-courses__empty" aria-live="polite" aria-label="Resultados de cursos">
        <span><Icono nombre="libro" /></span>
        <h2>{filtro === "Todos" ? "Aún no tienes cursos" : `No tienes cursos ${filtro.toLowerCase()}`}</h2>
        <p>Cuando tengas cursos disponibles, aparecerán aquí.</p>
      </section>
    </main>
  );
}

function FiltroIcono({ indice }: { indice: number }) {
  const trazos = ["m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4", "M10 8l6 4-6 4Z", "m7 12 3 3 7-7", "M12 6v6l4 3"];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{indice > 0 && <circle cx="12" cy="12" r="9" />}<path d={trazos[indice]} /></svg>;
}
