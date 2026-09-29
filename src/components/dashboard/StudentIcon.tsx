export default function Icono({ nombre }: { nombre: "inicio" | "libro" | "herramientas" | "flecha" | "buscar" | "campana" | "salir" | "derecha" | "corona" | "video" | "documento" | "explorar" }) {
  const trazos = {
    inicio: "m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10",
    explorar: "M3 3h18v18H3ZM8 8l8 2-6 6Z",
    libro: "M3 5c3-2 6-2 9 0 3-2 6-2 9 0v15c-3-2-6-2-9 0-3-2-6-2-9 0ZM12 5v15",
    herramientas: "M5 3h14v18H5ZM8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h2m4 0h2",
    flecha: "m7 10 5 5 5-5",
    buscar: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm6-2 5 5",
    campana: "M6 9a6 6 0 0 1 12 0c0 6 3 7 3 9H3c0-2 3-3 3-9Zm4 12h4",
    salir: "M9 4H4v16h5M9 12h12m-5-5 5 5-5 5",
    derecha: "M4 12h16m-6-6 6 6-6 6",
    corona: "m3 6 5 4 4-6 4 6 5-4-3 12H6ZM6 21h12",
    video: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM10 8l6 4-6 4Z",
    documento: "M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[nombre]} /></svg>;
}
