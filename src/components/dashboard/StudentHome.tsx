"use client";

import { useRef, useState } from "react";
import Icono from "./StudentIcon";
import StudentCourses from "./StudentCourses";
import StudentExplore from "./StudentExplore";
import type { User } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import "@/src/components/dashboard/StudentHome.css";
import { useSesion } from "@/src/components/auth/SesionProvider";
import { capitalizarNombre } from "@/src/firebase/perfiles";

interface StudentHomeProps {
  usuario: User;
  onSalir: () => void;
}

export default function StudentHome({ usuario, onSalir }: StudentHomeProps) {
  const [pestana, setPestana] = useState<"inicio" | "cursos" | "explorar">("inicio");
  const { perfil } = useSesion();
  const confirmarSalida = useRef<HTMLDialogElement>(null);
  const nombre = capitalizarNombre((perfil?.nombre || usuario.displayName)?.trim().split(/\s+/)[0] || usuario.email?.split("@")[0] || "estudiante");
  // Firebase solo actualiza lastSignInTime al iniciar sesión, así que el saludo inicial se mantiene durante toda la primera sesión.
  const primeraVez = usuario.metadata.creationTime === usuario.metadata.lastSignInTime;

  return (
    <div className="student-shell">
      <header className="student-header">
        <Link href="/" className="student-brand" aria-label="Noova Learn Mining, inicio">
          <Image src="/assets/login/noova_logo.webp" alt="" width={80} height={42} preload />
          <span className="student-brand__texto"><span className="student-brand__nombre">NOOVA</span><small>LEARN MINING</small></span>
        </Link>
        <nav className="student-nav" aria-label="Navegación del alumno">
          <button type="button" className={pestana === "inicio" ? "is-active" : ""} aria-current={pestana === "inicio" ? "page" : undefined} onClick={() => setPestana("inicio")}><Icono nombre="inicio" />Inicio</button>
          <button type="button" className={pestana === "cursos" ? "is-active" : ""} aria-current={pestana === "cursos" ? "page" : undefined} onClick={() => setPestana("cursos")}><Icono nombre="libro" />Mis cursos</button>
          <button type="button" className={pestana === "explorar" ? "is-active" : ""} aria-current={pestana === "explorar" ? "page" : undefined} onClick={() => setPestana("explorar")}><Icono nombre="explorar" />Explorar</button>
          <button type="button"><Icono nombre="herramientas" />Herramientas<Icono nombre="flecha" /></button>
        </nav>
        <div className="student-account">
          {perfil?.plan === "gratis" && <button type="button" className="student-premium" aria-label="Hazte Premium" title="Hazte Premium"><Icono nombre="corona" /><span>Hazte Premium</span></button>}
          <span className="student-avatar">{nombre.charAt(0).toUpperCase()}</span>
          <span className="student-account__name">{nombre}<small className="student-account__plan">{perfil?.plan === "premium" ? "Premium" : "Plan gratuito"}</small></span>
          <button type="button" onClick={() => confirmarSalida.current?.showModal()} aria-label="Cerrar sesión" title="Cerrar sesión"><Icono nombre="salir" /></button>
        </div>
      </header>
      <dialog ref={confirmarSalida} className="student-logout" aria-labelledby="student-logout-title">
        <h2 id="student-logout-title">¿Cerrar sesión?</h2>
        <p>Tendrás que volver a ingresar para continuar aprendiendo.</p>
        <div className="student-logout__actions">
          <button type="button" onClick={() => confirmarSalida.current?.close()}>Cancelar</button>
          <button type="button" className="student-logout__confirm" onClick={onSalir}>Cerrar sesión</button>
        </div>
      </dialog>
      {pestana === "explorar" ? <StudentExplore /> : pestana === "cursos" ? <StudentCourses /> : <main className="student-main" id="inicio">
        <section className="student-welcome">
          <h1>{primeraVez ? "¡Te damos la bienvenida, " : "¡Hola de nuevo, "}<span className="student-welcome__nombre">{nombre}</span>!</h1>
          <p>{primeraVez ? "Empieza tu formación explorando los cursos disponibles." : "Continúa aprendiendo donde lo dejaste."}</p>
        </section>
        <section className="student-hero" aria-labelledby="student-hero-title">
          <Image className="student-hero__image" src="/assets/user/img_hero_user.webp" alt="Profesionales de Noova trabajando en una mina subterránea" width={1900} height={1140} sizes="(max-width: 760px) 100vw, 55vw" preload />
          <div className="student-hero__copy">
            <span className="student-hero__accent" aria-hidden="true" />
            <h2 id="student-hero-title">Sigue desarrollando tus<br className="student-hero__break" /> habilidades en minería</h2>
            <p>Formación especializada para un sector más seguro, eficiente y sostenible.</p>
            <div className="student-hero__actions">
              <a href="#explorar" onClick={() => setPestana("explorar")}>Explorar cursos<Icono nombre="derecha" /></a>
            </div>
          </div>
          <ul className="student-benefits">
            <li><span><Icono nombre="video" /></span><div><h3>Clases en video</h3><p>Aprende a tu ritmo desde cualquier lugar.</p></div></li>
            <li><span><Icono nombre="documento" /></span><div><h3>Contenido especializado</h3><p>Enfocado en minería e infraestructura.</p></div></li>
            <li><span className="student-benefits__premium"><Icono nombre="corona" /></span><div><h3>Acceso Premium</h3><p>Desbloquea todos los cursos y clases.</p></div></li>
          </ul>
        </section>
        <section className="student-courses" id="mis-cursos" aria-labelledby="student-learning-title">
          <div className="student-section-heading"><h2 id="student-learning-title">Continúa aprendiendo</h2><a href="#cursos" onClick={() => setPestana("cursos")}>Ver mis cursos<Icono nombre="derecha" /></a></div>
          <div className="student-empty"><span><Icono nombre="video" /></span><div><h3>Aún no tienes cursos en progreso</h3><p>Cuando comiences un curso, podrás retomarlo desde aquí.</p></div></div>
        </section>
        <section className="student-courses" id="cursos-destacados" aria-labelledby="student-featured-title">
          <div className="student-section-heading"><h2 id="student-featured-title">Cursos destacados</h2><a href="#explorar" onClick={() => setPestana("explorar")}>Ver todos los cursos<Icono nombre="derecha" /></a></div>
          <div className="student-empty student-empty--featured"><span><Icono nombre="libro" /></span><div><h3>Aún no hay cursos destacados</h3><p>Los cursos disponibles aparecerán en este espacio.</p></div></div>
        </section>
      </main>}
    </div>
  );
}
