import "./CursosPage.css";
import NuevoCurso from "./NuevoCurso";

function Icono({ nombre }: { nombre: "buscar" | "lista" | "cuadricula" | "libro" }) {
  const trazos = {
    buscar: "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5",
    lista: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
    cuadricula: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z",
    libro: "M3 5c3-2 6-2 9 0 3-2 6-2 9 0v15c-3-2-6-2-9 0-3-2-6-2-9 0ZM12 5v15",
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  );
}

export default function CursosPage() {
  return (
    <main className="cursos-page">
      <div className="cursos-landscape" aria-hidden="true" />
      <header className="cursos-heading">
        <div>
          <span className="cursos-eyebrow">Gestión académica</span>
          <h1>Cursos</h1>
          <p>Administra tus cursos y sus videos.</p>
        </div>
        <NuevoCurso />
      </header>

      <section className="cursos-panel" aria-label="Listado de cursos">
        <div className="cursos-panel-heading">
          <span className="cursos-panel-icon"><Icono nombre="libro" /></span>
          <h2>Catálogo de cursos</h2>
          <span className="cursos-count">0 cursos</span>
        </div>
        <div className="cursos-toolbar">
          <label className="cursos-search">
            <Icono nombre="buscar" />
            <input type="search" placeholder="Buscar curso..." aria-label="Buscar curso" />
          </label>
          <select className="cursos-category" aria-label="Filtrar por categoría" defaultValue="todas">
            <option value="todas">Todas las categorías</option>
          </select>
          <div className="cursos-views" aria-label="Vista de cursos">
            <button type="button" className="is-selected" aria-label="Vista de lista" aria-pressed="true"><Icono nombre="lista" /></button>
            <button type="button" aria-label="Vista de cuadrícula" aria-pressed="false"><Icono nombre="cuadricula" /></button>
          </div>
        </div>

        <div className="cursos-table-wrap">
          <table className="cursos-table">
            <thead>
              <tr>{["Curso", "Categoría", "Estado", "Videos", "Alumnos", "Acciones"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <div className="cursos-empty">
                    <div className="cursos-empty__illustration"><Icono nombre="libro" /><span /></div>
                    <h2>Aún no hay cursos registrados</h2>
                    <p>Comienza creando tu primer curso para poder gestionar sus videos<br className="cursos-empty__break" /> y alumnos desde aquí.</p>
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
