const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function cargar(perfil, respuestaGraph, documentos = {}) {
  const source = ts.transpileModule(fs.readFileSync('functions/src/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let llamadasGraph = 0;
  const eliminados = [];
  const escritos = [];
  const archivos = [];
  const referencia = (ruta) => ({ ruta, update: async (datos) => escritos.push({ ruta, datos }) });
  const consulta = (filtrar) => ({ where: (campo, operador, valor) => ({ get: async () => ({ docs: Object.entries(documentos).filter(([path, datos]) => filtrar(path) && datos[campo] === valor).map(([path, datos]) => ({ id: path.split('/').at(-1), ref: referencia(path), data: () => datos })) }) }) });
  const db = {
    recursiveDelete: async (referencia) => eliminados.push(referencia.ruta),
    doc: (ruta) => ({ ...referencia(ruta), get: async () => ({ exists: ruta.startsWith('intentos/') ? Boolean(documentos[ruta]) : ruta.endsWith('/inscripciones/curso') ? documentos.inscrito !== false : true, data: () => /^usuarios\/[^/]+$/.test(ruta) ? perfil : documentos[ruta] ?? {} }) }),
    collection: (ruta) => consulta(path => path.startsWith(ruta + '/') && !path.slice(ruta.length + 1).includes('/')),
    collectionGroup: (grupo) => consulta(path => path.split('/').at(-2) === grupo),
    runTransaction: async (handler) => handler({ get: (referencia) => referencia.get(), set: (referencia, datos) => escritos.push({ ruta: referencia.ruta, datos }), create: (referencia, datos) => escritos.push({ ruta: referencia.ruta, datos }) }),
  };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const modulos = {
    './subtitulos-videos.json': { default: require('../functions/src/subtitulos-videos.json') },
    'firebase-admin/app': { initializeApp() {} },
    'firebase-admin/storage': { getStorage: () => ({ bucket: () => ({ file: ruta => ({ delete: async () => archivos.push(ruta) }), deleteFiles: async ({ prefix }) => archivos.push(prefix) }) }) },
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
  return { exports, llamadas: () => llamadasGraph, eliminados, escritos, archivos };
}
const auth = { uid: 'admin', token: { email_verified: true } };

test('los once videos tienen WebVTT; el siete queda sin subtitulos', async () => {
  const textos = require('../functions/src/subtitulos-videos.json');
  assert.equal(Object.keys(textos).length, 11);
  for (const [nombre, texto] of Object.entries(textos)) {
    assert.ok(texto.startsWith('WEBVTT'));
    const documentos = documentosVideo();
    documentos['cursos/curso/clases/clase/contenidos/video'].ruta = `NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/${nombre}`;
    const app = cargar({ rol: 'alumno', estado: 'activo' }, { id: 'video', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentos);
    const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
    assert.equal(resultado.subtitulos, texto);
  }
  const documentos = documentosVideo();
  documentos['cursos/curso/clases/clase/contenidos/video'].ruta = 'NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/Pumpsim 03.mp4';
  const app = cargar({ rol: 'alumno', estado: 'activo' }, { id: 'video', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentos);
  assert.equal((await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } })).subtitulos, undefined);
});

test('el administrador obtiene los subtitulos automaticos en la previsualizacion', async () => {
  const app = cargar({ rol: 'admin', estado: 'activo' }, { id: 'video', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentosVideo());
  const resultado = await app.exports.previsualizarVideoMicrosoft({ auth, data: { cursoId: 'curso', ruta: 'NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/Vuma 02.mp4' } });
  assert.ok(resultado.subtitulos.startsWith('WEBVTT'));
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
  const app = cargar({ rol: 'admin', estado: 'activo' }, { value: [
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
    'cursos/curso/clases/clase': { publicado: true, orden: 0 },
    'cursos/curso/clases/clase/contenidos/video': { ruta: 'CURSOS/video.mp4', acceso: 'gratis', portadaKey },
  };
}
test('video devuelve solo el enlace: miniaturas se sirven por separado', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, (url) => url.endsWith('/thumbnails') ? { value: [{ large: { url: 'https://example.com/miniatura' } }] } : { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentosVideo('portadas-clases/curso/clase'));
  const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(resultado.url, 'https://example.com/video');
  assert.equal(resultado.miniatura, undefined);
});
test('miniatura inexistente no bloquea reproduccion ni acepta portada ajena', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, (url) => url.endsWith('/thumbnails') ? { value: [] } : { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentosVideo('portadas-clases/otro/clase'));
  const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(resultado.url, 'https://example.com/video');
  assert.equal(resultado.miniatura, undefined);
  assert.equal(resultado.portadaKey, undefined);
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
  const app = cargar({ rol: 'admin', estado: 'activo' }, { id: 'archivo', '@microsoft.graph.downloadUrl': 'https://example.com/video' });
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
test('borrar curso limpia relaciones y portadas conservando otros cursos', async () => {
  const documentos = {
    'cursos/curso': { publicado: true },
    'examenes/examen': { cursoId: 'curso' },
    'intentos/intento': { examenId: 'examen', cursoId: 'curso' },
    'intentos/huerfano': { examenId: 'borrado', cursoId: 'curso' },
    'usuarios/alumno/inscripciones/curso': { cursoId: 'curso' },
    'usuarios/alumno/progreso/clase': { cursoId: 'curso', claseId: 'clase' },
    'examenes/otro': { cursoId: 'otro' },
    'usuarios/alumno/progreso/otro': { cursoId: 'otro', claseId: 'clase' },
  };
  const app = cargar({ rol: 'admin', estado: 'activo' }, {}, documentos);
  await app.exports.eliminarContenidoAdmin({ auth, data: { cursoId: 'curso' } });
  for (const ruta of ['examenes/examen', 'intentos/intento', 'intentos/huerfano', 'usuarios/alumno/inscripciones/curso', 'usuarios/alumno/progreso/clase', 'cursos/curso']) assert.ok(app.eliminados.includes(ruta));
  assert.ok(!app.eliminados.includes('examenes/otro'));
  assert.ok(!app.eliminados.includes('usuarios/alumno/progreso/otro'));
  assert.deepEqual(app.archivos, ['portadas/curso', 'portadas-clases/curso/']);
  assert.equal(app.escritos[0].datos.publicado, false);
  assert.equal(app.llamadas(), 0);
});
function documentosSecuencia(completadas = []) {
  return {
    ...documentosVideo(),
    'cursos/curso/clases/segunda': { publicado: true, orden: 1 },
    'cursos/curso/clases/segunda/contenidos/video': { ruta: 'CURSOS/segunda.mp4', acceso: 'gratis' },
    'examenes/examen': { publicado: true, modo: 'manual', cursoId: 'curso', duracionMin: 30, preguntas: [{ id: 'p1' }] },
    ...Object.fromEntries(completadas.map((id) => [`usuarios/admin/progreso/curso_${id}`, { cursoId: 'curso', claseId: id, completado: true }])),
  };
}
test('segunda clase bloqueada no pide un enlace a Microsoft', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia());
  await assert.rejects(app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'segunda' } }), { code: 'failed-precondition' });
  assert.equal(app.llamadas(), 0);
});
test('primera clase puede completarse manualmente, segunda requiere primera', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia());
  await assert.rejects(app.exports.registrarClaseCompletada({ auth, data: { cursoId: 'curso', claseId: 'segunda', completado: true } }), { code: 'failed-precondition' });
  await app.exports.registrarClaseCompletada({ auth, data: { cursoId: 'curso', claseId: 'clase', completado: true } });
  assert.equal(app.escritos[0].datos.completado, true);
});
test('al completar primera se habilita segunda', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia(['clase']));
  await app.exports.registrarClaseCompletada({ auth, data: { cursoId: 'curso', claseId: 'segunda', completado: true } });
  assert.equal(app.escritos[0].ruta, 'usuarios/admin/progreso/curso_segunda');
});
test('no se puede desmarcar una clase con posteriores completadas', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia(['clase', 'segunda']));
  await assert.rejects(app.exports.registrarClaseCompletada({ auth, data: { cursoId: 'curso', claseId: 'clase', completado: false } }), { code: 'failed-precondition' });
  assert.equal(app.escritos.length, 0);
});
test('examen bloqueado hasta completar todas las clases publicadas', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia(['clase']));
  await assert.rejects(app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen' } }), { code: 'failed-precondition' });
  assert.equal(app.escritos.length, 0);
});
test('curso terminado permite examen; clases borrador no bloquean', async () => {
  const datos = documentosSecuencia(['clase', 'segunda']);
  datos['cursos/curso/clases/borrador'] = { publicado: false, orden: 2 };
  const app = cargar({ rol: 'alumno', estado: 'activo', nombre: 'Alumno', correo: 'alumno@ejemplo.com' }, {}, datos);
  await app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen' } });
  assert.equal(app.escritos[0].ruta, 'intentos/examen_admin');
  assert.equal(app.escritos[0].datos.inicio, 'fecha-simulada');
});
test('reanudar examen nunca reinicia el tiempo ni respuestas', async () => {
  const datos = documentosSecuencia(['clase', 'segunda']);
  datos['intentos/examen_admin'] = { estado: 'en_curso', inicio: 123, respuestas: { p1: 1 } };
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, datos);
  await app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen' } });
  assert.equal(app.escritos.length, 0);
});
test('no inscrito o suspendido no puede completar ni iniciar examen', async () => {
  for (const suspendido of [false, true]) {
    const datos = documentosSecuencia(['clase', 'segunda']);
    datos.inscrito = false;
    const app = cargar({ rol: 'alumno', estado: suspendido ? 'suspendido' : 'activo' }, {}, datos);
    const code = suspendido ? 'permission-denied' : 'failed-precondition';
    await assert.rejects(app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen' } }), { code });
    await assert.rejects(app.exports.registrarClaseCompletada({ auth, data: { cursoId: 'curso', claseId: 'clase', completado: true } }), { code });
  }
});

test('el tiempo del administrador se guarda al iniciar', async () => {
  for (const sinLimite of [false]) {
    const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia(['clase', 'segunda']));
    await app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen', sinLimite } });
    assert.equal(app.escritos[0].datos.duracionMin, 30);
  }
});
test('no se acepta una configuración de tiempo manipulada', async () => {
  const app = cargar({ rol: 'alumno', estado: 'activo' }, {}, documentosSecuencia(['clase', 'segunda']));
  await assert.rejects(app.exports.iniciarExamenAlumno({ auth, data: { examenId: 'examen', sinLimite: true } }), { code: 'invalid-argument' });
  assert.equal(app.escritos.length, 0);
});
test('subtítulos y transcripción solo acompañan el video autorizado', async () => {
  const documentos = documentosSecuencia(['clase']);
  documentos['cursos/curso/clases/clase/accesibilidad/texto'] = { subtitulos: 'WEBVTT', transcripcion: 'Contenido protegido' };
  const app = cargar({ rol: 'alumno', estado: 'activo' }, { id: 'video', '@microsoft.graph.downloadUrl': 'https://example.com/video' }, documentos);
  const resultado = await app.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } });
  assert.equal(resultado.subtitulos, 'WEBVTT');
  assert.equal(resultado.transcripcion, 'Contenido protegido');
  const sinInscripcion = cargar({ rol: 'alumno', estado: 'activo' }, {}, { ...documentos, inscrito: false });
  await assert.rejects(sinInscripcion.exports.obtenerVideo({ auth, data: { cursoId: 'curso', claseId: 'clase' } }), { code: 'failed-precondition' });
  assert.equal(sinInscripcion.llamadas(), 0);
});
