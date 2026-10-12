"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { EstadoVacio, TituloPagina } from "@/components/alumno/PiezasCatalogo";
import { escucharClases, escucharCursos, escucharInscripciones, escucharProgreso, type Curso, type Progreso } from "@/firebase/cursos";
import { escucharExamenes, escucharIntentosAlumno, estadoExamen, type Examen, type Intento } from "@/firebase/evaluaciones";
import "./Evaluaciones.css";

const filtros = ["Todas", "Pendientes", "Entregadas", "Calificadas"];

export default function MisEvaluaciones() {
  const { usuario, perfil } = useSesion();
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscritos, setInscritos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [clasesCurso, setClasesCurso] = useState<Record<string, string[]>>({});
  const idsCursos = [...new Set(examenes.filter((examen) => inscritos.includes(examen.cursoId)).map((examen) => examen.cursoId))].sort().join(",");
  useEffect(() => usuario ? escucharProgreso(usuario.uid, setProgreso, () => setError("No se pudo consultar tu avance.")) : undefined, [usuario]);
  useEffect(() => {
    if (!idsCursos) return;
    const dejar = idsCursos.split(",").map((id) => escucharClases(id, true, (lista) => setClasesCurso((actual) => ({ ...actual, [id]: lista.map((clase) => clase.id) })), () => setError("No se pudieron consultar las clases.")));
    return () => dejar.forEach((cerrar) => cerrar());
  }, [idsCursos]);

  useEffect(() => {
    if (!usuario) return;
    const fallo = () => { setError("No se pudieron cargar tus evaluaciones."); setCargando(false); };
    const dejarExamenes = escucharExamenes(true, (lista) => { setExamenes(lista); setCargando(false); }, fallo);
    const dejarIntentos = escucharIntentosAlumno(usuario.uid, setIntentos, fallo);
    const dejarCursos = escucharCursos(true, setCursos, fallo);
    const dejarInscripciones = escucharInscripciones(usuario.uid, setInscritos, fallo);
    return () => { dejarExamenes(); dejarIntentos(); dejarCursos(); dejarInscripciones(); };
  }, [usuario]);

  const intentoDe = (examen: Examen) => intentos.find((intento) => intento.examenId === examen.id);
  const cursoDe = (examen: Examen) => cursos.find((curso) => curso.id === examen.cursoId);

  function grupo(examen: Examen) {
    const intento = intentoDe(examen);
    if (!intento || intento.estado === "en_curso") return "Pendientes";
    return intento.estado === "entregado" ? "Entregadas" : "Calificadas";
  }

  const misExamenes = examenes.filter((examen) => examen.modo === "manual" && cursoDe(examen)
    && (inscritos.includes(examen.cursoId) || intentoDe(examen)));
  const visibles = misExamenes.filter((examen) => filtro === "Todas" || grupo(examen) === filtro);

  return (
    <main className="mis-evaluaciones alumno-fondo">
      <TituloPagina className="mis-evaluaciones__titulo" titulo="Mis evaluaciones" />
      <div className="mis-evaluaciones__filtros" aria-label="Filtrar evaluaciones">
        {filtros.map((nombre) => (
          <button key={nombre} type="button" aria-pressed={filtro === nombre} className={filtro === nombre ? "is-activo" : ""} onClick={() => setFiltro(nombre)}>
            {nombre}
            <span>{nombre === "Todas" ? misExamenes.length : misExamenes.filter((examen) => grupo(examen) === nombre).length}</span>
          </button>
        ))}
      </div>

      {error && <p className="mis-evaluaciones__error" role="alert">{error}</p>}
      {cargando ? <p className="mis-evaluaciones__estado">Cargando evaluaciones…</p>
        : visibles.length === 0 ? (
          <EstadoVacio
            className="mis-evaluaciones__vacio"
            titulo={filtro === "Todas" ? "Aún no tienes evaluaciones" : `No tienes evaluaciones ${filtro.toLowerCase()}`}
          >
            <Link href="/alumno/cursos" className="mis-evaluaciones__enlace">Ir a mis cursos</Link>
          </EstadoVacio>
        ) : (
          <ul className="mis-evaluaciones__lista">
            {visibles.map((examen) => {
              const curso = cursoDe(examen);
              const bloqueado = curso?.acceso === "premium" && perfil?.plan !== "premium";
              const { texto, accion } = estadoExamen(examen, intentoDe(examen));
              return (
                <li key={examen.id} className="mis-evaluaciones__examen">
                  <span className="mis-evaluaciones__icono"><ClipboardCheck /></span>
                  <div className="mis-evaluaciones__info">
                    <strong>{examen.nombre}</strong>
                    <small>{curso?.nombre} · {examen.preguntas.length} {examen.preguntas.length === 1 ? "pregunta" : "preguntas"} · {examen.duracionMin > 0 ? `${examen.duracionMin} min` : "sin límite de tiempo"}</small>
                  </div>
                  <span className={`mis-evaluaciones__resultado mis-evaluaciones__resultado--${grupo(examen).toLowerCase()}`}>{bloqueado ? "Requiere el plan Premium" : texto}</span>
                  {bloqueado ? <Lock className="mis-evaluaciones__candado" /> : !intentos.some((item) => item.examenId === examen.id) && (!clasesCurso[examen.cursoId]?.length || !clasesCurso[examen.cursoId].every((id) => progreso.some((item) => item.cursoId === examen.cursoId && item.claseId === id && item.completado))) ? <span className="mis-evaluaciones__accion"><Lock aria-hidden="true" />Completa las clases</span> : <Link href={`/alumno/examen?id=${examen.id}`} className="mis-evaluaciones__accion">{accion}</Link>}
                </li>
              );
            })}
          </ul>
        )}
    </main>
  );
}
