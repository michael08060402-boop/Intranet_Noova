"use client";

import { useState } from "react";
import { CampoNumero, Curva, paleta, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Paso } from "@/components/herramientas/PiezasHerramienta";
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
      conDatos={JSON.stringify(datos) !== JSON.stringify(inicial)}
      alEjemplo={() => setDatos({ friccion: "0.012", longitud: "800", perimetro: "14", area: "12", caudal: "3000", eficiencia: "70" })}
      alLimpiar={() => setDatos(inicial)}
      titulo="Presión del ventilador"
      formulario={
        <>
          <Paso color={paleta.azul} titulo="Galería" formula="R = k × L × P / A³">
            <CampoNumero nombre="Factor de fricción (k)" unidad="kg/m³" {...campo("friccion")} />
            <CampoNumero nombre="Longitud (L)" unidad="m" {...campo("longitud")} />
            <CampoNumero nombre="Perímetro (P)" unidad="m" {...campo("perimetro")} />
            <CampoNumero nombre="Área (A)" unidad="m²" {...campo("area")} />
          </Paso>
          <Paso color={paleta.acero} titulo="Ventilador" formula="h = R × Q²  ·  Pv = Q × h / η">
            <CampoNumero nombre="Caudal (Q)" unidad="m³/min" {...campo("caudal")} />
            <CampoNumero nombre="Eficiencia (η)" unidad="%" maximo={100} {...campo("eficiencia")} />
          </Paso>
        </>
      }
      resultado={
        <PanelResultado
          titulo="Caída de presión"
          valor={resultado ? formatoNumero.format(resultado.caida) : undefined}
          unidad="Pa"
          error={error}
        >
          {resultado && (
            <>
            <Curva
              titulo="Caída de presión según el caudal"
              puntos={Array.from({ length: 13 }, (_, i) => {
                const q = (numeros.caudal * 1.5 * i) / 12;
                return [q, calcularVentilador({ ...numeros, caudal: q })?.caida ?? 0] as [number, number];
              })}
              actual={[numeros.caudal, resultado.caida]}
              etiquetaX="m³/min"
              etiquetaY="Pa"
              formato={formatoNumero.format}
              color={paleta.azul}
            />
            <ListaResultado>
              <FilaResultado nombre="Resistencia (R)" valor={`${formatoCifras.format(resultado.resistencia)} N·s²/m⁸`} />
              <FilaResultado nombre="Potencia del aire" valor={`${formatoNumero.format(resultado.potenciaAire)} kW`} />
              <FilaResultado nombre="Potencia del ventilador" valor={`${formatoNumero.format(resultado.potenciaVentilador)} kW`} />
            </ListaResultado>
            </>
          )}
        </PanelResultado>
      }
    />
  );
}
