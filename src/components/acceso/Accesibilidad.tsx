"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Accesibilidad() {
  const ruta = usePathname();
  useEffect(() => {
    function actualizar() {
      const principal = document.querySelector("main");
      if (principal && !principal.id) principal.id = "contenido-principal";
      if (principal) principal.tabIndex = -1;
      const titulo = principal?.querySelector("h1")?.textContent?.trim();
      const nombre = titulo ? `${titulo} | Noova Learn Mining` : "Noova Learn Mining | Capacitación Minera";
      if (document.title !== nombre) document.title = nombre;
    }
    actualizar();
    const observador = new MutationObserver(actualizar);
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observador.disconnect();
  }, [ruta]);
  return <a className="saltar-contenido" href="#contenido-principal" onClick={(evento) => {
    const principal = document.querySelector<HTMLElement>("main");
    if (principal) { evento.preventDefault(); principal.focus(); principal.scrollIntoView({ block: "start" }); }
  }}>Saltar al contenido principal</a>;
}
