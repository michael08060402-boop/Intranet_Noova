import type { ReactNode } from "react";
import { LayoutGrid, List, Search, type LucideIcon } from "lucide-react";
import "./ListadoAdmin.css";

type Props = {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  tituloPanel: string;
  Icono: LucideIcon;
  conteo: string;
  placeholderBusqueda: string;
  etiquetaBusqueda: string;
  etiquetaFiltro: string;
  opcionesFiltro: { valor: string; texto: string }[];
  columnas: string[];
  anchoPrimeraColumna: string;
  vacioTitulo: string;
  vacioTexto: ReactNode;
};

export default function ListadoAdmin({
  etiqueta,
  titulo,
  descripcion,
  accion,
  tituloPanel,
  Icono,
  conteo,
  placeholderBusqueda,
  etiquetaBusqueda,
  etiquetaFiltro,
  opcionesFiltro,
  columnas,
  anchoPrimeraColumna,
  vacioTitulo,
  vacioTexto,
}: Props) {
  return (
    <main className="listado-admin">
      <div className="listado-admin__paisaje" aria-hidden="true" />
      <header
        className={
          accion
            ? "listado-admin__encabezado listado-admin__encabezado--con-accion"
            : "listado-admin__encabezado"
        }
      >
        <div>
          <span className="listado-admin__etiqueta">{etiqueta}</span>
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>
        {accion}
      </header>

      <section className="listado-admin__panel" aria-label={tituloPanel}>
        <div className="listado-admin__panel-titulo">
          <span className="listado-admin__panel-icono">
            <Icono />
          </span>
          <h2>{tituloPanel}</h2>
          <span className="listado-admin__conteo">{conteo}</span>
        </div>
        <div className="listado-admin__herramientas">
          <label className="listado-admin__busqueda">
            <Search />
            <input type="search" placeholder={placeholderBusqueda} aria-label={etiquetaBusqueda} />
          </label>
          <select
            className="listado-admin__filtro"
            aria-label={etiquetaFiltro}
            defaultValue={opcionesFiltro[0].valor}
          >
            {opcionesFiltro.map(({ valor, texto }) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
          <div className="listado-admin__vistas" aria-label="Vista del listado">
            <button type="button" className="is-selected" aria-label="Vista de lista" aria-pressed="true">
              <List />
            </button>
            <button type="button" aria-label="Vista de cuadrícula" aria-pressed="false">
              <LayoutGrid />
            </button>
          </div>
        </div>

        <div className="listado-admin__tabla-caja">
          <table className="listado-admin__tabla">
            <thead>
              <tr>
                {columnas.map((columna, indice) => (
                  <th
                    key={columna}
                    scope="col"
                    style={indice === 0 ? { width: anchoPrimeraColumna } : undefined}
                  >
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columnas.length}>
                  <div className="listado-admin__vacio">
                    <div className="listado-admin__ilustracion">
                      <Icono />
                      <span />
                    </div>
                    <h2>{vacioTitulo}</h2>
                    <p>{vacioTexto}</p>
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
