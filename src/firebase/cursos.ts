import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, funciones, almacenamiento } from "./config";

export type Nivel = "basico" | "intermedio" | "avanzado";
export type Acceso = "gratis" | "premium";

export type Categoria = { id: string; nombre: string; descripcion: string; activa: boolean };

export type Curso = {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  nivel: Nivel;
  acceso: Acceso;
  publicado: boolean;
  creadoEn: number;
  portadaKey?: string;
};

export type Clase = { id: string; nombre: string; descripcion: string; orden: number; publicado: boolean };

type DatosCategoria = Omit<Categoria, "id">;
type DatosCurso = Omit<Curso, "id" | "creadoEn">;
type DatosClase = Omit<Clase, "id">;

export const nombresNivel: Record<Nivel, string> = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" };

function leerCurso(id: string, datos: DocumentData): Curso {
  return {
    id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    categoriaId: datos.categoriaId,
    nivel: datos.nivel,
    acceso: datos.acceso,
    publicado: datos.publicado,
    creadoEn: datos.creadoEn?.toMillis() ?? Date.now(),
    portadaKey: datos.portadaKey,
  };
}

export function escucharCategorias(soloActivas: boolean, alCambiar: (categorias: Categoria[]) => void, alFallar: () => void) {
  const referencia = collection(db, "categorias");
  const consulta = soloActivas ? query(referencia, where("activa", "==", true)) : referencia;
  return onSnapshot(consulta, (resultado) => {
    const categorias = resultado.docs.map((documento) => {
      const datos = documento.data();
      return { id: documento.id, nombre: datos.nombre, descripcion: datos.descripcion ?? "", activa: datos.activa };
    });
    alCambiar(categorias.sort((a, b) => a.nombre.localeCompare(b.nombre)));
  }, alFallar);
}

export function crearCategoria(datos: DatosCategoria) {
  return addDoc(collection(db, "categorias"), { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
}

export function actualizarCategoria(id: string, datos: DatosCategoria) {
  return updateDoc(doc(db, "categorias", id), { ...datos, actualizadoEn: serverTimestamp() });
}

export function eliminarCategoria(id: string) {
  return deleteDoc(doc(db, "categorias", id));
}

export function escucharCursos(soloPublicados: boolean, alCambiar: (cursos: Curso[]) => void, alFallar: () => void) {
  const referencia = collection(db, "cursos");
  const consulta = soloPublicados ? query(referencia, where("publicado", "==", true)) : referencia;
  return onSnapshot(consulta, (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerCurso(documento.id, documento.data())).sort((a, b) => b.creadoEn - a.creadoEn));
  }, alFallar);
}

export function escucharCurso(id: string, alCambiar: (curso: Curso | null) => void, alFallar: () => void) {
  return onSnapshot(doc(db, "cursos", id), (documento) => {
    alCambiar(documento.exists() ? leerCurso(documento.id, documento.data()) : null);
  }, alFallar);
}

export function crearCurso(datos: DatosCurso, uid: string) {
  return addDoc(collection(db, "cursos"), { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), creadoPor: uid });
}

export function actualizarCurso(id: string, datos: Partial<DatosCurso>) {
  return updateDoc(doc(db, "cursos", id), { ...datos, actualizadoEn: serverTimestamp() });
}

export function eliminarCurso(id: string) {
  return httpsCallable<{ cursoId: string }, { eliminado: boolean }>(funciones, "eliminarContenidoAdmin")({ cursoId: id });
}

export function escucharClases(cursoId: string, soloPublicadas: boolean, alCambiar: (clases: Clase[]) => void, alFallar: () => void) {
  const referencia = collection(db, "cursos", cursoId, "clases");
  const consulta = soloPublicadas ? query(referencia, where("publicado", "==", true)) : referencia;
  return onSnapshot(consulta, (resultado) => {
    const clases = resultado.docs.map((documento) => {
      const datos = documento.data();
      return { id: documento.id, nombre: datos.nombre, descripcion: datos.descripcion, orden: datos.orden, publicado: datos.publicado };
    });
    alCambiar(clases.sort((a, b) => a.orden - b.orden));
  }, alFallar);
}

export function crearClase(cursoId: string, datos: DatosClase, uid: string) {
  return addDoc(collection(db, "cursos", cursoId, "clases"), { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), creadoPor: uid });
}

export function actualizarClase(cursoId: string, claseId: string, datos: Partial<DatosClase>) {
  return updateDoc(doc(db, "cursos", cursoId, "clases", claseId), { ...datos, actualizadoEn: serverTimestamp() });
}

export function eliminarClase(cursoId: string, claseId: string) {
  return httpsCallable<{ cursoId: string; claseId: string }, { eliminado: boolean }>(funciones, "eliminarContenidoAdmin")({ cursoId, claseId });
}

