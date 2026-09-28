import Link from "next/link";
import "./AdminPage.css";

const metricas = [
  { clave: "cursos", etiqueta: "Cursos", icono: "libro" as const, href: "/admin/cursos" },
  { clave: "videos", etiqueta: "Videos", icono: "video" as const, href: "/admin/cursos" },
  { clave: "alumnos", etiqueta: "Alumnos", icono: "alumnos" as const, href: "/admin/alumnos" },
];

function Icono({ nombre }: { nombre: "libro" | "video" | "alumnos" | "mas" | "flecha" | "reloj" | "rayo" | "documento" }) {
  const trazos = {
    libro: "M4 5c2.2-1 5.2-1 8 1 2.8-2 5.8-2 8-1v14c-2.2-1-5.2-1-8 1-2.8-2-5.8-2-8-1Z M12 6v14",
    video: "M9 7.5 17 12 9 16.5Z",
    alumnos: "M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 21v-3a5 5 0 0 1 14 0v3M18 4a3 3 0 0 1 0 6M20 21v-4a4 4 0 0 0-2-3",
    mas: "M12 5v14M5 12h14",
    flecha: "m9 6 6 6-6 6",
    reloj: "M12 7v5l4 2",
    rayo: "m14 2-10 12h7l-1 8L20 9h-7Z",
    documento: "M7 3h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM9 9h6M9 13h6M9 17h3",
  };
  return (
    <svg viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {nombre === "video" || nombre === "reloj" ? <circle cx="12" cy="12" r="9" /> : null}
      <path d={trazos[nombre]} />
    </svg>
  );
}

export default function AdminPage() {
  return (
    <main className="admin-main admin-dashboard">
      <div className="admin-dashboard__landscape" aria-hidden="true" />
      <section className="admin-welcome" aria-labelledby="bienvenida-titulo">
        <p className="admin-kicker">Panel administrativo</p>
        <h1 id="bienvenida-titulo">Panel de administración <span className="admin-wave" aria-hidden="true">👋</span></h1>
        <p className="admin-lead">Administra el contenido de Noova Learn Mining.</p>
      </section>
      <section className="admin-metrics" aria-label="Indicadores">
        {metricas.map((metrica) => (
          <Link href={metrica.href} key={metrica.clave} className={`admin-metric admin-tone--${metrica.clave}`}>
            <span className="admin-metric__icon"><Icono nombre={metrica.icono} /></span>
            <div><p>{metrica.etiqueta}</p><strong>0</strong></div>
            <span className="admin-arrow"><Icono nombre="flecha" /></span>
          </Link>
        ))}
      </section>
      <div className="admin-panels">
        <section className="admin-card admin-activity" aria-labelledby="actividad-titulo">
          <h2 id="actividad-titulo"><Icono nombre="reloj" />Actividad reciente</h2>
          <div className="admin-empty">
            <span className="admin-empty__document"><Icono nombre="documento" /></span>
            <p>Aún no hay actividad registrada.</p>
            <span>Las acciones que realices en la plataforma se mostrarán aquí.</span>
          </div>
        </section>
        <section className="admin-card" aria-labelledby="accesos-titulo">
          <h2 id="accesos-titulo"><Icono nombre="rayo" />Accesos rápidos</h2>
          <div className="admin-shortcuts">
            <Link href="/admin/cursos" className="admin-tone--cursos">
              <span className="admin-shortcut__icon"><Icono nombre="mas" /></span>
              <span>Crear curso</span>
              <span className="admin-arrow"><Icono nombre="flecha" /></span>
            </Link>
            <Link href="/admin/cursos" className="admin-tone--videos">
              <span className="admin-shortcut__icon"><Icono nombre="libro" /></span>
              <span>Gestionar cursos</span>
              <span className="admin-arrow"><Icono nombre="flecha" /></span>
            </Link>
            <Link href="/admin/alumnos" className="admin-tone--alumnos">
              <span className="admin-shortcut__icon"><Icono nombre="alumnos" /></span>
              <span>Ver alumnos</span>
              <span className="admin-arrow"><Icono nombre="flecha" /></span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
