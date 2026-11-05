"use client";

import { useEffect, useState } from "react";
import { BookOpen, ClipboardCheck, Download, Search, Users } from "lucide-react";
import { contarClasesPublicadas, escucharClases, escucharCursos, listarInscritos, type Clase, type Curso, type Inscrito } from "@/firebase/cursos";
import { escucharExamenes, escucharIntentos, NOTA_MAXIMA, type Examen, type Intento } from "@/firebase/evaluaciones";
import { escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import "../AdminPagina.css";
import "./Reportes.css";

type AvanceCurso = { inscritos: Inscrito[]; publicadas: number };

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });
const promedio = (notas: number[]) => (notas.length > 0 ? Math.round((notas.reduce((suma, nota) => suma + nota, 0) / notas.length) * 10) / 10 : null);
const porcentaje = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)} %` : "—");

function Avance({ valor }: { valor: number }) {
  return (
    <div className="reportes__avance">
      <span className="reportes__barra"><span style={{ width: `${valor}%` }} /></span>
      <small>{valor} %</small>
    </div>
  );
}

export default function ReportesPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [avance, setAvance] = useState<Record<string, AvanceCurso> | null>(null);
  const [cursoAvance, setCursoAvance] = useState("todos");
  const [clasesAvance, setClasesAvance] = useState<Clase[]>([]);
  const [exportandoAlumnos, setExportandoAlumnos] = useState(false);
  const [exportandoResultados, setExportandoResultados] = useState(false);
  const [datosReporteListos, setDatosReporteListos] = useState({ alumnos: false, cursos: false, examenes: false, intentos: false });

  useEffect(() => {
    const fallo = () => { setError("No se pudieron cargar todos los datos. Revisa tu conexión."); setCargando(false); };
    const dejarAlumnos = escucharAlumnos((lista) => { setAlumnos(lista); setCargando(false); setDatosReporteListos((actual) => ({ ...actual, alumnos: true })); }, fallo);
    const dejarCursos = escucharCursos(false, (lista) => { setCursos(lista); setDatosReporteListos((actual) => ({ ...actual, cursos: true })); }, fallo);
    const dejarExamenes = escucharExamenes(false, (lista) => { setExamenes(lista); setDatosReporteListos((actual) => ({ ...actual, examenes: true })); }, fallo);
    const dejarIntentos = escucharIntentos(null, (lista) => { setIntentos(lista); setDatosReporteListos((actual) => ({ ...actual, intentos: true })); }, fallo);
    return () => { dejarAlumnos(); dejarCursos(); dejarExamenes(); dejarIntentos(); };
  }, []);

  const idsPublicados = cursos.filter((curso) => curso.publicado).map((curso) => curso.id).join(",");

  useEffect(() => {
    if (!idsPublicados) return;
    Promise.all(idsPublicados.split(",").map(async (id) => {
      const [inscritos, publicadas] = await Promise.all([listarInscritos(id), contarClasesPublicadas(id)]);
      return [id, { inscritos, publicadas }] as const;
    }))
      .then((lista) => setAvance(Object.fromEntries(lista)))
      .catch(() => setError("No se pudo cargar el avance de los cursos."));
  }, [idsPublicados]);

  useEffect(() => {
    if (cursoAvance === "todos") return;
    return escucharClases(cursoAvance, true, setClasesAvance, () => setClasesAvance([]));
  }, [cursoAvance]);

  const nombreCurso = (id: string) => cursos.find((curso) => curso.id === id)?.nombre ?? "Curso eliminado";
  const examenDe = (intento: Intento) => examenes.find((examen) => examen.id === intento.examenId);
  const aprobo = (intento: Intento) => intento.nota !== null && intento.nota >= (examenDe(intento)?.notaMinima ?? NOTA_MAXIMA + 1);

  const examenesVisibles = examenes.filter((examen) => filtro === "todos" || examen.cursoId === filtro);
  const idsVisibles = new Set(examenesVisibles.map((examen) => examen.id));
  const intentosVisibles = intentos.filter((intento) => idsVisibles.has(intento.examenId));
  const entregados = (lista: Intento[]) => lista.filter((intento) => intento.estado !== "en_curso");

  const cursosPublicados = cursos.filter((curso) => curso.publicado);
  const inscritosDe = (cursoId: string) => avance?.[cursoId]?.inscritos ?? [];
  const hechasDe = (inscrito: Inscrito, publicadas: number) => Math.min(inscrito.completadas.length, publicadas);

  const porCalificar = intentos.filter((intento) => intento.estado === "entregado").length;
  const premium = alumnos.filter((alumno) => alumno.plan === "premium").length;
  const texto = busqueda.trim().toLowerCase();

  const filasAlumnos = alumnos
    .filter((alumno) => `${alumno.nombre} ${alumno.correo}`.toLowerCase().includes(texto))
    .map((alumno) => {
      const propios = intentosVisibles.filter((intento) => intento.uid === alumno.id);
      const calificados = propios.filter((intento) => intento.estado === "calificado");
      return { alumno, rendidos: entregados(propios).length, promedio: promedio(calificados.map((intento) => intento.nota ?? 0)), aprobados: calificados.filter(aprobo).length, calificados: calificados.length };
    });

  async function exportarResultados() {
    if (exportandoResultados) return;
    setExportandoResultados(true);
    try {
      const { descargarReporteResultados } = await import("./exportarAlumnos");
      const fecha = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      await descargarReporteResultados(intentos.map((intento) => ({
        nombre: intento.nombre, correo: intento.correo, curso: nombreCurso(intento.cursoId), examen: examenDe(intento)?.nombre ?? "Examen eliminado",
        estado: intento.estado === "calificado" ? "Calificado" : intento.estado === "entregado" ? "Por calificar" : "En curso",
        nota: intento.nota, resultado: intento.estado === "calificado" ? (aprobo(intento) ? "Aprobado" : "Desaprobado") : "—",
        inicio: fecha.format(intento.inicio), entrega: intento.fin ? fecha.format(intento.fin) : "—", calificado: intento.calificadoEn ? fecha.format(intento.calificadoEn) : "—",
      })));
    } catch {
      setError("No se pudo descargar el reporte de resultados. Inténtalo nuevamente.");
    } finally {
      setExportandoResultados(false);
    }
  }

  async function exportarAlumnos() {
    if (exportandoAlumnos) return;
    setExportandoAlumnos(true);
    try {
      const { descargarReporteAlumnos } = await import("./exportarAlumnos");
      const fecha = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" });
      await descargarReporteAlumnos(alumnos.map((alumno) => {
        const propios = intentos.filter((intento) => intento.uid === alumno.id);
        const calificados = propios.filter((intento) => intento.estado === "calificado");
        return { nombre: alumno.nombre, correo: alumno.correo, plan: alumno.plan === "premium" ? "Premium" : "Gratis", registro: alumno.creadoEn > 0 ? fecha.format(alumno.creadoEn) : "—", rendidos: entregados(propios).length, promedio: promedio(calificados.map((intento) => intento.nota ?? 0)), aprobados: calificados.filter(aprobo).length };
      }));
    } catch {
      setError("No se pudo descargar el reporte Excel. Inténtalo nuevamente.");
    } finally {
      setExportandoAlumnos(false);
    }
  }

  return (
    <main className="admin-pagina">
      <header className="admin-pagina__cabecera">
        <div>
          <h1>Reportes</h1>
          <p>Las descargas con diseño se generan en Excel (.xlsx).</p>
        </div>
        <div className="admin-pagina__acciones">
          <button type="button" className="admin-boton admin-boton--secundario" title="Descarga Excel (.xlsx) con diseño y logo" onClick={exportarAlumnos} disabled={alumnos.length === 0 || exportandoAlumnos || !Object.values(datosReporteListos).every(Boolean)}><Download />{exportandoAlumnos ? "Generando…" : "Alumnos (CSV)"}</button>
          <button type="button" className="admin-boton" title="Descarga Excel (.xlsx) con diseño y logo" onClick={exportarResultados} disabled={intentos.length === 0 || exportandoResultados || !Object.values(datosReporteListos).every(Boolean)}><Download />{exportandoResultados ? "Generando…" : "Resultados (CSV)"}</button>
        </div>
      </header>
      {error && <p className="admin-error" role="alert">{error}</p>}

      <section className="reportes__kpis" aria-label="Indicadores">
        <div className="reportes__kpi">
          <span className="reportes__kpi-icono"><Users /></span>
          <div><p>Alumnos</p><strong>{cargando ? "…" : alumnos.length}</strong><small>{premium} Premium · {alumnos.length - premium} Gratis</small></div>
        </div>
        <div className="reportes__kpi">
          <span className="reportes__kpi-icono"><BookOpen /></span>
          <div><p>Cursos publicados</p><strong>{cursos.filter((curso) => curso.publicado).length}</strong><small>de {cursos.length} en total</small></div>
        </div>
        <div className="reportes__kpi">
          <span className="reportes__kpi-icono"><ClipboardCheck /></span>
          <div><p>Exámenes publicados</p><strong>{examenes.filter((examen) => examen.publicado).length}</strong><small>de {examenes.length} en total</small></div>
        </div>
        <div className="reportes__kpi">
          <span className="reportes__kpi-icono"><ClipboardCheck /></span>
          <div><p>Por calificar</p><strong>{porCalificar}</strong><small>de {intentos.length} {intentos.length === 1 ? "intento" : "intentos"}</small></div>
        </div>
      </section>

      <section className="admin-panel" aria-label="Avance por curso">
        <div className="admin-panel__titulo">
          <h2>Avance por curso</h2>
          <select className="admin-selector" aria-label="Ver avance por clase" value={cursoAvance} onChange={(evento) => { setClasesAvance([]); setCursoAvance(evento.target.value); }}>
            <option value="todos">Todos los cursos</option>
            {cursosPublicados.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}
          </select>
        </div>
        <div className="admin-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de avance">
          {cursoAvance === "todos" ? (
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th scope="col">Curso</th>
                  <th scope="col">Inscritos</th>
                  <th scope="col">Completaron</th>
                  <th scope="col">Avance promedio</th>
                </tr>
              </thead>
              <tbody>
                {avance && cursosPublicados.map((curso) => {
                  const inscritos = inscritosDe(curso.id);
                  const publicadas = avance[curso.id]?.publicadas ?? 0;
                  const completaron = publicadas > 0 ? inscritos.filter((inscrito) => hechasDe(inscrito, publicadas) === publicadas).length : 0;
                  const media = inscritos.length > 0 && publicadas > 0
                    ? Math.round((inscritos.reduce((suma, inscrito) => suma + hechasDe(inscrito, publicadas), 0) / (inscritos.length * publicadas)) * 100)
                    : null;
                  return (
                    <tr key={curso.id}>
                      <td><strong>{curso.nombre}</strong><small>{publicadas} {publicadas === 1 ? "clase publicada" : "clases publicadas"}</small></td>
                      <td>{inscritos.length}</td>
                      <td>{inscritos.length > 0 ? `${completaron} (${porcentaje(completaron, inscritos.length)})` : "—"}</td>
                      <td>{media === null ? "—" : <Avance valor={media} />}</td>
                    </tr>
                  );
                })}
                {(!avance || cursosPublicados.length === 0) && <tr><td colSpan={4} className="admin-tabla__vacio">{cargando || (!avance && cursosPublicados.length > 0) ? "Cargando…" : "Aún no hay cursos publicados."}</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th scope="col">Clase</th>
                  <th scope="col">Completaron</th>
                  <th scope="col">Avance</th>
                </tr>
              </thead>
              <tbody>
                {clasesAvance.map((clase) => {
                  const inscritos = inscritosDe(cursoAvance);
                  const completaron = inscritos.filter((inscrito) => inscrito.completadas.includes(clase.id)).length;
                  return (
                    <tr key={clase.id}>
                      <td><strong>{clase.nombre}</strong></td>
                      <td>{completaron} de {inscritos.length}</td>
                      <td>{inscritos.length > 0 ? <Avance valor={Math.round((completaron / inscritos.length) * 100)} /> : "—"}</td>
                    </tr>
                  );
                })}
                {clasesAvance.length === 0 && <tr><td colSpan={3} className="admin-tabla__vacio">Este curso no tiene clases publicadas.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="admin-panel" aria-label="Resultados por examen">
        <div className="admin-panel__titulo">
          <h2>Resultados por examen</h2>
          <select className="admin-selector" aria-label="Filtrar por curso" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
            <option value="todos">Todos los cursos</option>
            {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}
          </select>
        </div>
        <div className="admin-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de resultados por examen">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th scope="col">Examen</th>
                <th scope="col">Curso</th>
                <th scope="col">Entregas</th>
                <th scope="col">Calificadas</th>
                <th scope="col">Promedio</th>
                <th scope="col">Aprobados</th>
              </tr>
            </thead>
            <tbody>
              {examenesVisibles.map((examen) => {
                const propios = intentosVisibles.filter((intento) => intento.examenId === examen.id);
                const calificados = propios.filter((intento) => intento.estado === "calificado");
                const nota = promedio(calificados.map((intento) => intento.nota ?? 0));
                return (
                  <tr key={examen.id}>
                    <td><strong>{examen.nombre}</strong><small>{examen.publicado ? "Publicado" : "Borrador"} · aprueba con {examen.notaMinima}</small></td>
                    <td>{nombreCurso(examen.cursoId)}</td>
                    <td>{entregados(propios).length}</td>
                    <td>{calificados.length}</td>
                    <td>{nota === null ? "—" : `${nota} / ${NOTA_MAXIMA}`}</td>
                    <td>{porcentaje(calificados.filter(aprobo).length, calificados.length)}</td>
                  </tr>
                );
              })}
              {examenesVisibles.length === 0 && <tr><td colSpan={6} className="admin-tabla__vacio">{cargando ? "Cargando…" : "Aún no hay exámenes para mostrar."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel" aria-label="Resultados por alumno">
        <div className="admin-panel__titulo">
          <h2>Alumnos</h2>
          <span className="admin-insignia">{filasAlumnos.length}</span>
        </div>
        <div className="admin-panel__herramientas">
          <label className="admin-busqueda">
            <Search />
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre o correo..." aria-label="Buscar alumno" />
          </label>
        </div>
        <div className="admin-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de resultados por alumno">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Plan</th>
                <th scope="col">Registro</th>
                <th scope="col">Exámenes rendidos</th>
                <th scope="col">Promedio</th>
                <th scope="col">Aprobados</th>
              </tr>
            </thead>
            <tbody>
              {filasAlumnos.map(({ alumno, rendidos, promedio: nota, aprobados, calificados }) => (
                <tr key={alumno.id}>
                  <td><strong>{alumno.nombre}</strong><small>{alumno.correo}</small></td>
                  <td><span className={`admin-insignia ${alumno.plan === "premium" ? "admin-insignia--premium" : "admin-insignia--gratis"}`}>{alumno.plan === "premium" ? "Premium" : "Gratis"}</span></td>
                  <td>{alumno.creadoEn > 0 ? formatoFecha.format(alumno.creadoEn) : "—"}</td>
                  <td>{rendidos}</td>
                  <td>{nota === null ? "—" : `${nota} / ${NOTA_MAXIMA}`}</td>
                  <td>{calificados > 0 ? `${aprobados} de ${calificados}` : "—"}</td>
                </tr>
              ))}
              {filasAlumnos.length === 0 && <tr><td colSpan={6} className="admin-tabla__vacio">{cargando ? "Cargando…" : alumnos.length > 0 ? "Ningún alumno coincide con la búsqueda." : "Aún no hay alumnos registrados."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}
