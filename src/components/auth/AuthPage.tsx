"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import logoNoova from "@/public/assets/login/logo_noova.webp";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/src/firebase/config";
import EmailVerification from "@/src/components/auth/EmailVerification";
import StudentHome from "@/src/components/dashboard/StudentHome";
import "@/src/components/auth/AuthPage.css";
import AccesoPorRol from "./AccesoPorRol";
import { guardarNombreRegistro } from "@/src/firebase/perfiles";

type Vista = "acceso" | "verificacion" | "inicio";
type Modo = "entrar" | "registrar" | "recuperar";

function Icono({ nombre }: { nombre: "usuario" | "registro" | "correo" | "candado" | "ojo" | "libro" | "grafico" | "equipo" }) {
  const trazos = {
    usuario: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3Z",
    registro: "M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 21v-3a6 6 0 0 1 6-6h3M18 11v8m-4-4h8",
    correo: "M3 5h18v14H3ZM3 6l9 7 9-7",
    candado: "M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4m-4 5v2",
    ojo: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    libro: "M12 5C8 2 4 2 2 3v17c3-1 6-1 10 2 4-3 7-3 10-2V3c-2-1-6-1-10 2Zm0 0v17",
    grafico: "M3 13h4v9H3Zm7-6h4v15h-4Zm7-5h4v20h-4Z",
    equipo: "M15 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7 22v-5a5 5 0 0 1 10 0v5ZM4 4a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M4 13a4 4 0 0 0-3 4v4h3m16-8a4 4 0 0 1 3 4v4h-3",
  };

  return <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[nombre]} /></svg>;
}

function mensajeDeError(error: unknown) {
  const codigo = (error as { code?: string })?.code;

  const mensajes: Record<string, string> = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/invalid-credential": "El correo o la contraseña no son correctos.",
    "auth/invalid-email": "Escribe un correo válido.",
    "auth/network-request-failed": "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
    "auth/operation-not-allowed": "Este método de acceso aún no está habilitado en Firebase.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
    "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
    "auth/too-many-requests": "Hubo muchos intentos. Espera un momento y vuelve a probar.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  };

  return mensajes[codigo ?? ""] ?? `No se pudo completar la acción. Inténtalo de nuevo. (${codigo ?? "error desconocido"})`;
}

