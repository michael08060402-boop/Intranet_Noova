const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function cargar(perfil, subida, respuestaGraph, documentos = {}) {
  const source = ts.transpileModule(fs.readFileSync('functions/src/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let llamadasGraph = 0;
  const eliminados = [];
  const db = { recursiveDelete: async (referencia) => eliminados.push(referencia.ruta), doc: (ruta) => ({ ruta, get: async () => ({ exists: true, data: () => ruta.startsWith('usuarios/') ? perfil : ruta.startsWith('subidasVideos/') ? subida : documentos[ruta] ?? {} }) }) };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const modulos = {
    'firebase-admin/app': { initializeApp() {} },
    'firebase-admin/firestore': { getFirestore: () => db, FieldValue: { serverTimestamp: () => 'fecha-simulada' } },
    'firebase-functions': { logger: { warn() {}, error() {} } },
    'firebase-functions/params': { defineString: (_, opciones) => ({ value: () => opciones?.default ?? 'id' }), defineSecret: () => ({ value: () => 'secreto-simulado' }) },
    'firebase-functions/v2/https': { HttpsError, onCall: (opciones, handler) => handler ?? opciones },
    'firebase-functions/v2': { setGlobalOptions() {} },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => modulos[name], URL, URLSearchParams, encodeURIComponent, fetch: async (url) => {
    llamadasGraph++;
    return { ok: true, json: async () => url.includes('oauth2') ? { access_token: 'token-simulado', expires_in: 3600 } : typeof respuestaGraph === "function" ? respuestaGraph(url) : respuestaGraph };
  } });
  return { exports, llamadas: () => llamadasGraph, eliminados };
}
const auth = { uid: 'admin', token: { email_verified: true } };
test('alumno no puede iniciar una subida ni contactar Microsoft', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' });
  await assert.rejects(app.exports.iniciarSubidaVideo({ auth, data: {} }), { code: 'permission-denied' });
  assert.equal(app.llamadas(), 0);
});
test('administrador suspendido no puede subir', async () => {
  const app = cargar({ rol: 'admin', estado: 'suspendido' });
  await assert.rejects(app.exports.iniciarSubidaVideo({ auth, data: {} }), { code: 'permission-denied' });
});
test('se rechaza tamaño fuera del limite antes de Graph', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' });
  await assert.rejects(app.exports.iniciarSubidaVideo({ auth, data: { cursoId: 'curso', claseId: 'clase', nombre: 'video.mp4', tamano: 11 * 1024 ** 3, acceso: 'gratis' } }), { code: 'invalid-argument' });
  assert.equal(app.llamadas(), 0);
});
test('otro administrador no puede confirmar una subida ajena', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' }, { uid: 'otro' });
  await assert.rejects(app.exports.confirmarSubidaVideo({ auth, data: { subidaId: 'subida' } }), { code: 'permission-denied' });
  assert.equal(app.llamadas(), 0);
});
test('un archivo incompleto no se asocia a la clase', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' }, { uid: 'admin', vence: Date.now() + 60000, ruta: 'curso/video.mp4', tamano: 200 }, { file: {}, size: 100 });
  await assert.rejects(app.exports.confirmarSubidaVideo({ auth, data: { subidaId: 'subida' } }), { code: 'failed-precondition' });
});
test('alumno no puede explorar los videos de Microsoft', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' });
  await assert.rejects(app.exports.listarVideosMicrosoft({ auth, data: {} }), { code: 'permission-denied' });
  assert.equal(app.llamadas(), 0);
});
test('explorador rechaza rutas fuera de CURSOS', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' });
  for (const carpeta of ['../otra', '/otra', 'curso/../otro', 'curso\\otro']) {
    await assert.rejects(app.exports.listarVideosMicrosoft({ auth, data: { carpeta } }), { code: 'invalid-argument' });
  }
  assert.equal(app.llamadas(), 0);
});
test('explorador devuelve carpetas y videos, omite otros documentos y pagina', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' }, null, { value: [
    { name: 'Pumpsim', folder: {} }, { name: 'clase.mp4', file: {} }, { name: 'notas.pdf', file: {} },
  ], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/children?$skiptoken=pagina2' });
  const resultado = await app.exports.listarVideosMicrosoft({ auth, data: {} });
  assert.equal(resultado.elementos.length, 2);
  assert.equal(resultado.elementos[0].carpeta, true);
  assert.equal(resultado.elementos[1].ruta, 'NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/clase.mp4');
  assert.equal(resultado.siguiente, 'pagina2');
});
function documentosVideo(portadaKey) {
  return {
    'cursos/curso': { publicado: true, acceso: 'gratis', portadaKey: 'portadas/curso' },
    'cursos/curso/clases/clase': { publicado: true },
    'cursos/curso/clases/clase/contenidos/video': { ruta: 'CURSOS/video.mp4', acceso: 'gratis', portadaKey },
  };
}
test('video devuelve miniatura automatica e ignora portada personalizada anterior', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, null, (url) => url.endsWith('/thumbnails') ? { value: [{ large: { url: 'https://example.com/miniatura' } }] } : { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentosVideo('portadas-clases/curso/clase'));
  const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(resultado.miniatura, 'https://example.com/miniatura');
  assert.equal(resultado.portadaKey, null);
  assert.equal(resultado.portadaCursoKey, 'portadas/curso');
});
test('miniatura inexistente no bloquea reproduccion ni acepta portada ajena', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, null, (url) => url.endsWith('/thumbnails') ? { value: [] } : { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentosVideo('portadas-clases/otro/clase'));
  const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(resultado.url, 'https://example.com/video');
  assert.equal(resultado.miniatura, null);
  assert.equal(resultado.portadaKey, null);
  assert.equal(resultado.portadaCursoKey, 'portadas/curso');
});
test('solo administrador puede previsualizar videos', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' });
  await assert.rejects(app.exports.previsualizarVideoMicrosoft({ auth, data: { cursoId: 'curso', ruta: 'video.mp4' } }), { code: 'permission-denied' });
  assert.equal(app.llamadas(), 0);
});
test('previsualizacion no permite consultar fuera de la carpeta de cursos', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' });
  await assert.rejects(app.exports.previsualizarVideoMicrosoft({ auth, data: { cursoId: 'curso', ruta: 'ERP/privado.mp4' } }), { code: 'invalid-argument' });
  assert.equal(app.llamadas(), 0);
});
test('administrador puede previsualizar antes de publicar una clase', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' }, null, { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' });
  const resultado = await app.exports.previsualizarVideoMicrosoft({ auth, data: { cursoId: 'curso', ruta: 'NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/video.mp4' } });
  assert.equal(resultado.url, 'https://example.com/video');
});

test('alumno no puede eliminar cursos', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' });
  await assert.rejects(app.exports.eliminarContenidoAdmin({ auth, data: { cursoId: 'curso' } }), { code: 'permission-denied' });
  assert.equal(app.eliminados.length, 0);
});
test('administrador elimina clase y contenidos sin llamar a Microsoft', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' });
  await app.exports.eliminarContenidoAdmin({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(app.eliminados[0], 'cursos/curso/clases/clase');
  assert.equal(app.llamadas(), 0);
});
test('administrador elimina curso de forma recursiva y rechaza rutas invalidas', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' });
  await assert.rejects(app.exports.eliminarContenidoAdmin({ auth, data: { cursoId: '../otro' } }), { code: 'invalid-argument' });
  await app.exports.eliminarContenidoAdmin({ auth, data: { cursoId: 'curso' } });
  assert.equal(app.eliminados[0], 'cursos/curso');
});