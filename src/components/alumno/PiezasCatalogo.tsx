import type { ReactNode } from "react";
import { LayoutGrid, List, type LucideIcon } from "lucide-react";
import "./PiezasCatalogo.css";

export function TituloPagina({
  titulo,
  descripcion,
  className,
}: {
  titulo: ReactNode;
  descripcion: string;
  className?: string;
}) {
  return (
    <header className={className ? `titulo-pagina ${className}` : "titulo-pagina"}>
      <h1>{titulo}</h1>
      <p>{descripcion}</p>
    </header>
  );
}

export function SelectorVista() {
  return (
    <div className="student-vistas" aria-label="Vista de cursos">
      <button type="button" aria-label="Vista de cuadrícula" aria-pressed="true">
        <LayoutGrid />
      </button>
      <button type="button" aria-label="Vista de lista" aria-pressed="false">
        <List />
      </button>
    </div>
  );
}

export function SelectorOrden() {
  return (
    <select className="student-orden" aria-label="Ordenar cursos" defaultValue="recientes">
      <option value="recientes">Más recientes</option>
      <option value="antiguos">Más antiguos</option>
      <option value="nombre">Nombre: A–Z</option>
    </select>
  );
}

export function EstadoVacio({
  Icono,
  titulo,
  texto,
  className,
}: {
  Icono: LucideIcon;
  titulo: string;
  texto: string;
  className?: string;
}) {
  return (
    <section className={className ? `student-vacio ${className}` : "student-vacio"} role="status">
      <span>
        <Icono />
      </span>
      <h2>{titulo}</h2>
      <p>{texto}</p>
    </section>
  );
}
