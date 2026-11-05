const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('entrega vencida reintenta a los cinco segundos y respeta el margen del servidor', async () => {
  let ahora = 100000;
  let indice = 0;
  let llamadas = 0;
  let efectos = [];
  const valores = [];
  const respuestas = { p1: 'respuesta conservada' };
  const react = {
    useState: inicial => {
      const posicion = indice++;
      if (!(posicion in valores)) valores[posicion] = typeof inicial === 'function' ? inicial() : inicial;
      return [valores[posicion], valor => { valores[posicion] = valor; }];
    },
    useRef: inicial => {
      const posicion = indice++;
      return valores[posicion] ??= { current: inicial };
    },
    useEffect: efecto => efectos.push(efecto),
    useCallback: fn => fn,
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/app/alumno/examen/page.tsx', 'utf8').replace('function Rendicion(', 'export function Rendicion('), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, Date: { now: () => ahora }, Intl, clearTimeout,
    require: nombre => nombre === 'react' ? react : nombre === 'react/jsx-runtime' ? { jsx() {}, jsxs() {} }
      : nombre === '@/firebase/evaluaciones' ? {
        vencimientoIntento: () => 100000,
        entregarIntento: async (id, datos) => {
          llamadas++;
          assert.equal(id, 'intento');
          assert.equal(datos, respuestas);
          throw new Error('sin conexion');
        },
      } : {},
  });
  async function render(tiempo) {
    ahora = tiempo;
    // El segundo estado es el reloj que actualiza el intervalo de la pantalla.
    if (valores.length) valores[1] = ahora;
    indice = 0;
    efectos = [];
    exports.Rendicion({ examen: { preguntas: [] }, intento: { id: 'intento', respuestas } });
    // Solo el efecto de entrega; los anteriores montan el reloj y su limpieza.
    efectos.at(-1)();
    await Promise.resolve();
    await Promise.resolve();
  }
  await render(100000);
  assert.equal(llamadas, 1);
  await render(104000);
  assert.equal(llamadas, 1);
  await render(105000);
  assert.equal(llamadas, 2);
  await render(161000);
  assert.equal(llamadas, 2);
});