export type VideoClase = { ruta: string; acceso: Acceso; portadaKey?: string };

function referenciaVideo(cursoId: string, claseId: string) {
  return doc(db, "cursos", cursoId, "clases", claseId, "contenidos", "video");
}

export async function leerVideoClase(cursoId: string, claseId: string): Promise<VideoClase | null> {
  const documento = await getDoc(referenciaVideo(cursoId, claseId));
  return documento.exists() ? { ruta: documento.data().ruta, acceso: documento.data().acceso, portadaKey: documento.data().portadaKey } : null;
}

export async function guardarVideoClase(cursoId: string, claseId: string, video: VideoClase | null) {
  const referencia = referenciaVideo(cursoId, claseId);
  if (!video) return deleteDoc(referencia);
  const datos = { nombre: "Video de la clase", tipo: "video", ruta: video.ruta, orden: 0, acceso: video.acceso, actualizadoEn: serverTimestamp() };
  if ((await getDoc(referencia)).exists()) return updateDoc(referencia, datos);
  return setDoc(referencia, { ...datos, creadoEn: serverTimestamp() });
}

export async function pedirVideo(cursoId: string, claseId: string) {
  const resultado = await httpsCallable<{ cursoId: string; claseId: string }, { url: string; miniatura: string | null; portadaKey: string | null; portadaCursoKey: string | null }>(funciones, "obtenerVideo")({ cursoId, claseId });
  const datos = resultado.data;
  async function resolver(key: string | null) {
    if (!key) return undefined;
    try { return await obtenerPortadaCurso(key); } catch { return undefined; }
  }
  const respaldo = await resolver(datos.portadaCursoKey);
  const poster = await resolver(datos.portadaKey) ?? datos.miniatura ?? respaldo;
  return { url: datos.url, poster, respaldo, personalizada: Boolean(datos.portadaKey) };
}
export function escucharInscripciones(uid: string, alCambiar: (cursoIds: string[]) => void, alFallar: () => void) {
  return onSnapshot(collection(db, "usuarios", uid, "inscripciones"), (resultado) => {
    alCambiar(resultado.docs.map((documento) => documento.id));
  }, alFallar);
}

export function inscribirse(uid: string, cursoId: string) {
  return setDoc(doc(db, "usuarios", uid, "inscripciones", cursoId), { cursoId, inscritoEn: serverTimestamp() });
}

export type Progreso = { cursoId: string; claseId: string; completado: boolean };

export function escucharProgreso(uid: string, alCambiar: (progreso: Progreso[]) => void, alFallar: () => void) {
  return onSnapshot(collection(db, "usuarios", uid, "progreso"), (resultado) => {
    alCambiar(resultado.docs.map((documento) => {
      const datos = documento.data();
      return { cursoId: datos.cursoId, claseId: datos.claseId, completado: datos.completado };
    }));
  }, alFallar);
}

export function marcarClase(uid: string, cursoId: string, claseId: string, completado: boolean) {
  return setDoc(doc(db, "usuarios", uid, "progreso", `${cursoId}_${claseId}`), {
    cursoId,
    claseId,
    completado,
    completadoEn: completado ? serverTimestamp() : null,
    actualizadoEn: serverTimestamp(),
  });
}

export async function contarDocumentos(ruta: string) {
  const resultado = await getCountFromServer(collection(db, ruta));
  return resultado.data().count;
}

export type Inscrito = { uid: string; nombre: string; inscritoEn: number; completadas: string[] };

export async function listarInscritos(cursoId: string): Promise<Inscrito[]> {
  const inscripciones = await getDocs(query(collectionGroup(db, "inscripciones"), where("cursoId", "==", cursoId)));
  const inscritos = await Promise.all(inscripciones.docs.map(async (inscripcion) => {
    const uid = inscripcion.ref.parent.parent?.id ?? "";
    const [perfil, completadas] = await Promise.all([
      getDoc(doc(db, "usuarios", uid)),
      getDocs(query(collection(db, "usuarios", uid, "progreso"), where("cursoId", "==", cursoId), where("completado", "==", true))),
    ]);
    return {
      uid,
      nombre: perfil.data()?.nombre ?? "Alumno",
      inscritoEn: inscripcion.data().inscritoEn?.toMillis() ?? 0,
      completadas: completadas.docs.map((progreso) => progreso.data().claseId as string),
    };
  }));
  return inscritos.sort((a, b) => b.inscritoEn - a.inscritoEn);
}

export async function contarClasesPublicadas(cursoId: string) {
  const resultado = await getCountFromServer(query(collection(db, "cursos", cursoId, "clases"), where("publicado", "==", true)));
  return resultado.data().count;
}

