"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Camera, CircleCheck, Crown, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { TituloPagina } from "@/components/alumno/PiezasCatalogo";
import { auth } from "@/firebase/config";
import { actualizarFoto, actualizarNombre, capitalizarNombre, validarNombre } from "@/firebase/perfiles";
import "./Perfil.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "long", year: "numeric" });

function reducirFoto(archivo: File) {
  return new Promise<string>((resolver, rechazar) => {
    const direccion = URL.createObjectURL(archivo);
    const imagen = document.createElement("img");
    imagen.onload = () => {
      const lado = Math.min(imagen.width, imagen.height);
      const lienzo = document.createElement("canvas");
      lienzo.width = 192;
      lienzo.height = 192;
      lienzo.getContext("2d")?.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, 192, 192);
      URL.revokeObjectURL(direccion);
      resolver(lienzo.toDataURL("image/jpeg", 0.82));
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(direccion);
      rechazar(new Error("imagen"));
    };
    imagen.src = direccion;
  });
}

export default function Perfil() {
  const { usuario, perfil } = useSesion();
  const partes = capitalizarNombre(perfil?.nombre ?? "").split(" ");
  const nombreGuardado = partes[0] ?? "";
  const apellidosGuardados = partes.slice(1).join(" ");
  const [nombre, setNombre] = useState<string | null>(null);
  const [apellidos, setApellidos] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviandoClave, setEnviandoClave] = useState(false);
  const [mensajeClave, setMensajeClave] = useState("");
  const [errorFoto, setErrorFoto] = useState("");
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const selectorFoto = useRef<HTMLInputElement>(null);

  const valorNombre = nombre ?? nombreGuardado;
  const valorApellidos = apellidos ?? apellidosGuardados;
  const sinCambios = valorNombre.trim() === nombreGuardado && valorApellidos.trim() === apellidosGuardados;
  const usaContrasena = usuario?.providerData.some((proveedor) => proveedor.providerId === "password");
  const premium = perfil?.plan === "premium";
  const registro = usuario?.metadata.creationTime ? formatoFecha.format(new Date(usuario.metadata.creationTime)) : "—";

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    const problemaNombre = validarNombre(`${valorNombre} ${valorApellidos}`);
    if (problemaNombre) return setError(problemaNombre);
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

  async function cambiarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo || !usuario) return;
    if (!archivo.type.startsWith("image/")) return setErrorFoto("Elige un archivo de imagen.");
    setGuardandoFoto(true);
    setErrorFoto("");
    try {
      await actualizarFoto(usuario.uid, await reducirFoto(archivo));
    } catch {
      setErrorFoto("No se pudo guardar la foto. Prueba con otra imagen.");
    }
    setGuardandoFoto(false);
  }

  async function quitarFoto() {
    if (!usuario) return;
    setGuardandoFoto(true);
    setErrorFoto("");
    try {
      await actualizarFoto(usuario.uid, null);
    } catch {
      setErrorFoto("No se pudo quitar la foto. Inténtalo nuevamente.");
    }
    setGuardandoFoto(false);
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
    <main className="perfil-page alumno-fondo">
      <TituloPagina className="perfil-page__heading" titulo="Mi perfil" />

      <section className="perfil-page__tarjeta perfil-page__tarjeta--datos" aria-labelledby="perfil-datos">
        <h2 id="perfil-datos"><UserRound />Perfil</h2>
        <div className="perfil-page__foto">
          <span className="perfil-page__avatar">
            {perfil?.foto ? <Image src={perfil.foto} alt="" width={60} height={60} unoptimized /> : nombreGuardado.charAt(0) || "?"}
          </span>
          <div>
            <input ref={selectorFoto} type="file" accept="image/*" hidden onChange={cambiarFoto} />
            <div className="perfil-page__botones-foto">
              <button type="button" onClick={() => selectorFoto.current?.click()} disabled={guardandoFoto}><Camera />{guardandoFoto ? "Guardando…" : "Cambiar foto"}</button>
              {perfil?.foto && <button type="button" onClick={quitarFoto} disabled={guardandoFoto}><Trash2 />Quitar</button>}
            </div>
            {errorFoto && <p className="perfil-page__error" role="alert">{errorFoto}</p>}
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
            {!usaContrasena && <small>Tu cuenta usa Google: se gestiona desde Google.</small>}
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
        {!premium && (
          <div className="perfil-page__premium">
            <span className="perfil-page__corona"><Crown /></span>
            <div>
              <strong>Pasa a Premium</strong>
              <small>Todos los cursos, certificados y herramientas adicionales</small>
            </div>
            <Link href="/alumno/premium" className="perfil-page__premium-boton alumno-dorado">Hazte Premium</Link>
          </div>
        )}
      </section>
    </main>
  );
}
