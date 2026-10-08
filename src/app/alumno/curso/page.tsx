"use client";

import MiniaturaClase from "@/components/alumno/MiniaturaClase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { FunctionsError } from "firebase/functions";
import { ChevronRight, Circle, CircleCheck, Trophy } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharCurso, escucharInscripciones, escucharProgreso, marcarClase, pedirVideo, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, type Examen } from "@/firebase/evaluaciones";
import "./Clase.css";

export default function ClasePage() {
  return (
    <Suspense fallback={<main className="clase-page alumno-fondo"><p className="clase-page__estado">Cargando clase…</p></main>}>
      <ClaseCurso />
    </Suspense>
  );
}

function ClaseCurso() {
  const parametros = useSearchParams();
  const cursoId = parametros.get("id") ?? "";
  const claseId = parametros.get("clase");
  const { usuario } = useSesion();
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const [clases, setClases] = useState<Clase[]>([]);
  const [inscrito, setInscrito] = useState<boolean | undefined>(undefined);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<"descripcion" | "recursos">("descripcion");
  const [examenes, setExamenes] = useState<Examen[]>([]);

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

  useEffect(() => (cursoId ? escucharExamenesDeCurso(cursoId, setExamenes, () => setExamenes([])) : undefined), [cursoId]);

  if (!cursoId || curso === null) {
    return (
      <main className="clase-page alumno-fondo">
        <p className="clase-page__estado">Este curso no existe o ya no está disponible.</p>
        <Link href="/alumno/explorar" className="clase-page__enlace">Volver a Explorar</Link>
      </main>
    );
  }

  if (curso === undefined || inscrito === undefined) {
    return <main className="clase-page alumno-fondo"><p className="clase-page__estado">Cargando clase…</p></main>;
  }

  if (!inscrito) {
    return (
      <main className="clase-page alumno-fondo">
        <p className="clase-page__estado">Inscríbete en <strong>{curso.nombre}</strong> para acceder a sus clases.</p>
        <Link href={`/alumno/explorar?curso=${curso.id}`} className="clase-page__enlace">Ir al curso</Link>
      </main>
    );
  }

  const completada = (clase: Clase) => progreso.some((item) => item.claseId === clase.id);
  const indice = Math.max(0, clases.findIndex((clase) => claseId ? clase.id === claseId : !completada(clase)));
  const actual = clases[indice];
  const enlace = (clase: Clase) => `/alumno/curso?id=${curso.id}&clase=${clase.id}`;
  const cursoCompleto = clases.length > 0 && clases.every(completada);
  const evaluacion = examenes.find((examen) => examen.modo === "manual");

  async function cambiarEstado() {
    if (!usuario || !actual) return;
    setGuardando(true);
    setError("");
    try { await marcarClase(usuario.uid, curso!.id, actual.id, !completada(actual)); }
    catch { setError("No se pudo guardar tu avance. Inténtalo nuevamente."); }
    setGuardando(false);
  }

  return (
    <main className="clase-page alumno-fondo">
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

          {cursoCompleto && (
            <section className="clase-page__completo" role="status">
              <span className="clase-page__completo-icono"><Trophy /></span>
              <div>
                <strong>¡Curso completado!</strong>
                <p>{evaluacion ? "Terminaste todas las clases. Ya puedes rendir la evaluación del curso." : "Terminaste todas las clases de este curso."}</p>
              </div>
              {evaluacion
                ? <Link href={`/alumno/examen?id=${evaluacion.id}`} className="clase-page__enlace">Ir a la evaluación</Link>
                : <Link href="/alumno/cursos" className="clase-page__enlace">Ver mis cursos</Link>}
            </section>
          )}

          <div className="clase-page__layout">
            <section>
              <ReproductorClase cursoId={curso.id} claseId={actual.id} />
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
                      <MiniaturaClase cursoId={cursoId} claseId={clase.id} className="clase-page__miniatura">{completada(clase) && <CircleCheck aria-label="Completada" />}</MiniaturaClase>
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

type Problema = "sinVideo" | "premium" | "fallo";
type Video = { claseId: string; url: string; poster?: string; respaldo?: string } | { claseId: string; problema: Problema };

function problemaDe(error: unknown): Problema {
  const { code, details } = error as FunctionsError;
  if (code === "functions/not-found") return "sinVideo";
  if (code === "functions/permission-denied" && (details as { motivo?: string } | undefined)?.motivo === "premium") return "premium";
  return "fallo";
}

function ReproductorClase({ cursoId, claseId }: { cursoId: string; claseId: string }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    pedirVideo(cursoId, claseId)
      .then((datos) => vigente && setVideo({ claseId, ...datos }))
      .catch((error) => vigente && setVideo({ claseId, problema: problemaDe(error) }));
    return () => { vigente = false; };
  }, [cursoId, claseId, intento]);

  const actual = video?.claseId === claseId ? video : null;

  function reintentar() {
    setVideo(null);
    setIntento((anterior) => anterior + 1);
  }

  return (
    <div className="clase-page__video">
      {!actual && <p>Cargando video…</p>}
      {actual && "url" in actual && (
        <video src={actual.url} poster={actual.poster} controls controlsList="nodownload" disablePictureInPicture playsInline preload="metadata"
          onContextMenu={(evento) => evento.preventDefault()} onError={() => setVideo({ claseId, problema: "fallo" })} />
      )}
      {actual && "problema" in actual && (
        <div className="clase-page__video-aviso">
          {actual.problema === "sinVideo" && <p>Esta clase aún no tiene video.</p>}
          {actual.problema === "premium" && (
            <>
              <p>Este video es parte del plan Premium.</p>
              <Link href="/alumno/premium" className="clase-page__enlace alumno-dorado">Conocer Premium</Link>
            </>
          )}
          {actual.problema === "fallo" && (
            <>
              <p>No se pudo cargar el video.</p>
              <button type="button" onClick={reintentar}>Reintentar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
