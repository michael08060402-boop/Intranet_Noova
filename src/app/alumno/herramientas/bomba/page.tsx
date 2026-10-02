"use client";

import { useState } from "react";
import { CampoNumero, Curva, paleta, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Paso } from "@/components/herramientas/PiezasHerramienta";
import { formatoNumero, leerNumero } from "../numeros";
import { calcularBombeo } from "../bombeo";

const inicial = { caudal: "", diametro: "", longitud: "", coeficiente: "130", alturaEstatica: "", eficiencia: "70" };

export default function Bombeo() {
  const [datos, setDatos] = useState(inicial);

  const campo = (nombre: keyof typeof inicial) => ({
    valor: datos[nombre],
    alCambiar: (texto: string) => setDatos({ ...datos, [nombre]: texto }),
  });

  const numeros = Object.fromEntries(Object.entries(datos).map(([nombre, texto]) => [nombre, leerNumero(texto)])) as Record<keyof typeof inicial, number>;
  const error = Object.values(numeros).some(Number.isNaN) ? "Usa solo números mayores o iguales a 0."
    : numeros.eficiencia > 100 ? "La eficiencia va de 0 a 100 %." : "";
  const resultado = error || numeros.caudal === 0 || numeros.diametro === 0 ? null : calcularBombeo(numeros);

  return (
    <PaginaHerramienta
      conDatos={JSON.stringify(datos) !== JSON.stringify(inicial)}
      alEjemplo={() => setDatos({ caudal: "25", diametro: "100", longitud: "600", coeficiente: "130", alturaEstatica: "80", eficiencia: "70" })}
      alLimpiar={() => setDatos(inicial)}
      titulo="Bombeo de agua"
      formulario={
        <>
          <Paso color={paleta.agua} titulo="Tubería" formula="hf = 10,67 × L × Q¹˙⁸⁵² / (C¹˙⁸⁵² × D⁴˙⁸⁷)">
            <CampoNumero nombre="Caudal (Q)" unidad="L/s" {...campo("caudal")} />
            <CampoNumero nombre="Diámetro interior (D)" unidad="mm" {...campo("diametro")} />
            <CampoNumero nombre="Longitud (L)" unidad="m" {...campo("longitud")} />
            <CampoNumero nombre="Coeficiente (C)" {...campo("coeficiente")} />
          </Paso>
          <Paso color={paleta.acero} titulo="Bomba" formula="H = Hest + hf  ·  P = ρ × g × Q × H / η">
            <CampoNumero nombre="Altura estática" unidad="m" {...campo("alturaEstatica")} />
            <CampoNumero nombre="Eficiencia (η)" unidad="%" maximo={100} {...campo("eficiencia")} />
          </Paso>
        </>
      }
      resultado={
        <PanelResultado
          titulo="Altura dinámica total"
          valor={resultado ? formatoNumero.format(resultado.altura) : undefined}
          unidad="m"
          error={error}
        >
          {resultado && (
            <>
            <Curva
              titulo="Altura que exige el sistema según el caudal"
              puntos={Array.from({ length: 13 }, (_, i) => {
                const q = (numeros.caudal * 1.5 * i) / 12;
                return [q, calcularBombeo({ ...numeros, caudal: q })?.altura ?? 0] as [number, number];
              })}
              actual={[numeros.caudal, resultado.altura]}
              etiquetaX="L/s"
              etiquetaY="m"
              formato={formatoNumero.format}
              color={paleta.agua}
            />
            <ListaResultado>
              <FilaResultado nombre="Velocidad en la tubería" valor={`${formatoNumero.format(resultado.velocidad)} m/s`} />
              <FilaResultado nombre="Pérdida por fricción" valor={`${formatoNumero.format(resultado.perdida)} m`} />
              <FilaResultado nombre="Potencia hidráulica" valor={`${formatoNumero.format(resultado.potenciaHidraulica)} kW`} />
              <FilaResultado nombre="Potencia en el eje" valor={`${formatoNumero.format(resultado.potenciaEje)} kW · ${formatoNumero.format(resultado.potenciaEjeHp)} HP`} />
            </ListaResultado>
            </>
          )}
        </PanelResultado>
      }
    />
  );
}
