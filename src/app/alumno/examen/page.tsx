"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Calculator, CircleCheck, Clock, Crown, ListChecks, Lock, Timer } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { escucharClases, escucharCurso, escucharProgreso, type Clase, type Curso, type Progreso } from "@/firebase/cursos";
import {
  entregarIntento,
  escucharExamen,
  escucharIntento,
  guardarRespuestas,
  iniciarIntento,
  NOTA_MAXIMA,
  vencimientoIntento,
  type Examen,
  type Intento,
  type Respuestas,
} from "@/firebase/evaluaciones";
import PanelHerramientas from "./PanelHerramientas";
import "./Examen.css";

export default function ExamenPage() {
  return (
    <Suspense fallback={<main className="alumno-examen" />}>
      <RendirExamen />
    </Suspense>
  );
}

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function RendirExamen() {
  const id = useSearchParams().get("id") ?? "";
  const { usuario, perfil } = useSesion();
  const [examen, setExamen] = useState<Examen | null | undefined>(undefined);
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const [intento, setIntento] = useState<Intento | null | undefined>(undefined);
  const [iniciando, setIniciando] = useState(false);
  const [errorIntento, setErrorIntento] = useState(false);
  const [error, setError] = useState("");
  const uid = usuario?.uid;
  const cursoId = examen?.cursoId;
  const [clasesCurso, setClasesCurso] = useState<{ cursoId: string; lista: Clase[] }>();
  const [avance, setAvance] = useState<{ cursoId: string; lista: Progreso[] }>();

  useEffect(() => {
    if (!cursoId || !uid) return;
    const dejarClases = escucharClases(cursoId, true, (lista) => setClasesCurso({ cursoId, lista }), () => setClasesCurso({ cursoId, lista: [] }));
    const dejarProgreso = escucharProgreso(uid, (lista) => setAvance({ cursoId, lista: lista.filter((item) => item.cursoId === cursoId && item.completado) }), () => setAvance({ cursoId, lista: [] }));
    return () => { dejarClases(); dejarProgreso(); };
  }, [cursoId, uid]);

  useEffect(() => {
    if (!id) return;
    return escucharExamen(id, setExamen, () => setExamen(null));
  }, [id]);

  useEffect(() => {
    if (!cursoId) return;
    return escucharCurso(cursoId, setCurso, () => setCurso(null));
  }, [cursoId]);

  useEffect(() => {
    if (!id || !uid) return;
    return escucharIntento(id, uid, (actual) => {
      setIntento(actual);
      setErrorIntento(false);
    }, () => {
      setErrorIntento(true);
      setIntento(null);
    });
  }, [id, uid]);

  if (!id || examen === null || curso === null) {
    return (
      <main className="alumno-examen">
        <p className="alumno-examen__aviso">Este examen no está disponible.</p>
        <Link href="/alumno/explorar" className="alumno-examen__volver">← Volver a explorar</Link>
      </main>
    );
  }
  if (!examen || !curso || intento === undefined) return <main className="alumno-examen"><p className="alumno-examen__aviso">Cargando examen…</p></main>;

  const volver = <Link href={`/alumno/explorar?curso=${examen.cursoId}`} className="alumno-examen__volver">← Volver al curso</Link>;
  const bloqueado = curso.acceso === "premium" && perfil?.plan !== "premium";
  const clases = clasesCurso?.cursoId === curso.id ? clasesCurso.lista : [];
  const progreso = avance?.cursoId === curso.id ? avance.lista : [];
  const consultandoAvance = clasesCurso?.cursoId !== curso.id || avance?.cursoId !== curso.id;
  const completadas = clases.filter((clase) => progreso.some((item) => item.claseId === clase.id)).length;
  const cursoCompleto = !consultandoAvance && clases.length > 0 && completadas === clases.length;

  async function comenzar() {
    if (!usuario || !perfil || !examen || errorIntento || iniciando || !cursoCompleto) return;
    setIniciando(true);
    setError("");
    try { await iniciarIntento(examen); }
    catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo iniciar el examen. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setIniciando(false);
    }
  }

  if (intento?.estado === "en_curso") return <Rendicion examen={examen} intento={intento} volver={volver} />;

  return (
    <main className="alumno-examen">
      {volver}
      <section className="alumno-examen__tarjeta">
        <span className="alumno-examen__antetitulo">{curso.nombre}</span>
        <h1>{examen.nombre}</h1>
        {examen.descripcion && <p className="alumno-examen__instrucciones">{examen.descripcion}</p>}

        {intento?.estado === "calificado" && intento.nota !== null ? (
          <div className="alumno-examen__resultado" role="status">
            <strong className={intento.nota >= examen.notaMinima ? "is-aprobado" : "is-desaprobado"}>{intento.nota}<small> / {NOTA_MAXIMA}</small></strong>
            <span className={`alumno-examen__insignia ${intento.nota >= examen.notaMinima ? "is-aprobado" : "is-desaprobado"}`}>{intento.nota >= examen.notaMinima ? "Aprobado" : "Desaprobado"}</span>
            <p>Nota mínima para aprobar: {examen.notaMinima}.{intento.calificadoEn && " "}{intento.calificadoEn && `Calificado el ${formatoFecha.format(intento.calificadoEn)}`}</p>
            {intento.comentario && <blockquote>{intento.comentario}</blockquote>}
          </div>
        ) : intento?.estado === "entregado" ? (
          <div className="alumno-examen__resultado" role="status">
            <CircleCheck />
            <h2>Examen entregado</h2>
            <p>Lo recibimos{intento.fin ? ` el ${formatoFecha.format(intento.fin)}` : ""}. Te avisaremos cuando esté calificado.</p>
          </div>
        ) : bloqueado ? (
          <div className="alumno-examen__resultado">
            <Crown />
            <h2>Este examen es Premium</h2>
            <p>Necesitas el plan Premium para rendir los exámenes de este curso.</p>
            <Link href="/alumno/premium" className="alumno-examen__boton">Hazte Premium</Link>
          </div>
        ) : !cursoCompleto ? (
          <div className="alumno-examen__resultado">
            <Lock />
            <h2>{consultandoAvance ? "Consultando tu avance…" : "Examen bloqueado"}</h2>
            {!consultandoAvance && <p>Completa todas las clases para habilitar el examen: {completadas} de {clases.length} completadas.</p>}
            <Link href={`/alumno/curso?id=${curso.id}`} className="alumno-examen__boton">Ir a las clases</Link>
          </div>
        ) : (
          <>
            <ul className="alumno-examen__datos">
              <li><ListChecks />{examen.preguntas.length} {examen.preguntas.length === 1 ? "pregunta" : "preguntas"}</li>
              <li><Clock />{examen.duracionMin > 0 ? `${examen.duracionMin} minutos` : "Sin límite de tiempo"}</li>
              <li><CircleCheck />Apruebas con {examen.notaMinima} de {NOTA_MAXIMA}</li>
              {examen.herramientas && <li><Calculator />Puedes usar las calculadoras</li>}
            </ul>
            <p className="alumno-examen__advertencia">Solo tienes un intento. {examen.duracionMin > 0 ? "El tiempo corre desde que empiezas y no se detiene aunque cierres la página." : "Tus respuestas se guardan mientras avanzas."}</p>
            {error && <p className="alumno-examen__error" role="alert">{error}</p>}
            {errorIntento && <p className="alumno-examen__error" role="alert">No se pudo consultar tu intento. Revisa la conexión y recarga la página antes de comenzar.</p>}
            <button type="button" className="alumno-examen__boton" onClick={comenzar} disabled={errorIntento || iniciando || examen.preguntas.length === 0}>{iniciando ? "Iniciando…" : "Comenzar examen"}</button>
          </>
        )}
      </section>
    </main>
  );
}

