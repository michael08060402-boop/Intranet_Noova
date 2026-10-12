"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import type { Curso } from "@/firebase/cursos";
import { guardarExamen, leerClaves, NOTA_MAXIMA, type Claves, type Examen, type Pregunta, type TipoPregunta } from "@/firebase/evaluaciones";
import "../cursos/NuevoCurso.css";
import "./NuevoExamen.css";

type PreguntaEditable = Pregunta & { correcta: number };

const duraciones = [0, 10, 15, 20, 30, 45, 60, 90, 120, 180];

function nuevaPregunta(tipo: TipoPregunta): PreguntaEditable {
  return { id: crypto.randomUUID().slice(0, 12), enunciado: "", tipo, opciones: tipo === "opcion" ? ["", ""] : [], puntos: 1, correcta: tipo === "opcion" ? 0 : -1 };
}

export default function NuevoExamen({ examen, cursos, alCerrar }: { examen: Examen | null; cursos: Curso[]; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const { usuario } = useSesion();
  const [cursoId, setCursoId] = useState(examen?.cursoId ?? cursos[0]?.id ?? "");
  const [nombre, setNombre] = useState(examen?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(examen?.descripcion ?? "");
  const [duracionMin, setDuracionMin] = useState(examen?.duracionMin ?? 30);
  const [notaMinima, setNotaMinima] = useState(examen?.notaMinima ?? 16);
  const [publicado, setPublicado] = useState(examen?.publicado ?? false);
  const [herramientas, setHerramientas] = useState(examen?.herramientas ?? true);
  const [preguntas, setPreguntas] = useState<PreguntaEditable[]>(() => examen?.preguntas.map((pregunta) => ({ ...pregunta, correcta: -1 })) ?? [nuevaPregunta("opcion")]);
  const [cargandoClaves, setCargandoClaves] = useState(!!examen);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  useEffect(() => {
    if (!examen) return;
    leerClaves(examen.id)
      .then((claves) => setPreguntas((actuales) => actuales.map((pregunta) => ({ ...pregunta, correcta: claves[pregunta.id] ?? -1 }))))
      .catch(() => setError("No se pudieron leer las respuestas correctas. Cierra e inténtalo de nuevo."))
      .finally(() => setCargandoClaves(false));
  }, [examen]);

  function cambiar(id: string, cambios: Partial<PreguntaEditable>) {
    setPreguntas((actuales) => actuales.map((pregunta) => (pregunta.id === id ? { ...pregunta, ...cambios } : pregunta)));
  }

  function cambiarOpcion(pregunta: PreguntaEditable, indice: number, texto: string) {
    cambiar(pregunta.id, { opciones: pregunta.opciones.map((opcion, posicion) => (posicion === indice ? texto : opcion)) });
  }

  function quitarOpcion(pregunta: PreguntaEditable, indice: number) {
    const correcta = pregunta.correcta === indice ? 0 : pregunta.correcta > indice ? pregunta.correcta - 1 : pregunta.correcta;
    cambiar(pregunta.id, { opciones: pregunta.opciones.filter((_, posicion) => posicion !== indice), correcta });
  }

  function validar() {
    if (!cursoId) return "Elige el curso del examen.";
    if (nombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (preguntas.length === 0) return "Agrega al menos una pregunta.";
    for (const [indice, pregunta] of preguntas.entries()) {
      const numero = indice + 1;
      if (!pregunta.enunciado.trim()) return `Escribe el enunciado de la pregunta ${numero}.`;
      if (!Number.isInteger(pregunta.puntos) || pregunta.puntos < 1 || pregunta.puntos > 100) return `Los puntos de la pregunta ${numero} deben ser un entero entre 1 y 100.`;
      if (pregunta.tipo === "opcion" && pregunta.opciones.some((opcion) => !opcion.trim())) return `Completa o elimina las opciones vacías de la pregunta ${numero}.`;
      if (pregunta.tipo === "opcion" && (pregunta.correcta < 0 || pregunta.correcta >= pregunta.opciones.length)) return `Marca la opción correcta de la pregunta ${numero}.`;
    }
    return "";
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    const problema = validar();
    if (problema) return setError(problema);

    setGuardando(true);
    setError("");
    const claves: Claves = {};
    const listaPreguntas: Pregunta[] = preguntas.map(({ correcta, ...pregunta }) => {
      if (pregunta.tipo === "opcion") claves[pregunta.id] = correcta;
      return { ...pregunta, enunciado: pregunta.enunciado.trim(), opciones: pregunta.opciones.map((opcion) => opcion.trim()) };
    });
    const datos = { cursoId, nombre: nombre.trim(), descripcion: descripcion.trim(), modo: "manual" as const, duracionMin, notaMinima, publicado, herramientas, preguntas: listaPreguntas };
    try {
      await guardarExamen(examen?.id ?? null, datos, claves, usuario.uid);
      dialogo.current?.close();
    } catch {
      setError("No se pudo guardar el examen. Revisa tu conexión y que tu cuenta sea administradora.");
      setGuardando(false);
    }
  }

  const totalPuntos = preguntas.reduce((suma, pregunta) => suma + (Number.isFinite(pregunta.puntos) ? pregunta.puntos : 0), 0);
  const opcionesDuracion = duraciones.includes(duracionMin) ? duraciones : [...duraciones, duracionMin].sort((a, b) => a - b);

  return (
    <dialog ref={dialogo} className="nuevo-curso nuevo-examen" aria-labelledby="nuevo-examen-titulo" onClose={alCerrar}>
      <header className="nuevo-curso__titulo">
        <h2 id="nuevo-examen-titulo">{examen ? "Editar examen" : "Crear nuevo examen"}</h2>
        <button type="button" aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}>
          <X />
        </button>
      </header>
      <form onSubmit={guardar} aria-describedby={error ? "error-nuevo-examen" : undefined}>
        <label className="nuevo-curso__campo">
          <span>Curso</span>
          <select value={cursoId} onChange={(evento) => setCursoId(evento.target.value)} disabled={!!examen} required>
            {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}
          </select>
        </label>
        <label className="nuevo-curso__campo">
          <span>Nombre del examen</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. Evaluación final de ventilación" required minLength={2} maxLength={120} autoFocus />
        </label>
        <label className="nuevo-curso__campo">
          <span>Instrucciones</span>
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} placeholder="Indicaciones para el alumno (opcional)" maxLength={2000} />
        </label>


        <div className="nuevo-curso__fila">
          <label className="nuevo-curso__campo">
            <span>Tiempo límite</span>
            <select value={duracionMin} onChange={(evento) => setDuracionMin(Number(evento.target.value))}>
              {opcionesDuracion.map((minutos) => <option key={minutos} value={minutos}>{minutos === 0 ? "Sin límite" : `${minutos} minutos`}</option>)}
            </select>
          </label>
          <label className="nuevo-curso__campo">
            <span>Nota mínima para aprobar (de {NOTA_MAXIMA})</span>
            <input type="number" min={0} max={NOTA_MAXIMA} step={0.5} value={notaMinima} onChange={(evento) => setNotaMinima(Number(evento.target.value))} required />
          </label>
        </div>

        <fieldset className="nuevo-curso__estados">
          <legend>Calculadoras</legend>
          <label><input type="checkbox" checked={herramientas} onChange={(evento) => setHerramientas(evento.target.checked)} /><span>Permitirlas durante el examen<small>El alumno las abre desde un panel dentro del examen. Úsalo cuando las preguntas pidan calcular.</small></span></label>
        </fieldset>

        <fieldset className="nuevo-curso__estados">
          <legend>Estado</legend>
          <label><input type="radio" name="estado" checked={!publicado} onChange={() => setPublicado(false)} /><span>Borrador</span></label>
          <label><input type="radio" name="estado" checked={publicado} onChange={() => setPublicado(true)} /><span>Publicado</span></label>
        </fieldset>

        <section className="nuevo-examen__preguntas" aria-label="Preguntas">
          <div className="nuevo-examen__resumen">
            <h3>Preguntas ({preguntas.length})</h3>
            <span>{totalPuntos} {totalPuntos === 1 ? "punto" : "puntos"} en total · equivale a {NOTA_MAXIMA}</span>
          </div>
          {preguntas.map((pregunta, indice) => (
            <div key={pregunta.id} className="nuevo-examen__pregunta">
              <div className="nuevo-examen__encabezado">
                <strong>{indice + 1}.</strong>
                <select value={pregunta.tipo} aria-label={`Tipo de la pregunta ${indice + 1}`}
                  onChange={(evento) => {
                    const tipo = evento.target.value as TipoPregunta;
                    cambiar(pregunta.id, { tipo, opciones: tipo === "opcion" ? (pregunta.opciones.length >= 2 ? pregunta.opciones : ["", ""]) : [], correcta: tipo === "opcion" ? Math.max(pregunta.correcta, 0) : -1 });
                  }}>
                  <option value="opcion">Opción múltiple</option>
                  <option value="abierta">Respuesta abierta</option>
                </select>
                <label className="nuevo-examen__puntos">
                  <input type="number" min={1} max={100} step={1} value={pregunta.puntos} aria-label={`Puntos de la pregunta ${indice + 1}`} onChange={(evento) => cambiar(pregunta.id, { puntos: Number(evento.target.value) })} />
                  pts
                </label>
                <button type="button" onClick={() => setPreguntas((actuales) => actuales.filter((actual) => actual.id !== pregunta.id))} aria-label={`Eliminar pregunta ${indice + 1}`} title="Eliminar pregunta"><Trash2 /></button>
              </div>
              <textarea value={pregunta.enunciado} onChange={(evento) => cambiar(pregunta.id, { enunciado: evento.target.value })} placeholder="Enunciado de la pregunta" aria-label={`Enunciado de la pregunta ${indice + 1}`} maxLength={1000} required />
              {pregunta.tipo === "opcion" ? (
                <div className="nuevo-examen__opciones">
                  {pregunta.opciones.map((opcion, posicion) => (
                    <div key={posicion} className="nuevo-examen__opcion">
                      <input type="radio" name={`correcta-${pregunta.id}`} checked={pregunta.correcta === posicion} onChange={() => cambiar(pregunta.id, { correcta: posicion })} aria-label={`Marcar la opción ${posicion + 1} como correcta`} title="Opción correcta" />
                      <input type="text" value={opcion} onChange={(evento) => cambiarOpcion(pregunta, posicion, evento.target.value)} placeholder={`Opción ${posicion + 1}`} aria-label={`Opción ${posicion + 1} de la pregunta ${indice + 1}`} maxLength={300} required />
                      <button type="button" onClick={() => quitarOpcion(pregunta, posicion)} disabled={pregunta.opciones.length <= 2} aria-label={`Quitar la opción ${posicion + 1}`}><X /></button>
                    </div>
                  ))}
                  {pregunta.opciones.length < 6 && <button type="button" className="nuevo-examen__agregar-opcion" onClick={() => cambiar(pregunta.id, { opciones: [...pregunta.opciones, ""] })}><Plus />Agregar opción</button>}
                </div>
              ) : null}
            </div>
          ))}
          <div className="nuevo-examen__nuevas">
            <button type="button" onClick={() => setPreguntas((actuales) => [...actuales, nuevaPregunta("opcion")])}><Plus />Opción múltiple</button>
            <button type="button" onClick={() => setPreguntas((actuales) => [...actuales, nuevaPregunta("abierta")])}><Plus />Respuesta abierta</button>
          </div>
        </section>

        {error && <p id="error-nuevo-examen" className="nuevo-curso__error" role="alert">{error}</p>}
        <footer className="nuevo-curso__pie">
          <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="nuevo-curso__enviar" disabled={guardando || cargandoClaves}>{guardando ? "Guardando…" : examen ? "Guardar cambios" : "Crear examen"}</button>
        </footer>
      </form>
    </dialog>
  );
}
