import type { User } from "firebase/auth";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./config";

export type Perfil = {
  nombre: string;
  correo: string;
  rol: "alumno" | "admin";
  plan: "gratis" | "premium";
};

export function capitalizarNombre(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

export function leerPerfil(datos: Record<string, unknown> | undefined): Perfil | null {
  if (!datos || typeof datos.nombre !== "string" || !datos.nombre.trim()) return null;
  if (typeof datos.correo !== "string") return null;
  if (datos.rol !== "alumno" && datos.rol !== "admin") return null;
  if (datos.plan !== "gratis" && datos.plan !== "premium") return null;
  return { nombre: datos.nombre, correo: datos.correo, rol: datos.rol, plan: datos.plan };
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

export async function guardarNombreRegistro(usuario: User, nombre: string) {
  const referencia = await asegurarPerfil(usuario);
  await updateDoc(referencia, { nombre: capitalizarNombre(nombre).slice(0, 120) });
}
