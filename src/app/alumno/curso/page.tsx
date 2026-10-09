"use client";

import MiniaturaClase from "@/components/alumno/MiniaturaClase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import type { FunctionsError } from "firebase/functions";
import { ChevronRight, Circle, CircleCheck, Trophy } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharCurso, escucharInscripciones, escucharProgreso, marcarClase, pedirVideo, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, type Examen } from "@/firebase/evaluaciones";
import "./Clase.css";

export default function ClasePage() {
  return (
    <Suspense fallback={<main className="clase-pagina alumno-fondo"><p className="clase-pagina__estado">Cargando clase…</p></main>}>
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
  const [clases, setClases] = useState<Clase[] | null>(null);
  const [inscrito, setInscrito] = useState<boolean | undefined>(undefined);
  // Se espera el avance antes de elegir la clase: sin él se abriría la clase 1 y luego saltaría a la pendiente.
  const [progreso, setProgreso] = useState<Progreso[] | null>(null);
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
    const fallo = () => { setError("No se pudo consultar tu avance."); setProgreso([]); };
    const dejarInscripciones = escucharInscripciones(usuario.uid, (ids) => setInscrito(ids.includes(cursoId)), fallo);
    const dejarProgreso = escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.cursoId === cursoId && item.completado)), fallo);
    return () => { dejarInscripciones(); dejarProgreso(); };
  }, [usuario, cursoId]);

  useEffect(() => (cursoId ? escucharExamenesDeCurso(cursoId, setExamenes, () => setExamenes([])) : undefined), [cursoId]);

  if (!cursoId || curso === null) {
    return (
      <main className="clase-pagina alumno-fondo">
        <p className="clase-pagina__estado">Este curso no existe o ya no está disponible.</p>
        <Link href="/alumno/explorar" className="clase-pagina__enlace">Volver a Explorar</Link>
      </main>
    );
  }

  if (curso === undefined || inscrito === undefined || clases === null || progreso === null) {
    return <main className="clase-pagina alumno-fondo"><p className="clase-pagina__estado">Cargando clase…</p></main>;
  }

  if (!inscrito) {
    return (
      <main className="clase-pagina alumno-fondo">
        <p className="clase-pagina__estado">Inscríbete en <strong>{curso.nombre}</strong> para acceder a sus clases.</p>
        <Link href={`/alumno/explorar?curso=${curso.id}`} className="clase-pagina__enlace">Ir al curso</Link>
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
    <main className="clase-pagina alumno-fondo">
      <nav className="clase-pagina__ruta" aria-label="Ruta">
        <Link href="/alumno/cursos">Mis cursos</Link>
        <ChevronRight />
        <Link href={`/alumno/explorar?curso=${curso.id}`}>{curso.nombre}</Link>
        {actual && <><ChevronRight /><span>Clase {indice + 1}</span></>}
      </nav>

      {!actual ? <p className="clase-pagina__estado">Este curso aún no tiene clases publicadas.</p> : (
        <>
          <header className="clase-pagina__encabezado">
            <h1>{actual.nombre}</h1>
            <button type="button" className={`clase-pagina__completar ${completada(actual) ? "is-completada" : ""}`} onClick={cambiarEstado} disabled={guardando}>
              {completada(actual) ? <><CircleCheck />Completada</> : <><Circle />Marcar como completada</>}
            </button>
          </header>
          {error && <p className="clase-pagina__error" role="alert">{error}</p>}

          {cursoCompleto && (
            <section className="clase-pagina__completo" role="status">
              <span className="clase-pagina__completo-icono"><Trophy /></span>
              <div>
                <strong>¡Curso completado!</strong>
                <p>{evaluacion ? "Terminaste todas las clases. Ya puedes rendir la evaluación del curso." : "Terminaste todas las clases de este curso."}</p>
              </div>
              {evaluacion
                ? <Link href={`/alumno/examen?id=${evaluacion.id}`} className="clase-pagina__enlace">Ir a la evaluación</Link>
                : <Link href="/alumno/cursos" className="clase-pagina__enlace">Ver mis cursos</Link>}
            </section>
          )}

          <div className="clase-pagina__distribucion">
            <section>
              <ReproductorClase cursoId={curso.id} claseId={actual.id} poster={actual.miniatura} />
              <div className="clase-pagina__detalle">
                <div className="clase-pagina__pestanas" role="tablist">
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

            <aside className="clase-pagina__lateral" aria-labelledby="clase-page-lista">
              <div className="clase-pagina__lateral-titulo">
                <h2 id="clase-page-lista">Clases del curso</h2>
                <small>{clases.length} {clases.length === 1 ? "clase" : "clases"}</small>
              </div>
              <ol>
                {clases.map((clase, posicion) => (
                  <li key={clase.id}>
                    <Link href={enlace(clase)} className={clase === actual ? "is-actual" : ""} aria-current={clase === actual ? "page" : undefined}>
                      <MiniaturaClase miniatura={clase.miniatura} className="clase-pagina__miniatura">{completada(clase) && <CircleCheck aria-label="Completada" />}</MiniaturaClase>
                      <span className="clase-pagina__numero">{posicion + 1}</span>
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
type Video = { claseId: string; url: string } | { claseId: string; problema: Problema };

function problemaDe(error: unknown): Problema {
  const { code, details } = error as FunctionsError;
  if (code === "functions/not-found") return "sinVideo";
  if (code === "functions/permission-denied" && (details as { motivo?: string } | undefined)?.motivo === "premium") return "premium";
  return "fallo";
}

function ReproductorClase({ cursoId, claseId, poster }: { cursoId: string; claseId: string; poster?: string }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [intento, setIntento] = useState(0);
  const reanudarEn = useRef(0);
  const renovado = useRef(false);

  useEffect(() => {
    let vigente = true;
    pedirVideo(cursoId, claseId)
      .then((url) => vigente && setVideo({ claseId, url }))
      .catch((error) => vigente && setVideo({ claseId, problema: problemaDe(error) }));
    return () => { vigente = false; };
  }, [cursoId, claseId, intento]);

  useEffect(() => { renovado.current = false; reanudarEn.current = 0; }, [claseId]);

  const actual = video?.claseId === claseId ? video : null;

  function reintentar() {
    setVideo(null);
    setIntento((anterior) => anterior + 1);
  }

  // El enlace de Microsoft vence en cerca de una hora: se pide uno nuevo una vez y se continúa donde iba.
  function alFallar(elemento: HTMLVideoElement) {
    if (renovado.current) return setVideo({ claseId, problema: "fallo" });
    renovado.current = true;
    reanudarEn.current = elemento.currentTime;
    reintentar();
  }

  return (
    <div className="clase-pagina__video">
      {!actual && <p>Cargando video…</p>}
      {actual && "url" in actual && (
        <video src={actual.url} poster={poster} controls controlsList="nodownload" disablePictureInPicture playsInline preload="metadata"
          onContextMenu={(evento) => evento.preventDefault()} onError={(evento) => alFallar(evento.currentTarget)}
          onLoadedMetadata={(evento) => { if (reanudarEn.current > 0) evento.currentTarget.currentTime = reanudarEn.current; }}
          onPlaying={() => { renovado.current = false; reanudarEn.current = 0; }} />
      )}
      {actual && "problema" in actual && (
        <div className="clase-pagina__video-aviso">
          {actual.problema === "sinVideo" && <p>Esta clase aún no tiene video.</p>}
          {actual.problema === "premium" && (
            <>
              <p>Este video es parte del plan Premium.</p>
              <Link href="/alumno/premium" className="clase-pagina__enlace alumno-dorado">Conocer Premium</Link>
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
