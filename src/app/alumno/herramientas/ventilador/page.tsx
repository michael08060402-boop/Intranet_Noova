"use client";

import { useState } from "react";
import { CampoNumero, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Seccion } from "@/components/herramientas/PiezasHerramienta";
import { formatoCifras, formatoNumero, leerNumero } from "../numeros";
import { calcularVentilador } from "../ventilacion";

const inicial = { friccion: "", longitud: "", perimetro: "", area: "", caudal: "", eficiencia: "70" };

export default function PresionVentilador() {
  const [datos, setDatos] = useState(inicial);

  const campo = (nombre: keyof typeof inicial) => ({
    valor: datos[nombre],
    alCambiar: (texto: string) => setDatos({ ...datos, [nombre]: texto }),
  });

  const numeros = Object.fromEntries(Object.entries(datos).map(([nombre, texto]) => [nombre, leerNumero(texto)])) as Record<keyof typeof inicial, number>;
  const error = Object.values(numeros).some(Number.isNaN) ? "Usa solo números mayores o iguales a 0."
    : numeros.eficiencia > 100 ? "La eficiencia va de 0 a 100 %." : "";
  const resultado = error || numeros.caudal === 0 || numeros.longitud === 0 ? null : calcularVentilador(numeros);

  return (
    <PaginaHerramienta
      titulo="Presión del ventilador"
      descripcion="Caída de presión de una galería y potencia del ventilador, con la fórmula de Atkinson."
      formulario={
        <>
          <Seccion numero={1} titulo="Galería" formula="R = k × L × P / A³" abierta>
            <CampoNumero nombre="Factor de fricción (k)" unidad="kg/m³" {...campo("friccion")} />
            <CampoNumero nombre="Longitud (L)" unidad="m" {...campo("longitud")} />
            <CampoNumero nombre="Perímetro (P)" unidad="m" {...campo("perimetro")} />
            <CampoNumero nombre="Área (A)" unidad="m²" {...campo("area")} />
          </Seccion>
          <Seccion numero={2} titulo="Ventilador" formula="Pv = Q × h / η" abierta>
            <CampoNumero nombre="Caudal (Q)" unidad="m³/min" {...campo("caudal")} />
            <CampoNumero nombre="Eficiencia (η)" unidad="%" maximo={100} {...campo("eficiencia")} />
          </Seccion>
        </>
      }
      resultado={
        <PanelResultado
          titulo="Caída de presión"
          valor={resultado ? formatoNumero.format(resultado.caida) : undefined}
          unidad="Pa"
          error={error}
          alLimpiar={() => setDatos(inicial)}
        >
          {resultado && (
            <ListaResultado>
              <FilaResultado nombre="Resistencia (R)" valor={`${formatoCifras.format(resultado.resistencia)} N·s²/m⁸`} />
              <FilaResultado nombre="Potencia del aire" valor={`${formatoNumero.format(resultado.potenciaAire)} kW`} />
              <FilaResultado nombre="Potencia del ventilador" valor={`${formatoNumero.format(resultado.potenciaVentilador)} kW`} />
            </ListaResultado>
          )}
        </PanelResultado>
      }
    />
  );
}
