import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./config";

export type Notificacion = { id: string; titulo: string; texto: string; enlace: string; leida: boolean; creadoEn: number };

export function nuevaNotificacion(uid: string, titulo: string, texto: string, enlace: string) {
  return {
    referencia: doc(collection(db, "usuarios", uid, "notificaciones")),
    datos: { titulo, texto, enlace, leida: false, creadoEn: serverTimestamp() },
  };
}

export function escucharNotificaciones(uid: string, alCambiar: (notificaciones: Notificacion[]) => void, alFallar: () => void) {
  const consulta = query(collection(db, "usuarios", uid, "notificaciones"), orderBy("creadoEn", "desc"), limit(20));
  return onSnapshot(consulta, (resultado) => {
    alCambiar(resultado.docs.map((documento) => {
      const datos = documento.data();
      return {
        id: documento.id,
        titulo: datos.titulo,
        texto: datos.texto,
        enlace: datos.enlace,
        leida: datos.leida,
        creadoEn: datos.creadoEn?.toMillis() ?? Date.now(),
      };
    }));
  }, alFallar);
}

export async function marcarLeidas(uid: string, ids: string[]) {
  const lote = writeBatch(db);
  ids.forEach((id) => lote.update(doc(db, "usuarios", uid, "notificaciones", id), { leida: true }));
  await lote.commit();
}
