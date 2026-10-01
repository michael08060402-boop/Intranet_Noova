"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Camera, CircleCheck, Crown, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { TituloPagina } from "@/components/alumno/PiezasCatalogo";
import { auth } from "@/firebase/config";
import { actualizarNombre, capitalizarNombre } from "@/firebase/perfiles";
import "./Perfil.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "long", year: "numeric" });

export default function Perfil() {
  const { usuario, perfil } = useSesion();
  // Las reglas solo guardan un campo "nombre": la primera palabra se muestra como nombre y el resto como apellidos.
  const partes = capitalizarNombre(perfil?.nombre ?? "").split(" ");
  const nombreGuardado = partes[0] ?? "";
  const apellidosGuardados = partes.slice(1).join(" ");
  // null: el campo no se ha editado y muestra lo guardado.
  const [nombre, setNombre] = useState<string | null>(null);
  const [apellidos, setApellidos] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviandoClave, setEnviandoClave] = useState(false);
  const [mensajeClave, setMensajeClave] = useState("");

  const valorNombre = nombre ?? nombreGuardado;
  const valorApellidos = apellidos ?? apellidosGuardados;
  const sinCambios = valorNombre.trim() === nombreGuardado && valorApellidos.trim() === apellidosGuardados;
  const usaContrasena = usuario?.providerData.some((proveedor) => proveedor.providerId === "password");
  const premium = perfil?.plan === "premium";
  const registro = usuario?.metadata.creationTime ? formatoFecha.format(new Date(usuario.metadata.creationTime)) : "—";

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    if (valorNombre.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      await actualizarNombre(usuario.uid, `${valorNombre.trim()} ${valorApellidos.trim()}`.trim());
      setNombre(null);
      setApellidos(null);
      setMensaje("Cambios guardados.");
    } catch {
      setError("No se pudieron guardar los cambios. Inténtalo nuevamente.");
    }
    setGuardando(false);
  }

  async function cambiarContrasena() {
    if (!usuario?.email) return;
    setEnviandoClave(true);
    try {
      await sendPasswordResetEmail(auth, usuario.email);
      setMensajeClave(`Te enviamos un enlace a ${usuario.email} para crear una nueva contraseña.`);
    } catch {
      setMensajeClave("No se pudo enviar el correo. Inténtalo nuevamente en unos minutos.");
    }
    setEnviandoClave(false);
  }

  return (
    <main className="perfil-page student-fondo">
      <TituloPagina className="perfil-page__heading" titulo="Mi perfil" descripcion="Administra tus datos, la seguridad de tu cuenta y tu plan." />

      <section className="perfil-page__tarjeta perfil-page__tarjeta--datos" aria-labelledby="perfil-datos">
        <h2 id="perfil-datos"><UserRound />Perfil</h2>
        <div className="perfil-page__foto">
          <span className="perfil-page__avatar">{nombreGuardado.charAt(0) || "?"}</span>
          <div>
            {/* La foto necesita almacenamiento de archivos (R2), que aún no está conectado. */}
            <button type="button" disabled title="Disponible próximamente"><Camera />Cambiar foto</button>
            <small>La foto de perfil estará disponible próximamente.</small>
          </div>
        </div>

        <form className="perfil-page__formulario" onSubmit={guardar}>
          <label>
            <span>Nombre</span>
            <input value={valorNombre} onChange={(evento) => { setNombre(evento.target.value); setMensaje(""); }} required minLength={2} maxLength={60} />
          </label>
          <label>
            <span>Apellidos</span>
            <input value={valorApellidos} onChange={(evento) => { setApellidos(evento.target.value); setMensaje(""); }} maxLength={60} />
          </label>
          <label className="perfil-page__completo">
            <span>Correo electrónico</span>
            <input value={perfil?.correo ?? ""} readOnly />
            <small>El correo está vinculado a tu acceso y no se puede cambiar.</small>
          </label>
          <div className="perfil-page__acciones">
            {mensaje && <p className="perfil-page__mensaje" role="status">{mensaje}</p>}
            {error && <p className="perfil-page__error" role="alert">{error}</p>}
            <button type="submit" disabled={guardando || sinCambios}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </form>
      </section>

      <section className="perfil-page__tarjeta" aria-labelledby="perfil-seguridad">
        <h2 id="perfil-seguridad"><ShieldCheck />Seguridad</h2>
        <div className="perfil-page__fila">
          <div>
            <strong>Contraseña</strong>
            <small>{usaContrasena ? "Te enviaremos un enlace a tu correo." : "Tu cuenta usa Google: se gestiona desde Google."}</small>
          </div>
          {usaContrasena && (
            <button type="button" className="perfil-page__secundario" onClick={cambiarContrasena} disabled={enviandoClave}>
              <KeyRound />{enviandoClave ? "Enviando…" : "Cambiar contraseña"}
            </button>
          )}
        </div>
        {mensajeClave && <p className="perfil-page__mensaje" role="status">{mensajeClave}</p>}
        <div className="perfil-page__fila">
          <div>
            <strong>Correo verificado</strong>
            <small>{perfil?.correo}</small>
          </div>
          <span className="perfil-page__estado"><CircleCheck />Verificado</span>
        </div>
      </section>

      <section className="perfil-page__tarjeta" aria-labelledby="perfil-plan">
        <h2 id="perfil-plan"><Crown />Mi plan</h2>
        <div className="perfil-page__fila">
          <div>
            <strong>Plan actual</strong>
            <small>Miembro desde el {registro}</small>
          </div>
          <div className="perfil-page__etiquetas">
            <span className="perfil-page__plan">{premium && <Crown />}{premium ? "Premium" : "Gratuito"}</span>
            <span className="perfil-page__estado"><CircleCheck />Activo</span>
          </div>
        </div>
        {premium ? (
          <div className="perfil-page__fila">
            <div>
              <strong>Suscripción</strong>
              {/* Administrar la suscripción depende de la pasarela de pago, que aún no está integrada. */}
              <small>Disponible al habilitar el pago en línea.</small>
            </div>
            <button type="button" className="perfil-page__secundario" disabled title="Disponible próximamente">Administrar plan</button>
          </div>
        ) : (
          <div className="perfil-page__premium">
            <div>
              <strong>Hazte Premium</strong>
              <small>Todos los cursos, contenido especializado y certificados.</small>
            </div>
            <Link href="/alumno/premium" className="student-dorado"><Crown />Hazte Premium</Link>
          </div>
        )}
      </section>
    </main>
  );
}
