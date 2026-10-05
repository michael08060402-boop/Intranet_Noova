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
import { httpsCallable } from "firebase/functions";
import { db, funciones } from "./config";

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
  return deleteDoc(doc(db, "cursos", id));
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
  return deleteDoc(doc(db, "cursos", cursoId, "clases", claseId));
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
  const datos = { nombre: "Video de la clase", tipo: "video", ruta: video.ruta, orden: 0, acceso: video.acceso, actualizadoEn: serverTimestamp() };
  if ((await getDoc(referencia)).exists()) return updateDoc(referencia, datos);
  return setDoc(referencia, { ...datos, creadoEn: serverTimestamp() });
}

export async function pedirVideo(cursoId: string, claseId: string) {
  const resultado = await httpsCallable<{ cursoId: string; claseId: string }, { url: string }>(funciones, "obtenerVideo")({ cursoId, claseId });
  return resultado.data.url;
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

export type Inscrito = { uid: string; nombre: string; inscritoEn: number; completadas: number };

export async function listarInscritos(cursoId: string): Promise<Inscrito[]> {
  const inscripciones = await getDocs(query(collectionGroup(db, "inscripciones"), where("cursoId", "==", cursoId)));
  const inscritos = await Promise.all(inscripciones.docs.map(async (inscripcion) => {
    const uid = inscripcion.ref.parent.parent?.id ?? "";
    const [perfil, completadas] = await Promise.all([
      getDoc(doc(db, "usuarios", uid)),
      getCountFromServer(query(collection(db, "usuarios", uid, "progreso"), where("cursoId", "==", cursoId), where("completado", "==", true))),
    ]);
    return {
      uid,
      nombre: perfil.data()?.nombre ?? "Alumno",
      inscritoEn: inscripcion.data().inscritoEn?.toMillis() ?? 0,
      completadas: completadas.data().count,
    };
  }));
  return inscritos.sort((a, b) => b.inscritoEn - a.inscritoEn);
}

export async function contarClasesPublicadas(cursoId: string) {
  const resultado = await getCountFromServer(query(collection(db, "cursos", cursoId, "clases"), where("publicado", "==", true)));
  return resultado.data().count;
}
