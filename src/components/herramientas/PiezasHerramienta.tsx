"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { BookOpen, FlaskConical, RotateCcw, X } from "lucide-react";
import "./PiezasHerramienta.css";

export const ContextoCompacto = createContext(false);

export const paleta = {
  azul: "#0077b6",
  agua: "#13927f",
  madera: "#a8672a",
  calor: "#e4572e",
  acero: "#5a6b7d",
  humo: "#a9b8c6",
  explosivo: "#7b4bb7",
  alerta: "#d64545",
};

export function PaginaHerramienta({
  titulo,
  formulario,
  resultado,
  conDatos,
  alEjemplo,
  alLimpiar,
}: {
  titulo: string;
  formulario: ReactNode;
  resultado: ReactNode;
  conDatos: boolean;
  alEjemplo: () => void;
  alLimpiar: () => void;
}) {
  const compacto = useContext(ContextoCompacto);
  const acciones = (
    <div className="herramienta__acciones">
      <button type="button" onClick={alEjemplo}>
        <FlaskConical aria-hidden="true" />
        Ejemplo
      </button>
      {conDatos && (
        <button type="button" onClick={alLimpiar}>
          <RotateCcw aria-hidden="true" />
          Limpiar
        </button>
      )}
    </div>
  );
  const cuerpo = (
    <div className="herramienta__cuerpo">
      <form className="herramienta__formulario" onSubmit={(evento) => evento.preventDefault()} noValidate>
        {formulario}
      </form>
      {resultado}
    </div>
  );

  if (compacto) return <div className="herramienta herramienta--compacta">{acciones}{cuerpo}</div>;

  return (
    <main className="herramienta">
      <header className="herramienta__cabecera">
        <h1>{titulo}</h1>
        <a className="herramienta__manual" href="/manual-herramientas.pdf" target="_blank" rel="noopener">
          <BookOpen aria-hidden="true" />
          Manual de uso
        </a>
      </header>
      {acciones}
      {cuerpo}
    </main>
  );
}

