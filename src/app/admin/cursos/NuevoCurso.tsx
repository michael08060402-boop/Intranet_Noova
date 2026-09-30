"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Image as IconoImagen, Plus, X } from "lucide-react";
import "./NuevoCurso.css";

const tiposDePortada = ["image/png", "image/jpeg", "image/webp"];
const pesoMaximoPortada = 5 * 1024 * 1024;

export default function NuevoCurso() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const [descripcion, setDescripcion] = useState("");
  const [portada, setPortada] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function abrir() {
    formulario.current?.reset();
    setDescripcion("");
    setPortada(null);
    setPreview("");
    setError("");
    dialogo.current?.showModal();
  }

  return (
    <>
      <button className="nuevo-curso__abrir" type="button" onClick={abrir}>
        <Plus />
        Nuevo curso
      </button>
      <dialog
        ref={dialogo}
        className="nuevo-curso"
        aria-labelledby="nuevo-curso-titulo"
        onClick={(evento) => {
          if (evento.target !== evento.currentTarget) return;
          const rect = evento.currentTarget.getBoundingClientRect();
          const fuera =
            evento.clientX < rect.left ||
            evento.clientX > rect.right ||
            evento.clientY < rect.top ||
            evento.clientY > rect.bottom;
          if (fuera) dialogo.current?.close();
        }}
      >
        <header className="nuevo-curso__heading">
          <h2 id="nuevo-curso-titulo">Crear nuevo curso</h2>
          <button type="button" aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}>
            <X />
          </button>
        </header>
        <form ref={formulario} onSubmit={(evento) => evento.preventDefault()}>
          <label className="nuevo-curso__field">
            <span>Nombre del curso</span>
            <input name="nombre" placeholder="Ej. VentSim" required maxLength={120} autoFocus />
          </label>
          <label className="nuevo-curso__field">
            <span>Descripción</span>
            <textarea
              name="descripcion"
              placeholder="Describe brevemente el contenido del curso..."
              maxLength={300}
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              aria-describedby="curso-contador"
            />
            <small id="curso-contador" className="nuevo-curso__counter">
              {descripcion.length}/300
            </small>
          </label>
          <div className="nuevo-curso__field">
            <span id="curso-portada-label">Portada del curso</span>
            <label className="nuevo-curso__upload">
              <input
                type="file"
                name="portada"
                accept={tiposDePortada.join(",")}
                aria-labelledby="curso-portada-label"
                aria-describedby={error ? "curso-portada-error" : "curso-portada-ayuda"}
                onChange={(evento) => {
                  const archivo = evento.target.files?.[0];
                  if (!archivo) return;
                  if (!tiposDePortada.includes(archivo.type) || archivo.size > pesoMaximoPortada) {
                    setError("Selecciona una imagen PNG, JPG o WEBP de hasta 5 MB.");
                    evento.target.value = "";
                    setPortada(null);
                    setPreview("");
                    return;
                  }
                  setError("");
                  setPortada(archivo);
                  setPreview(URL.createObjectURL(archivo));
                }}
              />
              {portada && preview ? (
                <Image src={preview} alt="Vista previa de la portada" width={160} height={80} unoptimized />
              ) : (
                <IconoImagen />
              )}
              <span>{portada ? portada.name : "Haz clic para subir una imagen"}</span>
              <small id="curso-portada-ayuda">PNG, JPG o WEBP (máx. 5 MB)</small>
            </label>
            {error && (
              <p id="curso-portada-error" className="nuevo-curso__error" role="alert">
                {error}
              </p>
            )}
          </div>
          <fieldset className="nuevo-curso__states">
            <legend>Estado</legend>
            <label>
              <input type="radio" name="estado" value="borrador" defaultChecked />
              <span>
                Borrador<small>El curso no será visible para los alumnos.</small>
              </span>
            </label>
            <label>
              <input type="radio" name="estado" value="publicado" />
              <span>
                Publicado<small>El curso estará disponible para los alumnos.</small>
              </span>
            </label>
          </fieldset>
          <footer className="nuevo-curso__footer">
            <button type="button" onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="nuevo-curso__submit">
              Crear curso
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
