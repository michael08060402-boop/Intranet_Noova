"use client";

import { useState } from "react";
import { Barras, CampoNumero, FilaResultado, ListaResultado, Medidor, PaginaHerramienta, PanelResultado, Paso, SelectorUnidad, paleta } from "@/components/herramientas/PiezasHerramienta";
import { aCfm } from "../conversiones";
import { formatoNumero, leerNumero } from "../numeros";
import { calcularBalance } from "../ventilacion";

const inicial = { requerido: "", ingreso: "", salida: "" };
const unidades = ["m³/min", "cfm"] as const;

export default function BalanceVentilacion() {
  const [datos, setDatos] = useState(inicial);
  const [unidad, setUnidad] = useState<(typeof unidades)[number]>("m³/min");

  const campo = (nombre: keyof typeof inicial) => ({
    valor: datos[nombre],
    alCambiar: (texto: string) => setDatos({ ...datos, [nombre]: texto }),
  });

  const requerido = leerNumero(datos.requerido);
  const ingreso = leerNumero(datos.ingreso);
  const salida = leerNumero(datos.salida);
  const error = [requerido, ingreso, salida].some(Number.isNaN) ? "Usa solo números mayores o iguales a 0." : "";
  const completo = !error && requerido > 0 && ingreso > 0;
  const resultado = completo ? calcularBalance(requerido, ingreso, salida) : null;

  const mostrar = (m3PorMin: number) => formatoNumero.format(unidad === "cfm" ? aCfm(m3PorMin) : m3PorMin);

  return (
    <PaginaHerramienta
      conDatos={JSON.stringify(datos) !== JSON.stringify(inicial)}
      alEjemplo={() => setDatos({ requerido: "1200", ingreso: "1000", salida: "1050" })}
      alLimpiar={() => setDatos(inicial)}
      titulo="Balance de ventilación"
      formulario={
        <Paso titulo="Caudales medidos" formula="Cobertura = Qi / Qr">
          <CampoNumero nombre="Requerido (Qr)" unidad="m³/min" {...campo("requerido")} />
          <CampoNumero nombre="Ingreso (Qi)" unidad="m³/min" {...campo("ingreso")} />
          <CampoNumero nombre="Salida (Qs)" unidad="m³/min" {...campo("salida")} />
        </Paso>
      }
      resultado={
        <PanelResultado
          titulo={resultado ? (resultado.superavit >= 0 ? "Superávit de aire" : "Déficit de aire") : "Balance"}
          valor={resultado ? mostrar(Math.abs(resultado.superavit)) : undefined}
          estado={resultado ? { tono: resultado.superavit >= 0 ? "ok" : "alerta", texto: resultado.superavit >= 0 ? "Ingresa más aire del requerido" : "Falta aire para cubrir lo requerido" } : undefined}
          unidad={unidad}
          error={error}
          cabecera={<SelectorUnidad opciones={unidades} valor={unidad} alCambiar={setUnidad} />}
        >
          {resultado && (
            <>
            <Medidor porcentaje={resultado.cobertura * 100} alerta={resultado.cobertura < 1} etiqueta="de cobertura" />
            <Barras formato={mostrar} filas={[{ nombre: "Requerido", valor: requerido, color: paleta.acero }, { nombre: "Ingreso", valor: ingreso, color: paleta.azul }, { nombre: "Salida", valor: salida, color: paleta.agua }]} />
            <ListaResultado>
              <FilaResultado nombre="Cobertura (Qi / Qr)" valor={`${formatoNumero.format(resultado.cobertura * 100)} %`} />
              <FilaResultado nombre="Balance (Qs − Qi)" valor={mostrar(resultado.balance)} />
              <FilaResultado nombre="Diferencia ingreso-salida" valor={`${formatoNumero.format(resultado.diferencia)} %`} />
            </ListaResultado>
            </>
          )}
        </PanelResultado>
      }
    />
  );
}