export async function subirVideoClase(cursoId: string, claseId: string, archivo: File, acceso: Acceso, progreso: (porcentaje: number) => void) {
  if (!/\.(mp4|webm)$/i.test(archivo.name) || archivo.size <= 0 || archivo.size > 10 * 1024 ** 3) throw new Error("Selecciona un video MP4 o WebM de hasta 10 GB.");
  const iniciar = httpsCallable<{ cursoId: string; claseId: string; nombre: string; tamano: number; acceso: Acceso }, { subidaId: string; uploadUrl: string }>(funciones, "iniciarSubidaVideo");
  const { data } = await iniciar({ cursoId, claseId, nombre: archivo.name, tamano: archivo.size, acceso });
  const bloque = 10 * 320 * 1024;
  for (let inicio = 0; inicio < archivo.size; inicio += bloque) {
    const fin = Math.min(inicio + bloque, archivo.size);
    // La URL de sesión ya autoriza la carga; no se envían tokens de Microsoft.
    const respuesta = await fetch(data.uploadUrl, {
      method: "PUT", headers: { "Content-Range": `bytes ${inicio}-${fin - 1}/${archivo.size}` }, body: archivo.slice(inicio, fin),
    });
    if (![200, 201, 202].includes(respuesta.status)) throw new Error("La subida se interrumpió. Guarda la clase y vuelve a seleccionar el video para reintentar.");
    if (fin === archivo.size && respuesta.status === 202) throw new Error("Microsoft todavía no confirmó el archivo. Reintenta la subida.");
    progreso(Math.round(fin / archivo.size * 100));
  }
  const confirmar = httpsCallable<{ subidaId: string }, { ruta: string }>(funciones, "confirmarSubidaVideo");
  return (await confirmar({ subidaId: data.subidaId })).data.ruta;
}

export type ArchivoMicrosoft = { nombre: string; carpeta: boolean; ruta: string };
export async function listarVideosMicrosoft(carpeta = "", pagina = "") {
  const listar = httpsCallable<{ carpeta: string; pagina: string }, { elementos: ArchivoMicrosoft[]; siguiente: string | null }>(funciones, "listarVideosMicrosoft");
  return (await listar({ carpeta, pagina })).data;
}

async function subirImagen(key: string, archivo: File, progreso?: (porcentaje: number) => void) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size <= 0 || archivo.size > 5 * 1024 ** 2) throw new Error("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.");
  const portadaKey = key;
  const tarea = uploadBytesResumable(ref(almacenamiento, portadaKey), archivo, { contentType: archivo.type });
  await new Promise<void>((resolve, reject) => {
    let vencida = false;
    const limite = setTimeout(() => {
      vencida = true;
      tarea.cancel();
      reject(new Error("La portada no pudo subir en 45 segundos. Revisa que Firebase Storage esté habilitado y sus reglas publicadas. El curso queda como borrador; puedes reintentar o guardar sin imagen."));
    }, 45_000);
    tarea.on("state_changed", (estado) => progreso?.(Math.round(estado.bytesTransferred / estado.totalBytes * 100)), (error) => {
      clearTimeout(limite);
      if (vencida) return;
      const mensaje = error.code === "storage/unauthorized"
        ? "No tienes permiso para subir la portada. Revisa las reglas de Firebase Storage."
        : error.code === "storage/bucket-not-found"
          ? "Firebase Storage no está habilitado en este proyecto."
          : "No se pudo subir la portada. Revisa Storage y tu conexión; puedes guardar sin imagen.";
      reject(new Error(mensaje));
    }, () => { clearTimeout(limite); resolve(); });
  });

}
export function obtenerPortadaCurso(portadaKey: string) {
  return getDownloadURL(ref(almacenamiento, portadaKey));
}
export async function subirPortadaCurso(cursoId: string, archivo: File, progreso?: (porcentaje: number) => void) {
  await subirImagen(`portadas/${cursoId}`, archivo, progreso);
  await actualizarCurso(cursoId, { portadaKey: `portadas/${cursoId}` });
}
export async function subirPortadaVideo(cursoId: string, claseId: string, archivo: File) {
  const portadaKey = `portadas-clases/${cursoId}/${claseId}`;
  await subirImagen(portadaKey, archivo);
  await updateDoc(referenciaVideo(cursoId, claseId), { portadaKey, actualizadoEn: serverTimestamp() });
}
export async function usarPortadaAutomatica(cursoId: string, claseId: string) {
  await updateDoc(referenciaVideo(cursoId, claseId), { portadaKey: deleteField(), actualizadoEn: serverTimestamp() });
}
export async function previsualizarVideoMicrosoft(cursoId: string, ruta: string) {
  const consultar = httpsCallable<{ cursoId: string; ruta: string }, { url: string }>(funciones, "previsualizarVideoMicrosoft");
  return (await consultar({ cursoId, ruta })).data.url;
}
