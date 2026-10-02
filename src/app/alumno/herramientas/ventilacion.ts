
export function caudalPorPersona(altitud: number) {
  if (altitud <= 1500) return 3;
  if (altitud <= 3000) return 4;
  if (altitud <= 4000) return 5;
  return 6;
}

export function factorMadera(porcentaje: number) {
  if (porcentaje < 20) return 0;
  if (porcentaje <= 40) return 0.6;
  if (porcentaje <= 70) return 1;
  return 1.25;
}

export function velocidadPorTemperatura(temperatura: number) {
  if (temperatura < 24) return 0;
  if (temperatura < 30) return 30;
  return null;
}

type Equipo = { hp: number; disponibilidad: number; utilizacion: number };

type DatosAire = {
  altitud: number;
  trabajadores: number;
  produccion: number;
  consumoMadera: number;
  temperatura: number;
  areaLabor: number;
  nivelesCalientes: number;
  factorAltura: number;
  equipos: Equipo[];
  velocidadVoladura: number;
  nivelesVoladura: number;
};

type ResultadoAire = {
  qTr: number;
  qMa: number;
  qTe: number;
  qEq: number;
  qT1: number;
  qFu: number;
  qTo: number;
  qEx: number;
  qFinal: number;
};

export function calcularAire(datos: DatosAire): ResultadoAire | null {
  const velocidadTemperatura = velocidadPorTemperatura(datos.temperatura);
  if (velocidadTemperatura === null) return null;

  const porcentajeMadera = datos.produccion > 0 ? (datos.consumoMadera / datos.produccion) * 100 : 0;
  const qTr = caudalPorPersona(datos.altitud) * datos.trabajadores;
  const qMa = datos.produccion * factorMadera(porcentajeMadera);
  const qTe = velocidadTemperatura * datos.areaLabor * datos.nivelesCalientes;
  const qEq = datos.equipos.reduce((suma, equipo) => (
    suma + 3 * equipo.hp * datos.factorAltura * (equipo.disponibilidad / 100) * (equipo.utilizacion / 100)
  ), 0);
  const qT1 = qTr + qMa + qTe + qEq;
  const qFu = qT1 * 0.15;
  const qTo = qT1 + qFu;
  const qEx = datos.areaLabor * datos.velocidadVoladura * datos.nivelesVoladura;

  return { qTr, qMa, qTe, qEq, qT1, qFu, qTo, qEx, qFinal: datos.equipos.length === 0 ? Math.max(qTo, qEx) : qTo };
}

export function calcularBalance(requerido: number, ingreso: number, salida: number) {
  return {
    balance: salida - ingreso,
    diferencia: ingreso > 0 ? (Math.abs(ingreso - salida) / ingreso) * 100 : 0,
    cobertura: requerido > 0 ? ingreso / requerido : 0,
    superavit: ingreso - requerido,
  };
}

export function calcularVentilador(datos: { friccion: number; longitud: number; perimetro: number; area: number; caudal: number; eficiencia: number }) {
  if (datos.area <= 0 || datos.eficiencia <= 0) return null;
  const caudalPorSegundo = datos.caudal / 60;
  const resistencia = (datos.friccion * datos.longitud * datos.perimetro) / datos.area ** 3;
  const caida = resistencia * caudalPorSegundo ** 2;
  const potenciaAire = (caudalPorSegundo * caida) / 1000;
  return { resistencia, caida, potenciaAire, potenciaVentilador: potenciaAire / (datos.eficiencia / 100) };
}
