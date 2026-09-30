"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Image as IconoImagen, X } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { actualizarCurso, crearCurso, nombresNivel, type Acceso, type Categoria, type Curso, type Nivel } from "@/firebase/cursos";
import "./NuevoCurso.css";

export default function NuevoCurso({ curso, categorias, alCerrar }: { curso: Curso | null; categorias: Categoria[]; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const { usuario } = useSesion();
  const activas = categorias.filter((categoria) => categoria.activa);
  const [nombre, setNombre] = useState(curso?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(curso?.descripcion ?? "");
  const [categoriaId, setCategoriaId] = useState(curso?.categoriaId ?? "");
  // Las categorías pueden llegar después de abrir el formulario; mientras no se elija una, se usa la primera activa.
  const categoriaElegida = categoriaId || activas[0]?.id || "";
  const [nivel, setNivel] = useState<Nivel>(curso?.nivel ?? "basico");
  const [acceso, setAcceso] = useState<Acceso>(curso?.acceso ?? "gratis");
  const [publicado, setPublicado] = useState(curso?.publicado ?? false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    if (nombre.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    // Al editar se permite conservar una categoría ya desactivada; las reglas solo exigen una activa al cambiarla.
    const valida = activas.some((categoria) => categoria.id === categoriaElegida) || categoriaElegida === curso?.categoriaId;
    if (!valida) return setError("Selecciona una categoría activa.");

    setGuardando(true);
    setError("");
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim(), categoriaId: categoriaElegida, nivel, acceso, publicado };
    try {
      if (curso) await actualizarCurso(curso.id, datos);
      else await crearCurso(datos, usuario.uid);
      dialogo.current?.close();
    } catch {
      setError("No se pudo guardar el curso. Revisa tu conexión y que tu cuenta sea administradora.");
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="nuevo-curso" aria-labelledby="nuevo-curso-titulo" onClose={alCerrar} onClick={(evento) => {
      if (evento.target !== evento.currentTarget) return;
      const rect = evento.currentTarget.getBoundingClientRect();
      const fuera = evento.clientX < rect.left || evento.clientX > rect.right || evento.clientY < rect.top || evento.clientY > rect.bottom;
      if (fuera) dialogo.current?.close();
    }}>
      <header className="nuevo-curso__heading">
        <h2 id="nuevo-curso-titulo">{curso ? "Editar curso" : "Crear nuevo curso"}</h2>
        <button type="button" aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}>
          <X />
        </button>
      </header>
      <form onSubmit={guardar}>
        <label className="nuevo-curso__field">
          <span>Nombre del curso</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. VentSim" required minLength={2} maxLength={120} autoFocus />
        </label>
        <label className="nuevo-curso__field">
          <span>Descripción</span>
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} placeholder="Describe brevemente el contenido del curso..." maxLength={500} aria-describedby="curso-contador" />
          <small id="curso-contador" className="nuevo-curso__counter">{descripcion.length}/500</small>
        </label>
        {activas.length > 0 || curso ? (
          <label className="nuevo-curso__field">
            <span>Categoría</span>
            <select value={categoriaElegida} onChange={(evento) => setCategoriaId(evento.target.value)} required>
              {curso && !activas.some((categoria) => categoria.id === curso.categoriaId) && (
                <option value={curso.categoriaId}>{categorias.find((categoria) => categoria.id === curso.categoriaId)?.nombre ?? "Categoría actual"} (inactiva)</option>
              )}
              {activas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
            </select>
          </label>
        ) : (
          <div className="nuevo-curso__field">
            <span>Categoría</span>
            <p className="nuevo-curso__notice">No hay categorías activas. Créalas con el botón <strong>Categorías</strong> de la lista de cursos.</p>
          </div>
        )}
        <div className="nuevo-curso__row">
          <label className="nuevo-curso__field">
            <span>Nivel</span>
            <select value={nivel} onChange={(evento) => setNivel(evento.target.value as Nivel)}>
              {Object.entries(nombresNivel).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </label>
          <label className="nuevo-curso__field">
            <span>Acceso</span>
            <select value={acceso} onChange={(evento) => setAcceso(evento.target.value as Acceso)}>
              <option value="gratis">Gratis</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        <div className="nuevo-curso__field">
          <span>Portada del curso</span>
          <div className="nuevo-curso__upload" aria-disabled="true">
            <IconoImagen />
            <span>Disponible próximamente</span>
            <small>Podrás añadir la portada al editar el curso.</small>
          </div>
        </div>
        <fieldset className="nuevo-curso__states">
          <legend>Estado</legend>
          <label><input type="radio" name="estado" checked={!publicado} onChange={() => setPublicado(false)} /><span>Borrador<small>El curso no será visible para los alumnos.</small></span></label>
          <label><input type="radio" name="estado" checked={publicado} onChange={() => setPublicado(true)} /><span>Publicado<small>El curso estará disponible para los alumnos.</small></span></label>
        </fieldset>
        {error && <p className="nuevo-curso__error" role="alert">{error}</p>}
        <footer className="nuevo-curso__footer">
          <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="nuevo-curso__submit" disabled={guardando || !categoriaElegida}>{guardando ? "Guardando…" : curso ? "Guardar cambios" : "Crear curso"}</button>
        </footer>
      </form>
    </dialog>
  );
}
