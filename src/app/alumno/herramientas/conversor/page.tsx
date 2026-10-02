"use client";

import { useState } from "react";
import { CampoNumero, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Seccion, SelectorUnidad } from "@/components/herramientas/PiezasHerramienta";
import { convertir, magnitudes } from "../conversiones";
import { formatoCifras, leerNumero } from "../numeros";

export default function Conversor() {
  const [nombreMagnitud, setNombreMagnitud] = useState(magnitudes[0].nombre);
  const [valor, setValor] = useState("");
  const [desde, setDesde] = useState(magnitudes[0].unidades[0].nombre);

  const magnitud = magnitudes.find((item) => item.nombre === nombreMagnitud) ?? magnitudes[0];
  const unidadOrigen = magnitud.unidades.find((unidad) => unidad.nombre === desde) ?? magnitud.unidades[0];
  const numero = leerNumero(valor);
  const error = Number.isNaN(numero) ? "Usa solo números mayores o iguales a 0." : "";
  const hayValor = !error && valor.trim() !== "";

  const cambiarMagnitud = (nueva: string) => {
    const siguiente = magnitudes.find((item) => item.nombre === nueva) ?? magnitudes[0];
    setNombreMagnitud(siguiente.nombre);
    setDesde(siguiente.unidades[0].nombre);
  };

  return (
    <PaginaHerramienta
      titulo="Conversor de unidades"
      descripcion="Caudal, presión, potencia y longitud, las unidades que mezclan Ventsim y los equipos."
      formulario={
        <Seccion numero={1} titulo="Valor a convertir" abierta>
          <SelectorUnidad claro etiqueta="Magnitud" opciones={magnitudes.map((item) => item.nombre)} valor={nombreMagnitud} alCambiar={cambiarMagnitud} />
          <CampoNumero nombre="Valor" valor={valor} alCambiar={setValor} />
          <label className="campo">
            <span className="campo__nombre">Unidad de origen</span>
            <span className="campo__control">
              <select value={desde} onChange={(evento) => setDesde(evento.target.value)}>
                {magnitud.unidades.map((unidad) => (
                  <option key={unidad.nombre}>{unidad.nombre}</option>
                ))}
              </select>
            </span>
          </label>
        </Seccion>
      }
      resultado={
        <PanelResultado
          titulo="Equivalencias"
          valor={hayValor ? formatoCifras.format(numero) : undefined}
          unidad={desde}
          error={error}
          alLimpiar={() => setValor("")}
        >
          {hayValor && (
            <ListaResultado>
              {magnitud.unidades.filter((unidad) => unidad !== unidadOrigen).map((unidad) => (
                <FilaResultado key={unidad.nombre} nombre={unidad.nombre} valor={formatoCifras.format(convertir(numero, unidadOrigen, unidad))} />
              ))}
            </ListaResultado>
          )}
        </PanelResultado>
      }
    />
  );
}
