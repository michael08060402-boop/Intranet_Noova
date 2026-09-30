import { BookOpen } from "lucide-react";
import ListadoAdmin from "@/components/admin/ListadoAdmin";
import NuevoCurso from "./NuevoCurso";

export default function CursosPage() {
  return (
    <ListadoAdmin
      etiqueta="Gestión académica"
      titulo="Cursos"
      descripcion="Administra tus cursos y sus videos."
      accion={<NuevoCurso />}
      tituloPanel="Catálogo de cursos"
      Icono={BookOpen}
      conteo="0 cursos"
      placeholderBusqueda="Buscar curso..."
      etiquetaBusqueda="Buscar curso"
      etiquetaFiltro="Filtrar por categoría"
      opcionesFiltro={[{ valor: "todas", texto: "Todas las categorías" }]}
      columnas={["Curso", "Categoría", "Estado", "Videos", "Alumnos", "Acciones"]}
      anchoPrimeraColumna="43%"
      vacioTitulo="Aún no hay cursos registrados"
      vacioTexto={
        <>
          Comienza creando tu primer curso para poder gestionar sus videos
          <br className="listado-admin__salto" /> y alumnos desde aquí.
        </>
      }
    />
  );
}
