import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type Transaction } from "firebase-admin/firestore";
import { getDownloadURL, getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ region: "us-east1", maxInstances: 10 });

const db = getFirestore();
const idInquilino = defineString("MS_TENANT_ID");
const idCliente = defineString("MS_CLIENT_ID");
const usuarioVideos = defineString("MS_VIDEO_USER", { default: "contactos@noovasac.com" });
const secretoCliente = defineSecret("MICROSOFT_CLIENT_SECRET");

// Se guarda la promesa y no el resultado: las peticiones simultáneas comparten una sola consulta a Microsoft.
// El token dura al menos 60 minutos y se renueva a los 50; los enlaces de descarga duran cerca de una hora y se reutilizan 30 minutos.
let tokenGuardado: { promesa: Promise<string>; vence: number } | null = null;
const enlacesGuardados = new Map<string, { promesa: Promise<{ url: string; itemId: string } | null>; vence: number }>();

function tokenMicrosoft() {
  if (!tokenGuardado || tokenGuardado.vence < Date.now()) {
    const promesa = pedirToken();
    tokenGuardado = { promesa, vence: Date.now() + 50 * 60 * 1000 };
    promesa.catch(() => { tokenGuardado = null; });
  }
  return tokenGuardado.promesa;
}

async function pedirToken() {
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
  return ((await respuesta.json()) as { access_token: string }).access_token;
}

function enlaceDelVideo(ruta: string) {
  const guardado = enlacesGuardados.get(ruta);
  if (guardado && guardado.vence > Date.now()) return guardado.promesa;
  const promesa = buscarVideo(ruta);
  enlacesGuardados.set(ruta, { promesa, vence: Date.now() + 30 * 60 * 1000 });
  promesa.then((archivo) => { if (!archivo) enlacesGuardados.delete(ruta); }, () => enlacesGuardados.delete(ruta));
  return promesa;
}

async function buscarVideo(ruta: string) {
  const camino = ruta.split("/").map(encodeURIComponent).join("/");
  const usuario = encodeURIComponent(usuarioVideos.value());
  const respuesta = await fetch(`https://graph.microsoft.com/v1.0/users/${usuario}/drive/root:/${camino}`, {
    headers: { Authorization: `Bearer ${await tokenMicrosoft()}` },
  });
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error(`Graph respondió ${respuesta.status}`);
  const archivo = (await respuesta.json()) as Record<string, unknown>;
  const enlace = archivo["@microsoft.graph.downloadUrl"];
  return typeof enlace === "string" ? { url: enlace, itemId: archivo.id as string } : null;
}

function idValido(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(id);
}

function rutaValida(ruta: unknown): ruta is string {
  return typeof ruta === "string"
    && /\.(mp4|webm)$/i.test(ruta)
    && !ruta.split("/").some((parte) => parte === "" || parte === "." || parte === "..");
}