export function Paso({
  color,
  titulo,
  formula,
  resumen,
  opcional = false,
  ancho = false,
  alQuitar,
  children,
}: {
  color?: string;
  titulo: string;
  formula?: string;
  resumen?: string | null;
  opcional?: boolean;
  ancho?: boolean;
  alQuitar?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={ancho ? "paso paso--ancho" : "paso"} aria-label={titulo} style={color ? ({ "--color-paso": color } as CSSProperties) : undefined}>
      <header className="paso__cabecera">
        <h2>
          {color && <i aria-hidden="true" />}
          {titulo}
          {opcional && <em>opcional</em>}
        </h2>
        {(resumen || alQuitar) && (
          <div className="paso__lado">
            {resumen && <span className="paso__resumen">{resumen}</span>}
            {alQuitar && (
              <button type="button" className="paso__quitar" aria-label={`Quitar ${titulo}`} onClick={alQuitar}>
                <X aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {formula && <p className="paso__formula">{formula}</p>}
      </header>
      <div className="paso__campos">{children}</div>
    </section>
  );
}

export function Dona({ partes, centro }: { partes: { valor: number; color: string }[]; centro: string }) {
  const total = partes.reduce((suma, parte) => suma + parte.valor, 0);
  let acumulado = 0;
  const tramos = partes
    .filter((parte) => parte.valor > 0)
    .map((parte) => {
      const desde = (acumulado / total) * 100;
      acumulado += parte.valor;
      const hasta = (acumulado / total) * 100;
      return `${parte.color} ${desde}% ${hasta - 0.8}%, #fff ${hasta - 0.8}% ${hasta}%`;
    });

  return (
    <div className="dona" aria-hidden="true">
      <span style={{ background: total > 0 ? `conic-gradient(${tramos.join(", ")})` : "#e4e4e4" }} />
      <strong>{centro}</strong>
    </div>
  );
}

export function Medidor({ porcentaje, alerta, etiqueta }: { porcentaje: number; alerta: boolean; etiqueta: string }) {
  const relleno = Math.min(Math.max(porcentaje, 0), 100);
  return (
    <figure className="medidor">
      <svg viewBox="0 0 200 112" role="img" aria-label={`${etiqueta}: ${Math.round(porcentaje)} %`}>
        <defs>
          <pattern id="medidor-franjas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill={paleta.alerta} />
            <rect width="4" height="8" fill="#fff" />
          </pattern>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" pathLength="100" className="medidor__pista" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" pathLength="100" className="medidor__valor" style={{ stroke: alerta ? "url(#medidor-franjas)" : paleta.agua, strokeDasharray: `${relleno} 100` }} />
      </svg>
      <figcaption>
        <strong>{Math.round(porcentaje)} %</strong>
        {etiqueta}
      </figcaption>
    </figure>
  );
}

export function Barras({ filas, formato }: { filas: { nombre: string; valor: number; color: string }[]; formato: (valor: number) => string }) {
  const maximo = Math.max(...filas.map((fila) => fila.valor), 1);
  return (
    <ul className="barras">
      {filas.map((fila) => (
        <li key={fila.nombre}>
          <span>{fila.nombre}</span>
          <i><b style={{ width: `${(fila.valor / maximo) * 100}%`, background: fila.color }} /></i>
          <strong>{formato(fila.valor)}</strong>
        </li>
      ))}
    </ul>
  );
}

export function Curva({
  titulo,
  puntos,
  actual,
  etiquetaX,
  etiquetaY,
  formato,
  color,
}: {
  titulo: string;
  puntos: [number, number][];
  actual: [number, number];
  etiquetaX: string;
  etiquetaY: string;
  formato: (valor: number) => string;
  color: string;
}) {
  const ancho = 320;
  const alto = 190;
  const margen = { izq: 48, der: 14, arr: 14, aba: 36 };
  const maxX = Math.max(...puntos.map(([x]) => x), 1);
  const maxY = Math.max(...puntos.map(([, y]) => y), 1);
  const posX = (x: number) => margen.izq + (x / maxX) * (ancho - margen.izq - margen.der);
  const posY = (y: number) => alto - margen.aba - (y / maxY) * (alto - margen.arr - margen.aba);
  const trazo = puntos.map(([x, y], indice) => `${indice === 0 ? "M" : "L"} ${posX(x).toFixed(1)} ${posY(y).toFixed(1)}`).join(" ");
  const marcas = [0, 0.5, 1];

  return (
    <figure className="curva">
      <figcaption>{titulo}</figcaption>
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`${titulo}. Punto actual: ${formato(actual[0])} ${etiquetaX}, ${formato(actual[1])} ${etiquetaY}`}>
        {marcas.map((marca) => (
          <g key={marca}>
            <line x1={margen.izq} x2={ancho - margen.der} y1={posY(maxY * marca)} y2={posY(maxY * marca)} className="curva__rejilla" />
            <text x={margen.izq - 6} y={posY(maxY * marca) + 4} textAnchor="end">{formato(maxY * marca)}</text>
            <text x={posX(maxX * marca)} y={alto - margen.aba + 16} textAnchor={marca === 0 ? "start" : marca === 1 ? "end" : "middle"}>{formato(maxX * marca)}</text>
          </g>
        ))}
        <path d={trazo} className="curva__linea" style={{ stroke: color }} />
        <line x1={posX(actual[0])} x2={posX(actual[0])} y1={posY(actual[1])} y2={alto - margen.aba} className="curva__guia" />
        <line x1={margen.izq} x2={posX(actual[0])} y1={posY(actual[1])} y2={posY(actual[1])} className="curva__guia" />
        <circle cx={posX(actual[0])} cy={posY(actual[1])} r="5.5" className="curva__punto" style={{ stroke: color }} />
        <text x={ancho - margen.der} y={alto - 4} textAnchor="end" className="curva__unidad">{etiquetaX}</text>
        <text x={margen.izq} y={10} textAnchor="start" className="curva__unidad">{etiquetaY}</text>
      </svg>
    </figure>
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
  estado,
  cabecera,
  children,
}: {
  titulo: string;
  valor?: string;
  unidad?: string;
  error?: string;
  estado?: { tono: "ok" | "alerta"; texto: string };
  cabecera?: ReactNode;
  children?: ReactNode;
}) {
  const compacto = useContext(ContextoCompacto);
  return (
    <>
      <aside id={compacto ? undefined : "resultado"} className="placa" aria-label="Resultado">
        <header className="placa__banda">
          <div className="placa__titulo">
            <h2>{titulo}</h2>
            {cabecera}
          </div>
          <p className="placa__valor" role="status">
            {valor === undefined || error ? "—" : valor}
            {valor !== undefined && !error && unidad && <small>{unidad}</small>}
          </p>
          {estado && valor !== undefined && !error && <p className={`placa__estado placa__estado--${estado.tono}`}>{estado.texto}</p>}
        </header>
        <div className="placa__cuerpo">
          {error ? (
            <p className="placa__error" role="alert">{error}</p>
          ) : valor === undefined ? (
            <p className="placa__vacio">Completa los datos para ver el resultado.</p>
          ) : (
            children
          )}
        </div>
      </aside>
      {!compacto && !error && valor !== undefined && (
        <a className="placa__flotante" href="#resultado" aria-label={`Ir al resultado: ${valor} ${unidad ?? ""}`}>
          <strong>{valor}</strong>
          {unidad && <span>{unidad}</span>}
        </a>
      )}
    </>
  );
}

export function ListaResultado({ children }: { children: ReactNode }) {
  return <dl className="lista-resultado">{children}</dl>;
}

export function FilaResultado({ nombre, valor, color, accion }: { nombre: string; valor: string; color?: string; accion?: ReactNode }) {
  return (
    <div>
      <dt>
        {color && <i style={{ background: color }} aria-hidden="true" />}
        {nombre}
      </dt>
      <dd>
        {valor}
        {accion}
      </dd>
    </div>
  );
}
