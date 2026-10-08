"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, Users, Video } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import {
  actualizarClase,
  contarDocumentos,
  crearClase,
  eliminarClase,
  escucharClases,
  escucharCurso,
  guardarVideoClase,
  subirVideoClase,

  usarPortadaAutomatica,

  leerVideoClase,
  listarVideosMicrosoft,
  previsualizarVideoMicrosoft,
  type ArchivoMicrosoft,
  listarInscritos,

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
  const claseNuevaPendiente = useRef<string | null>(null);

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

  async function guardarClase(datos: DatosFormulario, video: VideoClase | null, archivo: File | null, progreso: (porcentaje: number) => void) {
    if (!usuario) throw new Error("Inicia sesión nuevamente.");
    let claseId = editando?.id ?? claseNuevaPendiente.current;
    if (!claseId) {
      const nueva = await crearClase(id, { ...datos, publicado: false, orden: clases.length }, usuario.uid);
      claseId = nueva.id;
      claseNuevaPendiente.current = claseId;
    }
    if (archivo) {
      await subirVideoClase(id, claseId, archivo, "gratis", progreso);
    } else {
      await guardarVideoClase(id, claseId, video);
    }
    if (video || archivo) await usarPortadaAutomatica(id, claseId);
    await actualizarClase(id, claseId, datos);
    claseNuevaPendiente.current = null;
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
            <button type="button" className="curso-admin__nueva" onClick={() => { claseNuevaPendiente.current = null; setEditando(null); }}><Plus />Nueva clase</button>
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
                          <MiniaturaVideoAdmin cursoId={id} claseId={clase.id} />
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
                          <button type="button" className="curso-admin__icono curso-admin__icono--peligro" onClick={() => pedirEliminar(clase)}
                            aria-label={`Eliminar ${clase.nombre}`} title="Eliminar clase">
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
                  const hechas = clases.filter((clase) => clase.publicado && inscrito.completadas.includes(clase.id)).length;
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
        <p>Se eliminará <strong>{eliminando?.nombre}</strong> de forma permanente. También se eliminarán sus referencias de contenido. El video original de Microsoft se conservará. Esta acción no se puede deshacer.</p>
        <div className="curso-admin__confirmar-acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" className="curso-admin__confirmar-eliminar" onClick={eliminar}>Eliminar</button>
        </div>
      </dialog>
      {editando !== undefined && <ClaseFormulario cursoId={id} clase={editando} alGuardar={guardarClase} alCerrar={() => setEditando(undefined)} />}
    </>
  );
}

