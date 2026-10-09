"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { actualizarCurso, crearCurso, subirPortadaCurso, obtenerPortadaCurso, nombresNivel, type Acceso, type Categoria, type Curso, type Nivel } from "@/firebase/cursos";
import "./NuevoCurso.css";

export default function NuevoCurso({ curso, categorias, alCerrar }: { curso: Curso | null; categorias: Categoria[]; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const { usuario } = useSesion();
  const activas = categorias.filter((categoria) => categoria.activa);
  const [nombre, setNombre] = useState(curso?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(curso?.descripcion ?? "");
  const [categoriaId, setCategoriaId] = useState(curso?.categoriaId ?? "");
  const categoriaElegida = categoriaId || activas[0]?.id || "";
  const [nivel, setNivel] = useState<Nivel>(curso?.nivel ?? "basico");
  const [acceso, setAcceso] = useState<Acceso>(curso?.acceso ?? "gratis");
  const [publicado, setPublicado] = useState(curso?.publicado ?? false);
  const [estadoGuardado, setEstadoGuardado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cursoPendiente = useRef<string | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  useEffect(() => {
    let activo = true;
    if (imagen) {
      const url = URL.createObjectURL(imagen);
      Promise.resolve().then(() => { if (activo) setVistaPrevia(url); });
      return () => { activo = false; URL.revokeObjectURL(url); };
    }
    if (curso?.portadaKey) obtenerPortadaCurso(curso.portadaKey).then((url) => { if (activo) setVistaPrevia(url); }).catch(() => { if (activo) setVistaPrevia(""); });
    else Promise.resolve().then(() => { if (activo) setVistaPrevia(""); });
    return () => { activo = false; };
  }, [imagen, curso?.portadaKey]);
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    if (nombre.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    const valida = activas.some((categoria) => categoria.id === categoriaElegida) || categoriaElegida === curso?.categoriaId;
    if (!valida) return setError("Selecciona una categoría activa.");

    setGuardando(true);
    setEstadoGuardado("Guardando datos del curso…");
    setError("");
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim(), categoriaId: categoriaElegida, nivel, acceso, publicado };
    try {
      let cursoId = curso?.id ?? cursoPendiente.current;
      if (!cursoId) {
        const nuevo = await crearCurso({ ...datos, publicado: false }, usuario.uid);
        cursoId = nuevo.id; cursoPendiente.current = cursoId;
      }
      if (imagen) {
        setEstadoGuardado("Subiendo portada: 0%");
        await subirPortadaCurso(cursoId, imagen, (porcentaje) => setEstadoGuardado(`Subiendo portada: ${porcentaje}%`));
      }
      setEstadoGuardado("Guardando cambios…");
      await actualizarCurso(cursoId, datos);
      dialogo.current?.close();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el curso. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="nuevo-curso" aria-labelledby="nuevo-curso-titulo" onClose={alCerrar} onCancel={(evento) => { if (guardando) evento.preventDefault(); }} onClick={(evento) => {
      if (evento.target !== evento.currentTarget) return;
      const rect = evento.currentTarget.getBoundingClientRect();
      const fuera = evento.clientX < rect.left || evento.clientX > rect.right || evento.clientY < rect.top || evento.clientY > rect.bottom;
      if (fuera && !guardando) dialogo.current?.close();
    }}>
      <header className="nuevo-curso__titulo">
        <h2 id="nuevo-curso-titulo">{curso ? "Editar curso" : "Crear nuevo curso"}</h2>
        <button type="button" disabled={guardando} aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}>
          <X />
        </button>
      </header>
      <form onSubmit={guardar}>
        <fieldset disabled={guardando} className="nuevo-curso__campos">
        <label className="nuevo-curso__campo">
          <span>Imagen de portada</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(evento) => {
            const archivo = evento.target.files?.[0] ?? null;
            if (archivo && (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 5 * 1024 ** 2)) { setError("Selecciona JPG, PNG o WebP de hasta 5 MB."); evento.target.value = ""; return; }
            setImagen(archivo); setError("");
          }} />
          <small>JPG, PNG o WebP. Máximo 5 MB.</small>
          {vistaPrevia && <div className="nuevo-curso__vista-previa" style={{ backgroundImage: `url(${JSON.stringify(vistaPrevia)})` }} role="img" aria-label="Vista previa de la portada" />}
        </label>
        <label className="nuevo-curso__campo">
          <span>Nombre del curso</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. VentSim" required minLength={2} maxLength={120} autoFocus />
        </label>
        <label className="nuevo-curso__campo">
          <span>Descripción</span>
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} placeholder="Describe brevemente el contenido del curso..." maxLength={500} aria-describedby="curso-contador" />
          <small id="curso-contador" className="nuevo-curso__contador">{descripcion.length}/500</small>
        </label>
        {activas.length > 0 || curso ? (
          <label className="nuevo-curso__campo">
            <span>Categoría</span>
            <select value={categoriaElegida} onChange={(evento) => setCategoriaId(evento.target.value)} required>
              {curso && !activas.some((categoria) => categoria.id === curso.categoriaId) && (
                <option value={curso.categoriaId}>{categorias.find((categoria) => categoria.id === curso.categoriaId)?.nombre ?? "Categoría actual"} (inactiva)</option>
              )}
              {activas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
            </select>
          </label>
        ) : (
          <div className="nuevo-curso__campo">
            <span>Categoría</span>
            <p className="nuevo-curso__aviso">No hay categorías activas. Créalas con el botón <strong>Categorías</strong> de la lista de cursos.</p>
          </div>
        )}
        <div className="nuevo-curso__fila">
          <label className="nuevo-curso__campo">
            <span>Nivel</span>
            <select value={nivel} onChange={(evento) => setNivel(evento.target.value as Nivel)}>
              {Object.entries(nombresNivel).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </label>
          <label className="nuevo-curso__campo">
            <span>Acceso</span>
            <select value={acceso} onChange={(evento) => setAcceso(evento.target.value as Acceso)}>
              <option value="gratis">Gratis</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        <fieldset className="nuevo-curso__estados">
          <legend>Estado</legend>
          <label><input type="radio" name="estado" checked={!publicado} onChange={() => setPublicado(false)} /><span>Borrador</span></label>
          <label><input type="radio" name="estado" checked={publicado} onChange={() => setPublicado(true)} /><span>Publicado</span></label>
        </fieldset>
        {guardando && <p role="status">{estadoGuardado}</p>}
        {error && <p className="nuevo-curso__error" role="alert">{error}</p>}
        <footer className="nuevo-curso__pie">
          <button type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="nuevo-curso__enviar" disabled={guardando || !categoriaElegida}>{guardando ? "Guardando…" : curso ? "Guardar cambios" : "Crear curso"}</button>
        </footer>
        </fieldset>
      </form>
    </dialog>
  );
}
