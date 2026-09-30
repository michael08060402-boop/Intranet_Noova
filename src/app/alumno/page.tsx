"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ChartNoAxesColumn, Crown } from "lucide-react";
import heroAlumno from "@/assets/fondos/hero-alumno.webp";
import { useSesion } from "@/components/acceso/SesionProvider";
import { contarClasesPublicadas, escucharCursos, nombresNivel, type Curso } from "@/firebase/cursos";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./InicioAlumno.css";

export default function InicioAlumno() {
  const { usuario, perfil } = useSesion();
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "estudiante");
  // Firebase solo actualiza lastSignInTime al iniciar sesión, así que el saludo inicial se mantiene durante toda la primera sesión.
  const primeraVez = usuario?.metadata.creationTime === usuario?.metadata.lastSignInTime;
  const [destacados, setDestacados] = useState<Curso[]>([]);
  const [clases, setClases] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => escucharCursos(true, (lista) => { setDestacados(lista.slice(0, 4)); setCargando(false); }, () => setCargando(false)), []);

  useEffect(() => {
    Promise.all(destacados.map(async (curso) => [curso.id, await contarClasesPublicadas(curso.id)] as const))
      .then((conteos) => setClases(Object.fromEntries(conteos)))
      .catch(() => setClases({}));
  }, [destacados]);

  return (
    <main className="student-main">
      <section className="student-welcome">
        <h1>
          {primeraVez ? "¡Te damos la bienvenida, " : "¡Hola de nuevo, "}
          <span className="student-welcome__nombre">{nombre}</span>!
        </h1>
        <p>{primeraVez ? "Empieza tu formación explorando los cursos disponibles." : "Continúa aprendiendo donde lo dejaste."}</p>
      </section>

      <section className="student-hero" aria-labelledby="student-hero-title">
        <div className="student-hero__copy">
          <h2 id="student-hero-title">Sigue desarrollando tus habilidades en minería</h2>
          <p>Formación especializada para un sector más seguro, eficiente y sostenible.</p>
          <div className="student-hero__actions">
            <Link href="/alumno/explorar" className="student-hero__principal">Explorar cursos</Link>
            {perfil?.plan === "gratis" && <Link href="/alumno/premium" className="student-hero__secundario"><Crown />Conocer Premium</Link>}
          </div>
        </div>
        <Image className="student-hero__image" src={heroAlumno} alt="Profesionales de Noova trabajando en una mina subterránea" sizes="(max-width: 760px) 100vw, 50vw" preload />
      </section>

      <section className="student-courses" aria-labelledby="student-featured-title">
        <div className="student-section-heading">
          <h2 id="student-featured-title">Cursos destacados</h2>
          <Link href="/alumno/explorar">Ver todos<ArrowRight /></Link>
        </div>
        {destacados.length > 0 ? (
          <div className="student-destacados">
            {destacados.map((curso) => (
              <article key={curso.id} className="student-destacado">
                <div className="student-destacado__portada">
                  {curso.acceso === "premium" && <span className="student-destacado__premium">Premium</span>}
                </div>
                <div className="student-destacado__cuerpo">
                  <h3>{curso.nombre}</h3>
                  <p className="student-destacado__meta">
                    <span>{clases[curso.id] ?? "…"} {clases[curso.id] === 1 ? "clase" : "clases"}</span>
                    <span><ChartNoAxesColumn />{nombresNivel[curso.nivel]}</span>
                  </p>
                  <Link href={`/alumno/explorar?curso=${curso.id}`} className={curso.acceso === "premium" ? "is-borde" : ""}>Ver curso</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-empty">
            <span><BookOpen /></span>
            <div>
              <h3>{cargando ? "Cargando cursos…" : "Aún no hay cursos destacados"}</h3>
              <p>Los cursos disponibles aparecerán en este espacio.</p>
            </div>
          </div>
        )}
      </section>

      {/* El progreso se registrará cuando existan los videos; mientras tanto esta sección muestra el estado vacío. */}
      <section className="student-courses" aria-labelledby="student-learning-title">
        <div className="student-section-heading">
          <h2 id="student-learning-title">Continúa aprendiendo</h2>
          <Link href="/alumno/cursos">Ver mis cursos<ArrowRight /></Link>
        </div>
        <div className="student-empty student-empty--centrado">
          <div>
            <h3>Aún no tienes cursos en progreso</h3>
            <p>Cuando comiences un curso, podrás retomarlo desde aquí.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
