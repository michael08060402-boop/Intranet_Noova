"use client";

import { Suspense } from "react";
import PanelSoporte from "@/components/soporte/PanelSoporte";
import "../AdminPagina.css";

export default function Soporte() {
  return (
    <main className="admin-pagina">
      <header className="admin-pagina__cabecera">
        <h1>Soporte</h1>
      </header>
      <Suspense fallback={null}>
        <PanelSoporte admin />
      </Suspense>
    </main>
  );
}
