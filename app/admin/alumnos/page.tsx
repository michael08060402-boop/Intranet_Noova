import "./AlumnosPage.css";

function Icono({ nombre }: { nombre: "buscar" | "lista" | "cuadricula" | "alumnos" }) {
  const trazos = {
    buscar: "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5",
    lista: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
    cuadricula: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z",
    alumnos: "M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM1 22a7 7 0 0 1 14 0M21 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM16 16a6 6 0 0 1 7 6",
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  );
}

export default function AlumnosPage() {
  return (
    <main className="alumnos-page">
      <div className="alumnos-landscape" aria-hidden="true" />
      <header className="alumnos-heading">
        <div>
          <span className="alumnos-eyebrow">Comunidad de aprendizaje</span>
          <h1>Alumnos</h1>
          <p>Consulta los estudiantes registrados en la plataforma.</p>
        </div>
      </header>

      <section className="alumnos-panel" aria-label="Listado de alumnos">
        <div className="alumnos-panel-heading">
          <span className="alumnos-panel-icon"><Icono nombre="alumnos" /></span>
          <h2>Directorio de alumnos</h2>
          <span className="alumnos-count">0 alumnos</span>
        </div>
        <div className="alumnos-toolbar">
          <label className="alumnos-search">
            <Icono nombre="buscar" />
            <input type="search" placeholder="Buscar por nombre o correo..." aria-label="Buscar alumno por nombre o correo" />
          </label>
          <select className="alumnos-status" aria-label="Filtrar por estado" defaultValue="todos">
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <div className="alumnos-views" aria-label="Vista de alumnos">
            <button type="button" className="is-selected" aria-label="Vista de lista" aria-pressed="true"><Icono nombre="lista" /></button>
            <button type="button" aria-label="Vista de cuadrícula" aria-pressed="false"><Icono nombre="cuadricula" /></button>
          </div>
        </div>

        <div className="alumnos-table-wrap">
          <table className="alumnos-table">
            <thead>
              <tr>{["Alumno", "Correo electrónico", "Fecha de registro", "Estado", "Acciones"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5}>
                  <div className="alumnos-empty">
                    <div className="alumnos-empty__illustration"><Icono nombre="alumnos" /><span /></div>
                    <h2>Aún no hay alumnos registrados</h2>
                    <p>Los alumnos aparecerán aquí automáticamente cuando se registren<br className="alumnos-empty__break" /> en la plataforma.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
