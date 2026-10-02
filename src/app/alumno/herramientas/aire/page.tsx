"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CampoNumero, Dona, FilaResultado, ListaResultado, PaginaHerramienta, PanelResultado, Paso, SelectorUnidad, paleta } from "@/components/herramientas/PiezasHerramienta";
import { aCfm } from "../conversiones";
import { formatoNumero, leerNumero } from "../numeros";
import { calcularAire, caudalPorPersona, factorMadera, velocidadPorTemperatura } from "../ventilacion";
import "./Aire.css";

const inicial = {
  altitud: "", trabajadores: "", produccion: "", consumoMadera: "", temperatura: "", areaLabor: "",
  nivelesCalientes: "", factorAltura: "1", velocidadVoladura: "", nivelesVoladura: "",
};
const ejemplo = {
  altitud: "3500", trabajadores: "45", produccion: "800", consumoMadera: "20", temperatura: "26", areaLabor: "9",
  nivelesCalientes: "2", factorAltura: "1", velocidadVoladura: "25", nivelesVoladura: "1",
};
const equipoVacio = { hp: "", disponibilidad: "", utilizacion: "" };
const ejemploEquipo = { hp: "150", disponibilidad: "80", utilizacion: "60" };
const colores = [paleta.azul, paleta.madera, paleta.calor, paleta.acero, paleta.humo];
const opcionales = [
  { clave: "madera", nombre: "Madera" },
  { clave: "explosivos", nombre: "Explosivos" },
  { clave: "equipos", nombre: "Equipos petroleros" },
] as const;
type Opcional = (typeof opcionales)[number]["clave"];
const unidades = ["m³/min", "cfm"] as const;

