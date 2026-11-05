"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ClipboardList, ListChecks, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { escucharCursos, type Curso } from "@/firebase/cursos";
import { eliminarExamen, escucharExamenes, escucharIntentos, type Examen, type Intento } from "@/firebase/evaluaciones";
import NuevoExamen from "./NuevoExamen";
import "../AdminPagina.css";

export default function EvaluacionesPage() {
  return (
    <Suspense fallback={<main className="admin-pagina" />}>
      <Evaluaciones />
    </Suspense>
  );
}

function Evaluaciones() {
  const router = useRouter();
  const [pedidoNuevo, setPedidoNuevo] = useState(useSearchParams().has("nuevo"));
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [editando, setEditando] = useState<Examen | null | undefined>(undefined);
  const [eliminando, setEliminando] = useState<Examen | null>(null);
  const [borrando, setBorrando] = useState(false);
  const confirmar = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const fallo = () => { setError("No se pudieron cargar las evaluaciones."); setCargando(false); };
    const dejarExamenes = escucharExamenes(false, (lista) => { setExamenes(lista); setCargando(false); }, fallo);
    const dejarCursos = escucharCursos(false, setCursos, fallo);
    const dejarIntentos = escucharIntentos(null, setIntentos, fallo);
    return () => { dejarExamenes(); dejarCursos(); dejarIntentos(); };
  }, []);

  function pedirEliminar(examen: Examen) {
    setEliminando(examen);
    confirmar.current?.showModal();
  }

  async function eliminar() {
    if (!eliminando || borrando) return;
    setBorrando(true);
    setError("");
    try {
      await eliminarExamen(eliminando.id);
      confirmar.current?.close();
    }
    catch { setError(`No se pudo eliminar "${eliminando.nombre}".`); }
    finally { setBorrando(false); }
  }

  const nombreCurso = (id: string) => cursos.find((curso) => curso.id === id)?.nombre ?? "Curso eliminado";
  const texto = busqueda.trim().toLowerCase();
  const visibles = examenes.filter((examen) => (filtro === "todos" || examen.cursoId === filtro) && examen.nombre.toLowerCase().includes(texto));

  return (
    <main className="admin-pagina">
      <header className="admin-pagina__cabecera">
        <div>
          <h1>Evaluaciones</h1>
        </div>
        <button type="button" className="admin-boton" onClick={() => setEditando(null)} disabled={cursos.length === 0} title={cursos.length === 0 ? "Crea primero un curso" : undefined}>
          <Plus />Nuevo examen
        </button>
      </header>

      <section className="admin-panel" aria-label="Listado de evaluaciones">
        <div className="admin-panel__titulo">
          <h2>Exámenes</h2>
          <span className="admin-insignia">{examenes.length} {examenes.length === 1 ? "examen" : "exámenes"}</span>
        </div>
        <div className="admin-panel__herramientas">
          <label className="admin-busqueda">
            <Search />
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar examen..." aria-label="Buscar examen" />
          </label>
          <select className="admin-selector" aria-label="Filtrar por curso" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
            <option value="todos">Todos los cursos</option>
            {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}
          </select>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de exámenes">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th scope="col">Examen</th>
                <th scope="col">Curso</th>
                <th scope="col">Preguntas</th>
                <th scope="col">Duración</th>
                <th scope="col">Estado</th>
                <th scope="col">Entregas</th>
                <th scope="col" className="admin-tabla__fin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((examen) => {
                const entregas = intentos.filter((intento) => intento.examenId === examen.id);
                const pendientes = entregas.filter((intento) => intento.estado !== "calificado").length;
                return (
                  <tr key={examen.id}>
                    <td><strong>{examen.nombre}</strong>{examen.descripcion && <small>{examen.descripcion.slice(0, 80)}</small>}</td>
                    <td>{nombreCurso(examen.cursoId)}</td>
                    <td>{examen.modo === "manual" ? examen.preguntas.length : "Archivo"}</td>
                    <td>{examen.duracionMin > 0 ? `${examen.duracionMin} min` : "Sin límite"}</td>
                    <td><span className={`admin-insignia ${examen.publicado ? "admin-insignia--info" : ""}`}>{examen.publicado ? "Publicado" : "Borrador"}</span></td>
                    <td>
                      {entregas.length}
                      {pendientes > 0 && <small>{pendientes} por calificar</small>}
                    </td>
                    <td>
                      <div className="admin-acciones">
                        <Link href={`/admin/evaluaciones/entregas?id=${examen.id}`} className="admin-boton admin-boton--secundario"><ListChecks />Entregas</Link>
                        <button type="button" className="admin-icono" onClick={() => setEditando(examen)} aria-label={`Editar ${examen.nombre}`} title="Editar"><Pencil /></button>
                        <button type="button" className="admin-icono admin-icono--peligro" onClick={() => pedirEliminar(examen)}
                          aria-label={`Eliminar ${examen.nombre}`} title="Eliminar examen">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-tabla__vacio">
                    <ClipboardList />
                    <p>{cargando ? "Cargando evaluaciones…" : examenes.length > 0 ? "Ningún examen coincide con la búsqueda." : "Aún no hay exámenes. Crea el primero para tus cursos."}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <dialog ref={confirmar} className="admin-confirmar" aria-labelledby="examen-confirmar-titulo" onCancel={(evento) => { if (borrando) evento.preventDefault(); }} onClose={() => setEliminando(null)}>
        <h2 id="examen-confirmar-titulo">¿Eliminar examen?</h2>
        <p>Se eliminará <strong>{eliminando?.nombre}</strong> junto con todos sus intentos, respuestas y notas. Esta acción no se puede deshacer.</p>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-confirmar__acciones">
          <button type="button" disabled={borrando} onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" disabled={borrando} className="admin-confirmar__peligro" onClick={eliminar}>{borrando ? "Eliminando…" : "Eliminar examen y entregas"}</button>
        </div>
      </dialog>
      {(editando !== undefined || (pedidoNuevo && cursos.length > 0)) && <NuevoExamen examen={editando ?? null} cursos={cursos} alCerrar={() => {
        setEditando(undefined);
        if (pedidoNuevo) { setPedidoNuevo(false); router.replace("/admin/evaluaciones"); }
      }} />}
    </main>
  );
}
