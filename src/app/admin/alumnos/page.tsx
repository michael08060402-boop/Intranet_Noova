import { Users } from "lucide-react";
import ListadoAdmin from "@/components/admin/ListadoAdmin";

export default function AlumnosPage() {
  return (
    <ListadoAdmin
      etiqueta="Comunidad de aprendizaje"
      titulo="Alumnos"
      descripcion="Consulta los estudiantes registrados en la plataforma."
      tituloPanel="Directorio de alumnos"
      Icono={Users}
      conteo="0 alumnos"
      placeholderBusqueda="Buscar por nombre o correo..."
      etiquetaBusqueda="Buscar alumno por nombre o correo"
      etiquetaFiltro="Filtrar por plan"
      opcionesFiltro={[
        { valor: "todos", texto: "Todos los planes" },
        { valor: "gratis", texto: "Gratis" },
        { valor: "premium", texto: "Premium" },
      ]}
      columnas={["Alumno", "Correo electrónico", "Fecha de registro", "Plan", "Acciones"]}
      vacioTitulo="Aún no hay alumnos registrados"
      vacioTexto={
        <>
          Los alumnos aparecerán aquí automáticamente cuando se registren
          <br className="listado-admin__salto" /> en la plataforma.
        </>
      }
    />
  );
}
