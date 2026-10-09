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
import { Check, Circle, Eye } from "lucide-react";
import iconoGoogle from "@/assets/marca/google.svg";
import { auth } from "@/firebase/config";
import { mensajeDeError } from "@/firebase/errores";
import { validarNombre } from "@/firebase/perfiles";

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

const reglasClave = [
  { texto: "Al menos 6 caracteres", cumple: (clave: string) => clave.length >= 6 },
  { texto: "Una mayúscula", cumple: (clave: string) => /\p{Lu}/u.test(clave) },
  { texto: "Un número", cumple: (clave: string) => /\d/.test(clave) },
  { texto: "Un carácter especial (!@#$%…)", cumple: (clave: string) => /[^\p{L}\d\s]/u.test(clave) },
];

export default function FormularioAcceso() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [enviando, setEnviando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const claveSegura = reglasClave.every((regla) => regla.cumple(clave));

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setError("");
    setAviso("");
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setAviso("");
    const problemaNombre = modo === "registrar" ? validarNombre(nombre) : "";
    if (problemaNombre) return setError(problemaNombre);
    setEnviando(true);

    try {
      if (modo === "recuperar") {
        await sendPasswordResetEmail(auth, correo.trim());
        setAviso("Te enviamos un enlace para restablecer tu contraseña.");
      } else if (modo === "registrar") {
        const credencial = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
        await updateProfile(credencial.user, { displayName: nombre.trim() });
        await sendEmailVerification(credencial.user);
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
    <div className="acceso-tarjeta">
      <h1>{titulos[modo]}</h1>
      {modo === "recuperar" && <p className="acceso-tarjeta__entradilla">Te enviaremos un enlace a tu correo.</p>}

      <form className="acceso-formulario" onSubmit={enviarFormulario}>
        {modo === "registrar" && (
          <label className="acceso-campo">
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
        <label className="acceso-campo">
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
          <label className="acceso-campo">
            <span>Contraseña</span>
            <span className="acceso-contrasena">
              <input
                type={mostrarClave ? "text" : "password"}
                autoComplete={modo === "registrar" ? "new-password" : "current-password"}
                minLength={6}
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
                placeholder={modo === "registrar" ? "Crea una contraseña segura" : "Ingresa tu contraseña"}
                aria-describedby={modo === "registrar" ? "acceso-reglas" : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarClave(!mostrarClave)}
                aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={mostrarClave}
              >
                <Eye className="acceso-icono" />
              </button>
            </span>
          </label>
        )}
        {modo === "registrar" && (
          <ul id="acceso-reglas" className="acceso-reglas" aria-label="Requisitos de la contraseña">
            {reglasClave.map(({ texto, cumple }) => {
              const cumplida = cumple(clave);
              return (
                <li key={texto} className={cumplida ? "is-cumplida" : ""}>
                  {cumplida ? <Check aria-hidden /> : <Circle aria-hidden />}
                  {texto}
                  {cumplida && <span className="acceso-oculto"> (cumplido)</span>}
                </li>
              );
            })}
          </ul>
        )}

        {modo === "entrar" && (
          <div className="acceso-opciones">
            <button className="acceso-texto-boton" type="button" onClick={() => cambiarModo("recuperar")}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
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
        <button className="acceso-enviar" type="submit" disabled={enviando || (modo === "registrar" && !claveSegura)}>
          {enviando ? "Un momento…" : textosBoton[modo]}
        </button>
      </form>

      {modo !== "recuperar" && (
        <>
          <div className="acceso-separador">
            <span>o</span>
          </div>
          <button className="acceso-google" type="button" onClick={entrarConGoogle} disabled={enviando}>
            <Image src={iconoGoogle} alt="" width={16} height={16} />
            Continuar con Google
          </button>
        </>
      )}

      {modo === "recuperar" ? (
        <button className="acceso-volver" type="button" onClick={() => cambiarModo("entrar")}>
          ← Volver al inicio de sesión
        </button>
      ) : (
        <p className="acceso-interruptor">
          {modo === "registrar" ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
          <button
            className="acceso-texto-boton"
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