export default function RequerimientoAire() {
  const [datos, setDatos] = useState(inicial);
  const [equipos, setEquipos] = useState([equipoVacio]);
  const [activos, setActivos] = useState<Opcional[]>([]);
  const [unidad, setUnidad] = useState<(typeof unidades)[number]>("m³/min");

  const campo = (nombre: keyof typeof inicial) => ({
    valor: datos[nombre],
    alCambiar: (texto: string) => setDatos({ ...datos, [nombre]: texto }),
  });
  const campoEquipo = (indice: number, nombre: keyof typeof equipoVacio) => ({
    valor: equipos[indice][nombre],
    alCambiar: (texto: string) => setEquipos(equipos.map((equipo, i) => (i === indice ? { ...equipo, [nombre]: texto } : equipo))),
  });

  const quitar = (clave: Opcional) => {
    setActivos(activos.filter((activo) => activo !== clave));
    if (clave === "madera") setDatos({ ...datos, produccion: "", consumoMadera: "" });
    if (clave === "explosivos") setDatos({ ...datos, velocidadVoladura: "", nivelesVoladura: "" });
    if (clave === "equipos") {
      setDatos({ ...datos, factorAltura: inicial.factorAltura });
      setEquipos([equipoVacio]);
    }
  };
  const pendientes = opcionales.filter(({ clave }) => !activos.includes(clave));

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
  const total = partes?.reduce((suma, parte) => suma + parte.valor, 0) ?? 0;
  const usaExplosivos = equiposLeidos.length === 0 && resultado !== null && resultado.qEx > resultado.qTo;

  const subtotal = (m3PorMin: number | undefined) => (m3PorMin === undefined ? null : `${mostrar(m3PorMin)} ${unidad}`);

  return (
    <PaginaHerramienta
      conDatos={JSON.stringify(datos) !== JSON.stringify(inicial) || JSON.stringify(equipos) !== JSON.stringify([equipoVacio]) || activos.length > 0}
      alEjemplo={() => { setDatos(ejemplo); setEquipos([ejemploEquipo]); setActivos(opcionales.map(({ clave }) => clave)); }}
      alLimpiar={() => { setDatos(inicial); setEquipos([equipoVacio]); setActivos([]); }}
      titulo="Requerimiento de aire"
      formulario={
        <div className="aire__grilla">
          <Paso color={colores[0]} titulo="Personas" resumen={subtotal(resultado?.qTr)} formula={`QTr = F × N · F = ${caudalPorPersona(numeros.altitud || 0)} m³/min`}>
            <CampoNumero nombre="Altitud" unidad="m s. n. m." {...campo("altitud")} />
            <CampoNumero nombre="Trabajadores" {...campo("trabajadores")} entero />
          </Paso>
          <Paso color={colores[2]} titulo="Temperatura" resumen={subtotal(resultado?.qTe)} formula={`QTe = Vm × A × N · Vm = ${velocidadPorTemperatura(numeros.temperatura || 0) ?? "—"} m/min`}>
            <CampoNumero nombre="Temperatura seca" unidad="°C" {...campo("temperatura")} />
            <CampoNumero nombre="Área de la labor" unidad="m²" {...campo("areaLabor")} />
            <CampoNumero nombre="Niveles sobre 23 °C" {...campo("nivelesCalientes")} entero />
          </Paso>
          {activos.includes("madera") && (
            <Paso color={colores[1]} titulo="Madera" resumen={subtotal(resultado?.qMa)} formula={`QMa = T × u · u = ${factorMadera(porcentajeMadera)}`} alQuitar={() => quitar("madera")}>
              <CampoNumero nombre="Producción por guardia" unidad="TMH" {...campo("produccion")} />
              <CampoNumero nombre="Madera consumida" unidad="TN" {...campo("consumoMadera")} />
            </Paso>
          )}
          {activos.includes("explosivos") && (
            <Paso color={paleta.explosivo} titulo="Explosivos" resumen={subtotal(resultado?.qEx)} formula="QEx = A × V × N" alQuitar={() => quitar("explosivos")}>
              <CampoNumero nombre="Velocidad mínima" unidad="m/min" {...campo("velocidadVoladura")} />
              <CampoNumero nombre="Niveles en voladura" {...campo("nivelesVoladura")} entero />
            </Paso>
          )}
          {activos.includes("equipos") && (
            <Paso color={colores[3]} ancho titulo="Equipos petroleros" resumen={subtotal(resultado?.qEq)} formula="QEq = 3 × HP × Dm × Fu" alQuitar={() => quitar("equipos")}>
              <CampoNumero nombre="Factor de altura" {...campo("factorAltura")} />
              {equipos.map((_, indice) => (
                <div key={indice} className="aire__equipo">
                  <CampoNumero nombre="HP" {...campoEquipo(indice, "hp")} />
                  <CampoNumero nombre="Disponibilidad" unidad="%" maximo={100} {...campoEquipo(indice, "disponibilidad")} />
                  <CampoNumero nombre="Utilización" unidad="%" maximo={100} {...campoEquipo(indice, "utilizacion")} />
                  <button type="button" aria-label={`Quitar equipo ${indice + 1}`} onClick={() => setEquipos(equipos.filter((_, i) => i !== indice))} disabled={equipos.length === 1}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button type="button" className="aire__agregar" onClick={() => setEquipos([...equipos, equipoVacio])}>
                <Plus aria-hidden="true" />
                Agregar equipo
              </button>
            </Paso>
          )}
          {pendientes.length > 0 && (
            <section className="aire__opcionales" aria-label="Factores opcionales">
              <h2>Factores opcionales</h2>
              <div>
                {pendientes.map(({ clave, nombre }) => (
                  <button key={clave} type="button" onClick={() => setActivos([...activos, clave])}>
                    <Plus aria-hidden="true" />
                    {nombre}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      }
      resultado={
        <PanelResultado
          titulo={usaExplosivos ? "Por explosivos" : "Caudal requerido"}
          valor={resultado ? mostrar(resultado.qFinal) : undefined}
          unidad={unidad}
          error={error}
          cabecera={<SelectorUnidad opciones={unidades} valor={unidad} alCambiar={setUnidad} />}
        >
          {partes && resultado && (
            <>
              <Dona partes={partes.map((parte, indice) => ({ valor: parte.valor, color: colores[indice] }))} centro="Total" />
              <ListaResultado>
                {partes.map((parte, indice) => (
                  <FilaResultado key={parte.nombre} nombre={parte.nombre} valor={`${mostrar(parte.valor)} · ${formatoNumero.format(total > 0 ? (parte.valor / total) * 100 : 0)} %`} color={colores[indice]} />
                ))}
                <FilaResultado nombre="Total" valor={mostrar(resultado.qTo)} />
              </ListaResultado>
            </>
          )}
        </PanelResultado>
      }
    />
  );
}