export default function AuthPage() {
  const [vista, setVista] = useState<Vista>("acceso");
  const [modo, setModo] = useState<Modo>("entrar");
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => onAuthStateChanged(auth, (cuenta) => {
    setUsuario(cuenta);
    setVista(cuenta ? (cuenta.emailVerified ? "inicio" : "verificacion") : "acceso");
    setCargando(false);
  }), []);

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
      auth.languageCode = "es";

      if (modo === "recuperar") {
        await sendPasswordResetEmail(auth, correo.trim());
        setAviso("Te enviamos un enlace para restablecer tu contraseña.");
      } else if (modo === "registrar") {
        const credencial = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
        await updateProfile(credencial.user, { displayName: nombre.trim() });
        await sendEmailVerification(credencial.user);
        await guardarNombreRegistro(credencial.user, nombre);
        setUsuario(credencial.user);
        setVista("verificacion");
        setAviso("Revisa tu correo para verificar tu cuenta.");
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
      auth.languageCode = "es";
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  async function reenviarVerificacion() {
    if (!usuario) return;

    setAviso("");
    setError("");

    try {
      auth.languageCode = "es";
      await sendEmailVerification(usuario);
      setAviso("Correo de verificación enviado.");
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  async function revisarVerificacion() {
    if (!usuario) return;

    setError("");
    setAviso("");

    try {
      await usuario.reload();
      if (usuario.emailVerified) {
        await usuario.getIdToken(true);
        setVista("inicio");
      } else {
        setAviso("Todavía no aparece como verificado. Abre el enlace del correo e inténtalo de nuevo.");
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  if (cargando) {
    return <main className="auth-loading" aria-label="Cargando"><span /></main>;
  }

  if (vista === "verificacion" && usuario) {
    return (
      <EmailVerification
        correo={usuario.email ?? ""}
        aviso={aviso}
        error={error}
        onReenviar={reenviarVerificacion}
        onRevisar={revisarVerificacion}
        onSalir={() => signOut(auth)}
      />
    );
  }

  if (vista === "inicio" && usuario) {
    return <AccesoPorRol rol="alumno"><StudentHome usuario={usuario} onSalir={() => signOut(auth)} /></AccesoPorRol>;
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="Mining learning">
        <div className="auth-visual__brand">Mining <em>learning</em><span>Una experiencia de Noova Consulting</span></div>
        <div className="auth-visual__message">
          <span className="auth-visual__eyebrow">CONOCIMIENTO QUE TE IMPULSA</span>
          <h2>Tu próximo nivel<br /><em>comienza aquí.</em></h2>
          <p>Desarrolla tus habilidades y construye tu futuro en la industria minera.</p>
        </div>
        <ul className="auth-benefits">
          <li><span className="auth-benefits__icon"><Icono nombre="libro" /></span><h3>Cursos especializados</h3></li>
          <li><span className="auth-benefits__icon"><Icono nombre="grafico" /></span><h3>Aprendizaje continuo</h3></li>
          <li><span className="auth-benefits__icon"><Icono nombre="equipo" /></span><h3>Desarrollo profesional</h3></li>
        </ul>
      </section>

      <section className="auth-panel">
        <Image className="auth-logo" src={logoNoova} alt="Noova Consulting" sizes="140px" unoptimized />
        <div className="auth-card">
          <h1>{modo === "registrar" ? "Crea tu cuenta" : modo === "recuperar" ? "Restablece tu contraseña" : "Bienvenido de nuevo"}</h1>
          <p className="auth-card__lead">
            {modo === "registrar"
              ? "Regístrate para comenzar tu recorrido de aprendizaje."
              : modo === "recuperar"
                ? "Te enviaremos un enlace para que recuperes el acceso."
                : "Ingresa a tu cuenta para continuar aprendiendo."}
          </p>

          {modo !== "recuperar" && (
            <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
              <button type="button" role="tab" aria-selected={modo === "entrar"} className={modo === "entrar" ? "is-active" : ""} onClick={() => cambiarModo("entrar")}><Icono nombre="usuario" />Iniciar sesión</button>
              <button type="button" role="tab" aria-selected={modo === "registrar"} className={modo === "registrar" ? "is-active" : ""} onClick={() => cambiarModo("registrar")}><Icono nombre="registro" />Crear cuenta</button>
            </div>
          )}

          <form className="auth-form" onSubmit={enviarFormulario}>
            {modo === "registrar" && (
              <label className="auth-field">
                <span>Nombre completo</span>
                <input autoComplete="name" value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. María Torres" required />
              </label>
            )}
            <label className="auth-field">
              <span>Correo electrónico</span>
              <span className="auth-input"><Icono nombre="correo" /><input type="email" autoComplete="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} placeholder="nombre@empresa.com" required /></span>
            </label>
            {modo !== "recuperar" && (
              <label className="auth-field">
                <span>Contraseña</span>
                <span className="auth-input auth-password">
                  <Icono nombre="candado" />
                  <input type={mostrarClave ? "text" : "password"} autoComplete={modo === "registrar" ? "new-password" : "current-password"} minLength={6} value={clave} onChange={(evento) => setClave(evento.target.value)} placeholder={modo === "registrar" ? "Mínimo 6 caracteres" : "Ingresa tu contraseña"} required />
                  <button type="button" onClick={() => setMostrarClave(!mostrarClave)} aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrarClave}><Icono nombre="ojo" /></button>
                </span>
              </label>
            )}

            {modo === "entrar" && <div className="auth-options"><label className="auth-remember"><input type="checkbox" />Recordarme</label><button className="auth-text-button" type="button" onClick={() => cambiarModo("recuperar")}>¿Olvidaste tu contraseña?</button></div>}
            {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
            {aviso && <p className="auth-message auth-message--success" role="status">{aviso}</p>}
            <button className="auth-submit" type="submit" disabled={enviando}>
              {enviando ? "Un momento…" : modo === "registrar" ? "Crear cuenta" : modo === "recuperar" ? "Enviar enlace" : "Iniciar sesión"}
              {!enviando && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {modo !== "recuperar" && (
            <>
              <div className="auth-divider"><span>o continúa con</span></div>
              <button className="auth-google" type="button" onClick={entrarConGoogle} disabled={enviando}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.48h3.24c1.9-1.75 2.98-4.34 2.98-7.31Z"/><path fill="#34A853" d="M10 20c2.7 0 4.97-.9 6.62-2.46l-3.24-2.48c-.9.61-2.05.97-3.38.97-2.6 0-4.8-1.76-5.6-4.12H1.06v2.56A10 10 0 0 0 10 20Z"/><path fill="#FBBC05" d="M4.4 11.91a6 6 0 0 1 0-3.82V5.53H1.06a10 10 0 0 0 0 8.94l3.34-2.56Z"/><path fill="#EA4335" d="M10 3.97c1.47 0 2.8.5 3.84 1.52l2.88-2.88C14.96.97 12.7 0 10 0a10 10 0 0 0-8.94 5.53L4.4 8.1c.8-2.36 3-4.12 5.6-4.12Z"/></svg>
                Continuar con Google
              </button>
            </>
          )}

          {modo === "recuperar" && <button className="auth-back" type="button" onClick={() => cambiarModo("entrar")}>← Volver al inicio de sesión</button>}
          {modo !== "recuperar" && <p className="auth-switch">{modo === "registrar" ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}<button className="auth-text-button" type="button" onClick={() => cambiarModo(modo === "registrar" ? "entrar" : "registrar")}>{modo === "registrar" ? "Inicia sesión" : "Crea tu cuenta"}</button></p>}
        </div>
      </section>
    </main>
  );
}
