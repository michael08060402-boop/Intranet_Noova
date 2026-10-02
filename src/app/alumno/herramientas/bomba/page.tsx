"use client";

import { useState } from "react";
import { CampoNumero, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Seccion } from "@/components/herramientas/PiezasHerramienta";
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
      titulo="Bombeo de agua"
      descripcion="Altura dinámica total y potencia de la bomba con la fórmula de Hazen-Williams."
      formulario={
        <>
          <Seccion numero={1} titulo="Tubería" formula="hf = 10,67 × L × Q¹˙⁸⁵² / (C¹˙⁸⁵² × D⁴˙⁸⁷)" abierta>
            <CampoNumero nombre="Caudal (Q)" unidad="L/s" {...campo("caudal")} />
            <CampoNumero nombre="Diámetro interior (D)" unidad="mm" {...campo("diametro")} />
            <CampoNumero nombre="Longitud (L)" unidad="m" {...campo("longitud")} />
            <CampoNumero nombre="Coeficiente (C)" {...campo("coeficiente")} />
          </Seccion>
          <Seccion numero={2} titulo="Bomba" formula="P = ρ × g × Q × H / η" abierta>
            <CampoNumero nombre="Altura estática" unidad="m" {...campo("alturaEstatica")} />
            <CampoNumero nombre="Eficiencia (η)" unidad="%" maximo={100} {...campo("eficiencia")} />
          </Seccion>
        </>
      }
      resultado={
        <PanelResultado
          titulo="Altura dinámica total"
          valor={resultado ? formatoNumero.format(resultado.altura) : undefined}
          unidad="m"
          error={error}
          alLimpiar={() => setDatos(inicial)}
        >
          {resultado && (
            <ListaResultado>
              <FilaResultado nombre="Velocidad en la tubería" valor={`${formatoNumero.format(resultado.velocidad)} m/s`} />
              <FilaResultado nombre="Pérdida por fricción" valor={`${formatoNumero.format(resultado.perdida)} m`} />
              <FilaResultado nombre="Potencia hidráulica" valor={`${formatoNumero.format(resultado.potenciaHidraulica)} kW`} />
              <FilaResultado nombre="Potencia en el eje" valor={`${formatoNumero.format(resultado.potenciaEje)} kW · ${formatoNumero.format(resultado.potenciaEjeHp)} HP`} />
            </ListaResultado>
          )}
        </PanelResultado>
      }
    />
  );
}
