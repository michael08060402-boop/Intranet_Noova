"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import logoNoova from "@/assets/marca/logo-noova.webp";
import FormularioAcceso from "./FormularioAcceso";
import { useSesion } from "./SesionProvider";
import VerificacionCorreo from "./VerificacionCorreo";
import "./PaginaAcceso.css";

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
      <section className="auth-panel">
        <div className="auth-barra">
          <a href="https://www.noovasac.com/" className="auth-web"><ArrowLeft />Ir al sitio de Noova</a>
          <Image className="auth-logo" src={logoNoova} alt="Noova Consulting" sizes="90px" />
        </div>
        <FormularioAcceso />
      </section>
      <section className="auth-visual" aria-label="Noova Learn Mining">
        <h2>
          Tu próximo nivel
          <br />
          comienza aquí.
        </h2>
        <p>Desarrolla tus habilidades y construye tu futuro en la industria minera.</p>
      </section>
    </main>
  );
}
