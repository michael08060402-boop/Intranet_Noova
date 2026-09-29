"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/config";
import { useSesion } from "./SesionProvider";
import "./AccesoPorRol.css";

export default function AccesoPorRol({ rol, children }: { rol: "alumno" | "admin"; children: ReactNode }) {
  const { usuario, perfil, cargando, error } = useSesion();
  const [errorSalida, setErrorSalida] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (cargando || error) return;
    if (!usuario?.emailVerified) router.replace("/");
    else if (perfil && perfil.rol !== rol) router.replace(perfil.rol === "admin" ? "/admin" : "/");
  }, [usuario, perfil, cargando, error, rol, router]);

  if (error) return <main className="acceso-rol" role="alert">
    <h1>No pudimos abrir tu cuenta</h1><p>{error}</p>
    <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
    <button type="button" onClick={async () => {
      try { await signOut(auth); router.replace("/"); }
      catch { setErrorSalida("No se pudo cerrar la sesión. Inténtalo nuevamente."); }
    }}>Volver al acceso</button>
    {errorSalida && <p>{errorSalida}</p>}
  </main>;
  if (cargando || !usuario?.emailVerified || perfil?.rol !== rol) return <main className="acceso-rol" role="status">Comprobando acceso…</main>;
  return children;
}
