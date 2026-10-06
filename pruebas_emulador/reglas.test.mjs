import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { Timestamp, deleteDoc, deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

let entorno;

const perfil = (datos) => ({ correo: `${datos.nombre.toLowerCase()}@prueba.com`, rol: "alumno", plan: "gratis", estado: "activo", creadoEn: Timestamp.now(), ...datos });
const curso = (acceso) => ({
  nombre: `Curso ${acceso}`,
  descripcion: "",
  categoriaId: "ventilacion",
  nivel: "basico",
  publicado: true,
  acceso,
  creadoEn: Timestamp.now(),
  actualizadoEn: Timestamp.now(),
  creadoPor: "admin",
});

const ticket = (estado) => ({
  uid: "alumno",
  nombre: "Alumno",
  correo: "alumno@prueba.com",
  rol: "alumno",
  asunto: "No carga el video",
  categoria: "Cursos",
  estado,
  mensajes: [{ de: "usuario", autor: "Alumno", texto: "No carga", fecha: Date.now() }],
  sinLeer: false,
  creadoEn: Timestamp.now(),
  actualizadoEn: Timestamp.now(),
});

const como = (uid) => entorno.authenticatedContext(uid, { email: `${uid}@prueba.com`, email_verified: true }).firestore();

before(async () => {
  entorno = await initializeTestEnvironment({
    projectId: "demo-noova",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

after(async () => {
  await entorno.cleanup();
});

beforeEach(async () => {
  await entorno.clearFirestore();
  await entorno.withSecurityRulesDisabled(async (contexto) => {
    const db = contexto.firestore();
    await setDoc(doc(db, "usuarios/alumno"), perfil({ nombre: "Alumno" }));
    await setDoc(doc(db, "usuarios/otro"), perfil({ nombre: "Otro" }));
    await setDoc(doc(db, "usuarios/suspendido"), perfil({ nombre: "Suspendido", estado: "suspendido" }));
    await setDoc(doc(db, "usuarios/alumno/notificaciones/n1"), { titulo: "Nota publicada", texto: "", enlace: "/alumno/evaluaciones", leida: false, creadoEn: Timestamp.now() });
    await setDoc(doc(db, "usuarios/admin"), perfil({ nombre: "Admin", rol: "admin" }));
    await setDoc(doc(db, "cursos/gratis"), curso("gratis"));
    await setDoc(doc(db, "cursos/pago"), curso("premium"));
    await setDoc(doc(db, "cursos/gratis/clases/c1"), { nombre: "Clase 1", descripcion: "", orden: 0, publicado: true, creadoEn: Timestamp.now(), actualizadoEn: Timestamp.now(), creadoPor: "admin" });
    await setDoc(doc(db, "cursos/gratis/clases/c1/contenidos/video"), { ruta: "Ventsim/basico-1.mp4", acceso: "gratis" });
    await setDoc(doc(db, "examenes/e1"), { cursoId: "gratis", nombre: "Examen", publicado: true });
    await setDoc(doc(db, "examenes/e1/claves/clave"), { respuestas: { p1: 0 } });
    await setDoc(doc(db, "intentos/e1_alumno"), { examenId: "e1", cursoId: "gratis", uid: "alumno", estado: "calificado", nota: 10, respuestas: {} });
    await setDoc(doc(db, "tickets/abierto"), ticket("abierto"));
    await setDoc(doc(db, "tickets/cerrado"), { ...ticket("cerrado"), cerradoPor: "usuario" });
  });
});

describe("Lo que el alumno no debe poder hacer", () => {
  it("leer las respuestas de un examen", async () => {
    await assertFails(getDoc(doc(como("alumno"), "examenes/e1/claves/clave")));
  });

  it("cambiarse la nota", async () => {
    await assertFails(updateDoc(doc(como("alumno"), "intentos/e1_alumno"), { nota: 20 }));
  });

  it("activarse el plan Premium", async () => {
    await assertFails(updateDoc(doc(como("alumno"), "usuarios/alumno"), { plan: "premium" }));
  });

  it("ver la ruta de los videos", async () => {
    await assertFails(getDoc(doc(como("alumno"), "cursos/gratis/clases/c1/contenidos/video")));
  });

  it("inscribirse en un curso Premium con plan gratis", async () => {
    await assertFails(setDoc(doc(como("alumno"), "usuarios/alumno/inscripciones/pago"), { cursoId: "pago", inscritoEn: serverTimestamp() }));
  });

  it("leer cursos con la cuenta suspendida", async () => {
    await assertFails(getDoc(doc(como("suspendido"), "cursos/gratis")));
  });

  it("crear su perfil sin verificar el correo", async () => {
    const sinVerificar = entorno.authenticatedContext("nuevo", { email: "nuevo@prueba.com", email_verified: false }).firestore();
    await assertFails(setDoc(doc(sinVerificar, "usuarios/nuevo"), { ...perfil({ nombre: "Nuevo" }), creadoEn: serverTimestamp() }));
  });

  it("leer cursos sin iniciar sesión", async () => {
    await assertFails(getDoc(doc(entorno.unauthenticatedContext().firestore(), "cursos/gratis")));
  });
});

describe("Lo que el alumno sí debe poder hacer", () => {
  it("crear su perfil con el correo verificado", async () => {
    await assertSucceeds(setDoc(doc(como("nuevo"), "usuarios/nuevo"), { ...perfil({ nombre: "Nuevo" }), creadoEn: serverTimestamp() }));
  });

  it("cambiar su nombre", async () => {
    await assertSucceeds(updateDoc(doc(como("alumno"), "usuarios/alumno"), { nombre: "Nuevo nombre" }));
  });

  it("leer un curso publicado", async () => {
    await assertSucceeds(getDoc(doc(como("alumno"), "cursos/gratis")));
  });

  it("inscribirse en un curso gratis", async () => {
    await assertSucceeds(setDoc(doc(como("alumno"), "usuarios/alumno/inscripciones/gratis"), { cursoId: "gratis", inscritoEn: serverTimestamp() }));
  });
});

describe("El administrador", () => {
  it("cambia el plan y el estado de un alumno", async () => {
    await assertSucceeds(updateDoc(doc(como("admin"), "usuarios/alumno"), { plan: "premium", estado: "suspendido" }));
  });

  it("no puede cambiar el rol de un alumno", async () => {
    await assertFails(updateDoc(doc(como("admin"), "usuarios/alumno"), { rol: "admin" }));
  });

  it("cierra un ticket como soporte", async () => {
    await assertSucceeds(updateDoc(doc(como("admin"), "tickets/abierto"), { estado: "cerrado", cerradoPor: "soporte", actualizadoEn: serverTimestamp() }));
  });

  it("reabre un ticket cerrado", async () => {
    await assertSucceeds(updateDoc(doc(como("admin"), "tickets/cerrado"), { estado: "abierto", cerradoPor: deleteField(), actualizadoEn: serverTimestamp() }));
  });

  it("elimina un ticket cerrado", async () => {
    await assertSucceeds(deleteDoc(doc(como("admin"), "tickets/cerrado")));
  });

  it("no puede eliminar un ticket abierto", async () => {
    await assertFails(deleteDoc(doc(como("admin"), "tickets/abierto")));
  });
});

describe("Notificaciones", () => {
  it("el alumno borra la suya", async () => {
    await assertSucceeds(deleteDoc(doc(como("alumno"), "usuarios/alumno/notificaciones/n1")));
  });

  it("otro alumno no puede borrarla", async () => {
    await assertFails(deleteDoc(doc(como("otro"), "usuarios/alumno/notificaciones/n1")));
  });
});

describe("Tickets del alumno", () => {
  it("cierra su propio ticket", async () => {
    await assertSucceeds(updateDoc(doc(como("alumno"), "tickets/abierto"), { estado: "cerrado", cerradoPor: "usuario", actualizadoEn: serverTimestamp() }));
  });

  it("no puede cerrarlo como soporte", async () => {
    await assertFails(updateDoc(doc(como("alumno"), "tickets/abierto"), { estado: "cerrado", cerradoPor: "soporte", actualizadoEn: serverTimestamp() }));
  });

  it("no puede eliminar su ticket", async () => {
    await assertFails(deleteDoc(doc(como("alumno"), "tickets/cerrado")));
  });
});
