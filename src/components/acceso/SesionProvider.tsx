"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { auth } from "@/firebase/config";
import { asegurarPerfil, leerPerfil, type Perfil } from "@/firebase/perfiles";

type Sesion = { usuario: User | null; perfil: Perfil | null; cargando: boolean; error: string };

const SesionContext = createContext<Sesion>({
  usuario: null,
  perfil: null,
  cargando: true,
  error: "",
});

export function useSesion() {
  return useContext(SesionContext);
}

export default function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>({
    usuario: null,
    perfil: null,
    cargando: true,
    error: "",
  });

  useEffect(() => {
    let version = 0;
    let dejarPerfil: (() => void) | undefined;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const dejarAuth = onIdTokenChanged(auth, async (usuario) => {
      const actual = ++version;
      dejarPerfil?.();
      clearTimeout(espera);
      setSesion({ usuario, perfil: null, cargando: !!usuario?.emailVerified, error: "" });
      if (!usuario?.emailVerified) return;
      function fallo() {
        if (actual !== version) return;
        clearTimeout(espera);
        setSesion({
          usuario,
          perfil: null,
          cargando: false,
          error: "No se pudo consultar tu perfil. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
      espera = setTimeout(fallo, 20000);
      try {
        const referencia = await asegurarPerfil(usuario);
        if (actual !== version) return;
        dejarPerfil = onSnapshot(
          referencia,
          { includeMetadataChanges: true },
          (snapshot) => {
            if (actual !== version || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
              return;
            clearTimeout(espera);
            const perfil = leerPerfil(snapshot.data());
            setSesion({
              usuario,
              perfil,
              cargando: false,
              error: perfil ? "" : "Tu perfil no tiene un rol o plan válido. Contacta al administrador.",
            });
          },
          fallo,
        );
      } catch {
        fallo();
      }
    });
    return () => {
      version++;
      clearTimeout(espera);
      dejarPerfil?.();
      dejarAuth();
    };
  }, []);

  return <SesionContext.Provider value={sesion}>{children}</SesionContext.Provider>;
}
