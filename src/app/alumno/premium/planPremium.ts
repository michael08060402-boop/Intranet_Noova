// Datos del plan Premium que comparten la página de planes y la de pago.
// Premium se paga por periodo (no es suscripción automática) para poder aceptar tarjeta y Yape.
export const periodos = [
  { meses: 1, precio: 10 },
  { meses: 3, precio: 24 },
  { meses: 6, precio: 36 },
];

export const mesesRecomendados = 6;

const precioMensual = periodos[0].precio;

export const buscarPeriodo = (meses: number) => periodos.find((periodo) => periodo.meses === meses) ?? periodos[periodos.length - 1];
export const nombrePeriodo = (meses: number) => (meses === 1 ? "1 mes" : `${meses} meses`);
export const precioSinDescuento = (meses: number) => meses * precioMensual;
export const ahorroPeriodo = (meses: number) => Math.round((1 - buscarPeriodo(meses).precio / precioSinDescuento(meses)) * 100);
export const porMes = (meses: number) => buscarPeriodo(meses).precio / meses;

export const beneficiosPremium = ["Todos los cursos y clases", "Contenido especializado", "Nuevos cursos cada mes", "Herramientas adicionales", "Certificados de finalización"];
