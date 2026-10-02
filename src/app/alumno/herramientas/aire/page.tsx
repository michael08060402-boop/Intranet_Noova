"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CampoNumero, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Seccion, SelectorUnidad } from "@/components/herramientas/PiezasHerramienta";
import { aCfm } from "../conversiones";
import { formatoNumero, leerNumero } from "../numeros";
import { calcularAire, caudalPorPersona, factorMadera, velocidadPorTemperatura } from "../ventilacion";
import "./Aire.css";

const inicial = {
  altitud: "", trabajadores: "", produccion: "", consumoMadera: "", temperatura: "", areaLabor: "",
  nivelesCalientes: "", factorAltura: "1", velocidadVoladura: "", nivelesVoladura: "",
};
const equipoVacio = { hp: "", disponibilidad: "", utilizacion: "" };
const colores = ["#3fd0f5", "#0098db", "#7ee3b0", "#ffd100", "#ff9f7a"];
const unidades = ["m³/min", "cfm"] as const;

export default function RequerimientoAire() {
  const [datos, setDatos] = useState(inicial);
  const [equipos, setEquipos] = useState([equipoVacio]);
  const [unidad, setUnidad] = useState<(typeof unidades)[number]>("m³/min");

  const campo = (nombre: keyof typeof inicial) => ({
    valor: datos[nombre],
    alCambiar: (texto: string) => setDatos({ ...datos, [nombre]: texto }),
  });
  const campoEquipo = (indice: number, nombre: keyof typeof equipoVacio) => ({
    valor: equipos[indice][nombre],
    alCambiar: (texto: string) => setEquipos(equipos.map((equipo, i) => (i === indice ? { ...equipo, [nombre]: texto } : equipo))),
  });

  const numeros = Object.fromEntries(Object.entries(datos).map(([nombre, texto]) => [nombre, leerNumero(texto)])) as Record<keyof typeof inicial, number>;
  const equiposLeidos = equipos
    .filter((equipo) => equipo.hp.trim() !== "")
    .map((equipo) => ({ hp: leerNumero(equipo.hp), disponibilidad: leerNumero(equipo.disponibilidad), utilizacion: leerNumero(equipo.utilizacion) }));

  const hayInvalidos = [...Object.values(numeros), ...equiposLeidos.flatMap(Object.values)].some(Number.isNaN);
  const porcentajesFuera = equiposLeidos.some((equipo) => equipo.disponibilidad > 100 || equipo.utilizacion > 100);
  const fueraDeEscala = velocidadPorTemperatura(numeros.temperatura) === null;
  const error = hayInvalidos ? "Usa solo números mayores o iguales a 0."
    : porcentajesFuera ? "Dm y Fu van de 0 a 100 %."
    : fueraDeEscala ? "El anexo define la temperatura solo hasta 29 °C." : "";
  const resultado = error ? null : calcularAire({ ...numeros, equipos: equiposLeidos });

  const mostrar = (m3PorMin: number) => formatoNumero.format(unidad === "cfm" ? aCfm(m3PorMin) : m3PorMin);
  const porcentajeMadera = numeros.produccion > 0 ? (numeros.consumoMadera / numeros.produccion) * 100 : 0;
  const partes = resultado && [
    { nombre: "Personas", valor: resultado.qTr },
    { nombre: "Madera", valor: resultado.qMa },
    { nombre: "Temperatura", valor: resultado.qTe },
    { nombre: "Equipos petroleros", valor: resultado.qEq },
    { nombre: "Fugas (15 %)", valor: resultado.qFu },
  ];
  const usaExplosivos = equiposLeidos.length === 0 && resultado !== null && resultado.qEx > resultado.qTo;

  return (
    <PaginaHerramienta
      titulo="Requerimiento de aire"
      descripcion="Caudal total de la operación según el Anexo 38 del D.S. N° 024-2016-EM."
      formulario={
        <>
          <Seccion numero={1} titulo="Personas" formula="QTr = F × N" resumen={resultado && `${mostrar(resultado.qTr)} ${unidad}`} abierta>
            <CampoNumero nombre="Altitud" unidad="m s. n. m." {...campo("altitud")} />
            <CampoNumero nombre="Trabajadores (guardia mayor)" {...campo("trabajadores")} entero />
            <p className="aire__dato">F = <strong>{caudalPorPersona(numeros.altitud || 0)}</strong> m³/min por persona</p>
          </Seccion>

          <Seccion numero={2} titulo="Madera" formula="QMa = T × u" resumen={resultado && `${mostrar(resultado.qMa)} ${unidad}`}>
            <CampoNumero nombre="Producción por guardia (T)" unidad="TMH" {...campo("produccion")} />
            <CampoNumero nombre="Madera consumida" unidad="TN" {...campo("consumoMadera")} />
            <p className="aire__dato">u = <strong>{factorMadera(porcentajeMadera)}</strong> con {formatoNumero.format(porcentajeMadera)} % de madera</p>
          </Seccion>

          <Seccion numero={3} titulo="Temperatura" formula="QTe = Vm × A × N" resumen={resultado && `${mostrar(resultado.qTe)} ${unidad}`} abierta>
            <CampoNumero nombre="Temperatura seca" unidad="°C" {...campo("temperatura")} />
            <CampoNumero nombre="Área promedio de la labor (A)" unidad="m²" {...campo("areaLabor")} />
            <CampoNumero nombre="Niveles sobre 23 °C (N)" {...campo("nivelesCalientes")} entero />
            <p className="aire__dato">Vm = <strong>{velocidadPorTemperatura(numeros.temperatura || 0) ?? "—"}</strong> m/min</p>
          </Seccion>

          <Seccion numero={4} titulo="Equipos petroleros" formula="QEq = 3 × HP × Dm × Fu" resumen={resultado && `${mostrar(resultado.qEq)} ${unidad}`}>
            <CampoNumero nombre="Factor de altura" {...campo("factorAltura")} />
            {equipos.map((_, indice) => (
              <div key={indice} className="aire__equipo">
                <span className="aire__equipo-numero">{indice + 1}</span>
                <CampoNumero nombre="HP nominal" {...campoEquipo(indice, "hp")} />
                <CampoNumero nombre="Dm" unidad="%" maximo={100} {...campoEquipo(indice, "disponibilidad")} />
                <CampoNumero nombre="Fu" unidad="%" maximo={100} {...campoEquipo(indice, "utilizacion")} />
                <button type="button" aria-label={`Quitar equipo ${indice + 1}`} onClick={() => setEquipos(equipos.filter((_, i) => i !== indice))}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" className="aire__agregar" onClick={() => setEquipos([...equipos, equipoVacio])}>
              <Plus aria-hidden="true" />
              Agregar equipo
            </button>
          </Seccion>

          <Seccion numero={5} titulo="Explosivos" formula="QEx = A × V × N" resumen={resultado && equiposLeidos.length === 0 ? `${mostrar(resultado.qEx)} ${unidad}` : undefined}>
            <CampoNumero nombre="Velocidad mínima (V)" unidad="m/min" {...campo("velocidadVoladura")} />
            <CampoNumero nombre="Niveles en voladura (N)" {...campo("nivelesVoladura")} entero />
          </Seccion>
        </>
      }
      resultado={
        <PanelResultado
          titulo={usaExplosivos ? "Caudal por explosivos" : "Caudal total requerido"}
          valor={resultado ? mostrar(resultado.qFinal) : undefined}
          unidad={unidad}
          error={error}
          cabecera={<SelectorUnidad opciones={unidades} valor={unidad} alCambiar={setUnidad} />}
          alLimpiar={() => { setDatos(inicial); setEquipos([equipoVacio]); }}
        >
          {partes && resultado && (
            <>
              <div className="aire__barra" aria-hidden="true">
                {partes.map((parte, indice) => (
                  <span key={parte.nombre} style={{ flexGrow: parte.valor, background: colores[indice] }} />
                ))}
              </div>
              <ListaResultado>
                {partes.map((parte, indice) => (
                  <FilaResultado key={parte.nombre} nombre={parte.nombre} valor={mostrar(parte.valor)} color={colores[indice]} />
                ))}
                <FilaResultado nombre="Total (QTo)" valor={mostrar(resultado.qTo)} />
              </ListaResultado>
            </>
          )}
        </PanelResultado>
      }
    />
  );
}
