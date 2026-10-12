"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ContextoCompacto } from "@/components/herramientas/PiezasHerramienta";
import Aire from "../herramientas/aire/page";
import Balance from "../herramientas/balance/page";
import Bomba from "../herramientas/bomba/page";
import Conversor from "../herramientas/conversor/page";
import Ventilador from "../herramientas/ventilador/page";
import "./PanelHerramientas.css";

const herramientas = [
  { clave: "aire", nombre: "Aire", Componente: Aire },
  { clave: "balance", nombre: "Balance", Componente: Balance },
  { clave: "ventilador", nombre: "Ventilador", Componente: Ventilador },
  { clave: "bomba", nombre: "Bomba", Componente: Bomba },
  { clave: "conversor", nombre: "Conversor", Componente: Conversor },
];

export default function PanelHerramientas({ alCerrar }: { alCerrar: () => void }) {
  const [actual, setActual] = useState(herramientas[0].clave);
  const cerrar = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogo.current?.showModal();
    cerrar.current?.focus();
    return () => {
      if (anterior?.isConnected) anterior.focus();
    };
  }, []);

  return (
    <dialog ref={dialogo} onClose={alCerrar} id="panel-herramientas-examen" className="panel-herramientas" aria-label="Herramientas de cálculo">
      <header className="panel-herramientas__cabecera">
        <strong>Herramientas</strong>
        <button ref={cerrar} type="button" aria-label="Cerrar herramientas" onClick={() => dialogo.current?.close()}><X aria-hidden="true" /></button>
      </header>
      <div className="panel-herramientas__pestanas" role="group" aria-label="Elegir herramienta">
        {herramientas.map(({ clave, nombre }) => (
          <button key={clave} type="button" aria-pressed={actual === clave} className={actual === clave ? "is-activo" : undefined} onClick={() => setActual(clave)}>{nombre}</button>
        ))}
      </div>
      <div className="panel-herramientas__cuerpo">
        <ContextoCompacto.Provider value>
          {herramientas.map(({ clave, Componente }) => (
            <div key={clave} hidden={actual !== clave}><Componente /></div>
          ))}
        </ContextoCompacto.Provider>
      </div>
    </dialog>
  );
}
