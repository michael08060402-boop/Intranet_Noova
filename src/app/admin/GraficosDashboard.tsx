"use client";

import { useEffect, useState, type ReactNode } from "react";
import { collectionGroup, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { escucharExamenes, escucharIntentos, type Examen, type Intento } from "@/firebase/evaluaciones";
import type { Alumno } from "@/firebase/perfiles";
import type { Curso } from "@/firebase/cursos";
import "./GraficosDashboard.css";

const mesFecha = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit" });
function claveMes(fecha: number) {
  const partes = mesFecha.formatToParts(fecha);
  return `${partes.find(p => p.type === "year")?.value}-${partes.find(p => p.type === "month")?.value}`;
}
const etiquetaMes = (mes: string) => new Intl.DateTimeFormat("es-PE", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-01T12:00:00Z`));

export default function GraficosDashboard({ cursos, alumnos, fallos = [], children }: { cursos: Curso[] | null; alumnos: Alumno[] | null; fallos?: string[]; children?: ReactNode }) {
  const [periodo, setPeriodo] = useState(6);
  const [mes, setMes] = useState(() => claveMes(Date.now()));
  const [curso, setCurso] = useState("");
  const [inscripciones, setInscripciones] = useState<Record<string, number> | null>(null);
  const [examenes, setExamenes] = useState<Examen[] | null>(null);
  const [intentos, setIntentos] = useState<Intento[] | null>(null);
  const [error, setError] = useState<string[]>([]);
  useEffect(() => {
    const fallo = (nombre: string) => () => setError(actual => [...new Set([...actual, nombre])]);
    const a = onSnapshot(collectionGroup(db, "inscripciones"), snapshot => {
      const inscritos = new Map<string, Set<string>>();
      snapshot.docs.forEach(documento => {
        const id = documento.data().cursoId;
        const uid = documento.ref.parent.parent?.id;
        if (typeof id !== "string" || !uid) return;
        if (!inscritos.has(id)) inscritos.set(id, new Set());
        inscritos.get(id)!.add(uid);
      });
      setInscripciones(Object.fromEntries([...inscritos].map(([id, usuarios]) => [id, usuarios.size])));
    }, fallo("inscripciones"));
    const b = escucharExamenes(false, setExamenes, fallo("evaluaciones"));
    const c = escucharIntentos(null, setIntentos, fallo("resultados"));
    return () => { a(); b(); c(); };
  }, []);

  const meses = Array.from({ length: periodo }, (_, i) => {
    const fecha = new Date(`${mes}-01T12:00:00Z`);
    fecha.setUTCMonth(fecha.getUTCMonth() - periodo + i + 1);
    const clave = fecha.toISOString().slice(0, 7);
    return { clave, cantidad: (alumnos ?? []).filter(a => a.creadoEn > 0 && claveMes(a.creadoEn) === clave).length };
  });
  const maximo = Math.max(1, ...meses.map(m => m.cantidad));
  const filas = (cursos ?? []).filter(c => !curso || c.id === curso).map(c => ({ ...c, cantidad: inscripciones?.[c.id] ?? 0 })).sort((a, b) => b.cantidad - a.cantidad);
  const maxInscritos = Math.max(1, ...filas.map(f => f.cantidad));
  let aprobadas = 0, desaprobadas = 0, pendientes = 0, sinExamen = 0;
  (intentos ?? []).filter(i => !curso || i.cursoId === curso).forEach(i => {
    if (i.estado === "entregado") pendientes++;
    if (i.estado !== "calificado") return;
    const examen = examenes?.find(e => e.id === i.examenId);
    if (!examen || i.nota === null) { sinExamen++; return; }
    if (i.nota >= examen.notaMinima) aprobadas++; else desaprobadas++;
  });
  const total = aprobadas + pendientes + desaprobadas;
  const estados = [{ nombre: "Aprobadas", cantidad: aprobadas, color: "var(--grafico-principal)" }, { nombre: "Pendientes de nota", cantidad: pendientes, color: "var(--grafico-secundario)" }, { nombre: "Desaprobadas", cantidad: desaprobadas, color: "var(--grafico-terciario)" }];
  const p = total ? aprobadas / total * 100 : 0;
  const q = total ? pendientes / total * 100 : 0;
  return <div className="dashboard-graficos">
    {fallos.length > 0 && <p role="alert">No se pudieron cargar todos los datos del dashboard. Recarga para reintentar.</p>}
    <section className="dashboard-grafico" aria-labelledby="registros-titulo">
      <header><div><h2 id="registros-titulo">Registros por mes</h2><p>Alumnos registrados en la plataforma</p></div><div className="dashboard-grafico__filtros">
        <input type="month" aria-label="Mes final del gráfico de registros" value={mes} onChange={e => { if (e.target.value) setMes(e.target.value); }} />
        <select aria-label="Periodo de registros" value={periodo} onChange={e => setPeriodo(Number(e.target.value))}><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option></select>
      </div></header>
      {alumnos === null ? <p role="status">Cargando registros…</p> : <><div className="dashboard-barras">{meses.map(m => <div key={m.clave}><strong>{m.cantidad}</strong><span style={{ height: `${m.cantidad / maximo * 140}px` }} /><small>{etiquetaMes(m.clave)}</small></div>)}</div></>}
    </section>
    <section className="dashboard-grafico" aria-labelledby="inscritos-titulo">
      <header><div><h2 id="inscritos-titulo">Alumnos por curso</h2><p>Inscripciones actuales, incluidos cursos en borrador</p></div><select aria-label="Curso de los gráficos de alumnos y evaluaciones" value={curso} onChange={e => setCurso(e.target.value)}><option value="">Todos los cursos</option>{(cursos ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></header>
      {error.includes("inscripciones") ? <p role="alert">No se pudieron consultar las inscripciones.</p> : inscripciones === null || cursos === null ? <p role="status">Cargando inscripciones…</p> : filas.length === 0 ? <p>No hay cursos.</p> : <ul className="dashboard-horizontales">{filas.map(f => <li key={f.id}><span>{f.nombre}</span><span className="dashboard-horizontales__fondo" aria-hidden="true"><i style={{ width: `${f.cantidad / maxInscritos * 100}%` }} /></span><strong>{f.cantidad}</strong></li>)}</ul>}
    </section>
    <section className="dashboard-grafico" aria-labelledby="resultados-titulo">
      <header><div><h2 id="resultados-titulo">Estado de evaluaciones</h2><p>Entregadas y calificadas · {curso ? cursos?.find(c => c.id === curso)?.nombre : "Todos los cursos"}</p></div></header>
      {error.some(e => e === "evaluaciones" || e === "resultados") ? <p role="alert">No se pudieron consultar los resultados.</p> : intentos === null || examenes === null ? <p role="status">Cargando resultados…</p> : <><div className="dashboard-resultados"><div className="dashboard-anillo" aria-hidden="true" style={{ background: total ? `conic-gradient(var(--grafico-principal) 0 ${p}%, var(--grafico-secundario) ${p}% ${p + q}%, var(--grafico-terciario) ${p + q}% 100%)` : "var(--superficie-suave)" }}><div><strong>{total}</strong><span>Evaluaciones</span></div></div><ul>{estados.map(e => <li key={e.nombre}><i style={{ background: e.color }} aria-hidden="true" /><span>{e.nombre}</span><strong>{e.cantidad}</strong><small>{total ? Math.round(e.cantidad / total * 100) : 0}%</small></li>)}</ul></div>{total === 0 && <p>Aún no hay evaluaciones entregadas o calificadas.</p>}{sinExamen > 0 && <p>{sinExamen} resultados sin nota o sin examen disponible no se incluyen en el gráfico.</p>}</>}
    </section>
    {children}
  </div>;
}
