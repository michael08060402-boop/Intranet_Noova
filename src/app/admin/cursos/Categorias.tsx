"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import { actualizarCategoria, crearCategoria, eliminarCategoria, type Categoria, type Curso } from "@/firebase/cursos";
import "./NuevoCurso.css";
import "./Categorias.css";

export default function Categorias({ categorias, cursos, alCerrar }: { categorias: Categoria[]; cursos: Curso[]; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [confirmando, setConfirmando] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialogo.current?.showModal(); }, []);

  const usos = (id: string) => cursos.filter((curso) => curso.categoriaId === id).length;

  async function ejecutar(accion: () => Promise<unknown>) {
    setError("");
    try { await accion(); return true; }
    catch { setError("No se pudo guardar el cambio. Revisa tu conexión y que tu cuenta sea administradora."); return false; }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    setGuardando(true);
    const guardada = await ejecutar(() => editando
      ? actualizarCategoria(editando.id, { nombre: limpio, descripcion: editando.descripcion, activa: editando.activa })
      : crearCategoria({ nombre: limpio, descripcion: "", activa: true }));
    setGuardando(false);
    if (guardada) { setNombre(""); setEditando(null); }
  }

  function editar(categoria: Categoria) {
    setEditando(categoria);
    setNombre(categoria.nombre);
    setConfirmando("");
    setError("");
  }

  return (
    <dialog ref={dialogo} className="nuevo-curso categorias" aria-labelledby="categorias-titulo" onClose={alCerrar}>
      <header className="nuevo-curso__heading">
        <h2 id="categorias-titulo">Categorías</h2>
        <button type="button" aria-label="Cerrar modal" onClick={() => dialogo.current?.close()}>
          <X />
        </button>
      </header>
      <form className="categorias__formulario" onSubmit={guardar}>
        <label className="nuevo-curso__field">
          <span>{editando ? "Nuevo nombre" : "Nueva categoría"}</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder="Ej. Ventilación" required minLength={2} maxLength={80} autoFocus />
        </label>
        <button type="submit" className="nuevo-curso__submit" disabled={guardando}>{editando ? "Guardar" : "Agregar"}</button>
        {editando && <button type="button" onClick={() => { setEditando(null); setNombre(""); }}>Cancelar</button>}
      </form>
      {error && <p className="nuevo-curso__error" role="alert">{error}</p>}

      {categorias.length === 0 ? <p className="nuevo-curso__notice">Aún no hay categorías. Crea la primera para poder registrar cursos.</p> : (
        <ul className="categorias__lista">
          {categorias.map((categoria) => {
            const cursosUsados = usos(categoria.id);
            return (
              <li key={categoria.id} className={categoria.activa ? "" : "is-inactiva"}>
                <div>
                  <strong>{categoria.nombre}</strong>
                  <small>{cursosUsados} {cursosUsados === 1 ? "curso" : "cursos"}{categoria.activa ? "" : " · Inactiva"}</small>
                </div>
                {confirmando === categoria.id ? (
                  <div className="categorias__confirmar">
                    <span>¿Eliminar?</span>
                    <button type="button" onClick={() => setConfirmando("")}>No</button>
                    <button type="button" className="categorias__eliminar" onClick={async () => { await ejecutar(() => eliminarCategoria(categoria.id)); setConfirmando(""); }}>Sí, eliminar</button>
                  </div>
                ) : (
                  <div className="categorias__acciones">
                    <button type="button" onClick={() => ejecutar(() => actualizarCategoria(categoria.id, { nombre: categoria.nombre, descripcion: categoria.descripcion, activa: !categoria.activa }))}
                      aria-label={`${categoria.activa ? "Desactivar" : "Activar"} ${categoria.nombre}`} title={categoria.activa ? "Desactivar: no se podrá elegir en cursos nuevos" : "Activar"}>
                      {categoria.activa ? <Eye /> : <EyeOff />}
                    </button>
                    <button type="button" onClick={() => editar(categoria)} aria-label={`Renombrar ${categoria.nombre}`} title="Renombrar"><Pencil /></button>
                    <button type="button" onClick={() => setConfirmando(categoria.id)} disabled={cursosUsados > 0}
                      aria-label={`Eliminar ${categoria.nombre}`} title={cursosUsados > 0 ? "Solo se pueden eliminar categorías sin cursos. Desactívala para ocultarla." : "Eliminar"}>
                      <Trash2 />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <footer className="nuevo-curso__footer">
        <button type="button" onClick={() => dialogo.current?.close()}>Cerrar</button>
      </footer>
    </dialog>
  );
}
