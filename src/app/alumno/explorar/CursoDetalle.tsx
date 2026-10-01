"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesColumn, CircleCheck, CirclePlay, ClipboardCheck, Crown, Lock, Play, PlusCircle, Tag } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharInscripciones, escucharProgreso, inscribirse, nombresNivel, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, escucharIntentosAlumno, estadoExamen, type Examen, type Intento } from "@/firebase/evaluaciones";

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
  // Solo los exámenes en línea se rinden desde la plataforma.
  const evaluaciones = examenes.filter((examen) => examen.modo === "manual");

  return (
    <main className="student-explore">
      <button type="button" className="student-explore__volver" onClick={alVolver}><ArrowLeft />Volver al catálogo</button>
      <section className="student-curso" aria-labelledby="student-curso-titulo">
        <div className="student-curso__cover" />
        <div className="student-curso__info">
          <small className="student-curso__categoria">{categoria}</small>
          <h1 id="student-curso-titulo">{curso.nombre}</h1>
          {curso.descripcion && <p>{curso.descripcion}</p>}
          <div className="student-curso__datos">
            <span><ChartNoAxesColumn />{nombresNivel[curso.nivel]}</span>
            <span><BookOpen />{clases.length} {clases.length === 1 ? "clase" : "clases"}</span>
            <span>{curso.acceso === "premium" ? <><Crown />Premium</> : <><Tag />Gratuito</>}</span>
            {evaluaciones.length > 0 && <span><ClipboardCheck />{evaluaciones.length} {evaluaciones.length === 1 ? "evaluación" : "evaluaciones"}</span>}
          </div>
          {inscrito ? (
            <div className="student-curso__accion">
              <div>
                <strong>Tu avance: {porcentaje}%</strong>
                <span className="student-curso__barra"><span style={{ width: `${porcentaje}%` }} /></span>
                <small>{completadas.length} de {clases.length} {clases.length === 1 ? "clase" : "clases"}</small>
              </div>
              {siguiente && <Link href={enlaceClase(siguiente.id)} className="student-curso__principal">{completadas.length > 0 ? "Continuar curso" : "Comenzar curso"}<ArrowRight /></Link>}
            </div>
          ) : bloqueado ? (
            <div className="student-curso__accion">
              <Link href="/alumno/premium" className="student-curso__planes student-dorado">Ver planes<ArrowRight /></Link>
            </div>
          ) : (
            <div className="student-curso__accion">
              <button type="button" className="student-curso__principal" onClick={inscribir} disabled={inscribiendo || cargando}>
                <PlusCircle />{inscribiendo ? "Inscribiendo…" : curso.acceso === "gratis" ? "Inscribirse gratis" : "Inscribirse"}
              </button>
            </div>
          )}
          {error && <p className="student-curso__error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="student-curso__clases" aria-labelledby="student-curso-clases">
        <div className="student-curso__clases-titulo">
          <div>
            <h2 id="student-curso-clases">Contenido del curso</h2>
            {clases.length > 0 && (
              <small>
                {clases.length} {clases.length === 1 ? "clase" : "clases"} · {inscrito ? `${completadas.length} completadas` : bloqueado ? "Contenido bloqueado" : "Inscríbete para acceder"}
              </small>
            )}
          </div>
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
      </section>
      {evaluaciones.length > 0 && (
        <section className={`student-curso__clases student-curso__examenes ${bloqueado ? "is-bloqueado" : ""}`} aria-labelledby="student-curso-examenes">
          <h2 id="student-curso-examenes">Evaluaciones</h2>
          <ol>
            {evaluaciones.map((examen) => {
              const { texto, accion } = estadoExamen(examen, intentos.find((intento) => intento.examenId === examen.id));
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
