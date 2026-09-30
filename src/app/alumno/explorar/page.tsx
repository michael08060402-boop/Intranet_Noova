import {
  BookOpen,
  ChevronDown,
  Droplets,
  Layers,
  LayoutGrid,
  Pickaxe,
  Search,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { EstadoVacio, SelectorOrden, SelectorVista, TituloPagina } from "@/components/alumno/PiezasCatalogo";
import "./Explorar.css";

const categorias = [
  { nombre: "Todos", Icono: LayoutGrid },
  { nombre: "ejvisual1", Icono: Wind },
  { nombre: "ejvisual2", Icono: Droplets },
  { nombre: "ejvisual3", Icono: Pickaxe },
  { nombre: "ejvisual4", Icono: ShieldCheck },
];

const tipos = ["Gratis", "Premium"];

export default function Explorar() {
  return (
    <main className="student-explore">
      <TituloPagina
        className="student-explore__heading"
        titulo={
          <>
            Explora nuestros <span>cursos</span>
          </>
        }
        descripcion="Accede a todos los cursos disponibles y continúa desarrollando tus conocimientos en la industria minera."
      />
      <div className="student-explore__layout">
        <aside className="student-explore__sidebar" aria-label="Filtros del catálogo">
          <details open>
            <summary>
              <Layers />
              Categorías
              <ChevronDown />
            </summary>
            <div className="student-explore__categories">
              {categorias.map(({ nombre, Icono }, indice) => (
                <button
                  type="button"
                  key={nombre}
                  className={indice === 0 ? "is-active" : ""}
                  aria-pressed={indice === 0}
                >
                  <Icono />
                  <span>{nombre}</span>
                  <small>0</small>
                </button>
              ))}
            </div>
          </details>
          <details open>
            <summary>
              <BookOpen />
              Tipo de curso
              <ChevronDown />
            </summary>
            <div className="student-explore__types">
              <label>
                <input type="checkbox" defaultChecked />
                Todos<small>0</small>
              </label>
              {tipos.map((tipo) => (
                <label key={tipo}>
                  <input type="checkbox" />
                  {tipo}
                  <small>0</small>
                </label>
              ))}
            </div>
          </details>
        </aside>
        <section className="student-explore__catalog" aria-label="Catálogo de cursos">
          <div className="student-explore__toolbar">
            <label className="student-explore__search">
              <Search />
              <input
                type="search"
                placeholder="Buscar cursos, temas o palabras clave..."
                aria-label="Buscar en el catálogo"
              />
            </label>
            <SelectorOrden />
            <SelectorVista />
          </div>
          <EstadoVacio
            className="student-explore__vacio"
            Icono={BookOpen}
            titulo="Aún no hay cursos registrados"
            texto="Los cursos disponibles aparecerán aquí cuando se publiquen."
          />
        </section>
      </div>
    </main>
  );
}
