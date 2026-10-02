"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BookOpen, ChevronDown, Layers, LayoutGrid, Search } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { EstadoVacio, SelectorOrden, TituloPagina, type Orden } from "@/components/alumno/PiezasCatalogo";
import TarjetaCurso from "@/components/alumno/TarjetaCurso";
import { escucharCategorias, escucharCursos, escucharInscripciones, type Acceso, type Categoria, type Curso } from "@/firebase/cursos";
import CursoDetalle from "./CursoDetalle";
import "./Explorar.css";

export default function ExplorarPage() {
  return (
    <Suspense fallback={<main className="alumno-explorar" />}>
      <Explorar />
    </Suspense>
  );
}

function Explorar() {
  const router = useRouter();
  const abiertoId = useSearchParams().get("curso");
  const { perfil, usuario } = useSesion();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscritos, setInscritos] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [tipos, setTipos] = useState<Acceso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("recientes");

  useEffect(() => {
    const fallo = () => { setError("No se pudieron cargar los cursos. Revisa tu conexión."); setCargando(false); };
    const dejarCursos = escucharCursos(true, (lista) => { setCursos(lista); setCargando(false); }, fallo);
    const dejarCategorias = escucharCategorias(true, setCategorias, fallo);
    return () => { dejarCursos(); dejarCategorias(); };
  }, []);

  useEffect(() => (usuario ? escucharInscripciones(usuario.uid, setInscritos, () => setInscritos([])) : undefined), [usuario]);

  const bloqueado = (curso: Curso) => curso.acceso === "premium" && perfil?.plan !== "premium";
  const nombreCategoria = (id: string) => categorias.find((item) => item.id === id)?.nombre ?? "General";

  const abierto = cursos.find((curso) => curso.id === abiertoId);
  if (abierto) {
    return <CursoDetalle curso={abierto} categoria={nombreCategoria(abierto.categoriaId)} bloqueado={bloqueado(abierto)} alVolver={() => router.push("/alumno/explorar")} />;
  }

  function cambiarTipo(tipo: Acceso) {
    setTipos((actuales) => actuales.includes(tipo) ? actuales.filter((actual) => actual !== tipo) : [...actuales, tipo]);
  }

  const texto = busqueda.trim().toLowerCase();
  const visibles = cursos
    .filter((curso) => (categoria === "todas" || curso.categoriaId === categoria)
      && (tipos.length === 0 || tipos.includes(curso.acceso))
      && `${curso.nombre} ${curso.descripcion}`.toLowerCase().includes(texto))
    .sort((a, b) => orden === "nombre" ? a.nombre.localeCompare(b.nombre) : orden === "antiguos" ? a.creadoEn - b.creadoEn : b.creadoEn - a.creadoEn);

  return (
    <main className="alumno-explorar">
      <TituloPagina
        className="alumno-explorar__heading"
        titulo="Explora nuestros cursos"
        descripcion="Accede a todos los cursos disponibles y continúa desarrollando tus conocimientos en la industria minera."
      />
      <div className="alumno-explorar__layout">
        <aside className="alumno-explorar__sidebar" aria-label="Filtros del catálogo">
          <details open>
            <summary>
              <Layers />
              Categorías
              <ChevronDown />
            </summary>
            <div className="alumno-explorar__categories">
              <button type="button" className={categoria === "todas" ? "is-activo" : ""} aria-pressed={categoria === "todas"} onClick={() => setCategoria("todas")}>
                <LayoutGrid />
                <span>Todos</span>
                <small>{cursos.length}</small>
              </button>
              {categorias.map((item) => (
                <button type="button" key={item.id} className={categoria === item.id ? "is-activo" : ""} aria-pressed={categoria === item.id} onClick={() => setCategoria(item.id)}>
                  <Layers />
                  <span>{item.nombre}</span>
                  <small>{cursos.filter((curso) => curso.categoriaId === item.id).length}</small>
                </button>
              ))}
            </div>
          </details>
          <details open>
            <summary>
              <BookOpen />
              Tipo de curso
              <ChevronDown />
            </summary>
            <div className="alumno-explorar__types">
              <label>
                <input type="checkbox" checked={tipos.length === 0} onChange={() => setTipos([])} />
                Todos<small>{cursos.length}</small>
              </label>
              {(["gratis", "premium"] as const).map((tipo) => (
                <label key={tipo}>
                  <input type="checkbox" checked={tipos.includes(tipo)} onChange={() => cambiarTipo(tipo)} />
                  {tipo === "gratis" ? "Gratis" : "Premium"}
                  <small>{cursos.filter((curso) => curso.acceso === tipo).length}</small>
                </label>
              ))}
            </div>
          </details>
        </aside>
        <section className="alumno-explorar__catalog" aria-label="Catálogo de cursos">
          <div className="alumno-explorar__toolbar">
            <label className="alumno-explorar__search">
              <Search />
              <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar cursos, temas o palabras clave..." aria-label="Buscar en el catálogo" />
            </label>
            <SelectorOrden orden={orden} alCambiar={setOrden} />
          </div>
          {visibles.length > 0 ? (
            <div className="alumno-explorar__grid">
              {visibles.map((curso) => (
                <TarjetaCurso
                  key={curso.id}
                  curso={curso}
                  categoria={nombreCategoria(curso.categoriaId)}
                  inscrito={inscritos.includes(curso.id)}
                  bloqueado={bloqueado(curso)}
                />
              ))}
            </div>
          ) : (
            <EstadoVacio
              className="alumno-explorar__vacio"
              Icono={BookOpen}
              titulo={error ? "No se pudo cargar el catálogo" : cargando ? "Cargando cursos…" : cursos.length > 0 ? "Ningún curso coincide con tu búsqueda" : "Aún no hay cursos registrados"}
              texto={error || (cursos.length > 0 ? "Prueba con otra categoría o palabra clave." : "Los cursos disponibles aparecerán aquí cuando se publiquen.")}
            />
          )}
        </section>
      </div>
    </main>
  );
}
