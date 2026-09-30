import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { nuevaNotificacion } from "./notificaciones";

export type TipoPregunta = "opcion" | "abierta";
export type ModoExamen = "manual" | "archivo";
export type EstadoIntento = "en_curso" | "entregado" | "calificado";

export type Pregunta = { id: string; enunciado: string; tipo: TipoPregunta; opciones: string[]; puntos: number };
export type Respuestas = Record<string, number | string>;
// Índice de la opción correcta por pregunta. Vive aparte del examen para que el alumno nunca lo descargue.
export type Claves = Record<string, number>;
export type Puntajes = Record<string, number>;

export type Examen = {
  id: string;
  cursoId: string;
  nombre: string;
  descripcion: string;
  modo: ModoExamen;
  // 0 = sin límite de tiempo.
  duracionMin: number;
  notaMinima: number;
  publicado: boolean;
  preguntas: Pregunta[];
  creadoEn: number;
};

export type DatosExamen = Omit<Examen, "id" | "creadoEn">;

export type Intento = {
  id: string;
  examenId: string;
  cursoId: string;
  uid: string;
  nombre: string;
  correo: string;
  inicio: number;
  fin: number | null;
  estado: EstadoIntento;
  respuestas: Respuestas;
  puntajes: Puntajes;
  nota: number | null;
  comentario: string;
  calificadoEn: number | null;
};

// Las notas van de 0 a 20, como en los programas de capacitación del sector.
export const NOTA_MAXIMA = 20;

function leerExamen(id: string, datos: DocumentData): Examen {
  return {
    id,
    cursoId: datos.cursoId,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    modo: datos.modo,
    duracionMin: datos.duracionMin,
    notaMinima: datos.notaMinima,
    publicado: datos.publicado,
    preguntas: datos.preguntas ?? [],
    creadoEn: datos.creadoEn?.toMillis() ?? Date.now(),
  };
}

function leerIntento(id: string, datos: DocumentData): Intento {
  return {
    id,
    examenId: datos.examenId,
    cursoId: datos.cursoId,
    uid: datos.uid,
    nombre: datos.nombre,
    correo: datos.correo,
    inicio: datos.inicio?.toMillis() ?? Date.now(),
    fin: datos.fin?.toMillis() ?? null,
    estado: datos.estado,
    respuestas: datos.respuestas ?? {},
    puntajes: datos.puntajes ?? {},
    nota: datos.nota ?? null,
    comentario: datos.comentario ?? "",
    calificadoEn: datos.calificadoEn?.toMillis() ?? null,
  };
}

// Las reglas no filtran consultas: el alumno debe pedir solo lo publicado o lo suyo, o Firestore rechaza toda la consulta.
export function escucharExamenes(soloPublicados: boolean, alCambiar: (examenes: Examen[]) => void, alFallar: () => void) {
  const referencia = collection(db, "examenes");
  const consulta = soloPublicados ? query(referencia, where("publicado", "==", true)) : referencia;
  return onSnapshot(consulta, (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerExamen(documento.id, documento.data())).sort((a, b) => b.creadoEn - a.creadoEn));
  }, alFallar);
}

export function escucharExamenesDeCurso(cursoId: string, alCambiar: (examenes: Examen[]) => void, alFallar: () => void) {
  const consulta = query(collection(db, "examenes"), where("cursoId", "==", cursoId), where("publicado", "==", true));
  return onSnapshot(consulta, (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerExamen(documento.id, documento.data())).sort((a, b) => a.creadoEn - b.creadoEn));
  }, alFallar);
}

export function escucharExamen(id: string, alCambiar: (examen: Examen | null) => void, alFallar: () => void) {
  return onSnapshot(doc(db, "examenes", id), (documento) => {
    alCambiar(documento.exists() ? leerExamen(documento.id, documento.data()) : null);
  }, alFallar);
}

export async function leerClaves(examenId: string): Promise<Claves> {
  const documento = await getDoc(doc(db, "examenes", examenId, "claves", "clave"));
  return documento.data()?.respuestas ?? {};
}

// Examen y claves se guardan juntos: nunca queda un examen publicado sin su corrección.
export function guardarExamen(id: string | null, datos: DatosExamen, claves: Claves, uid: string) {
  const referencia = id ? doc(db, "examenes", id) : doc(collection(db, "examenes"));
  const lote = writeBatch(db);
  if (id) lote.update(referencia, { ...datos, actualizadoEn: serverTimestamp() });
  else lote.set(referencia, { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), creadoPor: uid });
  lote.set(doc(referencia, "claves", "clave"), { respuestas: claves, actualizadoEn: serverTimestamp() });
  return lote.commit();
}

// Firestore no borra subcolecciones: se elimina la clave junto con el examen. Las entregas se conservan, por eso la pantalla solo deja borrar exámenes sin ellas.
export function eliminarExamen(id: string) {
  const lote = writeBatch(db);
  lote.delete(doc(db, "examenes", id, "claves", "clave"));
  lote.delete(doc(db, "examenes", id));
  return lote.commit();
}

