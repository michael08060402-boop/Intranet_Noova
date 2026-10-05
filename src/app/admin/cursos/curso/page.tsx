"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CirclePlay, Pencil, Plus, Trash2, Users, Video } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import {
  actualizarClase,
  contarDocumentos,
  crearClase,
  eliminarClase,
  escucharClases,
  escucharCurso,
  guardarVideoClase,
  leerVideoClase,
  listarInscritos,
  type Acceso,
  type Clase,
  type Curso,
  type Inscrito,
  type VideoClase,
} from "@/firebase/cursos";
import "./CursoAdmin.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

type DatosFormulario = { nombre: string; descripcion: string; publicado: boolean };

export default function CursoAdminPage() {
  return (
    <Suspense fallback={<main className="curso-admin"><p className="curso-admin__estado">Cargando curso…</p></main>}>
      <CursoAdmin />
    </Suspense>
  );
}

function CursoAdmin() {
  const id = useSearchParams().get("id") ?? "";
  const { usuario } = useSesion();
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const [clases, setClases] = useState<Clase[]>([]);
  const [videos, setVideos] = useState<Record<string, number>>({});
  const [inscritos, setInscritos] = useState<Inscrito[] | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Clase | null | undefined>(undefined);
  const [eliminando, setEliminando] = useState<Clase | null>(null);
  const [version, setVersion] = useState(0);
  const confirmar = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!id) return;
    const fallo = () => setError("No se pudo cargar la información del curso.");
    const dejarCurso = escucharCurso(id, setCurso, fallo);
    const dejarClases = escucharClases(id, false, setClases, fallo);
    return () => { dejarCurso(); dejarClases(); };
  }, [id]);

  useEffect(() => {
    if (id) listarInscritos(id).then(setInscritos).catch(() => setInscritos(null));
  }, [id]);

  useEffect(() => {
    Promise.all(clases.map(async (clase) => [clase.id, await contarDocumentos(`cursos/${id}/clases/${clase.id}/contenidos`)] as const))
      .then((conteos) => setVideos(Object.fromEntries(conteos)))
      .catch(() => setVideos({}));
  }, [clases, id, version]);

  if (!id || curso === null) {
    return (
      <main className="curso-admin">
        <p className="curso-admin__estado">Este curso no existe o fue eliminado.</p>
        <Link href="/admin/cursos" className="curso-admin__migas-enlace">← Volver a cursos</Link>
      </main>
    );
  }

  if (!curso) {
    return <main className="curso-admin"><p className="curso-admin__estado">{error || "Cargando curso…"}</p></main>;
  }

  const publicadas = clases.filter((clase) => clase.publicado).length;

  async function guardarClase(datos: DatosFormulario, video: VideoClase | null) {
    if (!usuario) return;
    if (editando) {
      await actualizarClase(id, editando.id, datos);
      await guardarVideoClase(id, editando.id, video);
    } else {
      const nueva = await crearClase(id, { ...datos, orden: clases.length }, usuario.uid);
      await guardarVideoClase(id, nueva.id, video).catch(() => setError("La clase se creó, pero no se pudo guardar el video. Ábrela con Editar para reintentar."));
    }
    setVersion((actual) => actual + 1);
  }

  function pedirEliminar(clase: Clase) {
    setEliminando(clase);
    confirmar.current?.showModal();
  }

  async function eliminar() {
    if (!eliminando) return;
    setError("");
    try { await eliminarClase(id, eliminando.id); }
    catch { setError(`No se pudo eliminar "${eliminando.nombre}".`); }
    confirmar.current?.close();
  }

  return (
    <>
      <main className="curso-admin">
        <nav className="curso-admin__migas" aria-label="Ruta">
          <Link href="/admin/cursos" className="curso-admin__migas-enlace">Cursos</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{curso.nombre}</span>
        </nav>

        <header className="curso-admin__heading">
          <Link href="/admin/cursos" className="curso-admin__volver" aria-label="Volver a cursos"><ArrowLeft /></Link>
          <div className="curso-admin__titulo">
            <h1>{curso.nombre}</h1>
            {curso.descripcion && <p>{curso.descripcion}</p>}
          </div>
          <span className={`curso-admin__estado-badge ${curso.publicado ? "is-publicado" : "is-borrador"}`}>{curso.publicado ? "Publicado" : "Borrador"}</span>
          <span className="curso-admin__inscritos" title="Alumnos inscritos en este curso">
            <Users />
            {inscritos === undefined ? "…" : inscritos === null ? "—" : `${inscritos.length} ${inscritos.length === 1 ? "inscrito" : "inscritos"}`}
          </span>
        </header>
        {error && <p className="curso-admin__error" role="alert">{error}</p>}

        <section className="curso-admin__panel" aria-labelledby="clases-titulo">
          <div className="curso-admin__panel-heading">
            <div>
              <h2 id="clases-titulo">Clases</h2>
            </div>
            <button type="button" className="curso-admin__nueva" onClick={() => setEditando(null)}><Plus />Nueva clase</button>
          </div>

          <div className="curso-admin__tabla-wrap">
            <table className="curso-admin__tabla">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Clase</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="curso-admin__oculto">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {clases.map((clase, indice) => {
                  const total = videos[clase.id];
                  return (
                    <tr key={clase.id}>
                      <td><span className="curso-admin__numero">{String(indice + 1).padStart(2, "0")}</span></td>
                      <td>
                        <div className="curso-admin__clase">
                          <span className="curso-admin__miniatura"><CirclePlay /></span>
                          <div>
                            <strong>{clase.nombre}</strong>
                            {clase.descripcion && <small>{clase.descripcion}</small>}
                            <span className="curso-admin__videos"><Video />{total === undefined ? "…" : total === 0 ? "Sin video" : `${total} ${total === 1 ? "video" : "videos"}`}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className={`curso-admin__estado-badge ${clase.publicado ? "is-publicado" : "is-borrador"}`}>{clase.publicado ? "Publicado" : "Borrador"}</span></td>
                      <td>
                        <div className="curso-admin__acciones">
                          <button type="button" className="curso-admin__icono" onClick={() => setEditando(clase)} aria-label={`Editar ${clase.nombre}`} title="Editar"><Pencil /></button>
                          <button type="button" className="curso-admin__icono curso-admin__icono--peligro" onClick={() => pedirEliminar(clase)} disabled={(total ?? 1) > 0}
                            aria-label={`Eliminar ${clase.nombre}`} title={(total ?? 1) > 0 ? "Solo se pueden eliminar clases sin videos." : "Eliminar"}>
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {clases.length === 0 && (
                  <tr><td colSpan={4} className="curso-admin__vacio">Este curso aún no tiene clases. Crea la primera con “Nueva clase”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="curso-admin__panel" aria-labelledby="inscritos-titulo">
          <div className="curso-admin__panel-heading">
            <h2 id="inscritos-titulo">Alumnos inscritos</h2>
          </div>
          <div className="curso-admin__tabla-wrap">
            <table className="curso-admin__tabla curso-admin__tabla--inscritos">
              <thead>
                <tr>
                  <th scope="col">Alumno</th>
                  <th scope="col">Inscrito el</th>
                  <th scope="col">Avance</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {inscritos?.map((inscrito) => {
                  const hechas = Math.min(inscrito.completadas, publicadas);
                  const avance = publicadas ? Math.round((hechas / publicadas) * 100) : 0;
                  const estado = avance === 100 ? "Completado" : hechas > 0 ? "En progreso" : "Sin empezar";
                  return (
                    <tr key={inscrito.uid}>
                      <td>
                        <div className="curso-admin__alumno">
                          <span className="curso-admin__inicial">{inscrito.nombre.charAt(0).toUpperCase()}</span>
                          <strong>{inscrito.nombre}</strong>
                        </div>
                      </td>
                      <td>{inscrito.inscritoEn ? formatoFecha.format(inscrito.inscritoEn) : "—"}</td>
                      <td>
                        <div className="curso-admin__avance">
                          <span className="curso-admin__barra"><span style={{ width: `${avance}%` }} /></span>
                          <small>{avance}% · {hechas} de {publicadas}</small>
                        </div>
                      </td>
                      <td><span className={`curso-admin__progreso ${avance === 100 ? "is-completado" : ""}`}>{estado}</span></td>
                    </tr>
                  );
                })}
                {inscritos?.length === 0 && <tr><td colSpan={4} className="curso-admin__vacio">Aún no hay alumnos inscritos en este curso.</td></tr>}
                {inscritos === undefined && <tr><td colSpan={4} className="curso-admin__vacio">Cargando inscritos…</td></tr>}
                {inscritos === null && <tr><td colSpan={4} className="curso-admin__vacio">No se pudieron cargar los inscritos. Revisa que las reglas e índices estén desplegados.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <dialog ref={confirmar} className="curso-admin__confirmar" aria-labelledby="clase-confirmar-titulo" onClose={() => setEliminando(null)}>
        <h2 id="clase-confirmar-titulo">¿Eliminar clase?</h2>
        <p>Se eliminará <strong>{eliminando?.nombre}</strong> de forma permanente. Esta acción no se puede deshacer.</p>
        <div className="curso-admin__confirmar-acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" className="curso-admin__confirmar-eliminar" onClick={eliminar}>Eliminar</button>
        </div>
      </dialog>
      {editando !== undefined && <ClaseFormulario cursoId={id} accesoCurso={curso.acceso} clase={editando} alGuardar={guardarClase} alCerrar={() => setEditando(undefined)} />}
    </>
  );
}

function ClaseFormulario({ cursoId, accesoCurso, clase, alGuardar, alCerrar }: { cursoId: string; accesoCurso: Acceso; clase: Clase | null; alGuardar: (datos: DatosFormulario, video: VideoClase | null) => Promise<void>; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState(clase?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(clase?.descripcion ?? "");
  const [publicado, setPublicado] = useState(clase?.publicado ?? false);
  const [ruta, setRuta] = useState("");
  const [accesoVideo, setAccesoVideo] = useState<Acceso>(accesoCurso);
  const [cargandoVideo, setCargandoVideo] = useState(clase !== null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  useEffect(() => {
    if (!clase) return;
    leerVideoClase(cursoId, clase.id)
      .then((video) => {
        if (video) { setRuta(video.ruta); setAccesoVideo(video.acceso); }
      })
      .catch(() => setError("No se pudo cargar el video de esta clase."))
      .finally(() => setCargandoVideo(false));
  }, [cursoId, clase]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (nombre.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    const rutaVideo = ruta.trim();
    if (rutaVideo && !/\.(mp4|webm)$/i.test(rutaVideo)) return setError("La ruta del video debe terminar en .mp4 o .webm.");
    if (rutaVideo && rutaVideo.split("/").some((parte) => !parte || parte === "." || parte === "..")) return setError("La ruta del video no es válida: usa carpeta/archivo.mp4, sin barras al inicio ni al final.");
    setGuardando(true);
    setError("");
    try {
      await alGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), publicado }, rutaVideo ? { ruta: rutaVideo, acceso: accesoVideo } : null);
      dialogo.current?.close();
    } catch {
      setError("No se pudo guardar la clase. Inténtalo nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="clase-modal" aria-labelledby="clase-modal-titulo" onClose={alCerrar}>
      <h2 id="clase-modal-titulo">{clase ? "Editar clase" : "Nueva clase"}</h2>
      <form onSubmit={enviar}>
        <label>
          <span>Nombre de la clase</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. Introducción a la ventilación" required minLength={2} maxLength={120} autoFocus />
        </label>
        <label>
          <span>Descripción</span>
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} placeholder="¿Qué aprenderá el alumno en esta clase?" maxLength={500} />
        </label>
        <label>
          <span>Video (ruta en SharePoint)</span>
          <input value={ruta} onChange={(evento) => setRuta(evento.target.value)} placeholder="Ej. Ventsim/basico-1.mp4" maxLength={300} disabled={cargandoVideo} />
          <small>Déjalo vacío si aún no hay video.</small>
        </label>
        {ruta.trim() && (
          <label>
            <span>Quién puede ver el video</span>
            <select value={accesoVideo} onChange={(evento) => setAccesoVideo(evento.target.value as Acceso)}>
              <option value="gratis">Todos los alumnos inscritos</option>
              <option value="premium">Solo plan Premium</option>
            </select>
          </label>
        )}
        <label className="clase-modal__check">
          <input type="checkbox" checked={publicado} onChange={(evento) => setPublicado(evento.target.checked)} />
          Publicar la clase (visible para los alumnos si el curso está publicado)
        </label>
        {error && <p className="clase-modal__error" role="alert">{error}</p>}
        <div className="clase-modal__acciones">
          <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="clase-modal__guardar" disabled={guardando || cargandoVideo}>{guardando ? "Guardando…" : clase ? "Guardar cambios" : "Crear clase"}</button>
        </div>
      </form>
    </dialog>
  );
}
