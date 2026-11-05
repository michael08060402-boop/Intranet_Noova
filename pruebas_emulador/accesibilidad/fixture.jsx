import React from 'react';
import { createRoot } from 'react-dom/client';
import Accesibilidad from '../../src/components/acceso/Accesibilidad';
import PaginaAcceso from '../../src/components/acceso/PaginaAcceso';
import Examen from '../../src/app/alumno/examen/page';
import NuevoExamen from '../../src/app/admin/evaluaciones/NuevoExamen';
import ReproductorVideo from '../../src/components/alumno/ReproductorVideo';
import Alumnos from '../../src/app/admin/alumnos/page';
import Reportes from '../../src/app/admin/reportes/page';
import Cursos from '../../src/app/admin/cursos/page';
import AdministrarCurso from '../../src/app/admin/cursos/curso/page';
import CursoDetalle from '../../src/app/alumno/explorar/CursoDetalle';
import MisCursos from '../../src/app/alumno/cursos/page';
import MisEvaluaciones from '../../src/app/alumno/evaluaciones/page';
import Perfil from '../../src/app/alumno/perfil/page';
import { curso } from './mocks';
import '../../src/app/globals.css';
import '../../src/app/alumno/AlumnoLayout.css';
import '../../src/app/admin/AdminPagina.css';
import '../../src/app/admin/AdminLayout.css';
import '../../src/app/alumno/explorar/Explorar.css';

const vista = new URLSearchParams(location.search).get('vista');
function Fixture() {
  const paginas = { alumnos: Alumnos, reportes: Reportes, cursos: Cursos, 'admin-clase': AdministrarCurso, 'mis-cursos': MisCursos, evaluaciones: MisEvaluaciones, perfil: Perfil };
  const Pagina = paginas[vista];
  if (Pagina) return <><Accesibilidad /><div className={['alumnos', 'reportes', 'cursos', 'admin-clase'].includes(vista) ? 'admin-estructura' : 'alumno-estructura'}><Pagina /></div></>;
  if (vista === 'detalle') return <><Accesibilidad /><div className="alumno-estructura"><CursoDetalle curso={curso} categoria="Ventilación" inscrito bloqueado={false} alVolver={() => {}} /></div></>;
  return <><Accesibilidad />{vista === 'acceso' ? <PaginaAcceso /> : vista === 'admin' ? <main className="alumno-estructura"><h1>Evaluaciones</h1><NuevoExamen examen={null} cursos={[{ id: 'curso', nombre: 'Ventilación' }]} alCerrar={() => {}} /></main> : vista === 'subtitulos' ? <main><h1>Clase con subtítulos</h1><ReproductorVideo controls subtitulos={'WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nBienvenidos a la clase.\n'} /></main> : <div className="alumno-estructura"><Examen /></div>}</>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
