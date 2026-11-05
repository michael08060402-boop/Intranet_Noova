import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { app, db } from "./config";
import { nuevaNotificacion } from "./notificaciones";

export type TipoPregunta = "opcion" | "abierta";
type ModoExamen = "manual" | "archivo";
type EstadoIntento = "en_curso" | "entregado" | "calificado";

export type Pregunta = { id: string; enunciado: string; tipo: TipoPregunta; opciones: string[]; puntos: number };
export type Respuestas = Record<string, number | string>;
export type Claves = Record<string, number>;
export type Puntajes = Record<string, number>;

export type Examen = {
  id: string;
  cursoId: string;
  nombre: string;
  descripcion: string;
  modo: ModoExamen;
  duracionMin: number;
  notaMinima: number;
  publicado: boolean;
  herramientas: boolean;
  preguntas: Pregunta[];
  creadoEn: number;
};

type DatosExamen = Omit<Examen, "id" | "creadoEn">;

export type Intento = {
  id: string;
  examenId: string;
  cursoId: string;
  uid: string;
  nombre: string;
  correo: string;
  inicio: number;
  duracionMin?: number;
  fin: number | null;
  estado: EstadoIntento;
  respuestas: Respuestas;
  puntajes: Puntajes;
  nota: number | null;
  comentario: string;
  calificadoEn: number | null;
};

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
    herramientas: datos.herramientas === true,
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
    duracionMin: typeof datos.duracionMin === "number" ? datos.duracionMin : undefined,
    fin: datos.fin?.toMillis() ?? null,
    estado: datos.estado,
    respuestas: datos.respuestas ?? {},
    puntajes: datos.puntajes ?? {},
    nota: datos.nota ?? null,
    comentario: datos.comentario ?? "",
    calificadoEn: datos.calificadoEn?.toMillis() ?? null,
  };
}

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

export function guardarExamen(id: string | null, datos: DatosExamen, claves: Claves, uid: string) {
  const referencia = id ? doc(db, "examenes", id) : doc(collection(db, "examenes"));
  const lote = writeBatch(db);
  if (id) lote.update(referencia, { ...datos, actualizadoEn: serverTimestamp() });
  else lote.set(referencia, { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), creadoPor: uid });
  lote.set(doc(referencia, "claves", "clave"), { respuestas: claves, actualizadoEn: serverTimestamp() });
  return lote.commit();
}

export async function eliminarExamen(id: string) {
  // Retirar el examen primero impide iniciar nuevos intentos durante el borrado.
  await updateDoc(doc(db, "examenes", id), { publicado: false, actualizadoEn: serverTimestamp() });
  const intentos = await getDocs(query(collection(db, "intentos"), where("examenId", "==", id)));
  for (let inicio = 0; inicio < intentos.docs.length; inicio += 400) {
    const loteIntentos = writeBatch(db);
    intentos.docs.slice(inicio, inicio + 400).forEach((intento) => loteIntentos.delete(intento.ref));
    await loteIntentos.commit();
  }
  const lote = writeBatch(db);
  lote.delete(doc(db, "examenes", id, "claves", "clave"));
  lote.delete(doc(db, "examenes", id));
  return lote.commit();
}

const idIntento = (examenId: string, uid: string) => `${examenId}_${uid}`;

export function escucharIntento(examenId: string, uid: string, alCambiar: (intento: Intento | null) => void, alFallar: () => void) {
  // La lectura de un documento inexistente no puede validar resource.data.uid.
  // Una consulta por propietario devuelve una lista vacía y sigue escuchando su creación.
  const consulta = query(collection(db, "intentos"), where("uid", "==", uid), where("examenId", "==", examenId));
  return onSnapshot(consulta, (resultado) => {
    const documento = resultado.docs.find((item) => item.id === idIntento(examenId, uid));
    alCambiar(documento ? leerIntento(documento.id, documento.data()) : null);
  }, alFallar);
}

export function escucharIntentosAlumno(uid: string, alCambiar: (intentos: Intento[]) => void, alFallar: () => void) {
  return onSnapshot(query(collection(db, "intentos"), where("uid", "==", uid)), (resultado) => {
    alCambiar(resultado.docs.map((documento) => leerIntento(documento.id, documento.data())));
  }, alFallar);
}

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

export function iniciarIntento(examen: Examen) {
  return httpsCallable<{ examenId: string }, { iniciado: boolean }>(getFunctions(app, "us-east1"), "iniciarExamenAlumno")({ examenId: examen.id });
}

export function guardarRespuestas(intentoId: string, respuestas: Respuestas) {
  return updateDoc(doc(db, "intentos", intentoId), { respuestas, actualizadoEn: serverTimestamp() });
}

export function entregarIntento(intentoId: string, respuestas: Respuestas) {
  return updateDoc(doc(db, "intentos", intentoId), { respuestas, estado: "entregado", fin: serverTimestamp(), actualizadoEn: serverTimestamp() });
}

export function reiniciarIntento(intentoId: string) {
  return deleteDoc(doc(db, "intentos", intentoId));
}

export function estadoExamen(examen: Examen, intento: Intento | undefined) {
  if (!intento) return { texto: "Sin rendir", accion: "Rendir examen" };
  if (intento.estado === "en_curso") return { texto: "En curso", accion: "Continuar" };
  if (intento.estado === "entregado") return { texto: "Entregado · pendiente de nota", accion: "Ver" };
  return { texto: `Nota ${intento.nota} de ${NOTA_MAXIMA} · ${(intento.nota ?? 0) >= examen.notaMinima ? "Aprobado" : "Desaprobado"}`, accion: "Ver resultado" };
}

export const vencimientoIntento = (examen: Examen, intento: Intento) => {
  const minutos = intento.duracionMin ?? examen.duracionMin;
  return minutos > 0 ? intento.inicio + minutos * 60000 : null;
};

export const esAutomatico = (examen: Examen) => examen.modo === "manual" && examen.preguntas.every((pregunta) => pregunta.tipo === "opcion");

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
