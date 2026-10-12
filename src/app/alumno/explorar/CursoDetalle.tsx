"use client";

import { useEffect, useState } from "react";
import MiniaturaClase from "@/components/alumno/MiniaturaClase";
import PortadaCurso from "@/components/alumno/PortadaCurso";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesColumn, CircleCheck, CirclePlay, ClipboardCheck, Crown, Lock, Play, PlusCircle, Tag } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharProgreso, inscribirse, nombresNivel, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, escucharIntentosAlumno, estadoExamen, type Examen, type Intento } from "@/firebase/evaluaciones";

export default function CursoDetalle({ curso, categoria, bloqueado, inscrito, alVolver }: { curso: Curso; categoria: string; bloqueado: boolean; inscrito: boolean; alVolver: () => void }) {
  const { usuario } = useSesion();
  const [clases, setClases] = useState<Clase[]>([]);
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

  useEffect(() => escucharExamenesDeCurso(curso.id, setExamenes, () => setExamenes([])), [curso.id]);
  useEffect(() => (uid ? escucharIntentosAlumno(uid, setIntentos, () => setIntentos([])) : undefined), [uid]);

  useEffect(() => {
    if (!usuario) return;
    return escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.cursoId === curso.id && item.completado)), () => setError("No se pudo consultar tu progreso."));
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
  const evaluaciones = examenes.filter((examen) => examen.modo === "manual");

  return (
    <main className="alumno-explorar">
      <button type="button" className="alumno-explorar__volver" onClick={alVolver}><ArrowLeft />Volver al catálogo</button>
      <section className="alumno-curso" aria-labelledby="alumno-curso-titulo">
        <PortadaCurso className="alumno-curso__portada" portadaKey={curso.portadaKey} version={curso.versionPortada} nombre={curso.nombre} />
        <div className="alumno-curso__info">
          <small className="alumno-curso__categoria">{categoria}</small>
          <h1 id="alumno-curso-titulo">{curso.nombre}</h1>
          {curso.descripcion && <p>{curso.descripcion}</p>}
          <div className="alumno-curso__datos">
            <span><ChartNoAxesColumn />{nombresNivel[curso.nivel]}</span>
            <span><BookOpen />{clases.length} {clases.length === 1 ? "clase" : "clases"}</span>
            <span>{curso.acceso === "premium" ? <><Crown />Premium</> : <><Tag />Gratuito</>}</span>
            {evaluaciones.length > 0 && <span><ClipboardCheck />{evaluaciones.length} {evaluaciones.length === 1 ? "evaluación" : "evaluaciones"}</span>}
          </div>
          {inscrito ? (
            <div className="alumno-curso__accion">
              <div>
                <strong>Tu avance: {porcentaje}%</strong>
                <span className="alumno-curso__barra"><span style={{ width: `${porcentaje}%` }} /></span>
                <small>{completadas.length} de {clases.length} {clases.length === 1 ? "clase" : "clases"}</small>
              </div>
              {siguiente && <Link href={enlaceClase(siguiente.id)} className="alumno-curso__principal">{completadas.length > 0 ? "Continuar curso" : "Comenzar curso"}<ArrowRight /></Link>}
            </div>
          ) : bloqueado ? (
            <div className="alumno-curso__accion">
              <Link href="/alumno/premium" className="alumno-curso__planes alumno-dorado">Ver planes<ArrowRight /></Link>
            </div>
          ) : (
            <div className="alumno-curso__accion">
              <button type="button" className="alumno-curso__principal" onClick={inscribir} disabled={inscribiendo || cargando}>
                <PlusCircle />{inscribiendo ? "Inscribiendo…" : curso.acceso === "gratis" ? "Inscribirse gratis" : "Inscribirse"}
              </button>
            </div>
          )}
          {error && <p className="alumno-curso__error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="alumno-curso__clases" aria-labelledby="alumno-curso-clases">
        <div className="alumno-curso__clases-titulo">
          <div>
            <h2 id="alumno-curso-clases">Contenido del curso</h2>
            {clases.length > 0 && (
              <small>
                {clases.length} {clases.length === 1 ? "clase" : "clases"} · {inscrito ? `${completadas.length} completadas` : bloqueado ? "Contenido bloqueado" : "Inscríbete para acceder"}
              </small>
            )}
          </div>
        </div>
        {cargando ? <p className="alumno-curso__aviso">Cargando clases…</p>
          : clases.length === 0 ? <p className="alumno-curso__aviso">Este curso aún no tiene clases publicadas.</p>
          : (
            <ol>
              {clases.map((clase, indice) => {
                const completada = completadas.includes(clase);
                const habilitada = inscrito && !bloqueado && clases.slice(0, indice).every((anterior) => completadas.includes(anterior));
                return (
                  <li key={clase.id}>
                    <span className="alumno-curso__numero">{String(indice + 1).padStart(2, "0")}</span>
                    <MiniaturaClase miniatura={clase.miniatura} className="alumno-curso__miniatura">{habilitada ? <CirclePlay /> : <Lock />}</MiniaturaClase>
                    <div>
                      <strong>{clase.nombre}</strong>
                      {clase.descripcion && <small>{clase.descripcion}</small>}
                    </div>
                    {habilitada ? (
                      <Link href={enlaceClase(clase.id)} className={`alumno-curso__reproducir ${completada ? "is-completada" : ""}`}>
                        {completada ? <><CircleCheck />Completada</> : <><Play />Reproducir</>}
                      </Link>
                    ) : inscrito && <span><Lock aria-hidden="true" />Bloqueada</span>}
                  </li>
                );
              })}
            </ol>
          )}
      </section>
      {evaluaciones.length > 0 && (
        <section className={`alumno-curso__clases alumno-curso__examenes ${bloqueado ? "is-bloqueado" : ""}`} aria-labelledby="alumno-curso-examenes">
          <h2 id="alumno-curso-examenes">Evaluaciones</h2>
          <ol>
            {evaluaciones.map((examen) => {
              const { texto, accion } = estadoExamen(examen, intentos.find((intento) => intento.examenId === examen.id));
              return (
                <li key={examen.id}>
                  <span className="alumno-curso__numero"><ClipboardCheck /></span>
                  <div>
                    <strong>{examen.nombre}</strong>
                    <small>{bloqueado ? "Requiere el plan Premium" : texto} · {examen.preguntas.length} {examen.preguntas.length === 1 ? "pregunta" : "preguntas"} · {examen.duracionMin > 0 ? `${examen.duracionMin} min` : "sin límite de tiempo"}</small>
                  </div>
                  {bloqueado || !inscrito || clases.length === 0 || completadas.length !== clases.length ? <span><Lock aria-hidden="true" />Completa todas las clases</span> : <Link href={`/alumno/examen?id=${examen.id}`} className="alumno-curso__rendir">{accion}</Link>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </main>
  );
}