export const idIntento = (examenId: string, uid: string) => `${examenId}_${uid}`;

export function escucharIntento(examenId: string, uid: string, alCambiar: (intento: Intento | null) => void, alFallar: () => void) {
  return onSnapshot(doc(db, "intentos", idIntento(examenId, uid)), (documento) => {
    alCambiar(documento.exists() ? leerIntento(documento.id, documento.data()) : null);
  }, alFallar);
}

export function escucharIntentosAlumno(uid: string, alCambiar: (intentos: Intento[]) => void, alFallar: () => void) {
  return onSnapshot(query(collection(db, "intentos"), where("uid", "==", uid)), (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerIntento(documento.id, documento.data())));
  }, alFallar);
}

// Solo para administradores: todas las entregas, o solo las de un estado.
export function escucharIntentos(estado: EstadoIntento | null, alCambiar: (intentos: Intento[]) => void, alFallar: () => void) {
  const referencia = collection(db, "intentos");
  const consulta = estado ? query(referencia, where("estado", "==", estado)) : referencia;
  return onSnapshot(consulta, (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerIntento(documento.id, documento.data())).sort((a, b) => b.inicio - a.inicio));
  }, alFallar);
}

export function escucharIntentosExamen(examenId: string, alCambiar: (intentos: Intento[]) => void, alFallar: () => void) {
  return onSnapshot(query(collection(db, "intentos"), where("examenId", "==", examenId)), (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerIntento(documento.id, documento.data())).sort((a, b) => b.inicio - a.inicio));
  }, alFallar);
}

export function iniciarIntento(examen: Examen, usuario: User, nombre: string) {
  return setDoc(doc(db, "intentos", idIntento(examen.id, usuario.uid)), {
    examenId: examen.id,
    cursoId: examen.cursoId,
    uid: usuario.uid,
    nombre,
    correo: usuario.email ?? "",
    inicio: serverTimestamp(),
    fin: null,
    estado: "en_curso",
    respuestas: {},
    nota: null,
    actualizadoEn: serverTimestamp(),
  });
}

export function guardarRespuestas(intentoId: string, respuestas: Respuestas) {
  return updateDoc(doc(db, "intentos", intentoId), { respuestas, actualizadoEn: serverTimestamp() });
}

export function entregarIntento(intentoId: string, respuestas: Respuestas) {
  return updateDoc(doc(db, "intentos", intentoId), { respuestas, estado: "entregado", fin: serverTimestamp(), actualizadoEn: serverTimestamp() });
}

// Permite que el alumno vuelva a rendir el examen.
export function reiniciarIntento(intentoId: string) {
  return deleteDoc(doc(db, "intentos", intentoId));
}

// Momento en que vence el tiempo del intento; null si el examen no tiene límite.
export const vencimientoIntento = (examen: Examen, intento: Intento) =>
  examen.duracionMin > 0 ? intento.inicio + examen.duracionMin * 60000 : null;

export const esAutomatico = (examen: Examen) => examen.modo === "manual" && examen.preguntas.every((pregunta) => pregunta.tipo === "opcion");

// Puntaje de las preguntas de opción múltiple; las abiertas las puntúa el administrador.
export function puntajesAutomaticos(examen: Examen, claves: Claves, respuestas: Respuestas): Puntajes {
  const puntajes: Puntajes = {};
  examen.preguntas.filter((pregunta) => pregunta.tipo === "opcion").forEach((pregunta) => {
    puntajes[pregunta.id] = respuestas[pregunta.id] !== undefined && respuestas[pregunta.id] === claves[pregunta.id] ? pregunta.puntos : 0;
  });
  return puntajes;
}

export function calcularNota(examen: Examen, puntajes: Puntajes) {
  const total = examen.preguntas.reduce((suma, pregunta) => suma + pregunta.puntos, 0);
  const obtenido = examen.preguntas.reduce((suma, pregunta) => suma + Math.min(puntajes[pregunta.id] ?? 0, pregunta.puntos), 0);
  return total > 0 ? Math.round((obtenido / total) * NOTA_MAXIMA * 10) / 10 : 0;
}

type Calificacion = { intento: Intento; puntajes: Puntajes; nota: number; comentario: string };

// Guarda las notas y avisa a cada alumno; se hace por lotes de 200 entregas (2 escrituras cada una, límite de 500).
export async function calificarIntentos(examen: Examen, calificaciones: Calificacion[]) {
  for (let inicio = 0; inicio < calificaciones.length; inicio += 200) {
    const lote = writeBatch(db);
    calificaciones.slice(inicio, inicio + 200).forEach(({ intento, puntajes, nota, comentario }) => {
      lote.update(doc(db, "intentos", intento.id), { nota, puntajes, comentario, estado: "calificado", calificadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
      const aviso = nuevaNotificacion(intento.uid, `Nota publicada: ${examen.nombre}`, `Obtuviste ${nota} de ${NOTA_MAXIMA}.`, `/alumno/examen?id=${examen.id}`);
      lote.set(aviso.referencia, aviso.datos);
    });
    await lote.commit();
  }
}
