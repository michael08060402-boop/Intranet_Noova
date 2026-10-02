"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronsUpDown, Image as IconoImagen, Layers, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react";
import { contarDocumentos, eliminarCurso, escucharCategorias, escucharCursos, nombresNivel, type Categoria, type Curso } from "@/firebase/cursos";
import Categorias from "./Categorias";
import NuevoCurso from "./NuevoCurso";
import "./CursosPage.css";

type Columna = "nombre" | "categoria" | "nivel" | "acceso" | "estado" | "clases";

const columnas: { clave: Columna; titulo: string }[] = [
  { clave: "nombre", titulo: "Curso" },
  { clave: "categoria", titulo: "Categoría" },
  { clave: "nivel", titulo: "Nivel" },
  { clave: "acceso", titulo: "Acceso" },
  { clave: "estado", titulo: "Estado" },
  { clave: "clases", titulo: "Clases" },
];

const ordenNivel = { basico: 0, intermedio: 1, avanzado: 2 };

export default function CursosPage() {
  return (
    <Suspense fallback={<main className="cursos-page" />}>
      <Cursos />
    </Suspense>
  );
}

function Cursos() {
  const router = useRouter();
  const parametros = useSearchParams();
  const nuevo = parametros.has("nuevo");
  const conParametro = nuevo || parametros.has("categorias");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clases, setClases] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [orden, setOrden] = useState<{ columna: Columna; ascendente: boolean }>({ columna: "nombre", ascendente: true });
  const [editando, setEditando] = useState<Curso | null | undefined>(nuevo ? null : undefined);
  const [gestionandoCategorias, setGestionandoCategorias] = useState(parametros.has("categorias"));
  const [eliminando, setEliminando] = useState<Curso | null>(null);
  const confirmar = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const fallo = () => { setError("No se pudieron cargar los cursos."); setCargando(false); };
    const dejarCursos = escucharCursos(false, (lista) => { setCursos(lista); setCargando(false); }, fallo);
    const dejarCategorias = escucharCategorias(false, setCategorias, fallo);
    return () => { dejarCursos(); dejarCategorias(); };
  }, []);

  useEffect(() => {
    Promise.all(cursos.map(async (curso) => [curso.id, await contarDocumentos(`cursos/${curso.id}/clases`)] as const))
      .then((conteos) => setClases(Object.fromEntries(conteos)))
      .catch(() => setClases({}));
  }, [cursos]);

  function ordenarPor(columna: Columna) {
    setOrden((actual) => ({ columna, ascendente: actual.columna === columna ? !actual.ascendente : true }));
  }

  function pedirEliminar(curso: Curso) {
    setEliminando(curso);
    confirmar.current?.showModal();
  }

  async function eliminar() {
    if (!eliminando) return;
    setError("");
    try { await eliminarCurso(eliminando.id); }
    catch { setError(`No se pudo eliminar "${eliminando.nombre}".`); }
    confirmar.current?.close();
  }

  const nombreCategoria = (id: string) => categorias.find((categoria) => categoria.id === id)?.nombre ?? "Sin categoría";
  const valor = (curso: Curso): string | number => ({
    nombre: curso.nombre.toLowerCase(),
    categoria: nombreCategoria(curso.categoriaId).toLowerCase(),
    nivel: ordenNivel[curso.nivel],
    acceso: curso.acceso,
    estado: curso.publicado ? 1 : 0,
    clases: clases[curso.id] ?? 0,
  })[orden.columna];

  const texto = busqueda.trim().toLowerCase();
  const visibles = cursos
    .filter((curso) => (filtro === "todas" || curso.categoriaId === filtro) && curso.nombre.toLowerCase().includes(texto))
    .sort((a, b) => {
      const [x, y] = [valor(a), valor(b)];
      const resultado = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return orden.ascendente ? resultado : -resultado;
    });

  return (
    <main className="cursos-page">
      <header className="cursos-heading">
        <div>
          <span className="cursos-eyebrow">Gestión académica</span>
          <h1>Cursos</h1>
          <p>Administra tus cursos y sus clases.</p>
        </div>
        <div className="cursos-heading__acciones">
          <button className="cursos-secundario" type="button" onClick={() => setGestionandoCategorias(true)}><Layers />Categorías</button>
          <button className="cursos-create" type="button" onClick={() => setEditando(null)}><Plus />Nuevo curso</button>
        </div>
      </header>

      <section className="cursos-panel" aria-label="Listado de cursos">
        <div className="cursos-panel-heading">
          <span className="cursos-panel-icon"><BookOpen /></span>
          <h2>Catálogo de cursos</h2>
          <span className="cursos-count">{cursos.length} {cursos.length === 1 ? "curso" : "cursos"}</span>
        </div>
        <div className="cursos-toolbar">
          <label className="cursos-search">
            <Search />
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar curso..." aria-label="Buscar curso" />
          </label>
          <select className="cursos-category" aria-label="Filtrar por categoría" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
          </select>
        </div>
        {error && <p className="cursos-error" role="alert">{error}</p>}

        <div className="cursos-table-wrap">
          <table className="cursos-table">
            <thead>
              <tr>
                {columnas.map(({ clave, titulo }) => (
                  <th key={clave} scope="col" aria-sort={orden.columna === clave ? (orden.ascendente ? "ascending" : "descending") : undefined}>
                    <button type="button" className="cursos-ordenar" onClick={() => ordenarPor(clave)}>{titulo}<ChevronsUpDown /></button>
                  </th>
                ))}
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((curso) => {
                const conClases = (clases[curso.id] ?? 1) > 0;
                return (
                  <tr key={curso.id}>
                    <td>
                      <div className="cursos-curso">
                        <span className="cursos-portada" title="La portada estará disponible próximamente"><IconoImagen /></span>
                        <div>
                          <strong className="cursos-nombre">{curso.nombre}</strong>
                          {curso.descripcion && <small className="cursos-descripcion">{curso.descripcion}</small>}
                        </div>
                      </div>
                    </td>
                    <td>{nombreCategoria(curso.categoriaId)}</td>
                    <td>{nombresNivel[curso.nivel]}</td>
                    <td><span className={`cursos-badge cursos-badge--${curso.acceso}`}>{curso.acceso === "premium" ? "Premium" : "Gratis"}</span></td>
                    <td><span className={`cursos-badge ${curso.publicado ? "cursos-badge--publicado" : "cursos-badge--borrador"}`}>{curso.publicado ? "Publicado" : "Borrador"}</span></td>
                    <td>{clases[curso.id] ?? "…"}</td>
                    <td>
                      <div className="cursos-acciones">
                        <Link href={`/admin/cursos/curso?id=${curso.id}`} className="cursos-administrar"><Settings />Administrar curso</Link>
                        <button type="button" className="cursos-icono" onClick={() => setEditando(curso)} aria-label={`Editar ${curso.nombre}`} title="Editar"><Pencil /></button>
                        <button type="button" className="cursos-icono cursos-icono--peligro" onClick={() => pedirEliminar(curso)} disabled={conClases}
                          aria-label={`Eliminar ${curso.nombre}`} title={conClases ? "Solo se pueden eliminar cursos sin clases. Pásalo a borrador para ocultarlo." : "Eliminar"}>
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="cursos-empty">
                      <div className="cursos-empty__illustration"><BookOpen /><span /></div>
                      {cargando ? <h2>Cargando cursos…</h2> : cursos.length > 0 ? <h2>Ningún curso coincide con la búsqueda</h2> : (
                        <>
                          <h2>Aún no hay cursos registrados</h2>
                          <p>Comienza creando tu primer curso para poder gestionar sus clases<br className="cursos-empty__break" /> y contenidos desde aquí.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <dialog ref={confirmar} className="cursos-confirmar" aria-labelledby="cursos-confirmar-titulo" onClose={() => setEliminando(null)}>
        <h2 id="cursos-confirmar-titulo">¿Eliminar curso?</h2>
        <p>Se eliminará <strong>{eliminando?.nombre}</strong> de forma permanente. Esta acción no se puede deshacer.</p>
        <div className="cursos-confirmar__acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" className="cursos-confirmar__eliminar" onClick={eliminar}>Eliminar</button>
        </div>
      </dialog>
      {editando !== undefined && <NuevoCurso curso={editando} categorias={categorias} alCerrar={() => {
        setEditando(undefined);
        if (nuevo) router.replace("/admin/cursos");
      }} />}
      {gestionandoCategorias && <Categorias categorias={categorias} cursos={cursos} alCerrar={() => {
        setGestionandoCategorias(false);
        if (conParametro) router.replace("/admin/cursos");
      }} />}
    </main>
  );
}
