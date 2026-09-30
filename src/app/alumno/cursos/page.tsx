"use client";

import Link from "next/link";
import { useState } from "react";
import { EstadoVacio, SelectorOrden, TituloPagina, type Orden } from "@/components/alumno/PiezasCatalogo";
import "./MisCursos.css";

const filtros = ["Todos", "En progreso", "Completados", "Sin empezar"];

// Solo diseño: los cursos y su avance se conectarán cuando exista el registro de progreso de las clases.
export default function MisCursos() {
  const [filtro, setFiltro] = useState("Todos");
  const [orden, setOrden] = useState<Orden>("recientes");

  return (
    <main className="my-courses">
      <TituloPagina className="my-courses__heading" titulo="Mis cursos" descripcion="Continúa tu formación donde la dejaste." />
      <div className="my-courses__toolbar">
        <div className="my-courses__filters" aria-label="Filtrar cursos por progreso">
          {filtros.map((nombre) => (
            <button key={nombre} type="button" aria-pressed={filtro === nombre} className={filtro === nombre ? "is-active" : ""} onClick={() => setFiltro(nombre)}>
              {nombre} · 0
            </button>
          ))}
        </div>
        <SelectorOrden orden={orden} alCambiar={setOrden} />
      </div>
      <EstadoVacio
        className="my-courses__vacio"
        titulo={filtro === "Todos" ? "Aún no tienes cursos" : `No tienes cursos ${filtro.toLowerCase()}`}
        texto="Cuando empieces un curso desde Explorar, aparecerá aquí con tu avance."
      >
        <Link href="/alumno/explorar" className="my-courses__explorar">Explorar cursos</Link>
      </EstadoVacio>
    </main>
  );
}
