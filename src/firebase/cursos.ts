import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
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
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app, db } from "./config";

// Storage y Functions se crean aquí y no en config.ts para no cargarlos en el acceso, que no los usa.
// Desarrollo y Hosting usan las funciones desplegadas en noova-intranet.
const almacenamiento = getStorage(app);
const funciones = getFunctions(app, "us-east1");

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
  versionPortada?: number;
};

export type Clase = { id: string; nombre: string; descripcion: string; orden: number; publicado: boolean; miniatura?: string };

type DatosCategoria = Omit<Categoria, "id">;
type DatosCurso = Omit<Curso, "id" | "creadoEn" | "versionPortada">;
type DatosClase = Omit<Clase, "id" | "miniatura">;

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
    versionPortada: datos.actualizadoEn?.toMillis() ?? 0,
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
      return { id: documento.id, nombre: datos.nombre, descripcion: datos.descripcion, orden: datos.orden, publicado: datos.publicado, miniatura: datos.miniatura };
    });
    alCambiar(clases.sort((a, b) => (a.orden - b.orden) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
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

export type VideoClase = { ruta: string; acceso: Acceso };

function referenciaVideo(cursoId: string, claseId: string) {
  return doc(db, "cursos", cursoId, "clases", claseId, "contenidos", "video");
}

export async function leerVideoClase(cursoId: string, claseId: string): Promise<VideoClase | null> {
  const documento = await getDoc(referenciaVideo(cursoId, claseId));
  return documento.exists() ? { ruta: documento.data().ruta, acceso: documento.data().acceso } : null;
}

export async function guardarVideoClase(cursoId: string, claseId: string, video: VideoClase | null) {
  const referencia = referenciaVideo(cursoId, claseId);
  if (!video) return deleteDoc(referencia);
  const usadas = await rutasVideosUsados(cursoId, claseId);
  if (usadas.includes(video.ruta.toLocaleLowerCase())) throw new Error("Ese video ya está utilizado en otra clase.");
  const datos = { nombre: "Video de la clase", tipo: "video", ruta: video.ruta, orden: 0, acceso: video.acceso, actualizadoEn: serverTimestamp() };
  if ((await getDoc(referencia)).exists()) return updateDoc(referencia, datos);
  return setDoc(referencia, { ...datos, creadoEn: serverTimestamp() });
}

export async function rutasVideosUsados(cursoId: string, exceptoClaseId?: string): Promise<string[]> {
  // Incluir borradores y excluir únicamente la clase que se está editando.
  const cursos = await getDocs(collection(db, "cursos"));
  const rutas = await Promise.all(cursos.docs.map(async (curso) => {
    const clases = await getDocs(collection(db, "cursos", curso.id, "clases"));
    const videos = await Promise.all(clases.docs
      .filter((clase) => curso.id !== cursoId || clase.id !== exceptoClaseId)
      .map((clase) => leerVideoClase(curso.id, clase.id)));
    return videos.flatMap((video) => video ? [video.ruta.toLocaleLowerCase()] : []);
  }));
  return [...new Set(rutas.flat())];
}

export async function pedirVideo(cursoId: string, claseId: string) {
  const resultado = await httpsCallable<{ cursoId: string; claseId: string }, { url: string; subtitulos?: string; transcripcion?: string }>(funciones, "obtenerVideo")({ cursoId, claseId });
  return resultado.data;
}

export async function actualizarMiniaturaClase(cursoId: string, claseId: string) {
  const actualizar = httpsCallable<{ cursoId: string; claseId: string }, { miniatura: string | null }>(funciones, "actualizarMiniaturaClase");
  return (await actualizar({ cursoId, claseId })).data.miniatura;
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

export function marcarClase(cursoId: string, claseId: string, completado: boolean) {
  return httpsCallable<{ cursoId: string; claseId: string; completado: boolean }, { completado: boolean }>(funciones, "registrarClaseCompletada")({ cursoId, claseId, completado });
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

export type ArchivoMicrosoft = { nombre: string; carpeta: boolean; ruta: string };
export async function listarVideosMicrosoft(carpeta = "", pagina = "") {
  const listar = httpsCallable<{ carpeta: string; pagina: string }, { elementos: ArchivoMicrosoft[]; siguiente: string | null }>(funciones, "listarVideosMicrosoft");
  return (await listar({ carpeta, pagina })).data;
}

// Las tarjetas muestran la portada a menos de 1280 px; reducirla evita descargar fotos de varios MB.
function reducirPortada(archivo: File) {
  return new Promise<Blob>((resolver, rechazar) => {
    const direccion = URL.createObjectURL(archivo);
    const imagen = document.createElement("img");
    imagen.onload = () => {
      const escala = Math.min(1, 1280 / Math.max(imagen.width, imagen.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      const contexto = lienzo.getContext("2d");
      if (!contexto) {
        URL.revokeObjectURL(direccion);
        rechazar(new Error("No se pudo procesar la imagen."));
        return;
      }
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(direccion);
      lienzo.toBlob((blob) => (blob?.type === "image/webp" ? resolver(blob) : rechazar(new Error("Este navegador no permite convertir la portada a WebP."))), "image/webp", 0.82);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(direccion);
      rechazar(new Error("No se pudo leer la imagen seleccionada."));
    };
    imagen.src = direccion;
  });
}

async function subirImagen(key: string, archivo: File, progreso?: (porcentaje: number) => void) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size <= 0 || archivo.size > 5 * 1024 ** 2) throw new Error("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.");
  const imagen = await reducirPortada(archivo);
  // El navegador reutiliza la imagen; las tarjetas versionan la URL al actualizar el curso.
  const tarea = uploadBytesResumable(ref(almacenamiento, key), imagen, { contentType: "image/webp", cacheControl: "public, max-age=3600" });
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
const urlsPortadas = new Map<string, Promise<string>>();
export function obtenerPortadaCurso(portadaKey: string, version?: number) {
  const clave = JSON.stringify([portadaKey, version ?? 0]);
  const existente = urlsPortadas.get(clave);
  if (existente) return existente;
  const consulta = (async () => {
    const cacheKey = `noova-portada:${clave}`;
    if (typeof window !== "undefined" && version) {
      try {
        const guardada = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null");
        if (guardada && typeof guardada.url === "string" && guardada.vence > Date.now()) return guardada.url as string;
      } catch { /* La caché es opcional. */ }
    }
    const url = new URL(await getDownloadURL(ref(almacenamiento, portadaKey)));
    if (version) url.searchParams.set("v", String(version));
    if (typeof window !== "undefined" && version) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ url: url.href, vence: Date.now() + 3600_000 })); } catch { /* La caché es opcional. */ }
    }
    return url.href;
  })();
  urlsPortadas.set(clave, consulta);
  consulta.catch(() => { if (urlsPortadas.get(clave) === consulta) urlsPortadas.delete(clave); });
  if (urlsPortadas.size > 200) urlsPortadas.delete(urlsPortadas.keys().next().value!);
  return consulta;
}
export async function subirPortadaCurso(cursoId: string, archivo: File, progreso?: (porcentaje: number) => void) {
  await subirImagen(`portadas/${cursoId}`, archivo, progreso);
  urlsPortadas.clear();
  await actualizarCurso(cursoId, { portadaKey: `portadas/${cursoId}` });
}
export async function previsualizarVideoMicrosoft(cursoId: string, ruta: string) {
  const consultar = httpsCallable<{ cursoId: string; ruta: string }, { url: string; subtitulos?: string }>(funciones, "previsualizarVideoMicrosoft");
  return (await consultar({ cursoId, ruta })).data;
}
