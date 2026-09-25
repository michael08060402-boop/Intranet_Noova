"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type Vista = "acceso" | "verificacion" | "inicio";
type Modo = "entrar" | "registrar" | "recuperar";

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
    return <StudentHome usuario={usuario} onSalir={() => signOut(auth)} />;
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-hidden="true" />

      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-eyebrow auth-eyebrow--blue">
            {modo === "registrar" ? "NUEVA CUENTA" : modo === "recuperar" ? "RECUPERAR ACCESO" : "BIENVENIDO DE NUEVO"}
          </span>
          <h2>{modo === "registrar" ? "Crea tu cuenta" : modo === "recuperar" ? "Restablece tu contraseña" : "Ingresa a tu espacio"}</h2>
          <p className="auth-card__lead">
            {modo === "registrar"
              ? "Regístrate para comenzar tu recorrido de aprendizaje."
              : modo === "recuperar"
                ? "Te enviaremos un enlace para que recuperes el acceso."
                : "Continúa tu formación en Noova Learn Mining."}
          </p>

          {modo !== "recuperar" && (
            <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
              <button type="button" role="tab" aria-selected={modo === "entrar"} className={modo === "entrar" ? "is-active" : ""} onClick={() => cambiarModo("entrar")}>Iniciar sesión</button>
              <button type="button" role="tab" aria-selected={modo === "registrar"} className={modo === "registrar" ? "is-active" : ""} onClick={() => cambiarModo("registrar")}>Crear cuenta</button>
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
              <input type="email" autoComplete="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} placeholder="nombre@empresa.com" required />
            </label>
            {modo !== "recuperar" && (
              <label className="auth-field">
                <span>Contraseña</span>
                <span className="auth-password">
                  <input type={mostrarClave ? "text" : "password"} autoComplete={modo === "registrar" ? "new-password" : "current-password"} minLength={6} value={clave} onChange={(evento) => setClave(evento.target.value)} placeholder="Mínimo 6 caracteres" required />
                  <button type="button" onClick={() => setMostrarClave(!mostrarClave)} aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}>{mostrarClave ? "Ocultar" : "Mostrar"}</button>
                </span>
              </label>
            )}

            {modo === "entrar" && <button className="auth-text-button auth-forgot" type="button" onClick={() => cambiarModo("recuperar")}>¿Olvidaste tu contraseña?</button>}
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
          <p className="auth-security"><svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1.7 14.8 4v4.3c0 3.4-2.4 6.2-5.8 8-3.4-1.8-5.8-4.6-5.8-8V4L9 1.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m6.6 8.8 1.6 1.6 3.3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Acceso seguro con Firebase Authentication</p>
        </div>
        <footer className="auth-panel__footer">© {new Date().getFullYear()} Noova Learn Mining</footer>
      </section>
    </main>
  );
}
