"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CirclePlay, ClipboardCheck, Crown, Lock } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, nombresNivel, type Clase, type Curso } from "@/firebase/cursos";
import { escucharExamenesDeCurso, escucharIntentosAlumno, NOTA_MAXIMA, type Examen, type Intento } from "@/firebase/evaluaciones";

export default function CursoDetalle({ curso, categoria, bloqueado, alVolver }: { curso: Curso; categoria: string; bloqueado: boolean; alVolver: () => void }) {
  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const { usuario } = useSesion();
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

  return (
    <main className="student-explore">
      <button type="button" className="student-explore__volver" onClick={alVolver}>← Volver al catálogo</button>
      <section className="student-curso" aria-labelledby="student-curso-titulo">
        <span className="student-curso__cover"><BookOpen /></span>
        <div>
          <small className="student-curso__categoria">{categoria}</small>
          <h1 id="student-curso-titulo">{curso.nombre}</h1>
          {curso.descripcion && <p>{curso.descripcion}</p>}
          <div className="student-explore__meta">
            <span>{nombresNivel[curso.nivel]}</span>
            <span className={`student-explore__badge student-explore__badge--${curso.acceso}`}>{curso.acceso === "premium" ? "Premium" : "Gratis"}</span>
            <span>{clases.length} {clases.length === 1 ? "clase" : "clases"}</span>
          </div>
        </div>
      </section>
      {bloqueado && (
        <div className="student-curso__premium" role="note">
          <span><Crown /></span>
          <div>
            <strong>Este curso es Premium</strong>
            <p>Puedes ver su temario, pero necesitas el plan Premium para acceder a sus clases.</p>
          </div>
          <Link href="/alumno/premium"><Crown />Hazte Premium</Link>
        </div>
      )}
      <section className={`student-curso__clases ${bloqueado ? "is-bloqueado" : ""}`} aria-labelledby="student-curso-clases">
        <h2 id="student-curso-clases">Contenido del curso</h2>
        {error ? <p className="student-curso__aviso" role="alert">{error}</p>
          : cargando ? <p className="student-curso__aviso">Cargando clases…</p>
          : clases.length === 0 ? <p className="student-curso__aviso">Este curso aún no tiene clases publicadas.</p>
          : (
            <ol>
              {clases.map((clase, indice) => (
                <li key={clase.id}>
                  <span className="student-curso__numero">{indice + 1}</span>
                  <div>
                    <strong>{clase.nombre}</strong>
                    {clase.descripcion && <small>{clase.descripcion}</small>}
                  </div>
                  {bloqueado ? <Lock /> : <CirclePlay />}
                </li>
              ))}
            </ol>
          )}
        {!bloqueado && <p className="student-curso__nota">Los videos de cada clase estarán disponibles próximamente.</p>}
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
