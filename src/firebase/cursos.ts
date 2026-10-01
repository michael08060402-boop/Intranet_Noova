import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";

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

export type DatosCategoria = Omit<Categoria, "id">;
export type DatosCurso = Omit<Curso, "id" | "creadoEn">;
export type DatosClase = Omit<Clase, "id">;

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
    // serverTimestamp() llega como null mientras la escritura local no se confirma.
    creadoEn: datos.creadoEn?.toMillis() ?? Date.now(),
  };
}

// Las reglas no filtran consultas: el alumno debe pedir solo lo activo o publicado, o Firestore rechaza toda la consulta.
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

// Las reglas exigen el documento completo: se reenvían siempre nombre, descripción y estado.
export function actualizarCategoria(id: string, datos: DatosCategoria) {
  return updateDoc(doc(db, "categorias", id), { ...datos, actualizadoEn: serverTimestamp() });
}

// Un curso guarda solo el ID de su categoría: eliminarla dejaría ese curso sin categoría.
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

// Firestore no borra subcolecciones: solo se elimina un curso sin clases para no dejarlas huérfanas.
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

// Igual que con los cursos: solo se elimina una clase sin contenidos para no dejarlos huérfanos.
export function eliminarClase(cursoId: string, claseId: string) {
  return deleteDoc(doc(db, "cursos", cursoId, "clases", claseId));
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

// El id del documento debe ser cursoId_claseId, como exigen las reglas.
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

// Las inscripciones viven dentro de cada alumno: se cuentan con una consulta de grupo, que usa el índice de firestore.indexes.json.
export async function contarInscritos(cursoId: string) {
  const resultado = await getCountFromServer(query(collectionGroup(db, "inscripciones"), where("cursoId", "==", cursoId)));
  return resultado.data().count;
}

// Los alumnos solo pueden contar las clases publicadas; sin el filtro, Firestore rechaza la consulta.
export async function contarClasesPublicadas(cursoId: string) {
  const resultado = await getCountFromServer(query(collection(db, "cursos", cursoId, "clases"), where("publicado", "==", true)));
  return resultado.data().count;
}
