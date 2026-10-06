import type { User } from "firebase/auth";
import { collection, deleteField, doc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "./config";

export type Perfil = {
  nombre: string;
  correo: string;
  rol: "alumno" | "admin";
  plan: "gratis" | "premium";
  estado: "activo" | "suspendido";
  foto?: string;
};

export type Alumno = { id: string; nombre: string; correo: string; plan: Perfil["plan"]; estado: Perfil["estado"]; creadoEn: number };

const leerEstado = (estado: unknown): Perfil["estado"] => (estado === "suspendido" ? "suspendido" : "activo");

export function escucharAlumnos(alCambiar: (alumnos: Alumno[]) => void, alFallar: () => void) {
  return onSnapshot(query(collection(db, "usuarios"), where("rol", "==", "alumno")), (resultado) => {
    const alumnos = resultado.docs.map((documento) => {
      const datos = documento.data();
      return { id: documento.id, nombre: datos.nombre, correo: datos.correo, plan: datos.plan, estado: leerEstado(datos.estado), creadoEn: datos.creadoEn?.toMillis() ?? 0 };
    });
    alCambiar(alumnos.sort((a, b) => b.creadoEn - a.creadoEn));
  }, alFallar);
}

export function capitalizarNombre(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(" ");
}

export function validarNombre(nombre: string) {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length < 2) return "Escribe tu nombre y apellido.";
  if (!palabras.every((palabra) => /^[a-záéíóúüñ']{2,}$/iu.test(palabra))) return "Usa solo letras, con al menos 2 en cada palabra.";
  return "";
}

export function leerPerfil(datos: Record<string, unknown> | undefined): Perfil | null {
  if (!datos || typeof datos.nombre !== "string" || !datos.nombre.trim()) return null;
  if (typeof datos.correo !== "string") return null;
  if (datos.rol !== "alumno" && datos.rol !== "admin") return null;
  if (datos.plan !== "gratis" && datos.plan !== "premium") return null;
  const foto = typeof datos.foto === "string" ? datos.foto : undefined;
  return { nombre: datos.nombre, correo: datos.correo, rol: datos.rol, plan: datos.plan, estado: leerEstado(datos.estado), foto };
}

export async function asegurarPerfil(usuario: User) {
  const referencia = doc(db, "usuarios", usuario.uid);
  await runTransaction(db, async (transaccion) => {
    const perfil = await transaccion.get(referencia);
    if (!perfil.exists()) {
      const nombre = usuario.displayName?.trim() || usuario.email?.split("@")[0] || "Usuario";
      transaccion.set(referencia, {
        nombre: capitalizarNombre(nombre).slice(0, 120),
        correo: usuario.email ?? "",
        rol: "alumno",
        plan: "gratis",
        estado: "activo",
        creadoEn: serverTimestamp(),
      });
    }
  });
  return referencia;
}

export function actualizarNombre(uid: string, nombre: string) {
  return updateDoc(doc(db, "usuarios", uid), { nombre: capitalizarNombre(nombre).slice(0, 120) });
}

export function cambiarPlan(uid: string, plan: Perfil["plan"]) {
  return updateDoc(doc(db, "usuarios", uid), { plan });
}

export function cambiarEstado(uid: string, estado: Perfil["estado"]) {
  return updateDoc(doc(db, "usuarios", uid), { estado });
}

export function actualizarFoto(uid: string, foto: string | null) {
  return updateDoc(doc(db, "usuarios", uid), { foto: foto ?? deleteField() });
}
