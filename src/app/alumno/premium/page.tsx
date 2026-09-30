"use client";

import Link from "next/link";
import { Check, Crown, X } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import "./Premium.css";

const beneficios = [
  { texto: "Acceso a cursos gratuitos", gratis: true },
  { texto: "Clases introductorias", gratis: true },
  { texto: "Contenido premium", gratis: false },
  { texto: "Todos los cursos y clases", gratis: false },
  { texto: "Nuevos cursos cada mes", gratis: false },
  { texto: "Herramientas adicionales", gratis: false },
  { texto: "Certificados de finalización", gratis: false },
];

const beneficiosPremium = ["Todos los cursos y clases", "Contenido especializado", "Nuevos cursos cada mes", "Herramientas adicionales", "Certificados de finalización"];

function Marca({ incluido }: { incluido: boolean }) {
  return (
    <span className={`premium-page__marca ${incluido ? "is-incluido" : ""}`} aria-label={incluido ? "Incluido" : "No incluido"}>
      {incluido ? <Check /> : <X />}
    </span>
  );
}

export default function Premium() {
  const { perfil } = useSesion();
  const esPremium = perfil?.plan === "premium";

  return (
    <main className="premium-page">
      <div className="premium-page__imagen" aria-hidden="true" />
      <div className="premium-page__montanas" aria-hidden="true" />
      <div className="premium-page__contenido">
        <header className="premium-page__heading">
          <span className="premium-page__eyebrow">Plan Premium</span>
          <h1>Lleva tu aprendizaje<br /><span>al siguiente nivel</span></h1>
          <p>Accede a todo el contenido de Noova Learn Mining<br className="premium-page__salto" /> y potencia tus habilidades en minería.</p>
        </header>

        <div className="premium-page__planes">
          <section className="premium-page__plan" aria-labelledby="plan-gratis">
            <h2 id="plan-gratis">Plan Gratuito</h2>
            <p className="premium-page__descripcion">Ideal para comenzar tu aprendizaje.</p>
            <strong className="premium-page__precio">S/ 0</strong>
            <p className="premium-page__periodo">Siempre será gratuito.</p>
            <ul>
              {beneficios.map((beneficio) => (
                <li key={beneficio.texto} className={beneficio.gratis ? "" : "is-excluido"}><Marca incluido={beneficio.gratis} />{beneficio.texto}</li>
              ))}
            </ul>
            <Link href="/alumno/explorar" className="premium-page__secundario">{esPremium ? "Volver a los cursos" : "Continuar con plan gratuito"}</Link>
          </section>

          <section className="premium-page__plan premium-page__plan--premium" aria-labelledby="plan-premium">
            <span className="premium-page__popular"><Crown />Más popular</span>
            <h2 id="plan-premium">Plan Premium</h2>
            <p className="premium-page__descripcion">Accede a todo el contenido de la plataforma.</p>
            <strong className="premium-page__precio">S/ 29.90</strong>
            <p className="premium-page__periodo">por mes</p>
            <ul>
              {beneficiosPremium.map((beneficio) => <li key={beneficio}><Marca incluido />{beneficio}</li>)}
            </ul>
            {/* El cobro depende de la integración con Culqi y un backend que actualice el plan. */}
            <button type="button" className="premium-page__principal" disabled={esPremium}>
              <Crown />{esPremium ? "Ya tienes Premium" : "Hazte Premium"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
