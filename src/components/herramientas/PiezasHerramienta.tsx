import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { TituloPagina } from "@/components/alumno/PiezasCatalogo";
import "./PiezasHerramienta.css";

export function PaginaHerramienta({
  titulo,
  descripcion,
  formulario,
  resultado,
}: {
  titulo: string;
  descripcion: string;
  formulario: ReactNode;
  resultado: ReactNode;
}) {
  return (
    <main className="herramienta alumno-fondo">
      <nav className="herramienta__migas" aria-label="Ubicación">
        <Link href="/alumno/herramientas">Herramientas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{titulo}</span>
      </nav>
      <TituloPagina className="herramienta__titulo" titulo={titulo} descripcion={descripcion} />
      <div className="herramienta__cuerpo">
        <form className="herramienta__formulario" onSubmit={(evento) => evento.preventDefault()} noValidate>
          {formulario}
        </form>
        {resultado}
      </div>
    </main>
  );
}

export function Seccion({
  numero,
  titulo,
  formula,
  resumen,
  abierta = false,
  children,
}: {
  numero: number;
  titulo: string;
  formula?: string;
  resumen?: string | null;
  abierta?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="seccion" open={abierta}>
      <summary>
        <span className="seccion__numero">{numero}</span>
        <span className="seccion__titulo">
          {titulo}
          {formula && <small>{formula}</small>}
        </span>
        {resumen && <span className="seccion__resumen">{resumen}</span>}
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="seccion__campos">{children}</div>
    </details>
  );
}

export function CampoNumero({
  nombre,
  unidad,
  valor,
  alCambiar,
  entero = false,
  maximo,
}: {
  nombre: string;
  unidad?: ReactNode;
  valor: string;
  alCambiar: (texto: string) => void;
  entero?: boolean;
  maximo?: number;
}) {
  return (
    <label className="campo">
      <span className="campo__nombre">{nombre}</span>
      <span className="campo__control">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max={maximo}
          step={entero ? 1 : "any"}
          placeholder="0"
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
        />
        {unidad && <span className="campo__unidad">{unidad}</span>}
      </span>
    </label>
  );
}

export function SelectorUnidad<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiqueta = "Unidad",
  claro = false,
}: {
  opciones: readonly T[];
  valor: T;
  alCambiar: (opcion: T) => void;
  etiqueta?: string;
  claro?: boolean;
}) {
  return (
    <div className={claro ? "selector-unidad selector-unidad--claro" : "selector-unidad"} role="group" aria-label={etiqueta}>
      {opciones.map((opcion) => (
        <button key={opcion} type="button" aria-pressed={valor === opcion} onClick={() => alCambiar(opcion)}>
          {opcion}
        </button>
      ))}
    </div>
  );
}

export function PanelResultado({
  titulo,
  valor,
  unidad,
  error,
  cabecera,
  alLimpiar,
  children,
}: {
  titulo: string;
  valor?: string;
  unidad?: string;
  error?: string;
  cabecera?: ReactNode;
  alLimpiar?: () => void;
  children?: ReactNode;
}) {
  return (
    <aside className="panel-resultado" aria-label="Resultado">
      <header>
        <h2>{titulo}</h2>
        {cabecera}
      </header>
      {error ? (
        <p className="panel-resultado__error" role="alert">{error}</p>
      ) : valor === undefined ? (
        <p className="panel-resultado__vacio">Completa los datos para ver el resultado.</p>
      ) : (
        <>
          <p className="panel-resultado__valor" role="status">
            {valor}
            {unidad && <small>{unidad}</small>}
          </p>
          {children}
        </>
      )}
      {alLimpiar && (
        <button type="button" className="panel-resultado__limpiar" onClick={alLimpiar}>
          <RotateCcw aria-hidden="true" />
          Limpiar datos
        </button>
      )}
    </aside>
  );
}

export function ListaResultado({ children }: { children: ReactNode }) {
  return <dl className="lista-resultado">{children}</dl>;
}

export function FilaResultado({ nombre, valor, color }: { nombre: string; valor: string; color?: string }) {
  return (
    <div>
      <dt>
        {color && <i style={{ background: color }} aria-hidden="true" />}
        {nombre}
      </dt>
      <dd>{valor}</dd>
    </div>
  );
}
