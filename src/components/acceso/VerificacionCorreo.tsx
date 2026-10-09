"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut, type User } from "firebase/auth";
import { auth } from "@/firebase/config";
import { mensajeDeError } from "@/firebase/errores";
import "./VerificacionCorreo.css";

export default function VerificacionCorreo({ usuario }: { usuario: User }) {
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        await usuario.reload();
        if (!usuario.emailVerified) return;
        clearInterval(intervalo);
        await usuario.getIdToken(true);
      } catch {}
    }, 4000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  async function reenviar() {
    setAviso("");
    setError("");

    try {
      await sendEmailVerification(usuario);
      setAviso("Correo de verificación enviado.");
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  async function revisar() {
    setAviso("");
    setError("");

    try {
      await usuario.reload();
      if (usuario.emailVerified) {
        await usuario.getIdToken(true);
        router.replace("/alumno");
      } else {
        setAviso("Todavía no aparece como verificado. Abre el enlace del correo e inténtalo de nuevo.");
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  return (
    <main className="verificacion-pagina">
      <section className="verificacion-tarjeta" aria-labelledby="verification-title">
        <span className="verificacion-antetitulo">VERIFICA TU CORREO</span>
        <h1 id="verification-title">Confirma tu cuenta</h1>
        <p>
          Enviamos un enlace de verificación a <strong>{usuario.email}</strong>. Abre ese mensaje y confirma
          tu correo para continuar.
        </p>
        {error && (
          <p className="acceso-mensaje acceso-mensaje--error" role="alert">
            {error}
          </p>
        )}
        {aviso && (
          <p className="acceso-mensaje acceso-mensaje--exito" role="status">
            {aviso}
          </p>
        )}
        <div className="verificacion-acciones">
          <button className="acceso-enviar" type="button" onClick={revisar}>
            Ya verifiqué mi correo
          </button>
          <button className="verificacion-secundario" type="button" onClick={reenviar}>
            Reenviar correo
          </button>
          <button className="verificacion-enlace" type="button" onClick={() => signOut(auth)}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}
