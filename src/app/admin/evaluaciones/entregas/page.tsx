"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { RotateCcw, SquarePen, WandSparkles, X } from "lucide-react";
import {
  calcularNota,
  calificarIntentos,
  escucharExamen,
  escucharIntentosExamen,
  esAutomatico,
  leerClaves,
  NOTA_MAXIMA,
  puntajesAutomaticos,
  reiniciarIntento,
  vencimientoIntento,
  type Claves,
  type Examen,
  type Intento,
  type Puntajes,
} from "@/firebase/evaluaciones";
import "../../AdminPagina.css";
import "../../cursos/NuevoCurso.css";
import "./Entregas.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function EntregasPage() {
  return (
    <Suspense fallback={<main className="admin-pagina" />}>
      <Entregas />
    </Suspense>
  );
}

function Entregas() {
  const id = useSearchParams().get("id") ?? "";
  // undefined: cargando; null: no existe.
  const [examen, setExamen] = useState<Examen | null | undefined>(undefined);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  // null: aún cargando; sin las claves no se puede puntuar ninguna respuesta.
  const [claves, setClaves] = useState<Claves | null>(null);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());
  const [mensaje, setMensaje] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [revisando, setRevisando] = useState<Intento | null>(null);
  const [reiniciando, setReiniciando] = useState<Intento | null>(null);
  const confirmar = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(reloj);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fallo = () => setError("No se pudieron cargar las entregas.");
    const dejarExamen = escucharExamen(id, setExamen, fallo);
    const dejarIntentos = escucharIntentosExamen(id, setIntentos, fallo);
    leerClaves(id).then(setClaves).catch(fallo);
    return () => { dejarExamen(); dejarIntentos(); };
  }, [id]);

  if (!id || examen === null) {
    return (
      <main className="admin-pagina">
        <p className="admin-aviso">Este examen no existe o fue eliminado.</p>
        <Link href="/admin/evaluaciones" className="admin-pagina__volver">← Volver a evaluaciones</Link>
      </main>
    );
  }
  if (!examen) return <main className="admin-pagina"><p className="admin-aviso">{error || "Cargando entregas…"}</p></main>;

  const examenActual = examen;
  const pendientes = intentos.filter((intento) => intento.estado === "entregado");
  const calificados = intentos.filter((intento) => intento.estado === "calificado");
  const promedio = calificados.length > 0 ? Math.round((calificados.reduce((suma, intento) => suma + (intento.nota ?? 0), 0) / calificados.length) * 10) / 10 : null;

  async function calificarAutomaticamente() {
    if (!claves) return;
    setTrabajando(true);
    setError("");
    setMensaje("");
    try {
      await calificarIntentos(examenActual, pendientes.map((intento) => {
        const puntajes = puntajesAutomaticos(examenActual, claves, intento.respuestas);
        return { intento, puntajes, nota: calcularNota(examenActual, puntajes), comentario: "" };
      }));
      setMensaje(`${pendientes.length} ${pendientes.length === 1 ? "entrega calificada" : "entregas calificadas"}. Los alumnos ya fueron avisados.`);
    } catch {
      setError("No se pudieron calificar las entregas. Revisa tu conexión e inténtalo de nuevo.");
    }
    setTrabajando(false);
  }

  function pedirReinicio(intento: Intento) {
    setReiniciando(intento);
    confirmar.current?.showModal();
  }

  async function reiniciar() {
    if (!reiniciando) return;
    setError("");
    try { await reiniciarIntento(reiniciando.id); }
    catch { setError(`No se pudo reiniciar el intento de ${reiniciando.nombre}.`); }
    confirmar.current?.close();
  }

  function estado(intento: Intento) {
    if (intento.estado === "calificado") return <span className="admin-badge admin-badge--ok">Calificado</span>;
    if (intento.estado === "entregado") return <span className="admin-badge admin-badge--aviso">Por calificar</span>;
    const vence = vencimientoIntento(examenActual, intento);
    return vence && vence < ahora ? <span className="admin-badge admin-badge--error">Tiempo vencido</span> : <span className="admin-badge admin-badge--info">En curso</span>;
  }

  return (
    <main className="admin-pagina">
      <header className="admin-pagina__cabecera">
        <div>
          <Link href="/admin/evaluaciones" className="admin-pagina__volver">← Evaluaciones</Link>
          <span className="admin-pagina__eyebrow">Entregas</span>
          <h1>{examen.nombre}</h1>
          <p>
            {examen.preguntas.length} preguntas · {examen.duracionMin > 0 ? `${examen.duracionMin} min` : "sin límite de tiempo"} · aprueba con {examen.notaMinima} de {NOTA_MAXIMA}
          </p>
        </div>
        {esAutomatico(examen) && (
          <button type="button" className="admin-boton" onClick={calificarAutomaticamente} disabled={trabajando || !claves || pendientes.length === 0}
            title={pendientes.length === 0 ? "No hay entregas por calificar" : undefined}>
            <WandSparkles />{trabajando ? "Calificando…" : `Calificar automáticamente (${pendientes.length})`}
          </button>
        )}
      </header>

      <section className="admin-panel" aria-label="Entregas del examen">
        <div className="admin-panel__titulo">
          <h2>Alumnos</h2>
          <span className="admin-badge">{intentos.length} {intentos.length === 1 ? "intento" : "intentos"}</span>
          <span className="admin-badge admin-badge--aviso">{pendientes.length} por calificar</span>
          {promedio !== null && <span className="admin-badge admin-badge--info">Promedio {promedio}</span>}
        </div>
        {!esAutomatico(examen) && <p className="admin-aviso entregas__aviso">Este examen tiene preguntas abiertas: revisa cada entrega y asigna los puntos tú mismo.</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {mensaje && <p className="admin-aviso entregas__aviso" role="status">{mensaje}</p>}

        <div className="admin-tabla-caja">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Estado</th>
                <th scope="col">Inicio</th>
                <th scope="col">Entrega</th>
                <th scope="col">Nota</th>
                <th scope="col" className="admin-tabla__fin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {intentos.map((intento) => (
                <tr key={intento.id}>
                  <td><strong>{intento.nombre}</strong><small>{intento.correo}</small></td>
                  <td>{estado(intento)}</td>
                  <td>{formatoFecha.format(intento.inicio)}</td>
                  <td>{intento.fin ? formatoFecha.format(intento.fin) : "—"}</td>
                  <td>
                    {intento.nota === null ? "—" : (
                      <span className={`entregas__nota ${intento.nota >= examen.notaMinima ? "is-aprobado" : "is-desaprobado"}`}>{intento.nota} / {NOTA_MAXIMA}</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-acciones">
                      <button type="button" className="admin-boton admin-boton--secundario" onClick={() => setRevisando(intento)} disabled={!claves}><SquarePen />{intento.estado === "calificado" ? "Ver" : "Revisar"}</button>
                      <button type="button" className="admin-icono" onClick={() => pedirReinicio(intento)} aria-label={`Permitir que ${intento.nombre} rinda de nuevo`} title="Permitir rendir de nuevo"><RotateCcw /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {intentos.length === 0 && <tr><td colSpan={6} className="admin-tabla__vacio">Todavía nadie ha rendido este examen.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <dialog ref={confirmar} className="admin-confirmar" aria-labelledby="reinicio-titulo" onClose={() => setReiniciando(null)}>
        <h2 id="reinicio-titulo">¿Permitir rendir de nuevo?</h2>
        <p>Se borrará el intento de <strong>{reiniciando?.nombre}</strong>, con sus respuestas y su nota, y podrá empezar el examen otra vez.</p>
        <div className="admin-confirmar__acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" className="admin-confirmar__peligro" onClick={reiniciar}>Borrar intento</button>
        </div>
      </dialog>
      {revisando && claves && <Revision examen={examen} intento={revisando} claves={claves} alCerrar={() => setRevisando(null)} />}
    </main>
  );
}

// Modal de calificación: las de opción múltiple llegan puntuadas por la clave; las abiertas las puntúa el administrador.
function Revision({ examen, intento, claves, alCerrar }: { examen: Examen; intento: Intento; claves: Claves; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [puntajes, setPuntajes] = useState<Puntajes>(() => ({ ...puntajesAutomaticos(examen, claves, intento.respuestas), ...intento.puntajes }));
  const [comentario, setComentario] = useState(intento.comentario);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  const nota = calcularNota(examen, puntajes);

  async function guardar() {
    setGuardando(true);
    setError("");
    try {
      await calificarIntentos(examen, [{ intento, puntajes, nota, comentario: comentario.trim() }]);
      dialogo.current?.close();
    } catch {
      setError("No se pudo guardar la calificación. Revisa tu conexión y vuelve a intentarlo.");
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="nuevo-curso revision" aria-labelledby="revision-titulo" onClose={alCerrar}>
      <header className="nuevo-curso__heading">
        <div>
          <h2 id="revision-titulo">{intento.nombre}</h2>
          <p className="revision__correo">{intento.correo}</p>
        </div>
        <button type="button" aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}><X /></button>
      </header>
      {intento.estado === "en_curso" && <p className="admin-aviso entregas__aviso">Este intento no fue entregado. Se muestran las respuestas guardadas hasta el último momento.</p>}
      <ol className="revision__lista">
        {examen.preguntas.map((pregunta) => {
          const respuesta = intento.respuestas[pregunta.id];
          return (
            <li key={pregunta.id}>
              <p className="revision__enunciado">{pregunta.enunciado}</p>
              {pregunta.tipo === "opcion" ? (
                <ul className="revision__opciones">
                  {pregunta.opciones.map((opcion, indice) => (
                    <li key={indice} className={`${indice === claves[pregunta.id] ? "is-correcta" : ""} ${respuesta === indice ? "is-elegida" : ""}`}>
                      {opcion}
                      {respuesta === indice && <small>{indice === claves[pregunta.id] ? "Respuesta del alumno · correcta" : "Respuesta del alumno"}</small>}
                      {respuesta !== indice && indice === claves[pregunta.id] && <small>Correcta</small>}
                    </li>
                  ))}
                  {respuesta === undefined && <li className="revision__sin-respuesta">Sin responder</li>}
                </ul>
              ) : <p className="revision__abierta">{typeof respuesta === "string" && respuesta.trim() ? respuesta : "Sin responder"}</p>}
              <label className="revision__puntos">
                Puntos (máx. {pregunta.puntos})
                <input type="number" min={0} max={pregunta.puntos} step={0.5} value={puntajes[pregunta.id] ?? 0}
                  onChange={(evento) => setPuntajes((actuales) => ({ ...actuales, [pregunta.id]: Math.min(Math.max(Number(evento.target.value), 0), pregunta.puntos) }))} />
              </label>
            </li>
          );
        })}
      </ol>
      <label className="nuevo-curso__field">
        <span>Comentario para el alumno (opcional)</span>
        <textarea value={comentario} onChange={(evento) => setComentario(evento.target.value)} maxLength={1000} placeholder="Observaciones sobre el desempeño" />
      </label>
      {error && <p className="nuevo-curso__error" role="alert">{error}</p>}
      <footer className="nuevo-curso__footer revision__pie">
        <strong className={nota >= examen.notaMinima ? "entregas__nota is-aprobado" : "entregas__nota is-desaprobado"}>Nota: {nota} / {NOTA_MAXIMA}</strong>
        <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
        <button type="button" className="nuevo-curso__submit" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : intento.estado === "calificado" ? "Actualizar nota" : "Guardar y avisar al alumno"}</button>
      </footer>
    </dialog>
  );
}
