import Link from "next/link";
import { BookOpen, ChevronRight, CirclePlay, Clock, FileText, Plus, Users, Zap } from "lucide-react";
import "./PanelAdmin.css";

const metricas = [
  { clave: "cursos", etiqueta: "Cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "videos", etiqueta: "Videos", Icono: CirclePlay, href: "/admin/cursos" },
  { clave: "alumnos", etiqueta: "Alumnos", Icono: Users, href: "/admin/alumnos" },
];

const accesos = [
  { clave: "cursos", etiqueta: "Crear curso", Icono: Plus, href: "/admin/cursos" },
  { clave: "videos", etiqueta: "Gestionar cursos", Icono: BookOpen, href: "/admin/cursos" },
  { clave: "alumnos", etiqueta: "Ver alumnos", Icono: Users, href: "/admin/alumnos" },
];

export default function PanelAdmin() {
  return (
    <main className="admin-dashboard">
      <div className="admin-dashboard__landscape" aria-hidden="true" />
      <section className="admin-welcome" aria-labelledby="bienvenida-titulo">
        <p className="admin-kicker">Panel administrativo</p>
        <h1 id="bienvenida-titulo">
          Panel de administración{" "}
          <span className="admin-wave" aria-hidden="true">
            👋
          </span>
        </h1>
        <p className="admin-lead">Administra el contenido de Noova Learn Mining.</p>
      </section>
      <section className="admin-metrics" aria-label="Indicadores">
        {metricas.map(({ clave, etiqueta, Icono, href }) => (
          <Link href={href} key={clave} className={`admin-metric admin-tone--${clave}`}>
            <span className="admin-metric__icon">
              <Icono />
            </span>
            <div>
              <p>{etiqueta}</p>
              <strong>0</strong>
            </div>
            <span className="admin-arrow">
              <ChevronRight />
            </span>
          </Link>
        ))}
      </section>
      <div className="admin-panels">
        <section className="admin-card admin-activity" aria-labelledby="actividad-titulo">
          <h2 id="actividad-titulo">
            <Clock />
            Actividad reciente
          </h2>
          <div className="admin-empty">
            <span className="admin-empty__document">
              <FileText />
            </span>
            <p>Aún no hay actividad registrada.</p>
            <span>Las acciones que realices en la plataforma se mostrarán aquí.</span>
          </div>
        </section>
        <section className="admin-card" aria-labelledby="accesos-titulo">
          <h2 id="accesos-titulo">
            <Zap />
            Accesos rápidos
          </h2>
          <div className="admin-shortcuts">
            {accesos.map(({ clave, etiqueta, Icono, href }) => (
              <Link href={href} key={clave} className={`admin-tone--${clave}`}>
                <span className="admin-shortcut__icon">
                  <Icono />
                </span>
                <span>{etiqueta}</span>
                <span className="admin-arrow">
                  <ChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
