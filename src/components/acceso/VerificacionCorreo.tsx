"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut, type User } from "firebase/auth";
import { auth } from "@/firebase/config";
import { mensajeDeError } from "@/firebase/errores";
import "./VerificacionCorreo.css";

export default function VerificacionCorreo({ usuario }: { usuario: User }) {
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

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
    <main className="verification-page">
      <section className="verification-card" aria-labelledby="verification-title">
        <span className="verification-eyebrow">VERIFICA TU CORREO</span>
        <h1 id="verification-title">Confirma tu cuenta</h1>
        <p>
          Enviamos un enlace de verificación a <strong>{usuario.email}</strong>. Abre ese mensaje y confirma
          tu correo para continuar.
        </p>
        {error && (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        )}
        {aviso && (
          <p className="auth-message auth-message--success" role="status">
            {aviso}
          </p>
        )}
        <div className="verification-actions">
          <button className="auth-submit" type="button" onClick={revisar}>
            Ya verifiqué mi correo
          </button>
          <button className="verification-secondary" type="button" onClick={reenviar}>
            Reenviar correo
          </button>
          <button className="verification-link" type="button" onClick={() => signOut(auth)}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}
