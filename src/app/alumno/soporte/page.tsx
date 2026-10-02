"use client";

import { Suspense } from "react";
import { TituloPagina } from "@/components/alumno/PiezasCatalogo";
import PanelSoporte from "@/components/soporte/PanelSoporte";
import "./Soporte.css";

export default function Soporte() {
  return (
    <main className="soporte-pagina alumno-fondo">
      <TituloPagina titulo="Soporte" />
      <Suspense fallback={null}>
        <PanelSoporte admin={false} />
      </Suspense>
    </main>
  );
}
