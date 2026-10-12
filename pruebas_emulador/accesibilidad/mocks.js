export const curso = { id: 'curso', nombre: 'Ventilación', descripcion: 'Curso de ventilación minera.', categoriaId: 'categoria', nivel: 'basico', publicado: true, acceso: 'gratis', creadoEn: Date.now() };
export const examen = { id: 'examen', cursoId: 'curso', nombre: 'Evaluación final', descripcion: 'Responde las preguntas.', publicado: true, modo: 'manual', duracionMin: 10, notaMinima: 16, herramientas: true, preguntas: [{ id: 'p1', enunciado: '¿Qué permite renovar el aire?', tipo: 'opcion', opciones: ['Ventilación', 'Iluminación'], puntos: 1 }, { id: 'p2', enunciado: 'Explica tu respuesta.', tipo: 'abierta', opciones: [], puntos: 1 }] };
const usuario = { uid: 'alumno', emailVerified: true, email: 'alumno@prueba.com', providerData: [], metadata: { creationTime: new Date().toISOString() } };
const perfil = { nombre: 'Alumno Prueba', rol: 'alumno', plan: 'gratis' };
export function useSesion() { return new URLSearchParams(location.search).get('vista') === 'acceso' ? { usuario: null, perfil: null, cargando: false } : { usuario, perfil, cargando: false }; }
export const MARCA_SESION = 'noova-sesion-prueba';
export default function Provider({ children }) { return children; }
export const NOTA_MAXIMA = 20;
let intento = null;
let escuchar;
export function escucharIntento(id, uid, callback) { escuchar = callback; callback(intento); return () => {}; }
export function escucharCurso(id, callback) { callback(curso); return () => {}; }
export function escucharExamen(id, callback) { callback(examen); return () => {}; }
export function escucharClases(id, publicadas, callback) { callback([{ id: 'clase', nombre: 'Introducción', descripcion: 'Conceptos básicos.', orden: 0, publicado: true }]); return () => {}; }
export function escucharProgreso(uid, callback) { callback([{ cursoId: 'curso', claseId: 'clase', completado: true }]); return () => {}; }
export async function iniciarIntento(datos) { intento = { id: 'examen_alumno', estado: 'en_curso', inicio: Date.now(), duracionMin: examen.duracionMin, respuestas: {} }; escuchar?.(intento); }
export async function guardarRespuestas(id, respuestas) { intento.respuestas = respuestas; }
export async function entregarIntento() { intento = { ...intento, estado: 'entregado', fin: Date.now() }; escuchar?.(intento); }
export function vencimientoIntento(datos, actual) { const minutos = actual.duracionMin ?? datos.duracionMin; return minutos ? actual.inicio + minutos * 60000 : null; }
export async function leerClaves() { return {}; }
export async function guardarExamen() {}
export function validarNombre() { return ''; }
export const auth = {};
export class GoogleAuthProvider {}
export async function createUserWithEmailAndPassword() { throw new Error('Autenticación simulada'); }
export async function sendEmailVerification() {}
export async function sendPasswordResetEmail() {}
export async function signInWithEmailAndPassword() { throw new Error('Autenticación simulada'); }
export async function signInWithPopup() { throw new Error('Autenticación simulada'); }
export async function updateProfile() {}
export async function signOut() {}
export function escucharCursos(publicados, callback) { callback([curso]); return () => {}; }
export function escucharCategorias(activas, callback) { callback([{ id: 'categoria', nombre: 'Ventilación', activa: true }]); return () => {}; }
export function escucharInscripciones(uid, callback) { callback(['curso']); return () => {}; }
export function escucharIntentos(estado, callback) { callback([]); return () => {}; }
export function escucharIntentosAlumno(uid, callback) { callback([]); return () => {}; }
export function escucharExamenes(publicados, callback) { callback([examen]); return () => {}; }
export function escucharExamenesDeCurso(id, callback) { callback([examen]); return () => {}; }
export function escucharAlumnos(callback) { callback([{ id: 'alumno', nombre: 'Alumno Prueba', correo: 'alumno@prueba.com', plan: 'gratis', estado: 'activo', creadoEn: Date.now() }]); return () => {}; }
export function estadoExamen() { return { texto: 'Pendiente', accion: 'Rendir examen' }; }
export const nombresNivel = { basico: 'Básico' };
export async function contarClasesPublicadas() { return 1; }
export async function contarDocumentos() { return 1; }
export async function listarInscritos() { return []; }
export async function eliminarCurso() {}
export async function crearCategoria() {}
export async function actualizarCategoria() {}
export async function eliminarCategoria() {}
export async function crearCurso() {}
export async function actualizarCurso() {}
export async function subirPortadaCurso() {}
export async function obtenerPortadaCurso() { return ''; }
export async function inscribirse() {}
export async function cambiarEstado() {}
export async function cambiarPlan() {}
export async function actualizarFoto() {}
export async function actualizarNombre() {}
export function capitalizarNombre(nombre) { return nombre; }
export async function actualizarMiniaturaClase() { return null; }
export async function actualizarClase() {}
export async function crearClase() { return { id: 'nueva' }; }
export async function eliminarClase() {}
export async function guardarVideoClase() {}
export async function leerVideoClase() { return null; }
export async function listarVideosMicrosoft() { return { elementos: [], siguiente: null }; }
export async function previsualizarVideoMicrosoft() { return ''; }
export async function rutasVideosUsados() { return []; }
