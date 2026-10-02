import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ region: "us-east1", maxInstances: 10 });

const db = getFirestore();
const idInquilino = defineString("MS_TENANT_ID");
const idCliente = defineString("MS_CLIENT_ID");
const idBiblioteca = defineString("MS_DRIVE_ID");
const secretoCliente = defineSecret("MS_CLIENT_SECRET");

let tokenGuardado: { valor: string; vence: number } | null = null;

async function tokenMicrosoft() {
  if (tokenGuardado && tokenGuardado.vence > Date.now()) return tokenGuardado.valor;
  const respuesta = await fetch(`https://login.microsoftonline.com/${idInquilino.value()}/oauth2/v2.0/token`, {
    method: "POST",
    body: new URLSearchParams({
      client_id: idCliente.value(),
      client_secret: secretoCliente.value(),
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!respuesta.ok) throw new Error(`Microsoft respondió ${respuesta.status} al pedir el token`);
  const datos = (await respuesta.json()) as { access_token: string; expires_in: number };
  tokenGuardado = { valor: datos.access_token, vence: Date.now() + (datos.expires_in - 60) * 1000 };
  return tokenGuardado.valor;
}

async function enlaceDelVideo(ruta: string) {
  const camino = ruta.split("/").map(encodeURIComponent).join("/");
  const respuesta = await fetch(`https://graph.microsoft.com/v1.0/drives/${idBiblioteca.value()}/root:/${camino}`, {
    headers: { Authorization: `Bearer ${await tokenMicrosoft()}` },
  });
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error(`Graph respondió ${respuesta.status}`);
  const archivo = (await respuesta.json()) as Record<string, unknown>;
  const enlace = archivo["@microsoft.graph.downloadUrl"];
  return typeof enlace === "string" ? enlace : null;
}

function idValido(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(id);
}

function rutaValida(ruta: unknown): ruta is string {
  return typeof ruta === "string"
    && /\.(mp4|webm)$/i.test(ruta)
    && !ruta.split("/").some((parte) => parte === "" || parte === "." || parte === "..");
}

export const obtenerVideo = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  const uid = peticion.auth?.uid;
  if (!uid || peticion.auth?.token.email_verified !== true) {
    throw new HttpsError("unauthenticated", "Inicia sesión con tu correo verificado.");
  }

  const { cursoId, claseId } = peticion.data ?? {};
  if (!idValido(cursoId) || !idValido(claseId)) throw new HttpsError("invalid-argument", "La clase indicada no es válida.");

  const [perfil, curso, clase, video, inscripcion] = await Promise.all([
    db.doc(`usuarios/${uid}`).get(),
    db.doc(`cursos/${cursoId}`).get(),
    db.doc(`cursos/${cursoId}/clases/${claseId}`).get(),
    db.doc(`cursos/${cursoId}/clases/${claseId}/contenidos/video`).get(),
    db.doc(`usuarios/${uid}/inscripciones/${cursoId}`).get(),
  ]);

  const alumno = perfil.data();
  if (alumno?.rol !== "alumno" || alumno.estado === "suspendido") {
    throw new HttpsError("permission-denied", "Tu cuenta no puede ver este video.");
  }
  if (!curso.data()?.publicado || !clase.data()?.publicado || !video.exists) {
    throw new HttpsError("not-found", "Esta clase no tiene video.");
  }
  if (!inscripcion.exists) throw new HttpsError("failed-precondition", "Inscríbete en el curso para ver sus clases.");

  const requierePremium = curso.data()?.acceso === "premium" || video.data()?.acceso === "premium";
  if (requierePremium && alumno.plan !== "premium") {
    throw new HttpsError("permission-denied", "Este video es parte del plan Premium.", { motivo: "premium" });
  }

  const ruta = video.data()?.ruta;
  try {
    const url = rutaValida(ruta) ? await enlaceDelVideo(ruta) : null;
    if (url) return { url };
    logger.warn("No se encontró el video en SharePoint", { cursoId, claseId, ruta });
  } catch (error) {
    logger.error("Falló la consulta a Microsoft Graph", error);
  }
  throw new HttpsError("unavailable", "No se pudo cargar el video. Inténtalo de nuevo en unos minutos.");
});
