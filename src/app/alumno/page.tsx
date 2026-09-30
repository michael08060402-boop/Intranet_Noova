"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CirclePlay, Crown, FileText } from "lucide-react";
import heroAlumno from "@/assets/fondos/hero-alumno.webp";
import { useSesion } from "@/components/acceso/SesionProvider";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./InicioAlumno.css";

const beneficios = [
  {
    Icono: CirclePlay,
    titulo: "Clases en video",
    texto: "Aprende a tu ritmo desde cualquier lugar.",
  },
  {
    Icono: FileText,
    titulo: "Contenido especializado",
    texto: "Enfocado en minería e infraestructura.",
  },
  {
    Icono: Crown,
    titulo: "Acceso Premium",
    texto: "Desbloquea todos los cursos y clases.",
    premium: true,
  },
];

export default function InicioAlumno() {
  const { usuario, perfil } = useSesion();
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "estudiante");
  // Firebase solo actualiza lastSignInTime al iniciar sesión, así que el saludo inicial se mantiene durante toda la primera sesión.
  const primeraVez = usuario?.metadata.creationTime === usuario?.metadata.lastSignInTime;

  return (
    <main className="student-main">
      <section className="student-welcome">
        <h1>
          {primeraVez ? "¡Te damos la bienvenida, " : "¡Hola de nuevo, "}
          <span className="student-welcome__nombre">{nombre}</span>!
        </h1>
        <p>
          {primeraVez
            ? "Empieza tu formación explorando los cursos disponibles."
            : "Continúa aprendiendo donde lo dejaste."}
        </p>
      </section>
      <section className="student-hero" aria-labelledby="student-hero-title">
        <Image
          className="student-hero__image"
          src={heroAlumno}
          alt="Profesionales de Noova trabajando en una mina subterránea"
          sizes="(max-width: 760px) 100vw, 55vw"
          preload
        />
        <div className="student-hero__copy">
          <span className="student-hero__accent" aria-hidden="true" />
          <h2 id="student-hero-title">
            Sigue desarrollando tus
            <br className="student-hero__break" /> habilidades en minería
          </h2>
          <p>Formación especializada para un sector más seguro, eficiente y sostenible.</p>
          <div className="student-hero__actions">
            <Link href="/alumno/explorar">
              Explorar cursos
              <ArrowRight />
            </Link>
          </div>
        </div>
        <ul className="student-benefits">
          {beneficios.map(({ Icono, titulo, texto, premium }) => (
            <li key={titulo}>
              <span className={premium ? "student-benefits__premium" : undefined}>
                <Icono />
              </span>
              <div>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="student-courses" aria-labelledby="student-learning-title">
        <div className="student-section-heading">
          <h2 id="student-learning-title">Continúa aprendiendo</h2>
          <Link href="/alumno/cursos">
            Ver mis cursos
            <ArrowRight />
          </Link>
        </div>
        <div className="student-empty">
          <span>
            <CirclePlay />
          </span>
          <div>
            <h3>Aún no tienes cursos en progreso</h3>
            <p>Cuando comiences un curso, podrás retomarlo desde aquí.</p>
          </div>
        </div>
      </section>
      <section className="student-courses" aria-labelledby="student-featured-title">
        <div className="student-section-heading">
          <h2 id="student-featured-title">Cursos destacados</h2>
          <Link href="/alumno/explorar">
            Ver todos los cursos
            <ArrowRight />
          </Link>
        </div>
        <div className="student-empty student-empty--featured">
          <span>
            <BookOpen />
          </span>
          <div>
            <h3>Aún no hay cursos destacados</h3>
            <p>Los cursos disponibles aparecerán en este espacio.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
