"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Crown, X } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import { ahorroPeriodo, beneficiosPremium, buscarPeriodo, mesesRecomendados, nombrePeriodo, periodos, porMes } from "./planPremium";
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

function Marca({ incluido }: { incluido: boolean }) {
  return (
    <span className={`premium-pagina__marca ${incluido ? "is-incluido" : ""}`} role="img" aria-label={incluido ? "Incluido" : "No incluido"}>
      {incluido ? <Check /> : <X />}
    </span>
  );
}

export default function Premium() {
  const { perfil } = useSesion();
  const esPremium = perfil?.plan === "premium";
  const [meses, setMeses] = useState(mesesRecomendados);

  return (
    <main className="premium-pagina">
      <div className="premium-pagina__imagen" aria-hidden="true" />
      <div className="premium-pagina__montanas" aria-hidden="true" />
      <div className="premium-pagina__contenido">
        <header className="premium-pagina__titulo">
          <span className="premium-pagina__antetitulo">Plan Premium</span>
          <h1>Lleva tu aprendizaje<br /><span>al siguiente nivel</span></h1>
        </header>

        <div className="premium-pagina__planes">
          <section className="premium-pagina__plan" aria-labelledby="plan-gratis">
            <h2 id="plan-gratis">Plan Gratuito</h2>
            <strong className="premium-pagina__precio">S/ 0</strong>
            <ul>
              {beneficios.map((beneficio) => (
                <li key={beneficio.texto} className={beneficio.gratis ? "" : "is-excluido"}><Marca incluido={beneficio.gratis} />{beneficio.texto}</li>
              ))}
            </ul>
            <Link href="/alumno/explorar" className="premium-pagina__secundario">{esPremium ? "Volver a los cursos" : "Continuar con plan gratuito"}</Link>
          </section>

          <section className="premium-pagina__plan premium-pagina__plan--premium" aria-labelledby="plan-premium">
            <span className="premium-pagina__popular"><Crown />Recomendado</span>
            <h2 id="plan-premium">Plan Premium</h2>
            <div className="premium-pagina__periodos" role="radiogroup" aria-label="Periodo del plan">
              {periodos.map((periodo) => (
                <button key={periodo.meses} type="button" role="radio" aria-checked={meses === periodo.meses} className={meses === periodo.meses ? "is-activo" : ""} onClick={() => setMeses(periodo.meses)}>
                  {nombrePeriodo(periodo.meses)}
                </button>
              ))}
            </div>
            <strong className="premium-pagina__precio">S/ {buscarPeriodo(meses).precio}</strong>
            <p className="premium-pagina__periodo">
              {meses === 1 ? "por 1 mes de acceso" : <>S/ {porMes(meses)} al mes · <b>Ahorras {ahorroPeriodo(meses)}%</b></>}
            </p>
            <ul>
              {beneficiosPremium.map((beneficio) => <li key={beneficio}><Marca incluido />{beneficio}</li>)}
            </ul>
            {esPremium ? (
              <button type="button" className="premium-pagina__principal alumno-dorado" disabled><Crown />Ya tienes Premium</button>
            ) : (
              <Link href={`/alumno/premium/pago?periodo=${meses}`} className="premium-pagina__principal alumno-dorado"><Crown />Hazte Premium</Link>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
