"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Users } from "lucide-react";
import { cambiarEstado, cambiarPlan, escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import "../AdminPagina.css";
import "./AlumnosPage.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

type Cambio = { alumno: Alumno; tipo: "plan" | "estado" };

function textosCambio({ alumno, tipo }: Cambio) {
  if (tipo === "plan") {
    return alumno.plan === "premium"
      ? { titulo: "¿Pasar a plan Gratis?", detalle: "perderá el acceso a los cursos y contenidos Premium.", boton: "Pasar a Gratis", peligro: true }
      : { titulo: "¿Activar Premium?", detalle: "tendrá acceso a todos los cursos y contenidos Premium.", boton: "Activar Premium", peligro: false };
  }
  return alumno.estado === "suspendido"
    ? { titulo: "¿Reactivar la cuenta?", detalle: "podrá volver a entrar y continuar sus cursos.", boton: "Reactivar", peligro: false }
    : { titulo: "¿Suspender la cuenta?", detalle: "no podrá entrar a la plataforma hasta que reactives su cuenta. Su avance y sus notas se conservan.", boton: "Suspender", peligro: true };
}

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("todos");
  const [cambio, setCambio] = useState<Cambio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const confirmar = useRef<HTMLDialogElement>(null);
  const textos = cambio ? textosCambio(cambio) : null;

  function pedirCambio(alumno: Alumno, tipo: Cambio["tipo"]) {
    setCambio({ alumno, tipo });
    setError("");
    confirmar.current?.showModal();
  }

  async function guardarCambio() {
    if (!cambio) return;
    const { alumno, tipo } = cambio;
    setGuardando(true);
    try {
      if (tipo === "plan") await cambiarPlan(alumno.id, alumno.plan === "premium" ? "gratis" : "premium");
      else await cambiarEstado(alumno.id, alumno.estado === "suspendido" ? "activo" : "suspendido");
    } catch {
      setError(`No se pudo actualizar la cuenta de ${alumno.nombre}.`);
    }
    setGuardando(false);
    confirmar.current?.close();
  }

  useEffect(() => escucharAlumnos((lista) => { setAlumnos(lista); setCargando(false); }, () => {
    setError("No se pudieron cargar los alumnos. Revisa que las reglas de Firestore estén desplegadas.");
    setCargando(false);
  }), []);

  const texto = busqueda.trim().toLowerCase();
  const visibles = alumnos.filter((alumno) => (plan === "todos" || alumno.plan === plan)
    && `${alumno.nombre} ${alumno.correo}`.toLowerCase().includes(texto));

  return (
    <main className="alumnos-pagina">
      <header className="alumnos-titulo">
        <h1>Alumnos</h1>
      </header>

      <section className="alumnos-panel" aria-label="Listado de alumnos">
        <div className="alumnos-panel-titulo">
          <span className="alumnos-panel-icono"><Users /></span>
          <h2>Directorio de alumnos</h2>
          <span className="alumnos-contador">{alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"}</span>
        </div>
        <div className="alumnos-controles">
          <label className="alumnos-buscador">
            <Search />
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre o correo..." aria-label="Buscar alumno por nombre o correo" />
          </label>
          <select className="alumnos-plan" aria-label="Filtrar por plan" value={plan} onChange={(evento) => setPlan(evento.target.value)}>
            <option value="todos">Todos los planes</option>
            <option value="gratis">Gratis</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        {error && <p className="alumnos-error" role="alert">{error}</p>}

        <div className="alumnos-tabla-caja">
          <table className="alumnos-tabla">
            <thead>
              <tr>
                {["Alumno", "Correo electrónico", "Fecha de registro", "Plan", "Estado"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}
                <th scope="col"><span className="alumnos-oculto">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((alumno) => (
                <tr key={alumno.id}>
                  <td>
                    <span className="alumnos-persona">
                      <span className="alumnos-avatar">{alumno.nombre.charAt(0).toUpperCase()}</span>
                      <strong>{alumno.nombre}</strong>
                    </span>
                  </td>
                  <td>{alumno.correo}</td>
                  <td>{alumno.creadoEn ? formatoFecha.format(alumno.creadoEn) : "—"}</td>
                  <td><span className={`alumnos-insignia alumnos-insignia--${alumno.plan}`}>{alumno.plan === "premium" ? "Premium" : "Gratis"}</span></td>
                  <td><span className={`alumnos-estado alumnos-estado--${alumno.estado}`}>{alumno.estado === "suspendido" ? "Suspendida" : "Activa"}</span></td>
                  <td className="alumnos-accion">
                    <button type="button" className="alumnos-cambiar" onClick={() => pedirCambio(alumno, "plan")}>
                      {alumno.plan === "premium" ? "Pasar a Gratis" : "Activar Premium"}
                    </button>
                    <button type="button" className="alumnos-cambiar" onClick={() => pedirCambio(alumno, "estado")}>
                      {alumno.estado === "suspendido" ? "Reactivar" : "Suspender"}
                    </button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="alumnos-vacio">
                      <span><Users /></span>
                      {cargando ? <h2>Cargando alumnos…</h2> : alumnos.length > 0 ? <h2>Ningún alumno coincide con la búsqueda</h2> : (
                        <>
                          <h2>Aún no hay alumnos registrados</h2>
                          <p>Los alumnos aparecerán aquí automáticamente cuando se registren en la plataforma.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <dialog ref={confirmar} className="admin-confirmar" aria-labelledby="cambio-confirmar-titulo" onClose={() => setCambio(null)}>
        <h2 id="cambio-confirmar-titulo">{textos?.titulo}</h2>
        <p><strong>{cambio?.alumno.nombre}</strong> {textos?.detalle}</p>
        <div className="admin-confirmar__acciones">
          <button type="button" onClick={() => confirmar.current?.close()}>Cancelar</button>
          <button type="button" className={textos?.peligro ? "admin-confirmar__peligro" : "alumnos-confirmar"} onClick={guardarCambio} disabled={guardando}>
            {guardando ? "Guardando…" : textos?.boton}
          </button>
        </div>
      </dialog>
    </main>
  );
}
