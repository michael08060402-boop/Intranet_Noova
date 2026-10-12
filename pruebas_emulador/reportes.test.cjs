const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const ExcelJS = require('exceljs');

const source = ts.transpileModule(fs.readFileSync('src/lib/reporteAlumnos.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const modulo = new Module(path.resolve('src/lib/reporteAlumnos.ts'), module);
modulo.filename = path.resolve('src/lib/reporteAlumnos.ts');
modulo.paths = module.paths;
modulo._compile(source, modulo.filename);
const exportsReporte = modulo.exports;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9l8AAAAASUVORK5CYII=';

test('Excel conserva datos numéricos, texto literal, logo y formato sin filtros', async () => {
  const libro = exportsReporte.crearLibroAlumnos([
    { nombre: '=SUM(1,2)', correo: 'alumno@ejemplo.com', plan: 'Gratis', registro: '12/10/2026', rendidos: 2, promedio: 14.5, aprobados: 1 },
    { nombre: 'María', correo: 'maria@ejemplo.com', plan: 'Premium', registro: '12/10/2026', rendidos: 0, promedio: null, aprobados: 0 },
  ], png, new Date('2026-10-12T03:00:00Z'));
  const abierto = new ExcelJS.Workbook();
  await abierto.xlsx.load(await libro.xlsx.writeBuffer());
  const hoja = abierto.getWorksheet('Alumnos');
  assert.equal(hoja.getCell('F4').value, 2);
  assert.equal(hoja.getCell('F2').value, '11/10/2026');
  assert.equal(hoja.getCell('A8').value, '=SUM(1,2)');
  assert.equal(hoja.getCell('A8').type, ExcelJS.ValueType.String);
  assert.equal(hoja.getCell('F8').value, 14.5);
  assert.equal(hoja.getCell('F9').value, '—');
  assert.equal(hoja.autoFilter, undefined);
  assert.equal(hoja.getImages().length, 1);
  assert.notEqual(hoja.getCell('A8').fill.fgColor.argb, hoja.getCell('A9').fill.fgColor.argb);
});

test('Excel vacío conserva encabezados y total cero', () => {
  const hoja = exportsReporte.crearLibroAlumnos([], png).getWorksheet('Alumnos');
  assert.equal(hoja.getCell('F4').value, 0);
  assert.equal(hoja.getCell('A7').value, 'Alumno');
  assert.equal(hoja.getCell('G7').value, 'Aprobados');
});
test('Resultados conserva las diez columnas, notas y fechas sin filtros', async () => {
  const libro = exportsReporte.crearLibroResultados([
    { nombre: 'Alumno', correo: 'alumno@ejemplo.com', curso: 'Ventilación', examen: 'Final', estado: 'Calificado', nota: 17, resultado: 'Aprobado', inicio: '12/10/2026 09:00', entrega: '12/10/2026 09:20', calificado: '12/10/2026 10:00' },
    { nombre: 'Otro', correo: 'otro@ejemplo.com', curso: 'Bombas', examen: 'Final', estado: 'En curso', nota: null, resultado: '—', inicio: '12/10/2026 11:00', entrega: '—', calificado: '—' },
  ], png);
  const abierto = new ExcelJS.Workbook();
  await abierto.xlsx.load(await libro.xlsx.writeBuffer());
  const hoja = abierto.getWorksheet('Resultados');
  assert.equal(hoja.getCell('I4').value, 2);
  assert.equal(hoja.getCell('C8').value, 'Ventilación');
  assert.equal(hoja.getCell('F8').value, 17);
  assert.equal(hoja.getCell('J8').value, '12/10/2026 10:00');
  assert.equal(hoja.getCell('F9').value, '—');
  assert.equal(hoja.getCell('J7').value, 'Calificado');
  assert.equal(hoja.autoFilter, undefined);
  assert.equal(hoja.getImages().length, 1);
});
