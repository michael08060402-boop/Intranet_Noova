const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function cargar(cantidad, fallar = false) {
  const operaciones = [];
  const firestore = {
    doc: (_, ...partes) => partes.join('/'),
    collection: (_, ruta) => ruta,
    where: (...args) => args,
    query: (...args) => args,
    serverTimestamp: () => 'fecha',
    updateDoc: async (ruta, datos) => operaciones.push({ ruta, datos }),
    getDocs: async (consulta) => {
      assert.equal(JSON.stringify(consulta), JSON.stringify(['intentos', ['examenId', '==', 'examen']]));
      return { docs: Array.from({ length: cantidad }, (_, i) => ({ ref: `intentos/${i}` })) };
    },
    writeBatch: () => {
      const borrados = [];
      return {
        delete: (ruta) => borrados.push(ruta),
        commit: async () => {
          if (fallar) throw new Error('sin conexion');
          operaciones.push(borrados);
        },
      };
    },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/firebase/evaluaciones.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (nombre) => nombre === 'firebase/firestore' ? firestore : {} });
  return { eliminar: exports.eliminarExamen, operaciones };
}

test('elimina 801 intentos por lotes antes de borrar examen y claves', async () => {
  const app = cargar(801);
  await app.eliminar('examen');
  assert.equal(app.operaciones[0].datos.publicado, false);
  assert.deepEqual(app.operaciones.slice(1, 4).map(lote => lote.length), [400, 400, 1]);
  assert.deepEqual(app.operaciones[4], ['examenes/examen/claves/clave', 'examenes/examen']);
});

test('elimina tambien un examen sin intentos', async () => {
  const app = cargar(0);
  await app.eliminar('examen');
  assert.equal(app.operaciones.length, 2);
});

test('si falla un lote conserva el examen retirado para reintentar', async () => {
  const app = cargar(1, true);
  await assert.rejects(app.eliminar('examen'), /sin conexion/);
  assert.equal(app.operaciones.length, 1);
  assert.equal(app.operaciones[0].datos.publicado, false);
});
