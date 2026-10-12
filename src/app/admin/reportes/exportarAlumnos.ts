import logo from "@/assets/marca/noova.webp";
import paisaje from "@/assets/fondos/paisaje-mina.webp";
import { crearLibroAlumnos, crearLibroResultados, type FilaReporteAlumno, type FilaReporteResultado } from "@/lib/reporteAlumnos";
import type { Workbook } from "exceljs";

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo cargar el encabezado del reporte."));
    imagen.src = src;
  });
}

async function crearEncabezado(titulo = "REPORTE DE ALUMNOS", ancho = 1000) {
  const [marca, mina] = await Promise.all([cargarImagen(logo.src), cargarImagen(paisaje.src)]);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = 180;
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("No se pudo crear el encabezado del reporte.");
  const azul = contexto.createLinearGradient(0, 0, ancho, 180);
  azul.addColorStop(0, "#08263e");
  azul.addColorStop(1, "#0b4163");
  contexto.fillStyle = azul;
  contexto.fillRect(0, 0, ancho, 180);
  contexto.save();
  contexto.beginPath();
  contexto.moveTo(ancho - 200, 0);
  contexto.lineTo(ancho, 0);
  contexto.lineTo(ancho, 180);
  contexto.lineTo(ancho - 310, 180);
  contexto.closePath();
  contexto.clip();
  contexto.drawImage(mina, ancho - 360, 0, 360, 180);
  contexto.fillStyle = "rgba(7, 48, 77, .55)";
  contexto.fillRect(ancho - 360, 0, 360, 180);
  contexto.restore();
  const altoLogo = 138;
  const anchoLogo = altoLogo * marca.width / marca.height;
  contexto.drawImage(marca, 28, 21, anchoLogo, altoLogo);
  contexto.strokeStyle = "#7097ad";
  contexto.beginPath();
  contexto.moveTo(270, 30);
  contexto.lineTo(270, 150);
  contexto.stroke();
  contexto.fillStyle = "#ffffff";
  contexto.font = "bold 36px Arial";
  contexto.fillText(titulo, 300, 102);
  return lienzo.toDataURL("image/png");
}

export async function descargarReporteAlumnos(filas: FilaReporteAlumno[]) {
  const libro = crearLibroAlumnos(filas, await crearEncabezado());
  await descargarLibro(libro, "reporte-alumnos.xlsx");
}

export async function descargarReporteResultados(filas: FilaReporteResultado[]) {
  const libro = crearLibroResultados(filas, await crearEncabezado("REPORTE DE RESULTADOS", 1500));
  await descargarLibro(libro, "reporte-resultados.xlsx");
}

async function descargarLibro(libro: Workbook, nombre: string) {
  const contenido = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(contenido)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
