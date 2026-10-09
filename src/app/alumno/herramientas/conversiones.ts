const CFM_POR_M3_MIN = 35.315;

export const aCfm = (m3PorMin: number) => m3PorMin * CFM_POR_M3_MIN;

export type Unidad = { nombre: string; factor: number };

export type Magnitud = { nombre: string; unidades: Unidad[] };

export const magnitudes: Magnitud[] = [
  {
    nombre: "Caudal",
    unidades: [
      { nombre: "m³/min", factor: 1 / 60 },
      { nombre: "m³/s", factor: 1 },
      { nombre: "L/s", factor: 0.001 },
      { nombre: "cfm", factor: 1 / (60 * CFM_POR_M3_MIN) },
    ],
  },
  {
    nombre: "Presión",
    unidades: [
      { nombre: "Pa", factor: 1 },
      { nombre: "kPa", factor: 1000 },
      { nombre: "mm H₂O", factor: 9.80665 },
      { nombre: "in H₂O", factor: 249.08891 },
      { nombre: "psi", factor: 6894.757 },
      { nombre: "bar", factor: 100000 },
    ],
  },
  {
    nombre: "Potencia",
    unidades: [
      { nombre: "kW", factor: 1000 },
      { nombre: "W", factor: 1 },
      { nombre: "HP", factor: 745.69987 },
    ],
  },
  {
    nombre: "Longitud",
    unidades: [
      { nombre: "m", factor: 1 },
      { nombre: "km", factor: 1000 },
      { nombre: "ft", factor: 0.3048 },
      { nombre: "in", factor: 0.0254 },
    ],
  },
];

export const convertir = (valor: number, desde: Unidad, hacia: Unidad) => (valor * desde.factor) / hacia.factor;
