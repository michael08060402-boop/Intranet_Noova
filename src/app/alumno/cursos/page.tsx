"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { EstadoVacio, SelectorOrden, TituloPagina, type Orden } from "@/components/alumno/PiezasCatalogo";
import { contarClasesPublicadas, escucharCursos, escucharInscripciones, escucharProgreso, nombresNivel, type Curso, type Progreso } from "@/firebase/cursos";
import "./MisCursos.css";

const filtros = ["Todos", "En progreso", "Completados", "Sin empezar"];

export default function MisCursos() {
  const { usuario } = useSesion();
  const [filtro, setFiltro] = useState("Todos");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscritos, setInscritos] = useState<string[]>([]);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [totales, setTotales] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!usuario) return;
    const fallo = () => { setError("No se pudieron cargar tus cursos."); setCargando(false); };
    const dejarCursos = escucharCursos(true, setCursos, fallo);
    const dejarInscripciones = escucharInscripciones(usuario.uid, (ids) => { setInscritos(ids); setCargando(false); }, fallo);
    const dejarProgreso = escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.completado)), fallo);
    return () => { dejarCursos(); dejarInscripciones(); dejarProgreso(); };
  }, [usuario]);

  const misCursos = cursos.filter((curso) => inscritos.includes(curso.id));
  const idsMisCursos = misCursos.map((curso) => curso.id).join(",");

  useEffect(() => {
    if (!idsMisCursos) return;
    Promise.all(idsMisCursos.split(",").map(async (id) => [id, await contarClasesPublicadas(id)] as const))
      .then((conteos) => setTotales(Object.fromEntries(conteos)))
      .catch(() => setTotales({}));
  }, [idsMisCursos]);

  function porcentaje(curso: Curso) {
    const total = totales[curso.id] ?? 0;
    const completadas = progreso.filter((item) => item.cursoId === curso.id).length;
    return total ? Math.min(100, Math.round((completadas / total) * 100)) : 0;
  }

  function estado(curso: Curso) {
    const valor = porcentaje(curso);
    return valor === 100 ? "Completados" : valor > 0 ? "En progreso" : "Sin empezar";
  }

  const visibles = misCursos
    .filter((curso) => filtro === "Todos" || estado(curso) === filtro)
    .sort((a, b) => orden === "nombre" ? a.nombre.localeCompare(b.nombre) : orden === "antiguos" ? a.creadoEn - b.creadoEn : b.creadoEn - a.creadoEn);

  return (
    <main className="my-courses alumno-fondo">
      <TituloPagina className="my-courses__heading" titulo="Mis cursos" descripcion="Continúa tu formación donde la dejaste." />
      <div className="my-courses__toolbar">
        <div className="my-courses__filters" aria-label="Filtrar cursos por progreso">
          {filtros.map((nombre) => (
            <button key={nombre} type="button" aria-pressed={filtro === nombre} className={filtro === nombre ? "is-activo" : ""} onClick={() => setFiltro(nombre)}>
              {nombre}
              <span>{nombre === "Todos" ? misCursos.length : misCursos.filter((curso) => estado(curso) === nombre).length}</span>
            </button>
          ))}
        </div>
        <SelectorOrden orden={orden} alCambiar={setOrden} />
      </div>

      {error && <p className="my-courses__error" role="alert">{error}</p>}
      {cargando ? <p className="my-courses__estado">Cargando tus cursos…</p>
        : visibles.length === 0 ? (
          <EstadoVacio
            className="my-courses__vacio"
            titulo={filtro === "Todos" ? "Aún no tienes cursos" : `No tienes cursos ${filtro.toLowerCase()}`}
            texto="Cuando te inscribas en un curso desde Explorar, aparecerá aquí con tu avance."
          >
            <Link href="/alumno/explorar" className="my-courses__explorar">Explorar cursos</Link>
          </EstadoVacio>
        ) : (
          <ul className="my-courses__lista">
            {visibles.map((curso) => {
              const valor = porcentaje(curso);
              const total = totales[curso.id] ?? 0;
              return (
                <li key={curso.id} className="my-courses__curso">
                  <Link href={`/alumno/explorar?curso=${curso.id}`} className="my-courses__portada" aria-label={`Ver ${curso.nombre}`} />
                  <div className="my-courses__info">
                    <h2>{curso.nombre}</h2>
                    {curso.descripcion && <p>{curso.descripcion}</p>}
                    <small>{nombresNivel[curso.nivel]} · {total} {total === 1 ? "clase" : "clases"}</small>
                  </div>
                  <div className="my-courses__avance">
                    <span>{valor}% completado</span>
                    <span className="my-courses__barra"><span style={{ width: `${valor}%` }} /></span>
                    <Link href={`/alumno/curso?id=${curso.id}`} className="my-courses__continuar">
                      <Play />{valor === 0 ? "Comenzar curso" : valor === 100 ? "Repasar curso" : "Continuar curso"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </main>
  );
}
