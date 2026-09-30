import { BookOpen, CircleCheck, CirclePlay, Clock, Layers } from "lucide-react";
import { EstadoVacio, SelectorOrden, SelectorVista, TituloPagina } from "@/components/alumno/PiezasCatalogo";
import "./MisCursos.css";

const filtros = [
  { nombre: "Todos", Icono: Layers },
  { nombre: "En progreso", Icono: CirclePlay },
  { nombre: "Completados", Icono: CircleCheck },
  { nombre: "Sin empezar", Icono: Clock },
];

export default function MisCursos() {
  return (
    <main className="my-courses">
      <div className="my-courses__top">
        <TituloPagina
          className="my-courses__heading"
          titulo={
            <>
              Mis <span>cursos</span>
            </>
          }
          descripcion="Continúa tu formación donde la dejaste."
        />
        <div className="my-courses__toolbar">
          <div className="my-courses__filters" aria-label="Filtrar cursos por progreso">
            {filtros.map(({ nombre, Icono }, indice) => (
              <button
                key={nombre}
                type="button"
                aria-pressed={indice === 0}
                className={indice === 0 ? "is-active" : ""}
              >
                <Icono />
                {nombre} (0)
              </button>
            ))}
          </div>
          <div className="my-courses__controls">
            <SelectorVista />
            <SelectorOrden />
          </div>
        </div>
      </div>
      <EstadoVacio
        className="my-courses__vacio"
        Icono={BookOpen}
        titulo="Aún no tienes cursos"
        texto="Cuando tengas cursos disponibles, aparecerán aquí."
      />
    </main>
  );
}
