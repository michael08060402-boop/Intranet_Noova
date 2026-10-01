"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleCheck, CirclePlay, ClipboardCheck, Crown, Lock, Play, PlusCircle } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharInscripciones, escucharProgreso, inscribirse, nombresNivel, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, escucharIntentosAlumno, NOTA_MAXIMA, type Examen, type Intento } from "@/firebase/evaluaciones";

export default function CursoDetalle({ curso, categoria, bloqueado, alVolver }: { curso: Curso; categoria: string; bloqueado: boolean; alVolver: () => void }) {
  const { usuario } = useSesion();
  const [clases, setClases] = useState<Clase[]>([]);
  const [inscrito, setInscrito] = useState(false);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [error, setError] = useState("");
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const uid = usuario?.uid;

  useEffect(() => escucharClases(curso.id, true, (lista) => { setClases(lista); setCargando(false); }, () => {
    setError("No se pudieron cargar las clases del curso.");
    setCargando(false);
  }), [curso.id]);

  // Los exámenes y las notas propias; si fallan, el curso se ve igual sin la sección.
  useEffect(() => escucharExamenesDeCurso(curso.id, setExamenes, () => setExamenes([])), [curso.id]);
  useEffect(() => (uid ? escucharIntentosAlumno(uid, setIntentos, () => setIntentos([])) : undefined), [uid]);

  function estadoExamen(examen: Examen) {
    const intento = intentos.find((actual) => actual.examenId === examen.id);
    if (!intento) return { texto: "Sin rendir", accion: "Rendir examen" };
    if (intento.estado === "en_curso") return { texto: "En curso", accion: "Continuar" };
    if (intento.estado === "entregado") return { texto: "Entregado · pendiente de nota", accion: "Ver" };
    return { texto: `Nota ${intento.nota} de ${NOTA_MAXIMA} · ${(intento.nota ?? 0) >= examen.notaMinima ? "Aprobado" : "Desaprobado"}`, accion: "Ver resultado" };
  }

  useEffect(() => {
    if (!usuario) return;
    const fallo = () => setError("No se pudo consultar tu inscripción.");
    const dejarInscripciones = escucharInscripciones(usuario.uid, (ids) => setInscrito(ids.includes(curso.id)), fallo);
    const dejarProgreso = escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.cursoId === curso.id && item.completado)), fallo);
    return () => { dejarInscripciones(); dejarProgreso(); };
  }, [usuario, curso.id]);

  async function inscribir() {
    if (!usuario) return;
    setInscribiendo(true);
    setError("");
    try { await inscribirse(usuario.uid, curso.id); }
    catch { setError("No se pudo completar la inscripción. Inténtalo nuevamente."); }
    setInscribiendo(false);
  }

  const completadas = clases.filter((clase) => progreso.some((item) => item.claseId === clase.id));
  const porcentaje = clases.length ? Math.round((completadas.length / clases.length) * 100) : 0;
  const siguiente = clases.find((clase) => !completadas.includes(clase)) ?? clases[0];
  const enlaceClase = (claseId: string) => `/alumno/curso?id=${curso.id}&clase=${claseId}`;

  return (
    <main className="student-explore">
      <button type="button" className="student-explore__volver" onClick={alVolver}><ArrowLeft />Volver al catálogo</button>
      <section className="student-curso" aria-labelledby="student-curso-titulo">
        <span className="student-curso__cover"><CirclePlay /></span>
        <div className="student-curso__info">
          <small className="student-curso__categoria">{categoria}</small>
          <h1 id="student-curso-titulo">{curso.nombre}</h1>
          {curso.descripcion && <p>{curso.descripcion}</p>}
          <div className="student-explore__meta">
            <span>{nombresNivel[curso.nivel]}</span>
            <span className={`student-explore__badge student-explore__badge--${curso.acceso}`}>{curso.acceso === "premium" ? "Premium" : "Gratis"}</span>
            <span>{clases.length} {clases.length === 1 ? "clase" : "clases"}</span>
          </div>
          <div className="student-curso__acciones">
            {inscrito ? (
              <>
                {siguiente && <Link href={enlaceClase(siguiente.id)} className="student-curso__principal"><Play />{completadas.length > 0 ? "Continuar curso" : "Comenzar curso"}</Link>}
                <span className="student-curso__inscrito"><Check />Inscrito</span>
              </>
            ) : bloqueado ? (
              <Link href="/alumno/premium" className="student-curso__premium-boton"><Crown />Hazte Premium para inscribirte</Link>
            ) : (
              <button type="button" className="student-curso__principal" onClick={inscribir} disabled={inscribiendo || cargando}>
                <PlusCircle />{inscribiendo ? "Inscribiendo…" : curso.acceso === "gratis" ? "Inscribirse gratis" : "Inscribirse"}
              </button>
            )}
          </div>
          {error && <p className="student-curso__error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="student-curso__clases" aria-labelledby="student-curso-clases">
        <div className="student-curso__clases-titulo">
          <h2 id="student-curso-clases">{inscrito ? "Contenido del curso" : "Vista previa del contenido"}</h2>
          {inscrito && clases.length > 0 && (
            <div className="student-curso__avance">
              <span>{porcentaje}% completado</span>
              <span className="student-curso__barra"><span style={{ width: `${porcentaje}%` }} /></span>
            </div>
          )}
        </div>
        {cargando ? <p className="student-curso__aviso">Cargando clases…</p>
          : clases.length === 0 ? <p className="student-curso__aviso">Este curso aún no tiene clases publicadas.</p>
          : (
            <ol>
              {clases.map((clase, indice) => {
                const completada = completadas.includes(clase);
                return (
                  <li key={clase.id}>
                    <span className="student-curso__numero">{String(indice + 1).padStart(2, "0")}</span>
                    <span className="student-curso__miniatura">{inscrito ? <CirclePlay /> : <Lock />}</span>
                    <div>
                      <strong>{clase.nombre}</strong>
                      {clase.descripcion && <small>{clase.descripcion}</small>}
                    </div>
                    {inscrito && (
                      <Link href={enlaceClase(clase.id)} className={`student-curso__reproducir ${completada ? "is-completada" : ""}`}>
                        {completada ? <><CircleCheck />Completada</> : <><Play />Reproducir</>}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        {!inscrito && clases.length > 0 && <p className="student-curso__nota">{bloqueado ? "Este curso es Premium. Hazte Premium para inscribirte y acceder a sus clases." : "Inscríbete para acceder a las clases del curso."}</p>}
      </section>
      {examenes.some((examen) => examen.modo === "manual") && (
        <section className={`student-curso__clases student-curso__examenes ${bloqueado ? "is-bloqueado" : ""}`} aria-labelledby="student-curso-examenes">
          <h2 id="student-curso-examenes">Evaluaciones</h2>
          <ol>
            {examenes.filter((examen) => examen.modo === "manual").map((examen) => {
              const { texto, accion } = estadoExamen(examen);
              return (
                <li key={examen.id}>
                  <span className="student-curso__numero"><ClipboardCheck /></span>
                  <div>
                    <strong>{examen.nombre}</strong>
                    <small>{bloqueado ? "Requiere el plan Premium" : texto} · {examen.preguntas.length} {examen.preguntas.length === 1 ? "pregunta" : "preguntas"} · {examen.duracionMin > 0 ? `${examen.duracionMin} min` : "sin límite de tiempo"}</small>
                  </div>
                  {bloqueado ? <Lock /> : <Link href={`/alumno/examen?id=${examen.id}`} className="student-curso__rendir">{accion}</Link>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </main>
  );
}
