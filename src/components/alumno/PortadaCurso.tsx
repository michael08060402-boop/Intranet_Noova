"use client";

import { useEffect, useState, type ReactNode } from "react";
import { obtenerPortadaCurso } from "@/firebase/cursos";
import "./PortadaCurso.css";

export default function PortadaCurso({ portadaKey, nombre, className, children }: {
  portadaKey?: string;
  nombre: string;
  className: string;
  children?: ReactNode;
}) {
  const [resultado, setResultado] = useState<{ key: string; url?: string } | null>(null);

  useEffect(() => {
    if (!portadaKey) return;
    let activo = true;
    const imagen = new Image();
    obtenerPortadaCurso(portadaKey).then((url) => {
      if (!activo) return;
      imagen.onload = () => { if (activo) setResultado({ key: portadaKey, url }); };
      imagen.onerror = () => { if (activo) setResultado({ key: portadaKey }); };
      imagen.src = url;
    }).catch(() => { if (activo) setResultado({ key: portadaKey }); });
    return () => { activo = false; imagen.onload = null; imagen.onerror = null; };
  }, [portadaKey]);

  const resuelta = resultado?.key === portadaKey;
  const cargando = Boolean(portadaKey && !resuelta);
  const url = resuelta ? resultado?.url : undefined;

  return (
    <span className={`${className} portada-curso${cargando ? " portada-curso--cargando" : ""}`}
      role="img"
      aria-busy={cargando}
      aria-label={cargando ? `Cargando portada de ${nombre}` : `Portada de ${nombre}`}
      style={cargando ? { backgroundImage: "none", backgroundColor: "#e7edf2" } : url ? { backgroundImage: `url(${JSON.stringify(url)})` } : undefined}>
      {cargando && <span className="portada-curso__carga" role="status">Cargando portada…</span>}
      {children}
    </span>
  );
}
