"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, Users } from "lucide-react";
import logoNoova from "@/assets/marca/logo-noova.webp";
import FormularioAcceso from "./FormularioAcceso";
import { useSesion } from "./SesionProvider";
import VerificacionCorreo from "./VerificacionCorreo";
import "./PaginaAcceso.css";

const beneficios = [
  { Icono: BookOpen, texto: "Cursos especializados" },
  { Icono: ChartNoAxesColumn, texto: "Aprendizaje continuo" },
  { Icono: Users, texto: "Desarrollo profesional" },
];

export default function PaginaAcceso() {
  const { usuario, perfil, cargando } = useSesion();
  const router = useRouter();
  const correoVerificado = !!usuario?.emailVerified;

  useEffect(() => {
    if (cargando || !correoVerificado) return;
    router.replace(perfil?.rol === "admin" ? "/admin" : "/alumno");
  }, [cargando, correoVerificado, perfil, router]);

  if (usuario && !correoVerificado) return <VerificacionCorreo usuario={usuario} />;

  if (cargando || usuario) {
    return (
      <main className="auth-loading" aria-label="Cargando">
        <span />
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="Mining learning">
        <div className="auth-visual__brand">
          Mining <em>learning</em>
          <span>Una experiencia de Noova Consulting</span>
        </div>
        <div className="auth-visual__message">
          <span className="auth-visual__eyebrow">CONOCIMIENTO QUE TE IMPULSA</span>
          <h2>
            Tu próximo nivel
            <br />
            <em>comienza aquí.</em>
          </h2>
          <p>Desarrolla tus habilidades y construye tu futuro en la industria minera.</p>
        </div>
        <ul className="auth-benefits">
          {beneficios.map(({ Icono, texto }) => (
            <li key={texto}>
              <span className="auth-benefits__icon">
                <Icono className="auth-icon" />
              </span>
              <h3>{texto}</h3>
            </li>
          ))}
        </ul>
      </section>
      <section className="auth-panel">
        <Image className="auth-logo" src={logoNoova} alt="Noova Consulting" sizes="140px" />
        <FormularioAcceso />
      </section>
    </main>
  );
}
