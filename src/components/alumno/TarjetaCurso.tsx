"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartNoAxesColumn, Check, Crown, Lock } from "lucide-react";
import { obtenerPortadaCurso, nombresNivel, type Curso } from "@/firebase/cursos";
import "./TarjetaCurso.css";

export default function TarjetaCurso({
  curso,
  categoria,
  clases,
  inscrito = false,
  bloqueado = false,
}: {
  curso: Curso;
  categoria?: string;
  clases?: number;
  inscrito?: boolean;
  bloqueado?: boolean;
}) {
  const [portada, setPortada] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    let activo = true;
    const key = curso.portadaKey;
    if (key) obtenerPortadaCurso(key).then((url) => { if (activo) setPortada({ key, url }); }).catch(() => {});
    return () => { activo = false; };
  }, [curso.portadaKey]);
  const urlPortada = portada?.key === curso.portadaKey ? portada?.url : undefined;
  return (
    <Link href={`/alumno/explorar?curso=${curso.id}`} className="tarjeta-curso">
      <span className="tarjeta-curso__portada" style={urlPortada ? { backgroundImage: `url(${JSON.stringify(urlPortada)})` } : undefined}>
        <span className="tarjeta-curso__etiquetas">
          {curso.acceso === "premium" && <span className="tarjeta-curso__etiqueta tarjeta-curso__etiqueta--premium">{bloqueado ? <Lock /> : <Crown />}Premium</span>}
          {inscrito && <span className="tarjeta-curso__etiqueta tarjeta-curso__etiqueta--inscrito"><Check />Inscrito</span>}
        </span>
      </span>
      <span className="tarjeta-curso__cuerpo">
        {categoria && <small>{categoria}</small>}
        <strong>{curso.nombre}</strong>
        {curso.descripcion && <span className="tarjeta-curso__descripcion">{curso.descripcion}</span>}
        <span className="tarjeta-curso__meta">
          {clases !== undefined && <span>{clases} {clases === 1 ? "clase" : "clases"}</span>}
          <span><ChartNoAxesColumn />{nombresNivel[curso.nivel]}</span>
        </span>
      </span>
    </Link>
  );
}
