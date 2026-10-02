const GRAVEDAD = 9.81;
const DENSIDAD_AGUA = 1000;
const KW_POR_HP = 0.7457;

export function calcularBombeo(datos: { caudal: number; diametro: number; longitud: number; coeficiente: number; alturaEstatica: number; eficiencia: number }) {
  if (datos.diametro <= 0 || datos.coeficiente <= 0 || datos.eficiencia <= 0) return null;
  const caudal = datos.caudal / 1000;
  const diametro = datos.diametro / 1000;
  const velocidad = caudal / ((Math.PI * diametro ** 2) / 4);
  const perdida = (10.67 * datos.longitud * caudal ** 1.852) / (datos.coeficiente ** 1.852 * diametro ** 4.87);
  const altura = datos.alturaEstatica + perdida;
  const potenciaHidraulica = (DENSIDAD_AGUA * GRAVEDAD * caudal * altura) / 1000;
  const potenciaEje = potenciaHidraulica / (datos.eficiencia / 100);
  return { velocidad, perdida, altura, potenciaHidraulica, potenciaEje, potenciaEjeHp: potenciaEje / KW_POR_HP };
}
