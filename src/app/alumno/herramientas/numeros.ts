export const formatoNumero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

export const formatoCifras = new Intl.NumberFormat("es-PE", { maximumSignificantDigits: 6 });

export function leerNumero(texto: string) {
  const numero = texto.trim() === "" ? 0 : Number(texto);
  return Number.isFinite(numero) && numero >= 0 ? numero : NaN;
}
