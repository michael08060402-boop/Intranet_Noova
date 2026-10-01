"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronRight, Circle, CircleCheck } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharCurso, escucharInscripciones, escucharProgreso, marcarClase, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import "./Clase.css";

export default function ClasePage() {
  return (
    <Suspense fallback={<main className="clase-page"><p className="clase-page__estado">Cargando clase…</p></main>}>
      <ClaseCurso />
    </Suspense>
  );
}

function ClaseCurso() {
  const parametros = useSearchParams();
  const cursoId = parametros.get("id") ?? "";
  const claseId = parametros.get("clase");
  const { usuario } = useSesion();
  // undefined: cargando; null: no existe o no está publicado.
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const [clases, setClases] = useState<Clase[]>([]);
  const [inscrito, setInscrito] = useState<boolean | undefined>(undefined);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<"descripcion" | "recursos">("descripcion");

  useEffect(() => {
    if (!cursoId) return;
    const fallo = () => setCurso(null);
    const dejarCurso = escucharCurso(cursoId, setCurso, fallo);
    const dejarClases = escucharClases(cursoId, true, setClases, fallo);
    return () => { dejarCurso(); dejarClases(); };
  }, [cursoId]);

  useEffect(() => {
    if (!usuario || !cursoId) return;
    const fallo = () => setError("No se pudo consultar tu avance.");
    const dejarInscripciones = escucharInscripciones(usuario.uid, (ids) => setInscrito(ids.includes(cursoId)), fallo);
    const dejarProgreso = escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.cursoId === cursoId && item.completado)), fallo);
    return () => { dejarInscripciones(); dejarProgreso(); };
  }, [usuario, cursoId]);

  if (!cursoId || curso === null) {
    return (
      <main className="clase-page">
        <p className="clase-page__estado">Este curso no existe o ya no está disponible.</p>
        <Link href="/alumno/explorar" className="clase-page__enlace">Volver a Explorar</Link>
      </main>
    );
  }

  if (curso === undefined || inscrito === undefined) {
    return <main className="clase-page"><p className="clase-page__estado">Cargando clase…</p></main>;
  }

  if (!inscrito) {
    return (
      <main className="clase-page">
        <p className="clase-page__estado">Inscríbete en <strong>{curso.nombre}</strong> para acceder a sus clases.</p>
        <Link href={`/alumno/explorar?curso=${curso.id}`} className="clase-page__enlace">Ir al curso</Link>
      </main>
    );
  }

  const completada = (clase: Clase) => progreso.some((item) => item.claseId === clase.id);
  // Sin clase indicada se abre la primera pendiente, para continuar donde se quedó.
  const indice = Math.max(0, clases.findIndex((clase) => claseId ? clase.id === claseId : !completada(clase)));
  const actual = clases[indice];
  const enlace = (clase: Clase) => `/alumno/curso?id=${curso.id}&clase=${clase.id}`;

  async function cambiarEstado() {
    if (!usuario || !actual) return;
    setGuardando(true);
    setError("");
    try { await marcarClase(usuario.uid, curso!.id, actual.id, !completada(actual)); }
    catch { setError("No se pudo guardar tu avance. Inténtalo nuevamente."); }
    setGuardando(false);
  }

  return (
    <main className="clase-page">
      <nav className="clase-page__ruta" aria-label="Ruta">
        <Link href="/alumno/cursos">Mis cursos</Link>
        <ChevronRight />
        <Link href={`/alumno/explorar?curso=${curso.id}`}>{curso.nombre}</Link>
        {actual && <><ChevronRight /><span>Clase {indice + 1}</span></>}
      </nav>

      {!actual ? <p className="clase-page__estado">Este curso aún no tiene clases publicadas.</p> : (
        <>
          <header className="clase-page__encabezado">
            <h1>{actual.nombre}</h1>
            <button type="button" className={`clase-page__completar ${completada(actual) ? "is-completada" : ""}`} onClick={cambiarEstado} disabled={guardando}>
              {completada(actual) ? <><CircleCheck />Completada</> : <><Circle />Marcar como completada</>}
            </button>
          </header>
          {error && <p className="clase-page__error" role="alert">{error}</p>}

          <div className="clase-page__layout">
            <section className="clase-page__principal">
              {/* El reproductor se añadirá cuando las clases tengan video en R2. */}
              <div className="clase-page__video" />
              <div className="clase-page__detalle">
                <div className="clase-page__pestanas" role="tablist">
                  <button type="button" role="tab" aria-selected={pestana === "descripcion"} onClick={() => setPestana("descripcion")}>Descripción</button>
                  <button type="button" role="tab" aria-selected={pestana === "recursos"} onClick={() => setPestana("recursos")}>Recursos</button>
                </div>
                {pestana === "descripcion" ? (
                  <>
                    <h2>Sobre esta clase</h2>
                    <p>{actual.descripcion || "Esta clase no tiene descripción."}</p>
                  </>
                ) : <p>Esta clase aún no tiene recursos.</p>}
              </div>
            </section>

            <aside className="clase-page__lateral" aria-labelledby="clase-page-lista">
              <div className="clase-page__lateral-titulo">
                <h2 id="clase-page-lista">Clases del curso</h2>
                <small>{clases.length} {clases.length === 1 ? "clase" : "clases"}</small>
              </div>
              <ol>
                {clases.map((clase, posicion) => (
                  <li key={clase.id}>
                    <Link href={enlace(clase)} className={clase === actual ? "is-actual" : ""} aria-current={clase === actual ? "page" : undefined}>
                      <span className="clase-page__miniatura">{completada(clase) && <CircleCheck aria-label="Completada" />}</span>
                      <span className="clase-page__numero">{posicion + 1}</span>
                      <span>{clase.nombre}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