async function avanceCurso(uid: string, cursoId: string, transaccion?: Transaction) {
  const referencias = [db.doc(`usuarios/${uid}`), db.doc(`cursos/${cursoId}`), db.doc(`usuarios/${uid}/inscripciones/${cursoId}`)];
  const [perfil, curso, inscripcion] = await Promise.all(referencias.map((referencia) => transaccion ? transaccion.get(referencia) : referencia.get()));
  const alumno = perfil.data();
  if (alumno?.rol !== "alumno" || alumno.estado === "suspendido") throw new HttpsError("permission-denied", "Tu cuenta no puede acceder al curso.");
  if (!curso.data()?.publicado) throw new HttpsError("not-found", "El curso no está disponible.");
  if (!inscripcion.exists) throw new HttpsError("failed-precondition", "Inscríbete en el curso para continuar.");
  if (curso.data()?.acceso === "premium" && alumno.plan !== "premium") throw new HttpsError("permission-denied", "Este curso requiere Premium.");
  const consultaClases = db.collection(`cursos/${cursoId}/clases`).where("publicado", "==", true);
  const consultaProgreso = db.collection(`usuarios/${uid}/progreso`).where("cursoId", "==", cursoId);
  const [clases, progreso] = await Promise.all([
    transaccion ? transaccion.get(consultaClases) : consultaClases.get(),
    transaccion ? transaccion.get(consultaProgreso) : consultaProgreso.get(),
  ]);
  const ordenadas = clases.docs.sort((a, b) => (a.data().orden - b.data().orden) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const completadas = new Set(progreso.docs.filter((item) => item.data().completado === true).map((item) => item.data().claseId as string));
  return { ordenadas, completadas, alumno };
}

function alumnoAutenticado(auth: { uid: string; token: { email_verified?: unknown } } | undefined) {
  if (!auth || auth.token.email_verified !== true) throw new HttpsError("unauthenticated", "Inicia sesión con tu correo verificado.");
  return auth.uid;
}

export const registrarClaseCompletada = onCall(async (peticion) => {
  const uid = alumnoAutenticado(peticion.auth);
  const { cursoId, claseId, completado } = peticion.data ?? {};
  if (!idValido(cursoId) || !idValido(claseId) || typeof completado !== "boolean") throw new HttpsError("invalid-argument", "Selecciona una clase válida.");
  return db.runTransaction(async (transaccion) => {
    const { ordenadas, completadas } = await avanceCurso(uid, cursoId, transaccion);
    const indice = ordenadas.findIndex((clase) => clase.id === claseId);
    if (indice < 0) throw new HttpsError("not-found", "La clase no está disponible.");
    if (!ordenadas.slice(0, indice).every((clase) => completadas.has(clase.id))) throw new HttpsError("failed-precondition", "Completa las clases anteriores primero.");
    if (!completado && ordenadas.slice(indice + 1).some((clase) => completadas.has(clase.id))) throw new HttpsError("failed-precondition", "Desmarca primero las clases posteriores.");
    transaccion.set(db.doc(`usuarios/${uid}/progreso/${cursoId}_${claseId}`), {
      cursoId, claseId, completado, completadoEn: completado ? FieldValue.serverTimestamp() : null, actualizadoEn: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { completado };
  });
});

export const iniciarExamenAlumno = onCall(async (peticion) => {
  const uid = alumnoAutenticado(peticion.auth);
  const { examenId } = peticion.data ?? {};
  if (!idValido(examenId)) throw new HttpsError("invalid-argument", "Selecciona un examen válido.");
  return db.runTransaction(async (transaccion) => {
    const examen = await transaccion.get(db.doc(`examenes/${examenId}`));
    const datos = examen.data();
    if (!datos?.publicado || datos.modo !== "manual" || !idValido(datos.cursoId) || !Array.isArray(datos.preguntas) || !datos.preguntas.length) throw new HttpsError("not-found", "El examen no está disponible.");
    const { ordenadas, completadas, alumno } = await avanceCurso(uid, datos.cursoId, transaccion);
    const referencia = db.doc(`intentos/${examenId}_${uid}`);
    const intento = await transaccion.get(referencia);
    // Reanudar un intento existente no cambia el tiempo ni sus respuestas.
    if (intento.exists) return { iniciado: true };
    if (!ordenadas.length || !ordenadas.every((clase) => completadas.has(clase.id))) throw new HttpsError("failed-precondition", "Completa todas las clases antes de iniciar el examen.");
    transaccion.create(referencia, {
      examenId, cursoId: datos.cursoId, uid, nombre: alumno.nombre, correo: alumno.correo,
      inicio: FieldValue.serverTimestamp(), fin: null, estado: "en_curso", respuestas: {}, nota: null, actualizadoEn: FieldValue.serverTimestamp(),
    });
    return { iniciado: true };
  });
});

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

  const { ordenadas, completadas } = await avanceCurso(uid, cursoId);
  const posicion = ordenadas.findIndex((item) => item.id === claseId);
  if (posicion < 0 || !ordenadas.slice(0, posicion).every((item) => completadas.has(item.id))) throw new HttpsError("failed-precondition", "Completa las clases anteriores para reproducir este video.");

  const ruta = video.data()?.ruta;
  try {
    const archivo = rutaValida(ruta) ? await enlaceDelVideo(ruta) : null;
    if (archivo) return { url: archivo.url };
    logger.warn("No se encontró el video en SharePoint", { cursoId, claseId, ruta });
  } catch (error) {
    logger.error("Falló la consulta a Microsoft Graph", error);
  }
  throw new HttpsError("unavailable", "No se pudo cargar el video. Inténtalo de nuevo en unos minutos.");
});

const carpetaCursos = "NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS";
const maximoVideo = 10 * 1024 ** 3;

async function exigirAdmin(uid: string | undefined, verificado: unknown) {
  if (!uid || verificado !== true) throw new HttpsError("unauthenticated", "Inicia sesión con tu correo verificado.");
  const perfil = (await db.doc(`usuarios/${uid}`).get()).data();
  if (perfil?.rol !== "admin" || perfil.estado === "suspendido") throw new HttpsError("permission-denied", "Solo un administrador activo puede subir videos.");
  return uid;
}

async function consultarGraph(endpoint: string, metodo = "GET", cuerpo?: unknown) {
  const respuesta = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(usuarioVideos.value())}/drive${endpoint}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await tokenMicrosoft()}`, "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    logger.warn("Consulta de subida a Graph rechazada", { estado: respuesta.status });
    throw new HttpsError(respuesta.status === 403 ? "permission-denied" : "unavailable", respuesta.status === 403 ? "Microsoft no permite escribir en la carpeta de videos." : "No se pudo consultar Microsoft. Reintenta en unos minutos.");
  }
  return respuesta.json();
}

export const iniciarSubidaVideo = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  const uid = await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const { cursoId, claseId, nombre, tamano, acceso } = peticion.data ?? {};
  if (!idValido(cursoId) || !idValido(claseId) || typeof nombre !== "string" || !/\.(mp4|webm)$/i.test(nombre) || !Number.isSafeInteger(tamano) || tamano <= 0 || tamano > maximoVideo || !["gratis", "premium"].includes(acceso)) {
    throw new HttpsError("invalid-argument", "Selecciona un video MP4 o WebM de hasta 10 GB.");
  }
  const [curso, clase] = await Promise.all([db.doc(`cursos/${cursoId}`).get(), db.doc(`cursos/${cursoId}/clases/${claseId}`).get()]);
  if (!curso.exists || !clase.exists) throw new HttpsError("not-found", "El curso o la clase ya no existe.");
  const raiz = await consultarGraph(`/root:/${carpetaCursos.split("/").map(encodeURIComponent).join("/")}`);
  const carpeta = await consultarGraph(`/items/${encodeURIComponent(raiz.id)}/children`, "POST", {
    name: `intranet-${cursoId}`, folder: {}, "@microsoft.graph.conflictBehavior": "fail",
  }).catch(async (error) => {
    // Puede existir por una subida anterior o haberse creado simultáneamente.
    const ruta = `${carpetaCursos}/intranet-${cursoId}`.split("/").map(encodeURIComponent).join("/");
    try { return await consultarGraph(`/root:/${ruta}`); } catch { throw error; }
  });
  const registro = db.collection("subidasVideos").doc();
  const extension = nombre.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
  const nombreArchivo = `${claseId}-${registro.id}.${extension}`;
  const ruta = `${carpetaCursos}/intranet-${cursoId}/${nombreArchivo}`;
  const sesion = await consultarGraph(`/items/${encodeURIComponent(carpeta.id)}:/${nombreArchivo}:/createUploadSession`, "POST", {
    item: { "@microsoft.graph.conflictBehavior": "fail", name: nombreArchivo },
  });
  await registro.set({ uid, cursoId, claseId, ruta, tamano, acceso, vence: Date.parse(sesion.expirationDateTime), confirmada: false });
  return { subidaId: registro.id, uploadUrl: sesion.uploadUrl };
});

export const confirmarSubidaVideo = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  const uid = await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const subidaId = peticion.data?.subidaId;
  if (!idValido(subidaId)) throw new HttpsError("invalid-argument", "La subida no es válida.");
  const referencia = db.doc(`subidasVideos/${subidaId}`);
  const datos = (await referencia.get()).data();
  if (!datos || datos.uid !== uid) throw new HttpsError("permission-denied", "No tienes acceso a esta subida.");
  if (datos.confirmada) return { ruta: datos.ruta };
  if (datos.vence < Date.now()) throw new HttpsError("failed-precondition", "La subida venció. Vuelve a seleccionar el video.");
  const archivo = await consultarGraph(`/root:/${datos.ruta.split("/").map(encodeURIComponent).join("/")}`);
  if (!archivo.file || archivo.size !== datos.tamano) throw new HttpsError("failed-precondition", "El video no terminó de subir.");
  await db.runTransaction(async (transaccion) => {
    const actual = await transaccion.get(referencia);
    const clase = await transaccion.get(db.doc(`cursos/${datos.cursoId}/clases/${datos.claseId}`));
    if (!clase.exists) throw new HttpsError("not-found", "La clase fue eliminada.");
    if (actual.data()?.confirmada) return;
    transaccion.set(db.doc(`cursos/${datos.cursoId}/clases/${datos.claseId}/contenidos/video`), {
      nombre: "Video de la clase", tipo: "video", orden: 0, ruta: datos.ruta, acceso: datos.acceso, creadoEn: FieldValue.serverTimestamp(), actualizadoEn: FieldValue.serverTimestamp(),
    });
    transaccion.update(referencia, { confirmada: true });
  });
  return { ruta: datos.ruta };
});

export const listarVideosMicrosoft = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const carpeta = peticion.data?.carpeta ?? "";
  const pagina = peticion.data?.pagina ?? "";
  if (typeof carpeta !== "string" || carpeta.length > 1500 || (carpeta && carpeta.split("/").some((parte: string) => !parte || parte === "." || parte === ".." || /[\\\x00-\x1f]/.test(parte))) || typeof pagina !== "string" || pagina.length > 12000) {
    throw new HttpsError("invalid-argument", "La carpeta no es válida.");
  }
  const ruta = carpetaCursos + (carpeta ? `/${carpeta}` : "");
  const parametros = new URLSearchParams({ "$select": "name,folder,file", "$top": "200" });
  if (pagina) parametros.set("$skiptoken", pagina);
  const datos = await consultarGraph(`/root:/${ruta.split("/").map(encodeURIComponent).join("/")}:/children?${parametros}`);
  const elementos = (datos.value as { name: string; folder?: unknown; file?: unknown }[])
    .filter((item) => item.folder || (item.file && /\.(mp4|webm)$/i.test(item.name)))
    .map((item) => ({ nombre: item.name, carpeta: Boolean(item.folder), ruta: `${ruta}/${item.name}` }));
  const siguiente = datos["@odata.nextLink"] ? new URL(datos["@odata.nextLink"]).searchParams.get("$skiptoken") : null;
  return { elementos, siguiente };
});

export const previsualizarVideoMicrosoft = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const { cursoId, ruta } = peticion.data ?? {};
  if (!idValido(cursoId) || !rutaValida(ruta) || ruta.length > 1500 || !ruta.startsWith(`${carpetaCursos}/`)) {
    throw new HttpsError("invalid-argument", "Selecciona un video de la carpeta de cursos.");
  }
  if (!(await db.doc(`cursos/${cursoId}`).get()).exists) throw new HttpsError("not-found", "El curso no existe.");
  const archivo = await enlaceDelVideo(ruta);
  if (!archivo) throw new HttpsError("not-found", "No se encontró el video seleccionado.");
  return { url: archivo.url };
});

// La miniatura se guarda una sola vez en Storage para que las listas de clases no abran cada video.
export const actualizarMiniaturaClase = onCall({ secrets: [secretoCliente] }, async (peticion) => {
  await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const { cursoId, claseId } = peticion.data ?? {};
  if (!idValido(cursoId) || !idValido(claseId)) throw new HttpsError("invalid-argument", "La clase indicada no es válida.");
  const clase = db.doc(`cursos/${cursoId}/clases/${claseId}`);
  const [datosClase, video] = await Promise.all([clase.get(), clase.collection("contenidos").doc("video").get()]);
  if (!datosClase.exists) throw new HttpsError("not-found", "La clase ya no existe.");
  const archivo = getStorage().bucket().file(`portadas-clases/${cursoId}/${claseId}`);
  const ruta = video.data()?.ruta;
  const item = rutaValida(ruta) ? await enlaceDelVideo(ruta) : null;
  const miniaturas = item ? await consultarGraph(`/items/${encodeURIComponent(item.itemId)}/thumbnails`) : null;
  const origen: string | undefined = miniaturas?.value?.[0]?.large?.url ?? miniaturas?.value?.[0]?.medium?.url;
  if (!origen) {
    // Sin video, o Microsoft todavía no generó la miniatura de un archivo recién subido.
    await archivo.delete({ ignoreNotFound: true });
    await clase.update({ miniatura: FieldValue.delete() });
    return { miniatura: null };
  }
  const imagen = await fetch(origen);
  if (!imagen.ok) throw new HttpsError("unavailable", "No se pudo descargar la miniatura de Microsoft.");
  // Un token nuevo cambia la URL, así el navegador no muestra una miniatura anterior guardada en caché.
  await archivo.save(Buffer.from(await imagen.arrayBuffer()), {
    contentType: imagen.headers.get("content-type") ?? "image/jpeg",
    metadata: { cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: randomUUID() } },
  });
  const miniatura = await getDownloadURL(archivo);
  await clase.update({ miniatura });
  return { miniatura };
});

export const eliminarContenidoAdmin = onCall(async (peticion) => {
  await exigirAdmin(peticion.auth?.uid, peticion.auth?.token.email_verified);
  const { cursoId, claseId } = peticion.data ?? {};
  if (!idValido(cursoId) || (claseId !== undefined && !idValido(claseId))) throw new HttpsError("invalid-argument", "Selecciona un curso o clase válido.");
  const ruta = claseId ? `cursos/${cursoId}/clases/${claseId}` : `cursos/${cursoId}`;
  const referencia = db.doc(ruta);
  // Firestore no elimina las subcolecciones al borrar un documento.
  // El borrado recursivo elimina también las referencias de videos, sin llamar a Microsoft.
  await db.recursiveDelete(referencia);
  return { eliminado: true };
});
