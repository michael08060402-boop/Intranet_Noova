import type { User } from "firebase/auth";
import { arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, type DocumentData } from "firebase/firestore";
import { db } from "./config";
import { nuevaNotificacion } from "./notificaciones";
import type { Perfil } from "./perfiles";

export const categoriasTicket = ["Cursos", "Exámenes", "Herramientas", "Pagos y planes", "Mi cuenta", "Otro"] as const;
export type CategoriaTicket = (typeof categoriasTicket)[number];
export type EstadoTicket = "abierto" | "respondido" | "cerrado";
export type Mensaje = { de: "usuario" | "soporte"; autor: string; texto: string; fecha: number };
export type Ticket = {
  id: string;
  uid: string;
  nombre: string;
  correo: string;
  rol: "alumno" | "admin";
  asunto: string;
  categoria: CategoriaTicket;
  estado: EstadoTicket;
  mensajes: Mensaje[];
  sinLeer: boolean;
  creadoEn: number;
  actualizadoEn: number;
};

export const CORREO_SOPORTE = "contactos@noovasac.com";
export const LIMITE_ASUNTO = 100;
export const LIMITE_MENSAJE = 2000;

function leerTicket(id: string, datos: DocumentData): Ticket {
  return {
    id,
    uid: datos.uid,
    nombre: datos.nombre,
    correo: datos.correo,
    rol: datos.rol,
    asunto: datos.asunto,
    categoria: datos.categoria,
    estado: datos.estado,
    mensajes: datos.mensajes,
    sinLeer: datos.sinLeer,
    creadoEn: datos.creadoEn?.toMillis() ?? Date.now(),
    actualizadoEn: datos.actualizadoEn?.toMillis() ?? Date.now(),
  };
}

function ordenar(tickets: Ticket[]) {
  return tickets.sort((a, b) => b.actualizadoEn - a.actualizadoEn);
}

export function escucharTicketsDe(uid: string, alCambiar: (tickets: Ticket[]) => void, alFallar: () => void) {
  return onSnapshot(query(collection(db, "tickets"), where("uid", "==", uid)), (resultado) => {
    alCambiar(ordenar(resultado.docs.map((documento) => leerTicket(documento.id, documento.data()))));
  }, alFallar);
}

export function escucharTickets(alCambiar: (tickets: Ticket[]) => void, alFallar: () => void) {
  return onSnapshot(collection(db, "tickets"), (resultado) => {
    alCambiar(ordenar(resultado.docs.map((documento) => leerTicket(documento.id, documento.data()))));
  }, alFallar);
}

export async function crearTicket(usuario: User, perfil: Perfil, asunto: string, categoria: CategoriaTicket, texto: string) {
  const referencia = doc(collection(db, "tickets"));
  await setDoc(referencia, {
    uid: usuario.uid,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol,
    asunto,
    categoria,
    estado: "abierto",
    mensajes: [{ de: "usuario", autor: perfil.nombre, texto, fecha: Date.now() }],
    sinLeer: false,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return referencia.id;
}

export function responderComoUsuario(ticket: Ticket, autor: string, texto: string) {
  return updateDoc(doc(db, "tickets", ticket.id), {
    mensajes: arrayUnion({ de: "usuario", autor, texto, fecha: Date.now() }),
    estado: "abierto",
    actualizadoEn: serverTimestamp(),
  });
}

// Al responder, el alumno recibe además una notificación; el administrador ve el aviso en su menú.
export async function responderComoSoporte(ticket: Ticket, autor: string, texto: string) {
  const lote = writeBatch(db);
  lote.update(doc(db, "tickets", ticket.id), {
    mensajes: arrayUnion({ de: "soporte", autor, texto, fecha: Date.now() }),
    estado: "respondido",
    sinLeer: true,
    actualizadoEn: serverTimestamp(),
  });
  if (ticket.rol === "alumno") {
    const aviso = nuevaNotificacion(ticket.uid, "Respondieron tu ticket", ticket.asunto.slice(0, 120), `/alumno/soporte?id=${ticket.id}`);
    lote.set(aviso.referencia, aviso.datos);
  }
  await lote.commit();
}

export function cambiarEstadoTicket(id: string, estado: "abierto" | "cerrado") {
  return updateDoc(doc(db, "tickets", id), { estado, actualizadoEn: serverTimestamp() });
}

export function marcarTicketLeido(id: string) {
  return updateDoc(doc(db, "tickets", id), { sinLeer: false });
}
