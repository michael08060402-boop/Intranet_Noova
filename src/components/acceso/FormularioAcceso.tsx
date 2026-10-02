"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Eye } from "lucide-react";
import iconoGoogle from "@/assets/marca/google.svg";
import { auth } from "@/firebase/config";
import { mensajeDeError } from "@/firebase/errores";
import { guardarNombreRegistro } from "@/firebase/perfiles";

type Modo = "entrar" | "registrar" | "recuperar";

const titulos = {
  entrar: "Bienvenido de nuevo",
  registrar: "Crea tu cuenta",
  recuperar: "Restablece tu contraseña",
};

const textosBoton = {
  entrar: "Iniciar sesión",
  registrar: "Crear cuenta",
  recuperar: "Enviar enlace",
};

export default function FormularioAcceso() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [enviando, setEnviando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setError("");
    setAviso("");
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setAviso("");
    setEnviando(true);

    try {
      if (modo === "recuperar") {
        await sendPasswordResetEmail(auth, correo.trim());
        setAviso("Te enviamos un enlace para restablecer tu contraseña.");
      } else if (modo === "registrar") {
        const credencial = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
        await updateProfile(credencial.user, { displayName: nombre.trim() });
        await sendEmailVerification(credencial.user);
        await guardarNombreRegistro(credencial.user, nombre);
      } else {
        await signInWithEmailAndPassword(auth, correo.trim(), clave);
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  async function entrarConGoogle() {
    setError("");
    setEnviando(true);

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acceso-card">
      <h1>{titulos[modo]}</h1>
      {modo === "recuperar" && <p className="acceso-card__lead">Te enviaremos un enlace para que recuperes el acceso.</p>}

      <form className="acceso-form" onSubmit={enviarFormulario}>
        {modo === "registrar" && (
          <label className="acceso-field">
            <span>Nombre completo</span>
            <input
              autoComplete="name"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. María Torres"
              required
            />
          </label>
        )}
        <label className="acceso-field">
          <span>Correo electrónico</span>
          <input
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="nombre@empresa.com"
            required
          />
        </label>
        {modo !== "recuperar" && (
          <label className="acceso-field">
            <span>Contraseña</span>
            <span className="acceso-password">
              <input
                type={mostrarClave ? "text" : "password"}
                autoComplete={modo === "registrar" ? "new-password" : "current-password"}
                minLength={6}
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
                placeholder={modo === "registrar" ? "Mínimo 6 caracteres" : "Ingresa tu contraseña"}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarClave(!mostrarClave)}
                aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={mostrarClave}
              >
                <Eye className="acceso-icon" />
              </button>
            </span>
          </label>
        )}

        {modo === "entrar" && (
          <div className="acceso-options">
            <label className="acceso-remember">
              <input type="checkbox" />
              Recordarme
            </label>
            <button className="acceso-text-button" type="button" onClick={() => cambiarModo("recuperar")}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
        {error && (
          <p className="acceso-message acceso-message--error" role="alert">
            {error}
          </p>
        )}
        {aviso && (
          <p className="acceso-message acceso-message--success" role="status">
            {aviso}
          </p>
        )}
        <button className="acceso-submit" type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : textosBoton[modo]}
        </button>
      </form>

      {modo !== "recuperar" && (
        <>
          <div className="acceso-divider">
            <span>o</span>
          </div>
          <button className="acceso-google" type="button" onClick={entrarConGoogle} disabled={enviando}>
            <Image src={iconoGoogle} alt="" width={16} height={16} />
            Continuar con Google
          </button>
        </>
      )}

      {modo === "recuperar" ? (
        <button className="acceso-back" type="button" onClick={() => cambiarModo("entrar")}>
          ← Volver al inicio de sesión
        </button>
      ) : (
        <p className="acceso-switch">
          {modo === "registrar" ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
          <button
            className="acceso-text-button"
            type="button"
            onClick={() => cambiarModo(modo === "registrar" ? "entrar" : "registrar")}
          >
            {modo === "registrar" ? "Inicia sesión" : "Crea tu cuenta"}
          </button>
        </p>
      )}
    </div>
  );
}
