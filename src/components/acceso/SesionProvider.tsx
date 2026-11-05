"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
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

// Firebase tarda en confirmar la sesión guardada; esta marca permite mostrar el formulario de acceso
// sin esperar a Firebase cuando en este navegador no había una sesión abierta.
export const MARCA_SESION = "noova-sesion";

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
    const dejarAuth = onIdTokenChanged(auth, (usuario) => {
      const actual = ++version;
      dejarPerfil?.();
      clearTimeout(espera);
      try {
        if (usuario) localStorage.setItem(MARCA_SESION, "1");
        else localStorage.removeItem(MARCA_SESION);
      } catch {}
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
      let creandoPerfil = false;
      try {
        const referencia = doc(db, "usuarios", usuario.uid);
        dejarPerfil = onSnapshot(
          referencia,
          { includeMetadataChanges: true },
          (snapshot) => {
            if (actual !== version || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
              return;
            if (!snapshot.exists()) {
              if (!creandoPerfil) {
                creandoPerfil = true;
                // Solo el primer acceso necesita crear el perfil en una transacción.
                asegurarPerfil(usuario).catch(fallo);
              }
              return;
            }
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
