import Link from "next/link";
import { ChartNoAxesColumn, Check, Crown, Lock } from "lucide-react";
import { nombresNivel, type Curso } from "@/firebase/cursos";
import "./TarjetaCurso.css";

// Tarjeta del catálogo que comparten Inicio y Explorar; abre el detalle del curso en Explorar.
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
  return (
    <Link href={`/alumno/explorar?curso=${curso.id}`} className="tarjeta-curso">
      <span className="tarjeta-curso__portada">
        {/* Las etiquetas son sólidas para leerse sobre portadas claras u oscuras. */}
        <span className="tarjeta-curso__etiquetas">
          {curso.acceso === "premium" && <span className="tarjeta-curso__etiqueta">{bloqueado ? <Lock /> : <Crown />}Premium</span>}
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