function Rendicion({ examen, intento, volver }: { examen: Examen; intento: Intento; volver: React.ReactNode }) {
  const [respuestas, setRespuestas] = useState<Respuestas>(intento.respuestas);
  const [ahora, setAhora] = useState(() => Date.now());
  const [guardado, setGuardado] = useState<"" | "guardando" | "guardado" | "error">("");
  const [entregando, setEntregando] = useState(false);
  const [error, setError] = useState("");
  const [herramientasAbiertas, setHerramientasAbiertas] = useState(false);
  const confirmar = useRef<HTMLDialogElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enviado = useRef(false);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const vence = vencimientoIntento(examen, intento);
  const restante = vence === null ? null : Math.max(0, vence - ahora);
  const agotado = restante === 0;

  function responder(preguntaId: string, valor: number | string) {
    const siguientes = { ...respuestas, [preguntaId]: valor };
    setRespuestas(siguientes);
    setGuardado("guardando");
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      guardarRespuestas(intento.id, siguientes).then(() => setGuardado("guardado")).catch(() => setGuardado("error"));
    }, 1200);
  }

  const cerrarHerramientas = useCallback(() => setHerramientasAbiertas(false), []);

  async function entregar() {
    if (enviado.current) return;
    enviado.current = true;
    clearTimeout(temporizador.current);
    confirmar.current?.close();
    setEntregando(true);
    setError("");
    try { await entregarIntento(intento.id, respuestas); }
    catch {
      if (!agotado) enviado.current = false;
      setEntregando(false);
      setError(agotado
        ? "Se acabó el tiempo y la entrega ya no se pudo registrar. Tus últimas respuestas guardadas las revisará tu instructor."
        : "No se pudo entregar el examen. Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  useEffect(() => {
    if (agotado && !enviado.current) void entregar();
  });

  const sinResponder = examen.preguntas.filter((pregunta) => respuestas[pregunta.id] === undefined || respuestas[pregunta.id] === "").length;
  const minutos = restante === null ? 0 : Math.floor(restante / 60000);
  const segundos = restante === null ? 0 : Math.floor((restante % 60000) / 1000);

  return (
    <main className={herramientasAbiertas ? "alumno-examen alumno-examen--con-panel" : "alumno-examen"}>
      {volver}
      <div className={`alumno-examen__barra ${restante !== null && restante < 300000 ? "is-urgente" : ""}`}>
        <div>
          <strong>{examen.nombre}</strong>
          <small>{guardado === "guardando" ? "Guardando…" : guardado === "guardado" ? "Respuestas guardadas" : guardado === "error" ? "No se pudo guardar; se reintentará al responder" : "Tus respuestas se guardan automáticamente"}</small>
        </div>
        <div className="alumno-examen__lado">
          {examen.herramientas && (
            <button type="button" className="alumno-examen__herramientas" aria-expanded={herramientasAbiertas} onClick={() => setHerramientasAbiertas(!herramientasAbiertas)}>
              <Calculator aria-hidden="true" />Calculadoras
            </button>
          )}
          <span className="alumno-examen__reloj" role="timer" aria-label="Tiempo restante">
            <Timer />{restante === null ? "Sin límite" : `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`}
          </span>
        </div>
      </div>

      {examen.herramientas && herramientasAbiertas && <PanelHerramientas alCerrar={cerrarHerramientas} />}
      {error && <p className="alumno-examen__error" role="alert">{error}</p>}
      <form onSubmit={(evento) => { evento.preventDefault(); confirmar.current?.showModal(); }}>
        <fieldset disabled={agotado || entregando} className="alumno-examen__preguntas">
          {examen.preguntas.map((pregunta, indice) => (
            <section key={pregunta.id} className="alumno-examen__pregunta">
              <header>
                <span className="alumno-examen__numero">{indice + 1}</span>
                <p>{pregunta.enunciado}</p>
                <small>{pregunta.puntos} {pregunta.puntos === 1 ? "punto" : "puntos"}</small>
              </header>
              {pregunta.tipo === "opcion" ? (
                <div className="alumno-examen__opciones" role="radiogroup" aria-label={`Pregunta ${indice + 1}`}>
                  {pregunta.opciones.map((opcion, posicion) => (
                    <label key={posicion} className={respuestas[pregunta.id] === posicion ? "is-elegida" : ""}>
                      <input type="radio" name={`pregunta-${pregunta.id}`} checked={respuestas[pregunta.id] === posicion} onChange={() => responder(pregunta.id, posicion)} />
                      {opcion}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea value={typeof respuestas[pregunta.id] === "string" ? String(respuestas[pregunta.id]) : ""} onChange={(evento) => responder(pregunta.id, evento.target.value)} placeholder="Escribe tu respuesta" aria-label={`Respuesta de la pregunta ${indice + 1}`} maxLength={5000} />
              )}
            </section>
          ))}
        </fieldset>
        <div className="alumno-examen__pie">
          <span>{sinResponder === 0 ? "Respondiste todas las preguntas." : `${sinResponder} sin responder`}</span>
          <button type="submit" className="alumno-examen__boton" disabled={agotado || entregando}>{entregando ? "Entregando…" : "Entregar examen"}</button>
        </div>
      </form>

      <dialog ref={confirmar} className="alumno-examen__dialogo" aria-labelledby="entregar-titulo">
        <h2 id="entregar-titulo">¿Entregar el examen?</h2>
        <p>{sinResponder > 0 ? `Tienes ${sinResponder} ${sinResponder === 1 ? "pregunta" : "preguntas"} sin responder. ` : ""}Una vez entregado ya no podrás cambiar tus respuestas.</p>
        <div className="alumno-examen__dialogo-acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Seguir respondiendo</button>
          <button type="button" className="alumno-examen__boton" onClick={entregar}>Entregar</button>
        </div>
      </dialog>
    </main>
  );
}
