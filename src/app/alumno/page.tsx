"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Crown } from "lucide-react";
import heroAlumno from "@/assets/fondos/hero-alumno.webp";
import { useSesion } from "@/components/acceso/SesionProvider";
import TarjetaCurso from "@/components/alumno/TarjetaCurso";
import PortadaCurso from "@/components/alumno/PortadaCurso";
import { contarClasesPublicadas, escucharCategorias, escucharCursos, escucharInscripciones, escucharProgreso, type Categoria, type Curso, type Progreso } from "@/firebase/cursos";
import { capitalizarNombre } from "@/firebase/perfiles";
import "./InicioAlumno.css";

export default function InicioAlumno() {
  const { usuario, perfil } = useSesion();
  const nombre = capitalizarNombre(perfil?.nombre.split(" ")[0] || "estudiante");
  const primeraVez = usuario?.metadata.creationTime === usuario?.metadata.lastSignInTime;
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [inscritos, setInscritos] = useState<string[]>([]);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [clases, setClases] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => escucharCursos(true, (lista) => { setCursos(lista); setCargando(false); }, () => setCargando(false)), []);
  useEffect(() => escucharCategorias(true, setCategorias, () => setCategorias([])), []);

  useEffect(() => {
    if (!usuario) return;
    const dejarInscripciones = escucharInscripciones(usuario.uid, setInscritos, () => setInscritos([]));
    const dejarProgreso = escucharProgreso(usuario.uid, (lista) => setProgreso(lista.filter((item) => item.completado)), () => setProgreso([]));
    return () => { dejarInscripciones(); dejarProgreso(); };
  }, [usuario]);

  const destacados = cursos.slice(0, 4);
  const misCursos = cursos.filter((curso) => inscritos.includes(curso.id));
  const idsContar = [...new Set([...destacados, ...misCursos].map((curso) => curso.id))].join(",");

  useEffect(() => {
    if (!idsContar) return;
    Promise.all(idsContar.split(",").map(async (id) => [id, await contarClasesPublicadas(id)] as const))
      .then((conteos) => setClases(Object.fromEntries(conteos)))
      .catch(() => setClases({}));
  }, [idsContar]);

  function porcentaje(curso: Curso) {
    const total = clases[curso.id] ?? 0;
    const completadas = progreso.filter((item) => item.cursoId === curso.id).length;
    return total ? Math.min(100, Math.round((completadas / total) * 100)) : 0;
  }

  const enCurso = misCursos.filter((curso) => porcentaje(curso) < 100).sort((a, b) => porcentaje(b) - porcentaje(a)).slice(0, 3);

  return (
    <main className="alumno-principal">
      <section className="alumno-bienvenida">
        <h1>
          {primeraVez ? "¡Te damos la bienvenida, " : "¡Hola de nuevo, "}
          <span className="alumno-bienvenida__nombre">{nombre}</span>!
        </h1>
      </section>

      <section className="alumno-portada" aria-labelledby="alumno-portada-title">
        <div className="alumno-portada__texto">
          <h2 id="alumno-portada-title">Sigue desarrollando tus habilidades en minería</h2>
          <p>Cursos, exámenes y calculadoras de ventilación y bombeo en un solo lugar.</p>
          <div className="alumno-portada__acciones">
            <Link href="/alumno/explorar" className="alumno-portada__principal">Explorar cursos</Link>
            {perfil?.plan === "gratis" && <Link href="/alumno/premium" className="alumno-portada__secundario"><Crown />Conocer Premium</Link>}
          </div>
        </div>
        <Image className="alumno-portada__imagen" src={heroAlumno} alt="Profesionales de Noova trabajando en una mina subterránea" sizes="(max-width: 760px) 100vw, 50vw" preload />
      </section>

      <section className="alumno-cursos" aria-labelledby="alumno-featured-title">
        <div className="alumno-seccion-titulo">
          <h2 id="alumno-featured-title">Cursos destacados</h2>
          <Link href="/alumno/explorar">Ver todos<ArrowRight /></Link>
        </div>
        {destacados.length > 0 ? (
          <div className="alumno-destacados">
            {destacados.map((curso) => (
              <TarjetaCurso
                key={curso.id}
                curso={curso}
                categoria={categorias.find((categoria) => categoria.id === curso.categoriaId)?.nombre}
                clases={clases[curso.id]}
                inscrito={inscritos.includes(curso.id)}
                bloqueado={curso.acceso === "premium" && perfil?.plan !== "premium"}
              />
            ))}
          </div>
        ) : (
          <div className="alumno-inicio-vacio">
            <span><BookOpen /></span>
            <div>
              <h3>{cargando ? "Cargando cursos…" : "Aún no hay cursos destacados"}</h3>
            </div>
          </div>
        )}
      </section>

      <section className="alumno-cursos" aria-labelledby="alumno-learning-title">
        <div className="alumno-seccion-titulo">
          <h2 id="alumno-learning-title">Continúa aprendiendo</h2>
          <Link href="/alumno/cursos">Ver mis cursos<ArrowRight /></Link>
        </div>
        {enCurso.length > 0 ? (
          <div className="alumno-continuar">
            {enCurso.map((curso) => {
              const valor = porcentaje(curso);
              return (
                <article key={curso.id} className="alumno-continuar__curso">
                  <PortadaCurso className="alumno-continuar__portada" portadaKey={curso.portadaKey} nombre={curso.nombre} />
                  <div className="alumno-continuar__cuerpo">
                    <h3>{curso.nombre}</h3>
                    <small>{valor}% completado</small>
                    <span className="alumno-continuar__barra"><span style={{ width: `${valor}%` }} /></span>
                    <Link href={`/alumno/curso?id=${curso.id}`}>{valor === 0 ? "Comenzar" : "Continuar"}<ArrowRight /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="alumno-inicio-vacio alumno-inicio-vacio--centrado">
            <div>
              <h3>Aún no tienes cursos en progreso</h3>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