function ClaseFormulario({ cursoId, clase, alGuardar, alCerrar }: { cursoId: string; clase: Clase | null; alGuardar: (datos: DatosFormulario, video: VideoClase | null, archivo: File | null, progreso: (porcentaje: number) => void) => Promise<void>; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState(clase?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(clase?.descripcion ?? "");

  const [ruta, setRuta] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [explorando, setExplorando] = useState(false);




  const [progreso, setProgreso] = useState(0);

  const [cargandoVideo, setCargandoVideo] = useState(clase !== null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  useEffect(() => {
    if (!clase) return;
    leerVideoClase(cursoId, clase.id)
      .then((video) => {
        if (video) setRuta(video.ruta);
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
      await alGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), publicado: true }, (rutaVideo || archivo) ? { ruta: rutaVideo, acceso: "gratis" } : null, archivo, setProgreso);
      dialogo.current?.close();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar la clase. Inténtalo nuevamente.");
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className={`clase-modal${ruta ? " clase-modal--con-video" : ""}`} aria-labelledby="clase-modal-titulo" onClose={alCerrar} onCancel={(evento) => { if (guardando) evento.preventDefault(); }}>
      <h2 id="clase-modal-titulo">{clase ? "Editar clase" : "Nueva clase"}</h2>
      <div className="clase-modal__layout">
      <form onSubmit={enviar}>
        <fieldset disabled={guardando} style={{ border: 0, padding: 0, margin: 0, display: "contents" }}>
        <label>
          <span>Nombre de la clase</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. Introducción a la ventilación" required minLength={2} maxLength={120} autoFocus />
        </label>
        <label>
          <span>Descripción</span>
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} placeholder="¿Qué aprenderá el alumno en esta clase?" maxLength={500} />
        </label>
        <section className="videos-microsoft" aria-label="Video de la clase">
          <strong>Video de Microsoft</strong>
          {ruta ? <p>Seleccionado: {ruta.split("/").pop()}</p> : <p>Elige un video de la carpeta de cursos.</p>}
          <button type="button" disabled={cargandoVideo} onClick={() => setExplorando(!explorando)}>{explorando ? "Cerrar carpetas" : "Elegir de Microsoft"}</button>
          {ruta && <button type="button" onClick={() => setRuta("")}>Quitar selección</button>}
          {explorando && <ExploradorVideos alElegir={(video) => { setRuta(video.ruta); setArchivo(null); setExplorando(false); }} />}
        </section>
        {guardando && archivo && <p role="status">Subiendo video: {progreso}%</p>}
        {error && <p className="clase-modal__error" role="alert">{error}</p>}
        <div className="clase-modal__acciones">
          <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="clase-modal__guardar" disabled={guardando || cargandoVideo}>{guardando ? "Guardando…" : clase ? "Guardar cambios" : "Crear clase"}</button>
        </div>
        </fieldset>
      </form>
      {ruta && <aside className="clase-modal__preview"><PrevisualizacionVideo cursoId={cursoId} ruta={ruta} /></aside>}
      </div>
    </dialog>
  );
}

function ExploradorVideos({ alElegir }: { alElegir: (video: ArchivoMicrosoft) => void }) {
  const [carpeta, setCarpeta] = useState("");
  const [elementos, setElementos] = useState<ArchivoMicrosoft[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reintento, setReintento] = useState(0);
  const solicitud = useRef(0);
  function navegar(destino: string) {
    setCargando(true);
    setError("");
    setElementos([]);
    setSiguiente(null);
    setCarpeta(destino);
  }
  useEffect(() => {
    const numero = ++solicitud.current;
    let activo = true;
    listarVideosMicrosoft(carpeta).then((datos) => {
      if (!activo || solicitud.current !== numero) return;
      setElementos(datos.elementos);
      setSiguiente(datos.siguiente);
    }).catch(() => { if (activo && solicitud.current === numero) setError("No se pudieron cargar las carpetas. Comprueba que el emulador esté encendido."); })
      .finally(() => { if (activo && solicitud.current === numero) setCargando(false); });
    return () => { activo = false; };
  }, [carpeta, reintento]);
  async function verMas() {
    if (!siguiente) return;
    const numero = solicitud.current;
    setCargando(true);
    setError("");
    try {
      const datos = await listarVideosMicrosoft(carpeta, siguiente);
      if (solicitud.current !== numero) return;
      setElementos((anteriores) => [...anteriores, ...datos.elementos]);
      setSiguiente(datos.siguiente);
    } catch { if (solicitud.current === numero) setError("No se pudieron cargar más archivos. Reintenta."); }
    finally { if (solicitud.current === numero) setCargando(false); }
  }
  return <div className="videos-microsoft__explorador">
    <p>CURSOS{carpeta ? ` / ${carpeta}` : ""}</p>
    {carpeta && <button type="button" disabled={cargando} onClick={() => navegar(carpeta.split("/").slice(0, -1).join("/"))}>Volver a la carpeta anterior</button>}
    {error && <p role="alert">{error} <button type="button" disabled={cargando} onClick={() => { setCargando(true); setError(""); setReintento((valor) => valor + 1); }}>Reintentar</button></p>}
    <ul>{[...elementos].sort((a, b) => Number(b.carpeta) - Number(a.carpeta) || a.nombre.localeCompare(b.nombre)).map((item) => <li key={item.ruta}>
      <button type="button" disabled={cargando} onClick={() => item.carpeta ? navegar(carpeta ? `${carpeta}/${item.nombre}` : item.nombre) : alElegir(item)}>
        <span aria-hidden="true">{item.carpeta ? "📁" : "▶"}</span> {item.nombre}
      </button>
    </li>)}</ul>
    {cargando && <p role="status">Cargando…</p>}
    {!cargando && !error && elementos.length === 0 && <p>No hay carpetas ni videos MP4 o WebM aquí.</p>}
    {siguiente && <button type="button" disabled={cargando} onClick={verMas}>Ver más</button>}
  </div>;
}
function PrevisualizacionVideo({ cursoId, ruta }: { cursoId: string; ruta: string }) {
  const [resultado, setResultado] = useState<{ ruta: string; url?: string; error?: string } | null>(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let activo = true;
    previsualizarVideoMicrosoft(cursoId, ruta).then((url) => { if (activo) setResultado({ ruta, url }); })
      .catch(() => { if (activo) setResultado({ ruta, error: "No se pudo cargar la previsualización. Comprueba que el emulador esté actualizado." }); });
    return () => { activo = false; };
  }, [cursoId, ruta, intento]);
  const actual = resultado?.ruta === ruta ? resultado : null;
  return <section className="videos-microsoft" aria-label="Previsualización del video">
    <strong>Previsualización del video</strong>
    {!actual && <p role="status">Cargando video…</p>}
    {actual?.error && <p role="alert">{actual.error} <button type="button" onClick={() => { setResultado(null); setIntento((valor) => valor + 1); }}>Reintentar</button></p>}
    {actual?.url && <video key={actual.url} src={actual.url} controls playsInline preload="metadata" style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 10, background: "#111" }}
      onError={() => setResultado({ ruta, error: "El enlace del video no está disponible. Reintenta para actualizarlo." })} />}
  </section>;
}
function MiniaturaVideoAdmin({ cursoId, claseId }: { cursoId: string; claseId: string }) {
  const [video, setVideo] = useState<{ claseId: string; url: string } | null>(null);
  useEffect(() => {
    let activo = true;
    leerVideoClase(cursoId, claseId).then(async (datos) => {
      if (!datos || !activo) return;
      const url = await previsualizarVideoMicrosoft(cursoId, datos.ruta);
      if (activo) setVideo({ claseId, url });
    }).catch(() => {});
    return () => { activo = false; };
  }, [cursoId, claseId]);
  return <span className="curso-admin__miniatura" style={{ position: "relative", overflow: "hidden" }}>
    {video?.claseId === claseId ? <video src={video.url} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1}
      style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      onLoadedMetadata={(evento) => { const elemento = evento.currentTarget; if (Number.isFinite(elemento.duration) && elemento.duration > 0) elemento.currentTime = elemento.duration * 0.2; }}
      onSeeked={(evento) => evento.currentTarget.pause()} /> : <Video aria-hidden="true" />}
  </span>;
}