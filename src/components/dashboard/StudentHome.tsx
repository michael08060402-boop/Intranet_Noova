"use client";

import type { User } from "firebase/auth";
import Image from "next/image";
import "@/src/components/dashboard/StudentHome.css";

interface StudentHomeProps {
  usuario: User;
  onSalir: () => void;
}

export default function StudentHome({ usuario, onSalir }: StudentHomeProps) {
  const nombre = usuario.displayName?.split(" ")[0] ?? "estudiante";

  return (
    <main className="student-shell">
      <header className="student-header">
        <Image src="/noova-academy.svg" alt="Noova Academy" width={144} height={36} priority />
        <div className="student-account">
          <span>{usuario.email}</span>
          <button type="button" onClick={onSalir}>Cerrar sesión</button>
        </div>
      </header>
      <section className="student-welcome">
        <span className="auth-eyebrow auth-eyebrow--blue">NOOVA LEARN MINING</span>
        <h1>Hola, {nombre}.</h1>
        <p>Tu cuenta está verificada. Aquí aparecerán tus cursos asignados.</p>
        <div className="student-empty"><span aria-hidden="true">↗</span><p>Tu espacio de aprendizaje está listo para el siguiente paso.</p></div>
      </section>
    </main>
  );
}
