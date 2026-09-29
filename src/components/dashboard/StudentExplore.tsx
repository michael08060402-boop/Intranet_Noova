"use client";

import { useState } from "react";
import Icono from "./StudentIcon";
import "./StudentExplore.css";

const categorias = ["Todos", "ejvisual1", "ejvisual2", "ejvisual3", "ejvisual4"];

export default function StudentExplore() {
  const [categoria, setCategoria] = useState("Todos");
  const [tipos, setTipos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("cuadricula");

  function cambiarTipo(tipo: string) {
    setTipos((actuales) => actuales.includes(tipo) ? actuales.filter((actual) => actual !== tipo) : [...actuales, tipo]);
  }

  return (
    <main className="student-explore" id="explorar">
      <header className="student-explore__heading">
        <h1>Explora nuestros <span>cursos</span></h1>
        <p>Accede a todos los cursos disponibles y continúa desarrollando tus conocimientos en la industria minera.</p>
      </header>
      <div className="student-explore__layout">
        <aside className="student-explore__sidebar" aria-label="Filtros del catálogo">
          <details open>
            <summary><CatalogIcon nombre="capas" />Categorías<Icono nombre="flecha" /></summary>
            <div className="student-explore__categories">
              {categorias.map((nombre, indice) => <button type="button" key={nombre} className={categoria === nombre ? "is-active" : ""} aria-pressed={categoria === nombre} onClick={() => setCategoria(nombre)}><CatalogIcon nombre={(["cuadricula", "ventilacion", "bomba", "mina", "escudo", "hoja"] as const)[indice]} /><span>{nombre}</span><small>0</small></button>)}
            </div>
          </details>
          <details open>
            <summary><Icono nombre="libro" />Tipo de curso<Icono nombre="flecha" /></summary>
            <div className="student-explore__types">
              <label><input type="checkbox" checked={tipos.length === 0} onChange={() => setTipos([])} />Todos<small>0</small></label>
              {["Gratis", "Premium"].map((tipo) => <label key={tipo}><input type="checkbox" checked={tipos.includes(tipo)} onChange={() => cambiarTipo(tipo)} />{tipo}<small>0</small></label>)}
            </div>
          </details>
        </aside>
        <section className="student-explore__catalog" aria-label="Catálogo de cursos">
          <div className="student-explore__toolbar">
            <label className="student-explore__search"><Icono nombre="buscar" /><input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar cursos, temas o palabras clave..." aria-label="Buscar en el catálogo" /></label>
            <select aria-label="Ordenar cursos" defaultValue="recientes"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option><option value="nombre">Nombre: A–Z</option></select>
            <div className="student-explore__views" aria-label="Vista del catálogo">
              <button type="button" aria-label="Vista de cuadrícula" aria-pressed={vista === "cuadricula"} onClick={() => setVista("cuadricula")}><CatalogIcon nombre="cuadricula" /></button>
              <button type="button" aria-label="Vista de lista" aria-pressed={vista === "lista"} onClick={() => setVista("lista")}><CatalogIcon nombre="lista" /></button>
            </div>
          </div>
          <div className="student-explore__empty" role="status">
            <span><Icono nombre="libro" /></span>
            <h2>Aún no hay cursos registrados</h2>
            <p>Los cursos disponibles aparecerán aquí cuando se publiquen.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function CatalogIcon({ nombre }: { nombre: "capas" | "cuadricula" | "lista" | "ventilacion" | "bomba" | "mina" | "escudo" | "hoja" }) {
  const trazos = {
    capas: "m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4",
    cuadricula: "M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z",
    lista: "M8 5h13M8 12h13M8 19h13M3 5h2M3 12h2M3 19h2",
    ventilacion: "M12 10c-8-6-8 4-2 3M14 12c6-8-4-8-3-2M12 14c8 6 8-4 2-3M10 12c-6 8 4 8 3 2",
    bomba: "M3 21v-8h6v8ZM15 21v-8h6v8ZM6 13V9h12v4M9 9V4h6v5M11 4V2h2v2",
    mina: "M3 21h18M5 21V11l7-8 7 8v10M9 21v-7h6v7M8 10h8",
    escudo: "m12 2 8 4v7c0 4-8 9-8 9s-8-5-8-9V6Zm-4 10 3 3 5-6",
    hoja: "M4 20 18 6M5 17C-2 6 10 3 21 3c0 12-4 20-16 14Z",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[nombre]} /></svg>;
}
