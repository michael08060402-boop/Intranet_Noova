import Link from "next/link";
import { ArrowRight, Fan, Gauge, Scale, Waves, Wind } from "lucide-react";
import { TituloPagina } from "@/components/alumno/PiezasCatalogo";
import "./Herramientas.css";

const herramientas = [
  { href: "/alumno/herramientas/aire", titulo: "Requerimiento de aire", descripcion: "Caudal total de la operación según el Anexo 38.", categoria: "Ventilación", Icono: Wind },
  { href: "/alumno/herramientas/balance", titulo: "Balance de ventilación", descripcion: "Ingreso, salida y cobertura frente al requerido.", categoria: "Ventilación", Icono: Scale },
  { href: "/alumno/herramientas/ventilador", titulo: "Presión del ventilador", descripcion: "Caída de presión de la galería y potencia.", categoria: "Ventilación", Icono: Fan },
  { href: "/alumno/herramientas/bomba", titulo: "Bombeo de agua", descripcion: "Altura dinámica total y potencia de la bomba.", categoria: "Bombeo", Icono: Waves },
  { href: "/alumno/herramientas/conversor", titulo: "Conversor de unidades", descripcion: "Caudal, presión, potencia y longitud.", categoria: "Utilidades", Icono: Gauge },
];

export default function Herramientas() {
  return (
    <main className="herramientas alumno-fondo">
      <TituloPagina className="herramientas__heading" titulo="Herramientas" descripcion="Calculadoras para practicar lo que ves en las clases." />
      <ul className="herramientas__lista">
        {herramientas.map(({ href, titulo, descripcion, categoria, Icono }) => (
          <li key={href}>
            <Link href={href}>
              <span className="herramientas__icono"><Icono aria-hidden="true" /></span>
              <small>{categoria}</small>
              <strong>{titulo}</strong>
              <p>{descripcion}</p>
              <ArrowRight className="herramientas__flecha" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
