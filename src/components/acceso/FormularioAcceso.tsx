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
import { Eye, Lock, Mail, User, UserPlus } from "lucide-react";
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

const bajadas = {
  entrar: "Ingresa a tu cuenta para continuar aprendiendo.",
  registrar: "Regístrate para comenzar tu recorrido de aprendizaje.",
  recuperar: "Te enviaremos un enlace para que recuperes el acceso.",
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
    <div className="auth-card">
      <h1>{titulos[modo]}</h1>
      <p className="auth-card__lead">{bajadas[modo]}</p>

      {modo !== "recuperar" && (
        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={modo === "entrar"}
            className={modo === "entrar" ? "is-active" : ""}
            onClick={() => cambiarModo("entrar")}
          >
            <User className="auth-icon" />
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === "registrar"}
            className={modo === "registrar" ? "is-active" : ""}
            onClick={() => cambiarModo("registrar")}
          >
            <UserPlus className="auth-icon" />
            Crear cuenta
          </button>
        </div>
      )}

      <form className="auth-form" onSubmit={enviarFormulario}>
        {modo === "registrar" && (
          <label className="auth-field">
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
        <label className="auth-field">
          <span>Correo electrónico</span>
          <span className="auth-input">
            <Mail className="auth-icon" />
            <input
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              placeholder="nombre@empresa.com"
              required
            />
          </span>
        </label>
        {modo !== "recuperar" && (
          <label className="auth-field">
            <span>Contraseña</span>
            <span className="auth-input auth-password">
              <Lock className="auth-icon" />
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
                <Eye className="auth-icon" />
              </button>
            </span>
          </label>
        )}

        {modo === "entrar" && (
          <div className="auth-options">
            <label className="auth-remember">
              <input type="checkbox" />
              Recordarme
            </label>
            <button className="auth-text-button" type="button" onClick={() => cambiarModo("recuperar")}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
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
        <button className="auth-submit" type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : textosBoton[modo]}
          {!enviando && <span aria-hidden="true">→</span>}
        </button>
      </form>

      {modo !== "recuperar" && (
        <>
          <div className="auth-divider">
            <span>o continúa con</span>
          </div>
          <button className="auth-google" type="button" onClick={entrarConGoogle} disabled={enviando}>
            <Image src={iconoGoogle} alt="" width={16} height={16} />
            Continuar con Google
          </button>
        </>
      )}

      {modo === "recuperar" ? (
        <button className="auth-back" type="button" onClick={() => cambiarModo("entrar")}>
          ← Volver al inicio de sesión
        </button>
      ) : (
        <p className="auth-switch">
          {modo === "registrar" ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
          <button
            className="auth-text-button"
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
