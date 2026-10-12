import ExcelJS from "exceljs";

export type FilaReporteAlumno = {
  nombre: string;
  correo: string;
  plan: string;
  registro: string;
  rendidos: number;
  promedio: number | null;
  aprobados: number;
};

type ConfiguracionReporte = { nombre: string; titulo: string; total: string; columnas: string[]; anchos: number[]; valores: (string | number)[][] };

export function crearLibroAlumnos(filas: FilaReporteAlumno[], encabezadoPng: string, fecha = new Date(), configuracion?: ConfiguracionReporte) {
  const registros = configuracion?.valores ?? filas.map((datos) => [datos.nombre, datos.correo, datos.plan, datos.registro, datos.rendidos, datos.promedio ?? "—", datos.aprobados]);
  const titulos = configuracion?.columnas ?? ["Alumno", "Correo", "Plan", "Registro", "Exámenes rendidos", "Promedio (de 20)", "Aprobados"];
  const cantidadColumnas = titulos.length;
  const libro = new ExcelJS.Workbook();
  libro.creator = "Noova Consulting";
  libro.created = fecha;
  const hoja = libro.addWorksheet(configuracion?.nombre ?? "Alumnos", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 7 }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:7" },
  });
  hoja.columns = (configuracion?.anchos ?? [28, 44, 16, 20, 25, 25, 18]).map((width) => ({ width }));
  const finBanner = hoja.getColumn(cantidadColumnas - 2).letter;
  const inicioDatos = hoja.getColumn(cantidadColumnas - 1).letter;
  const finDatos = hoja.getColumn(cantidadColumnas).letter;
  for (let numero = 1; numero <= 5; numero++) {
    const fila = hoja.getRow(numero);
    fila.height = 24;
    for (let columna = 1; columna <= cantidadColumnas; columna++) {
      fila.getCell(columna).fill = { type: "pattern", pattern: "solid", fgColor: { argb: columna <= cantidadColumnas - 2 ? "FF082F4C" : "FFF0F6FC" } };
    }
  }
  hoja.mergeCells(`A1:${finBanner}5`);
  hoja.getCell("A1").value = configuracion?.titulo ?? "REPORTE DE ALUMNOS";
  hoja.getCell("A1").font = { name: "Arial", bold: true, size: 22, color: { argb: "FFFFFFFF" } };
  const imagen = libro.addImage({ base64: encabezadoPng, extension: "png" });
  hoja.addImage(imagen, `A1:${finBanner}5`);
  for (const [inicio, fin] of [[1, 1], [2, 2], [3, 3], [4, 5]]) hoja.mergeCells(`${inicioDatos}${inicio}:${finDatos}${fin}`);
  hoja.getCell(`${inicioDatos}1`).value = "Fecha de generación";
  hoja.getCell(`${inicioDatos}2`).value = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha);
  hoja.getCell(`${inicioDatos}3`).value = configuracion?.total ?? "Total de alumnos";
  hoja.getCell(`${inicioDatos}4`).value = registros.length;
  for (const referencia of [1, 2, 3, 4].map((numero) => `${inicioDatos}${numero}`)) {
    const celda = hoja.getCell(referencia);
    celda.font = { name: "Arial", size: 12, bold: referencia === `${inicioDatos}1` || referencia === `${inicioDatos}3`, color: { argb: "FF123D5B" } };
    celda.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  }
  hoja.getRow(6).height = 8;
  const cabecera = hoja.getRow(7);
  cabecera.values = titulos;
  cabecera.height = 38;
  cabecera.eachCell((celda) => {
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF083E5D" } };
    celda.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    celda.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
    celda.border = { bottom: { style: "thin", color: { argb: "FFCADAEA" } }, right: { style: "thin", color: { argb: "FFCADAEA" } } };
  });
  for (let indice = 0; indice < Math.max(registros.length, 9); indice++) {
    const datos = filas[indice];
    const fila = hoja.getRow(indice + 8);
    if (registros[indice]) fila.values = registros[indice];
    fila.height = 32;
    for (let columna = 1; columna <= cantidadColumnas; columna++) {
      const celda = fila.getCell(columna);
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: indice % 2 ? "FFE7EFF7" : "FFF7FAFE" } };
      celda.font = { name: "Arial", size: 11, color: { argb: "FF172B3A" } };
      celda.alignment = { vertical: "middle", horizontal: columna <= 2 ? "left" : "center", wrapText: true, indent: columna <= 2 ? 1 : 0 };
      celda.border = { top: { style: "thin", color: { argb: "FFCADAEA" } }, bottom: { style: "thin", color: { argb: "FFCADAEA" } }, left: { style: "thin", color: { argb: "FFCADAEA" } }, right: { style: "thin", color: { argb: "FFCADAEA" } } };
      if (columna === 6 && datos?.promedio !== null) celda.numFmt = "0.0";
      if (columna === 3 && datos) {
        celda.font = { name: "Arial", size: 11, bold: true, color: { argb: datos.plan === "Premium" ? "FF805C00" : "FF005CC8" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: datos.plan === "Premium" ? "FFFFE9A8" : "FFD3E9FF" } };
      }
    }
  }
  hoja.pageSetup.printArea = `A1:${finDatos}${Math.max(16, registros.length + 7)}`;
  return libro;
}

export type FilaReporteResultado = {
  nombre: string; correo: string; curso: string; examen: string; estado: string;
  nota: number | null; resultado: string; inicio: string; entrega: string; calificado: string;
};

export function crearLibroResultados(filas: FilaReporteResultado[], encabezadoPng: string, fecha = new Date()) {
  return crearLibroAlumnos([], encabezadoPng, fecha, {
    nombre: "Resultados", titulo: "REPORTE DE RESULTADOS", total: "Total de registros",
    columnas: ["Alumno", "Correo", "Curso", "Examen", "Estado", "Nota (de 20)", "Resultado", "Inicio", "Entrega", "Calificado"],
    anchos: [28, 44, 28, 30, 20, 18, 20, 24, 24, 24],
    valores: filas.map((fila) => [fila.nombre, fila.correo, fila.curso, fila.examen, fila.estado, fila.nota ?? "—", fila.resultado, fila.inicio, fila.entrega, fila.calificado]),
  });
}
