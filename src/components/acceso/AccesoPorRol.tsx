"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { CORREO_SOPORTE } from "@/firebase/tickets";
import { useSesion } from "./SesionProvider";
import "./AccesoPorRol.css";

export default function AccesoPorRol({ rol, children }: { rol: "alumno" | "admin"; children: ReactNode }) {
  const { usuario, perfil, cargando, error } = useSesion();
  const [errorSalida, setErrorSalida] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (cargando || error) return;
    if (!usuario?.emailVerified) router.replace("/");
    else if (perfil && perfil.rol !== rol) router.replace(perfil.rol === "admin" ? "/admin" : "/alumno");
  }, [usuario, perfil, cargando, error, rol, router]);

  async function salir() {
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setErrorSalida("No se pudo cerrar la sesión. Inténtalo nuevamente.");
    }
  }

  if (error)
    return (
      <main className="acceso-rol" role="alert">
        <h1>No pudimos abrir tu cuenta</h1>
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
        <button type="button" onClick={salir}>
          Volver al acceso
        </button>
        {errorSalida && <p>{errorSalida}</p>}
      </main>
    );
  if (cargando || !usuario?.emailVerified || perfil?.rol !== rol)
    return (
      <main className="acceso-rol" role="status">
        Comprobando acceso…
      </main>
    );
  if (perfil.estado === "suspendido")
    return (
      <main className="acceso-rol" role="alert">
        <h1>Tu cuenta está suspendida</h1>
        <p>
          Mientras esté suspendida no puedes entrar a la plataforma. Tu avance y tus notas se conservan. Si crees que es un error, escríbenos a{" "}
          <a href={`mailto:${CORREO_SOPORTE}`}>{CORREO_SOPORTE}</a>.
        </p>
        <button type="button" onClick={salir}>
          Cerrar sesión
        </button>
        {errorSalida && <p>{errorSalida}</p>}
      </main>
    );
  return children;
}
