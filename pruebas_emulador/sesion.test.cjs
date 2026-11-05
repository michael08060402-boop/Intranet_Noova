const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

function preparar() {
  let cambioAuth, cambioPerfil, limpiar;
  let creaciones = 0;
  const estados = [];
  const compilado = ts.transpileModule(fs.readFileSync('src/components/acceso/SesionProvider.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const modulo = new Module('sesion-prueba');
  modulo.require = nombre => {
    if (nombre === 'react/jsx-runtime') return { jsx: () => null };
    if (nombre === 'react') return {
      createContext: () => ({ Provider: {} }), useContext: () => null,
      useState: () => [null, valor => estados.push(valor)],
      useEffect: efecto => { limpiar = efecto(); },
    };
    if (nombre === 'firebase/auth') return { onIdTokenChanged: (_, callback) => { cambioAuth = callback; return () => {}; } };
    if (nombre === 'firebase/firestore') return {
      doc: () => ({}), onSnapshot: (_, opciones, callback) => { assert.equal(opciones.includeMetadataChanges, true); cambioPerfil = callback; return () => {}; },
    };
    if (nombre === '@/firebase/config') return { auth: {}, db: {} };
    if (nombre === '@/firebase/perfiles') return {
      asegurarPerfil: async () => { creaciones++; }, leerPerfil: datos => datos,
    };
    throw new Error(`Import inesperado: ${nombre}`);
  };
  modulo._compile(compilado, 'sesion-prueba.cjs');
  modulo.exports.default({ children: null });
  cambioAuth({ uid: 'alumno', emailVerified: true });
  return {
    estados, creaciones: () => creaciones, limpiar: () => limpiar(),
    snapshot: (datos, cache = false, pendiente = false) => cambioPerfil({ metadata: { fromCache: cache, hasPendingWrites: pendiente }, exists: () => !!datos, data: () => datos }),
    salir: () => cambioAuth(null),
  };
}

test('perfil existente se valida directamente sin transaccion de creacion', () => {
  const app = preparar();
  try {
    const perfil = { rol: 'alumno', estado: 'activo' };
    app.snapshot(perfil);
    assert.equal(app.creaciones(), 0);
    assert.equal(app.estados.at(-1).perfil, perfil);
    assert.equal(app.estados.at(-1).cargando, false);
  } finally { app.limpiar(); }
});

test('cache y escrituras pendientes no autorizan; perfil ausente se crea una vez', () => {
  const app = preparar();
  try {
    app.snapshot({ rol: 'admin' }, true);
    app.snapshot({ rol: 'admin' }, false, true);
    assert.equal(app.estados.at(-1).perfil, null);
    app.snapshot(null); app.snapshot(null);
    assert.equal(app.creaciones(), 1);
    app.snapshot({ rol: 'alumno' });
    assert.equal(app.estados.at(-1).cargando, false);
  } finally { app.limpiar(); }
});

test('una respuesta anterior no recupera el perfil despues de cerrar sesion', () => {
  const app = preparar();
  try {
    app.salir();
    app.snapshot({ rol: 'admin' });
    assert.equal(app.estados.at(-1).usuario, null);
    assert.equal(app.estados.at(-1).perfil, null);
  } finally { app.limpiar(); }
});
