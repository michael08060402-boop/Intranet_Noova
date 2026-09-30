"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { escucharAlumnos, type Alumno } from "@/firebase/perfiles";
import "./AlumnosPage.css";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("todos");

  useEffect(() => escucharAlumnos((lista) => { setAlumnos(lista); setCargando(false); }, () => {
    setError("No se pudieron cargar los alumnos. Revisa que las reglas de Firestore estén desplegadas.");
    setCargando(false);
  }), []);

  const texto = busqueda.trim().toLowerCase();
  const visibles = alumnos.filter((alumno) => (plan === "todos" || alumno.plan === plan)
    && `${alumno.nombre} ${alumno.correo}`.toLowerCase().includes(texto));

  return (
    <main className="alumnos-page">
      <header className="alumnos-heading">
        <span className="alumnos-eyebrow">Comunidad de aprendizaje</span>
        <h1>Alumnos</h1>
        <p>Consulta los estudiantes registrados en la plataforma.</p>
      </header>

      <section className="alumnos-panel" aria-label="Listado de alumnos">
        <div className="alumnos-panel-heading">
          <span className="alumnos-panel-icon"><Users /></span>
          <h2>Directorio de alumnos</h2>
          <span className="alumnos-count">{alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"}</span>
        </div>
        <div className="alumnos-toolbar">
          <label className="alumnos-search">
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

        <div className="alumnos-table-wrap">
          <table className="alumnos-table">
            <thead>
              <tr>{["Alumno", "Correo electrónico", "Fecha de registro", "Plan"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr>
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
                  <td><span className={`alumnos-badge alumnos-badge--${alumno.plan}`}>{alumno.plan === "premium" ? "Premium" : "Gratis"}</span></td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="alumnos-empty">
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
    </main>
  );
}
