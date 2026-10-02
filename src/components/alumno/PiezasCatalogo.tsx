import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "./PiezasCatalogo.css";

export function TituloPagina({ titulo, className }: { titulo: string; className?: string }) {
  return (
    <header className={className ? `titulo-pagina ${className}` : "titulo-pagina"}>
      <h1>{titulo}</h1>
    </header>
  );
}

export type Orden = "recientes" | "antiguos" | "nombre";

export function SelectorOrden({ orden, alCambiar }: { orden: Orden; alCambiar: (orden: Orden) => void }) {
  return (
    <select className="alumno-orden" aria-label="Ordenar cursos" value={orden} onChange={(evento) => alCambiar(evento.target.value as Orden)}>
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
  children,
}: {
  Icono?: LucideIcon;
  titulo: string;
  texto?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={className ? `alumno-vacio ${className}` : "alumno-vacio"} role="status">
      {Icono && (
        <span>
          <Icono />
        </span>
      )}
      <h2>{titulo}</h2>
      {texto && <p>{texto}</p>}
      {children}
    </section>
  );
}
